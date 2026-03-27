import { streamText, embed, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createScheduleSchema = z.object({
  title: z.string().describe('일정 제목'),
  start_time: z.string().describe('시작 시간'),
  end_time: z.string().describe('종료 시간'),
});

type CreateScheduleArgs = z.infer<typeof createScheduleSchema>;

export async function POST(req: Request) {
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
    if (!authUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = authUser.id;
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || '';

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    let contextText = '관련 지식 없음';
    try {
      if (lastMessage.trim()) {
        const { embedding } = await embed({
          model: openai.embedding('text-embedding-3-small'),
          value: lastMessage,
        });
        const { data: documents } = await supabase.rpc('match_knowledge', {
          query_embedding: embedding,
          match_threshold: 0.1,
          match_count: 5,
        });
        if (documents) contextText = documents.map((doc: any) => doc.metadata?.content || '').join('\n\n');
      }
    } catch (e) { console.warn('RAG Skip'); }

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: `당신은 워크프레소의 업무 비서입니다. 한국어로 친절하게 답변하세요. 내부 지식: ${contextText}`,
      messages,
      tools: {
        create_schedule: tool({
          description: '일정 등록',
          parameters: createScheduleSchema,
          execute: async ({ title, start_time, end_time }: CreateScheduleArgs) => {
            const { error } = await supabase
              .from('schedules')
              .insert([{ title, start_time, end_time, user_id: userId }]);
            if (error) throw new Error(error.message);
            return `일정 '${title}' 등록 완료.`;
          },
        }),
      },
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error('Fatal Error:', error.message);
    return new Response(error.message, { status: 500 });
  }
}
