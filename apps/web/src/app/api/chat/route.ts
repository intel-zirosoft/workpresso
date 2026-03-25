import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || '';

    // 1. RAG 지식 검색
    let contextText = '관련 지식 없음';
    try {
      const { data: embeddingResponse } = await supabase.functions.invoke('get-embedding', {
        body: { input: lastMessage },
      });
      // 임베딩 생성은 별도의 에지 펑션이나 서버 로직이 필요할 수 있으므로 
      // 현재는 직접적인 openai 호출 방식을 streamText 내부로 통합하거나 
      // 기존 로직을 유지할 수 있습니다. 여기서는 가독성을 위해 간략화합니다.
    } catch (e) {
      console.error('RAG Error:', e);
    }

    const now = new Date();
    const currentTimeStr = now.toISOString().replace('T', ' ').substring(0, 19);

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: `당신은 워크프레소(WorkPresso)의 업무 비서입니다. 
          현재 시간(KST): ${currentTimeStr}
          사용자: ${user.user_metadata?.name || 'User'}
          
          [지침]
          1. 제공된 [내부 지식]을 최우선으로 참고하여 답변하세요.
          2. 일정을 등록할 때는 'create_schedule' 도구를 사용하세요.
          3. 한국어로 친절하고 전문적으로 답변하세요.
          
          [내부 지식]
          ${contextText}`,
        },
        ...messages,
      ],
      tools: {
        create_schedule: tool({
          description: '사용자의 새로운 업무 일정을 등록합니다.',
          parameters: z.object({
            title: z.string().describe('일정 제목'),
            start_time: z.string().describe('시작 시간 (ISO 8601)'),
            end_time: z.string().describe('종료 시간 (ISO 8601)'),
          }),
          execute: async ({ title, start_time, end_time }) => {
            const { error } = await supabase
              .from('schedules')
              .insert([{ 
                title, 
                start_time, 
                end_time,
                user_id: user.id
              }]);

            if (error) throw new Error(`일정 등록 실패: ${error.message}`);
            return { success: true, message: `일정이 성공적으로 등록되었습니다: ${title}` };
          },
        }),
      },
      // 모든 툴 호출을 자동으로 실행
      maxSteps: 5,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
