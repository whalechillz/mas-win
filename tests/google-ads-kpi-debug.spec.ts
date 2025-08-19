import { test, expect } from '@playwright/test';

test.describe('Google Ads KPI 데이터 진단', () => {
  test('관리자 페이지 로그인 및 Google Ads KPI 확인', async ({ page }) => {
    // 관리자 페이지 접속
    await page.goto('http://localhost:3000/admin');
    
    // 로그인 폼 확인
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // 사용자명 입력 (필요한 경우)
    await page.fill('input[type="text"]', 'admin');
    
    // 비밀번호 입력
    await page.fill('input[type="password"]', '1234');
    
    // 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');
    
    // 로그인 후 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // 로그인 성공 확인
    console.log('로그인 후 페이지 URL:', page.url());
    console.log('로그인 후 페이지 제목:', await page.title());
    
    // 로그인 성공 여부 확인 (로그아웃 버튼이 있으면 성공)
    const logoutButton = page.locator('text=로그아웃');
    const logoutCount = await logoutButton.count();
    
    if (logoutCount > 0) {
      console.log('로그인 성공! 로그아웃 버튼 발견');
      
      // Google Ads 관련 텍스트 검색
      const googleAdsTexts = [
        'Google Ads',
        'Google Ads 캠페인',
        'Google Ads KPI',
        '캠페인 KPI',
        '광고 캠페인',
        'Ads',
        'KPI'
      ];
      
      for (const text of googleAdsTexts) {
        const element = page.locator(`text=${text}`);
        const count = await element.count();
        if (count > 0) {
          console.log(`찾은 텍스트: "${text}" (${count}개)`);
        }
      }
      
      // 모든 텍스트 요소 확인
      const allTexts = await page.locator('body').textContent();
      console.log('페이지에 포함된 주요 텍스트:', allTexts?.substring(0, 1000));
      
    } else {
      console.log('로그인 실패 또는 로그아웃 버튼을 찾을 수 없음');
      
      // 현재 페이지 내용 확인
      const pageContent = await page.content();
      console.log('현재 페이지 내용 일부:', pageContent.substring(0, 500));
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'admin-page-content.png', fullPage: true });
  });

  test('Google Ads API 엔드포인트 확인', async ({ page }) => {
    // Google Ads API 직접 호출
    const response = await page.request.get('http://localhost:3000/api/google-ads/campaigns');
    
    console.log('Google Ads API 응답 상태:', response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      console.log('Google Ads API 응답 데이터:', JSON.stringify(data, null, 2));
      
      // 데이터 소스 확인
      expect(data.dataSource).toBeDefined();
      console.log('데이터 소스:', data.dataSource);
      
      // 캠페인 데이터 확인
      if (data.campaigns && data.campaigns.length > 0) {
        console.log('첫 번째 캠페인:', data.campaigns[0]);
      }
    }
  });

  test('환경 변수 확인', async ({ page }) => {
    // 환경 변수 확인 API 호출
    const response = await page.request.get('http://localhost:3000/api/debug/env-check');
    
    if (response.status() === 200) {
      const data = await response.json();
      console.log('환경 변수 상태:', JSON.stringify(data, null, 2));
    }
  });
});
