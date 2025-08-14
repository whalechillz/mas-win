import { test, expect } from '@playwright/test';

test.describe('GA4 Advanced Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // 관리자 페이지로 이동
    await page.goto('http://localhost:3000/admin');
    
    // 로그인 (필요한 경우)
    // await page.fill('input[name="username"]', 'admin');
    // await page.fill('input[name="password"]', 'password');
    // await page.click('button[type="submit"]');
  });

  test('GA4 대시보드가 정상적으로 로드되는지 확인', async ({ page }) => {
    // 대시보드 탭이 있는지 확인
    await expect(page.locator('text=대시보드')).toBeVisible();
    
    // GA4 고도화 대시보드 제목 확인
    await expect(page.locator('text=GA4 고도화 실시간 대시보드')).toBeVisible();
  });

  test('실시간 메트릭 카드들이 표시되는지 확인', async ({ page }) => {
    // 실시간 사용자 카드
    await expect(page.locator('text=실시간 사용자')).toBeVisible();
    
    // 실시간 페이지뷰 카드
    await expect(page.locator('text=실시간 페이지뷰')).toBeVisible();
    
    // 실시간 이벤트 카드
    await expect(page.locator('text=실시간 이벤트')).toBeVisible();
  });

  test('전환 깔때기가 표시되는지 확인', async ({ page }) => {
    // 전환 깔때기 제목
    await expect(page.locator('text=실시간 전환 깔때기')).toBeVisible();
    
    // 깔때기 단계들
    await expect(page.locator('text=페이지 방문')).toBeVisible();
    await expect(page.locator('text=상품 조회')).toBeVisible();
    await expect(page.locator('text=장바구니 추가')).toBeVisible();
  });

  test('자동 새로고침 토글이 작동하는지 확인', async ({ page }) => {
    // 자동 새로고침 체크박스
    const autoRefreshCheckbox = page.locator('#autoRefresh');
    await expect(autoRefreshCheckbox).toBeVisible();
    
    // 체크박스 클릭
    await autoRefreshCheckbox.click();
    await expect(autoRefreshCheckbox).toBeChecked();
  });

  test('데이터 내보내기 버튼이 작동하는지 확인', async ({ page }) => {
    // 데이터 내보내기 버튼
    const exportButton = page.locator('text=데이터 내보내기');
    await expect(exportButton).toBeVisible();
    
    // 버튼 클릭 (다운로드 이벤트 확인)
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;
    
    // 파일명 확인
    expect(download.suggestedFilename()).toContain('ga4-dashboard');
  });

  test('새로고침 버튼이 작동하는지 확인', async ({ page }) => {
    // 새로고침 버튼
    const refreshButton = page.locator('text=새로고침');
    await expect(refreshButton).toBeVisible();
    
    // 버튼 클릭
    await refreshButton.click();
    
    // 로딩 상태 확인 (잠시 대기)
    await page.waitForTimeout(1000);
  });

  test('차트들이 정상적으로 렌더링되는지 확인', async ({ page }) => {
    // 시간별 트래픽 차트
    await expect(page.locator('text=시간별 트래픽')).toBeVisible();
    
    // 디바이스별 사용자 차트
    await expect(page.locator('text=디바이스별 사용자')).toBeVisible();
    
    // 지역별 사용자 차트
    await expect(page.locator('text=지역별 사용자')).toBeVisible();
    
    // 이벤트 분석 차트
    await expect(page.locator('text=이벤트 분석')).toBeVisible();
  });

  test('실시간 알림이 표시되는지 확인', async ({ page }) => {
    // 실시간 알림 섹션
    await expect(page.locator('text=실시간 알림')).toBeVisible();
    
    // 알림 내용
    await expect(page.locator('text=현재')).toBeVisible();
    await expect(page.locator('text=명의 사용자가 사이트를 이용 중입니다')).toBeVisible();
  });
});
