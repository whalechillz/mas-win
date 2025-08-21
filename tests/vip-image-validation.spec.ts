import { test, expect } from '@playwright/test';

test.describe('VIP 이미지 검증 테스트', () => {
  test('VIP 이미지들이 정상적으로 로드되는지 확인', async ({ page }) => {
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
      console.log(`🔍 검증 중: ${imagePath}`);
      
      const response = await page.goto(`http://localhost:3000${imagePath}`);
      expect(response?.status()).toBe(200);
      
      // 이미지가 실제로 로드되는지 확인
      const img = page.locator('img').first();
      await expect(img).toBeVisible();
      
      // 이미지 크기 확인 (너무 작으면 문제)
      const imgElement = await img.elementHandle();
      if (imgElement) {
        const box = await imgElement.boundingBox();
        if (box) {
          console.log(`✅ ${imagePath} - 크기: ${box.width}x${box.height}`);
          
          // 이미지가 너무 작으면 경고
          if (box.width < 100 || box.height < 100) {
            console.log(`⚠️  ${imagePath} - 이미지가 너무 작습니다!`);
          }
        }
      }
    }
  });

  test('VIP 퍼널에서 이미지들이 정상적으로 표시되는지 확인', async ({ page }) => {
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
    }
  });

  test('이미지 품질 검증', async ({ page }) => {
    const imageTests = [
      {
        path: '/campaigns/2025-09/vip-header-senior.jpg',
        expectedWidth: 1920,
        expectedHeight: 1080,
        description: 'VIP 헤더 (시니어)'
      },
      {
        path: '/campaigns/2025-09/vip-header-modern.jpg',
        expectedWidth: 1920,
        expectedHeight: 1080,
        description: 'VIP 헤더 (모던)'
      },
      {
        path: '/campaigns/2025-09/vip-product-gold.jpg',
        expectedWidth: 800,
        expectedHeight: 600,
        description: 'VIP 제품 (골드)'
      },
      {
        path: '/campaigns/2025-09/vip-product-black.jpg',
        expectedWidth: 800,
        expectedHeight: 600,
        description: 'VIP 제품 (블랙)'
      },
      {
        path: '/campaigns/2025-09/vip-product-silver.jpg',
        expectedWidth: 800,
        expectedHeight: 600,
        description: 'VIP 제품 (실버)'
      },
      {
        path: '/campaigns/2025-09/vip-round-senior.jpg',
        expectedWidth: 1080,
        expectedHeight: 1920,
        description: 'VIP 라운드 (시니어)'
      },
      {
        path: '/campaigns/2025-09/vip-round-modern.jpg',
        expectedWidth: 1080,
        expectedHeight: 1920,
        description: 'VIP 라운드 (모던)'
      },
      {
        path: '/campaigns/2025-09/vip-badge-senior.jpg',
        expectedWidth: 400,
        expectedHeight: 400,
        description: 'VIP 배지 (시니어)'
      },
      {
        path: '/campaigns/2025-09/vip-badge-modern.jpg',
        expectedWidth: 400,
        expectedHeight: 400,
        description: 'VIP 배지 (모던)'
      }
    ];

    for (const test of imageTests) {
      console.log(`🔍 품질 검증: ${test.description}`);
      
      await page.goto(`http://localhost:3000${test.path}`);
      
      // 이미지 요소 찾기
      const img = page.locator('img').first();
      await expect(img).toBeVisible();
      
      // 실제 이미지 크기 확인
      const imgElement = await img.elementHandle();
      if (imgElement) {
        const box = await imgElement.boundingBox();
        if (box) {
          console.log(`📏 ${test.description}: ${box.width}x${box.height} (예상: ${test.expectedWidth}x${test.expectedHeight})`);
          
          // 크기가 예상과 많이 다르면 경고
          const widthDiff = Math.abs(box.width - test.expectedWidth);
          const heightDiff = Math.abs(box.height - test.expectedHeight);
          
          if (widthDiff > 100 || heightDiff > 100) {
            console.log(`⚠️  ${test.description} - 크기가 예상과 많이 다릅니다!`);
          }
        }
      }
    }
  });
});
