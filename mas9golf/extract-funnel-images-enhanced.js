const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// 7월 퍼널 페이지에서 이미지 추출 (향상된 버전)
async function extractFunnelImagesEnhanced() {
  let browser;
  try {
    console.log('🎯 7월 퍼널 페이지 이미지 추출 시작 (향상된 버전)...');
    
    // Chrome Canary 연결
    console.log('🔗 Chrome Canary 연결 중...');
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = await browser.newPage();
    
    // 더 큰 뷰포트 설정
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('✅ Chrome Canary 연결 완료');
    
    // 퍼널 페이지로 이동
    const funnelUrl = 'https://www.masgolf.co.kr/25-07';
    console.log(`\n📄 퍼널 페이지로 이동: ${funnelUrl}`);
    
    await page.goto(funnelUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // 페이지 로딩 대기 (더 긴 시간)
    console.log('⏳ 페이지 로딩 대기 중...');
    await page.waitForTimeout(10000);
    
    // 네트워크가 안정될 때까지 대기
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📋 페이지 제목: ${title}`);
    
    // 페이지 HTML 확인
    const html = await page.content();
    console.log(`📄 페이지 HTML 길이: ${html.length}자`);
    
    // 모든 이미지 요소 찾기 (더 포괄적으로)
    console.log('\n🖼️ 이미지 요소 분석 중...');
    
    const images = await page.$$('img, [style*="background-image"], [style*="background:"]');
    console.log(`📊 발견된 이미지 관련 요소: ${images.length}개`);
    
    // CSS 배경 이미지도 찾기
    const backgroundImages = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const bgImages = [];
      
      elements.forEach((el, index) => {
        const style = window.getComputedStyle(el);
        const bgImage = style.backgroundImage;
        
        if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
          const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (urlMatch) {
            bgImages.push({
              index: index,
              element: el.tagName,
              className: el.className,
              backgroundImage: urlMatch[1]
            });
          }
        }
      });
      
      return bgImages;
    });
    
    console.log(`📊 CSS 배경 이미지: ${backgroundImages.length}개`);
    
    // 이미지 정보 수집
    const imageData = [];
    
    // 일반 img 태그들
    for (let i = 0; i < images.length; i++) {
      try {
        const img = images[i];
        const tagName = await img.evaluate(el => el.tagName);
        
        if (tagName === 'IMG') {
          const src = await img.getAttribute('src');
          const alt = await img.getAttribute('alt') || `이미지 ${i + 1}`;
          const naturalWidth = await img.evaluate(el => el.naturalWidth);
          const naturalHeight = await img.evaluate(el => el.naturalHeight);
          
          if (src && naturalWidth > 50 && naturalHeight > 50) {
            imageData.push({
              type: 'img',
              index: i + 1,
              src: src,
              alt: alt,
              width: naturalWidth,
              height: naturalHeight,
              size: `${naturalWidth}x${naturalHeight}`
            });
            
            console.log(`  🖼️ IMG ${i + 1}: ${alt} (${naturalWidth}x${naturalHeight})`);
            console.log(`    📁 경로: ${src}`);
          }
        }
      } catch (error) {
        console.log(`  ❌ 이미지 ${i + 1} 분석 실패: ${error.message}`);
      }
    }
    
    // CSS 배경 이미지들
    backgroundImages.forEach((bgImg, index) => {
      imageData.push({
        type: 'background',
        index: images.length + index + 1,
        src: bgImg.backgroundImage,
        alt: `배경 이미지 ${index + 1}`,
        element: bgImg.element,
        className: bgImg.className,
        width: 'unknown',
        height: 'unknown',
        size: 'unknown'
      });
      
      console.log(`  🎨 배경 ${index + 1}: ${bgImg.element} (${bgImg.className})`);
      console.log(`    📁 경로: ${bgImg.backgroundImage}`);
    });
    
    console.log(`\n📊 총 유효한 이미지: ${imageData.length}개`);
    
    // 이미지 다운로드 디렉토리 생성
    const downloadDir = path.join(__dirname, '../public/mas9golf/funnel-images');
    await fs.mkdir(downloadDir, { recursive: true });
    
    // 이미지 다운로드
    console.log('\n⬇️ 이미지 다운로드 시작...');
    
    for (const imgData of imageData) {
      try {
        let imageUrl = imgData.src;
        
        // 상대 경로를 절대 경로로 변환
        if (imageUrl.startsWith('/')) {
          imageUrl = 'https://www.masgolf.co.kr' + imageUrl;
        } else if (imageUrl.startsWith('./') || !imageUrl.startsWith('http')) {
          imageUrl = 'https://www.masgolf.co.kr/' + imageUrl;
        }
        
        console.log(`  📥 다운로드 시도: ${imageUrl}`);
        
        const response = await page.goto(imageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        if (response && response.ok()) {
          const buffer = await response.body();
          
          // 파일 확장자 추출
          const url = new URL(imageUrl);
          const pathname = url.pathname;
          let ext = path.extname(pathname);
          
          // Content-Type에서 확장자 추출
          if (!ext) {
            const contentType = response.headers()['content-type'];
            if (contentType) {
              if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
              else if (contentType.includes('png')) ext = '.png';
              else if (contentType.includes('gif')) ext = '.gif';
              else if (contentType.includes('webp')) ext = '.webp';
              else ext = '.jpg';
            } else {
              ext = '.jpg';
            }
          }
          
          // 파일명 생성
          const filename = `funnel-${imgData.type}-${imgData.index}${ext}`;
          const filepath = path.join(downloadDir, filename);
          
          await fs.writeFile(filepath, buffer);
          
          console.log(`  ✅ 다운로드 완료: ${filename} (${buffer.length} bytes)`);
          
          // 이미지 데이터에 로컬 경로 추가
          imgData.localPath = `/mas9golf/funnel-images/${filename}`;
          imgData.downloaded = true;
          imgData.fileSize = buffer.length;
          
        } else {
          console.log(`  ❌ 다운로드 실패: HTTP ${response ? response.status() : 'No response'}`);
          imgData.downloaded = false;
        }
        
      } catch (error) {
        console.log(`  ❌ 다운로드 실패: ${imgData.src} - ${error.message}`);
        imgData.downloaded = false;
        imgData.error = error.message;
      }
    }
    
    // 이미지 메타데이터 저장
    const metadataPath = path.join(__dirname, '../mas9golf/funnel-images-metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(imageData, null, 2), 'utf8');
    
    console.log(`\n💾 이미지 메타데이터 저장: ${metadataPath}`);
    
    // 퍼널 페이지의 텍스트 콘텐츠 추출
    console.log('\n📝 퍼널 페이지 텍스트 콘텐츠 추출...');
    
    const pageContent = await page.evaluate(() => {
      const content = {
        title: document.title,
        url: window.location.href,
        headings: [],
        paragraphs: [],
        buttons: [],
        phoneNumbers: [],
        allText: document.body.textContent.trim()
      };
      
      // 제목들 추출
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach(h => {
        const text = h.textContent.trim();
        if (text) {
          content.headings.push({
            tag: h.tagName.toLowerCase(),
            text: text
          });
        }
      });
      
      // 문단들 추출
      const paragraphs = document.querySelectorAll('p, div, span');
      paragraphs.forEach(p => {
        const text = p.textContent.trim();
        if (text && text.length > 10 && !text.includes('MAS Golf 로딩 중') && !text.includes('잠시만 기다려주세요')) {
          content.paragraphs.push(text);
        }
      });
      
      // 버튼들 추출
      const buttons = document.querySelectorAll('button, [role="button"], .btn, input[type="button"], a[href*="tel"], a[href*="mailto"]');
      buttons.forEach(btn => {
        const text = btn.textContent.trim();
        if (text) {
          content.buttons.push(text);
        }
      });
      
      // 전화번호 추출
      const phoneRegex = /(\d{3}-\d{3,4}-\d{4}|\d{2,3}-\d{3,4}-\d{4})/g;
      const bodyText = document.body.textContent;
      const phoneMatches = bodyText.match(phoneRegex);
      if (phoneMatches) {
        content.phoneNumbers = [...new Set(phoneMatches)];
      }
      
      return content;
    });
    
    const contentPath = path.join(__dirname, '../mas9golf/funnel-content.json');
    await fs.writeFile(contentPath, JSON.stringify(pageContent, null, 2), 'utf8');
    
    console.log(`💾 퍼널 콘텐츠 저장: ${contentPath}`);
    console.log(`📋 추출된 제목: ${pageContent.headings.length}개`);
    console.log(`📝 추출된 문단: ${pageContent.paragraphs.length}개`);
    console.log(`🔘 추출된 버튼: ${pageContent.buttons.length}개`);
    console.log(`📞 추출된 전화번호: ${pageContent.phoneNumbers.length}개`);
    
    // 전체 페이지 스크린샷
    await page.screenshot({ 
      path: 'mas9golf/funnel-page-screenshot.png',
      fullPage: true 
    });
    console.log('📸 퍼널 페이지 스크린샷 저장: mas9golf/funnel-page-screenshot.png');
    
    console.log('\n🎉 퍼널 페이지 이미지 추출 완료!');
    console.log('📊 추출 결과:');
    console.log(`  🖼️ 이미지: ${imageData.filter(img => img.downloaded).length}/${imageData.length}개 다운로드`);
    console.log(`  📁 저장 위치: ${downloadDir}`);
    console.log(`  💾 메타데이터: ${metadataPath}`);
    console.log(`  📝 콘텐츠: ${contentPath}`);
    
    return {
      images: imageData,
      content: pageContent,
      downloadDir: downloadDir
    };
    
  } catch (error) {
    console.error('❌ 이미지 추출 중 오류 발생:', error);
    throw error;
  } finally {
    if (browser) {
      console.log('✨ 브라우저 연결 유지 (수동 확인 가능)');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  extractFunnelImagesEnhanced()
    .then((result) => {
      console.log('\n🚀 퍼널 페이지 이미지 추출 작업 완료!');
      console.log('📊 추출된 이미지 목록:');
      result.images.forEach((img, index) => {
        if (img.downloaded) {
          console.log(`  ✅ ${index + 1}. ${img.alt} (${img.size}) - ${img.localPath}`);
        } else {
          console.log(`  ❌ ${index + 1}. ${img.alt} - 다운로드 실패`);
        }
      });
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { extractFunnelImagesEnhanced };
