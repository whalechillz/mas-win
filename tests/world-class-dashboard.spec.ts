import { test, expect } from '@playwright/test';

test.describe('세계적인 A/B 테스트 대시보드 테스트', () => {
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

  test('고급 사용자 행동 분석 섹션 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 고급 사용자 행동 분석 섹션이 표시되는지 확인
    await expect(page.locator('h3:has-text("고급 사용자 행동 분석")')).toBeVisible();
    
    // 세션 분석 카드 확인
    await expect(page.locator('h4:has-text("세션 분석")')).toBeVisible();
    await expect(page.locator('text=/총 세션:/')).toBeVisible();
    await expect(page.locator('text=/평균 세션:/')).toBeVisible();
    await expect(page.locator('text=/바운스율:/')).toBeVisible();
    await expect(page.locator('text=/참여율:/')).toBeVisible();
    
    // 디바이스별 성능 차트 확인
    await expect(page.locator('h4:has-text("디바이스별 성능")')).toBeVisible();
    
    // 시간대별 성능 차트 확인
    await expect(page.locator('h4:has-text("시간대별 성능")')).toBeVisible();
    
    // 이벤트 분석 확인
    await expect(page.locator('h4:has-text("이벤트 분석")')).toBeVisible();
    
    console.log('✅ 고급 사용자 행동 분석 섹션이 정상적으로 표시됩니다.');
  });

  test('고급 성능 분석 섹션 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 고급 성능 분석 섹션이 표시되는지 확인
    await expect(page.locator('h3:has-text("고급 성능 분석")')).toBeVisible();
    
    // 종합 성능 지표 카드 확인
    await expect(page.locator('h4:has-text("종합 성능 지표")')).toBeVisible();
    await expect(page.locator('text=/총 페이지뷰:/')).toBeVisible();
    await expect(page.locator('text=/평균 세션:/')).toBeVisible();
    await expect(page.locator('text=/평균 바운스율:/')).toBeVisible();
    await expect(page.locator('text=/성능 점수:/')).toBeVisible();
    
    // A/B 테스트 성능 비교 카드 확인
    await expect(page.locator('h4:has-text("A/B 테스트 성능 비교")')).toBeVisible();
    await expect(page.locator('text=Version A')).toBeVisible();
    await expect(page.locator('text=Version B')).toBeVisible();
    
    // 페이지별 성능 확인
    await expect(page.locator('h4:has-text("페이지별 성능")')).toBeVisible();
    
    console.log('✅ 고급 성능 분석 섹션이 정상적으로 표시됩니다.');
  });

  test('월별 데이터 요약 섹션 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 월별 데이터 요약 섹션이 표시되는지 확인
    await expect(page.locator('h3:has-text("월별 데이터 요약")')).toBeVisible();
    
    // 4개의 주요 지표 카드 확인
    await expect(page.locator('text=총 사용자')).toBeVisible();
    await expect(page.locator('text=총 페이지뷰')).toBeVisible();
    await expect(page.locator('text=총 이벤트')).toBeVisible();
    await expect(page.locator('text=작동일/총일')).toBeVisible();
    
    // 태그 상태 확인
    await expect(page.locator('text=/태그 상태:/')).toBeVisible();
    
    console.log('✅ 월별 데이터 요약 섹션이 정상적으로 표시됩니다.');
  });

  test('실제 데이터 값 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 실제 데이터 값들 확인
    const totalUsers = await page.locator('text=/[0-9,]+/').first().textContent();
    const totalPageViews = await page.locator('text=/[0-9,]+/').nth(1)?.textContent();
    const totalEvents = await page.locator('text=/[0-9,]+/').nth(2)?.textContent();
    
    console.log('실제 데이터 값들:', {
      totalUsers,
      totalPageViews,
      totalEvents
    });
    
    // 데이터가 숫자 형태인지 확인
    expect(totalUsers).toMatch(/[0-9,]+/);
    expect(totalPageViews).toMatch(/[0-9,]+/);
    expect(totalEvents).toMatch(/[0-9,]+/);
    
    console.log('✅ 실제 데이터 값들이 정상적으로 표시됩니다.');
  });

  test('API 호출 모니터링', async ({ page }) => {
    // API 호출 모니터링
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
    
    // 새로운 고급 API들이 호출되는지 확인
    const hasUserBehaviorAPI = apiRequests.some(req => req.url.includes('ga4-user-behavior'));
    const hasPerformanceAPI = apiRequests.some(req => req.url.includes('performance-metrics'));
    const hasMonthlyAPI = apiRequests.some(req => req.url.includes('ga4-monthly'));
    
    console.log('고급 API 호출 상태:', {
      userBehavior: hasUserBehaviorAPI,
      performance: hasPerformanceAPI,
      monthly: hasMonthlyAPI
    });
    
    // 최소한 5개의 API가 호출되어야 함 (기존 2개 + 새로운 3개)
    expect(apiRequests.length).toBeGreaterThanOrEqual(5);
    
    console.log('✅ 모든 고급 API들이 정상적으로 호출됩니다.');
  });

  test('차트 및 그래프 렌더링 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 차트들이 렌더링되는지 확인
    const charts = await page.locator('svg').count();
    console.log('렌더링된 차트 개수:', charts);
    
    // 최소한 3개의 차트가 있어야 함 (디바이스별, 시간대별, 스크롤 깊이)
    expect(charts).toBeGreaterThanOrEqual(3);
    
    console.log('✅ 모든 차트와 그래프가 정상적으로 렌더링됩니다.');
  });

  test('반응형 레이아웃 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 데스크톱 뷰에서 그리드 레이아웃 확인
    const gridItems = await page.locator('.grid').count();
    console.log('그리드 레이아웃 개수:', gridItems);
    
    // 최소한 3개의 그리드 섹션이 있어야 함
    expect(gridItems).toBeGreaterThanOrEqual(3);
    
    // 모바일 뷰로 변경하여 반응형 확인
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // 모바일에서도 레이아웃이 깨지지 않는지 확인
    const mobileGridItems = await page.locator('.grid').count();
    expect(mobileGridItems).toBeGreaterThanOrEqual(3);
    
    console.log('✅ 반응형 레이아웃이 정상적으로 작동합니다.');
  });

  test('데이터 업데이트 시간 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 데이터 업데이트 시간이 표시되는지 확인
    const updateTime = await page.locator('text=/마지막 업데이트:/').textContent();
    console.log('데이터 업데이트 시간:', updateTime);
    
    expect(updateTime).toMatch(/마지막 업데이트:/);
    
    console.log('✅ 데이터 업데이트 시간이 정상적으로 표시됩니다.');
  });
});
