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
    
    // Kie AI 응답 처리 - 단계별 디버깅
    console.log('🔍 Kie AI 응답 상세 분석:');
    console.log('- 응답 코드:', kieResult.code);
    console.log('- 응답 메시지:', kieResult.msg);
    console.log('- 응답 데이터:', JSON.stringify(kieResult.data, null, 2));
    
    if (kieResult.code === 200 && kieResult.data && kieResult.data.taskId) {
      const taskId = kieResult.data.taskId;
      console.log('📋 Kie AI Task ID:', taskId);
      
      // 단계 1: 다양한 상태 확인 엔드포인트 시도
      console.log('🔍 단계 1: 상태 확인 엔드포인트 테스트 시작...');
      
      const statusEndpoints = [
        `https://kieai.erweima.ai/api/v1/gpt4o-image/status/${taskId}`,
        `https://kieai.erweima.ai/api/v1/gpt4o-image/result/${taskId}`,
        `https://kieai.erweima.ai/api/v1/task/status/${taskId}`,
        `https://kieai.erweima.ai/api/v1/task/result/${taskId}`,
        `https://api.kie.ai/v1/task/status/${taskId}`,
        `https://api.kie.ai/v1/task/result/${taskId}`,
        `https://kieai.erweima.ai/api/v1/gpt4o-image/${taskId}`,
        `https://kieai.erweima.ai/api/v1/task/${taskId}`,
        `https://api.kie.ai/v1/gpt4o-image/status/${taskId}`,
        `https://api.kie.ai/v1/gpt4o-image/result/${taskId}`
      ];
      
      let workingEndpoint = null;
      let workingResponse = null;
      
      for (const endpoint of statusEndpoints) {
        try {
          console.log(`🔄 테스트 중: ${endpoint}`);
          
          const testResponse = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`,
              'Content-Type': 'application/json',
            }
          });
          
          console.log(`📊 응답 상태: ${testResponse.status}`);
          
          if (testResponse.ok) {
            const testResult = await testResponse.json();
            console.log(`✅ 작동하는 엔드포인트 발견: ${endpoint}`);
            console.log('응답 내용:', JSON.stringify(testResult, null, 2));
            workingEndpoint = endpoint;
            workingResponse = testResult;
            break;
          } else {
            const errorText = await testResponse.text();
            console.log(`❌ 실패: ${testResponse.status} - ${errorText}`);
          }
        } catch (error) {
          console.log(`❌ 연결 실패: ${error.message}`);
        }
      }
      
      if (workingEndpoint && workingResponse) {
        console.log('🎉 작동하는 엔드포인트를 찾았습니다!');
        
        // 이미지 URL 추출 시도
        let imageUrls = [];
        if (workingResponse.data) {
          imageUrls = workingResponse.data.images || workingResponse.data.result || workingResponse.data.url || [];
        }
        if (typeof imageUrls === 'string') {
          imageUrls = [imageUrls];
        }
        
        if (imageUrls.length > 0) {
          console.log('✅ 이미지 URL 추출 성공:', imageUrls);
          
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
              generatedAt: new Date().toISOString(),
              workingEndpoint: workingEndpoint
            }
          });
          return;
        }
      }
      
      // 단계 2: 다른 접근 방식 시도
      console.log('🔍 단계 2: 다른 접근 방식 시도...');
      
      // Webhook 방식 시도
      const webhookEndpoints = [
        `https://kieai.erweima.ai/api/v1/gpt4o-image/webhook/${taskId}`,
        `https://kieai.erweima.ai/api/v1/task/webhook/${taskId}`,
        `https://api.kie.ai/v1/task/webhook/${taskId}`
      ];
      
      for (const endpoint of webhookEndpoints) {
        try {
          console.log(`🔄 웹훅 테스트: ${endpoint}`);
          
          const webhookResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              taskId: taskId,
              callback: 'https://win.masgolf.co.kr/api/kie-ai-callback'
            })
          });
          
          if (webhookResponse.ok) {
            const webhookResult = await webhookResponse.json();
            console.log(`✅ 웹훅 성공: ${endpoint}`, webhookResult);
            
            // 웹훅이 성공하면 잠시 대기 후 다시 확인
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // 다시 상태 확인
            const retryResponse = await fetch(workingEndpoint || statusEndpoints[0], {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`,
                'Content-Type': 'application/json',
              }
            });
            
            if (retryResponse.ok) {
              const retryResult = await retryResponse.json();
              console.log('🔄 재시도 응답:', retryResult);
              
              let retryImageUrls = [];
              if (retryResult.data) {
                retryImageUrls = retryResult.data.images || retryResult.data.result || retryResult.data.url || [];
              }
              if (typeof retryImageUrls === 'string') {
                retryImageUrls = [retryImageUrls];
              }
              
              if (retryImageUrls.length > 0) {
                console.log('✅ 재시도 후 이미지 URL 추출 성공:', retryImageUrls);
                
                res.status(200).json({ 
                  success: true,
                  imageUrl: retryImageUrls[0],
                  imageUrls: retryImageUrls,
                  imageCount: retryImageUrls.length,
                  prompt: smartPrompt,
                  model: 'Kie AI',
                  metadata: {
                    title,
                    contentType,
                    brandStrategy,
                    generatedAt: new Date().toISOString(),
                    method: 'webhook_retry'
                  }
                });
                return;
              }
            }
          }
        } catch (error) {
          console.log(`❌ 웹훅 실패: ${error.message}`);
        }
      }
      
      // 단계 3: 최종 에러 처리
      console.log('❌ 모든 방법이 실패했습니다. 상세한 에러 정보를 반환합니다.');
      
      res.status(500).json({ 
        success: false,
        message: 'Kie AI 이미지 생성 실패 - 모든 엔드포인트 테스트 완료',
        error: 'No working endpoint found',
        debug: {
          taskId: taskId,
          testedEndpoints: statusEndpoints,
          workingEndpoint: workingEndpoint,
          workingResponse: workingResponse
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

