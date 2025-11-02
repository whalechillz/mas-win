// 로컬 서버에서 API 직접 호출 테스트
const http = require('http');

const BASE_URL = 'localhost:3000';

// HTTP 요청 헬퍼 함수
function httpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function testLocalAPI() {
  console.log('🎭 로컬 서버 API 직접 테스트 시작...\n');
  
  try {
    // 1. 블로그 글 목록 API 테스트
    console.log('📋 1단계: 블로그 글 목록 API 테스트...');
    
    // HTTP 308 리다이렉션 처리 (trailing slash 제거)
    let blogListResponse = await httpRequest({
      hostname: BASE_URL.split(':')[0],
      port: BASE_URL.split(':')[1] || 3000,
      path: '/api/admin/blog/?sortBy=published_at&sortOrder=desc',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // 308 리다이렉션인 경우 trailing slash 제거 후 재시도
    if (blogListResponse.status === 308) {
      blogListResponse = await httpRequest({
        hostname: BASE_URL.split(':')[0],
        port: BASE_URL.split(':')[1] || 3000,
        path: '/api/admin/blog?sortBy=published_at&sortOrder=desc',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    if (blogListResponse.status !== 200) {
      throw new Error(`블로그 글 목록 API 실패: HTTP ${blogListResponse.status}`);
    }
    
    const blogPosts = blogListResponse.data.posts || [];
    console.log(`✅ 블로그 글 목록 조회 성공: ${blogPosts.length}개\n`);
    
    // 이미지가 있는 글 찾기
    const postsWithImages = blogPosts.filter(post => {
      const hasFeaturedImage = post.featured_image && post.featured_image.trim() !== '';
      const hasContentImages = post.content && (
        post.content.includes('<img') || 
        post.content.includes('![') ||
        post.content.includes('https://') || 
        post.content.includes('supabase.co')
      );
      return hasFeaturedImage || hasContentImages;
    });
    
    console.log(`📸 이미지가 있는 블로그 글: ${postsWithImages.length}개\n`);
    
    // 첫 3개 글 테스트
    for (let i = 0; i < Math.min(3, postsWithImages.length); i++) {
      const post = postsWithImages[i];
      console.log(`\n📝 ${i + 1}. "${post.title}" (ID: ${post.id})`);
      
      // 이미지 URL 추출
      const imageUrls = [];
      
      if (post.featured_image) {
        imageUrls.push({ url: post.featured_image, type: 'featured' });
      }
      
      if (post.content) {
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
        let match;
        while ((match = imgRegex.exec(post.content)) !== null) {
          const url = match[1];
          if (url && !imageUrls.find(img => img.url === url)) {
            imageUrls.push({ url: url, type: 'content' });
          }
        }
        
        const markdownImgRegex = /!\[.*?\]\(([^)]+)\)/gi;
        while ((match = markdownImgRegex.exec(post.content)) !== null) {
          const url = match[1];
          if (url && !imageUrls.find(img => img.url === url)) {
            imageUrls.push({ url: url, type: 'content' });
          }
        }
      }
      
      console.log(`   📊 총 이미지: ${imageUrls.length}개`);
      
      // 이미지 정렬 API 테스트
      console.log(`\n   🔧 이미지 정렬 API 테스트 (로컬)...`);
      
      try {
        const organizePath = `/api/admin/organize-images-by-blog?blogPostId=${post.id}`;
        const organizeResponse = await httpRequest({
          hostname: BASE_URL.split(':')[0],
          port: BASE_URL.split(':')[1] || 3000,
          path: organizePath,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (organizeResponse.status === 200) {
          console.log(`      ✅ 이미지 정렬 API 성공 (로컬)`);
          const results = organizeResponse.data.results || [];
          if (results.length > 0) {
            const result = results[0];
            const totalImages = result.totalImages || 0;
            const foundImages = result.images?.length || 0;
            
            console.log(`         - 블로그 글 이미지: ${totalImages}개`);
            console.log(`         - Storage에서 찾은 이미지: ${foundImages}개`);
            
            if (foundImages > 0) {
              console.log(`         ✅ 성공! 이미지 예시:`);
              result.images.slice(0, 3).forEach((img, idx) => {
                console.log(`            ${idx + 1}. ${img.name || img.currentPath}`);
              });
            } else {
              console.log(`         ⚠️ Storage에서 이미지를 찾지 못함`);
            }
          }
        } else {
          console.log(`      ❌ 이미지 정렬 API 실패 (HTTP ${organizeResponse.status})`);
          if (organizeResponse.data?.error) {
            console.log(`         오류: ${organizeResponse.data.error}`);
          }
        }
      } catch (error) {
        console.log(`      ⚠️ 이미지 정렬 테스트 오류: ${error.message}`);
      }
    }
    
    console.log('\n✅ 로컬 서버 API 테스트 완료!');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('스택:', error.stack);
    throw error;
  }
}

// 테스트 실행
testLocalAPI()
  .then(() => {
    console.log('\n🎉 모든 테스트 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 테스트 실패:', error);
    process.exit(1);
  });

