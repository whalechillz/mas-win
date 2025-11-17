import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Google Vision API 제거됨 - OpenAI Vision API만 사용
// const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
// const GOOGLE_VISION_ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

// OpenAI Vision API 설정
import OpenAI from 'openai';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI 사용량 로그 기록 함수
async function logAIUsage(apiName, action, tokens, cost, processingTime) {
  try {
    await supabase
      .from('ai_usage_logs')
      .insert({
        api_name: apiName,
        action: action,
        total_tokens: tokens,
        cost: cost,
        processing_time_ms: processingTime,
        improvement_type: `${apiName}-${action}`,
        created_at: new Date().toISOString()
      });
    console.log(`📊 AI 사용량 로그 기록: ${apiName} - ${action} (${tokens} tokens, $${cost.toFixed(4)})`);
  } catch (error) {
    console.error('❌ AI 사용량 로그 기록 실패:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { imageUrl, imageId, forceReanalyze = false } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: '이미지 URL이 필요합니다.' });
    }

    console.log('🤖 이미지 AI 분석 시작:', imageUrl);

    // AI 사용량 로그 기록 시작
    const startTime = Date.now();
    let totalTokens = 0;
    let cost = 0;

    // 기존 분석 결과 확인 (재분석이 아닌 경우)
    if (!forceReanalyze && imageId) {
      const { data: existingAnalysis } = await supabase
        .from('image_assets')
        .select('ai_tags, ai_objects, ai_colors, ai_text_extracted, ai_confidence_score')
        .eq('id', imageId)
        .single();

      if (existingAnalysis && existingAnalysis.ai_tags?.length > 0) {
        console.log('✅ 기존 AI 분석 결과 사용');
        
        // 캐시된 결과도 로그에 기록
        await logAIUsage('image-ai-analyzer', 'image-analysis-cached', 0, 0, Date.now() - startTime);
        
        return res.status(200).json({
          success: true,
          analysis: existingAnalysis,
          source: 'cached'
        });
      }
    }

    // 이미지 다운로드
    const imageBuffer = await downloadImage(imageUrl);
    
    // AI 분석 실행 (OpenAI Vision + 메타데이터)
    const analysisResults = await Promise.allSettled([
      analyzeWithOpenAIVision(imageUrl),
      extractImageMetadata(imageBuffer)
    ]);

    // 결과 통합
    const combinedAnalysis = combineAnalysisResults(analysisResults);
    
    // SEO 최적화된 태그 생성
    const seoOptimizedTags = generateSEOTags(combinedAnalysis);
    
    // 데이터베이스 업데이트
    if (imageId) {
      await updateImageAnalysis(imageId, combinedAnalysis, seoOptimizedTags);
    }

    // AI 사용량 로그 기록
    const processingTime = Date.now() - startTime;
    const estimatedTokens = Math.ceil(combinedAnalysis.tags?.length * 2 + combinedAnalysis.objects?.length * 3 + combinedAnalysis.colors?.length * 1.5) || 50;
    const estimatedCost = estimatedTokens * 0.00015; // OpenAI Vision API 비용 (gpt-4o-mini)
    
    await logAIUsage('openai-vision-api', 'image-analysis-success', estimatedTokens, estimatedCost, processingTime);

    console.log('✅ 이미지 AI 분석 완료:', combinedAnalysis);

    return res.status(200).json({
      success: true,
      analysis: combinedAnalysis,
      seoOptimizedTags,
      source: 'ai_analysis'
    });

  } catch (error) {
    console.error('❌ 이미지 AI 분석 오류:', error);
    return res.status(500).json({
      error: '이미지 AI 분석 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

// 이미지 다운로드
async function downloadImage(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`이미지 다운로드 실패: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('이미지 다운로드 오류:', error);
    throw error;
  }
}

// OpenAI Vision API 분석
async function analyzeWithOpenAIVision(imageUrl) {
  try {
    console.log('🤖 OpenAI Vision API 분석 시작:', imageUrl);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert image analyzer for golf-related content. 
Analyze the given image and extract relevant keywords and tags in Korean.

Guidelines:
- Extract golf-related keywords (골프, 드라이버, 아이언, 퍼터, 웨지, 우드, 골프장, 그린, 페어웨이, 벙커, 러프)
- Extract person-related keywords (남성, 여성, 성인, 젊은, 나이든, 미소, 행복한, 웃음)
- Extract environment keywords (야외, 스포츠, 자연, 하늘, 구름, 일몰, 일출, 잔디, 나무, 호수, 산, 언덕)
- Extract color keywords (흰색, 검은색, 파란색, 초록색, 빨간색, 노란색, 갈색, 회색)
- Extract clothing keywords (폴로셔츠, 바지, 모자, 캡, 바이저, 장갑, 신발)
- Extract brand keywords (아디다스, 나이키, 푸마, 타이틀리스트, 캘러웨이, 테일러메이드, 핑, 미즈노)
- Return only the keywords separated by commas
- Maximum 8 keywords
- All keywords should be in Korean`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "이 이미지에서 골프 관련 키워드를 추출해주세요. 한국어로 8개 이하의 키워드를 쉼표로 구분해서 반환해주세요."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 100,
      temperature: 0.1
    });

    const keywordsText = response.choices[0].message.content.trim();
    const keywords = keywordsText.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    console.log('✅ OpenAI Vision API 키워드 추출 완료:', keywords);
    
    return {
      labels: keywords.map(keyword => ({
        name: keyword,
        confidence: 0.9,
        source: 'openai_vision'
      })),
      objects: [],
      text: '',
      colors: [],
      safeSearch: null
    };

  } catch (error) {
    console.error('OpenAI Vision API 오류:', error);
    return null;
  }
}

// AWS Rekognition 제거됨 - Google Vision만 사용

// 이미지 메타데이터 추출 및 최적화
async function extractImageMetadata(imageBuffer) {
  try {
    // Sharp 동적 import (Vercel 환경 호환성)
    const sharp = (await import('sharp')).default;
    
    const metadata = await sharp(imageBuffer).metadata();
    
    // 다양한 크기의 이미지 생성
    const optimizedImages = await generateOptimizedImages(imageBuffer, sharp);
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: imageBuffer.length,
      hasAlpha: metadata.hasAlpha,
      density: metadata.density,
      colorspace: metadata.space,
      optimizedImages: optimizedImages
    };

  } catch (error) {
    console.error('이미지 메타데이터 추출 오류:', error);
    return null;
  }
}

