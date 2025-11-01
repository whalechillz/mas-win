// 누락된 메타데이터 자동 생성 및 동기화 API
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// URL 정규화 함수 (도메인 제거, 경로만 비교)
const normalizeUrl = (url) => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    // URL 파싱 실패 시 원본 반환
    return url;
  }
};

// 파일명에서 키워드 추출
const extractKeywordsFromFilename = (filename) => {
  const keywords = [];
  const parts = filename.toLowerCase()
    .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
    .split(/[-_.]/);
  
  const golfKeywords = {
    'golf': '골프',
    'driver': '드라이버',
    'club': '클럽',
    'iron': '아이언',
    'putter': '퍼터',
    'wedge': '웨지',
    'wood': '우드',
    'ball': '골프공',
    'tee': '티',
    'bag': '골프백',
    'glove': '골프장갑',
    'shoes': '골프화',
    'swing': '스윙',
    'course': '골프장',
    'green': '그린',
    'fairway': '페어웨이',
    'bunker': '벙커',
    'rough': '러프',
    'masgolf': '마스골프',
    'mas': '마스',
    'male': '남성',
    'female': '여성',
    'senior': '시니어',
    'young': '젊은'
  };
  
  parts.forEach(part => {
    if (golfKeywords[part]) {
      keywords.push(golfKeywords[part]);
    } else if (part.length > 2 && /^[a-z]+$/.test(part)) {
      keywords.push(part);
    }
  });
  
  return [...new Set(keywords)];
};

// OpenAI Vision API로 이미지 분석
const analyzeImageWithOpenAI = async (imageUrl) => {
  try {
    console.log('🤖 OpenAI Vision API 분석 시작:', imageUrl);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert image analyzer for golf-related content. 
Analyze the given image and provide SEO-optimized metadata in Korean.

Generate:
1. ALT text (50-125 characters): Description of the image for accessibility and SEO
2. Title (25-60 characters): SEO-optimized title
3. Description (80-160 characters): Detailed description
4. Keywords (comma-separated, max 10): Relevant Korean keywords

Return as JSON: {"alt_text": "...", "title": "...", "description": "...", "keywords": "..."}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "이 골프 관련 이미지에 대한 SEO 최적화된 메타데이터를 생성해주세요. ALT 텍스트, 제목, 설명, 키워드를 한국어로 제공해주세요."
            },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.3
    });

    const content = response.choices[0].message.content.trim();
    let metadata;
    
    try {
      // JSON 파싱 시도
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        metadata = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON not found');
      }
    } catch (parseError) {
      // JSON 파싱 실패 시 기본값 사용
      console.warn('⚠️ JSON 파싱 실패, 기본값 사용:', content);
      metadata = {
        alt_text: content.split('\n')[0] || '골프 이미지',
        title: '',
        description: content.substring(0, 160) || '',
        keywords: ''
      };
    }
    
    // 키워드를 배열로 변환
    if (typeof metadata.keywords === 'string') {
      metadata.keywords = metadata.keywords.split(',').map(k => k.trim()).filter(k => k);
    }
    
    console.log('✅ OpenAI Vision API 분석 완료');
    return metadata;
    
  } catch (error) {
    console.error('❌ OpenAI Vision API 오류:', error);
    return null;
  }
};

