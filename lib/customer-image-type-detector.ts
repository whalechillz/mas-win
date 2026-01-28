/**
 * 고객 이미지 타입 자동 감지
 * 이미지 내용 분석 (OpenAI Vision API) + 파일명/경로 분석을 통한 타입 감지
 */

import { detectScannedDocument } from './scanned-document-detector';

export interface ImageTypeDetectionResult {
  scene: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 0; // 0은 서류
  type: 'happy' | 'problem' | 'group' | 'guide' | 'sita' | 'artwall' | 'product' | 'swing' | 'signature' | 'golf-course' | 'docs';
  confidence: number;
  keywords: string[];
  detectionMethod: 'ai-analysis' | 'filename' | 'default' | 'story-scene';
}

/**
 * 이미지 타입 자동 감지 (이미지 내용 분석 + 파일명 분석)
 */
export async function detectCustomerImageType(
  imageUrl: string,
  fileName: string,
  filePath?: string,
  metadataType: 'golf-ai' | 'general' = 'golf-ai',
  altText?: string | null,
  description?: string | null
): Promise<ImageTypeDetectionResult> {
  console.log('🔍 [장면 감지 시작] detectCustomerImageType 호출:', {
    fileName,
    filePath,
    metadataType,
    altText: altText?.substring(0, 50),
    description: description?.substring(0, 50)
  });
  
  // 1. 파일명/경로 기반 빠른 감지 (비용 절약)
  console.log('📝 [1단계] 파일명 기반 감지 시작');
  const filenameDetection = detectFromFilename(fileName, filePath);
  console.log('📝 [1단계] 파일명 기반 감지 결과:', {
    scene: filenameDetection.scene,
    type: filenameDetection.type,
    confidence: filenameDetection.confidence,
    detectionMethod: filenameDetection.detectionMethod
  });
  
  if (filenameDetection.confidence >= 0.9) {
    console.log('✅ [1단계] 파일명 기반 감지 결과 사용 (신뢰도 >= 0.9)');
    return filenameDetection;
  }
  
  // 2. 이미지 내용 분석 (OpenAI Vision API)
  console.log('📡 [2단계] AI 이미지 내용 분석 시작');
  try {
    const aiAnalysis = await analyzeImageContent(imageUrl, metadataType);
    console.log('📡 [2단계] AI 분석 결과 (처음 200자):', aiAnalysis.substring(0, 200));
    
    // 3. 스토리 기반 장면 감지 (프리셋 기반) - 최우선 적용
    console.log('🎬 [3단계] 스토리 기반 장면 감지 시작');
    const storySceneDetection = detectStorySceneFromImage(aiAnalysis, altText, description);
    console.log('🎬 [3단계] 스토리 기반 감지 결과:', {
      scene: storySceneDetection.scene,
      type: storySceneDetection.type,
      confidence: storySceneDetection.confidence,
      keywords: storySceneDetection.keywords
    });
    
    // 스토리 기반 감지 결과가 높은 신뢰도면 우선 사용
    if (storySceneDetection.confidence >= 0.7) {
      console.log('✅ [3단계] 스토리 기반 감지 결과 사용 (신뢰도 >= 0.7)');
      return {
        ...storySceneDetection,
        detectionMethod: 'story-scene'
      };
    }
    
    // 기존 AI 분석 결과
    console.log('🤖 [4단계] 기존 AI 분석 결과 생성');
    const aiDetection = detectFromAIAnalysis(aiAnalysis);
    console.log('🤖 [4단계] 기존 AI 분석 결과:', {
      scene: aiDetection.scene,
      type: aiDetection.type,
      confidence: aiDetection.confidence
    });
    
    // AI 분석 결과가 높은 신뢰도면 사용
    if (aiDetection.confidence >= 0.8) {
      console.log('✅ [4단계] 기존 AI 분석 결과 사용 (신뢰도 >= 0.8)');
      return {
        ...aiDetection,
        detectionMethod: 'ai-analysis'
      };
    }
    
    // 파일명 감지와 AI 분석 결과 결합 (단, 기본값 S3은 피함)
    if (filenameDetection.confidence >= 0.7 && filenameDetection.scene !== 3) {
      console.log('✅ [5단계] 파일명 기반 감지 결과 사용 (신뢰도 >= 0.7, S3 아님)');
      return filenameDetection;
    }
    
    // 기본값 S3 대신 스토리 기반 감지 결과 사용 (신뢰도가 낮아도)
    if (storySceneDetection.confidence >= 0.5) {
      console.log('⚠️ [5단계] 낮은 신뢰도지만 스토리 기반 감지 결과 사용 (S3 피하기):', {
        scene: storySceneDetection.scene,
        type: storySceneDetection.type,
        confidence: storySceneDetection.confidence
      });
      return {
        ...storySceneDetection,
        detectionMethod: 'story-scene'
      };
    }
    
    console.log('⚠️ [최종] 기존 AI 분석 결과 반환 (신뢰도 낮음):', {
      scene: aiDetection.scene,
      type: aiDetection.type,
      confidence: aiDetection.confidence
    });
    return aiDetection;
  } catch (error) {
    console.error('❌ [에러] 이미지 분석 실패, 파일명 기반 감지 사용:', error);
    return filenameDetection;
  }
}

