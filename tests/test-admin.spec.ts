import { test, expect } from '@playwright/test';

test.describe('테스트 관리자 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-admin');
  });

  test('로그인 페이지 표시 확인', async ({ page }) => {
    await expect(page.locator('h1:has-text("MASGOLF Admin")')).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("로그인")')).toBeVisible();
  });

  test('로그인 성공', async ({ page }) => {
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("로그인")');
    
    await expect(page.locator('h1:has-text("대시보드")')).toBeVisible();
    await expect(page.locator('text=실시간 사용자')).toBeVisible();
  });

  test('로그인 실패', async ({ page }) => {
    await page.fill('input[type="text"]', 'wrong');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button:has-text("로그인")');
    
    // alert가 나타나는지 확인
    page.on('dialog', dialog => {
      expect(dialog.message()).toBe('잘못된 로그인 정보입니다.');
      dialog.accept();
    });
  });

  test('로그아웃', async ({ page }) => {
    // 먼저 로그인
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("로그인")');
    
    // 로그아웃
    await page.click('button:has-text("로그아웃")');
    
    // 로그인 페이지로 돌아가는지 확인
    await expect(page.locator('h1:has-text("MASGOLF Admin")')).toBeVisible();
  });

  test('대시보드 요소 확인', async ({ page }) => {
    // 먼저 로그인
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("로그인")');
    
    // 대시보드 요소들 확인
    await expect(page.locator('text=실시간 사용자')).toBeVisible();
    await expect(page.locator('text=페이지뷰')).toBeVisible();
    await expect(page.locator('text=전환율')).toBeVisible();
    await expect(page.locator('text=수익')).toBeVisible();
  });
});
