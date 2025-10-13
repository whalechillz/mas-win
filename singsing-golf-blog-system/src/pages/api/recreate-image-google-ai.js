// Google AI로 이미지 재생성 API
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    const { analysisData, originalImageUrl } = req.body;

    if (!analysisData || !originalImageUrl) {
      return res.status(400).json({ error: '분석 데이터와 원본 이미지 URL이 필요합니다.' });
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      return res.status(500).json({ error: 'Google AI API 키가 설정되지 않았습니다.' });
    }

    // Google AI Imagen으로 이미지 재생성
    const recreatedImage = await recreateImageWithGoogleAI(analysisData, originalImageUrl);

    // 생성된 이미지를 Supabase Storage에 저장
    const savedImageUrl = await saveImageToSupabase(recreatedImage, originalImageUrl);

    res.status(200).json({
      success: true,
      data: {
        originalImageUrl,
        recreatedImageUrl: savedImageUrl,
        analysisData,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('이미지 재생성 오류:', error);
    res.status(500).json({ 
      error: '이미지 재생성 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

async function recreateImageWithGoogleAI(analysisData, originalImageUrl) {
  try {
    // 분석 데이터를 바탕으로 프롬프트 생성
    const prompt = generateImagePrompt(analysisData);

    // Google AI Imagen API 호출
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${process.env.GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        config: {
          number_of_images: 1,
          aspect_ratio: "ASPECT_RATIO_16_9",
          safety_filter_level: "BLOCK_SOME",
          person_generation: "ALLOW_ADULT"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Google AI Imagen API 오류: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    if (!data.generated_images || !data.generated_images[0]) {
      throw new Error('Google AI Imagen API 응답 형식이 올바르지 않습니다.');
    }

    return data.generated_images[0];

  } catch (error) {
    throw new Error(`Google AI 이미지 재생성 실패: ${error.message}`);
  }
}

function generateImagePrompt(analysisData) {
  try {
    let prompt = '';

    // 기본 프롬프트 구성
    if (analysisData.koreanElements) {
      prompt += `한국인 골퍼, 한국의 골프장 환경, `;
    }

    if (analysisData.golfElements) {
      prompt += `골프 드라이버, 골프 장비, 골프 스윙, `;
    }

    if (analysisData.mainContent) {
      prompt += `${analysisData.mainContent}, `;
    }

    if (analysisData.colors) {
      prompt += `${analysisData.colors}, `;
    }

    if (analysisData.style) {
      prompt += `${analysisData.style}, `;
    }

    if (analysisData.composition) {
      prompt += `${analysisData.composition}, `;
    }

    // 품질 향상 키워드 추가
    prompt += `고품질, 실사, 전문 사진, 자연광, 상세한 텍스처, 선명한 이미지, 4K 해상도`;

    // 부정 프롬프트
    const negativePrompt = `흐릿한 이미지, 낮은 품질, 왜곡된 이미지, 부자연스러운 색상, 인공적인 조명`;

    return {
      positive: prompt,
      negative: negativePrompt
    };

  } catch (error) {
    throw new Error(`프롬프트 생성 실패: ${error.message}`);
  }
}

async function saveImageToSupabase(imageData, originalImageUrl) {
  try {
    // 이미지 데이터를 Base64에서 Buffer로 변환
    const imageBuffer = Buffer.from(imageData.image_bytes, 'base64');
    
    // 파일명 생성
    const timestamp = Date.now();
    const fileName = `recreated-image-${timestamp}.jpg`;
    
    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });

    if (error) {
      throw new Error(`Supabase Storage 업로드 실패: ${error.message}`);
    }

    // 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;

  } catch (error) {
    throw new Error(`이미지 저장 실패: ${error.message}`);
  }
}
