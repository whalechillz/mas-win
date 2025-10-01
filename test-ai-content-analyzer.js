/**
 * 고급 콘텐츠 분석 시스템 직접 테스트
 */

async function testAIContentAnalyzer() {
  console.log('🤖 고급 콘텐츠 분석 시스템 테스트 시작...');
  
  // 테스트 데이터
  const testData = {
    title: "송정 샤브샤브 저녁코스 후기",
    excerpt: "맛있는 샤브샤브를 먹고 왔습니다. 신선한 야채와 고기가 정말 맛있었어요.",
    content: "오늘은 송정에 있는 샤브샤브 집에 갔습니다. 저녁 코스를 주문했는데 정말 만족스러웠습니다. 신선한 야채들과 고기가 정말 맛있었고, 서비스도 좋았습니다. 다음에도 또 가고 싶은 맛집입니다."
  };

  try {
    // 1. AI 콘텐츠 분석 API 호출
    console.log('\n📊 1단계: AI 콘텐츠 분석...');
    const analysisResponse = await fetch('http://localhost:3000/api/ai-content-analyzer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (analysisResponse.ok) {
      const analysisResult = await analysisResponse.json();
      console.log('✅ AI 콘텐츠 분석 결과:');
      console.log('  - 카테고리:', analysisResult.category);
      console.log('  - 신뢰도:', analysisResult.confidence);
      console.log('  - 키워드:', analysisResult.keywords);
      console.log('  - 추론:', analysisResult.reasoning);
      console.log('  - 제안:', analysisResult.suggestions);
    } else {
      console.error('❌ AI 콘텐츠 분석 실패:', analysisResponse.status);
    }

    // 2. 스마트 프롬프트 생성 API 호출
    console.log('\n🎨 2단계: 스마트 프롬프트 생성...');
    const promptResponse = await fetch('http://localhost:3000/api/generate-smart-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: testData.title,
        excerpt: testData.excerpt,
        contentType: 'restaurant', // 식당으로 강제 설정
        brandStrategy: '마쓰구 골프 드라이버 전문 브랜드'
      })
    });

    if (promptResponse.ok) {
      const promptResult = await promptResponse.json();
      console.log('✅ 스마트 프롬프트 생성 결과:');
      console.log('  - 프롬프트:', promptResult.prompt);
      console.log('  - 콘텐츠 타입:', promptResult.contentType);
      console.log('  - 브랜드 전략:', promptResult.brandStrategy);
    } else {
      console.error('❌ 스마트 프롬프트 생성 실패:', promptResponse.status);
    }

    // 3. AI 콘텐츠 추출기 테스트
    console.log('\n🔍 3단계: AI 콘텐츠 추출기 테스트...');
    const extractorResponse = await fetch('http://localhost:3000/api/admin/ai-content-extractor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: `<html><head><title>${testData.title}</title></head><body><p>${testData.content}</p></body></html>`,
        url: 'https://example.com/test',
        title: testData.title
      })
    });

    if (extractorResponse.ok) {
      const extractorResult = await extractorResponse.json();
      console.log('✅ AI 콘텐츠 추출 결과:');
      console.log('  - 제목:', extractorResult.data.title);
      console.log('  - 내용 길이:', extractorResult.data.content.length);
      console.log('  - 이미지 개수:', extractorResult.data.images.length);
      console.log('  - 메타데이터:', extractorResult.data.metadata);
    } else {
      console.error('❌ AI 콘텐츠 추출 실패:', extractorResponse.status);
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }
}

// 테스트 실행
testAIContentAnalyzer();
