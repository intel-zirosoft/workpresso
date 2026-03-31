import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 테스트 파일 위치 및 패턴 지정 (오류 방지 핵심!)
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  
  /* 전역 타임아웃 */
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  
  /* 병렬 실행 설정 */
  fullyParallel: true,
  
  /* 실패 시 재시도 */
  retries: process.env.CI ? 2 : 0,
  
  /* 리포트 형식 */
  reporter: 'html',
  
  use: {
    /* 베이스 URL */
    baseURL: 'http://localhost:3000',
    
    /* 실패 시 스크린샷 저장 */
    screenshot: 'only-on-failure',
    
    /* 추적 로그 저장 */
    trace: 'on-first-retry',
  },

  /* 브라우저 설정 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
