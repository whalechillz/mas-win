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
      // GET by ids (배열로 여러 이미지 조회) - 기존 .ts 로직 통합
      const { ids, imageName, imageUrl } = req.query;
      if (ids) {
        try {
          const idArray = (typeof ids === 'string' ? ids.split(',') : []).map((id) => id.trim()).filter(Boolean);
          if (idArray.length === 0) {
            return res.status(200).json({ success: true, images: [] });
          }
          const { data, error } = await supabase
            .from('image_assets')
            .select('*')
            .in('id', idArray);
          if (error) throw error;
          return res.status(200).json({ success: true, images: data || [] });
        } catch (err) {
          console.error('❌ 이미지 메타데이터 조회 오류 (ids):', err);
          return res.status(500).json({ success: false, error: (err && err.message) || '이미지 메타데이터 조회 실패' });
        }
      }

      // 특정 이미지의 메타데이터 조회 (imageName 또는 imageUrl)
      if (!imageName && !imageUrl) {
        return res.status(400).json({
          error: 'imageName, imageUrl 또는 ids 파라미터가 필요합니다.'
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
      // 이미지 메타데이터 생성/업데이트 (image_assets에는 category/category_id 없음)
      const { 
        imageName, 
        imageUrl, 
        alt_text, 
        keywords, 
        title, 
        description, 
        exifData
      } = req.body || {};
      
      if (!imageName || !imageUrl) {
        return res.status(400).json({
          error: 'imageName과 imageUrl이 필요합니다.'
        });
      }

      console.log('📝 메타데이터 저장 시작:', { 
        imageName, 
        imageUrl, 
        alt_text: alt_text ? `${alt_text.substring(0, 50)}... (길이: ${alt_text.length})` : null,
        keywords: keywords ? `${Array.isArray(keywords) ? keywords.length : 0}개 키워드` : null,
        title: title ? `${title.substring(0, 30)}... (길이: ${title.length})` : null,
        description: description ? `${description.substring(0, 50)}... (길이: ${description.length})` : null
      });

      // 🔍 입력값 검증 및 길이 제한 확인 (SEO 최적화 기준 - 완화된 제한)
      const validationErrors = [];
      
      // 더 관대한 길이 제한으로 변경 (SEO 권장사항이지만 강제하지 않음)
      if (alt_text && alt_text.length > 200) {
        validationErrors.push(`ALT 텍스트가 너무 깁니다 (${alt_text.length}자, 권장: 200자 이하)`);
      }
      
      if (title && title.length > 100) {
        validationErrors.push(`제목이 너무 깁니다 (${title.length}자, 권장: 100자 이하)`);
      }
      
      // ✅ OCR 텍스트 지원을 위해 description 길이 제한 완화 (300자 → 5000자)
      if (description && description.length > 5000) {
        validationErrors.push(`설명이 너무 깁니다 (${description.length}자, 최대: 5000자)`);
      }
      
      const keywordsArray = Array.isArray(keywords) ? keywords : (keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : []);
      if (keywordsArray.length > 50) {
        validationErrors.push(`키워드가 너무 많습니다 (${keywordsArray.length}개, 권장: 50개 이하)`);
      }
      
      // 경고만 표시하고 저장은 허용 (SEO 최적화는 권장사항)
      if (validationErrors.length > 0) {
        console.warn('⚠️ SEO 최적화 권장사항:', validationErrors);
        // 에러로 처리하지 않고 경고만 로그에 남김
      }

      // 데이터베이스에 메타데이터 저장/업데이트 (image_assets 사용, category/category_id 없음)
      const metadataData = {
        cdn_url: imageUrl,
        alt_text: alt_text || '',
        ai_tags: Array.isArray(keywords) ? keywords : (keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : []),
        title: title || '',
        description: description || '',
        updated_at: new Date().toISOString()
      };
      
      // EXIF 정보 추가 (있는 경우)
      if (exifData) {
        if (exifData.gps_lat !== undefined && exifData.gps_lat !== null) {
          metadataData.gps_lat = exifData.gps_lat;
        }
        if (exifData.gps_lng !== undefined && exifData.gps_lng !== null) {
          metadataData.gps_lng = exifData.gps_lng;
        }
        if (exifData.taken_at) {
          metadataData.taken_at = exifData.taken_at;
        }
        if (exifData.width !== undefined && exifData.width !== null) {
          metadataData.width = exifData.width;
        }
        if (exifData.height !== undefined && exifData.height !== null) {
          metadataData.height = exifData.height;
        }
      }
      
      console.log('📊 최종 저장 데이터:', {
        alt_text_length: metadataData.alt_text.length,
        title_length: metadataData.title.length,
        description_length: metadataData.description.length,
        ai_tags_count: metadataData.ai_tags?.length ?? 0
      });

      // cdn_url이 UNIQUE이므로 upsert 사용 (중복 방지 및 안전한 저장)
      // INSERT 시 image_assets 필수 컬럼(filename, original_filename, file_path, file_size, mime_type, format) 포함
      console.log('🔍 메타데이터 upsert 시작:', typeof imageUrl === 'string' ? imageUrl.substring(0, 120) : imageUrl);
      
      const ext = (imageName || '').split('.').pop()?.toLowerCase() || 'png';
      const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', heic: 'image/heic' };
      const formatMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', webp: 'webp', heic: 'heic' };
      let file_path = 'uploaded';
      try {
        if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
          const urlPath = new URL(imageUrl).pathname;
          const blogImagesIndex = urlPath.indexOf('/blog-images/');
          if (blogImagesIndex !== -1) {
            file_path = urlPath.slice(blogImagesIndex + '/blog-images/'.length);
          } else {
            const lastSlash = urlPath.lastIndexOf('/');
            file_path = lastSlash !== -1 ? urlPath.slice(1, lastSlash + 1) + (imageName || '') : (imageName || 'uploaded');
          }
        } else {
          file_path = (imageName || 'uploaded').includes('/') ? (imageName || 'uploaded') : `uploaded/${imageName || 'unknown'}`;
        }
      } catch (urlErr) {
        console.warn('⚠️ imageUrl 파싱 실패, file_path 기본값 사용:', urlErr?.message);
        file_path = (imageName || 'uploaded').includes('/') ? (imageName || 'uploaded') : `uploaded/${imageName || 'unknown'}`;
      }
      
      const insertData = {
        ...metadataData,
        created_at: new Date().toISOString(),
        // INSERT 시 필수 컬럼 (갤러리 메타데이터 저장 500 방지)
        filename: (imageName || '').split('/').pop() || imageName || 'unknown',
        original_filename: imageName || 'unknown',
        file_path,
        file_size: 0,
        mime_type: mimeMap[ext] || 'image/png',
        format: formatMap[ext] || ext,
        status: metadataData.status || 'active',
        upload_source: metadataData.upload_source || 'file_upload'
      };
      
      // cdn_url에 UNIQUE 제약이 없을 수 있으므로 upsert 대신 "조회 → UPDATE 또는 INSERT" 사용
      const { data: existingRow, error: selectError } = await supabase
        .from('image_assets')
        .select('id')
        .eq('cdn_url', imageUrl)
        .maybeSingle();
      
      if (selectError) {
        console.error('❌ 메타데이터 조회 오류:', selectError);
        return res.status(500).json({
          error: '메타데이터 저장 실패',
          details: selectError.message,
          code: selectError.code || 'SELECT_ERROR'
        });
      }
      
      let result;
      if (existingRow) {
        // 기존 행 업데이트 (메타데이터 필드만)
        const updatePayload = {
          alt_text: metadataData.alt_text,
          ai_tags: metadataData.ai_tags,
          title: metadataData.title,
          description: metadataData.description,
          updated_at: new Date().toISOString()
        };
        if (metadataData.gps_lat !== undefined) updatePayload.gps_lat = metadataData.gps_lat;
        if (metadataData.gps_lng !== undefined) updatePayload.gps_lng = metadataData.gps_lng;
        if (metadataData.taken_at !== undefined) updatePayload.taken_at = metadataData.taken_at;
        if (metadataData.width !== undefined) updatePayload.width = metadataData.width;
        if (metadataData.height !== undefined) updatePayload.height = metadataData.height;
        const { data: updated, error: updateError } = await supabase
          .from('image_assets')
          .update(updatePayload)
          .eq('id', existingRow.id)
          .select()
          .single();
        if (updateError) {
          console.error('❌ 메타데이터 UPDATE 오류:', updateError);
          return res.status(500).json({
            error: '메타데이터 저장 실패',
            details: updateError.message,
            code: updateError.code || 'UPDATE_ERROR'
          });
        }
        result = updated;
        console.log('✅ 메타데이터 업데이트 완료:', result?.id);
      } else {
        // 새 행 INSERT (필수 컬럼 포함)
        const { data: inserted, error: insertError } = await supabase
          .from('image_assets')
          .insert(insertData)
          .select()
          .single();
        if (insertError) {
          const errDetail = insertError.message || String(insertError);
          const errCode = insertError.code || 'UNKNOWN';
          console.error('❌ 메타데이터 INSERT 오류:', errDetail, 'code:', errCode);
          console.error('오류 상세:', {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
            imageUrl: typeof imageUrl === 'string' ? imageUrl.substring(0, 100) : imageUrl,
            imageName: imageName
          });
          return res.status(500).json({
            error: '메타데이터 저장 실패',
            details: errDetail,
            code: errCode,
            hint: insertError.hint || null
          });
        }
        result = inserted;
        console.log('✅ 메타데이터 INSERT 완료:', result?.id);
      }

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
      console.log('[image-metadata.js] PUT 핸들러 실행 (categories 미사용)');
      // 이미지 메타데이터 업데이트 (image_assets에는 category/category_id 없음)
      const { imageName, imageUrl, alt_text, keywords, title, description } = req.body || {};
      
      if (!imageName || !imageUrl) {
        return res.status(400).json({
          error: 'imageName과 imageUrl이 필요합니다.'
        });
      }

      console.log('📝 메타데이터 업데이트 시작:', { imageName, imageUrl, alt_text: !!alt_text, keywords: Array.isArray(keywords) ? keywords.length : 0, title: !!title, description: !!description });

      // ✅ imageUrl이 없으면 에러 반환
      if (!imageUrl) {
        console.error('❌ 메타데이터 업데이트 오류: imageUrl이 없습니다');
        return res.status(400).json({ error: 'imageUrl이 필요합니다.' });
      }

      // ✅ keywords 안전 처리
      let safeKeywords = [];
      if (keywords !== undefined && keywords !== null) {
        if (Array.isArray(keywords)) {
          safeKeywords = keywords.map(k => String(k || '').trim()).filter(k => k);
        } else if (typeof keywords === 'string') {
          safeKeywords = keywords.split(',').map(k => k.trim()).filter(k => k);
        }
      }

      // 데이터베이스에서 메타데이터 업데이트 (image_assets 사용)
      // ⚠️ image_assets에는 category_id가 없으므로 제거
      // ✅ description 필드 길이 제한 제거 (OCR 텍스트 지원을 위해 5000자까지 허용)
      const metadataData = {
        cdn_url: imageUrl,
        alt_text: alt_text || '',
        ai_tags: safeKeywords,
        title: title || '',
        description: description || '', // OCR 텍스트 포함 가능 (최대 5000자)
        updated_at: new Date().toISOString(),
        // OCR 필드도 업데이트 가능하도록 추가
        ...(req.body.ocr_text !== undefined && { ocr_text: req.body.ocr_text }),
        ...(req.body.ocr_extracted !== undefined && { ocr_extracted: req.body.ocr_extracted }),
        ...(req.body.ocr_confidence !== undefined && { ocr_confidence: req.body.ocr_confidence }),
        ...(req.body.ocr_processed_at !== undefined && { ocr_processed_at: req.body.ocr_processed_at }),
        ...(req.body.ocr_fulltextannotation !== undefined && { ocr_fulltextannotation: req.body.ocr_fulltextannotation })
      };
      
      // ✅ description 필드 길이 검증 (5000자 제한)
      if (metadataData.description && metadataData.description.length > 5000) {
        console.warn('⚠️ description 필드가 5000자를 초과합니다. 자동으로 잘라냅니다:', {
          originalLength: metadataData.description.length,
          truncatedLength: 5000
        });
        metadataData.description = metadataData.description.substring(0, 5000);
      }

      console.log('[image-metadata] 📝 PUT 업데이트 시도:', {
        imageUrl: imageUrl.substring(0, 100),
        imageName,
        alt_text_length: metadataData.alt_text?.length || 0,
        title_length: metadataData.title?.length || 0,
        description_length: metadataData.description?.length || 0,
        keywords_count: safeKeywords.length,
        has_ocr_text: !!metadataData.ocr_text
      });

      // 먼저 cdn_url로 존재 여부 확인
      const { data: existingRow, error: selectError } = await supabase
        .from('image_assets')
        .select('id, cdn_url')
        .eq('cdn_url', imageUrl)
        .maybeSingle();

      if (selectError) {
        console.error('[image-metadata] ❌ 조회 오류:', selectError);
        return res.status(500).json({ error: '메타데이터 조회 실패', details: selectError.message });
      }

      if (!existingRow) {
        // 레코드가 없으면 INSERT (갤러리 업로드 직후 메타데이터 생성 시 upload API가 아직 insert 전이거나 실패한 경우)
        console.log('[image-metadata] ⚠️ cdn_url에 해당 레코드 없음 → INSERT 시도');
        const ext = (imageName || '').split('.').pop()?.toLowerCase() || 'png';
        const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', heic: 'image/heic' };
        const formatMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', webp: 'webp', heic: 'heic' };
        // imageUrl에서 storage 경로 추출 (예: .../blog-images/uploaded/xxx.png → uploaded/xxx.png)
        let file_path = 'uploaded';
        try {
          const urlPath = new URL(imageUrl).pathname;
          const blogImagesIndex = urlPath.indexOf('/blog-images/');
          if (blogImagesIndex !== -1) {
            file_path = urlPath.slice(blogImagesIndex + '/blog-images/'.length);
          } else {
            const lastSlash = urlPath.lastIndexOf('/');
            file_path = lastSlash !== -1 ? urlPath.slice(1, lastSlash + 1) + (imageName || '') : (imageName || 'uploaded');
          }
        } catch (_) {
          file_path = (imageName || 'uploaded').includes('/') ? imageName : `uploaded/${imageName || 'unknown'}`;
        }
        const insertRecord = {
          filename: imageName || 'unknown',
          original_filename: imageName || 'unknown',
          file_path,
          file_size: 0,
          mime_type: mimeMap[ext] || 'image/png',
          format: formatMap[ext] || ext,
          cdn_url: imageUrl,
          alt_text: metadataData.alt_text || '',
          ai_tags: metadataData.ai_tags || [],
          title: metadataData.title || '',
          description: metadataData.description || '',
          updated_at: new Date().toISOString(),
          status: 'active',
          upload_source: 'file_upload',
          ...(metadataData.ocr_text !== undefined && { ocr_text: metadataData.ocr_text }),
          ...(metadataData.ocr_extracted !== undefined && { ocr_extracted: metadataData.ocr_extracted }),
          ...(metadataData.ocr_confidence !== undefined && { ocr_confidence: metadataData.ocr_confidence }),
          ...(metadataData.ocr_processed_at !== undefined && { ocr_processed_at: metadataData.ocr_processed_at }),
          ...(metadataData.ocr_fulltextannotation !== undefined && { ocr_fulltextannotation: metadataData.ocr_fulltextannotation })
        };
        const { data: inserted, error: insertError } = await supabase
          .from('image_assets')
          .insert(insertRecord)
          .select()
          .single();
        if (insertError) {
          console.error('[image-metadata] ❌ INSERT 실패:', insertError.message, insertError.code, insertError.details);
          return res.status(500).json({
            error: '메타데이터 저장 실패 (레코드 없음 → INSERT 실패)',
            details: insertError.message,
            code: insertError.code,
            hint: insertError.hint || 'image_assets 테이블 컬럼 확인 (filename, original_filename, file_path, file_size, mime_type, format 필수)'
          });
        }
        console.log('[image-metadata] ✅ INSERT 완료:', inserted?.id);
        return res.status(200).json({ success: true, metadata: inserted });
      }

      const { data, error } = await supabase
        .from('image_assets')
        .update(metadataData)
        .eq('cdn_url', imageUrl)
        .select()
        .single();
      
      if (error) {
        console.error('[image-metadata] ❌ UPDATE 오류:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          imageUrl: imageUrl.substring(0, 100),
          imageName
        });
        
        let errorMessage = error.message || '알 수 없는 오류';
        if (error.code === 'PGRST116') {
          errorMessage = '이미지를 찾을 수 없습니다. imageUrl을 확인해주세요.';
        } else if (error.code === '23505') {
          errorMessage = '중복된 데이터입니다.';
        } else if (error.details) {
          errorMessage = `${errorMessage}: ${error.details}`;
        }
        
        return res.status(500).json({ 
          error: '메타데이터 업데이트 실패', 
          details: errorMessage,
          code: error.code,
          hint: error.hint || '데이터베이스 업데이트 중 오류가 발생했습니다.'
        });
      }

      console.log('[image-metadata] ✅ 메타데이터 업데이트 완료');

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
    const msg = error?.message || String(error);
    const stack = error?.stack;
    console.error('❌ 이미지 메타데이터 API 오류:', msg);
    if (stack) console.error('스택:', stack);
    return res.status(500).json({
      error: '메타데이터 저장 실패',
      details: msg,
      code: 'SERVER_ERROR'
    });
  }
}
