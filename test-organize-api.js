// 이미지 정렬 API 직접 테스트
const fetch = require('node-fetch');

const BASE_URL = 'https://www.masgolf.co.kr';
const BLOG_POST_ID = 309;

async function testOrganizeAPI() {
  console.log('🧪 이미지 정렬 API 직접 테스트\n');
  
  try {
    const url = `${BASE_URL}/api/admin/organize-images-by-blog?blogPostId=${BLOG_POST_ID}`;
    console.log(`📡 API 호출: ${url}\n`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ API 응답 성공\n');
    console.log('📊 응답 데이터:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      console.log(`\n📝 블로그 글: "${result.blogPost?.title}"`);
      console.log(`📸 총 이미지: ${result.totalImages}개`);
      console.log(`📁 찾은 이미지: ${result.images?.length || 0}개\n`);
      
      if (result.images && result.images.length > 0) {
        console.log('✅ Storage에서 찾은 이미지:');
        result.images.forEach((img, idx) => {
          console.log(`  ${idx + 1}. ${img.name || img.currentPath}`);
          console.log(`     경로: ${img.currentPath}`);
          console.log(`     URL: ${img.url}`);
        });
      } else {
        console.log('⚠️ Storage에서 이미지를 찾지 못했습니다.');
        console.log(`   블로그 글의 이미지 URL: ${result.blogPost?.title}에 ${result.totalImages}개 이미지가 있지만 Storage에서 찾지 못했습니다.`);
      }
    }
    
  } catch (error) {
    console.error('❌ API 테스트 실패:', error.message);
    console.error('스택:', error.stack);
  }
}

testOrganizeAPI();



