import { test, expect } from '@playwright/test';

test.describe('VIP 퍼널 테스트', () => {
  test('Dev-01 (시니어) 퍼널이 정상적으로 로드되는지 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/versions/funnel-2025-09-dev-01.html');
    
    // 페이지 제목 확인
    await expect(page.locator('title')).toContainText('MASGOLF VIP 멤버십');
    
    // VIP 헤더 확인
    await expect(page.locator('text=MASGOLF VIP 멤버십')).toBeVisible();
    await expect(page.locator('text=시니어 골퍼를 위한 프리미엄 혜택')).toBeVisible();
    
    // VIP 배지 이미지 확인
    await expect(page.locator('img[src*="vip-badge-senior.jpg"]')).toBeVisible();
    
    // 제품 이미지들 확인
    await expect(page.locator('img[src*="vip-product-gold.jpg"]')).toBeVisible();
    await expect(page.locator('img[src*="vip-product-black.jpg"]')).toBeVisible();
    await expect(page.locator('img[src*="vip-product-silver.jpg"]')).toBeVisible();
    
    // VIP 라운드 이미지 확인
    await expect(page.locator('img[src*="vip-round-senior.jpg"]')).toBeVisible();
    
    // CTA 버튼 확인
    await expect(page.locator('text=VIP 멤버십 상담하기')).toBeVisible();
  });

  test('Dev-02 (모던) 퍼널이 정상적으로 로드되는지 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/versions/funnel-2025-09-dev-02.html');
    
    // 페이지 제목 확인
    await expect(page.locator('title')).toContainText('MASGOLF VIP 멤버십');
    
    // VIP 헤더 확인
    await expect(page.locator('text=MASGOLF VIP 멤버십')).toBeVisible();
    await expect(page.locator('text=40-50대 골퍼를 위한 특별한 혜택')).toBeVisible();
    
    // VIP 배지 이미지 확인
    await expect(page.locator('img[src*="vip-badge-modern.jpg"]')).toBeVisible();
    
    // 제품 이미지들 확인
    await expect(page.locator('img[src*="vip-product-gold.jpg"]')).toBeVisible();
    await expect(page.locator('img[src*="vip-product-black.jpg"]')).toBeVisible();
    await expect(page.locator('img[src*="vip-product-silver.jpg"]')).toBeVisible();
    
    // VIP 라운드 이미지 확인
    await expect(page.locator('img[src*="vip-round-modern.jpg"]')).toBeVisible();
    
    // CTA 버튼 확인
    await expect(page.locator('text=VIP 멤버십 상담하기')).toBeVisible();
  });

  test('VIP 이미지들이 정상적으로 로드되는지 확인', async ({ page }) => {
    // 모든 VIP 이미지들의 접근 가능성 확인
    const vipImages = [
      '/campaigns/2025-09/vip-header-senior.jpg',
      '/campaigns/2025-09/vip-header-modern.jpg',
      '/campaigns/2025-09/vip-product-gold.jpg',
      '/campaigns/2025-09/vip-product-black.jpg',
      '/campaigns/2025-09/vip-product-silver.jpg',
      '/campaigns/2025-09/vip-round-senior.jpg',
      '/campaigns/2025-09/vip-round-modern.jpg',
      '/campaigns/2025-09/vip-badge-senior.jpg',
      '/campaigns/2025-09/vip-badge-modern.jpg'
    ];

    for (const imagePath of vipImages) {
      const response = await page.goto(`http://localhost:3000${imagePath}`);
      expect(response?.status()).toBe(200);
      console.log(`✅ ${imagePath} 정상 로드`);
    }
  });

  test('메인 홈페이지가 정상적으로 작동하는지 확인', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // 메인 페이지 로드 확인
    await expect(page.locator('text=MASGOLF')).toBeVisible();
    await expect(page.locator('text=+30m 비거리 증가')).toBeVisible();
    
    // 8월 퍼널 링크 확인
    await expect(page.locator('a[href="/25-08"]')).toBeVisible();
  });
});
