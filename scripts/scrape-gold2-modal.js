const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrapeGold2Modal() {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    const url = 'https://mas-lva3ulwew-taksoo-kims-projects.vercel.app';
    console.log(`📄 페이지 확인: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // 제품 섹션으로 스크롤
    await page.evaluate(() => {
      const productsSection = document.querySelector('#products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    await page.waitForTimeout(2000);
    
    // "시크리트포스 골드 2" 제품 카드 찾기 (MUZIIK이 아닌 것)
    const gold2Card = await page.$('text="시크리트포스 골드 2"');
    if (!gold2Card) {
      // 다른 방법으로 찾기
      const cards = await page.$$('[class*="cursor-pointer"]');
      for (const card of cards) {
        const text = await card.textContent();
        if (text && text.includes('시크리트포스 골드 2') && !text.includes('MUZIIK')) {
          console.log('  제품 카드 찾음, 클릭 시도...');
          await card.click();
          await page.waitForTimeout(3000);
          break;
        }
      }
    } else {
      console.log('  제품 카드 찾음, 클릭 시도...');
      await gold2Card.click();
      await page.waitForTimeout(3000);
    }
    
    // 모달 내부의 모든 이미지 추출
    const modalImages = await page.evaluate(() => {
      const imageSet = new Set();
      
      // 모달 내부의 모든 이미지 찾기
      const modals = document.querySelectorAll('[class*="modal"], [class*="Modal"], [role="dialog"], [class*="fixed"][class*="inset-0"]');
      
      modals.forEach(modal => {
        // 모달 내부의 모든 img 태그
        modal.querySelectorAll('img').forEach(img => {
          const src = img.src || img.getAttribute('src');
          if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
            imageSet.add(src);
          }
        });
        
        // picture 태그 내부
        modal.querySelectorAll('picture').forEach(picture => {
          const source = picture.querySelector('source');
          if (source && source.srcset) {
            const srcset = source.srcset.split(',')[0].trim().split(' ')[0];
            if (srcset && !srcset.startsWith('data:') && !srcset.startsWith('blob:')) {
              imageSet.add(srcset);
            }
          }
          const img = picture.querySelector('img');
          if (img && img.src) {
            imageSet.add(img.src);
          }
        });
      });
      
      // 모달이 없으면 전체 페이지에서 gold2 관련 이미지 찾기
      if (imageSet.size === 0) {
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || img.getAttribute('src');
          if (src && src.includes('gold2') && !src.includes('gold2-sapphire')) {
            imageSet.add(src);
          }
        });
      }
      
      return Array.from(imageSet);
    });
    
    console.log(`\n📊 발견된 이미지: ${modalImages.length}개`);
    modalImages.forEach((img, index) => {
      console.log(`  ${index + 1}. ${img}`);
    });
    
    // HTML 저장
    const html = await page.content();
    const htmlPath = path.join(process.cwd(), 'scraped-pages', 'gold2-modal.html');
    const htmlDir = path.dirname(htmlPath);
    if (!fs.existsSync(htmlDir)) {
      fs.mkdirSync(htmlDir, { recursive: true });
    }
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`\n✅ HTML 저장: ${htmlPath}`);
    
    // 스크린샷 저장
    const screenshotPath = path.join(process.cwd(), 'scraped-pages', 'gold2-modal.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ 스크린샷 저장: ${screenshotPath}`);
    
    // 이미지 목록 저장
    const imagesPath = path.join(process.cwd(), 'scraped-pages', 'gold2-modal-images.json');
    fs.writeFileSync(imagesPath, JSON.stringify(modalImages, null, 2), 'utf8');
    console.log(`✅ 이미지 목록 저장: ${imagesPath}`);
    
    console.log('\n⚠️  브라우저를 수동으로 닫아주세요.');
    await page.waitForTimeout(10000); // 10초 대기
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

scrapeGold2Modal();

