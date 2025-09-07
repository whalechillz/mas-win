const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// 7월 퍼널 페이지에서 이미지 추출
async function extractFunnelImages() {
  let browser;
  try {
    console.log('🎯 7월 퍼널 페이지 이미지 추출 시작...');
    
    // Chrome Canary 연결
    console.log('🔗 Chrome Canary 연결 중...');
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = await browser.newPage();
    
    console.log('✅ Chrome Canary 연결 완료');
    
    // 퍼널 페이지로 이동
    const funnelUrl = 'https://www.masgolf.co.kr/25-07';
    console.log(`\n📄 퍼널 페이지로 이동: ${funnelUrl}`);
    
    await page.goto(funnelUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000); // 페이지 로딩 대기
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📋 페이지 제목: ${title}`);
    
    // 이미지 요소들 찾기
    console.log('\n🖼️ 이미지 요소 분석 중...');
    
    const images = await page.$$('img');
    console.log(`📊 발견된 이미지: ${images.length}개`);
    
    // 이미지 정보 수집
    const imageData = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt') || `이미지 ${i + 1}`;
      const naturalWidth = await img.evaluate(el => el.naturalWidth);
      const naturalHeight = await img.evaluate(el => el.naturalHeight);
      
      // CSS로 숨겨진 이미지나 너무 작은 이미지 제외
      if (naturalWidth > 100 && naturalHeight > 100) {
        imageData.push({
          index: i + 1,
          src: src,
          alt: alt,
          width: naturalWidth,
          height: naturalHeight,
          size: `${naturalWidth}x${naturalHeight}`
        });
        
        console.log(`  🖼️ 이미지 ${i + 1}: ${alt}`);
        console.log(`    📁 경로: ${src}`);
        console.log(`    📏 크기: ${naturalWidth}x${naturalHeight}`);
      }
    }
    
    console.log(`\n📊 유효한 이미지: ${imageData.length}개`);
    
    // 이미지 다운로드 디렉토리 생성
    const downloadDir = path.join(__dirname, '../public/mas9golf/funnel-images');
    await fs.mkdir(downloadDir, { recursive: true });
    
    // 이미지 다운로드
    console.log('\n⬇️ 이미지 다운로드 시작...');
    
    for (const imgData of imageData) {
      try {
        const response = await page.goto(imgData.src);
        const buffer = await response.body();
        
        // 파일 확장자 추출
        const url = new URL(imgData.src);
        const pathname = url.pathname;
        const ext = path.extname(pathname) || '.jpg';
        
        // 파일명 생성
        const filename = `funnel-image-${imgData.index}${ext}`;
        const filepath = path.join(downloadDir, filename);
        
        await fs.writeFile(filepath, buffer);
        
        console.log(`  ✅ 다운로드 완료: ${filename} (${imgData.size})`);
        
        // 이미지 데이터에 로컬 경로 추가
        imgData.localPath = `/mas9golf/funnel-images/${filename}`;
        
      } catch (error) {
        console.log(`  ❌ 다운로드 실패: ${imgData.src} - ${error.message}`);
      }
    }
    
    // 이미지 메타데이터 저장
    const metadataPath = path.join(__dirname, '../mas9golf/funnel-images-metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(imageData, null, 2), 'utf8');
    
    console.log(`\n💾 이미지 메타데이터 저장: ${metadataPath}`);
    
    // 퍼널 페이지의 텍스트 콘텐츠도 추출
    console.log('\n📝 퍼널 페이지 텍스트 콘텐츠 추출...');
    
    const pageContent = await page.evaluate(() => {
      const content = {
        title: document.title,
        headings: [],
        paragraphs: [],
        buttons: [],
        phoneNumbers: []
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
      const paragraphs = document.querySelectorAll('p');
      paragraphs.forEach(p => {
        const text = p.textContent.trim();
        if (text && text.length > 10) {
          content.paragraphs.push(text);
        }
      });
      
      // 버튼들 추출
      const buttons = document.querySelectorAll('button, [role="button"], .btn, input[type="button"]');
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
    console.log(`  🖼️ 이미지: ${imageData.length}개 다운로드`);
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
  extractFunnelImages()
    .then((result) => {
      console.log('\n🚀 퍼널 페이지 이미지 추출 작업 완료!');
      console.log('📊 추출된 이미지 목록:');
      result.images.forEach((img, index) => {
        console.log(`  ${index + 1}. ${img.alt} (${img.size}) - ${img.localPath}`);
      });
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { extractFunnelImages };
