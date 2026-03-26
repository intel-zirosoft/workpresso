import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'edge';

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_schedule',
      description: '사용자의 새로운 업무 일정을 등록합니다.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '일정 제목' },
          start_time: { type: 'string', description: '시작 시간 (ISO 8601)' },
          end_time: { type: 'string', description: '종료 시간 (ISO 8601)' },
        },
        required: ['title', 'start_time', 'end_time'],
      },
    },
  },
];

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || '';

    // 1. RAG 지식 검색 (임베딩 및 RPC 호출)
    let contextText = '관련 지식 없음';
    try {
      if (lastMessage.trim()) {
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: lastMessage,
        });
        const [{ embedding }] = embeddingResponse.data;

        const { data: documents } = await supabase.rpc('match_knowledge', {
          query_embedding: embedding,
          match_threshold: 0.1, // 점수를 대폭 낮춰서 관련 내용을 무조건 가져오게 함
          match_count: 5,        // 더 많은 문맥을 참조
        });
        if (documents && documents.length > 0) {
          contextText = documents
            .map((doc: any) => `[Source: ${doc.source_type}] ${doc.metadata?.content || doc.metadata?.title || ''}`)
            .join('\n\n');
        }
      }
    } catch (e) {
      console.error('RAG Error (Non-critical):', e);
    }

    const now = new Date();
    const currentTimeStr = now.toISOString().replace('T', ' ').substring(0, 19);

    // 2. OpenAI 채팅 요청
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        {
          role: 'system',
          content: `당신은 워크프레소(WorkPresso)의 업무 비서입니다. 
          현재 시간(KST): ${currentTimeStr}
          
          [지침]
          1. 제공된 [내부 지식]을 최우선으로 참고하여 답변하세요.
          2. 일정을 등록할 때는 'create_schedule' 도구를 사용하세요.
          3. 한국어로 친절하고 전문적으로 답변하세요.
          
          [내부 지식]
          ${contextText}`,
        },
        ...messages,
      ],
      tools,
    });

    // 3. 스트림 생성 및 Tool 호출 처리
    const stream = OpenAIStream(response, {
      experimental_onToolCall: async (call, appendToolCallMessage) => {
        const toolResults = [];
        
        for (const toolCall of call.tools) {
          if (toolCall.func.name === 'create_schedule') {
            try {
              const args = toolCall.func.arguments as { title: string; start_time: string; end_time: string };
              
              const { error } = await supabase
                .from('schedules')
                .insert([{ 
                  title: args.title, 
                  start_time: args.start_time, 
                  end_time: args.end_time,
                  user_id: '00000000-0000-0000-0000-000000000000' // 임시 유저 ID
                }]);

              const output = error 
                ? `일정 등록 중 DB 오류 발생: ${error.message}` 
                : `일정이 성공적으로 등록되었습니다: ${args.title} (${args.start_time})`;

              toolResults.push(appendToolCallMessage({
                tool_call_id: toolCall.id,
                function_name: 'create_schedule',
                tool_output: output,
              }));
            } catch (err: any) {
              toolResults.push(appendToolCallMessage({
                tool_call_id: toolCall.id,
                function_name: 'create_schedule',
                tool_output: `일정 등록 중 예외 발생: ${err.message}`,
              }));
            }
          }
        }
        
        return Promise.all(toolResults);
      },
    });
    
    // 스트리밍 응답 반환
    return new StreamingTextResponse(stream);

  } catch (error: any) {
    console.error('Chat API Fatal Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
