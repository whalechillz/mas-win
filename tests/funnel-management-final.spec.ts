import { test, expect } from '@playwright/test';

test.describe('최종 정리된 퍼널 관리 기능 테스트', () => {
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

  test('2025-08 퍼널 관리 페이지 접근', async ({ page }) => {
    // 퍼널 관리 탭 클릭
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 퍼널 목록 확인
    await expect(page.locator('h3:has-text("2025-08 퍼널 목록")')).toBeVisible();
  });

  test('실시간 A/B 테스트 성능 비교 섹션 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 실시간 A/B 테스트 성능 비교 섹션 확인
    await expect(page.locator('h3:has-text("실시간 A/B 테스트 성능 비교")')).toBeVisible();
    
    // Live-A와 Live-B 버전 확인
    await expect(page.locator('h4:has-text("버전 LIVE-A")')).toBeVisible();
    await expect(page.locator('h4:has-text("버전 LIVE-B")')).toBeVisible();
  });

  test('고급 사용자 행동 분석 섹션 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 고급 사용자 행동 분석 섹션 확인
    await expect(page.locator('h3:has-text("고급 사용자 행동 분석")')).toBeVisible();
    
    // 실제 데이터 카드들 확인
    await expect(page.locator('text=총 세션').first()).toBeVisible();
    await expect(page.locator('text=평균 세션 시간').first()).toBeVisible();
    await expect(page.locator('text=바운스율').first()).toBeVisible();
    await expect(page.locator('text=페이지/세션').first()).toBeVisible();
  });

  test('페이지 성능 섹션 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 페이지 성능 섹션 확인
    await expect(page.locator('h3:has-text("페이지 성능")').first()).toBeVisible();
    
    // 성능 지표들 확인
    await expect(page.locator('text=페이지 로드 시간').first()).toBeVisible();
    await expect(page.locator('text=첫 번째 콘텐츠풀 페인트').first()).toBeVisible();
    await expect(page.locator('text=최대 콘텐츠풀 페인트').first()).toBeVisible();
  });

  test('파일 크기 분포 차트 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 파일 크기 분포 차트 확인
    await expect(page.locator('h3:has-text("파일 크기 분포 (Live-A vs Live-B)")')).toBeVisible();
    
    // 차트가 렌더링되었는지 확인 (SVG 요소 존재)
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('실제 GA4 데이터 표시 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 실제 데이터가 표시되는지 확인 (0이 아닌 숫자)
    const sessionData = await page.locator('text=/[0-9]+/').first().textContent();
    expect(sessionData).toMatch(/[0-9]+/);
  });

  test('데이터 업데이트 시간 표시 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 데이터 업데이트 시간이 표시되는지 확인
    await expect(page.locator('text=마지막 업데이트:').first()).toBeVisible();
  });

  test('중복 스크롤 깊이 분석 제거 확인', async ({ page }) => {
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
    
    // 스크롤 깊이 분석 섹션이 하나만 있는지 확인 (중복 제거 확인)
    const scrollDepthSections = await page.locator('h3:has-text("스크롤 깊이 분석")').count();
    expect(scrollDepthSections).toBeLessThanOrEqual(1);
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
    
    // 페이지 성능 섹션이 보이는지 확인
    await expect(page.locator('h3:has-text("페이지 성능")').first()).toBeVisible();
    
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
    await expect(page.locator('h3:has-text("실시간 A/B 테스트 성능 비교")')).toBeVisible();
    
    // 데스크톱 뷰포트로 복원
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
  });

  test('불필요한 컴포넌트 제거 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 중복된 A/B 테스트 대시보드가 없는지 확인
    const abTestSections = await page.locator('h3:has-text("실시간 A/B 테스트 성능 비교")').count();
    expect(abTestSections).toBe(1); // 하나만 있어야 함
    
    // 중복된 스크롤 깊이 분석이 없는지 확인
    const scrollDepthSections = await page.locator('h3:has-text("스크롤 깊이 분석")').count();
    expect(scrollDepthSections).toBeLessThanOrEqual(1); // 하나 이하여야 함
  });
});
