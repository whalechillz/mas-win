/**
 * 갤러리 메타데이터 표시 확인 (더 정확한 버전)
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });
const { chromium } = require('playwright');

async function verifyGalleryMetadataDisplay() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔍 갤러리 메타데이터 표시 확인 시작...\n');
    
    // 1. 갤러리 페이지 열기
    const galleryUrl = 'http://localhost:3000/admin/gallery';
    console.log(`🌐 갤러리 페이지 열기: ${galleryUrl}`);
    await page.goto(galleryUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // 2. API 직접 호출로 메타데이터 확인
    console.log('\n🔍 API 직접 호출로 메타데이터 확인 중...');
    
    const apiResponse = await page.evaluate(async () => {
      const response = await fetch('/api/admin/all-images?limit=20&offset=0&prefix=originals%2Fblog%2F2015-08%2F123&includeChildren=false');
      return await response.json();
    });
    
    if (apiResponse.images && apiResponse.images.length > 0) {
      console.log(`\n📊 API 응답: ${apiResponse.images.length}개 이미지 발견\n`);
      
      // 2번째 이미지 확인 (complete-migration-1757771588785-2.webp)
      const secondImage = apiResponse.images.find((img) => 
        img.name && img.name.includes('complete-migration-1757771588785-2.webp')
      );
      
      if (secondImage) {
        console.log('📸 2번째 이미지 메타데이터:');
        console.log(`   파일명: ${secondImage.name}`);
        console.log(`   ALT 텍스트: ${secondImage.alt_text ? secondImage.alt_text.substring(0, 80) + '...' : '❌ (비어있음)'}`);
        console.log(`   제목: ${secondImage.title || '❌ (비어있음)'}`);
        console.log(`   설명: ${secondImage.description ? secondImage.description.substring(0, 80) + '...' : '❌ (비어있음)'}`);
        
        if (secondImage.alt_text && secondImage.title && secondImage.description) {
          console.log('\n✅ 메타데이터가 정상적으로 로드되었습니다!');
        } else {
          console.log('\n❌ 메타데이터가 일부 누락되었습니다.');
        }
      } else {
        console.log('⚠️ 2번째 이미지를 찾을 수 없습니다.');
      }
      
      // 모든 이미지 메타데이터 상태 확인
      console.log('\n📋 모든 이미지 메타데이터 상태:');
      apiResponse.images.forEach((img, idx) => {
        const hasAlt = img.alt_text && img.alt_text.trim().length > 0;
        const hasTitle = img.title && img.title.trim().length > 0;
        const hasDesc = img.description && img.description.trim().length > 0;
        const status = (hasAlt && hasTitle && hasDesc) ? '✅' : '❌';
        console.log(`   ${idx + 1}. ${img.name.substring(0, 40)}... ${status} (ALT: ${hasAlt ? 'O' : 'X'}, Title: ${hasTitle ? 'O' : 'X'}, Desc: ${hasDesc ? 'O' : 'X'})`);
      });
    }
    
    // 3. 페이지 스크린샷
    await page.screenshot({ path: 'backup/gallery-page-screenshot.png', fullPage: true });
    console.log('\n📸 페이지 스크린샷 저장: backup/gallery-page-screenshot.png');
    
    console.log('\n✅ 확인 완료!');
    console.log('\n💡 브라우저에서 직접 확인하세요:');
    console.log('   1. 왼쪽 폴더 트리에서 originals > blog > 2015-08 > 123 클릭');
    console.log('   2. 이미지 그리드에서 2번째 이미지 클릭');
    console.log('   3. 모달에서 ALT 텍스트, 제목, 설명이 채워져 있는지 확인');
    
    return {
      success: true,
      apiResponse
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
  verifyGalleryMetadataDisplay()
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { verifyGalleryMetadataDisplay };

