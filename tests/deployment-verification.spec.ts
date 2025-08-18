import { test, expect } from '@playwright/test';

test.describe('배포 검증 테스트', () => {
  const baseUrl = 'https://mas-1hnprbcrn-taksoo-kims-projects.vercel.app';

  test('관리자 페이지 로그인 화면이 정상적으로 표시되는지 확인', async ({ page }) => {
    await page.goto(`${baseUrl}/admin`);
    
    // 로그인 폼이 표시되는지 확인
    await expect(page.locator('h1:has-text("MASGOLF Admin")')).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("로그인")')).toBeVisible();
  });

  test('8월 퍼널 A 파일이 정상적으로 접근 가능한지 확인', async ({ page }) => {
    await page.goto(`${baseUrl}/versions/funnel-2025-08-live-a.html`);
    
    // 페이지가 정상적으로 로드되는지 확인
    await expect(page.locator('title:has-text("MASGOLF")')).toBeVisible();
    await expect(page.locator('meta[name="file-created"]')).toBeVisible();
  });

  test('8월 퍼널 B 파일이 정상적으로 접근 가능한지 확인', async ({ page }) => {
    await page.goto(`${baseUrl}/versions/funnel-2025-08-live-b.html`);
    
    // 페이지가 정상적으로 로드되는지 확인
    await expect(page.locator('title:has-text("MASGOLF")')).toBeVisible();
    await expect(page.locator('meta[name="file-created"]')).toBeVisible();
  });

  test('API 엔드포인트들이 정상적으로 응답하는지 확인', async ({ page }) => {
    // 퍼널 관리 API
    const funnelResponse = await page.request.get(`${baseUrl}/api/funnel-management`);
    expect(funnelResponse.status()).toBe(200);
    
    // GA4 사용자 행동 API
    const userBehaviorResponse = await page.request.get(`${baseUrl}/api/ga4-user-behavior`);
    expect(userBehaviorResponse.status()).toBe(200);
    
    // 성능 메트릭 API
    const performanceResponse = await page.request.get(`${baseUrl}/api/performance-metrics`);
    expect(performanceResponse.status()).toBe(200);
  });

  test('퍼널 관리 API가 8월 퍼널 파일들을 정확히 반환하는지 확인', async ({ page }) => {
    const response = await page.request.get(`${baseUrl}/api/funnel-management`);
    const data = await response.json();
    
    // 8월 퍼널이 있는지 확인
    expect(data.data.groupedFunnels).toHaveProperty('2025-08');
    
    const augustFunnels = data.data.groupedFunnels['2025-08'];
    expect(augustFunnels.length).toBeGreaterThan(0);
    
    // live-a와 live-b 파일이 있는지 확인
    const hasLiveA = augustFunnels.some((funnel: any) => funnel.name.includes('live-a'));
    const hasLiveB = augustFunnels.some((funnel: any) => funnel.name.includes('live-b'));
    
    expect(hasLiveA).toBe(true);
    expect(hasLiveB).toBe(true);
  });

  test('GA4 사용자 행동 API가 올바른 데이터 구조를 반환하는지 확인', async ({ page }) => {
    const response = await page.request.get(`${baseUrl}/api/ga4-user-behavior`);
    const data = await response.json();
    
    // 필수 필드들이 있는지 확인
    expect(data).toHaveProperty('sessionMetrics');
    expect(data).toHaveProperty('devicePerformance');
    expect(data).toHaveProperty('hourlyPerformance');
    expect(data).toHaveProperty('eventAnalysis');
    expect(data).toHaveProperty('status');
    
    // 시간대별 성능 데이터가 24시간 모두 있는지 확인
    expect(data.hourlyPerformance).toHaveLength(24);
    
    // 이벤트 분석 데이터가 있는지 확인
    expect(data.eventAnalysis.length).toBeGreaterThan(0);
  });

  test('성능 메트릭 API가 올바른 데이터 구조를 반환하는지 확인', async ({ page }) => {
    const response = await page.request.get(`${baseUrl}/api/performance-metrics`);
    const data = await response.json();
    
    // 필수 필드들이 있는지 확인
    expect(data).toHaveProperty('pagePerformance');
    expect(data).toHaveProperty('devicePerformance');
    expect(data).toHaveProperty('hourlyPerformance');
    expect(data).toHaveProperty('overallMetrics');
    expect(data).toHaveProperty('abTestPerformance');
    expect(data).toHaveProperty('status');
    
    // A/B 테스트 성능 데이터가 있는지 확인
    expect(data.abTestPerformance).toHaveProperty('versionA');
    expect(data.abTestPerformance).toHaveProperty('versionB');
  });
});
