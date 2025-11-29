/**
 * API 응답에서 키워드 확인
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });

async function checkKeywordsInAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/all-images?limit=20&offset=0&prefix=originals%2Fblog%2F2015-08%2F123&includeChildren=false');
    const data = await response.json();
    
    if (data.images && data.images.length > 0) {
      console.log('📊 API 응답 키워드 확인:\n');
      
      const secondImage = data.images.find((img) => 
        img.name && img.name.includes('complete-migration-1757771588785-2.webp')
      );
      
      if (secondImage) {
        console.log('📸 2번째 이미지:');
        console.log(`   파일명: ${secondImage.name}`);
        console.log(`   키워드: ${secondImage.keywords ? JSON.stringify(secondImage.keywords) : '❌ 없음'}`);
        console.log(`   키워드 개수: ${secondImage.keywords ? secondImage.keywords.length : 0}개`);
        
        if (secondImage.keywords && secondImage.keywords.length > 0) {
          console.log(`\n   키워드 목록:`);
          secondImage.keywords.forEach((kw, idx) => {
            console.log(`   ${idx + 1}. ${kw}`);
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkKeywordsInAPI();