// 다양한 크기의 최적화된 이미지 생성
async function generateOptimizedImages(imageBuffer, sharp) {
  try {
    const optimizedImages = {};
    
    // 썸네일 (300x300)
    optimizedImages.thumbnail = await sharp(imageBuffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    // 중간 크기 (800x600)
    optimizedImages.medium = await sharp(imageBuffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    // WebP 버전 (고품질)
    optimizedImages.webp = await sharp(imageBuffer)
      .webp({ quality: 90 })
      .toBuffer();
    
    // WebP 썸네일
    optimizedImages.webpThumbnail = await sharp(imageBuffer)
      .resize(300, 300, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();
    
    console.log('✅ 다양한 크기의 이미지 생성 완료');
    return optimizedImages;
    
  } catch (error) {
    console.error('이미지 최적화 오류:', error);
    return null;
  }
}

// Google Vision 결과 파싱
function parseGoogleVisionResults(response) {
  const result = {
    labels: [],
    objects: [],
    text: '',
    colors: [],
    safeSearch: null
  };

  // 라벨 추출
  if (response.labelAnnotations) {
    result.labels = response.labelAnnotations.map(label => ({
      name: label.description,
      confidence: label.score,
      source: 'google_vision'
    }));
  }

  // 객체 추출
  if (response.localizedObjectAnnotations) {
    result.objects = response.localizedObjectAnnotations.map(obj => ({
      name: obj.name,
      confidence: obj.score,
      source: 'google_vision'
    }));
  }

  // 텍스트 추출
  if (response.textAnnotations && response.textAnnotations.length > 0) {
    result.text = response.textAnnotations[0].description;
  }

  // 색상 추출
  if (response.imagePropertiesAnnotation?.dominantColors?.colors) {
    result.colors = response.imagePropertiesAnnotation.dominantColors.colors.map(color => ({
      color: `rgb(${color.color.red}, ${color.color.green}, ${color.color.blue})`,
      score: color.score,
      pixelFraction: color.pixelFraction
    }));
  }

  // 안전 검색
  if (response.safeSearchAnnotation) {
    result.safeSearch = response.safeSearchAnnotation;
  }

  return result;
}

// AWS Rekognition 제거됨

// 분석 결과 통합
function combineAnalysisResults(results) {
  const combined = {
    tags: [],
    objects: [],
    colors: [],
    text: '',
    metadata: null,
    confidence: 0
  };

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      const data = result.value;
      
      if (data.labels) {
        combined.tags.push(...data.labels);
      }
      
      if (data.objects) {
        combined.objects.push(...data.objects);
      }
      
      if (data.colors) {
        combined.colors.push(...data.colors);
      }
      
      if (data.text) {
        combined.text = data.text;
      }
      
      if (data.width && data.height) {
        combined.metadata = data;
      }
    }
  });

  // 신뢰도 계산
  const allTags = combined.tags;
  if (allTags.length > 0) {
    combined.confidence = allTags.reduce((sum, tag) => sum + tag.confidence, 0) / allTags.length;
  }

  return combined;
}

