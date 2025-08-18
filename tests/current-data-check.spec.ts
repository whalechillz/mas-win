import { test, expect } from '@playwright/test';

test.describe('현재 가져올 수 있는 모든 데이터 확인', () => {
  test.beforeEach(async ({ page }) => {
    // 관리자 페이지로 이동
    await page.goto('/admin');
    
    // 로그인
    await page.fill('input[placeholder="관리자 아이디"]', 'admin');
    await page.fill('input[placeholder="비밀번호"]', '1234');
    await page.click('button:has-text("로그인")');
    
    // 로그인 완료 대기
    await expect(page.locator('h1:has-text("MASGOLF 관리자")')).toBeVisible();
  });

  test('GA4 실시간 데이터 확인', async ({ page }) => {
    // GA4 API 호출 모니터링
    const ga4Requests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('ga4-realtime')) {
        ga4Requests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });

    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // GA4 API 호출 확인
    console.log('GA4 API 호출:', ga4Requests);
    expect(ga4Requests.length).toBeGreaterThan(0);
    
    // 실제 데이터가 표시되는지 확인
    const pageViews = await page.locator('text=/[0-9]+/').first().textContent();
    expect(pageViews).toMatch(/[0-9]+/);
  });

  test('퍼널 파일 데이터 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 퍼널 파일 정보 확인
    await expect(page.locator('text=funnel-2025-08-live-a.html')).toBeVisible();
    await expect(page.locator('text=funnel-2025-08-live-b.html')).toBeVisible();
    
    // 파일 크기 확인 (실제 데이터: 201KB vs 62KB)
    await expect(page.locator('text=201.17 KB').or(page.locator('text=196.48 KB'))).toBeVisible();
    await expect(page.locator('text=62.75 KB').or(page.locator('text=61.28 KB'))).toBeVisible();
  });

  test('현재 사용 중인 모든 API 엔드포인트 확인', async ({ page }) => {
    // 모든 API 호출 모니터링
    const apiRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });

    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // API 호출 목록 출력
    console.log('사용 중인 API 엔드포인트:', apiRequests);
    
    // 최소한 2개의 API가 호출되어야 함 (funnel-management, ga4-realtime)
    expect(apiRequests.length).toBeGreaterThanOrEqual(2);
  });

  test('추가 GA4 데이터 확인', async ({ page }) => {
    // 추가 GA4 API들 확인
    const additionalAPIs = [
      '/api/ga4-daily',
      '/api/ga4-hourly', 
      '/api/ga4-monthly',
      '/api/ga4-campaign-metrics'
    ];
    
    for (const api of additionalAPIs) {
      try {
        const response = await page.request.get(`http://localhost:3000${api}`);
        console.log(`${api} 응답 상태:`, response.status());
        if (response.ok()) {
          const data = await response.json();
          console.log(`${api} 데이터 샘플:`, JSON.stringify(data).substring(0, 200) + '...');
        }
      } catch (error) {
        console.log(`${api} 접근 불가:`, error);
      }
    }
  });

  test('현재 누락된 데이터 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 현재 표시되는 데이터 확인
    const currentData = {
      pageViews: await page.locator('text=/[0-9]+/').first().textContent(),
      conversionRate: await page.locator('text=/[0-9]+\.[0-9]+%/').first().textContent(),
      fileSize: await page.locator('text=/[0-9]+\.[0-9]+ KB/').first().textContent()
    };
    
    console.log('현재 표시되는 데이터:', currentData);
    
    // 누락될 수 있는 데이터들
    const missingData = [
      '세션 지속 시간',
      '바운스율',
      '페이지별 성능',
      '사용자 행동 흐름',
      '전환 퍼널',
      '이탈 지점',
      '모바일 vs 데스크톱',
      '시간대별 성능',
      '지역별 성능',
      '디바이스별 성능'
    ];
    
    console.log('누락될 수 있는 데이터들:', missingData);
  });

  test('성능 데이터 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 성능 데이터 확인
    const performanceData = {
      pageLoadTime: await page.locator('text=/[0-9]+\.[0-9]+s/').first().textContent(),
      firstPaint: await page.locator('text=/[0-9]+\.[0-9]+s/').nth(1)?.textContent(),
      largestPaint: await page.locator('text=/[0-9]+\.[0-9]+s/').nth(2)?.textContent()
    };
    
    console.log('성능 데이터:', performanceData);
  });

  test('사용자 행동 데이터 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 사용자 행동 데이터 확인
    const behaviorData = {
      scrollDepth: await page.locator('text=/[0-9]+%/').first().textContent(),
      sessionDuration: await page.locator('text=/[0-9]+분/').first().textContent(),
      bounceRate: await page.locator('text=/[0-9]+%/').nth(1)?.textContent()
    };
    
    console.log('사용자 행동 데이터:', behaviorData);
  });
});
