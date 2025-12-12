import { Page } from '@playwright/test';

/**
 * 관리자 로그인 헬퍼 함수
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  
  // 로그인 폼 대기
  await page.waitForSelector('input[type="text"], input[name="login"]');
  
  // 로그인 정보 입력 (NextAuth 사용 시)
  const loginInput = page.locator('input[type="text"], input[name="login"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  
  await loginInput.fill('admin');
  await passwordInput.fill(process.env.ADMIN_PASSWORD || 'password');
  
  // 로그인 버튼 클릭
  await page.click('button[type="submit"]');
  
  // 로그인 완료 대기 (관리자 페이지로 리다이렉트)
  await page.waitForURL(/\/admin/, { timeout: 10000 });
}

