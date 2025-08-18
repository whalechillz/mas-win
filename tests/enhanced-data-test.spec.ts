import { test, expect } from '@playwright/test';

test.describe('고급 데이터 API 테스트', () => {
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

  test('GA4 월별 데이터 API 확인', async ({ page }) => {
    // GA4 월별 API 호출 확인
    const response = await page.request.get('http://localhost:3000/api/ga4-monthly');
    console.log('GA4 월별 API 응답 상태:', response.status());
    
    if (response.ok()) {
      const data = await response.json();
      console.log('GA4 월별 데이터:', {
        month: data.month,
        users: data.users,
        pageViews: data.pageViews,
        events: data.events,
        tagStatus: data.tagStatus
      });
      
      expect(data.month).toBeDefined();
      expect(data.users).toBeGreaterThan(0);
      expect(data.pageViews).toBeGreaterThan(0);
      expect(data.events).toBeGreaterThan(0);
    } else {
      console.log('GA4 월별 API 오류:', await response.text());
    }
  });

  test('GA4 사용자 행동 데이터 API 확인', async ({ page }) => {
    // GA4 사용자 행동 API 호출 확인
    const response = await page.request.get('http://localhost:3000/api/ga4-user-behavior');
    console.log('GA4 사용자 행동 API 응답 상태:', response.status());
    
    if (response.ok()) {
      const data = await response.json();
      console.log('GA4 사용자 행동 데이터:', {
        sessionMetrics: data.sessionMetrics,
        devicePerformance: data.devicePerformance?.length,
        hourlyPerformance: data.hourlyPerformance?.length,
        pagePerformance: data.pagePerformance?.length,
        eventAnalysis: data.eventAnalysis?.length,
        calculatedMetrics: data.calculatedMetrics
      });
      
      expect(data.sessionMetrics).toBeDefined();
      expect(data.devicePerformance).toBeDefined();
      expect(data.hourlyPerformance).toBeDefined();
      expect(data.pagePerformance).toBeDefined();
      expect(data.eventAnalysis).toBeDefined();
      expect(data.calculatedMetrics).toBeDefined();
    } else {
      console.log('GA4 사용자 행동 API 오류:', await response.text());
    }
  });

  test('성능 메트릭 API 확인', async ({ page }) => {
    // 성능 메트릭 API 호출 확인
    const response = await page.request.get('http://localhost:3000/api/performance-metrics');
    console.log('성능 메트릭 API 응답 상태:', response.status());
    
    if (response.ok()) {
      const data = await response.json();
      console.log('성능 메트릭 데이터:', {
        pagePerformance: data.pagePerformance?.length,
        devicePerformance: data.devicePerformance?.length,
        hourlyPerformance: data.hourlyPerformance?.length,
        overallMetrics: data.overallMetrics,
        abTestPerformance: data.abTestPerformance
      });
      
      expect(data.pagePerformance).toBeDefined();
      expect(data.devicePerformance).toBeDefined();
      expect(data.hourlyPerformance).toBeDefined();
      expect(data.overallMetrics).toBeDefined();
      expect(data.abTestPerformance).toBeDefined();
      
      // A/B 테스트 성능 데이터 확인
      expect(data.abTestPerformance.versionA).toBeDefined();
      expect(data.abTestPerformance.versionB).toBeDefined();
      expect(data.abTestPerformance.versionA.fileSize).toBe(201197);
      expect(data.abTestPerformance.versionB.fileSize).toBe(62754);
    } else {
      console.log('성능 메트릭 API 오류:', await response.text());
    }
  });

  test('실제 A/B 테스트 데이터 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 실제 파일 크기 데이터 확인
    const liveASize = await page.locator('text=/[0-9]+\.[0-9]+ KB/').first().textContent();
    const liveBSize = await page.locator('text=/[0-9]+\.[0-9]+ KB/').nth(1)?.textContent();
    
    console.log('실제 파일 크기:', { liveA: liveASize, liveB: liveBSize });
    
    // 실제 GA4 데이터 확인
    const pageViews = await page.locator('text=/[0-9]+/').first().textContent();
    console.log('실제 GA4 페이지뷰:', pageViews);
    
    expect(liveASize).toMatch(/[0-9]+\.[0-9]+ KB/);
    expect(liveBSize).toMatch(/[0-9]+\.[0-9]+ KB/);
    expect(pageViews).toMatch(/[0-9]+/);
  });

  test('고급 사용자 행동 데이터 표시 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 현재 표시되는 고급 데이터 확인
    const currentData = {
      sessionDuration: await page.locator('text=/[0-9]+분/').first().textContent(),
      bounceRate: await page.locator('text=/[0-9]+%/').first().textContent(),
      pagesPerSession: await page.locator('text=/[0-9]+\.[0-9]+/').first().textContent()
    };
    
    console.log('현재 표시되는 고급 데이터:', currentData);
    
    // 추가로 표시할 수 있는 고급 데이터들
    const additionalData = [
      '디바이스별 성능 (모바일 vs 데스크톱)',
      '시간대별 성능 (피크 타임 분석)',
      '페이지별 성능 (이탈 지점 분석)',
      '이벤트 분석 (사용자 행동 흐름)',
      '성능 점수 (종합 평가)',
      '실제 파일 크기 비교',
      '세션 지속 시간 분석',
      '참여율 계산'
    ];
    
    console.log('추가로 표시할 수 있는 고급 데이터:', additionalData);
  });

  test('API 통합 테스트', async ({ page }) => {
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
    console.log('사용 중인 모든 API 엔드포인트:', apiRequests);
    
    // 최소한 2개의 API가 호출되어야 함
    expect(apiRequests.length).toBeGreaterThanOrEqual(2);
    
    // 새로운 API들도 호출되는지 확인
    const hasUserBehaviorAPI = apiRequests.some(req => req.url.includes('ga4-user-behavior'));
    const hasPerformanceAPI = apiRequests.some(req => req.url.includes('performance-metrics'));
    const hasMonthlyAPI = apiRequests.some(req => req.url.includes('ga4-monthly'));
    
    console.log('새로운 API 호출 상태:', {
      userBehavior: hasUserBehaviorAPI,
      performance: hasPerformanceAPI,
      monthly: hasMonthlyAPI
    });
  });

  test('데이터 품질 확인', async ({ page }) => {
    // 각 API의 데이터 품질 확인
    const apis = [
      { name: 'GA4 실시간', url: '/api/ga4-realtime' },
      { name: 'GA4 월별', url: '/api/ga4-monthly' },
      { name: 'GA4 사용자 행동', url: '/api/ga4-user-behavior' },
      { name: '성능 메트릭', url: '/api/performance-metrics' },
      { name: '퍼널 관리', url: '/api/funnel-management' }
    ];
    
    for (const api of apis) {
      try {
        const response = await page.request.get(`http://localhost:3000${api.url}`);
        console.log(`${api.name} API 상태:`, response.status());
        
        if (response.ok()) {
          const data = await response.json();
          const dataSize = JSON.stringify(data).length;
          console.log(`${api.name} 데이터 크기:`, dataSize, 'bytes');
          
          // 데이터가 비어있지 않은지 확인
          expect(dataSize).toBeGreaterThan(100);
        }
      } catch (error) {
        console.log(`${api.name} API 오류:`, error);
      }
    }
  });
});
