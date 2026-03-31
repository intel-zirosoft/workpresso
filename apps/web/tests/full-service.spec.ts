import { test, expect } from '@playwright/test';

test.describe('WorkPresso 전체 서비스 통합 테스트', () => {
  
  test('1. 로그인 및 AI 업무 비서 채팅 테스트', async ({ page }) => {
    // 1. 로그인 단계
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'workpresso123!');
    await page.click('button:has-text("로그인")');
    
    // 메인 페이지 이동 대기 및 확인
    await page.waitForURL('**/');
    const logoutBtn = page.locator('button[title="로그아웃"]');
    await expect(logoutBtn).toBeVisible({ timeout: 10000 });

    // 2. 채팅 페이지 이동
    await page.goto('/chat');
    
    // 입력창 존재 확인
    const input = page.locator('input[placeholder*="질문을 작성하세요"], input[placeholder*="무엇이든 물어보세요"]');
    await expect(input).toBeVisible();

    // 3. 메시지 전송 및 답변 확인
    const testMessage = '안녕, WorkPresso에 대해 알려줘';
    await input.fill(testMessage);
    await page.keyboard.press('Enter');

    // AI 답변 영역 대기 (로딩 스피너가 사라지고 답변이 나타나는지 확인)
    // .prose 클래스를 포함한 요소가 나타날 때까지 대기
    const botResponse = page.locator('.prose');
    await expect(botResponse.first()).toBeVisible({ timeout: 15000 });
    
    const content = await botResponse.first().textContent();
    console.log('🤖 AI 답변 내용:', content);
    expect(content?.length).toBeGreaterThan(0);
  });

  test('2. 반응형 모바일 UI 체크', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    
    // 모바일에서 사이드바 숨김 확인
    const sidebar = page.locator('aside');
    const isVisible = await sidebar.isVisible();
    expect(isVisible).toBeFalsy();
    
    // 햄버거 메뉴 존재 확인
    const menuBtn = page.locator('header button >> svg.lucide-menu');
    await expect(menuBtn).toBeVisible();
  });

});
