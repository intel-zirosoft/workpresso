import { NextResponse } from 'next/server';
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

const DUMMY_KNOWLEDGE = [
  {
    title: "WorkPresso 휴가 규정",
    content: "WorkPresso 임직원은 연간 15일의 유급 휴가를 가집니다. 휴가 신청은 최소 1주일 전에 시스템을 통해 승인받아야 합니다.",
    source_type: "DOCUMENTS"
  },
  {
    title: "회의 진행 가이드라인",
    content: "모든 회의는 아젠다가 있어야 하며, 종료 후 24시간 이내에 회의록이 작성되어야 합니다. Pod D의 음성 녹음 기능을 활용하면 편리합니다.",
    source_type: "MEETING_LOGS"
  },
  {
    title: "프로젝트 제피르(Zephyr) 개요",
    content: "프로젝트 제피르는 멀티 에이전트 협업 시스템을 구축하는 차세대 AI 프로젝트입니다. 현재 Pod-C에서 주도하고 있습니다.",
    source_type: "DOCUMENTS"
  }
];

export async function GET() {
  try {
    // 1. 테스트 유저 생성
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: '00000000-0000-0000-0000-000000000000',
        name: '테스트 관리자',
        department: '운영팀',
        status: 'ACTIVE'
      });

    if (userError) throw userError;

    // 2. 지식 데이터 벡터화 및 저장
    const results = [];
    for (const item of DUMMY_KNOWLEDGE) {
      // 임베딩 생성
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: item.content,
      });
      const [{ embedding }] = embeddingResponse.data;

      // DB 저장
      const { data, error } = await supabase
        .from('knowledge_vectors')
        .insert({
          source_type: item.source_type,
          source_id: '00000000-0000-0000-0000-000000000000', // 임시 ID
          embedding,
          metadata: {
            title: item.title,
            content: item.content
          }
        })
        .select();

      if (error) throw error;
      results.push(data[0]);
    }

    return NextResponse.json({
      message: "Seed data created successfully!",
      user: "Created/Verified",
      knowledge_count: results.length
    });
  } catch (error: any) {
    console.error('Seed Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
