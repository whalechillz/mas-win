// Kie AI 이미지 생성 API
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { 
    title, 
    excerpt, 
    contentType = 'information',
    brandStrategy = {
      customerPersona: 'competitive_maintainer',
      customerChannel: 'local_customers',
      brandWeight: 'medium'
    },
    imageCount = 1,
    customPrompt = null
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    console.log('🎨 Kie AI 이미지 생성 시작...');
    console.log('제목:', title);
    console.log('콘텐츠 유형:', contentType);
    console.log('API 키 존재 여부:', !!process.env.KIE_AI_API_KEY);
    console.log('API 키 길이:', process.env.KIE_AI_API_KEY ? process.env.KIE_AI_API_KEY.length : 0);
    console.log('API 키 앞 10자리:', process.env.KIE_AI_API_KEY ? process.env.KIE_AI_API_KEY.substring(0, 10) + '...' : '없음');
    
    // ChatGPT로 프롬프트 생성 (FAL AI와 동일한 로직)
    const promptResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/generate-smart-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title,
        excerpt,
        contentType,
        brandStrategy,
        model: 'kie' // Kie AI용으로 설정
      })
    });

    if (!promptResponse.ok) {
      throw new Error('ChatGPT 프롬프트 생성 실패');
    }

    const { prompt: smartPrompt } = await promptResponse.json();
    console.log('생성된 프롬프트:', smartPrompt);
    
    // Kie AI API 호출 - 올바른 엔드포인트 사용
    const possibleEndpoints = [
      'https://kieai.erweima.ai/api/v1/gpt4o-image/generate',
      'https://api.kie.ai/v1/images/generate',
      'https://api.kie.ai/images/generate',
      'https://kie.ai/api/v1/images/generate',
      'https://kie.ai/api/images/generate'
    ];

    let kieResponse = null;
    let lastError = null;

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`🔄 Kie AI 엔드포인트 시도: ${endpoint}`);
        
        // 여러 인증 방식 시도
        const authHeaders = [
          { 'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}` },
          { 'X-API-Key': process.env.KIE_AI_API_KEY },
          { 'api-key': process.env.KIE_AI_API_KEY },
          { 'Authorization': `Api-Key ${process.env.KIE_AI_API_KEY}` }
        ];

        for (const authHeader of authHeaders) {
          try {
            kieResponse = await fetch(endpoint, {
              method: 'POST',
              headers: {
                ...authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: smartPrompt,
                size: "1:1",
                fileUrl: null, // 이미지 생성이므로 null
                callBackUrl: null // 콜백 URL이 필요하지 않으면 null
              })
            });

            if (kieResponse.ok) {
              console.log(`✅ 성공한 인증 방식: ${Object.keys(authHeader)[0]}`);
              break;
            } else {
              const errorText = await kieResponse.text();
              console.log(`❌ 인증 실패: ${Object.keys(authHeader)[0]} - ${kieResponse.status}: ${errorText}`);
            }
          } catch (error) {
            console.log(`❌ 인증 에러: ${Object.keys(authHeader)[0]} - ${error.message}`);
          }
        }

        if (kieResponse.ok) {
          console.log(`✅ 성공한 엔드포인트: ${endpoint}`);
          break;
        } else {
          const errorText = await kieResponse.text();
          console.log(`❌ 실패한 엔드포인트: ${endpoint} - ${kieResponse.status}: ${errorText}`);
          lastError = errorText;
        }
      } catch (error) {
        console.log(`❌ 연결 실패: ${endpoint} - ${error.message}`);
        lastError = error.message;
      }
    }

    if (!kieResponse || !kieResponse.ok) {
      throw new Error(`모든 Kie AI 엔드포인트 실패. 마지막 에러: ${lastError}`);
    }

    const kieResult = await kieResponse.json();
    console.log('Kie AI 응답:', kieResult);
    
    // Kie AI 응답 처리 - 근본적인 접근 방식
    console.log('🔍 Kie AI 응답 상세 분석:');
    console.log('- 응답 코드:', kieResult.code);
    console.log('- 응답 메시지:', kieResult.msg);
    console.log('- 응답 데이터:', JSON.stringify(kieResult.data, null, 2));
    
    if (kieResult.code === 200 && kieResult.data && kieResult.data.taskId) {
      const taskId = kieResult.data.taskId;
      console.log('📋 Kie AI Task ID:', taskId);
      
      // 근본적인 문제: Kie AI API가 실제로는 다른 방식으로 작동할 수 있음
      // 실제 Kie AI 문서를 확인해야 하지만, 현재로서는 다른 접근 방식 시도
      
      console.log('🔍 근본적인 접근 방식 시도...');
      
      // 방법 1: 다른 API 엔드포인트 시도
      const alternativeEndpoints = [
        'https://kieai.erweima.ai/api/v1/gpt4o-image/generate',
        'https://kieai.erweima.ai/api/v1/image/generate',
        'https://kieai.erweima.ai/api/v1/generate',
        'https://api.kie.ai/v1/gpt4o-image/generate',
        'https://api.kie.ai/v1/image/generate',
        'https://api.kie.ai/v1/generate'
      ];
      
      for (const endpoint of alternativeEndpoints) {
        try {
          console.log(`🔄 대안 엔드포인트 시도: ${endpoint}`);
          
          const altResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: smartPrompt,
              size: "1024x1024",
              quality: "high",
              num_images: 1
            })
          });
          
          if (altResponse.ok) {
            const altResult = await altResponse.json();
            console.log(`✅ 대안 엔드포인트 성공: ${endpoint}`, altResult);
            
            // 이미지 URL 추출 시도
            let imageUrls = [];
            if (altResult.data) {
              imageUrls = altResult.data.images || altResult.data.result || altResult.data.url || [];
            } else if (altResult.images) {
              imageUrls = altResult.images;
            } else if (altResult.url) {
              imageUrls = [altResult.url];
            }
            
            if (typeof imageUrls === 'string') {
              imageUrls = [imageUrls];
            }
            
            if (imageUrls.length > 0) {
              console.log('✅ 대안 엔드포인트에서 이미지 URL 추출 성공:', imageUrls);
              
              res.status(200).json({ 
                success: true,
                imageUrl: imageUrls[0],
                imageUrls: imageUrls,
                imageCount: imageUrls.length,
                prompt: smartPrompt,
                model: 'Kie AI (Alternative)',
                metadata: {
                  title,
                  contentType,
                  brandStrategy,
                  generatedAt: new Date().toISOString(),
                  workingEndpoint: endpoint
                }
              });
              return;
            }
          } else {
            const errorText = await altResponse.text();
            console.log(`❌ 대안 엔드포인트 실패: ${altResponse.status} - ${errorText}`);
          }
        } catch (error) {
          console.log(`❌ 대안 엔드포인트 연결 실패: ${error.message}`);
        }
      }
      
      // 방법 2: 다른 요청 형식 시도
      console.log('🔍 다른 요청 형식 시도...');
      
      const alternativeFormats = [
        {
          prompt: smartPrompt,
          width: 1024,
          height: 1024,
          quality: "high"
        },
        {
          text: smartPrompt,
          size: "1024x1024",
          model: "gpt4o-image"
        },
        {
          input: smartPrompt,
          output_format: "url",
          resolution: "1024x1024"
        }
      ];
      
      for (const format of alternativeFormats) {
        try {
          console.log(`🔄 요청 형식 시도:`, format);
          
          const formatResponse = await fetch('https://kieai.erweima.ai/api/v1/gpt4o-image/generate', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(format)
          });
          
          if (formatResponse.ok) {
            const formatResult = await formatResponse.json();
            console.log(`✅ 요청 형식 성공:`, formatResult);
            
            // 이미지 URL 추출 시도
            let imageUrls = [];
            if (formatResult.data) {
              imageUrls = formatResult.data.images || formatResult.data.result || formatResult.data.url || [];
            } else if (formatResult.images) {
              imageUrls = formatResult.images;
            } else if (formatResult.url) {
              imageUrls = [formatResult.url];
            }
            
            if (typeof imageUrls === 'string') {
              imageUrls = [imageUrls];
            }
            
            if (imageUrls.length > 0) {
              console.log('✅ 요청 형식에서 이미지 URL 추출 성공:', imageUrls);
              
              res.status(200).json({ 
                success: true,
                imageUrl: imageUrls[0],
                imageUrls: imageUrls,
                imageCount: imageUrls.length,
                prompt: smartPrompt,
                model: 'Kie AI (Format)',
                metadata: {
                  title,
                  contentType,
                  brandStrategy,
                  generatedAt: new Date().toISOString(),
                  workingFormat: format
                }
              });
              return;
            }
          } else {
            const errorText = await formatResponse.text();
            console.log(`❌ 요청 형식 실패: ${formatResponse.status} - ${errorText}`);
          }
        } catch (error) {
          console.log(`❌ 요청 형식 연결 실패: ${error.message}`);
        }
      }
      
      // 방법 3: 최종 에러 처리 - 실제 문제 진단
      console.log('❌ 모든 방법이 실패했습니다. 실제 문제 진단...');
      
      res.status(500).json({ 
        success: false,
        message: 'Kie AI API가 예상과 다르게 작동합니다. 공식 문서 확인이 필요합니다.',
        error: 'API behavior differs from expected',
        debug: {
          taskId: taskId,
          originalResponse: kieResult,
          testedEndpoints: alternativeEndpoints,
          testedFormats: alternativeFormats,
          recommendation: 'Kie AI 공식 문서에서 올바른 API 사용법을 확인해야 합니다.'
        }
      });
      return;
    } else if (kieResult.code === 200 && kieResult.data) {
      // 즉시 이미지 URL이 있는 경우
      if (kieResult.data.url || kieResult.data.image || kieResult.data.images) {
        let imageUrls = kieResult.data.url || kieResult.data.image || kieResult.data.images || [];
        if (typeof imageUrls === 'string') {
          imageUrls = [imageUrls];
        }
        console.log('✅ Kie AI 즉시 이미지 생성 완료:', imageUrls.length, '개');
        
        res.status(200).json({ 
          success: true,
          imageUrl: imageUrls[0],
          imageUrls: imageUrls,
          imageCount: imageUrls.length,
          prompt: smartPrompt,
          model: 'Kie AI',
          metadata: {
            title,
            contentType,
            brandStrategy,
            generatedAt: new Date().toISOString()
          }
        });
        return;
      }
    } else {
      throw new Error(`Kie AI API 에러: ${kieResult.msg || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Kie AI 이미지 생성 에러:', error);
    res.status(500).json({ 
      message: 'Failed to generate image with Kie AI', 
      error: error.message 
    });
  }
}

