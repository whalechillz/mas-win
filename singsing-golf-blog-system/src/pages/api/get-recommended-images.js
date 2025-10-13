import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { title, excerpt, contentType, customerPersona } = req.body;

    if (!title && !excerpt) {
      return res.status(400).json({ message: '제목이나 요약이 필요합니다.' });
    }

    console.log('🔍 추천 이미지 검색 시작...');
    console.log('제목:', title);
    console.log('요약:', excerpt);

    // 기존 이미지 데이터베이스 (실제로는 데이터베이스에서 가져와야 함)
    const existingImages = [
      {
        url: '/uploads/1757341308977-cooling-sleeves.jpg',
        filename: 'cooling-sleeves.jpg',
        tags: ['골프', '여름', '쿨링', '액세서리'],
        description: '골프 쿨링 슬리브',
        uploadDate: '2025-01-13'
      },
      {
        url: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-AftKkt4uiMtgon7IOIlCmWEM/user-GSDsyr5yJnc95IIu8GSRSUi5/img-phkZI8AzRVvDhoasVUMKpzLr.png',
        filename: 'golfer-sunset-driver.png',
        tags: ['골프', '드라이버', '선셋', '골퍼', 'MASSGOO'],
        description: '선셋에 드라이버를 들고 있는 골퍼',
        uploadDate: '2025-01-13'
      },
      {
        url: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-AftKkt4uiMtgon7IOIlCmWEM/user-GSDsyr5yJnc95IIu8GSRSUi5/img-vyHP9lB4S6XpBrToUE2xgCuY.png',
        filename: 'golfer-driving-range.png',
        tags: ['골프', '드라이빙레인지', '연습', '골퍼'],
        description: '드라이빙 레인지에서 연습하는 골퍼',
        uploadDate: '2025-01-13'
      },
      {
        url: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-AftKkt4uiMtgon7IOIlCmWEM/user-GSDsyr5yJnc95IIu8GSRSUi5/img-zu2eb5JLwlSLXRk0PtDgnkLx.png',
        filename: 'golfer-course-swing.png',
        tags: ['골프', '코스', '스윙', '골퍼', 'MASSGOO'],
        description: '골프 코스에서 스윙하는 골퍼',
        uploadDate: '2025-01-13'
      },
      {
        url: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-AftKkt4uiMtgon7IOIlCmWEM/user-GSDsyr5yJnc95IIu8GSRSUi5/img-uwO04ooRFCVLopubx90awPcH.png',
        filename: 'golfer-fitting.png',
        tags: ['골프', '피팅', '맞춤', '드라이버', 'MASSGOO'],
        description: '드라이버 피팅을 받는 골퍼',
        uploadDate: '2025-01-13'
      },
      {
        url: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-AftKkt4uiMtgon7IOIlCmWEM/user-GSDsyr5yJnc95IIu8GSRSUi5/img-sTX8Dg7pZM6d2njarwrPkWTI.png',
        filename: 'golfer-success.png',
        tags: ['골프', '성공', '만족', '골퍼', 'MASSGOO'],
        description: '성공적인 골프 라운드 후 만족하는 골퍼',
        uploadDate: '2025-01-13'
      }
    ];

    // ChatGPT를 사용하여 콘텐츠와 관련성 분석
    const systemPrompt = `당신은 이미지 추천 전문가입니다. 주어진 콘텐츠(제목, 요약)와 기존 이미지들을 분석하여 가장 관련성이 높은 이미지들을 추천해주세요.

분석 기준:
1. 키워드 매칭: 콘텐츠의 주요 키워드와 이미지 태그/설명의 일치도
2. 콘텐츠 유형: ${contentType || '골프 정보'}에 적합한 이미지
3. 고객 페르소나: ${customerPersona || '중상급 골퍼'}에게 어필하는 이미지
4. 시각적 매력: 콘텐츠의 톤앤매너와 일치하는 이미지

응답 형식: JSON 배열
[
  {
    "url": "이미지 URL",
    "relevance": 85,
    "matchedKeywords": ["키워드1", "키워드2"],
    "reason": "추천 이유"
  }
]

관련도 점수: 0-100 (높을수록 관련성 높음)
최대 5개 이미지 추천`;

    const userPrompt = `콘텐츠 정보:
제목: ${title || ''}
요약: ${excerpt || ''}
콘텐츠 유형: ${contentType || '골프 정보'}
고객 페르소나: ${customerPersona || '중상급 골퍼'}

기존 이미지 목록:
${existingImages.map((img, index) => 
  `${index + 1}. URL: ${img.url}
   파일명: ${img.filename}
   태그: ${img.tags.join(', ')}
   설명: ${img.description}`
).join('\n\n')}

위 이미지들 중에서 현재 콘텐츠와 가장 관련성이 높은 이미지들을 추천해주세요.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    console.log('ChatGPT 응답:', response);

    // JSON 파싱 시도
    let recommendedImages;
    try {
      recommendedImages = JSON.parse(response);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      // JSON 파싱 실패 시 기본 추천 로직
      recommendedImages = existingImages.slice(0, 3).map((img, index) => ({
        url: img.url,
        relevance: 80 - (index * 10),
        matchedKeywords: img.tags.slice(0, 3),
        reason: '기본 추천'
      }));
    }

    if (!Array.isArray(recommendedImages) || recommendedImages.length === 0) {
      throw new Error('추천 이미지 생성에 실패했습니다.');
    }

    // 관련도 순으로 정렬
    recommendedImages.sort((a, b) => b.relevance - a.relevance);

    console.log('✅ 추천 이미지 생성 완료:', recommendedImages.length, '개');
    console.log('추천된 이미지들:', recommendedImages);

    res.status(200).json({
      success: true,
      recommendedImages: recommendedImages,
      metadata: {
        contentType,
        customerPersona,
        totalImages: existingImages.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('추천 이미지 생성 오류:', error);
    res.status(500).json({ 
      message: '추천 이미지 생성에 실패했습니다.',
      error: error.message 
    });
  }
}
