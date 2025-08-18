import { test, expect } from '@playwright/test';

test.describe('완전한 관리자 페이지 테스트', () => {
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
    
    // UI 요소 확인
    await expect(page.locator('text=마케팅 관리 시스템')).toBeVisible();
  });

  test('로그인 성공 및 대시보드 확인', async ({ page }) => {
    // 로그인 정보 입력
    await page.fill('input[placeholder="관리자 아이디"]', 'admin');
    await page.fill('input[placeholder="비밀번호"]', '1234');
    
    // 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');
    
    // 대시보드로 이동 확인 (실제 구조에 맞게 수정)
    await expect(page.locator('h2:has-text("대시보드")')).toBeVisible();
    
    // 사이드바 메뉴 확인
    await expect(page.locator('text=대시보드')).toBeVisible();
    await expect(page.locator('text=퍼널 관리')).toBeVisible();
    await expect(page.locator('text=캠페인 관리')).toBeVisible();
    await expect(page.locator('text=예약상담관리')).toBeVisible();
    await expect(page.locator('text=마케팅 콘텐츠')).toBeVisible();
    await expect(page.locator('text=팀 관리')).toBeVisible();
    
    // 대시보드 카드 확인
    await expect(page.locator('text=총 방문자')).toBeVisible();
    await expect(page.locator('text=페이지뷰')).toBeVisible();
    await expect(page.locator('text=전환율')).toBeVisible();
  });

  test('사이드바 네비게이션 테스트', async ({ page }) => {
    // 먼저 로그인
    await page.fill('input[placeholder="관리자 아이디"]', 'admin');
    await page.fill('input[placeholder="비밀번호"]', '1234');
    await page.click('button:has-text("로그인")');
    
    // 각 메뉴 클릭 및 확인
    const menus = [
      { name: '퍼널 관리', expected: '퍼널 관리' },
      { name: '캠페인 관리', expected: '캠페인 관리' },
      { name: '예약상담관리', expected: '예약상담관리' },
      { name: '마케팅 콘텐츠', expected: '마케팅 콘텐츠' },
      { name: '팀 관리', expected: '팀 관리' }
    ];

    for (const menu of menus) {
      await page.click(`text=${menu.name}`);
      await expect(page.locator(`h2:has-text("${menu.expected}")`)).toBeVisible();
    }
  });

  test('사이드바 토글 기능', async ({ page }) => {
    // 로그인
    await page.fill('input[placeholder="관리자 아이디"]', 'admin');
    await page.fill('input[placeholder="비밀번호"]', '1234');
    await page.click('button:has-text("로그인")');
    
    // 모바일에서 사이드바 토글 버튼 클릭 (실제 구조에 맞게 수정)
    await page.click('button:has-text("Menu")');
    
    // 사이드바가 표시되는지 확인
    await expect(page.locator('nav')).toBeVisible();
  });

  test('로그아웃 기능', async ({ page }) => {
    // 로그인
    await page.fill('input[placeholder="관리자 아이디"]', 'admin');
    await page.fill('input[placeholder="비밀번호"]', '1234');
    await page.click('button:has-text("로그인")');
    
    // 로그아웃 버튼 클릭
    await page.click('button:has-text("로그아웃")');
    
    // 로그인 페이지로 돌아가는지 확인
    await expect(page.locator('h1:has-text("MASGOLF Admin")')).toBeVisible();
  });

  test('반응형 디자인 테스트', async ({ page }) => {
    // 모바일 뷰포트로 설정
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 로그인
    await page.fill('input[placeholder="관리자 아이디"]', 'admin');
    await page.fill('input[placeholder="비밀번호"]', '1234');
    await page.click('button:has-text("로그인")');
    
    // 모바일에서 메뉴 버튼이 표시되는지 확인
    await expect(page.locator('button:has-text("Menu")')).toBeVisible();
  });

  test('접근성 테스트', async ({ page }) => {
    // 페이지 로드 후 잠시 대기
    await page.waitForLoadState('networkidle');
    
    // 키보드 네비게이션 테스트
    await page.keyboard.press('Tab');
    await expect(page.locator('input[placeholder="관리자 아이디"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[placeholder="비밀번호"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button:has-text("로그인")')).toBeFocused();
  });
});
