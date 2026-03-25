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

const REALISTIC_KNOWLEDGE = [
  {
    title: "IT 개발 컨벤션 및 브랜치 전략",
    content: "모든 개발은 Git Flow를 따르며, feat/, fix/, docs/ 브랜치를 사용합니다. PR은 Gemini AI 리뷰어의 승인이 필수입니다.",
    source_type: "DOCUMENTS"
  },
  {
    title: "근무 제도 및 코어 타임",
    content: "자율 출퇴근제를 운영하며 코어 타임은 오후 1시부터 5시까지입니다. 주 2회 리모트 근무가 가능합니다.",
    source_type: "DOCUMENTS"
  },
  {
    title: "보안 정책 및 환경 변수 관리",
    content: ".env 파일은 Git 커밋이 금지되며 시크릿은 GitHub Secrets에서 관리합니다. 외부망 접속 시 VPN 사용이 필수입니다.",
    source_type: "DOCUMENTS"
  },
  {
    title: "기술 스택 및 인프라",
    content: "프론트엔드는 Next.js 14, 백엔드는 Supabase, AI는 Vercel AI SDK와 pgvector를 사용합니다.",
    source_type: "DOCUMENTS"
  }
];

export async function GET() {
  try {
    // 1. 테스트 유저 생성/확인
    await supabase.from('users').upsert({
      id: '00000000-0000-0000-0000-000000000000',
      name: '시스템 관리자',
      department: '플랫폼실',
      status: 'ACTIVE'
    });

    // 2. 지식 데이터 벡터화 및 저장 (기존 데이터 중복 방지를 위해 삭제 후 삽입 권장하지만 여기선 추가만 진행)
    const results = [];
    for (const item of REALISTIC_KNOWLEDGE) {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: item.content,
      });
      const [{ embedding }] = embeddingResponse.data;

      const { data, error } = await supabase
        .from('knowledge_vectors')
        .insert({
          source_type: item.source_type,
          source_id: '00000000-0000-0000-0000-000000000000',
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
      message: "Realistic IT Company seed data created!",
      knowledge_count: results.length
    });
  } catch (error: any) {
    console.error('Seed Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
