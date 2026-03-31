import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Admin 권한(Service Role Key)으로 접속
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_USERS = [
  { email: 'admin@test.com', password: 'workpresso123!', name: '관리자', department: '운영팀' },
  { email: 'dev@test.com', password: 'workpresso123!', name: '개발자', department: '개발팀' },
  { email: 'design@test.com', password: 'workpresso123!', name: '디자이너', department: '디자인팀' },
  { email: 'plan@test.com', password: 'workpresso123!', name: '기획자', department: '기획팀' },
];

async function createTestUsers() {
  console.log('🚀 테스트 계정 생성 시작...');

  for (const user of TEST_USERS) {
    console.log(`\n👤 [${user.name}] 생성 중...`);

    // 1. Supabase Auth에 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.name, department: user.department }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`ℹ️ 이미 존재하는 계정입니다: ${user.email}`);
        // 기존 유저 ID 가져오기 위해 검색
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === user.email);
        if (existingUser) {
          // 2. users 테이블 정보 동기화 (Upsert)
          await supabase.from('users').upsert({
            id: existingUser.id,
            name: user.name,
            department: user.department,
            status: 'ACTIVE'
          });
          console.log(`✅ [${user.name}] 정보 업데이트 완료!`);
        }
      } else {
        console.error(`❌ 생성 실패: ${authError.message}`);
      }
      continue;
    }

    if (authData.user) {
      // 2. 실제 DB의 users 테이블에도 정보 삽입
      const { error: dbError } = await supabase.from('users').insert({
        id: authData.user.id,
        name: user.name,
        department: user.department,
        status: 'ACTIVE'
      });

      if (dbError) {
        console.error(`❌ DB 삽입 실패: ${dbError.message}`);
      } else {
        console.log(`✅ [${user.name}] 생성 성공!`);
      }
    }
  }

  console.log('\n✨ 모든 테스트 계정 작업이 완료되었습니다.');
}

createTestUsers();
