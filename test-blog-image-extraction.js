// 블로그 글의 모든 이미지 URL 추출 테스트
const http = require('http');

const BASE_URL = 'localhost:3000';
const BLOG_POST_ID = 309; // fall-golf-special-masgolf-driver-whiskey
const BLOG_SLUG = 'fall-golf-special-masgolf-driver-whiskey';

// HTTP 요청 헬퍼
function httpRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: body });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function extractAllImageUrls() {
  console.log('🔍 블로그 글의 모든 이미지 URL 추출 테스트\n');
  
  try {
    // 1. DB에서 가져온 이미지 URL (현재 방식)
    console.log('📋 1단계: DB에서 가져온 이미지 URL...\n');
    
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
    
    let blogPost = null;
    if (response.status === 200) {
      try {
        blogPost = JSON.parse(response.data);
      } catch (e) {
        blogPost = response.data;
      }
    }
    
    if (!blogPost) {
      throw new Error('블로그 글을 가져올 수 없습니다.');
    }
    
    console.log(`📝 블로그 글: "${blogPost.title}" (ID: ${blogPost.id})\n`);
    
    // DB에서 추출한 이미지 URL
    const dbImageUrls = [];
    
    // featured_image
    if (blogPost.featured_image) {
      dbImageUrls.push({
        url: blogPost.featured_image,
        source: 'featured_image',
        type: '대표이미지'
      });
    }
    
    // content에서 이미지 URL 추출
    if (blogPost.content) {
      // HTML 이미지 태그
      const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
      let match;
      while ((match = imgRegex.exec(blogPost.content)) !== null) {
        const url = match[1];
        if (url && !dbImageUrls.find(img => img.url === url)) {
          dbImageUrls.push({
            url: url,
            source: 'content_html',
            type: '본문 이미지 (HTML)'
          });
        }
      }
      
      // 마크다운 이미지
      const markdownImgRegex = /!\[.*?\]\(([^)]+)\)/gi;
      while ((match = markdownImgRegex.exec(blogPost.content)) !== null) {
        const url = match[1];
        if (url && !dbImageUrls.find(img => img.url === url)) {
          dbImageUrls.push({
            url: url,
            source: 'content_markdown',
            type: '본문 이미지 (Markdown)'
          });
        }
      }
    }
    
    console.log(`📊 DB에서 추출한 이미지: ${dbImageUrls.length}개`);
    dbImageUrls.forEach((img, idx) => {
      console.log(`  ${idx + 1}. [${img.type}] ${img.url}`);
    });
    
    // 2. 실제 렌더링된 페이지에서 추출한 이미지 URL (추천 방식)
    console.log('\n\n📋 2단계: 실제 렌더링된 페이지에서 이미지 URL 추출...\n');
    
    const pageResponse = await httpRequest({
      hostname: BASE_URL.split(':')[0],
      port: BASE_URL.split(':')[1] || 3000,
      path: `/blog/${BLOG_SLUG}`,
      method: 'GET'
    });
    
    if (pageResponse.status === 200) {
      const html = pageResponse.data;
      
      // 렌더링된 HTML에서 모든 이미지 URL 추출
      const renderedImageUrls = [];
      
      // 모든 <img> 태그 찾기
      const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        const url = match[1];
        // 상대 경로를 절대 경로로 변환
        let fullUrl = url;
        if (url.startsWith('/')) {
          fullUrl = `https://www.masgolf.co.kr${url}`;
        } else if (!url.startsWith('http')) {
          fullUrl = `https://www.masgolf.co.kr/${url}`;
        }
        
        if (fullUrl && !renderedImageUrls.find(img => img.url === fullUrl)) {
          // 메타 이미지나 아이콘 제외
          if (!fullUrl.includes('favicon') && 
              !fullUrl.includes('logo') && 
              !fullUrl.includes('icon') &&
              !fullUrl.includes('og:image') &&
              (fullUrl.includes('.jpg') || fullUrl.includes('.jpeg') || 
               fullUrl.includes('.png') || fullUrl.includes('.webp') ||
               fullUrl.includes('.gif') || fullUrl.includes('storage') ||
               fullUrl.includes('supabase'))) {
            renderedImageUrls.push({
              url: fullUrl,
              source: 'rendered_html',
              type: '렌더링된 페이지 이미지'
            });
          }
        }
      }
      
      console.log(`📊 렌더링된 페이지에서 추출한 이미지: ${renderedImageUrls.length}개`);
      renderedImageUrls.forEach((img, idx) => {
        console.log(`  ${idx + 1}. [${img.type}] ${img.url}`);
      });
      
      // 3. 비교 분석
      console.log('\n\n📊 3단계: 비교 분석...\n');
      
      const dbUrls = dbImageUrls.map(img => img.url);
      const renderedUrls = renderedImageUrls.map(img => img.url);
      
      // DB에만 있는 URL
      const onlyInDb = dbUrls.filter(url => !renderedUrls.some(r => r.includes(url.split('/').pop()) || url.includes(r.split('/').pop())));
      
      // 렌더링에만 있는 URL
      const onlyInRendered = renderedUrls.filter(url => !dbUrls.some(d => d.includes(url.split('/').pop()) || url.includes(d.split('/').pop())));
      
      // 공통 URL
      const common = dbUrls.filter(url => renderedUrls.some(r => r.includes(url.split('/').pop()) || url.includes(r.split('/').pop())));
      
      console.log(`📈 통계:`);
      console.log(`  - DB에서 추출: ${dbImageUrls.length}개`);
      console.log(`  - 렌더링된 페이지에서 추출: ${renderedImageUrls.length}개`);
      console.log(`  - 공통: ${common.length}개`);
      console.log(`  - DB에만 있음: ${onlyInDb.length}개`);
      if (onlyInDb.length > 0) {
        console.log(`    ${onlyInDb.join('\n    ')}`);
      }
      console.log(`  - 렌더링에만 있음: ${onlyInRendered.length}개`);
      if (onlyInRendered.length > 0) {
        console.log(`    ${onlyInRendered.join('\n    ')}`);
      }
      
      // 4. 결론 및 추천
      console.log('\n\n✅ 결론:\n');
      
      if (dbImageUrls.length === renderedImageUrls.length && onlyInDb.length === 0 && onlyInRendered.length === 0) {
        console.log('✅ DB에서 추출한 이미지와 렌더링된 페이지의 이미지가 일치합니다.');
        console.log('   현재 방식(DB에서 추출)으로 충분합니다.');
      } else {
        console.log('⚠️ DB와 렌더링된 페이지의 이미지가 일치하지 않습니다.');
        console.log('\n💡 추천 방법:');
        console.log('   1. DB에서 추출: 빠르지만 일부 이미지를 놓칠 수 있음');
        console.log('   2. 렌더링된 페이지에서 추출: 모든 이미지를 정확하게 파악');
        console.log('   3. 하이브리드: DB에서 기본 추출 + 렌더링된 페이지 검증');
      }
      
    } else {
      console.log(`❌ 페이지를 가져올 수 없습니다: HTTP ${pageResponse.status}`);
    }
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('스택:', error.stack);
  }
}

extractAllImageUrls();



