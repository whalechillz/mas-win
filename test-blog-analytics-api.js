const fetch = require('node-fetch');

async function testBlogAnalyticsAPI() {
  console.log('🚀 블로그 분석 API 테스트 시작...');
  
  try {
    // API 엔드포인트 테스트
    console.log('📡 1. 블로그 분석 API 호출...');
    const response = await fetch('https://win.masgolf.co.kr/api/admin/blog-analytics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`📊 응답 상태: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API 응답 성공!');
      console.log('📈 응답 데이터:');
      console.log(JSON.stringify(data, null, 2));
      
      // 데이터 구조 확인
      if (data.totalViews !== undefined) {
        console.log(`📊 총 조회수: ${data.totalViews}`);
      }
      
      if (data.trafficSources && Array.isArray(data.trafficSources)) {
        console.log(`🚦 트래픽 소스: ${data.trafficSources.length}개`);
        data.trafficSources.forEach((source, index) => {
          console.log(`  ${index + 1}. ${source.source}: ${source.count}회`);
        });
      }
      
      if (data.searchKeywords && Array.isArray(data.searchKeywords)) {
        console.log(`🔍 검색어: ${data.searchKeywords.length}개`);
        data.searchKeywords.slice(0, 5).forEach((keyword, index) => {
          console.log(`  ${index + 1}. "${keyword.keyword}": ${keyword.count}회`);
        });
      }
      
      if (data.utmCampaigns && Array.isArray(data.utmCampaigns)) {
        console.log(`📢 UTM 캠페인: ${data.utmCampaigns.length}개`);
        data.utmCampaigns.slice(0, 5).forEach((campaign, index) => {
          console.log(`  ${index + 1}. ${campaign.campaign}: ${campaign.count}회`);
        });
      }
      
      if (data.blogViews && Array.isArray(data.blogViews)) {
        console.log(`📝 블로그별 조회수: ${data.blogViews.length}개`);
        data.blogViews.slice(0, 5).forEach((blog, index) => {
          console.log(`  ${index + 1}. "${blog.title}": ${blog.count}회`);
        });
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ API 응답 실패!');
      console.log('📄 에러 내용:', errorText);
    }
    
  } catch (error) {
    console.error('❌ API 테스트 중 오류 발생:', error.message);
  }
  
  console.log('✅ API 테스트 완료');
}

// 테스트 실행
testBlogAnalyticsAPI().catch(console.error);
