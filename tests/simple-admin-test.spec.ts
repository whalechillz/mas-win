import { test, expect } from '@playwright/test';

test.describe('관리자 페이지 내용 확인', () => {
  test('관리자 페이지 로그인 및 내용 확인', async ({ page }) => {
    // 관리자 페이지로 이동
    await page.goto('http://localhost:3000/admin');
    
    // 로그인
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', '1234');
    await page.click('button[type="submit"]');
    
    // 로그인 후 대기
    await page.waitForLoadState('networkidle');
    
    // 페이지 내용 확인
    const pageContent = await page.content();
    console.log('페이지 제목:', await page.title());
    
    // 퍼널 관리 탭이 있는지 확인
    const funnelTab = page.locator('text=퍼널 관리');
    if (await funnelTab.isVisible()) {
      console.log('퍼널 관리 탭 발견');
      await funnelTab.click();
      
      // 모든 버튼 확인
      const allButtons = page.locator('button');
      const buttonCount = await allButtons.count();
      console.log('총 버튼 개수:', buttonCount);
      
      for (let i = 0; i < buttonCount; i++) {
        const buttonText = await allButtons.nth(i).textContent();
        console.log(`버튼 ${i}:`, buttonText);
      }
      
      // 월 버튼들 확인
      const monthButtons = page.locator('button').filter({ hasText: /2025/ });
      const monthButtonCount = await monthButtons.count();
      console.log('2025년 월 버튼 개수:', monthButtonCount);
      
      for (let i = 0; i < monthButtonCount; i++) {
        const buttonText = await monthButtons.nth(i).textContent();
        console.log(`월 버튼 ${i}:`, buttonText);
      }
      
      // 페이지의 모든 텍스트 확인
      const allText = await page.locator('body').textContent();
      console.log('페이지 전체 텍스트:', allText?.substring(0, 2000));
      
    } else {
      console.log('퍼널 관리 탭을 찾을 수 없음');
    }
  });
});
