// 이미지 메타데이터 관리 API (SEO 최적화)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Google Vision API를 사용한 이미지 분석 (실제 구현 시 API 키 필요)
const analyzeImageWithGoogleVision = async (imageUrl) => {
  // 실제 구현 시 Google Vision API 사용
  // 현재는 더미 데이터 반환
  return {
    labels: ['골프', '드라이버', '스포츠', '장비'],
    confidence: 0.95,
    dominantColors: ['#2D5016', '#FFFFFF', '#1A1A1A'],
    text: null,
    faces: 0
  };
};

// 이미지 파일명에서 SEO 키워드 추출
const extractKeywordsFromFilename = (filename) => {
  const keywords = [];
  
  // 파일명에서 하이픈, 언더스코어, 점으로 분리
  const parts = filename.toLowerCase()
    .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
    .split(/[-_.]/);
  
  // 골프 관련 키워드 매핑
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
    'mas': '마스'
  };
  
  parts.forEach(part => {
    if (golfKeywords[part]) {
      keywords.push(golfKeywords[part]);
    } else if (part.length > 2) {
      keywords.push(part);
    }
  });
  
  return [...new Set(keywords)]; // 중복 제거
};

// SEO 최적화된 alt 텍스트 생성
const generateSEOAltText = (filename, labels = []) => {
  const keywords = extractKeywordsFromFilename(filename);
  const allKeywords = [...keywords, ...labels];
  
  // 골프 관련 키워드 우선순위
  const priorityKeywords = ['골프', '드라이버', '마스골프', '클럽', '스윙'];
  const sortedKeywords = allKeywords.sort((a, b) => {
    const aIndex = priorityKeywords.indexOf(a);
    const bIndex = priorityKeywords.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });
  
  return `${sortedKeywords.slice(0, 3).join(' ')} 이미지 - MASGOLF 골프 장비`;
};

