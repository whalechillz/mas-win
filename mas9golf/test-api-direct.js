// 마쓰구 브랜드 통합 AI API 직접 테스트

async function testBrandAPI() {
  console.log('🎯 마쓰구 브랜드 통합 AI API 테스트 시작...');
  
  const testCases = [
    {
      name: '이벤트/프로모션 - 뜨거운 오디언스 - 높은 브랜드 강도',
      data: {
        title: '초고반발 드라이버로 비거리 25m 증가하는 비밀',
        type: 'excerpt',
        contentType: 'event',
        audienceTemp: 'hot',
        brandWeight: 'high',
        location: 'suwon',
        painPoint: 'distance',
        audienceSegment: 'intermediate'
      }
    },
    {
      name: '골프 정보 - 따뜻한 오디언스 - 낮은 브랜드 강도',
      data: {
        title: '드라이버 비거리 향상을 위한 5가지 팁',
        type: 'content',
        contentType: 'information',
        audienceTemp: 'warm',
        brandWeight: 'low',
        location: 'yongin',
        painPoint: '',
        audienceSegment: 'beginner'
      }
    },
    {
      name: '고객 후기 - 차가운 오디언스 - 중간 브랜드 강도',
      data: {
        title: '실제 고객이 경험한 비거리 증가 후기',
        type: 'meta',
        contentType: 'testimonial',
        audienceTemp: 'cold',
        brandWeight: 'medium',
        location: 'bundang',
        painPoint: 'accuracy',
        audienceSegment: 'senior'
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 테스트 케이스: ${testCase.name}`);
    console.log('📊 전략 설정:', {
      contentType: testCase.data.contentType,
      audienceTemp: testCase.data.audienceTemp,
      brandWeight: testCase.data.brandWeight,
      location: testCase.data.location,
      painPoint: testCase.data.painPoint || '없음',
      audienceSegment: testCase.data.audienceSegment
    });
    
    try {
      const response = await fetch('http://localhost:3000/api/generate-localized-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ API 응답 성공!');
        console.log('📄 생성된 콘텐츠:', result.content);
        console.log('🎯 적용된 전략:', result.strategy);
        
        // 브랜드 키워드 포함 여부 확인
        const brandKeywords = ['MASGOLF', '마쓰구', '초고반발', '비거리', '반발계수'];
        const foundKeywords = brandKeywords.filter(keyword => 
          result.content.includes(keyword)
        );
        console.log('🎯 발견된 브랜드 키워드:', foundKeywords);
        console.log('📊 브랜드 키워드 포함률:', (foundKeywords.length / brandKeywords.length * 100).toFixed(1) + '%');
        
        // 지역 키워드 포함 여부 확인
        const localKeywords = ['수원', '용인', '분당', '광교', '갤러리아'];
        const foundLocalKeywords = localKeywords.filter(keyword => 
          result.content.includes(keyword)
        );
        console.log('📍 발견된 지역 키워드:', foundLocalKeywords);
        
      } else {
        console.log('❌ API 응답 실패:', response.status, response.statusText);
        const errorText = await response.text();
        console.log('에러 내용:', errorText);
      }
      
    } catch (error) {
      console.log('❌ API 호출 오류:', error.message);
    }
    
    console.log('─'.repeat(80));
  }
  
  console.log('\n🎉 마쓰구 브랜드 통합 AI API 테스트 완료!');
}

// Node.js 환경에서 fetch 사용을 위한 polyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testBrandAPI();
