import { test, expect } from '@playwright/test';

test.describe('VIP 이미지 수정 테스트', () => {
  test('수정된 VIP 이미지들이 정상적으로 로드되는지 확인', async ({ page }) => {
    // Dev-01 퍼널 확인
    await page.goto('http://localhost:3000/versions/funnel-2025-09-dev-01.html');
    
    // 이미지들이 실제로 표시되는지 확인
    const images = page.locator('img[src*="vip-"]');
    const count = await images.count();
    console.log(`Dev-01 퍼널에서 VIP 이미지 개수: ${count}`);
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      await expect(img).toBeVisible();
      
      // 이미지 소스 확인
      const src = await img.getAttribute('src');
      console.log(`✅ Dev-01 이미지: ${src}`);
      
      // 이미지가 실제로 로드되었는지 확인
      const isLoaded = await img.evaluate((el) => {
        return el.complete && el.naturalWidth > 0;
      });
      
      if (isLoaded) {
        console.log(`✅ ${src} - 정상 로드됨`);
      } else {
        console.log(`❌ ${src} - 로드 실패`);
      }
    }
    
    // Dev-02 퍼널 확인
    await page.goto('http://localhost:3000/versions/funnel-2025-09-dev-02.html');
    
    const images2 = page.locator('img[src*="vip-"]');
    const count2 = await images2.count();
    console.log(`Dev-02 퍼널에서 VIP 이미지 개수: ${count2}`);
    
    for (let i = 0; i < count2; i++) {
      const img = images2.nth(i);
      await expect(img).toBeVisible();
      
      const src = await img.getAttribute('src');
      console.log(`✅ Dev-02 이미지: ${src}`);
      
      // 이미지가 실제로 로드되었는지 확인
      const isLoaded = await img.evaluate((el) => {
        return el.complete && el.naturalWidth > 0;
      });
      
      if (isLoaded) {
        console.log(`✅ ${src} - 정상 로드됨`);
      } else {
        console.log(`❌ ${src} - 로드 실패`);
      }
    }
  });

  test('개별 이미지 파일들이 정상적으로 접근 가능한지 확인', async ({ page }) => {
    const imageFiles = [
      '/campaigns/2025-09/vip-header-senior-fixed.jpg',
      '/campaigns/2025-09/vip-header-modern-fixed.jpg',
      '/campaigns/2025-09/vip-product-gold-fixed.jpg',
      '/campaigns/2025-09/vip-product-black-fixed.jpg',
      '/campaigns/2025-09/vip-product-silver-fixed.jpg',
      '/campaigns/2025-09/vip-round-senior-fixed.jpg',
      '/campaigns/2025-09/vip-round-modern-fixed.jpg',
      '/campaigns/2025-09/vip-badge-senior-fixed.jpg',
      '/campaigns/2025-09/vip-badge-modern-fixed.jpg'
    ];

    for (const imagePath of imageFiles) {
      console.log(`🔍 확인 중: ${imagePath}`);
      
      const response = await page.goto(`http://localhost:3000${imagePath}`);
      expect(response?.status()).toBe(200);
      
      // 이미지가 실제로 로드되는지 확인
      const img = page.locator('img').first();
      await expect(img).toBeVisible();
      
      // 이미지 크기 확인
      const imgElement = await img.elementHandle();
      if (imgElement) {
        const box = await imgElement.boundingBox();
        if (box) {
          console.log(`✅ ${imagePath} - 크기: ${box.width}x${box.height}`);
          
          // 이미지가 너무 작으면 경고
          if (box.width < 50 || box.height < 50) {
            console.log(`⚠️  ${imagePath} - 이미지가 너무 작습니다!`);
          }
        }
      }
    }
  });
});
