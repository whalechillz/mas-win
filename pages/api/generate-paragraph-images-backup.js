import OpenAI from 'openai';
import { logOpenAIUsage, logFALAIUsage } from '../../lib/ai-usage-logger';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ChatGPT를 활용한 지능적 단락 분리 함수
async function splitContentWithAI(content, targetCount, title, excerpt) {
  const systemPrompt = `You are an expert content analyzer. Your task is to split the given content into ${targetCount} meaningful paragraphs that would work well for generating distinct images.

Guidelines:
- Each paragraph should be self-contained and represent a distinct visual concept
- Paragraphs should be roughly equal in length (100-200 characters each)
- Consider the natural flow and topics of the content
- Each paragraph should be suitable for creating a unique image
- Maintain the original meaning and context

Title: ${title}
Excerpt: ${excerpt}

Split the content into exactly ${targetCount} paragraphs. Return only the paragraphs separated by "|||PARAGRAPH_BREAK|||".`;

  const userPrompt = `Content to split:
${content}

Please split this into ${targetCount} meaningful paragraphs for image generation.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const result = response.choices[0].message.content.trim();
    const paragraphs = result.split('|||PARAGRAPH_BREAK|||').map(p => p.trim()).filter(p => p.length > 30);
    
    return paragraphs.length >= 2 ? paragraphs : null;
  } catch (error) {
    console.error('ChatGPT 단락 분리 오류:', error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { content, title, excerpt, contentType, imageCount, brandStrategy, blogPostId } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // 내용을 단락별로 분리 (HTML 태그 제거 후)
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    // 여러 방법으로 단락 분리 시도
    let paragraphs = [];
    
    // 방법 1: \n\n으로 분리
    paragraphs = cleanContent.split('\n\n').filter(p => p.trim().length > 30);
    
    // 방법 2: 문장 단위로 분리 (마침표 기준)
    if (paragraphs.length <= 1) {
      const sentences = cleanContent.split(/[.!?]\s+/).filter(s => s.trim().length > 20);
      // 문장들을 2-3개씩 묶어서 단락 만들기
      for (let i = 0; i < sentences.length; i += 2) {
        const paragraph = sentences.slice(i, i + 2).join('. ') + '.';
        if (paragraph.trim().length > 30) {
          paragraphs.push(paragraph);
        }
      }
    }
    
    // 3단계: ChatGPT를 활용한 지능적 분리 (내용이 충분히 길고 복잡할 때만)
    if (paragraphs.length <= 1 && cleanContent.length > 500) {
      try {
        console.log('🧠 ChatGPT를 활용한 지능적 단락 분리 시도...');
        const aiParagraphs = await splitContentWithAI(cleanContent, imageCount || 4, title, excerpt);
        if (aiParagraphs && aiParagraphs.length > 1) {
          paragraphs = aiParagraphs;
          console.log('✅ ChatGPT 단락 분리 성공:', paragraphs.length, '개');
        }
      } catch (error) {
        console.warn('⚠️ ChatGPT 단락 분리 실패, 규칙 기반으로 폴백:', error.message);
      }
    }
    
    // 4단계: 최후 수단 - 강제 균등 분할
    if (paragraphs.length <= 1 && cleanContent.length > 200) {
      const chunkSize = Math.ceil(cleanContent.length / (imageCount || 4));
      for (let i = 0; i < cleanContent.length; i += chunkSize) {
        const chunk = cleanContent.substring(i, i + chunkSize).trim();
        if (chunk.length > 30) {
          paragraphs.push(chunk);
        }
      }
    }
    
    // 최소 50자 이상인 단락만 유지
    paragraphs = paragraphs.filter(p => p.trim().length > 50);
    
    console.log(`📝 단락 분석: 총 ${paragraphs.length}개 단락 발견`);
    
    if (paragraphs.length === 0) {
      return res.status(400).json({ message: '이미지 생성에 적합한 단락이 없습니다. (최소 50자 이상)' });
    }
    
    const paragraphImages = [];

    // 각 단락에 대해 이미지 생성 (imageCount 또는 최대 4개 단락)
    const maxParagraphs = Math.min(paragraphs.length, imageCount || 4);
    for (let i = 0; i < maxParagraphs; i++) { // 최대 4개 단락
      const paragraph = paragraphs[i].trim();
      const startedAt = Date.now();
      
      // 각 이미지 생성 사이에 지연 시간 추가 (첫 번째 이미지 제외)
      if (i > 0) {
        console.log(`⏳ 단락 ${i + 1} 이미지 생성 전 5초 대기...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 대기
      }
      
      // 단락 내용을 기반으로 이미지 프롬프트 생성
      const imagePrompt = await generateParagraphImagePrompt(paragraph, title, excerpt, contentType, brandStrategy, i);
      
      // FAL AI hidream-i1-dev로 이미지 생성 (고품질 + 타임아웃 설정)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2분 타임아웃
      
      try {
        const falResponse = await fetch('https://fal.run/fal-ai/hidream-i1-dev', {
          method: 'POST',
          headers: {
            'Authorization': `Key ${process.env.FAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: imagePrompt,
            num_images: 1,
            image_size: "square",
            num_inference_steps: 28,
            seed: null
          }),
          signal: controller.signal // 타임아웃 시 요청 중단
        });
        
        clearTimeout(timeoutId);

        if (!falResponse.ok) {
          const errorText = await falResponse.text();
          throw new Error(`FAL AI API 오류: ${falResponse.status} - ${errorText}`);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.warn(`⚠️ 단락 ${i + 1} FAL AI 요청 타임아웃 (2분 초과)`);
          // 타임아웃 발생 시에도 다음 이미지 생성 시도
          continue;
        } else {
          console.error(`❌ 단락 ${i + 1} FAL AI 요청 오류:`, error);
          // 다른 오류 발생 시에도 다음 이미지 생성 시도
          continue;
        }
      }

        const falResult = await falResponse.json();
        console.log('✅ FAL AI hidream-i1-dev 응답:', falResult);

        // FAL AI 사용량 로깅
        await logFALAIUsage('generate-paragraph-images', 'image-generation', {
          paragraphIndex: i,
          prompt: imagePrompt,
          imageCount: 1,
          durationMs: Date.now() - startedAt
        });

        // hidream-i1-dev는 동기식 응답
        if (!falResult.images || falResult.images.length === 0) {
          throw new Error('FAL AI에서 이미지를 생성하지 못했습니다.');
        }

        const imageResponse = { data: [{ url: falResult.images[0].url }] };

        // 이미지를 Supabase에 직접 저장 (다른 API들과 동일한 방식)
        try {
        console.log(`🔄 단락 ${i + 1} 이미지 Supabase 저장 시작...`);
        
        // 외부 이미지 URL에서 이미지 데이터 다운로드
        const imageFetchResponse = await fetch(imageResponse.data[0].url);
        if (!imageFetchResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageFetchResponse.status}`);
        }
        
        const imageBuffer = await imageFetchResponse.arrayBuffer();
        const fileName = `paragraph-image-${Date.now()}-${i + 1}.png`;
        
        // Supabase Storage에 업로드
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: false
          });
        
        if (uploadError) {
          throw new Error(`Supabase 업로드 실패: ${uploadError.message}`);
        }
        
        // 공개 URL 생성
        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fileName);
        
        const storedUrl = publicUrl;
        console.log(`✅ 단락 ${i + 1} 이미지 Supabase 저장 성공:`, {
          originalUrl: imageResponse.data[0].url,
          storedUrl: storedUrl,
          fileName: fileName
        });
        
        paragraphImages.push({
          paragraphIndex: i,
          paragraph: paragraph.substring(0, 100) + '...', // 미리보기용
          imageUrl: storedUrl, // Supabase 저장된 URL 사용
          originalUrl: imageResponse.data[0].url, // 원본 URL도 보관
          prompt: imagePrompt
        });
        } catch (saveError) {
          console.error(`❌ 단락 ${i + 1} 이미지 저장 오류:`, saveError);
          // 저장 실패 시 원본 URL 사용
          paragraphImages.push({
            paragraphIndex: i,
            paragraph: paragraph.substring(0, 100) + '...',
            imageUrl: imageResponse.data[0].url,
            prompt: imagePrompt
          });
        }
      } catch (imageError) {
        console.error(`❌ 단락 ${i + 1} 이미지 생성/저장 전체 오류:`, imageError);
        // 이미지 생성/저장 실패 시에도 다음 이미지 생성 시도
        continue;
      }
    }

    // 5단계: 자동 메타데이터 생성 및 적용
    if (paragraphImages.length > 0) {
      console.log('📝 단락별 이미지 메타데이터 자동 생성 시작...');
      try {
        const metadataItems = paragraphImages.map((img, index) => ({
          name: `paragraph-image-${Date.now()}-${index + 1}.png`,
          url: img.imageUrl,
          alt_text: '',
          title: '',
          description: '',
          keywords: [],
          category: contentType || 'general'
        }));
        
        // 메타데이터 생성 API 호출을 건너뛰고 기본값으로 처리 (API 에러 방지)
        console.log('⚠️ 메타데이터 생성 API 호출 건너뛰기 (API 에러 방지)');
        console.log('📝 생성된 이미지들:', paragraphImages.map(img => img.imageUrl));
      } catch (error) {
        console.warn('⚠️ 단락별 이미지 메타데이터 생성 중 오류:', error);
      }
    }

    res.status(200).json({
      success: true,
      imageUrls: paragraphImages.map(img => img.imageUrl),
      paragraphImages: paragraphImages,
      totalParagraphs: paragraphs.length
    });

  } catch (error) {
    console.error('단락별 이미지 생성 오류:', error);
    res.status(500).json({ 
      message: 'Failed to generate paragraph images',
      error: error.message 
    });
  }
}

