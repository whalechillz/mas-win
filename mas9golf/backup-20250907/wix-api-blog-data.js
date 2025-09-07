const axios = require('axios');

// Wix API를 통한 블로그 데이터 가져오기
async function getWixBlogDataViaAPI() {
  console.log('🔌 Wix API를 통한 블로그 데이터 수집...');
  
  try {
    // 1. Wix API 인증 설정
    const wixConfig = {
      siteId: 'your-wix-site-id', // 실제 사이트 ID로 변경
      apiKey: 'your-wix-api-key', // 실제 API 키로 변경
      baseURL: 'https://www.wixapis.com/v1'
    };
    
    // 2. 인증 헤더 설정
    const headers = {
      'Authorization': `Bearer ${wixConfig.apiKey}`,
      'Content-Type': 'application/json',
      'wix-site-id': wixConfig.siteId
    };
    
    // 3. 블로그 포스트 목록 가져오기
    console.log('📝 블로그 포스트 목록 수집...');
    const postsResponse = await axios.get(
      `${wixConfig.baseURL}/blog/posts`,
      { headers }
    );
    
    const posts = postsResponse.data.posts || [];
    console.log(`✅ ${posts.length}개 포스트 발견`);
    
    // 4. 각 포스트의 상세 정보 수집
    const detailedPosts = [];
    
    for (const post of posts) {
      try {
        console.log(`📖 포스트 상세 정보 수집: ${post.title}`);
        
        // 개별 포스트 상세 정보
        const postDetailResponse = await axios.get(
          `${wixConfig.baseURL}/blog/posts/${post.id}`,
          { headers }
        );
        
        const postDetail = postDetailResponse.data;
        
        // SEO 정보 포함
        const postData = {
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: postDetail.content,
          excerpt: postDetail.excerpt,
          publishDate: postDetail.publishDate,
          author: postDetail.author,
          tags: postDetail.tags || [],
          categories: postDetail.categories || [],
          seo: {
            title: postDetail.seo?.title || post.title,
            description: postDetail.seo?.description || '',
            keywords: postDetail.seo?.keywords || [],
            noIndex: postDetail.seo?.noIndex || false
          },
          images: postDetail.media?.items || [],
          url: `https://www.mas9golf.com/post/${post.slug}`
        };
        
        detailedPosts.push(postData);
        
        // API 호출 제한을 위한 대기
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ 포스트 ${post.id} 수집 실패:`, error.message);
      }
    }
    
    // 5. 데이터 저장
    const fs = require('fs').promises;
    await fs.writeFile(
      'mas9golf/wix-api-blog-data.json',
      JSON.stringify(detailedPosts, null, 2),
      'utf8'
    );
    
    console.log(`🎉 API를 통한 블로그 데이터 수집 완료!`);
    console.log(`📊 총 ${detailedPosts.length}개 포스트 수집`);
    console.log(`📁 저장 위치: mas9golf/wix-api-blog-data.json`);
    
    return detailedPosts;
    
  } catch (error) {
    console.error('❌ Wix API 데이터 수집 실패:', error.message);
    
    if (error.response) {
      console.error('API 응답 오류:', error.response.status, error.response.data);
    }
    
    return [];
  }
}

// Wix API 설정 가이드
function printWixAPISetupGuide() {
  console.log(`
🔧 Wix API 설정 가이드:

1. Wix 개발자 센터 접속:
   https://dev.wix.com/

2. 새 앱 생성:
   - "Create New App" 클릭
   - "Custom App" 선택
   - 앱 이름 입력 (예: "Blog Data Exporter")

3. API 권한 설정:
   - Blog API 활성화
   - Posts 읽기 권한 추가
   - SEO 설정 읽기 권한 추가

4. 사이트 ID 확인:
   - Wix 대시보드 > 설정 > 일반
   - "사이트 ID" 복사

5. API 키 생성:
   - 개발자 센터 > 앱 > API Keys
   - 새 키 생성 및 복사

6. 환경 변수 설정:
   export WIX_SITE_ID="your-site-id"
   export WIX_API_KEY="your-api-key"
  `);
}

// SEO 설정 일괄 업데이트 API
async function updateWixSEOBulk(posts, seoSettings) {
  console.log('🔧 Wix API를 통한 SEO 설정 일괄 업데이트...');
  
  try {
    const wixConfig = {
      siteId: process.env.WIX_SITE_ID,
      apiKey: process.env.WIX_API_KEY,
      baseURL: 'https://www.wixapis.com/v1'
    };
    
    const headers = {
      'Authorization': `Bearer ${wixConfig.apiKey}`,
      'Content-Type': 'application/json',
      'wix-site-id': wixConfig.siteId
    };
    
    let successCount = 0;
    let failCount = 0;
    
    for (const post of posts) {
      try {
        // 영문 슬러그 생성
        const englishSlug = convertToEnglishSlug(post.title);
        
        // SEO 설정 업데이트
        const updateData = {
          slug: englishSlug,
          seo: {
            title: seoSettings.title || post.title,
            description: seoSettings.description || post.seo?.description,
            keywords: seoSettings.keywords || post.seo?.keywords,
            noIndex: seoSettings.noIndex || false
          }
        };
        
        await axios.patch(
          `${wixConfig.baseURL}/blog/posts/${post.id}`,
          updateData,
          { headers }
        );
        
        console.log(`✅ ${post.title} SEO 설정 업데이트 완료`);
        successCount++;
        
        // API 호출 제한을 위한 대기
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ ${post.title} 업데이트 실패:`, error.message);
        failCount++;
      }
    }
    
    console.log(`🎉 SEO 설정 업데이트 완료!`);
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    
  } catch (error) {
    console.error('❌ SEO 설정 업데이트 실패:', error.message);
  }
}

