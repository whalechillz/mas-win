const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrapeHomepageProducts() {
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const url = 'https://mas-lva3ulwew-taksoo-kims-projects.vercel.app';
    console.log(`📄 페이지 확인: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // 제품 섹션 HTML 추출
    const productsSection = await page.evaluate(() => {
      // #products 섹션 찾기
      const productsSection = document.querySelector('#products');
      if (!productsSection) {
        return null;
      }
      
      return productsSection.outerHTML;
    });
    
    if (productsSection) {
      const outputPath = path.join(process.cwd(), 'scraped-pages', 'homepage-products-section.html');
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(outputPath, productsSection, 'utf8');
      console.log(`✅ 제품 섹션 HTML 저장: ${outputPath}`);
    } else {
      console.log('⚠️  #products 섹션을 찾을 수 없습니다.');
    }
    
    // 전체 HTML도 저장
    const html = await page.content();
    const htmlPath = path.join(process.cwd(), 'scraped-pages', 'homepage-full.html');
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`✅ 전체 HTML 저장: ${htmlPath}`);
    
    // 제품 이미지 정보 추출
    const productImages = await page.evaluate(() => {
      const products = [];
      const productCards = document.querySelectorAll('#products [class*="product"], #products [class*="card"], #products > div > div');
      
      productCards.forEach((card, index) => {
        const images = [];
        const imgElements = card.querySelectorAll('img');
        imgElements.forEach(img => {
          const src = img.src || img.getAttribute('src');
          if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
            images.push(src);
          }
        });
        
        const title = card.querySelector('h2, h3, h4, [class*="title"]')?.textContent?.trim() || '';
        const price = card.querySelector('[class*="price"]')?.textContent?.trim() || '';
        
        if (title || images.length > 0) {
          products.push({
            index,
            title,
            price,
            images,
            imageCount: images.length
          });
        }
      });
      
      return products;
    });
    
    console.log(`\n📊 발견된 제품: ${productImages.length}개`);
    productImages.forEach((product, index) => {
      console.log(`\n제품 ${index + 1}: ${product.title}`);
      console.log(`  가격: ${product.price}`);
      console.log(`  이미지 개수: ${product.imageCount}개`);
      product.images.forEach((img, imgIndex) => {
        console.log(`    ${imgIndex + 1}. ${img}`);
      });
    });
    
    // 제품 이미지 정보를 JSON으로 저장
    const jsonPath = path.join(process.cwd(), 'scraped-pages', 'homepage-products-images.json');
    fs.writeFileSync(jsonPath, JSON.stringify(productImages, null, 2), 'utf8');
    console.log(`\n📝 제품 이미지 정보 저장: ${jsonPath}`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

scrapeHomepageProducts();

