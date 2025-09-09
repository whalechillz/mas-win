// AI 이미지 생성 기능 테스트
const testAIImageGeneration = async () => {
  const testData = {
    title: "신성대학교 골프학과 교수님의 선택은?",
    excerpt: "MASGOLF의 초고반발 드라이버와 맞춤 피팅을 통해 중급~상급 골퍼들을 위한 비거리 25m 증가 기술을 소개합니다.",
    contentType: "customer_story",
    brandStrategy: {
      customerPersona: "competitive_maintainer",
      customerChannel: "online_customers",
      brandWeight: "high"
    },
    imageCount: 2 // 2개 이미지 생성 테스트
  };

  try {
    console.log('🧪 AI 이미지 생성 테스트 시작...');
    console.log('테스트 데이터:', testData);
    
    const response = await fetch('http://localhost:3001/api/generate-blog-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ 테스트 성공!');
      console.log('생성된 이미지 개수:', result.imageCount);
      console.log('첫 번째 이미지 URL:', result.imageUrl);
      console.log('모든 이미지 URL:', result.imageUrls);
      console.log('사용된 프롬프트:', result.prompt);
      console.log('메타데이터:', result.metadata);
    } else {
      const error = await response.json();
      console.error('❌ 테스트 실패:', error);
    }
  } catch (error) {
    console.error('❌ 테스트 에러:', error);
  }
};

// 테스트 실행
testAIImageGeneration();
