import { test, expect } from '@playwright/test';

test.describe('퍼널 관리 2025-08 탭 GA4 API 데이터 확인', () => {
  test.beforeEach(async ({ page }) => {
    // 관리자 페이지로 이동
    await page.goto('/admin');
    
    // 로그인
    await page.fill('input[placeholder="관리자 아이디"]', 'admin');
    await page.fill('input[placeholder="비밀번호"]', '1234');
    await page.click('button:has-text("로그인")');
    
    // 로그인 완료 대기 (실제 구조에 맞게 수정)
    await expect(page.locator('h1:has-text("MASGOLF 관리자")')).toBeVisible();
  });

  test('퍼널 관리 탭 접근 확인', async ({ page }) => {
    // 퍼널 관리 탭 클릭
    await page.click('text=퍼널 관리');
    
    // 퍼널 관리 페이지 로드 확인 (실제 구조에 맞게 수정)
    await expect(page.locator('text=퍼널 관리')).toBeVisible();
    
    // 페이지 로드 완료 대기
    await page.waitForLoadState('networkidle');
  });

  test('2025-08 퍼널 버전 목록 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 2025-08 관련 퍼널 버전들 확인
    await expect(page.locator('text=2025-08')).toBeVisible();
    
    // live-a, live-b 버전 확인
    await expect(page.locator('text=live-a')).toBeVisible();
    await expect(page.locator('text=live-b')).toBeVisible();
  });

  test('GA4 API 데이터 로딩 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // GA4 API 호출 모니터링
    const ga4Requests = [];
    page.on('request', request => {
      if (request.url().includes('analytics') || request.url().includes('ga4')) {
        ga4Requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });
    
    // 페이지 새로고침하여 API 호출 트리거
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // GA4 API 호출 확인
    console.log('GA4 API 호출:', ga4Requests);
    expect(ga4Requests.length).toBeGreaterThan(0);
  });

  test('실시간 사용자 데이터 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 실시간 사용자 데이터 확인
    await expect(page.locator('text=실시간 사용자')).toBeVisible();
    await expect(page.locator('text=페이지뷰')).toBeVisible();
    
    // 데이터가 숫자로 표시되는지 확인
    const userCount = await page.locator('text=/[0-9]+/').first().textContent();
    expect(userCount).toMatch(/[0-9]+/);
  });

  test('퍼널 전환율 데이터 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 퍼널 전환율 관련 데이터 확인
    await expect(page.locator('text=전환율')).toBeVisible();
    await expect(page.locator('text=히어로')).toBeVisible();
    await expect(page.locator('text=퀴즈')).toBeVisible();
    
    // 전환율이 퍼센트로 표시되는지 확인
    const conversionRate = await page.locator('text=/[0-9]+%/').first().textContent();
    expect(conversionRate).toMatch(/[0-9]+%/);
  });

  test('스크롤 깊이 데이터 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 스크롤 깊이 데이터 확인
    await expect(page.locator('text=스크롤 깊이')).toBeVisible();
    await expect(page.locator('text=25%')).toBeVisible();
    await expect(page.locator('text=50%')).toBeVisible();
    await expect(page.locator('text=75%')).toBeVisible();
    await expect(page.locator('text=100%')).toBeVisible();
  });

  test('페이지 성능 데이터 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 페이지 성능 데이터 확인
    await expect(page.locator('text=페이지 로드 시간')).toBeVisible();
    await expect(page.locator('text=첫 번째 콘텐츠풀 페인트')).toBeVisible();
    await expect(page.locator('text=최대 콘텐츠풀 페인트')).toBeVisible();
    
    // 성능 데이터가 초 단위로 표시되는지 확인
    const loadTime = await page.locator('text=/[0-9]+s/').first().textContent();
    expect(loadTime).toMatch(/[0-9]+s/);
  });

  test('A/B 테스트 데이터 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // A/B 테스트 관련 데이터 확인
    await expect(page.locator('text=A/B 테스트')).toBeVisible();
    await expect(page.locator('text=live-a')).toBeVisible();
    await expect(page.locator('text=live-b')).toBeVisible();
    
    // 테스트 결과 데이터 확인
    await expect(page.locator('text=전환율')).toBeVisible();
    await expect(page.locator('text=승자')).toBeVisible();
  });

  test('데이터 새로고침 기능 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 새로고침 버튼 클릭
    await page.click('button:has-text("새로고침")');
    
    // 데이터 새로고침 대기
    await page.waitForTimeout(2000);
    
    // 데이터가 업데이트되었는지 확인
    await expect(page.locator('text=실시간 사용자')).toBeVisible();
  });

  test('날짜 범위 변경 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 날짜 범위 버튼들 확인
    await expect(page.locator('button:has-text("오늘")')).toBeVisible();
    await expect(page.locator('button:has-text("이번 주")')).toBeVisible();
    await expect(page.locator('button:has-text("이번 달")')).toBeVisible();
    
    // 이번 주 버튼 클릭
    await page.click('button:has-text("이번 주")');
    await page.waitForLoadState('networkidle');
    
    // 데이터가 변경되었는지 확인
    await expect(page.locator('text=실시간 사용자')).toBeVisible();
  });

  test('API 에러 처리 확인', async ({ page }) => {
    // 퍼널 관리 탭으로 이동
    await page.click('text=퍼널 관리');
    await page.waitForLoadState('networkidle');
    
    // 에러 메시지가 없는지 확인
    await expect(page.locator('text=오류')).not.toBeVisible();
    await expect(page.locator('text=에러')).not.toBeVisible();
    await expect(page.locator('text=Error')).not.toBeVisible();
    
    // 로딩 상태가 해제되었는지 확인
    await expect(page.locator('text=로딩 중')).not.toBeVisible();
  });
});
