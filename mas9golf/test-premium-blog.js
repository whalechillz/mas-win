const { chromium } = require('playwright');

// 프리미엄 브랜드 블로그 테스트
async function testPremiumBlog() {
  let browser;
  try {
    console.log('🎯 프리미엄 브랜드 블로그 테스트 시작...');
    
    // Chrome Canary 연결
    console.log('🔗 Chrome Canary 연결 중...');
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = await browser.newPage();
    
    // 더 큰 뷰포트 설정
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('✅ Chrome Canary 연결 완료');
    
    // 로컬 블로그 게시물 페이지로 이동
    const blogUrl = 'http://localhost:3000/blog/hot-summer-perfect-swing-royal-salute-gift-event';
    console.log(`\n📄 로컬 블로그 게시물 페이지로 이동: ${blogUrl}`);
    
    await page.goto(blogUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📋 페이지 제목: ${title}`);
    
    // 프리미엄 디자인 요소 확인
    console.log('\n🎨 프리미엄 디자인 요소 확인...');
    
    // 히어로 섹션 확인
    const heroSection = await page.$('.hero-section');
    if (heroSection) {
      console.log('✅ 히어로 섹션 발견');
      
      // 히어로 제목 확인
      const heroTitle = await page.$('.hero-title');
      if (heroTitle) {
        const titleText = await heroTitle.textContent();
        console.log(`  📝 히어로 제목: ${titleText.trim()}`);
      }
      
      // 골드 그라데이션 텍스트 확인
      const goldText = await page.$('.gold-gradient');
      if (goldText) {
        console.log('  ✨ 골드 그라데이션 텍스트 발견');
      }
      
      // CTA 버튼 확인
      const ctaButton = await page.$('.cta-button');
      if (ctaButton) {
        const buttonText = await ctaButton.textContent();
        console.log(`  🔘 CTA 버튼: ${buttonText.trim()}`);
      }
    } else {
      console.log('❌ 히어로 섹션을 찾을 수 없습니다');
    }
    
    // 프리미엄 특징 섹션 확인
    const featuresSection = await page.$('.premium-features-section');
    if (featuresSection) {
      console.log('✅ 프리미엄 특징 섹션 발견');
      
      const featureCards = await page.$$('.premium-card');
      console.log(`  💎 프리미엄 카드: ${featureCards.length}개`);
      
      for (let i = 0; i < featureCards.length; i++) {
        const card = featureCards[i];
        const title = await card.$('.feature-title');
        if (title) {
          const titleText = await title.textContent();
          console.log(`    ${i + 1}. ${titleText.trim()}`);
        }
      }
    } else {
      console.log('❌ 프리미엄 특징 섹션을 찾을 수 없습니다');
    }
    
    // 상담 섹션 확인
    const consultationSection = await page.$('.consultation-section');
    if (consultationSection) {
      console.log('✅ 상담 섹션 발견');
      
      const phoneNumber = await page.$('.phone-number');
      if (phoneNumber) {
        const phoneText = await phoneNumber.textContent();
        console.log(`  📞 전화번호: ${phoneText.trim()}`);
      }
      
      const consultationButtons = await page.$$('.consultation-btn');
      console.log(`  🔘 상담 버튼: ${consultationButtons.length}개`);
    } else {
      console.log('❌ 상담 섹션을 찾을 수 없습니다');
    }
    
    // 갤러리 섹션 확인
    const gallerySection = await page.$('.gallery-section');
    if (gallerySection) {
      console.log('✅ 갤러리 섹션 발견');
      
      const galleryItems = await page.$$('.premium-gallery-item');
      console.log(`  🖼️ 갤러리 아이템: ${galleryItems.length}개`);
      
      for (let i = 0; i < galleryItems.length; i++) {
        const item = galleryItems[i];
        const caption = await item.$('.gallery-caption h4');
        if (caption) {
          const captionText = await caption.textContent();
          console.log(`    ${i + 1}. ${captionText.trim()}`);
        }
      }
    } else {
      console.log('❌ 갤러리 섹션을 찾을 수 없습니다');
    }
    
    // 이미지 로딩 확인
    console.log('\n🖼️ 이미지 로딩 확인...');
    
    const images = await page.$$('img');
    let loadedImages = 0;
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = await img.getAttribute('src');
      const naturalWidth = await img.evaluate(el => el.naturalWidth);
      
      if (naturalWidth > 0) {
        loadedImages++;
        console.log(`  ✅ 이미지 ${i + 1}: ${src} (${naturalWidth}px)`);
      } else {
        console.log(`  ❌ 이미지 ${i + 1}: ${src} (로드 실패)`);
      }
    }
    
    console.log(`📊 이미지 로딩 결과: ${loadedImages}/${images.length}개 성공`);
    
    // 반응형 테스트
    console.log('\n📱 반응형 디자인 테스트...');
    
    // 모바일 테스트
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'mas9golf/premium-blog-mobile-test.png',
      fullPage: true 
    });
    console.log('  ✅ 모바일 스크린샷 저장: mas9golf/premium-blog-mobile-test.png');
    
    // 태블릿 테스트
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'mas9golf/premium-blog-tablet-test.png',
      fullPage: true 
    });
    console.log('  ✅ 태블릿 스크린샷 저장: mas9golf/premium-blog-tablet-test.png');
    
    // 데스크톱 테스트
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'mas9golf/premium-blog-desktop-test.png',
      fullPage: true 
    });
    console.log('  ✅ 데스크톱 스크린샷 저장: mas9golf/premium-blog-desktop-test.png');
    
    // CSS 스타일 확인
    console.log('\n🎨 CSS 스타일 확인...');
    
    const styles = await page.evaluate(() => {
      const heroSection = document.querySelector('.hero-section');
      const featuresSection = document.querySelector('.premium-features-section');
      const consultationSection = document.querySelector('.consultation-section');
      const gallerySection = document.querySelector('.gallery-section');
      
      return {
        heroBackground: heroSection ? window.getComputedStyle(heroSection).background : null,
        featuresBackground: featuresSection ? window.getComputedStyle(featuresSection).background : null,
        consultationBackground: consultationSection ? window.getComputedStyle(consultationSection).background : null,
        galleryBackground: gallerySection ? window.getComputedStyle(gallerySection).background : null
      };
    });
    
    console.log('  🎨 섹션별 배경 스타일:');
    console.log(`    히어로: ${styles.heroBackground ? '적용됨' : '없음'}`);
    console.log(`    특징: ${styles.featuresBackground ? '적용됨' : '없음'}`);
    console.log(`    상담: ${styles.consultationBackground ? '적용됨' : '없음'}`);
    console.log(`    갤러리: ${styles.galleryBackground ? '적용됨' : '없음'}`);
    
    console.log('\n🎉 프리미엄 브랜드 블로그 테스트 완료!');
    console.log('📊 테스트 결과 요약:');
    console.log(`  🎨 히어로 섹션: ${heroSection ? '✅' : '❌'}`);
    console.log(`  💎 프리미엄 특징: ${featuresSection ? '✅' : '❌'}`);
    console.log(`  📞 상담 섹션: ${consultationSection ? '✅' : '❌'}`);
    console.log(`  🖼️ 갤러리 섹션: ${gallerySection ? '✅' : '❌'}`);
    console.log(`  🖼️ 이미지 로딩: ${loadedImages}/${images.length}개 성공`);
    console.log(`  📱 반응형 디자인: 모바일/태블릿/데스크톱 완료`);
    
    if (heroSection && featuresSection && consultationSection && gallerySection) {
      console.log('\n✅ 모든 프리미엄 섹션이 정상적으로 로드되었습니다!');
      console.log('🎯 퍼널 스타일의 고급 브랜드 블로그가 완성되었습니다.');
    } else {
      console.log('\n❌ 일부 프리미엄 섹션이 누락되었습니다.');
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    if (browser) {
      console.log('✨ 브라우저 연결 유지 (수동 확인 가능)');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  testPremiumBlog()
    .then(() => {
      console.log('\n🚀 프리미엄 브랜드 블로그 테스트 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { testPremiumBlog };
