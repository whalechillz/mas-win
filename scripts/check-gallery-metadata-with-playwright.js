/**
 * Playwright로 갤러리 메타데이터 표시 확인
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });
const { chromium } = require('playwright');

async function checkGalleryMetadataWithPlaywright() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔍 갤러리 메타데이터 확인 시작...\n');
    
    // 1. 갤러리 페이지 열기
    const galleryUrl = 'http://localhost:3000/admin/gallery';
    console.log(`🌐 갤러리 페이지 열기: ${galleryUrl}`);
    await page.goto(galleryUrl, { waitUntil: 'networkidle' });
    
    // 2. 강석 글 폴더 선택 (originals/blog/2015-08/123)
    console.log('\n📁 강석 글 폴더 선택 중...');
    
    // 폴더 트리에서 originals > blog > 2015-08 > 123 클릭
    await page.waitForTimeout(2000); // 페이지 로드 대기
    
    // 폴더 트리 확장 및 선택
    try {
      // originals 폴더 확장
      const originalsFolder = page.locator('text=originals').first();
      if (await originalsFolder.isVisible()) {
        await originalsFolder.click();
        await page.waitForTimeout(500);
      }
      
      // blog 폴더 확장
      const blogFolder = page.locator('text=blog').first();
      if (await blogFolder.isVisible()) {
        await blogFolder.click();
        await page.waitForTimeout(500);
      }
      
      // 2015-08 폴더 확장
      const dateFolder = page.locator('text=2015-08').first();
      if (await dateFolder.isVisible()) {
        await dateFolder.click();
        await page.waitForTimeout(500);
      }
      
      // 123 폴더 클릭
      const postFolder = page.locator('text=123').first();
      if (await postFolder.isVisible()) {
        await postFolder.click();
        await page.waitForTimeout(2000); // 이미지 로드 대기
      }
    } catch (error) {
      console.log(`⚠️ 폴더 선택 오류 (수동으로 선택 필요): ${error.message}`);
    }
    
    // 3. 이미지 목록 확인
    console.log('\n📸 이미지 목록 확인 중...');
    await page.waitForTimeout(2000);
    
    // 이미지 요소 찾기
    const imageElements = await page.$$('img[alt*="complete-migration"]');
    console.log(`   발견된 이미지: ${imageElements.length}개`);
    
    // 4. 2번째 이미지 클릭 (complete-migration-1757771588785-2.webp)
    console.log('\n🖼️ 2번째 이미지 클릭 중...');
    
    // 이미지 그리드에서 2번째 이미지 찾기
    const images = await page.$$('img');
    let targetImage = null;
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && src.includes('complete-migration-1757771588785-2.webp')) {
        targetImage = img;
        break;
      }
    }
    
    if (targetImage) {
      await targetImage.click();
      await page.waitForTimeout(2000); // 모달 로드 대기
      
      // 5. 모달에서 메타데이터 확인
      console.log('\n📋 모달 메타데이터 확인 중...');
      
      // ALT 텍스트 확인
      const altTextInput = page.locator('input[placeholder*="ALT 텍스트"], textarea[placeholder*="ALT 텍스트"]').first();
      if (await altTextInput.isVisible()) {
        const altText = await altTextInput.inputValue();
        console.log(`   ALT 텍스트: ${altText ? altText.substring(0, 100) + '...' : '(비어있음)'}`);
      }
      
      // 제목 확인
      const titleInput = page.locator('input[placeholder*="제목"], textarea[placeholder*="제목"]').first();
      if (await titleInput.isVisible()) {
        const title = await titleInput.inputValue();
        console.log(`   제목: ${title || '(비어있음)'}`);
      }
      
      // 설명 확인
      const descInput = page.locator('textarea[placeholder*="설명"]').first();
      if (await descInput.isVisible()) {
        const description = await descInput.inputValue();
        console.log(`   설명: ${description ? description.substring(0, 100) + '...' : '(비어있음)'}`);
      }
      
      // 스크린샷 저장
      await page.screenshot({ path: 'backup/gallery-metadata-modal-2nd-image.png', fullPage: true });
      console.log('   📸 스크린샷 저장: backup/gallery-metadata-modal-2nd-image.png');
      
      // 모달 닫기
      const closeButton = page.locator('button:has-text("취소"), button:has-text("X")').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    } else {
      console.log('   ⚠️ 2번째 이미지를 찾을 수 없습니다.');
    }
    
    // 6. API 직접 호출로 확인
    console.log('\n🔍 API 직접 호출로 확인 중...');
    
    const apiResponse = await page.evaluate(async () => {
      const response = await fetch('/api/admin/all-images?limit=20&offset=0&prefix=originals%2Fblog%2F2015-08%2F123&includeChildren=false');
      return await response.json();
    });
    
    if (apiResponse.images) {
      const secondImage = apiResponse.images.find((img) => 
        img.name && img.name.includes('complete-migration-1757771588785-2.webp')
      );
      
      if (secondImage) {
        console.log('\n📊 API 응답 확인:');
        console.log(`   ALT 텍스트: ${secondImage.alt_text ? secondImage.alt_text.substring(0, 100) + '...' : '(비어있음)'}`);
        console.log(`   제목: ${secondImage.title || '(비어있음)'}`);
        console.log(`   설명: ${secondImage.description ? secondImage.description.substring(0, 100) + '...' : '(비어있음)'}`);
      }
    }
    
    console.log('\n✅ 확인 완료!');
    
    return {
      success: true
    };
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    // 브라우저는 수동으로 닫도록 유지
    console.log('\n💡 브라우저는 수동으로 닫아주세요.');
    // await browser.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  checkGalleryMetadataWithPlaywright()
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { checkGalleryMetadataWithPlaywright };

