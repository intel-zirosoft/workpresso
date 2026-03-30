import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createEmbedding } from '@/lib/ai/embeddings';

// .env.local 환경 변수 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const KB_DIR = path.resolve(process.cwd(), 'src/features/pod-c/knowledge-base');

async function syncKnowledge() {
  console.log('🚀 지식 베이스 동기화 시작...');

  try {
    if (!fs.existsSync(KB_DIR)) {
      throw new Error(`디렉토리를 찾을 수 없습니다: ${KB_DIR}`);
    }

    const files = fs.readdirSync(KB_DIR).filter(f => f.endsWith('.md'));
    console.log(`📂 발견된 파일: ${files.length}개 (${files.join(', ')})`);

    for (const fileName of files) {
      const filePath = path.join(KB_DIR, fileName);
      const content = fs.readFileSync(filePath, 'utf-8');

      console.log(`\n📄 [${fileName}] 처리 중...`);

      const { embedding } = await createEmbedding(content);

      // 2. DB 동기화 (Upsert)
      // 실제 운영 환경에서는 metadata.title 등을 고유 키로 사용하는 RPC를 만들거나 
      // 아래와 같이 특정 조건으로 upsert를 수행합니다.
      const { data, error } = await supabase
        .from('knowledge_vectors')
        .upsert({
          source_type: 'DOCUMENTS',
          source_id: '00000000-0000-0000-0000-000000000000',
          embedding,
          metadata: {
            title: fileName,
            content: content,
            is_official: true,
            updated_at: new Date().toISOString()
          }
        }, { onConflict: 'id' }) // 여기서는 새 ID로 들어가거나 정책에 따라 처리됩니다.
        .select();

      if (error) throw error;
      console.log(`✅ [${fileName}] 동기화 완료!`);
    }

    console.log('\n✨ 모든 지식 베이스가 성공적으로 업데이트되었습니다.');
  } catch (error: any) {
    console.error('\n❌ 동기화 실패:', error.message);
    process.exit(1);
  }
}

syncKnowledge();
