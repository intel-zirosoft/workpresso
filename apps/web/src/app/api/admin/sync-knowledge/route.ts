import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { createEmbedding } from '@/lib/ai/embeddings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Node.js 런타임 사용 (파일 시스템 접근 필요)
export const runtime = 'nodejs';

export async function POST() {
  try {
    const kbPath = path.join(process.cwd(), 'src/features/pod-c/knowledge-base');
    const files = fs.readdirSync(kbPath).filter(f => f.endsWith('.md'));
    
    const results = [];

    for (const fileName of files) {
      const content = fs.readFileSync(path.join(kbPath, fileName), 'utf-8');
      
      const { embedding } = await createEmbedding(content);

      // DB에 동기화 (Upsert: 파일명 기준 중복 방지)
      const { data, error } = await supabase
        .from('knowledge_vectors')
        .upsert({
          id: undefined, // 새로 생성하거나 덮어씀
          source_type: 'DOCUMENTS',
          source_id: '00000000-0000-0000-0000-000000000000', // 시스템 관리자 ID
          embedding,
          metadata: {
            title: fileName,
            content: content,
            is_official: true,
            updated_at: new Date().toISOString()
          }
        }, { onConflict: 'id' }) // 실제 운영시엔 고유 식별자(id) 기준 upsert 로직 정교화 필요
        .select();

      if (error) throw error;
      results.push(data[0]);
    }

    return NextResponse.json({
      success: true,
      synced_files: files,
      count: results.length
    });
  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } 
}