// SEO 최적화된 태그 생성
function generateSEOTags(analysis) {
  const seoTags = [];
  
  // AI 태그를 SEO 친화적으로 변환
  analysis.tags.forEach(tag => {
    if (tag.confidence > 0.7) {
      // 한국어 태그 매핑
      const koreanTag = mapToKoreanTag(tag.name);
      if (koreanTag) {
        seoTags.push({
          name: koreanTag,
          type: 'seo_optimized',
          confidence: tag.confidence,
          original: tag.name
        });
      }
    }
  });

  // 골프 관련 태그 우선순위 부여
  const golfKeywords = ['골프', '드라이버', '클럽', '필드', '라운드', '스윙', '비거리'];
  seoTags.forEach(tag => {
    if (golfKeywords.some(keyword => tag.name.includes(keyword))) {
      tag.priority = 'high';
    }
  });

  return seoTags;
}

// 영어 태그를 한국어로 매핑
function mapToKoreanTag(englishTag) {
  const tagMapping = {
    // 골프 관련
    'golf': '골프',
    'golf club': '골프클럽',
    'driver': '드라이버',
    'iron': '아이언',
    'putter': '퍼터',
    'wedge': '웨지',
    'wood': '우드',
    'golf course': '골프장',
    'golf ball': '골프공',
    'golf bag': '골프백',
    'golf glove': '골프장갑',
    'golf shoes': '골프화',
    'golf swing': '골프스윙',
    'golf tee': '골프티',
    'green': '그린',
    'fairway': '페어웨이',
    'bunker': '벙커',
    'rough': '러프',
    
    // 사람 관련
    'person': '사람',
    'man': '남성',
    'woman': '여성',
    'male': '남성',
    'female': '여성',
    'adult': '성인',
    'young': '젊은',
    'old': '나이든',
    'smile': '미소',
    'happy': '행복한',
    
    // 환경 관련
    'outdoor': '야외',
    'sport': '스포츠',
    'equipment': '장비',
    'landscape': '풍경',
    'nature': '자연',
    'sky': '하늘',
    'cloud': '구름',
    'sunset': '일몰',
    'sunrise': '일출',
    'grass': '잔디',
    'tree': '나무',
    'water': '물',
    'lake': '호수',
    'mountain': '산',
    'hill': '언덕',
    'building': '건물',
    'car': '자동차',
    
    // 색상 관련
    'white': '흰색',
    'black': '검은색',
    'blue': '파란색',
    'green': '초록색',
    'red': '빨간색',
    'yellow': '노란색',
    'brown': '갈색',
    'gray': '회색',
    'grey': '회색',
    
    // 의류 관련
    'shirt': '셔츠',
    'polo': '폴로셔츠',
    'pants': '바지',
    'hat': '모자',
    'cap': '캡',
    'visor': '바이저',
    'glove': '장갑',
    'shoes': '신발',
    
    // 브랜드 관련
    'adidas': '아디다스',
    'nike': '나이키',
    'puma': '푸마',
    'titleist': '타이틀리스트',
    'callaway': '캘러웨이',
    'taylor made': '테일러메이드',
    'ping': '핑',
    'mizuno': '미즈노'
  };

  return tagMapping[englishTag.toLowerCase()] || englishTag;
}

// 데이터베이스 업데이트
async function updateImageAnalysis(imageId, analysis, seoTags) {
  try {
    // 이미지 자산 테이블 업데이트
    const { error: updateError } = await supabase
      .from('image_assets')
      .update({
        ai_tags: analysis.tags,
        ai_objects: analysis.objects,
        ai_colors: analysis.colors,
        ai_text_extracted: analysis.text,
        ai_confidence_score: analysis.confidence,
        updated_at: new Date().toISOString()
      })
      .eq('id', imageId);

    if (updateError) {
      throw updateError;
    }

    // 기존 태그 삭제
    await supabase
      .from('image_tags')
      .delete()
      .eq('image_id', imageId);

    // 새 태그 삽입
    if (seoTags.length > 0) {
      const tagInserts = seoTags.map(tag => ({
        image_id: imageId,
        tag_name: tag.name,
        tag_type: tag.type,
        confidence_score: tag.confidence
      }));

      const { error: tagsError } = await supabase
        .from('image_tags')
        .insert(tagInserts);

      if (tagsError) {
        throw tagsError;
      }
    }

    console.log('✅ 이미지 분석 결과 데이터베이스 업데이트 완료');

  } catch (error) {
    console.error('❌ 데이터베이스 업데이트 오류:', error);
    throw error;
  }
}