export default async function handler(req, res) {
  console.log('🔍 이미지 메타데이터 API 요청:', req.method, req.url);
  
  try {
    // 환경 변수 확인
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
      return res.status(500).json({ 
        error: '서버 설정 오류',
        details: 'Supabase 환경 변수가 설정되지 않았습니다'
      });
    }
    if (req.method === 'GET') {
      // 특정 이미지의 메타데이터 조회
      const { imageName, imageUrl } = req.query;
      
      if (!imageName && !imageUrl) {
        return res.status(400).json({
          error: 'imageName 또는 imageUrl 파라미터가 필요합니다.'
        });
      }

      try {
        // 데이터베이스에서 실제 메타데이터 조회 (image_assets 사용)
        let query = supabase.from('image_assets').select('*');
        
        if (imageUrl) {
          query = query.eq('cdn_url', imageUrl);
        } else if (imageName) {
          // imageName으로 조회할 때는 URL을 구성해서 검색
          const constructedUrl = `https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/${imageName}`;
          query = query.eq('cdn_url', constructedUrl);
        }
        
        const { data, error } = await query.single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // 데이터가 없는 경우 더미 데이터 반환
            const metadata = {
              filename: imageName,
              altText: generateSEOAltText(imageName),
              keywords: extractKeywordsFromFilename(imageName),
              seoTitle: `${extractKeywordsFromFilename(imageName).slice(0, 2).join(' ')} - MASGOLF`,
              description: `MASGOLF ${extractKeywordsFromFilename(imageName).join(' ')} 관련 이미지입니다.`,
              createdAt: new Date().toISOString()
            };
            return res.status(200).json({ metadata });
          }
          console.error('❌ 메타데이터 조회 오류:', error);
          return res.status(500).json({ error: '메타데이터 조회 실패', details: error.message });
        }

        // 데이터베이스에서 조회한 실제 데이터 반환 (image_assets 형식)
        const metadata = {
          filename: imageName,
          altText: data.alt_text || '',
          keywords: Array.isArray(data.ai_tags) ? data.ai_tags : [],
          seoTitle: data.title || '',
          description: data.description || '',
          category: '', // image_assets에는 category_id가 없음
          createdAt: data.created_at,
          // EXIF 정보 포함 (image_assets에 있는 경우)
          gps_lat: data.gps_lat || null,
          gps_lng: data.gps_lng || null,
          taken_at: data.taken_at || null,
          width: data.width || null,
          height: data.height || null
        };

        return res.status(200).json({ metadata });
      } catch (error) {
        console.error('❌ 메타데이터 조회 중 오류:', error);
        return res.status(500).json({ error: '서버 오류', details: error.message });
      }
      
    } else if (req.method === 'POST') {
      // 이미지 메타데이터 생성/업데이트
      const { 
        imageName, 
        imageUrl, 
        alt_text, 
        keywords, 
        title, 
        description, 
        category, 
        categories,
        // EXIF 정보
        exifData
      } = req.body;
      
      if (!imageName || !imageUrl) {
        return res.status(400).json({
          error: 'imageName과 imageUrl이 필요합니다.'
        });
      }

      // 카테고리 처리: categories 배열이 있으면 사용, 없으면 category 문자열 사용
      const categoriesArray = Array.isArray(categories) && categories.length > 0
        ? categories
        : (category ? category.split(',').map(c => c.trim()).filter(c => c) : []);
      const categoryString = categoriesArray.length > 0 ? categoriesArray.join(',') : category || '';

      console.log('📝 메타데이터 저장 시작:', { 
        imageName, 
        imageUrl, 
        alt_text: alt_text ? `${alt_text.substring(0, 50)}... (길이: ${alt_text.length})` : null,
        keywords: keywords ? `${keywords.length}개 키워드` : null,
        title: title ? `${title.substring(0, 30)}... (길이: ${title.length})` : null,
        description: description ? `${description.substring(0, 50)}... (길이: ${description.length})` : null,
        category: categoryString,
        categories: categoriesArray,
        requestBody: req.body
      });

      // 카테고리 문자열을 ID로 변환 (첫 번째 카테고리를 category_id로 사용, 하위 호환성 유지)
      let categoryId = 5; // 기본값: '기타'
      if (categoryString && categoryString !== '') {
        const firstCategory = categoriesArray.length > 0 ? categoriesArray[0] : categoryString.split(',')[0].trim();
        // 한글/영문 카테고리를 숫자 ID로 변환
        const categoryMap = {
          // 한글 카테고리 (기존 매핑)
          '골프': 1, '장비': 2, '코스': 3, '이벤트': 4, '기타': 5,
          // 새로운 다중 카테고리
          '골프코스': 3, '젊은 골퍼': 1, '시니어 골퍼': 1, '스윙': 1,
          '드라이버': 2, '드라이버샷': 2,
          // 영문 카테고리
          'golf': 1, 'equipment': 2, 'course': 3, 'event': 4, 'other': 5,
          // 추가 영문 카테고리
          'general': 5, 'instruction': 1
        };
        categoryId = categoryMap[firstCategory.toLowerCase()] || 5; // 기본값: '기타'
      }

      // 🔍 입력값 검증 및 길이 제한 확인 (SEO 최적화 기준 - 완화된 제한)
      const validationErrors = [];
      
      // 더 관대한 길이 제한으로 변경 (SEO 권장사항이지만 강제하지 않음)
      if (alt_text && alt_text.length > 200) {
        validationErrors.push(`ALT 텍스트가 너무 깁니다 (${alt_text.length}자, 권장: 200자 이하)`);
      }
      
      if (title && title.length > 100) {
        validationErrors.push(`제목이 너무 깁니다 (${title.length}자, 권장: 100자 이하)`);
      }
      
      if (description && description.length > 300) {
        validationErrors.push(`설명이 너무 깁니다 (${description.length}자, 권장: 300자 이하)`);
      }
      
      if (keywords && keywords.length > 50) {
        validationErrors.push(`키워드가 너무 깁니다 (${keywords.length}자, 권장: 50자 이하)`);
      }
      
      // 카테고리 필수 입력 검증 (완화)
      if (categoriesArray.length === 0 && (!category || category.trim() === '')) {
        console.warn('⚠️ 카테고리가 선택되지 않았습니다. category_id를 NULL로 설정합니다.');
        // 카테고리가 없으면 NULL로 설정 (외래키 제약이 없는 경우)
        categoryId = null;
      }
      
      // 경고만 표시하고 저장은 허용 (SEO 최적화는 권장사항)
      if (validationErrors.length > 0) {
        console.warn('⚠️ SEO 최적화 권장사항:', validationErrors);
        // 에러로 처리하지 않고 경고만 로그에 남김
      }

      // 기존 레코드 확인 (업데이트인지 생성인지 판단)
      const { data: existingRecord } = await supabase
        .from('image_assets')
        .select('*')
        .eq('cdn_url', imageUrl)
        .single();
      
      if (existingRecord) {
        // 기존 레코드 업데이트
        console.log('🔄 기존 메타데이터 발견, 업데이트 예정:', existingRecord.id);
        
        const updateData = {
          alt_text: alt_text || '',
          ai_tags: Array.isArray(keywords) ? keywords : (keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : []),
          title: title || '',
          description: description || '',
          updated_at: new Date().toISOString()
        };
        
        // EXIF 정보 추가 (있는 경우)
        if (exifData) {
          if (exifData.gps_lat !== undefined && exifData.gps_lat !== null) {
            updateData.gps_lat = exifData.gps_lat;
          }
          if (exifData.gps_lng !== undefined && exifData.gps_lng !== null) {
            updateData.gps_lng = exifData.gps_lng;
          }
          if (exifData.taken_at) {
            updateData.taken_at = exifData.taken_at;
          }
          if (exifData.width !== undefined && exifData.width !== null) {
            updateData.width = exifData.width;
          }
          if (exifData.height !== undefined && exifData.height !== null) {
            updateData.height = exifData.height;
          }
        }
        
        // OCR 필드 업데이트 (있는 경우)
        if (req.body.ocr_text !== undefined) {
          updateData.ocr_text = req.body.ocr_text;
        }
        if (req.body.ocr_extracted !== undefined) {
          updateData.ocr_extracted = req.body.ocr_extracted;
        }
        if (req.body.ocr_confidence !== undefined) {
          updateData.ocr_confidence = req.body.ocr_confidence;
        }
        if (req.body.ocr_processed_at !== undefined) {
          updateData.ocr_processed_at = req.body.ocr_processed_at;
        }
        if (req.body.ocr_fulltextannotation !== undefined) {
          updateData.ocr_fulltextannotation = req.body.ocr_fulltextannotation;
        }
        
        console.log('📊 업데이트 데이터:', {
          alt_text_length: updateData.alt_text.length,
          title_length: updateData.title.length,
          description_length: updateData.description.length,
          tags_count: updateData.ai_tags?.length || 0
        });
        
        const { data: result, error: updateError } = await supabase
          .from('image_assets')
          .update(updateData)
          .eq('cdn_url', imageUrl)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ 메타데이터 업데이트 오류:', updateError);
          return res.status(500).json({ 
            error: '메타데이터 업데이트 실패', 
            details: updateError.message || '알 수 없는 오류',
            code: updateError.code,
            hint: updateError.hint
          });
        }
        
        console.log('✅ 메타데이터 업데이트 완료:', result);
        return res.status(200).json({ 
          success: true,
          metadata: result
        });
      } else {
        // 새 레코드 생성 (필수 필드가 없으면 생성 불가)
        console.log('⚠️ 기존 레코드가 없습니다. cdn_url만으로는 새 레코드를 생성할 수 없습니다.');
        console.log('💡 이미지가 먼저 업로드되어 image_assets에 등록되어야 합니다.');
        
        return res.status(400).json({ 
          error: '이미지가 등록되지 않았습니다',
          details: '이미지를 먼저 업로드한 후 메타데이터를 저장할 수 있습니다.',
          suggestion: '갤러리 관리에서 이미지를 업로드하거나, 이미지 상세 정보에서 메타데이터를 편집하세요.'
        });
      }
      
      if (upsertError) {
        console.error('❌ 메타데이터 upsert 오류:', upsertError);
        console.error('오류 상세:', {
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint,
          code: upsertError.code,
          imageUrl: imageUrl,
          fileName: fileName,
          insertData: JSON.stringify(insertData, null, 2)
        });
        return res.status(500).json({ 
          error: '메타데이터 저장 실패', 
          details: upsertError.message || '알 수 없는 오류',
          code: upsertError.code,
          hint: upsertError.hint,
          imageUrl: imageUrl
        });
      }
      
      console.log('✅ 메타데이터 upsert 완료:', result);

      // 🔍 저장된 데이터 검증
      if (result) {
        console.log('🔍 저장된 데이터 검증:', {
          alt_text: result.alt_text,
          alt_text_length: result.alt_text ? result.alt_text.length : 0,
          title: result.title,
          title_length: result.title ? result.title.length : 0,
          description: result.description,
          description_length: result.description ? result.description.length : 0,
          ai_tags: result.ai_tags,
          ai_tags_json: JSON.stringify(result.ai_tags)
        });
      }

      return res.status(200).json({ 
        success: true,
        metadata: result
      });
      
    } else if (req.method === 'PUT') {
      // 이미지 메타데이터 업데이트
      const { imageName, imageUrl, alt_text, keywords, title, description, category } = req.body;
      
      if (!imageName || !imageUrl) {
        return res.status(400).json({
          error: 'imageName과 imageUrl이 필요합니다.'
        });
      }

      // 카테고리 처리: categories 배열이 있으면 사용, 없으면 category 문자열 사용
      const categoriesArray = Array.isArray(categories) && categories.length > 0
        ? categories
        : (category ? category.split(',').map(c => c.trim()).filter(c => c) : []);
      const categoryString = categoriesArray.length > 0 ? categoriesArray.join(',') : category || '';

      console.log('📝 메타데이터 업데이트 시작:', { imageName, imageUrl, alt_text, keywords, title, description, category: categoryString, categories: categoriesArray });

      // 카테고리 문자열을 ID로 변환 (첫 번째 카테고리를 category_id로 사용, 하위 호환성 유지)
      let categoryId = 5; // 기본값: '기타'
      if (categoryString && categoryString !== '') {
        const firstCategory = categoriesArray.length > 0 ? categoriesArray[0] : categoryString.split(',')[0].trim();
        // 한글/영문 카테고리를 숫자 ID로 변환
        const categoryMap = {
          // 한글 카테고리 (기존 매핑)
          '골프': 1, '장비': 2, '코스': 3, '이벤트': 4, '기타': 5,
          // 새로운 다중 카테고리
          '골프코스': 3, '젊은 골퍼': 1, '시니어 골퍼': 1, '스윙': 1,
          '드라이버': 2, '드라이버샷': 2,
          // 영문 카테고리
          'golf': 1, 'equipment': 2, 'course': 3, 'event': 4, 'other': 5,
          // 추가 영문 카테고리
          'general': 5, 'instruction': 1
        };
        categoryId = categoryMap[firstCategory.toLowerCase()] || 5; // 기본값: '기타'
      }

      // 데이터베이스에서 메타데이터 업데이트 (image_assets 사용)
      // ⚠️ image_assets에는 category_id가 없으므로 제거
      const metadataData = {
        cdn_url: imageUrl,
        alt_text: alt_text || '',
        ai_tags: Array.isArray(keywords) ? keywords : (keywords ? keywords.split(',').map(k => k.trim()) : []),
        title: title || '',
        description: description || '',
        updated_at: new Date().toISOString(),
        // OCR 필드도 업데이트 가능하도록 추가
        ...(req.body.ocr_text !== undefined && { ocr_text: req.body.ocr_text }),
        ...(req.body.ocr_extracted !== undefined && { ocr_extracted: req.body.ocr_extracted }),
        ...(req.body.ocr_confidence !== undefined && { ocr_confidence: req.body.ocr_confidence }),
        ...(req.body.ocr_processed_at !== undefined && { ocr_processed_at: req.body.ocr_processed_at }),
        ...(req.body.ocr_fulltextannotation !== undefined && { ocr_fulltextannotation: req.body.ocr_fulltextannotation })
      };

      const { data, error } = await supabase
        .from('image_assets')
        .update(metadataData)
        .eq('cdn_url', imageUrl)
        .select()
        .single();
      
      if (error) {
        console.error('❌ 메타데이터 업데이트 오류:', error);
        return res.status(500).json({ error: '메타데이터 업데이트 실패', details: error.message });
      }

      console.log('✅ 메타데이터 업데이트 완료');

      return res.status(200).json({ 
        success: true,
        metadata: data
      });
      
    } else if (req.method === 'PATCH') {
      // 이미지 메타데이터 수정 (대표 이미지 설정 등)
      const { imageId, isSceneRepresentative, storyScene, displayOrder } = req.body;
      
      if (!imageId) {
        return res.status(400).json({ error: 'imageId가 필요합니다.' });
      }

      try {
        // 먼저 현재 이미지 정보 조회 (folder_path도 포함)
        // ⚠️ image_assets에는 customer_id, story_scene, is_scene_representative가 없을 수 있음
        const { data: currentImage, error: fetchError } = await supabase
          .from('image_assets')
          .select('id, cdn_url, file_path, ai_tags')
          .eq('id', imageId)
          .single();

        if (fetchError || !currentImage) {
          return res.status(404).json({ error: '이미지를 찾을 수 없습니다.' });
        }

        // ⚠️ image_assets에는 customer_id, story_scene, is_scene_representative가 없으므로
        // 이 기능은 일단 비활성화하거나 다른 방식으로 처리 필요
        if (isSceneRepresentative !== undefined || storyScene !== undefined || displayOrder !== undefined) {
          console.warn('⚠️ image_assets에는 customer_id, story_scene, is_scene_representative가 없습니다. 이 기능은 현재 지원되지 않습니다.');
          return res.status(400).json({
            success: false,
            error: 'image_assets 테이블에는 대표 이미지 설정 기능이 지원되지 않습니다.'
          });
        }

        // 이미지 메타데이터 업데이트 (기본 정보만)
        const updateData = {
          updated_at: new Date().toISOString()
        };

        const { data: updatedImage, error: updateError } = await supabase
          .from('image_assets')
          .update(updateData)
          .eq('id', imageId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        console.log('✅ 이미지 메타데이터 업데이트 완료:', {
          imageId
        });

        return res.status(200).json({
          success: true,
          image: updatedImage
        });

      } catch (error) {
        console.error('이미지 메타데이터 수정 오류:', error);
        return res.status(500).json({
          success: false,
          error: error.message || '이미지 메타데이터 수정 실패'
        });
      }
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
    
  } catch (error) {
    console.error('❌ 이미지 메타데이터 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
