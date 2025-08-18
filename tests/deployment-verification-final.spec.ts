import { test, expect } from '@playwright/test';

test.describe('배포 후 최종 검증', () => {
  test('새로운 홈페이지가 정상적으로 로드되는지 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/MASGOLF/);
    
    // 메인 헤더 확인
    await expect(page.locator('text=MASGOLF Summer Campaign')).toBeVisible();
    await expect(page.locator('text=시니어 골퍼를 위한 특별한 선택')).toBeVisible();
    
    // MASGOLF 로고 확인
    await expect(page.locator('text=MASGOLF').first()).toBeVisible();
    
    // 8월 퍼널 링크 확인
    await expect(page.locator('a[href="/25-08"]').first()).toBeVisible();
  });

  test('8월 퍼널이 정상적으로 작동하는지 확인', async ({ page }) => {
    await page.goto('https://win.masgolf.co.kr/');
    
    // 자동으로 /25-08로 리다이렉트되는지 확인
    await expect(page).toHaveURL(/.*\/25-08/);
    
    // 퍼널 페이지 제목 확인
    await expect(page.locator('title')).toContainText('MAS Golf 8월 퍼널');
    
    // iframe이 로드되는지 확인
    const iframe = page.frameLocator('iframe');
    await expect(iframe.locator('body')).toBeVisible();
  });

  test('관리자 페이지 로그인이 정상적으로 작동하는지 확인', async ({ page }) => {
    await page.goto('https://win.masgolf.co.kr/admin');
    
    // 로그인 폼 확인
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // 로그인 시도
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("로그인")');
    
    // 로그인 성공 후 대시보드 확인
    await expect(page.locator('text=퍼널 관리')).toBeVisible();
    await expect(page.locator('text=실시간 A/B 테스트 성능 비교')).toBeVisible();
  });

  test('관리자 페이지 퍼널 관리 탭이 정상적으로 작동하는지 확인', async ({ page }) => {
    await page.goto('https://win.masgolf.co.kr/admin');
    
    // 로그인
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("로그인")');
    
    // 퍼널 관리 탭 클릭
    await page.click('text=퍼널 관리');
    
    // 2025-08 탭 확인
    await expect(page.locator('text=2025-08')).toBeVisible();
    
    // 퍼널 목록 확인
    await expect(page.locator('text=funnel-2025-08-live-a.html')).toBeVisible();
    await expect(page.locator('text=funnel-2025-08-live-b.html')).toBeVisible();
  });

  test('관리자 페이지 GA4 데이터가 정상적으로 로드되는지 확인', async ({ page }) => {
    await page.goto('https://win.masgolf.co.kr/admin');
    
    // 로그인
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("로그인")');
    
    // 퍼널 관리 탭 클릭
    await page.click('text=퍼널 관리');
    
    // 2025-08 탭 클릭
    await page.click('text=2025-08');
    
    // GA4 데이터 섹션들이 로드되는지 확인
    await expect(page.locator('text=실시간 A/B 테스트 성능 비교')).toBeVisible();
    await expect(page.locator('text=고급 사용자 행동 분석')).toBeVisible();
    await expect(page.locator('text=페이지 성능')).toBeVisible();
    await expect(page.locator('text=시간대별 성능')).toBeVisible();
  });

  test('로컬 서버도 정상적으로 작동하는지 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // 새로운 홈페이지 확인
    await expect(page.locator('text=MASGOLF Summer Campaign')).toBeVisible();
    await expect(page.locator('text=시니어 골퍼를 위한 특별한 선택')).toBeVisible();
  });

  test('로컬 8월 퍼널도 정상적으로 작동하는지 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/25-08');
    
    // 퍼널 페이지 확인
    await expect(page).toHaveTitle(/MAS Golf 8월 퍼널/);
    
    // iframe 확인
    const iframe = page.frameLocator('iframe');
    await expect(iframe.locator('body')).toBeVisible();
  });

  test('로컬 관리자 페이지도 정상적으로 작동하는지 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    
    // 로그인 폼 확인
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('h1:has-text("MASGOLF Admin")')).toBeVisible();
    
    // 로그인
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("로그인")');
    
    // 로그인 후 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // 로그인 성공 확인 (URL이 변경되었는지 또는 특정 요소가 표시되는지)
    await expect(page.locator('text=로그아웃')).toBeVisible();
  });

  test('API 엔드포인트들이 정상적으로 작동하는지 확인', async ({ page }) => {
    // 퍼널 관리 API
    const funnelResponse = await page.request.get('https://win.masgolf.co.kr/api/funnel-management');
    expect(funnelResponse.status()).toBe(200);
    
    // GA4 사용자 행동 API
    const behaviorResponse = await page.request.get('https://win.masgolf.co.kr/api/ga4-user-behavior');
    expect(behaviorResponse.status()).toBe(200);
    
    // 성능 메트릭 API
    const performanceResponse = await page.request.get('https://win.masgolf.co.kr/api/performance-metrics');
    expect(performanceResponse.status()).toBe(200);
  });
});