/**
 * 파일명/경로 기반 감지
 */
function detectFromFilename(fileName: string, filePath?: string): ImageTypeDetectionResult {
  const lowerFileName = fileName.toLowerCase();
  const lowerFilePath = filePath?.toLowerCase() || '';
  
  // 서류 이미지 감지
  const docDetection = detectScannedDocument(fileName, filePath);
  if (docDetection.isDocument) {
    return {
      scene: 0,
      type: 'docs',
      confidence: 0.9,
      keywords: ['문서', '서류'],
      detectionMethod: 'filename'
    };
  }
  
  // 골프장 이미지 감지
  const golfKeywords = ['golf', '골프', 'field', 'course', 'green', '필드', '코스', '그린'];
  if (golfKeywords.some(keyword => 
    lowerFileName.includes(keyword) || lowerFilePath.includes(keyword)
  )) {
    return {
      scene: 1,
      type: 'golf-course',
      confidence: 0.8,
      keywords: ['골프장', '그린'],
      detectionMethod: 'filename'
    };
  }
  
  // 아트월 감지 (s5)
  const artwallKeywords = ['artwall', 'art-wall', '아트월', '벽면', '디스플레이'];
  if (artwallKeywords.some(keyword => 
    lowerFileName.includes(keyword) || lowerFilePath.includes(keyword)
  )) {
    return {
      scene: 5,
      type: 'artwall',
      confidence: 0.8,
      keywords: ['아트월', 'artwall'],
      detectionMethod: 'filename'
    };
  }
  
  // 시타장 감지 (s3)
  const sitaKeywords = ['sita', '시타', 'simulator', '시뮬레이터'];
  if (sitaKeywords.some(keyword => 
    lowerFileName.includes(keyword) || lowerFilePath.includes(keyword)
  )) {
    return {
      scene: 3,
      type: 'sita',
      confidence: 0.8,
      keywords: ['시타장', '시뮬레이터'],
      detectionMethod: 'filename'
    };
  }
  
  // 가이드/상담 감지 (s4)
  const guideKeywords = ['guide', '가이드', 'consultation', '상담', 'fitting', '피팅', 'measurement', '측정'];
  if (guideKeywords.some(keyword => 
    lowerFileName.includes(keyword) || lowerFilePath.includes(keyword)
  )) {
    return {
      scene: 4,
      type: 'guide',
      confidence: 0.8,
      keywords: ['가이드', '상담', '피팅'],
      detectionMethod: 'filename'
    };
  }
  
  // 스윙 감지 (s6)
  const swingKeywords = ['swing', '스윙'];
  if (swingKeywords.some(keyword => 
    lowerFileName.includes(keyword) || lowerFilePath.includes(keyword)
  )) {
    return {
      scene: 6,
      type: 'swing',
      confidence: 0.8,
      keywords: ['스윙', 'swing'],
      detectionMethod: 'filename'
    };
  }
  
  // 사인 감지 (s6)
  const signatureKeywords = ['signature', '사인'];
  if (signatureKeywords.some(keyword => 
    lowerFileName.includes(keyword) || lowerFilePath.includes(keyword)
  )) {
    return {
      scene: 6,
      type: 'signature',
      confidence: 0.8,
      keywords: ['사인', 'signature'],
      detectionMethod: 'filename'
    };
  }
  
  // 기본값: 골프장 이미지로 가정하고 S1로 분류 (S3 기본값 제거)
  // 골프 관련 키워드가 전혀 없어도 기본값으로 S1 사용
  console.log('⚠️ [파일명 감지] 기본값: S1 분류 (S3 기본값 제거)');
  return {
    scene: 1,
    type: 'happy',
    confidence: 0.4,
    keywords: ['golf-course', 'solo-shot'],
    detectionMethod: 'default'
  };
}

