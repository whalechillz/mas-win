import { test, expect } from '@playwright/test';

test.describe('퍼널별 일별 페이지뷰 트렌드 개선 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 관리자 페이지로 이동
    await page.goto('http://localhost:3000/admin');
    
    // 로그인
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', '1234');
    await page.click('button[type="submit"]');
    
    // 로그인 완료 대기
    await page.waitForURL('http://localhost:3000/admin');
    
    // 퍼널 관리 탭 클릭
    await page.click('text=퍼널 관리');
    
    // 2025-08 탭 클릭
    await page.click('text=2025-08');
  });

  test('종합 비교 그래프가 맨 위에 표시되는지 확인', async ({ page }) => {
    // 퍼널별 일별 페이지뷰 트렌드 섹션이 있는지 확인
    await expect(page.locator('text=퍼널별 일별 페이지뷰 트렌드 (8월 1일 ~ 오늘)')).toBeVisible();
    
    // 종합 비교 그래프가 맨 위에 있는지 확인
    const combinedGraph = page.locator('.border-2.border-purple-200').first();
    await expect(combinedGraph).toBeVisible();
    await expect(combinedGraph.locator('text=종합 비교 (상위 5개 퍼널)')).toBeVisible();
    
    // 종합 그래프의 차트가 있는지 확인
    await expect(combinedGraph.locator('.recharts-line')).toBeVisible();
    
    // 범례가 있는지 확인
    await expect(page.locator('.recharts-legend')).toBeVisible();
  });

  test('상위 5개 퍼널 개별 그래프가 표시되는지 확인', async ({ page }) => {
    // 상위 5개 퍼널 개별 그래프가 표시되는지 확인 (종합 그래프 제외)
    const individualGraphs = page.locator('.border.rounded-lg.p-4').filter({ hasText: '총' });
    await expect(individualGraphs).toHaveCount(5);
    
    // 각 그래프에 차트가 있는지 확인
    for (let i = 0; i < 5; i++) {
      await expect(individualGraphs.nth(i).locator('.recharts-line')).toBeVisible();
    }
  });

  test('종합 그래프가 첫 번째 위치에 있는지 확인', async ({ page }) => {
    // 종합 비교 섹션이 있는지 확인
    await expect(page.locator('text=종합 비교 (상위 5개 퍼널)')).toBeVisible();
    
    // 종합 그래프가 맨 위에 있는지 확인 (첫 번째 그래프)
    const firstGraph = page.locator('.border-2.border-purple-200').first();
    await expect(firstGraph).toBeVisible();
    
    // 종합 그래프의 차트가 있는지 확인
    await expect(firstGraph.locator('.recharts-line')).toBeVisible();
    
    // 범례가 있는지 확인
    await expect(page.locator('.recharts-legend')).toBeVisible();
  });

  test('8월 1일부터 오늘까지의 전체 기간이 표시되는지 확인', async ({ page }) => {
    // 기간 표시 확인
    await expect(page.locator('text=기간: 2025-08-01 ~')).toBeVisible();
    
    // X축에 8월 날짜들이 표시되는지 확인
    const xAxisLabels = page.locator('.recharts-xAxis .recharts-cartesian-axis-tick-value');
    await expect(xAxisLabels.first()).toContainText('08/01');
  });

  test('퍼널별 데이터 수집 기간이 정확히 표시되는지 확인', async ({ page }) => {
    // 데이터 수집 기간 정보가 있는지 확인
    const dataPeriods = page.locator('text=데이터 수집 기간:');
    await expect(dataPeriods).toHaveCount(5);
    
    // 각 퍼널의 데이터 수집 기간이 표시되는지 확인
    await expect(page.locator('text=2025-08-09 ~ 2025-08-17')).toBeVisible();
  });

  test('총 페이지뷰 수가 정확히 표시되는지 확인', async ({ page }) => {
    // 총 페이지뷰 정보가 있는지 확인
    const totalViews = page.locator('text=총').filter({ hasText: '페이지뷰' });
    await expect(totalViews).toHaveCount(5);
    
    // 숫자가 표시되는지 확인
    await expect(page.locator('text=6,893')).toBeVisible();
    await expect(page.locator('text=5,970')).toBeVisible();
  });

  test('API 호출이 정상적으로 이루어지는지 확인', async ({ page }) => {
    // 네트워크 요청 모니터링
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/funnel-daily-views') && response.status() === 200
    );
    
    // 페이지 새로고침
    await page.reload();
    
    // API 응답 대기
    const response = await responsePromise;
    const responseData = await response.json();
    
    // 응답 데이터 구조 확인
    expect(responseData).toHaveProperty('top5Funnels');
    expect(responseData).toHaveProperty('combinedFunnel');
    expect(responseData).toHaveProperty('dateRange');
    
    // 상위 5개 퍼널이 있는지 확인
    expect(responseData.top5Funnels).toHaveLength(5);
    
    // 종합 퍼널이 있는지 확인
    expect(responseData.combinedFunnel.page).toBe('종합 (상위 5개 퍼널)');
  });

  test('시간대별 성능 그래프에 범례가 표시되는지 확인', async ({ page }) => {
    // 시간대별 성능 섹션이 있는지 확인
    await expect(page.locator('text=시간대별 성능 (8월 1일 ~ 오늘)')).toBeVisible();
    
    // 범례가 있는지 확인
    await expect(page.locator('.recharts-legend')).toBeVisible();
    
    // 범례에 3개 지표가 표시되는지 확인
    await expect(page.locator('text=페이지뷰 (초록색)')).toBeVisible();
    await expect(page.locator('text=사용자 (파란색)')).toBeVisible();
    await expect(page.locator('text=평균 세션 (주황색)')).toBeVisible();
  });

  test('시간대별 성능 그래프 툴팁이 정확히 표시되는지 확인', async ({ page }) => {
    // 시간대별 성능 그래프에 마우스 호버
    const chartArea = page.locator('text=시간대별 성능 (8월 1일 ~ 오늘)').locator('..').locator('.recharts-line');
    await chartArea.first().hover();
    
    // 툴팁이 나타나는지 확인
    await expect(page.locator('.recharts-tooltip-wrapper')).toBeVisible();
    
    // 툴팁에 3개 지표가 구분되어 표시되는지 확인
    await expect(page.locator('text=사용자')).toBeVisible();
    await expect(page.locator('text=페이지뷰')).toBeVisible();
    await expect(page.locator('text=평균 세션')).toBeVisible();
  });

  test('시간대별 성능 데이터 수집 기간이 표시되는지 확인', async ({ page }) => {
    // 데이터 수집 기간 정보가 있는지 확인
    await expect(page.locator('text=데이터 수집 기간: 8월 1일 ~')).toBeVisible();
  });

  test('페이지별 성능에서 평균 세션이 분+초 형식으로 표시되는지 확인', async ({ page }) => {
    // 페이지별 성능 섹션이 있는지 확인
    await expect(page.locator('text=페이지별 성능')).toBeVisible();
    
    // 평균 세션이 분+초 형식으로 표시되는지 확인 (예: "2분 30초")
    const sessionElements = page.locator('text=/\\d+분 \\d+초/');
    await expect(sessionElements).toBeVisible();
  });

  test('그래프 색상이 다르게 표시되는지 확인', async ({ page }) => {
    // 개별 그래프들의 색상 확인
    const individualLines = page.locator('.border.rounded-lg.p-4 .recharts-line');
    await expect(individualLines).toHaveCount(5);
    
    // 종합 그래프의 여러 선들이 있는지 확인
    const combinedLines = page.locator('.border-2.border-purple-200 .recharts-line');
    await expect(combinedLines).toHaveCount(5);
  });

  test('툴팁이 정상적으로 작동하는지 확인', async ({ page }) => {
    // 그래프 영역에 마우스 호버
    const chartArea = page.locator('.recharts-line').first();
    await chartArea.hover();
    
    // 툴팁이 나타나는지 확인
    await expect(page.locator('.recharts-tooltip-wrapper')).toBeVisible();
  });

  test('반응형 레이아웃이 정상적으로 작동하는지 확인', async ({ page }) => {
    // 모바일 크기로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 그래프들이 여전히 보이는지 확인
    await expect(page.locator('text=퍼널별 일별 페이지뷰 트렌드 (8월 1일 ~ 오늘)')).toBeVisible();
    await expect(page.locator('.recharts-line')).toBeVisible();
    
    // 데스크톱 크기로 복원
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
