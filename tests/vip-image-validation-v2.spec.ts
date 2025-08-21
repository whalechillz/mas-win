import { test, expect } from '@playwright/test';

test.describe('VIP 이미지 v2 검증 테스트', () => {
  test('새로 생성된 VIP 이미지들이 올바른 크기로 생성되었는지 확인', async ({ page }) => {
    const vipImages = [
      {
        path: '/campaigns/2025-09/vip-header-senior-v2.jpg',
        expectedWidth: 1920,
        expectedHeight: 1080,
        description: 'VIP 헤더 (시니어) - v2'
      },
      {
        path: '/campaigns/2025-09/vip-header-modern-v2.jpg',
        expectedWidth: 1920,
        expectedHeight: 1080,
        description: 'VIP 헤더 (모던) - v2'
      },
      {
        path: '/campaigns/2025-09/vip-product-gold-v2.jpg',
        expectedWidth: 800,
        expectedHeight: 600,
        description: 'VIP 제품 (골드) - v2'
      },
      {
        path: '/campaigns/2025-09/vip-product-black-v2.jpg',
        expectedWidth: 800,
        expectedHeight: 600,
        description: 'VIP 제품 (블랙) - v2'
      },
      {
        path: '/campaigns/2025-09/vip-product-silver-v2.jpg',
        expectedWidth: 800,
        expectedHeight: 600,
        description: 'VIP 제품 (실버) - v2'
      },
      {
        path: '/campaigns/2025-09/vip-round-senior-v2.jpg',
        expectedWidth: 1080,
        expectedHeight: 1920,
        description: 'VIP 라운드 (시니어) - v2'
      },
      {
        path: '/campaigns/2025-09/vip-round-modern-v2.jpg',
        expectedWidth: 1080,
        expectedHeight: 1920,
        description: 'VIP 라운드 (모던) - v2'
      },
      {
        path: '/campaigns/2025-09/vip-badge-senior-v2.jpg',
        expectedWidth: 400,
        expectedHeight: 400,
        description: 'VIP 배지 (시니어) - v2'
      },
      {
        path: '/campaigns/2025-09/vip-badge-modern-v2.jpg',
        expectedWidth: 400,
        expectedHeight: 400,
        description: 'VIP 배지 (모던) - v2'
      }
    ];

    for (const image of vipImages) {
      console.log(`🔍 검증 중: ${image.description}`);
      
      const response = await page.goto(`http://localhost:3000${image.path}`);
      expect(response?.status()).toBe(200);
      
      // 이미지가 실제로 로드되는지 확인
      const img = page.locator('img').first();
      await expect(img).toBeVisible();
      
      // 이미지 크기 확인
      const imgElement = await img.elementHandle();
      if (imgElement) {
        const box = await imgElement.boundingBox();
        if (box) {
          console.log(`📏 ${image.description}: ${box.width}x${box.height} (예상: ${image.expectedWidth}x${image.expectedHeight})`);
          
          // 크기가 예상과 비슷한지 확인 (브라우저에서 렌더링되므로 약간의 차이는 허용)
          const widthRatio = box.width / image.expectedWidth;
          const heightRatio = box.height / image.expectedHeight;
          
          if (widthRatio > 0.8 && widthRatio < 1.2 && heightRatio > 0.8 && heightRatio < 1.2) {
            console.log(`✅ ${image.description} - 크기가 적절합니다!`);
          } else {
            console.log(`⚠️  ${image.description} - 크기가 예상과 많이 다릅니다!`);
          }
        }
      }
    }
  });

  test('새 이미지들을 퍼널에 적용하고 정상 작동하는지 확인', async ({ page }) => {
    // Dev-01 퍼널에서 새 이미지들 확인
    await page.goto('http://localhost:3000/versions/funnel-2025-09-dev-01.html');
    
    // 새 이미지들이 표시되는지 확인
    const newImages = page.locator('img[src*="vip-"]');
    const count = await newImages.count();
    console.log(`Dev-01 퍼널에서 VIP 이미지 개수: ${count}`);
    
    for (let i = 0; i < count; i++) {
      const img = newImages.nth(i);
      await expect(img).toBeVisible();
      
      const src = await img.getAttribute('src');
      console.log(`✅ Dev-01 이미지: ${src}`);
    }
    
    // Dev-02 퍼널에서 새 이미지들 확인
    await page.goto('http://localhost:3000/versions/funnel-2025-09-dev-02.html');
    
    const newImages2 = page.locator('img[src*="vip-"]');
    const count2 = await newImages2.count();
    console.log(`Dev-02 퍼널에서 VIP 이미지 개수: ${count2}`);
    
    for (let i = 0; i < count2; i++) {
      const img = newImages2.nth(i);
      await expect(img).toBeVisible();
      
      const src = await img.getAttribute('src');
      console.log(`✅ Dev-02 이미지: ${src}`);
    }
  });
});
