// Google AI로 이미지 분석 API
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Google AI API 키 확인
  if (!process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY === 'disabled') {
    console.log('⚠️ Google AI API 키 비활성화됨 - 비용 절약을 위해 사용 중단');
    return res.status(400).json({ 
      success: false, 
      error: 'Google AI API가 비용 절약을 위해 비활성화되었습니다.' 
    });
  }

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: '이미지 URL이 필요합니다.' });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return res.status(500).json({ error: 'Google AI API 키가 설정되지 않았습니다.' });
    }

    // Google AI Vision API로 이미지 분석
    const analysisResult = await analyzeImageWithGoogleAI(imageUrl);

    res.status(200).json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error('이미지 분석 오류:', error);
    res.status(500).json({ 
      error: '이미지 분석 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

async function analyzeImageWithGoogleAI(imageUrl) {
  try {
    // 이미지를 Base64로 변환
    const imageBase64 = await convertImageToBase64(imageUrl);

    // Google AI Vision API 호출
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `이 이미지를 자세히 분석해주세요. 다음 정보를 포함해서 설명해주세요:
1. 이미지의 주요 내용과 구성 요소
2. 색상과 분위기
3. 스타일과 톤
4. 촬영 각도와 구도
5. 이미지의 목적과 용도
6. 골프 관련 요소가 있다면 구체적으로 설명
7. 한국인이나 한국적인 요소가 있다면 언급
8. 이미지 생성 시 참고할 수 있는 상세한 프롬프트

한국어로 상세하게 설명해주세요.`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Google AI API 오류: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Google AI API 응답 형식이 올바르지 않습니다.');
    }

    const analysisText = data.candidates[0].content.parts[0].text;

    // 분석 결과를 구조화된 형태로 파싱
    const structuredAnalysis = parseAnalysisResult(analysisText);

    return {
      originalImageUrl: imageUrl,
      analysisText: analysisText,
      structuredAnalysis: structuredAnalysis,
      analyzedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`Google AI 이미지 분석 실패: ${error.message}`);
  }
}

async function convertImageToBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`이미지 다운로드 실패: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    return base64;
  } catch (error) {
    throw new Error(`이미지 Base64 변환 실패: ${error.message}`);
  }
}

function parseAnalysisResult(analysisText) {
  try {
    // 분석 결과를 구조화된 형태로 파싱
    const lines = analysisText.split('\n').filter(line => line.trim());
    
    const result = {
      mainContent: '',
      colors: '',
      style: '',
      composition: '',
      purpose: '',
      golfElements: '',
      koreanElements: '',
      prompt: ''
    };

    let currentSection = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('주요 내용') || trimmedLine.includes('구성 요소')) {
        currentSection = 'mainContent';
      } else if (trimmedLine.includes('색상') || trimmedLine.includes('분위기')) {
        currentSection = 'colors';
      } else if (trimmedLine.includes('스타일') || trimmedLine.includes('톤')) {
        currentSection = 'style';
      } else if (trimmedLine.includes('촬영 각도') || trimmedLine.includes('구도')) {
        currentSection = 'composition';
      } else if (trimmedLine.includes('목적') || trimmedLine.includes('용도')) {
        currentSection = 'purpose';
      } else if (trimmedLine.includes('골프')) {
        currentSection = 'golfElements';
      } else if (trimmedLine.includes('한국') || trimmedLine.includes('한국인')) {
        currentSection = 'koreanElements';
      } else if (trimmedLine.includes('프롬프트')) {
        currentSection = 'prompt';
      } else if (trimmedLine && currentSection) {
        result[currentSection] += (result[currentSection] ? ' ' : '') + trimmedLine;
      }
    }

    return result;
  } catch (error) {
    console.error('분석 결과 파싱 오류:', error);
    return {
      mainContent: analysisText,
      colors: '',
      style: '',
      composition: '',
      purpose: '',
      golfElements: '',
      koreanElements: '',
      prompt: ''
    };
  }
}
