const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 ID 309 게시물의 "시크리트웨폰 4-1 이미지" 확인 시작...\n');

    // 1. 블로그 상세 페이지로 직접 이동
    console.log('1️⃣ 블로그 상세 페이지로 이동...');
    await page.goto('http://localhost:3000/blog/fall-golf-special-masgolf-driver-whiskey');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('✅ 페이지 로드 완료\n');

    // 2. "시크리트웨폰 4-1" 이미지 찾기
    console.log('2️⃣ "시크리트웨폰 4-1" 이미지 찾기...');
    
    const imageInfo = await page.evaluate(() => {
      const article = document.querySelector('article');
      if (!article) return null;
      
      const prose = article.querySelector('.prose');
      if (!prose) return null;
      
      // 모든 이미지 찾기
      const images = Array.from(prose.querySelectorAll('img'));
      
      // "시크리트웨폰 4-1" 관련 이미지 찾기
      const weapon4_1Images = images.filter(img => {
        const alt = img.alt || '';
        const src = img.src || '';
        return alt.includes('시크리트웨폰') || 
               alt.includes('4-1') || 
               alt.includes('웨폰') ||
               src.includes('weapon-4-1') ||
               src.includes('secret-weapon');
      });
      
      // 모든 이미지 정보 수집
      const allImages = images.map((img, i) => ({
        index: i + 1,
        src: img.src,
        alt: img.alt || '(없음)',
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        outerHTML: img.outerHTML.substring(0, 200)
      }));
      
      return {
        totalImages: images.length,
        weapon4_1Images: weapon4_1Images.map((img, i) => ({
          index: images.indexOf(img) + 1,
          src: img.src,
          alt: img.alt || '(없음)',
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          outerHTML: img.outerHTML.substring(0, 200)
        })),
        allImages
      };
    });

    if (!imageInfo) {
      console.error('❌ 본문을 찾을 수 없습니다');
      return;
    }

    console.log(`📊 전체 이미지 개수: ${imageInfo.totalImages}개`);
    console.log(`📸 "시크리트웨폰 4-1" 관련 이미지: ${imageInfo.weapon4_1Images.length}개\n`);

    if (imageInfo.weapon4_1Images.length > 0) {
      console.log('📸 "시크리트웨폰 4-1" 이미지 상세:');
      imageInfo.weapon4_1Images.forEach((img, i) => {
        console.log(`\n--- 이미지 ${i + 1} ---`);
        console.log(`  인덱스: ${img.index}`);
        console.log(`  URL: ${img.src}`);
        console.log(`  Alt: ${img.alt}`);
        console.log(`  로드 완료: ${img.complete}`);
        console.log(`  크기: ${img.naturalWidth}x${img.naturalHeight}`);
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
          console.log('  ⚠️ 이미지가 로드되지 않음!');
        }
        console.log(`  HTML: ${img.outerHTML}...`);
        
        // URL에서 파일 경로 추출
        const urlMatch = img.src.match(/\/blog-images\/(.+)$/);
        if (urlMatch) {
          const imagePath = urlMatch[1].split('?')[0];
          console.log(`  경로: ${imagePath}`);
        }
      });
      console.log('');
    } else {
      console.log('⚠️ "시크리트웨폰 4-1" 이미지를 찾을 수 없습니다\n');
    }

    // 3. 모든 이미지 목록 출력
    console.log('📋 모든 이미지 목록:');
    imageInfo.allImages.forEach((img) => {
      console.log(`\n--- 이미지 ${img.index} ---`);
      console.log(`  URL: ${img.src}`);
      console.log(`  Alt: ${img.alt}`);
      console.log(`  로드 완료: ${img.complete}`);
      console.log(`  크기: ${img.naturalWidth}x${img.naturalHeight}`);
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        console.log('  ⚠️ 이미지가 로드되지 않음!');
      }
    });
    console.log('');

    // 4. 깨진 이미지 메시지 확인
    console.log('4️⃣ 깨진 이미지 메시지 확인...');
    const brokenMessages = await page.evaluate(() => {
      const article = document.querySelector('article');
      if (!article) return [];
      
      const prose = article.querySelector('.prose');
      if (!prose) return [];
      
      return Array.from(prose.querySelectorAll('p')).filter(p => 
        p.textContent.includes('이미지 링크가 손상') || 
        p.textContent.includes('이미지를 불러올 수 없') ||
        p.textContent.includes('손상되었습니다')
      ).map(p => ({
        text: p.textContent,
        html: p.outerHTML
      }));
    });

    if (brokenMessages.length > 0) {
      console.log(`⚠️ 깨진 이미지 메시지: ${brokenMessages.length}개`);
      brokenMessages.forEach((msg, i) => {
        console.log(`\n--- 메시지 ${i + 1} ---`);
        console.log(`  텍스트: ${msg.text}`);
        console.log(`  HTML: ${msg.html}`);
      });
      console.log('');
    } else {
      console.log('✅ 깨진 이미지 메시지 없음\n');
    }

    // 5. 스크린샷 저장
    await page.screenshot({ path: 'test-blog-309-weapon4-1.png', fullPage: true });
    console.log('📸 스크린샷 저장: test-blog-309-weapon4-1.png');

    console.log('\n✅ 확인 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'test-blog-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();



