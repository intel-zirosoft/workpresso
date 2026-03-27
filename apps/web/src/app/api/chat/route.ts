import { streamText, embed, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Zod 스키마 타입을 명시적으로 추출
const createScheduleSchema = z.object({
  title: z.string().describe('일정 제목'),
  start_time: z.string().describe('시작 시간 (ISO 8601)'),
  end_time: z.string().describe('종료 시간 (ISO 8601)'),
});

export async function POST(req: Request) {
  console.log('--- AI API: Start with Real Auth ---');
  try {
    const cookieStore = cookies();
    
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set() {}, 
          remove() {},
        },
      }
    );

    const { data: { user: authUser } } = await authSupabase.auth.getUser();
    
    if (!authUser) {
      return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = authUser.id;
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || '';
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 2. RAG 지식 검색
    let contextText = '관련 지식 없음';
    try {
      if (lastMessage.trim()) {
        const { embedding } = await embed({
          model: openai.embedding('text-embedding-3-small') as any, // 타입 미스매치 해결
          value: lastMessage,
        });
        const { data: documents } = await supabase.rpc('match_knowledge', {
          query_embedding: embedding,
          match_threshold: 0.1,
          match_count: 5,
        });
        if (documents) contextText = documents.map((doc: any) => doc.metadata?.content || '').join('\n\n');
      }
    } catch (e) { console.warn('AI API: RAG Search Skip'); }

    // DB 작업을 위한 서비스 롤 클라이언트
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // 3. AI 스트리밍 실행
    const result = await streamText({
      model: openai('gpt-4o-mini') as any, // 타입 미스매치 해결
      system: `당신은 워크프레소의 업무 비서입니다. 한국어로 친절하게 답변하세요. 내부 지식: ${contextText}`,
      messages,
      tools: {
        create_schedule: tool({
          description: '사용자의 새로운 업무 일정을 등록합니다.',
          parameters: createScheduleSchema, // 추출된 스키마 사용
          execute: async ({ title, start_time, end_time }) => {
            console.log(`AI API: Executing create_schedule for user ${userId}`);
            const { error } = await supabase
              .from('schedules')
              .insert([{ title, start_time, end_time, user_id: userId }]);
            if (error) throw new Error(error.message);
            return `일정 '${title}' 등록을 완료했습니다.`;
          },
        }),
      },
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error('--- AI API: Fatal Error ---', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
