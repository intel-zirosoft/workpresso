import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create a Supabase client for Edge Runtime
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'edge';

// 1. Define tools (Function Calling)
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_schedule',
      description: '사용자의 새로운 업무 일정을 등록합니다.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: '일정의 제목 (예: 주간 회의, 프로젝트 리뷰)',
          },
          start_time: {
            type: 'string',
            description: '일정 시작 시간 (ISO 8601 형식, 예: 2024-03-25T14:00:00Z)',
          },
          end_time: {
            type: 'string',
            description: '일정 종료 시간 (ISO 8601 형식, 예: 2024-03-25T15:00:00Z)',
          },
        },
        required: ['title', 'start_time', 'end_time'],
      },
    },
  },
];

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // RAG: Generate embedding for the user's question
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: lastMessage,
    });
    const [{ embedding }] = embeddingResponse.data;

    // RAG: Search for relevant knowledge
    const { data: documents } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: 3,
    });

    const contextText = documents
      ?.map((doc: any) => `[Source: ${doc.source_type}] ${doc.metadata?.content || doc.metadata?.title || ''}`)
      .join('\n\n') || '관련 지식 없음';

    // AI Completion with Tools
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        {
          role: 'system',
          content: `당신은 워크프레소(WorkPresso)의 업무 비서입니다. 
          현재 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
          
          [지침]
          1. 제공된 [내부 지식]을 최우선으로 참고하여 답변하세요.
          2. 사용자가 일정을 등록해달라고 하면 'create_schedule' 도구를 사용하여 일정을 추가하세요.
          3. 시간 정보를 처리할 때는 항상 현재 시간을 기준으로 ISO 8601 형식을 생성하세요.
          4. 답변은 한국어로 친절하고 전문적으로 작성하세요.`,
        },
        ...messages,
      ],
      tools,
    });

    // OpenAIStream handles the complexity of tool calls and streaming
    const stream = OpenAIStream(response, {
      experimental_onToolCall: async (call, appendToolCallMessage) => {
        if (call.tools[0].func.name === 'create_schedule') {
          const { title, start_time, end_time } = call.tools[0].func.arguments as any;
          
          // 2. Perform actual database operation
          const { data, error } = await supabase
            .from('schedules')
            .insert([{ 
              title, 
              start_time, 
              end_time,
              user_id: '00000000-0000-0000-0000-000000000000' // 실제 구현시 유저 ID 연동 필요
            }])
            .select();

          if (error) {
            console.error('Schedule Insert Error:', error);
            return appendToolCallMessage({
              tool_call_id: call.tools[0].id,
              function_name: 'create_schedule',
              tool_output: `에러 발생: ${error.message}`,
            });
          }

          return appendToolCallMessage({
            tool_call_id: call.tools[0].id,
            function_name: 'create_schedule',
            tool_output: `일정이 성공적으로 등록되었습니다: ${title} (${start_time} ~ ${end_time})`,
          });
        }
      },
    });
    
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate response' }), {
      status: 500,
    });
  }
}
