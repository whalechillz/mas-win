import { test, expect } from '@playwright/test';

test.describe('새로운 관리자 페이지 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 관리자 페이지로 이동
    await page.goto('/admin-new');
  });

  test('로그인 페이지 표시 확인', async ({ page }) => {
    // 로그인 폼이 표시되는지 확인
    await expect(page.locator('h1:has-text("MASGOLF Admin")')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("로그인")')).toBeVisible();
  });

  test('로그인 성공', async ({ page }) => {
    // 로그인 정보 입력
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    
    // 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');
    
    // 로그인 후 대시보드가 표시되는지 확인
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.page-title:has-text("대시보드")')).toBeVisible();
  });

  test('사이드바 네비게이션', async ({ page }) => {
    // 먼저 로그인
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("로그인")');
    
    // 각 탭 클릭 및 확인
    const tabs = [
      { id: 'dashboard', label: '대시보드' },
      { id: 'analytics', label: '분석 허브' },
      { id: 'funnels', label: '퍼널 관리' },
      { id: 'campaigns', label: '캠페인 관리' },
      { id: 'bookings', label: '예약 관리' },
      { id: 'content', label: '콘텐츠 허브' },
      { id: 'team', label: '팀 워크스페이스' }
    ];

    for (const tab of tabs) {
      await page.click(`.nav-item:has-text("${tab.label}")`);
      await expect(page.locator(`.page-title:has-text("${tab.label}")`)).toBeVisible();
    }
  });

  test('테마 전환', async ({ page }) => {
    // 먼저 로그인
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("로그인")');
    
    // 다크 테마 토글
    await page.click('.theme-toggle');
    
    // 다크 테마 클래스가 적용되는지 확인
    await expect(page.locator('.admin-modern.dark')).toBeVisible();
    
    // 다시 라이트 테마로 전환
    await page.click('.theme-toggle');
    await expect(page.locator('.admin-modern.light')).toBeVisible();
  });

  test('사이드바 토글', async ({ page }) => {
    // 먼저 로그인
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("로그인")');
    
    // 사이드바 접기
    await page.click('.sidebar-toggle');
    await expect(page.locator('.admin-modern.sidebar-collapsed')).toBeVisible();
    
    // 사이드바 펼치기
    await page.click('.sidebar-toggle');
    await expect(page.locator('.admin-modern:not(.sidebar-collapsed)')).toBeVisible();
  });

  test('대시보드 기능', async ({ page }) => {
    // 먼저 로그인
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("로그인")');
    
    // 대시보드 요소들 확인
    await expect(page.locator('text=실시간 대시보드')).toBeVisible();
    await expect(page.locator('text=실시간 사용자')).toBeVisible();
    await expect(page.locator('text=페이지뷰')).toBeVisible();
    await expect(page.locator('text=전환율')).toBeVisible();
    await expect(page.locator('text=수익')).toBeVisible();
  });

  test('로그아웃', async ({ page }) => {
    // 먼저 로그인
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("로그인")');
    
    // 로그아웃 버튼 클릭
    await page.click('.logout-btn');
    
    // 로그인 페이지로 돌아가는지 확인
    await expect(page.locator('h1:has-text("MASGOLF Admin")')).toBeVisible();
  });

  test('반응형 디자인', async ({ page }) => {
    // 먼저 로그인
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("로그인")');
    
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 모바일에서 사이드바가 숨겨지는지 확인
    await expect(page.locator('.sidebar')).toHaveCSS('transform', /translateX\(-100%\)/);
    
    // 데스크톱 뷰포트로 복원
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('.sidebar')).toBeVisible();
  });

  test('접근성 테스트', async ({ page }) => {
    // 먼저 로그인
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("로그인")');
    
    // 키보드 네비게이션 테스트
    await page.keyboard.press('Tab');
    await expect(page.locator('.nav-item.active')).toBeVisible();
    
    // 포커스 스타일 확인
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveCSS('outline', /2px solid/);
  });
});
