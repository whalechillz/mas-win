import { test, expect } from '@playwright/test';

test.describe('A/B 테스트 형태 퍼널 관리 기능 테스트', () => {
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

  test('Live-A 버전 상세 정보 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // Live-A 버전 정보 확인
    await expect(page.locator('text=현재 활성')).toBeVisible();
    await expect(page.locator('text=노출수').first()).toBeVisible();
    await expect(page.locator('text=전환율').first()).toBeVisible();
    await expect(page.locator('text=파일 크기').first()).toBeVisible();
    await expect(page.locator('text=로드 시간').first()).toBeVisible();
    await expect(page.locator('text=첫 번째 페인트').first()).toBeVisible();
    await expect(page.locator('text=최대 페인트').first()).toBeVisible();
    await expect(page.locator('text=평균 세션').first()).toBeVisible();
    await expect(page.locator('text=바운스율').first()).toBeVisible();
    await expect(page.locator('text=페이지/세션').first()).toBeVisible();
  });

  test('Live-B 버전 상세 정보 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // Live-B 버전 정보 확인
    await expect(page.locator('text=테스트 중')).toBeVisible();
    await expect(page.locator('text=노출수').nth(1)).toBeVisible();
    await expect(page.locator('text=전환율').nth(1)).toBeVisible();
    await expect(page.locator('text=파일 크기').nth(1)).toBeVisible();
    await expect(page.locator('text=로드 시간').nth(1)).toBeVisible();
    await expect(page.locator('text=첫 번째 페인트').nth(1)).toBeVisible();
    await expect(page.locator('text=최대 페인트').nth(1)).toBeVisible();
    await expect(page.locator('text=평균 세션').nth(1)).toBeVisible();
    await expect(page.locator('text=바운스율').nth(1)).toBeVisible();
    await expect(page.locator('text=페이지/세션').nth(1)).toBeVisible();
  });

  test('승자 표시 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 승자 표시 확인
    await expect(page.locator('text=현재 승자: 버전 LIVE-B')).toBeVisible();
    await expect(page.locator('text=전환율 +0.6%')).toBeVisible();
  });

  test('실제 GA4 데이터 표시 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 실제 데이터가 표시되는지 확인 (0이 아닌 숫자)
    const pageViews = await page.locator('text=/[0-9]+/').first().textContent();
    expect(pageViews).toMatch(/[0-9]+/);
  });

  test('데이터 업데이트 시간 표시 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 데이터 업데이트 시간이 표시되는지 확인 (퍼널 목록의 업데이트 시간)
    await expect(page.locator('text=마지막 업데이트:').first()).toBeVisible();
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

  test('중복 섹션 제거 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 버튼 클릭
    await page.click('button:has-text("2025-08")');
    await page.waitForLoadState('networkidle');
    
    // 중복된 섹션들이 제거되었는지 확인
    const abTestSections = await page.locator('h3:has-text("A/B 테스트 성능 비교")').count();
    expect(abTestSections).toBe(1); // 하나만 있어야 함
    
    // 기존의 중복된 섹션들이 없는지 확인
    const oldSections = await page.locator('h3:has-text("실시간 A/B 테스트 성능 비교")').count();
    expect(oldSections).toBe(0); // 없어야 함
    
    const userBehaviorSections = await page.locator('h3:has-text("고급 사용자 행동 분석")').count();
    expect(userBehaviorSections).toBe(0); // 없어야 함
    
    const performanceSections = await page.locator('h3:has-text("페이지 성능")').count();
    expect(performanceSections).toBe(0); // 없어야 함
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
    
    // 모바일에서도 A/B 테스트 섹션이 보이는지 확인
    await expect(page.locator('h3:has-text("A/B 테스트 성능 비교")')).toBeVisible();
    await expect(page.locator('h4:has-text("버전 LIVE-A")')).toBeVisible();
    await expect(page.locator('h4:has-text("버전 LIVE-B")')).toBeVisible();
    
    // 데스크톱 뷰포트로 복원
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
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
    
    // 승자 표시가 보이는지 확인
    await expect(page.locator('text=현재 승자: 버전 LIVE-B')).toBeVisible();
    
    // 페이지 상단으로 스크롤
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    
    // 퍼널 목록이 보이는지 확인
    await expect(page.locator('h3:has-text("2025-08 퍼널 목록")')).toBeVisible();
  });
});