/**
 * OpenAI Vision API로 이미지 내용 분석
 */
async function analyzeImageContent(
  imageUrl: string,
  metadataType: 'golf-ai' | 'general'
): Promise<string> {
  try {
    const endpoint = metadataType === 'golf-ai'
      ? '/api/analyze-image-prompt'
      : '/api/analyze-image-general';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl,
        title: '이미지 타입 감지',
        excerpt: ''
      })
    });
    
    if (!response.ok) {
      throw new Error('이미지 분석 API 호출 실패');
    }
    
    const result = await response.json();
    // AI 분석 결과에서 키워드 추출
    const keywords = result.keywords || result.description || '';
    return keywords;
  } catch (error) {
    console.error('이미지 분석 API 오류:', error);
    throw error;
  }
}

/**
 * 스토리 기반 장면 감지 (프리셋 기반)
 * AI 이미지 생성 프리셋 규칙을 참고하여 정확한 장면 분류
 */
function detectStorySceneFromImage(
  aiAnalysis: string,
  altText?: string | null,
  description?: string | null
): ImageTypeDetectionResult {
  const combinedText = aiAnalysis + ' ' + (altText || '') + ' ' + (description || '');
  const lowerAnalysis = combinedText.toLowerCase();
  
  console.log('🎬 [스토리 감지] 분석 텍스트 (처음 300자):', combinedText.substring(0, 300));
  
  // 장면1 (S1): 행복한 주인공 - 골프장 단독샷
  // 특징: 골프장 + 단독샷 + 웃는 모습/밝은 표정 + 여유롭고 평화로운 골프 순간
  // 골프장 키워드가 있으면 우선적으로 S1/S6으로 분류 (S3 기본값 피함)
  const hasGolfCourse = lowerAnalysis.includes('골프장') || lowerAnalysis.includes('golf course') || 
                        lowerAnalysis.includes('코스') || lowerAnalysis.includes('course') ||
                        lowerAnalysis.includes('그린') || lowerAnalysis.includes('green') ||
                        lowerAnalysis.includes('페어웨이') || lowerAnalysis.includes('fairway') ||
                        lowerAnalysis.includes('골프') || lowerAnalysis.includes('golf') ||
                        lowerAnalysis.includes('fairway') || lowerAnalysis.includes('tee') ||
                        lowerAnalysis.includes('티샷') || lowerAnalysis.includes('tee shot');
  
  const hasHappyExpression = lowerAnalysis.includes('웃') || lowerAnalysis.includes('행복') || 
                             lowerAnalysis.includes('밝') || lowerAnalysis.includes('미소') ||
                             lowerAnalysis.includes('smile') || lowerAnalysis.includes('happy') || 
                             lowerAnalysis.includes('bright') || lowerAnalysis.includes('cheerful') ||
                             lowerAnalysis.includes('여유') || lowerAnalysis.includes('평화') ||
                             lowerAnalysis.includes('즐거') || lowerAnalysis.includes('만족');
  
  const isSolo = !lowerAnalysis.includes('여러 사람') && !lowerAnalysis.includes('여러명') &&
                 !lowerAnalysis.includes('그룹') && !lowerAnalysis.includes('group') &&
                 !lowerAnalysis.includes('multiple people') && !lowerAnalysis.includes('함께');
  
  const hasMultiplePeople = lowerAnalysis.includes('여러') || lowerAnalysis.includes('많은 사람') || 
                            lowerAnalysis.includes('multiple people') || lowerAnalysis.includes('배경에 사람') ||
                            lowerAnalysis.includes('다른 사람') || lowerAnalysis.includes('other people');
  
  // 골프장 + 행복한 표정이면 S1 또는 S6으로 분류
  if (hasGolfCourse && hasHappyExpression) {
    console.log('🎬 [스토리 감지] 골프장 + 행복한 표정 감지됨', {
      hasGolfCourse,
      hasHappyExpression,
      hasMultiplePeople
    });
    // 배경에 여러 사람이 있으면 S6, 없으면 S1
    if (hasMultiplePeople) {
      console.log('✅ [스토리 감지] S6 분류 (골프장 + 행복 + 여러 사람)');
      return {
        scene: 6,
        type: 'happy',
        confidence: 0.9,
        keywords: ['golf-course', 'solo-with-others', 'smiling', 'happy', 'luxurious-golf'],
        detectionMethod: 'story-scene'
      };
    }
    console.log('✅ [스토리 감지] S1 분류 (골프장 + 행복 + 단독샷)');
    return {
      scene: 1,
      type: 'happy',
      confidence: 0.9,
      keywords: ['golf-course', 'solo-shot', 'happy', 'luxurious-golf', 'peaceful'],
      detectionMethod: 'story-scene'
    };
  }
  
  // 골프장이 있지만 표정 정보가 없으면 기본적으로 S1로 분류 (S3 피함)
  if (hasGolfCourse && !hasHappyExpression && !lowerAnalysis.includes('어둡') && !lowerAnalysis.includes('dark')) {
    console.log('✅ [스토리 감지] S1 분류 (골프장 있음, 표정 정보 없음, S3 피함)');
    return {
      scene: 1,
      type: 'happy',
      confidence: 0.7,
      keywords: ['golf-course', 'solo-shot', 'golf'],
      detectionMethod: 'story-scene'
    };
  }
  
  console.log('🎬 [스토리 감지] 골프장/행복 조건 불일치:', {
    hasGolfCourse,
    hasHappyExpression,
    hasMultiplePeople
  });
  
  // 장면2 (S2): 여러 사람 등장
  // 특징: 골프장 + 여러 사람 + 그룹 사진
  if (
    (lowerAnalysis.includes('여러 사람') || lowerAnalysis.includes('여러명') || 
     lowerAnalysis.includes('그룹') || lowerAnalysis.includes('multiple people') ||
     lowerAnalysis.includes('group') || lowerAnalysis.includes('함께')) &&
    (lowerAnalysis.includes('골프장') || lowerAnalysis.includes('golf course') ||
     lowerAnalysis.includes('코스') || lowerAnalysis.includes('course'))
  ) {
    return {
      scene: 2,
      type: 'group',
      confidence: 0.85,
      keywords: ['golf-course', 'multiple-people', 'group', 'together'],
      detectionMethod: 'story-scene'
    };
  }
  
  // 장면3 (S3): 문제 발생
  // 특징: 어두운 표정, 문제, 오류, 부상, 러프, 부정적인 상황
  if (
    lowerAnalysis.includes('어둡') || lowerAnalysis.includes('부정') || 
    lowerAnalysis.includes('문제') || lowerAnalysis.includes('오류') ||
    lowerAnalysis.includes('부상') || lowerAnalysis.includes('러프') ||
    lowerAnalysis.includes('고민') || lowerAnalysis.includes('걱정') ||
    lowerAnalysis.includes('dark') || lowerAnalysis.includes('problem') ||
    lowerAnalysis.includes('error') || lowerAnalysis.includes('trouble') ||
    lowerAnalysis.includes('negative') || lowerAnalysis.includes('worried') ||
    lowerAnalysis.includes('injury') || lowerAnalysis.includes('rough')
  ) {
    return {
      scene: 3,
      type: 'problem',
      confidence: 0.9,
      keywords: ['problem', 'trouble', 'negative-expression', 'worry'],
      detectionMethod: 'story-scene'
    };
  }
  
  // 장면4 (S4): 가이드 만남
  // 특징: 상담, 피팅, 가이드 + 전화/매장
  if (
    (lowerAnalysis.includes('상담') || lowerAnalysis.includes('피팅') || 
     lowerAnalysis.includes('가이드') || lowerAnalysis.includes('consultation') ||
     lowerAnalysis.includes('fitting') || lowerAnalysis.includes('guide')) &&
    (lowerAnalysis.includes('전화') || lowerAnalysis.includes('매장') ||
     lowerAnalysis.includes('phone') || lowerAnalysis.includes('store') ||
     lowerAnalysis.includes('스튜디오') || lowerAnalysis.includes('studio'))
  ) {
    return {
      scene: 4,
      type: 'guide',
      confidence: 0.85,
      keywords: ['consultation', 'fitting', 'guide', 'sita'],
      detectionMethod: 'story-scene'
    };
  }
  
  // 장면5 (S5): 피팅 매장 / 스크린 골프
  // 특징: 피팅 매장, 스크린 골프, 실내, 피팅 프로, MASGOO 로고
  if (
    (lowerAnalysis.includes('피팅') || lowerAnalysis.includes('스크린 골프') ||
     lowerAnalysis.includes('fitting') || lowerAnalysis.includes('screen golf') ||
     lowerAnalysis.includes('시뮬레이터') || lowerAnalysis.includes('simulator')) &&
    (lowerAnalysis.includes('매장') || lowerAnalysis.includes('실내') ||
     lowerAnalysis.includes('store') || lowerAnalysis.includes('indoor') ||
     lowerAnalysis.includes('스튜디오') || lowerAnalysis.includes('studio'))
  ) {
    return {
      scene: 5,
      type: 'sita',
      confidence: 0.85,
      keywords: ['fitting-shop', 'screen-golf', 'indoor', 'sita', 'masgoo'],
      detectionMethod: 'story-scene'
    };
  }
  
  // 장면6 (S6): 골프장 고객 단독사진 (여러명 등장, 웃는 모습)
  // 특징: 골프장 + 단독샷 + 배경에 여러명 + 웃는 모습
  if (
    (lowerAnalysis.includes('골프장') || lowerAnalysis.includes('golf course') ||
     lowerAnalysis.includes('코스') || lowerAnalysis.includes('course')) &&
    (lowerAnalysis.includes('단독') || lowerAnalysis.includes('solo')) &&
    (lowerAnalysis.includes('여러') || lowerAnalysis.includes('많은') ||
     lowerAnalysis.includes('multiple') || lowerAnalysis.includes('배경에')) &&
    (lowerAnalysis.includes('웃') || lowerAnalysis.includes('행복') ||
     lowerAnalysis.includes('smile') || lowerAnalysis.includes('happy'))
  ) {
    return {
      scene: 6,
      type: 'happy',
      confidence: 0.9,
      keywords: ['golf-course', 'solo-with-others', 'smiling', 'happy'],
      detectionMethod: 'story-scene'
    };
  }
  
  // 장면7 (S7): 제품 클로즈업
  // 특징: 제품, 장비, 로고, 클로즈업, MASGOO
  if (
    (lowerAnalysis.includes('제품') || lowerAnalysis.includes('장비') ||
     lowerAnalysis.includes('로고') || lowerAnalysis.includes('product') ||
     lowerAnalysis.includes('equipment') || lowerAnalysis.includes('logo') ||
     lowerAnalysis.includes('masgoo') || lowerAnalysis.includes('massgoo')) &&
    (lowerAnalysis.includes('클로즈업') || lowerAnalysis.includes('가까이') ||
     lowerAnalysis.includes('close-up') || lowerAnalysis.includes('close') ||
     lowerAnalysis.includes('클로즈'))
  ) {
    return {
      scene: 7,
      type: 'product',
      confidence: 0.85,
      keywords: ['product', 'close-up', 'equipment', 'masgoo-logo'],
      detectionMethod: 'story-scene'
    };
  }
  
  // 기본값: 장면1 (골프장 단독샷) - S3 기본값 피함
  // 골프장 관련 키워드가 조금이라도 있으면 S1로 분류
  const hasAnyGolfKeyword = lowerAnalysis.includes('골프') || lowerAnalysis.includes('golf') || 
                            lowerAnalysis.includes('코스') || lowerAnalysis.includes('course') ||
                            lowerAnalysis.includes('그린') || lowerAnalysis.includes('green');
  
  if (hasAnyGolfKeyword) {
    console.log('✅ [스토리 감지] 기본값: S1 분류 (골프 키워드 발견, S3 피함)');
    return {
      scene: 1,
      type: 'happy',
      confidence: 0.6,
      keywords: ['golf-course', 'solo-shot'],
      detectionMethod: 'story-scene'
    };
  }
  
  // 골프 관련 키워드가 전혀 없어도 기본값으로 S1 사용 (S3 기본값 완전 제거)
  console.log('⚠️ [스토리 감지] 기본값: S1 분류 (골프 키워드 없음, S3 기본값 제거)');
  return {
    scene: 1,
    type: 'happy',
    confidence: 0.4,
    keywords: ['golf-course', 'solo-shot'],
    detectionMethod: 'story-scene'
  };
}

