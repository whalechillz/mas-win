import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Google Vision API 설정
const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
const GOOGLE_VISION_ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

// AWS Rekognition 제거됨 - Google Vision만 사용

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
    
    // AI 분석 실행 (Google Vision + 메타데이터만)
    const analysisResults = await Promise.allSettled([
      analyzeWithGoogleVision(imageBuffer),
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
    const estimatedCost = estimatedTokens * 0.0000015; // Google Vision API 대략적 비용
    
    await logAIUsage('google-vision-api', 'image-analysis-success', estimatedTokens, estimatedCost, processingTime);

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

// Google Vision API 분석
async function analyzeWithGoogleVision(imageBuffer) {
  if (!GOOGLE_VISION_API_KEY) {
    console.log('⚠️ Google Vision API 키가 설정되지 않음');
    return null;
  }

  try {
    const base64Image = imageBuffer.toString('base64');
    
    const requestBody = {
      requests: [{
        image: { content: base64Image },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 20 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
          { type: 'TEXT_DETECTION' },
          { type: 'IMAGE_PROPERTIES' },
          { type: 'SAFE_SEARCH_DETECTION' }
        ]
      }]
    };

    const response = await fetch(GOOGLE_VISION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Google Vision API 오류: ${response.status}`);
    }

    const data = await response.json();
    return parseGoogleVisionResults(data.responses[0]);

  } catch (error) {
    console.error('Google Vision API 오류:', error);
    return null;
  }
}

// AWS Rekognition 제거됨 - Google Vision만 사용

// 이미지 메타데이터 추출 및 최적화
async function extractImageMetadata(imageBuffer) {
  try {
    // Sharp 라이브러리 사용
    const sharp = await import('sharp');
    
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
    'golf': '골프',
    'golf club': '골프클럽',
    'driver': '드라이버',
    'golf course': '골프장',
    'golf ball': '골프공',
    'person': '사람',
    'man': '남성',
    'woman': '여성',
    'outdoor': '야외',
    'sport': '스포츠',
    'equipment': '장비',
    'landscape': '풍경',
    'nature': '자연',
    'sky': '하늘',
    'grass': '잔디',
    'tree': '나무',
    'water': '물',
    'building': '건물',
    'car': '자동차'
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
