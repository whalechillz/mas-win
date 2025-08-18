import { test, expect } from '@playwright/test';

test.describe('간단한 관리자 페이지 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 관리자 페이지로 이동
    await page.goto('/admin');
  });

  test('로그인 페이지 표시 확인', async ({ page }) => {
    // 로그인 폼이 표시되는지 확인
    await expect(page.locator('h1:has-text("MASGOLF Admin")')).toBeVisible();
    await expect(page.locator('input[placeholder="관리자 아이디"]')).toBeVisible();
    await expect(page.locator('input[placeholder="비밀번호"]')).toBeVisible();
    await expect(page.locator('button:has-text("로그인")')).toBeVisible();
  });

  test('로그인 성공 확인', async ({ page }) => {
    // 로그인 정보 입력
    await page.fill('input[placeholder="관리자 아이디"]', 'admin');
    await page.fill('input[placeholder="비밀번호"]', '1234');
    
    // 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');
    
    // 로그인 성공 후 대시보드 제목 확인
    await expect(page.locator('h2:has-text("대시보드")')).toBeVisible();
    
    // 대시보드 카드 확인
    await expect(page.locator('text=총 방문자')).toBeVisible();
    await expect(page.locator('text=페이지뷰')).toBeVisible();
  });

  test('로그아웃 기능 확인', async ({ page }) => {
    // 로그인
    await page.fill('input[placeholder="관리자 아이디"]', 'admin');
    await page.fill('input[placeholder="비밀번호"]', '1234');
    await page.click('button:has-text("로그인")');
    
    // 로그아웃 버튼 클릭
    await page.click('button:has-text("로그아웃")');
    
    // 로그인 페이지로 돌아가는지 확인
    await expect(page.locator('h1:has-text("MASGOLF Admin")')).toBeVisible();
  });
});
