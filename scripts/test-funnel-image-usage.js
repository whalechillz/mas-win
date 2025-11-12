const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const results = {};
  const funnelPages = [
    { url: '/25-05', month: '2025-05' },
    { url: '/25-06', month: '2025-06' },
    { url: '/25-07', month: '2025-07' },
    { url: '/25-08', month: '2025-08' },
    { url: '/25-09', month: '2025-09' },
  ];
  
  try {
    for (const funnel of funnelPages) {
      console.log(`🌐 ${funnel.url} 확인 중...`);
      
      try {
        await page.goto(`http://localhost:3000${funnel.url}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        
        await page.waitForTimeout(3000);
        
        // iframe 내부의 이미지 확인
        const iframe = page.frameLocator('iframe');
        const images = await iframe.locator('img').all();
        
        const imageUrls = [];
        for (const img of images) {
          try {
            const src = await img.getAttribute('src');
            if (src && (src.includes('campaigns') || src.includes('supabase') || src.includes('storage'))) {
              imageUrls.push(src);
            }
          } catch (e) {
            // 이미지 로드 실패 무시
          }
        }
        
        // background-image도 확인
        const elements = await iframe.locator('*').all();
        for (const el of elements) {
          try {
            const bgImage = await el.evaluate(el => {
              const style = window.getComputedStyle(el);
              return style.backgroundImage;
            });
            if (bgImage && bgImage !== 'none' && (bgImage.includes('campaigns') || bgImage.includes('supabase'))) {
              const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
              if (urlMatch) {
                imageUrls.push(urlMatch[1]);
              }
            }
          } catch (e) {
            // 무시
          }
        }
        
        results[funnel.url] = {
          month: funnel.month,
          images: [...new Set(imageUrls)],
          count: imageUrls.length
        };
        
        console.log(`✅ ${funnel.url}: ${imageUrls.length}개 이미지 발견`);
        imageUrls.forEach(img => console.log(`   - ${img}`));
        console.log('');
        
      } catch (error) {
        console.warn(`⚠️ ${funnel.url} 확인 실패:`, error.message);
        results[funnel.url] = {
          month: funnel.month,
          images: [],
          count: 0,
          error: error.message
        };
      }
    }
    
    // 결과 저장
    const outputPath = path.join(__dirname, '..', 'docs', 'funnel-pages-playwright-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 결과 저장: ${outputPath}`);
    
    // 통계
    const totalImages = Object.values(results).reduce((sum, r) => sum + (r.count || 0), 0);
    console.log(`\n📊 통계:`);
    console.log(`   확인된 퍼널 페이지: ${Object.keys(results).length}개`);
    console.log(`   총 이미지: ${totalImages}개`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await browser.close();
  }
})();