/**
 * AI 분석 결과 기반 타입 감지 (기존 로직 - 하위 호환성)
 */
function detectFromAIAnalysis(aiKeywords: string): ImageTypeDetectionResult {
  const lowerKeywords = aiKeywords.toLowerCase();
  
  // 서류 이미지 키워드
  const documentKeywords = ['문서', '주문서', '설문', '동의서', '양식', '표', '서류', 'scan', 'document', 'form'];
  if (documentKeywords.some(keyword => lowerKeywords.includes(keyword))) {
    return {
      scene: 0,
      type: 'docs',
      confidence: 0.9,
      keywords: ['문서', '서류'],
      detectionMethod: 'ai-analysis'
    };
  }
  
  // 아트월 감지 (s5)
  const artwallKeywords = ['아트월', 'artwall', '벽면', '디스플레이', 'display', 'wall'];
  if (artwallKeywords.some(keyword => lowerKeywords.includes(keyword))) {
    return {
      scene: 5,
      type: 'artwall',
      confidence: 0.85,
      keywords: ['아트월', 'artwall'],
      detectionMethod: 'ai-analysis'
    };
  }
  
  // 시타장 감지 (s3)
  const sitaKeywords = ['시타', '시뮬레이터', 'simulator', 'sita', '스크린', 'screen'];
  if (sitaKeywords.some(keyword => lowerKeywords.includes(keyword))) {
    return {
      scene: 3,
      type: 'sita',
      confidence: 0.85,
      keywords: ['시타장', '시뮬레이터'],
      detectionMethod: 'ai-analysis'
    };
  }
  
  // 가이드/상담 감지 (s4)
  const guideKeywords = ['상담', '가이드', '피팅', '측정', 'guide', 'consultation', 'fitting', 'measurement'];
  if (guideKeywords.some(keyword => lowerKeywords.includes(keyword))) {
    return {
      scene: 4,
      type: 'guide',
      confidence: 0.85,
      keywords: ['가이드', '상담', '피팅'],
      detectionMethod: 'ai-analysis'
    };
  }
  
  // 골프장 감지 (s1)
  const golfKeywords = ['골프장', '그린', '페어웨이', '벙커', '러프', 'golf course', 'green', 'fairway', '야외', '잔디'];
  if (golfKeywords.some(keyword => lowerKeywords.includes(keyword))) {
    return {
      scene: 1,
      type: 'golf-course',
      confidence: 0.85,
      keywords: ['골프장', '그린'],
      detectionMethod: 'ai-analysis'
    };
  }
  
  // 스윙 감지 (s6)
  const swingKeywords = ['스윙', 'swing'];
  if (swingKeywords.some(keyword => lowerKeywords.includes(keyword))) {
    return {
      scene: 6,
      type: 'swing',
      confidence: 0.8,
      keywords: ['스윙', 'swing'],
      detectionMethod: 'ai-analysis'
    };
  }
  
  // 사인 감지 (s6)
  const signatureKeywords = ['사인', 'signature'];
  if (signatureKeywords.some(keyword => lowerKeywords.includes(keyword))) {
    return {
      scene: 6,
      type: 'signature',
      confidence: 0.8,
      keywords: ['사인', 'signature'],
      detectionMethod: 'ai-analysis'
    };
  }
  
  // 기본값: 골프장 이미지로 가정하고 S1로 분류 (S3 기본값 제거)
  console.log('⚠️ [AI 분석] 기본값: S1 분류 (S3 기본값 제거)');
  return {
    scene: 1,
    type: 'happy',
    confidence: 0.5,
    keywords: ['golf-course', 'solo-shot'],
    detectionMethod: 'ai-analysis'
  };
}
