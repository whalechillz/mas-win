import { test, expect } from '@playwright/test';

test.describe('향상된 A/B 테스트 형태 퍼널 관리 기능 테스트', () => {
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

  test('2025-08 퍼널 목록 A/B 테스트 형태 확인', async ({ page }) => {
    // 퍼널 관리 탭 클릭
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 퍼널 목록 확인
    await expect(page.locator('h3:has-text("2025-08 퍼널 목록")')).toBeVisible();
    
    // Live-A와 Live-B 퍼널이 좌우로 나란히 표시되는지 확인
    await expect(page.locator('h4:has-text("funnel-2025-08-live-a.html")')).toBeVisible();
    await expect(page.locator('h4:has-text("funnel-2025-08-live-b.html")')).toBeVisible();
  });

  test('퍼널 목록 상태 표시 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 상태 표시 확인 (현재 활성, 테스트 중)
    await expect(page.locator('text=현재 활성').first()).toBeVisible();
    await expect(page.locator('text=테스트 중').first()).toBeVisible();
  });

  test('퍼널 목록 상세 정보 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 파일 크기, 버전, 수정일 정보 확인
    await expect(page.locator('text=파일 크기:').first()).toBeVisible();
    await expect(page.locator('text=버전:').first()).toBeVisible();
    await expect(page.locator('text=수정일:').first()).toBeVisible();
  });

  test('A/B 테스트 성능 비교 섹션 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // A/B 테스트 성능 비교 섹션 확인
    await expect(page.locator('h3:has-text("A/B 테스트 성능 비교")')).toBeVisible();
    
    // Live-A와 Live-B 버전 확인
    await expect(page.locator('h4:has-text("버전 LIVE-A")')).toBeVisible();
    await expect(page.locator('h4:has-text("버전 LIVE-B")')).toBeVisible();
  });

  test('스크롤 깊이 분석 섹션 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 스크롤 깊이 분석 섹션 확인
    await expect(page.locator('h3:has-text("스크롤 깊이 분석")')).toBeVisible();
    
    // Live-A와 Live-B 스크롤 깊이 확인
    await expect(page.locator('h4:has-text("Live-A 스크롤 깊이")')).toBeVisible();
    await expect(page.locator('h4:has-text("Live-B 스크롤 깊이")')).toBeVisible();
  });

  test('스크롤 깊이 그래프 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 스크롤 깊이 그래프가 렌더링되었는지 확인 (SVG 요소 존재)
    const svgElements = await page.locator('svg').count();
    expect(svgElements).toBeGreaterThan(0);
  });

  test('스크롤 깊이 비교 요약 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 스크롤 깊이 비교 요약 확인
    await expect(page.locator('text=Live-B가 평균 스크롤 깊이 +10% 우위')).toBeVisible();
  });

  test('평균 스크롤 깊이 표시 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 평균 스크롤 깊이 표시 확인
    await expect(page.locator('text=평균 스크롤 깊이: 55%').first()).toBeVisible();
    await expect(page.locator('text=평균 스크롤 깊이: 65%').first()).toBeVisible();
  });

  test('좌우 비교 레이아웃 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 좌우 비교 레이아웃 확인 (Live-A와 Live-B가 나란히 표시)
    const liveAVersion = await page.locator('h4:has-text("버전 LIVE-A")').isVisible();
    const liveBVersion = await page.locator('h4:has-text("버전 LIVE-B")').isVisible();
    
    expect(liveAVersion).toBe(true);
    expect(liveBVersion).toBe(true);
  });

  test('전체 페이지 스크롤 테스트', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 페이지 하단까지 스크롤
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // 스크롤 깊이 분석 섹션이 보이는지 확인
    await expect(page.locator('h3:has-text("스크롤 깊이 분석")')).toBeVisible();
    
    // 페이지 상단으로 스크롤
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    
    // 퍼널 목록이 보이는지 확인
    await expect(page.locator('h3:has-text("2025-08 퍼널 목록")')).toBeVisible();
  });

  test('반응형 레이아웃 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // 모바일에서도 모든 섹션이 보이는지 확인
    await expect(page.locator('h3:has-text("2025-08 퍼널 목록")')).toBeVisible();
    await expect(page.locator('h3:has-text("A/B 테스트 성능 비교")')).toBeVisible();
    await expect(page.locator('h3:has-text("스크롤 깊이 분석")')).toBeVisible();
    
    // 데스크톱 뷰포트로 복원
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
  });

  test('색상 구분 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // Live-A와 Live-B의 색상 구분 확인 (파란색과 초록색 테두리)
    const liveACard = await page.locator('div.border-blue-200').first().isVisible();
    const liveBCard = await page.locator('div.border-green-200').first().isVisible();
    
    expect(liveACard).toBe(true);
    expect(liveBCard).toBe(true);
  });
});
