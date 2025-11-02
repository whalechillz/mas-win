// 대표이미지 중복 체크 테스트
const http = require('http');

const BASE_URL = 'localhost:3000';
const BLOG_POST_ID = 309;

function httpRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function testDuplicateCheck() {
  console.log('🔍 대표이미지 중복 체크 테스트\n');
  
  try {
    // 블로그 글 조회
    let response = await httpRequest({
      hostname: BASE_URL.split(':')[0],
      port: BASE_URL.split(':')[1] || 3000,
      path: `/api/admin/blog?id=${BLOG_POST_ID}`,
      method: 'GET'
    });
    
    if (response.status === 308) {
      response = await httpRequest({
        hostname: BASE_URL.split(':')[0],
        port: BASE_URL.split(':')[1] || 3000,
        path: `/api/admin/blog?id=${BLOG_POST_ID}`.replace(/\/$/, ''),
        method: 'GET'
      });
    }
    
    if (response.status !== 200 || !response.data) {
      throw new Error('블로그 글을 가져올 수 없습니다.');
    }
    
    const post = response.data;
    console.log(`📝 블로그 글: "${post.title}" (ID: ${post.id})\n`);
    
    // featured_image 확인
    console.log('📸 대표이미지 (featured_image):');
    if (post.featured_image) {
      console.log(`   ${post.featured_image}`);
    } else {
      console.log('   없음');
    }
    
    // content에서 이미지 URL 추출
    const imageUrls = [];
    if (post.content) {
      // 마크다운 이미지 추출
      const markdownImgRegex = /!\[.*?\]\(([^)]+)\)/gi;
      let match;
      while ((match = markdownImgRegex.exec(post.content)) !== null) {
        imageUrls.push(match[1]);
      }
      
      // HTML 이미지 태그 추출
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      while ((match = imgRegex.exec(post.content)) !== null) {
        imageUrls.push(match[1]);
      }
    }
    
    console.log(`\n📸 본문에서 추출한 이미지: ${imageUrls.length}개`);
    imageUrls.forEach((url, idx) => {
      console.log(`   ${idx + 1}. ${url}`);
    });
    
    // 대표이미지가 본문에 포함되어 있는지 확인
    const featuredInContent = post.featured_image && imageUrls.includes(post.featured_image);
    
    console.log(`\n🔍 중복 확인:`);
    if (featuredInContent) {
      console.log(`   ✅ 대표이미지가 본문에도 포함되어 있습니다!`);
      console.log(`   📊 총 이미지 URL (중복 포함): ${imageUrls.length + 1}개`);
      console.log(`   📊 실제 고유 이미지 (중복 제거): ${new Set([post.featured_image, ...imageUrls]).size}개`);
    } else {
      console.log(`   ℹ️ 대표이미지는 본문에 포함되지 않았습니다.`);
      console.log(`   📊 총 고유 이미지: ${new Set([post.featured_image, ...imageUrls]).size}개`);
    }
    
    // 이미지 정렬 API 테스트
    console.log(`\n🔧 이미지 정렬 API 테스트 (중복 체크 확인)...`);
    
    const organizePath = `/api/admin/organize-images-by-blog?blogPostId=${BLOG_POST_ID}`;
    const organizeResponse = await httpRequest({
      hostname: BASE_URL.split(':')[0],
      port: BASE_URL.split(':')[1] || 3000,
      path: organizePath,
      method: 'GET'
    });
    
    if (organizeResponse.status === 200) {
      const results = organizeResponse.data.results || [];
      if (results.length > 0) {
        const result = results[0];
        const totalImages = result.totalImages || 0;
        const foundImages = result.images?.length || 0;
        
        console.log(`   ✅ API 결과:`);
        console.log(`      - 블로그 글 이미지: ${totalImages}개`);
        console.log(`      - Storage에서 찾은 이미지: ${foundImages}개`);
        
        // 예상 개수와 비교
        const expectedUnique = new Set([post.featured_image, ...imageUrls]).size;
        console.log(`\n   📊 검증:`);
        console.log(`      - 예상 고유 이미지: ${expectedUnique}개`);
        console.log(`      - API에서 추출한 이미지: ${totalImages}개`);
        
        if (totalImages === expectedUnique) {
          console.log(`      ✅ 중복 제거 정확하게 작동!`);
        } else {
          console.log(`      ⚠️ 개수 차이: ${Math.abs(totalImages - expectedUnique)}개`);
          if (featuredInContent && totalImages < imageUrls.length + 1) {
            console.log(`      ✅ 중복 제거 작동 (대표이미지 중복 제거됨)`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('스택:', error.stack);
  }
}

testDuplicateCheck();



