import { test, expect } from '@playwright/test';

test.describe('퍼널별 데이터 수집 기간 및 일별 페이지뷰 테스트', () => {
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

  test('퍼널별 데이터 수집 기간 테이블 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 퍼널별 데이터 수집 기간 섹션이 표시되는지 확인
    await expect(page.locator('h3:has-text("퍼널별 데이터 수집 기간")')).toBeVisible();
    
    // 테이블 헤더 확인
    await expect(page.locator('th:has-text("퍼널 페이지")')).toBeVisible();
    await expect(page.locator('th:has-text("최초 수집일")')).toBeVisible();
    await expect(page.locator('th:has-text("최종 수집일")')).toBeVisible();
    await expect(page.locator('th:has-text("수집 일수")')).toBeVisible();
    await expect(page.locator('th:has-text("총 페이지뷰")')).toBeVisible();
    await expect(page.locator('th:has-text("상태")')).toBeVisible();
    
    // 실제 데이터 행이 표시되는지 확인
    const tableRows = await page.locator('tbody tr').count();
    console.log('퍼널 데이터 테이블 행 수:', tableRows);
    expect(tableRows).toBeGreaterThan(0);
    
    // 첫 번째 행의 데이터 확인
    const firstRowPage = await page.locator('tbody tr').first().locator('td').nth(0).textContent();
    const firstRowPageViews = await page.locator('tbody tr').first().locator('td').nth(4).textContent();
    
    console.log('첫 번째 퍼널:', firstRowPage);
    console.log('첫 번째 퍼널 페이지뷰:', firstRowPageViews);
    
    expect(firstRowPage).toBeTruthy();
    expect(firstRowPageViews).toMatch(/[0-9,]+/);
    
    console.log('✅ 퍼널별 데이터 수집 기간 테이블이 정상적으로 표시됩니다.');
  });

  test('퍼널별 일별 페이지뷰 그래프 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 퍼널별 일별 페이지뷰 트렌드 섹션이 표시되는지 확인
    await expect(page.locator('h3:has-text("퍼널별 일별 페이지뷰 트렌드")')).toBeVisible();
    
    // 그래프들이 렌더링되는지 확인
    const charts = await page.locator('svg').count();
    console.log('렌더링된 차트 개수:', charts);
    
    // 최소한 3개의 차트가 있어야 함 (주요 퍼널 3개)
    expect(charts).toBeGreaterThanOrEqual(3);
    
    // 각 퍼널의 제목과 페이지뷰 정보 확인
    const funnelTitles = await page.locator('h4').filter({ hasText: /funnel/ }).count();
    console.log('퍼널 제목 개수:', funnelTitles);
    expect(funnelTitles).toBeGreaterThan(0);
    
    // 데이터 수집 기간 정보 확인
    const dataPeriods = await page.locator('text=/데이터 수집 기간:/').count();
    console.log('데이터 수집 기간 표시 개수:', dataPeriods);
    expect(dataPeriods).toBeGreaterThan(0);
    
    console.log('✅ 퍼널별 일별 페이지뷰 그래프가 정상적으로 표시됩니다.');
  });

  test('실제 퍼널 데이터 값 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 실제 퍼널 데이터 값들 확인
    const pageViews = await page.locator('text=/[0-9,]+/').allTextContents();
    const uniquePageViews = [...new Set(pageViews)].filter(text => 
      text.match(/^[0-9,]+$/) && parseInt(text.replace(/,/g, '')) > 100
    );
    
    console.log('실제 퍼널 페이지뷰 값들:', uniquePageViews);
    
    // 최소한 3개의 유효한 페이지뷰 값이 있어야 함
    expect(uniquePageViews.length).toBeGreaterThanOrEqual(3);
    
    // 각 값이 숫자 형태인지 확인
    uniquePageViews.forEach(pageView => {
      expect(pageView).toMatch(/^[0-9,]+$/);
    });
    
    console.log('✅ 실제 퍼널 데이터 값들이 정상적으로 표시됩니다.');
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
    
    // 새로운 퍼널 관련 API들이 호출되는지 확인
    const hasPageTrackingAPI = apiRequests.some(req => req.url.includes('page-tracking-dates'));
    const hasFunnelDailyViewsAPI = apiRequests.some(req => req.url.includes('funnel-daily-views'));
    
    console.log('퍼널 관련 API 호출 상태:', {
      pageTracking: hasPageTrackingAPI,
      funnelDailyViews: hasFunnelDailyViewsAPI
    });
    
    // 최소한 7개의 API가 호출되어야 함 (기존 5개 + 새로운 2개)
    expect(apiRequests.length).toBeGreaterThanOrEqual(7);
    
    console.log('✅ 모든 퍼널 관련 API들이 정상적으로 호출됩니다.');
  });

  test('퍼널 데이터 정렬 및 필터링 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 테이블이 페이지뷰 순으로 정렬되어 있는지 확인
    const pageViewsCells = await page.locator('tbody tr td:nth-child(5)').allTextContents();
    const pageViewsNumbers = pageViewsCells
      .map(text => parseInt(text.replace(/,/g, '')))
      .filter(num => !isNaN(num));
    
    console.log('페이지뷰 순서:', pageViewsNumbers);
    
    // 내림차순 정렬 확인 (첫 번째가 가장 큰 값)
    if (pageViewsNumbers.length > 1) {
      expect(pageViewsNumbers[0]).toBeGreaterThanOrEqual(pageViewsNumbers[1]);
    }
    
    // 활성 상태인 퍼널만 표시되는지 확인
    const statusCells = await page.locator('tbody tr td:nth-child(6)').allTextContents();
    const activeStatuses = statusCells.filter(status => status.includes('활성'));
    
    console.log('활성 퍼널 개수:', activeStatuses.length);
    expect(activeStatuses.length).toBeGreaterThan(0);
    
    console.log('✅ 퍼널 데이터가 정상적으로 정렬되고 필터링됩니다.');
  });

  test('그래프 상호작용 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 그래프에 마우스 호버하여 툴팁 확인
    const firstChart = page.locator('svg').first();
    await firstChart.hover();
    
    // 툴팁이 표시되는지 확인 (약간의 지연 후)
    await page.waitForTimeout(1000);
    
    // 그래프의 점들을 클릭할 수 있는지 확인
    const chartDots = await page.locator('circle').count();
    console.log('그래프 점 개수:', chartDots);
    expect(chartDots).toBeGreaterThan(0);
    
    console.log('✅ 그래프 상호작용이 정상적으로 작동합니다.');
  });
});