// 단락별 이미지 프롬프트 생성 함수
async function generateParagraphImagePrompt(paragraph, title, excerpt, contentType, brandStrategy, paragraphIndex) {
  try {
    // 브랜드 전략에 따른 톤앤매너 설정
    let toneAndManner = "";
    let personaKeywords = "";
    let styleKeywords = "";
    
    if (brandStrategy && brandStrategy.persona) {
      switch (brandStrategy.persona) {
        case 'senior_fitting':
          toneAndManner = "골드톤, 시니어 매너";
          personaKeywords = "Korean male golfer in his 60s, warm golden hour lighting, classic golf course, elegant, traditional";
          styleKeywords = "warm golden hour lighting, classic golf course setting, elegant traditional atmosphere";
          break;
        case 'tech_enthusiast':
          toneAndManner = "블랙톤, 젊은 매너";
          personaKeywords = "Korean male golfer in his 30s, sleek athletic build, modern golf attire, confident expression";
          styleKeywords = "sleek modern design, high-tech golf simulator, cool blue lighting, futuristic golf equipment, black and white color scheme, contemporary architecture, professional golf store interior, modern golf technology";
          break;
        case 'high_rebound_enthusiast':
          toneAndManner = "골드톤, 시니어 매너";
          personaKeywords = "Korean male golfer in his 50s, warm lighting, professional golf setting";
          styleKeywords = "warm professional lighting, high-end golf equipment, sophisticated atmosphere";
          break;
        case 'competitive_maintainer':
          toneAndManner = "블랙톤, 젊은 매너";
          personaKeywords = "Korean male golfer in his 40s, modern athletic design, competitive golf environment";
          styleKeywords = "modern athletic design, competitive golf environment, dynamic lighting";
          break;
        default:
          toneAndManner = "중립적 톤앤매너";
          personaKeywords = "Korean male golfer, natural lighting, professional golf setting";
          styleKeywords = "natural lighting, professional golf setting, clean composition";
      }
    } else {
      toneAndManner = "기본 톤앤매너";
      personaKeywords = "Korean male golfer, natural lighting, professional golf setting";
      styleKeywords = "natural lighting, professional golf setting, clean composition";
    }
    
    console.log(`🎨 브랜드 전략 기반 톤앤매너 적용: ${toneAndManner}`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 전문적인 AI 이미지 생성 프롬프트 작성자입니다.
          
          단락 내용을 기반으로 다양한 시각적 요소를 포함한 이미지 프롬프트를 작성해주세요.
          
          프롬프트 작성 규칙:
          1. 단락의 핵심 내용을 시각적으로 표현
          2. 다양한 상황과 장면 생성 (드라이버만 들고 있는 모습 피하기)
          3. 한국인 골퍼가 주인공 (${personaKeywords})
          4. MASSGOO 브랜드 자연스럽게 포함
          5. 다양한 시간대와 환경 활용
          6. 텍스트나 글자는 절대 포함하지 않음
          7. 각 단락마다 다른 시각적 요소 활용
          8. 브랜드 전략에 따른 톤앤매너 적용: ${toneAndManner}
          9. 스타일 키워드: ${styleKeywords}
          
          단락별 시각적 요소 가이드 (이미지 최적화 제안 참조):
          - 0번째 단락: 고객의 방문, 만남, 인사 장면 (매장 외관, 웰컴 데스크, 인사하는 직원)
          - 1번째 단락: 피팅 과정, 테스트, 검사 장면 (피팅 룸, 테스트 장비, 상담하는 모습)
          - 2번째 단락: 결과, 만족, 성과 장면 (만족스러운 표정, 성과 차트, 추천하는 모습)
          
          톤앤매너 일관성 유지:
          - 골드톤: 따뜻한 조명, 전통적인 분위기, 시니어 골퍼, 클래식한 골프장
          - 블랙톤: 차가운 조명, 현대적인 분위기, 젊은 골퍼, 하이테크 골프 시설
          
          이미지 최적화 제안 우선순위:
          1. 매장 내부/외관 이미지 (전문적이고 신뢰할 수 있는 분위기)
          2. 피팅/테스트 과정 이미지 (전문성과 정확성 강조)
          3. 고객 만족/성과 이미지 (결과와 만족도 강조)
          4. 제품/장비 이미지 (MASSGOO 드라이버, 골프 용품)
          5. 골프장/자연 환경 이미지 (골프의 즐거움과 성취감)
          
          다양한 이미지 타입 지원:
          - 인물 이미지: 골퍼, 상담사, 직원 등
          - 풍경 이미지: 골프장, 자연 경관, 매장 외관
          - 사물 이미지: 드라이버, 골프 용품, 장비
          - 상황별 이미지: 매장 내부, 테스트 장면, 상담 공간
          
          상황에 따른 이미지 선택:
          - 인물이 필요한 경우: 골퍼, 상담사, 직원
          - 풍경이 적합한 경우: 골프장, 자연, 매장 외관
          - 사물이 적합한 경우: 드라이버, 골프 용품, 장비
          - 상황이 적합한 경우: 매장 내부, 테스트 장면
          
          응답은 영어로 된 이미지 생성 프롬프트만 제공하세요.
          
          FAL AI 최적화:
          - Ultra-realistic, photorealistic, 8K resolution
          - ${styleKeywords}
          - Authentic Korean people, natural expressions
          - Professional commercial photography style
          - No text, no overlays, clean composition
          - 브랜드 전략 톤앤매너: ${toneAndManner}`
        },
        {
          role: "user",
          content: `제목: "${title}"
요약: "${excerpt || '요약이 없습니다.'}"
단락 ${paragraphIndex + 1}: "${paragraph}"`
        }
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    // ChatGPT 사용량 로깅
    await logOpenAIUsage('generate-paragraph-images', 'prompt-generation', response, {
      paragraphIndex,
      paragraph: paragraph.substring(0, 100) + '...'
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('단락별 프롬프트 생성 오류:', error);
    // 브랜드 전략 기반 기본 프롬프트 반환
    return `${personaKeywords} in a golf-related scene, ${styleKeywords}, professional photography style, no text, clean composition.`;
  }
}