// Storage에서 모든 이미지 목록 조회 (배치 조회 지원)
const getAllStorageImages = async () => {
  try {
    const allFiles = [];
    
    const getAllImagesRecursively = async (folderPath = '') => {
      // ✅ 개선: 배치 조회로 모든 파일 가져오기 (타임아웃 방지)
      let offset = 0;
      const batchSize = 1000;  // 한 번에 가져올 파일 수
      let allFilesInFolder = [];
      
      while (true) {
        const { data: files, error } = await supabase.storage
          .from('blog-images')
          .list(folderPath, {
            limit: batchSize,
            offset: offset,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (error) {
          console.error(`❌ 폴더 조회 에러 (${folderPath}, offset: ${offset}):`, error);
          break;
        }

        if (!files || files.length === 0) {
          break;  // 더 이상 파일이 없음
        }

        allFilesInFolder = allFilesInFolder.concat(files);
        offset += batchSize;

        // 마지막 배치면 종료
        if (files.length < batchSize) {
          break;
        }
      }

      for (const file of allFilesInFolder) {
        if (!file.id) {
          // 폴더인 경우 재귀적으로 조회
          const subFolderPath = folderPath ? `${folderPath}/${file.name}` : file.name;
          await getAllImagesRecursively(subFolderPath);
        } else {
          // 이미지 파일인 경우
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
          const isImage = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
          
          if (isImage) {
            const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name;
            const { data: urlData } = supabase.storage
              .from('blog-images')
              .getPublicUrl(fullPath);
            
            allFiles.push({
              ...file,
              folderPath: folderPath,
              fullPath: fullPath,
              url: urlData.publicUrl
            });
          }
        }
      }
    };
    
    await getAllImagesRecursively('');
    console.log('✅ Storage 이미지 조회 완료:', allFiles.length, '개');
    return allFiles;
    
  } catch (error) {
    console.error('❌ Storage 이미지 조회 오류:', error);
    throw error;
  }
};

// 메타데이터가 없는 이미지 찾기 (최적화)
const findMissingMetadata = async (storageImages) => {
  try {
    // ✅ 개선: 배치 조회로 메타데이터 가져오기 (타임아웃 방지)
    console.log('📊 기존 메타데이터 조회 중...');
    // ✅ 수정: image_metadata 테이블에는 file_name 컬럼이 없으므로 image_url만 조회
    const { data: existingMetadata, error } = await supabase
      .from('image_metadata')
      .select('image_url')
      .limit(10000);  // ✅ 충분히 큰 limit 설정
    
    if (error) {
      console.error('❌ 메타데이터 조회 오류:', error);
      throw error;
    }
    
    console.log('📊 기존 메타데이터:', existingMetadata.length, '개');
    
    // ✅ 개선: 메모리 효율적인 Set 사용
    const existingUrls = new Set();
    const existingFileNames = new Set();
    
    if (existingMetadata) {
      existingMetadata.forEach(meta => {
        if (meta.image_url) {
          existingUrls.add(normalizeUrl(meta.image_url));
          
          // ✅ 개선: URL에서 파일명 추출 (image_metadata 테이블에는 file_name 컬럼이 없음)
          const urlParts = meta.image_url.split('/');
          const fileName = urlParts[urlParts.length - 1].split('?')[0]; // 쿼리 파라미터 제거
          if (fileName) {
            existingFileNames.add(fileName);
          }
        }
      });
    }
    
    console.log('📊 기존 URL 개수:', existingUrls.size, ', 파일명 개수:', existingFileNames.size);
    
    // ✅ 개선: 배치 처리로 메모리 효율성 향상
    const missingMetadata = [];
    const batchSize = 100;
    
    for (let i = 0; i < storageImages.length; i += batchSize) {
      const batch = storageImages.slice(i, i + batchSize);
      const batchMissing = batch.filter(img => {
        try {
          const normalizedUrl = normalizeUrl(img.url);
          const fileName = img.name || img.url?.split('/').pop()?.split('?')[0] || '';
          
          // ✅ URL 기준으로 먼저 확인, 없으면 파일명으로 확인
          const hasUrlMatch = existingUrls.has(normalizedUrl);
          const hasFileNameMatch = fileName && existingFileNames.has(fileName);
          
          // 메타데이터가 없는 경우 (URL도 파일명도 매칭 안됨)
          return !hasUrlMatch && !hasFileNameMatch;
        } catch (error) {
          console.error(`❌ 이미지 필터링 오류 (${img.name}):`, error);
          // 에러 발생 시 해당 이미지는 누락된 것으로 간주
          return true;
        }
      });
      
      missingMetadata.push(...batchMissing);
      
      // 진행률 로그
      if (i % 500 === 0 || i === storageImages.length - batchSize) {
        console.log(`📊 처리 진행: ${Math.min(i + batchSize, storageImages.length)}/${storageImages.length} (누락: ${missingMetadata.length}개)`);
      }
    }
    
    console.log('📊 누락된 메타데이터:', missingMetadata.length, '개');
    return missingMetadata;
    
  } catch (error) {
    console.error('❌ 누락된 메타데이터 찾기 오류:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { batch = false, limit = 50, images: specificImages } = req.body;
    
    console.log('🔄 메타데이터 동기화 시작...');
    
    let storageImages;
    let missingMetadata;
    
    // 특정 이미지 목록이 제공된 경우
    if (specificImages && Array.isArray(specificImages) && specificImages.length > 0) {
      storageImages = specificImages.map(img => ({
        name: img.name || img.fileName,
        url: img.url || img.image_url,
        fullPath: img.fullPath || img.folder_path ? `${img.folder_path}/${img.name || img.fileName}` : (img.name || img.fileName),
        folderPath: img.folder_path || img.folderPath || ''
      }));
      
      // 제공된 이미지 중 메타데이터가 없는 것 찾기
      missingMetadata = await findMissingMetadata(storageImages);
    } else {
      // ✅ 개선: 단계별 처리로 타임아웃 방지
      // 1. Storage에서 모든 이미지 조회
      try {
        console.log('📁 Storage 이미지 조회 시작...');
        storageImages = await getAllStorageImages();
        console.log('✅ Storage 이미지 조회 완료:', storageImages.length, '개');
      } catch (error) {
        console.error('❌ Storage 이미지 조회 오류:', error);
        return res.status(500).json({
          error: 'Storage 이미지 조회 중 오류가 발생했습니다.',
          details: error.message,
          step: 'getAllStorageImages'
        });
      }
      
      // 2. 메타데이터가 없는 이미지 찾기
      try {
        console.log('🔍 누락된 메타데이터 찾기 시작...');
        missingMetadata = await findMissingMetadata(storageImages);
        console.log('✅ 누락된 메타데이터 찾기 완료:', missingMetadata.length, '개');
      } catch (error) {
        console.error('❌ 메타데이터 찾기 오류:', error);
        return res.status(500).json({
          error: '메타데이터 찾기 중 오류가 발생했습니다.',
          details: error.message,
          step: 'findMissingMetadata'
        });
      }
    }
    
    if (missingMetadata.length === 0) {
      return res.status(200).json({
        success: true,
        message: '누락된 메타데이터가 없습니다.',
        total: storageImages.length,
        missing: 0,
        processed: 0
      });
    }
    
    // ✅ 배치 처리 여부 확인
    if (batch) {
      // 배치 모드: 진행률 반환, 클라이언트에서 순차 처리
      // ✅ 개선: limit 제한 제거 (모든 누락 메타데이터 반환)
      // limit은 클라이언트에서 표시용으로만 사용
      const returnLimit = Math.min(limit || missingMetadata.length, missingMetadata.length);
      
      return res.status(200).json({
        success: true,
        message: `누락된 메타데이터 ${missingMetadata.length}개 발견`,
        total: storageImages?.length || 0,
        missing: missingMetadata.length,
        // ✅ 개선: limit 제한 적용하되, 모든 데이터는 반환 (클라이언트에서 처리)
        images: missingMetadata.slice(0, returnLimit).map(img => ({
          name: img.name,
          url: img.url,
          fullPath: img.fullPath || (img.folderPath ? `${img.folderPath}/${img.name}` : img.name),
          folder_path: img.folderPath || ''
        })),
        // ✅ 모든 누락 메타데이터 정보 반환 (limit 제한 없음)
        missing_count: missingMetadata.length,
        display_limit: returnLimit,
        has_more: missingMetadata.length > returnLimit
      });
    }
    
    // 즉시 처리 모드: AI 메타데이터 생성 및 저장
    const processLimit = Math.min(limit, missingMetadata.length);
    let processed = 0;
    let errors = [];
    
    console.log(`📝 메타데이터 생성 시작 (${processLimit}개)...`);
    
    for (let i = 0; i < processLimit; i++) {
      const image = missingMetadata[i];
      
      try {
        // 파일명에서 키워드 추출 (기본값)
        const filenameKeywords = extractKeywordsFromFilename(image.name);
        
        // OpenAI Vision API로 이미지 분석 시도
        let metadata = await analyzeImageWithOpenAI(image.url);
        
        if (!metadata) {
          // AI 분석 실패 시 파일명 기반 기본 메타데이터 생성
          metadata = {
            alt_text: filenameKeywords.length > 0 
              ? `${filenameKeywords.slice(0, 3).join(' ')} 이미지 - 마스골프` 
              : `${image.name.replace(/\.[^/.]+$/, '')} 이미지`,
            title: image.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            description: filenameKeywords.length > 0 
              ? `${filenameKeywords.slice(0, 5).join(', ')} 관련 골프 이미지` 
              : '골프 관련 이미지',
            keywords: filenameKeywords
          };
        }
        
        // 키워드 통합
        const allKeywords = [...new Set([
          ...(metadata.keywords || []),
          ...filenameKeywords
        ])].slice(0, 10);
        
        // ✅ 메타데이터 저장 (image_metadata 테이블에는 file_name 컬럼이 없음)
        const metadataPayload = {
          image_url: image.url,  // ✅ UNIQUE 컬럼 (onConflict 기준)
          alt_text: metadata.alt_text || '',
          title: metadata.title || '',
          description: metadata.description || '',
          tags: allKeywords,  // ✅ 배열 타입
          upload_source: 'manual',
          status: 'active',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()  // ✅ 새 레코드 생성 시 필요
        };
        
        // ✅ image_url이 UNIQUE이므로 image_url 기준으로 upsert
        const { error: upsertError } = await supabase
          .from('image_metadata')
          .upsert(metadataPayload, { onConflict: 'image_url' });
        
        if (upsertError) {
          console.error(`❌ 메타데이터 저장 실패 (${image.name}):`, upsertError);
          errors.push({ image: image.name, error: upsertError.message });
        } else {
          processed++;
          console.log(`✅ 메타데이터 생성 완료 (${processed}/${processLimit}):`, image.name);
        }
        
        // API 호출 제한 방지 (간격 조절)
        if (i < processLimit - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error(`❌ 이미지 처리 오류 (${image.name}):`, error);
        errors.push({ image: image.name, error: error.message });
      }
    }
    
    console.log(`✅ 메타데이터 동기화 완료: ${processed}/${processLimit}개 처리`);
    
    return res.status(200).json({
      success: true,
      message: `메타데이터 동기화 완료: ${processed}개 처리, ${errors.length}개 오류`,
      total: storageImages.length,
      missing: missingMetadata.length,
      processed: processed,
      errors: errors,
      remaining: missingMetadata.length - processed
    });
    
  } catch (error) {
    console.error('❌ 메타데이터 동기화 오류:', error);
    return res.status(500).json({
      error: '메타데이터 동기화 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

