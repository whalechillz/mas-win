const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const results = {
    homepage: [],
    muziik: []
  };
  
  try {
    console.log('🌐 홈페이지 확인 중...');
    await page.goto('http://localhost:3000/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // 홈페이지의 모든 이미지 수집
    const homepageImages = await page.evaluate(() => {
      const images = [];
      document.querySelectorAll('img').forEach((img, index) => {
        if (img.src && !img.src.startsWith('data:')) {
          images.push({
            index: index + 1,
            src: img.src,
            alt: img.alt || '',
            width: img.naturalWidth,
            height: img.naturalHeight
          });
        }
      });
      return images;
    });
    
    results.homepage = homepageImages;
    console.log(`✅ 홈페이지에서 ${homepageImages.length}개 이미지 발견`);
    
    // MUZIIK 페이지 확인
    console.log('🌐 MUZIIK 페이지 확인 중...');
    await page.goto('http://localhost:3000/muziik', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // MUZIIK 페이지의 모든 이미지 수집
    const muziikImages = await page.evaluate(() => {
      const images = [];
      document.querySelectorAll('img').forEach((img, index) => {
        if (img.src && !img.src.startsWith('data:')) {
          images.push({
            index: index + 1,
            src: img.src,
            alt: img.alt || '',
            width: img.naturalWidth,
            height: img.naturalHeight
          });
        }
      });
      return images;
    });
    
    results.muziik = muziikImages;
    console.log(`✅ MUZIIK 페이지에서 ${muziikImages.length}개 이미지 발견`);
    
    // MUZIIK 하위 페이지들 확인
    const muziikPages = ['product', 'about', 'contact', 'technology'];
    for (const pageName of muziikPages) {
      try {
        console.log(`🌐 MUZIIK ${pageName} 페이지 확인 중...`);
        await page.goto(`http://localhost:3000/muziik/${pageName}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        
        await page.waitForTimeout(2000);
        
        const pageImages = await page.evaluate(() => {
          const images = [];
          document.querySelectorAll('img').forEach((img, index) => {
            if (img.src && !img.src.startsWith('data:')) {
              images.push({
                index: index + 1,
                src: img.src,
                alt: img.alt || '',
                width: img.naturalWidth,
                height: img.naturalHeight
              });
            }
          });
          return images;
        });
        
        results.muziik.push(...pageImages.map(img => ({
          ...img,
          page: pageName
        })));
        console.log(`✅ MUZIIK ${pageName} 페이지에서 ${pageImages.length}개 이미지 발견`);
      } catch (error) {
        console.warn(`⚠️ MUZIIK ${pageName} 페이지 확인 실패:`, error.message);
      }
    }
    
    // 결과 저장
    const outputPath = path.join(__dirname, '..', 'docs', 'image-usage-check-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 결과 저장: ${outputPath}`);
    
    // 요약 출력
    console.log('\n📊 요약:');
    console.log(`홈페이지: ${results.homepage.length}개 이미지`);
    console.log(`MUZIIK: ${results.muziik.length}개 이미지`);
    console.log(`총: ${results.homepage.length + results.muziik.length}개 이미지`);
    
    // Supabase Storage 이미지 필터링
    const supabaseImages = {
      homepage: results.homepage.filter(img => img.src.includes('supabase') || img.src.includes('storage')),
      muziik: results.muziik.filter(img => img.src.includes('supabase') || img.src.includes('storage'))
    };
    
    console.log('\n📦 Supabase Storage 이미지:');
    console.log(`홈페이지: ${supabaseImages.homepage.length}개`);
    console.log(`MUZIIK: ${supabaseImages.muziik.length}개`);
    
    // 이미지 URL 목록 출력
    console.log('\n🏠 홈페이지 Supabase 이미지:');
    supabaseImages.homepage.forEach(img => {
      const fileName = img.src.split('/').pop().split('?')[0];
      console.log(`  - ${fileName}`);
    });
    
    console.log('\n🎵 MUZIIK Supabase 이미지:');
    supabaseImages.muziik.forEach(img => {
      const fileName = img.src.split('/').pop().split('?')[0];
      const pageInfo = img.page ? ` (${img.page})` : '';
      console.log(`  - ${fileName}${pageInfo}`);
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await browser.close();
  }
})();