// 한글 제목을 영문 슬러그로 변환
function convertToEnglishSlug(koreanTitle) {
  const slugMap = {
    '뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사': 'hot-summer-perfect-swing-royal-salute-event',
    '롱기스트 드라이버 찾는다면': 'longest-driver-finder',
    'MASGOLF - 초고반발 드라이버 피팅 전문 브랜드': 'masgolf-super-rebound-driver-fitting',
    '시니어 골퍼를 위한 드라이버': 'driver-for-senior-golfers',
    '고반발 드라이버 추천': 'high-rebound-driver-recommendation',
    '골프 비거리 증가': 'golf-distance-increase',
    '마쓰구 골프 후기': 'masgolf-review',
    '프리미엄 드라이버': 'premium-driver'
  };
  
  return slugMap[koreanTitle] || koreanTitle
    .toLowerCase()
    .replace(/[가-힣]/g, '') // 한글 제거
    .replace(/[^a-z0-9\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속 하이픈 제거
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
}

// 메인 실행 함수
async function main() {
  console.log('🚀 Wix 블로그 데이터 관리 시작...');
  
  // API 설정 가이드 출력
  printWixAPISetupGuide();
  
  // API를 통한 데이터 수집
  const posts = await getWixBlogDataViaAPI();
  
  if (posts.length > 0) {
    // SEO 설정 일괄 업데이트
    const seoSettings = {
      title: 'MASGOLF - 고반발 드라이버 전문 브랜드',
      description: 'MASGOLF 고반발 드라이버로 비거리 최대 25m 증가. 시니어 골퍼를 위한 전문 피팅 서비스.',
      keywords: ['고반발 드라이버', '골프 드라이버', '비거리 증가', '시니어 골프', 'MASGOLF'],
      noIndex: false
    };
    
    await updateWixSEOBulk(posts, seoSettings);
  }
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getWixBlogDataViaAPI,
  updateWixSEOBulk,
  convertToEnglishSlug
};
