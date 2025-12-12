import { test, expect } from '@playwright/test';

test.describe('설문 조사 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 설문 랜딩 페이지로 이동
    await page.goto('/survey');
  });

  test('설문 조사 전체 플로우', async ({ page }) => {
    // 1. 설문 랜딩 페이지 확인
    await expect(page.locator('h1')).toContainText(/MASSGOO.*MUZIIK/i);
    await expect(page.locator('text=설문 조사만 해도').first()).toBeVisible();
    
    // 2. "설문 조사 시작하기" 버튼 클릭
    await page.click('text=설문 조사 시작하기');
    await page.waitForURL(/\/survey\/form/);
    
    // 3. Step 1: 기본 정보 입력
    await expect(page.locator('h2:has-text("기본 정보")')).toBeVisible();
    
    // 이름 입력
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('테스트 사용자');
    
    // 전화번호 입력
    const phoneInput = page.locator('input[type="tel"]').first();
    await phoneInput.fill('010-1234-5678');
    
    // 나이 입력
    const ageInput = page.locator('input[type="number"]').first();
    await ageInput.fill('35');
    
    // 다음 버튼 클릭
    await page.click('button:has-text("다음")');
    await page.waitForTimeout(1000);
    
    // 4. Step 2: 설문 응답
    await expect(page.locator('h2:has-text("설문 응답")')).toBeVisible();
    
    // 모델 선택 (첫 번째 옵션 - label 클릭)
    const firstModelLabel = page.locator('label').filter({ hasText: /베릴|사파이어/ }).first();
    if (await firstModelLabel.isVisible({ timeout: 5000 })) {
      await firstModelLabel.click();
      await page.waitForTimeout(500);
    } else {
      // 대체: 라디오 버튼 직접 클릭
      const firstModelOption = page.locator('input[type="radio"][name="model"]').first();
      await firstModelOption.click({ force: true });
      await page.waitForTimeout(500);
    }
    
    // 중요 요소 선택 (비거리, 방향성 - label 클릭)
    const distanceLabel = page.locator('label').filter({ hasText: '비거리' }).first();
    const directionLabel = page.locator('label').filter({ hasText: '방향성' }).first();
    
    if (await distanceLabel.isVisible({ timeout: 3000 })) {
      await distanceLabel.click();
    }
    if (await directionLabel.isVisible({ timeout: 3000 })) {
      await directionLabel.click();
    }
    await page.waitForTimeout(500);
    
    // 다음 버튼 클릭
    await page.click('button:has-text("다음")');
    await page.waitForTimeout(1000);
    
    // 5. Step 3: 추가 정보
    await expect(page.locator('h2:has-text("추가 정보")')).toBeVisible();
    
    // 주소 입력
    const addressTextarea = page.locator('textarea').last();
    await addressTextarea.fill('서울시 강남구 테헤란로 123');
    
    // 제출 버튼 클릭
    await page.click('button:has-text("제출하기")');
    
    // 6. 완료 페이지 확인
    await page.waitForURL(/\/survey\/success/, { timeout: 15000 });
    // 성공 페이지의 주요 텍스트 확인
    await expect(page.locator('h1:has-text("설문이 완료되었습니다")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=참여해주셔서 감사합니다')).toBeVisible({ timeout: 5000 });
  });

  test('설문 랜딩 페이지 CTA 버튼 확인', async ({ page }) => {
    // 제품보기 버튼 확인
    const productButton = page.locator('a:has-text("제품보기 (PRO3 MUZIIK")');
    await expect(productButton).toBeVisible();
    await expect(productButton).toHaveAttribute('href', '/products/pro3-muziik');
    
    // 전화 상담 버튼 확인
    const phoneButton = page.locator('a[href^="tel:"]');
    await expect(phoneButton).toBeVisible();
  });

  test('설문 폼 유효성 검사', async ({ page }) => {
    await page.goto('/survey/form');
    
    // 빈 상태로 다음 버튼 클릭 시도
    await page.click('button:has-text("다음")');
    
    // 에러 메시지 확인 (이름, 전화번호, 나이 중 하나라도 표시되어야 함)
    const errorMessage = page.locator('.bg-red-50, .text-red-700').first();
    await expect(errorMessage).toBeVisible();
  });

  test('설문 진행률 표시 확인', async ({ page }) => {
    await page.goto('/survey/form');
    
    // 진행률 표시 확인
    await expect(page.locator('text=1 / 3')).toBeVisible();
    await expect(page.locator('text=33%')).toBeVisible();
    
    // Step 1 완료 후 진행률 확인
    await page.fill('input[type="text"]', '테스트');
    await page.fill('input[type="tel"]', '010-1234-5678');
    await page.fill('input[type="number"]', '35');
    await page.click('button:has-text("다음")');
    
    await expect(page.locator('text=2 / 3')).toBeVisible();
    await expect(page.locator('text=67%')).toBeVisible();
  });
});

