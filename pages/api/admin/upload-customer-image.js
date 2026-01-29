/**
 * 고객 이미지 업로드 API
 * 
 * originals/customers/customer-{id}/YYYY-MM-DD/ 폴더에 저장
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // 이미지 업로드 및 메타데이터 저장
    try {
      console.log('📥 [upload-customer-image API] 요청 수신:', {
        method: req.method,
        contentType: req.headers['content-type'],
        hasBody: !!req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
        timestamp: new Date().toISOString()
      });

      const { 
        customerId, 
        customerName, 
        customerNameEn,
        customerInitials,
        visitDate, 
        imageUrl, 
        filePath, 
        fileName, 
        originalFileName,
        fileSize,
        storyScene,
        imageType,
        folderName
      } = req.body || {};

      console.log('📦 [upload-customer-image API] 요청 본문 파싱:', {
        customerId,
        customerName,
        visitDate,
        imageUrl: imageUrl?.substring(0, 100),
        filePath: filePath?.substring(0, 100),
        fileName,
        originalFileName,
        fileSize,
        hasAllRequired: !!(customerId && visitDate && imageUrl)
      });

      if (!customerId || !visitDate || !imageUrl) {
        console.error('❌ [upload-customer-image API] 필수 파라미터 누락:', {
          customerId: !!customerId,
          visitDate: !!visitDate,
          imageUrl: !!imageUrl
        });
        return res.status(400).json({
          success: false,
          error: 'customerId, visitDate, imageUrl이 필요합니다.'
        });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // ✅ 먼저 이미 등록된 이미지인지 확인
      const { data: existingImage, error: checkError } = await supabase
        .from('image_assets')
        .select('id, cdn_url, file_path')
        .eq('cdn_url', imageUrl)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116은 "not found" 오류 (정상)
        console.error('❌ 이미지 중복 확인 오류:', checkError);
        return res.status(500).json({
          success: false,
          error: '이미지 확인 중 오류가 발생했습니다.',
          details: checkError.message
        });
      }

      // ✅ 이미 등록된 이미지인 경우
      if (existingImage) {
        console.log('ℹ️ 이미 등록된 이미지:', {
          imageUrl,
          existingId: existingImage.id,
          existingFilePath: existingImage.file_path
        });
        return res.status(200).json({
          success: true,
          message: '이미 등록된 이미지입니다.',
          alreadyRegistered: true,
          image: existingImage
        });
      }

      // image_assets 테이블에 저장 (새 이미지)
      // ⚠️ image_assets 테이블의 필수 필드: filename, original_filename, file_path, file_size, mime_type, format
      const fileNameFromPath = filePath ? filePath.split('/').pop() : (fileName || '');
      const fileExtension = fileNameFromPath.split('.').pop()?.toLowerCase() || 'webp';
      const mimeTypeMap = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'heic': 'image/heic',
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        'webm': 'video/webm'
      };
      const detectedMimeType = mimeTypeMap[fileExtension] || 'image/webp';
      const formatValue = fileExtension === 'jpg' ? 'jpeg' : fileExtension;

      const metadataPayload = {
        // ✅ 필수 필드
        filename: fileNameFromPath,
        original_filename: originalFileName || fileNameFromPath,
        file_path: filePath,
        file_size: fileSize || 0,
        mime_type: detectedMimeType,
        format: formatValue,
        // ✅ 선택 필드
        cdn_url: imageUrl,  // UNIQUE 컬럼
        title: `${customerName} - ${visitDate}`,
        alt_text: `${customerName} 고객 방문 이미지 (${visitDate})`,
        // 고객 정보를 메타데이터에 저장 (JSON 필드 활용)
        ai_tags: [`customer-${customerId}`, `visit-${visitDate}`],
        // ⚠️ image_assets에는 다음 필드들이 없음: folder_path, date_folder, source, channel, story_scene, image_type, english_filename, customer_name_en, customer_initials, image_quality, metadata
        updated_at: new Date().toISOString()
      };

      console.log('📝 [upload-customer-image API] 메타데이터 페이로드 구성:', {
        filename: metadataPayload.filename,
        original_filename: metadataPayload.original_filename,
        file_path: metadataPayload.file_path?.substring(0, 100),
        file_size: metadataPayload.file_size,
        mime_type: metadataPayload.mime_type,
        format: metadataPayload.format,
        cdn_url: metadataPayload.cdn_url?.substring(0, 100),
        ai_tags: metadataPayload.ai_tags
      });

      // 새 이미지 등록
      console.log('📝 [upload-customer-image API] 메타데이터 저장 시도:', {
        metadataPayload: {
          ...metadataPayload,
          ai_tags: metadataPayload.ai_tags
        }
      });

      const { data, error } = await supabase
        .from('image_assets')
        .insert(metadataPayload)
        .select();

      console.log('📥 [upload-customer-image API] 메타데이터 저장 결과:', {
        success: !!data && !error,
        dataCount: data?.length || 0,
        error: error ? {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        } : null
      });

      if (error) {
        console.error('❌ [upload-customer-image API] 메타데이터 저장 실패:', {
          error,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          metadataPayload
        });
        return res.status(500).json({
          success: false,
          error: '메타데이터 저장 실패',
          details: error.message,
          errorCode: error.code
        });
      }

      // customers 테이블 업데이트 (영문 이름, 이니셜, 폴더명)
      if (customerNameEn || customerInitials || folderName) {
        const customerUpdateData = {};
        if (customerNameEn) customerUpdateData.name_en = customerNameEn;
        if (customerInitials) customerUpdateData.initials = customerInitials;
        if (folderName) customerUpdateData.folder_name = folderName;
        
        const { error: customerUpdateError } = await supabase
          .from('customers')
          .update(customerUpdateData)
          .eq('id', customerId);
        
        if (customerUpdateError) {
          console.warn('⚠️ 고객 정보 업데이트 실패 (계속 진행):', customerUpdateError.message);
        } else {
          console.log('✅ 고객 정보 업데이트 완료:', customerUpdateData);
        }
      }

      console.log('✅ [upload-customer-image API] 성공:', {
        imageId: data[0]?.id,
        cdn_url: data[0]?.cdn_url?.substring(0, 100),
        file_path: data[0]?.file_path?.substring(0, 100)
      });

      return res.status(200).json({
        success: true,
        message: '고객 이미지가 저장되었습니다.',
        image: data[0]
      });

    } catch (error) {
      console.error('❌ [upload-customer-image API] 예외 발생:', {
        error,
        errorMessage: error?.message,
        errorStack: error?.stack,
        errorName: error?.name
      });
      return res.status(500).json({
        success: false,
        error: '고객 이미지 업로드 중 오류가 발생했습니다.',
        details: error?.message || '알 수 없는 오류'
      });
    }
  } else if (req.method === 'PUT') {
    // 메타데이터만 업데이트 (고객 이미지 편집 모달 저장)
    try {
      const { imageId, metadata } = req.body || {};
      if (!imageId) {
        return res.status(400).json({
          success: false,
          error: 'imageId가 필요합니다.'
        });
      }
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const keywords = metadata?.keywords;
      const safeKeywords = Array.isArray(keywords)
        ? keywords.map((k) => String(k || '').trim()).filter(Boolean)
        : (typeof keywords === 'string' ? keywords.split(',').map((k) => k.trim()).filter(Boolean) : []);

      const updatePayload = {
        updated_at: new Date().toISOString(),
        ...(metadata?.alt_text !== undefined && { alt_text: metadata.alt_text ?? '' }),
        ...(metadata?.title !== undefined && { title: metadata.title ?? '' }),
        ...(metadata?.description !== undefined && { description: metadata.description ?? '' }),
        ...(keywords !== undefined && { ai_tags: safeKeywords }),
        ...(metadata?.ocr_text !== undefined && { ocr_text: metadata.ocr_text ?? null })
      };

      const { data, error } = await supabase
        .from('image_assets')
        .update(updatePayload)
        .eq('id', imageId)
        .select()
        .single();

      if (error) {
        console.error('❌ [upload-customer-image API] PUT 메타데이터 업데이트 실패:', error);
        return res.status(500).json({
          success: false,
          error: '메타데이터 업데이트 실패',
          details: error.message
        });
      }
      if (!data) {
        return res.status(404).json({
          success: false,
          error: '이미지를 찾을 수 없습니다.',
          details: 'imageId에 해당하는 레코드가 없습니다.'
        });
      }
      return res.status(200).json({
        success: true,
        message: '메타데이터가 저장되었습니다.',
        image: data
      });
    } catch (err) {
      console.error('❌ [upload-customer-image API] PUT 예외:', err);
      return res.status(500).json({
        success: false,
        error: '메타데이터 저장 중 오류가 발생했습니다.',
        details: err?.message || '알 수 없는 오류'
      });
    }
  } else if (req.method === 'GET') {
    // 고객 이미지 목록 조회
    try {
      const { customerId, dateFilter } = req.query;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: 'customerId가 필요합니다.'
        });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // 1. customers 테이블에서 폴더명 조회
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('folder_name, name')
        .eq('id', customerId)
        .single();

      if (customerError || !customerData) {
        console.warn('⚠️ 고객 정보 조회 실패 (계속 진행):', customerError?.message);
      }

      // 2. image_assets에서 조회 (ai_tags 필터 사용)
      // ⚠️ image_assets에는 folder_path, date_folder가 없으므로 ai_tags와 file_path 사용
      // ✅ OCR 관련 컬럼도 포함 (fullTextAnnotation 포함)
      let metadataQuery = supabase
        .from('image_assets')
        .select('*, ocr_extracted, ocr_text, ocr_confidence, ocr_processed_at, ocr_fulltextannotation');
      
      // ✅ ai_tags와 file_path를 모두 확인하여 필터링
      // 목록 제거 기능을 위해 ai_tags에 customer-{customerId} 태그가 있는 이미지만 반환
      if (customerData?.folder_name) {
        const exactFolderPath = `originals/customers/${customerData.folder_name}`;
        const customerTag = `customer-${customerId}`;
        
        console.log('🔍 [고객 이미지 조회] 필터링 조건:', {
          folderPath: exactFolderPath,
          customerTag,
          customerId
        });
        
        // file_path로 필터링 (가장 안정적이고 정확함)
        metadataQuery = metadataQuery.ilike('file_path', `${exactFolderPath}/%`);
        
        // ⚠️ ai_tags 쿼리는 JSONB 파싱 오류가 발생할 수 있으므로
        // 쿼리 단계에서는 file_path만 사용하고, 결과를 필터링할 때 ai_tags 확인
      } else {
        // ⚠️ folder_name이 없으면 이미지를 조회하지 않음
        // folder_name이 없으면 전체 customers 폴더를 조회하여 다른 고객의 이미지가 포함될 수 있음
        console.warn('⚠️ folder_name이 없어 이미지를 조회하지 않습니다. customerId:', customerId);
        // 빈 결과 반환 (존재하지 않는 ID로 필터링)
        metadataQuery = metadataQuery.eq('id', '00000000-0000-0000-0000-000000000000');
      }

      // 날짜 필터 적용 (file_path에서 날짜 추출하여 필터링)
      // ⚠️ image_assets에는 date_folder가 없으므로 file_path에서 날짜를 추출해야 함
      // 하지만 쿼리 단계에서는 날짜 필터링이 어려우므로, 모든 데이터를 가져온 후 필터링
      const { data: metadataImages, error: metadataError } = await metadataQuery
        .order('created_at', { ascending: false });
      
      if (metadataError) {
        console.error('❌ [고객 이미지 조회] 쿼리 오류:', metadataError);
      } else {
        console.log('✅ [고객 이미지 조회] 성공:', {
          customerId,
          folderName: customerData?.folder_name,
          count: metadataImages?.length || 0
        });
      }

      if (metadataError) {
        console.error('❌ 메타데이터 조회 실패:', metadataError);
      }

      // ✅ ai_tags에 customer-{customerId} 태그가 있는 이미지만 필터링 (목록 제거 기능 지원)
      // ⚠️ 단, 기존 이미지 중 ai_tags가 없는 경우 file_path로 확인하여 포함 (하위 호환성)
      const customerTag = `customer-${customerId}`;
      const exactFolderPath = customerData?.folder_name ? `originals/customers/${customerData.folder_name}` : null;
      
      let filteredMetadataImages = (metadataImages || []).filter(img => {
        const tags = Array.isArray(img.ai_tags) ? img.ai_tags : [];
        const hasCustomerTag = tags.includes(customerTag);
        
        // 1. ai_tags에 customer-{id} 태그가 있으면 포함
        if (hasCustomerTag) {
          return true;
        }
        
        // 2. file_path가 고객 폴더에 있으면 포함
        // (갤러리와 동일하게 동작: customers/이름/ 경로의 모든 이미지 표시)
        if (exactFolderPath && img.file_path) {
          const isInCustomerFolder = img.file_path.startsWith(exactFolderPath);
          if (isInCustomerFolder) {
            console.log('🔍 [고객 이미지 필터링] file_path로 포함:', {
              imageId: img.id,
              filePath: img.file_path?.substring(0, 100),
              tags,
              customerTag,
              customerId,
              hasCustomerTag: false
            });
            return true;
          }
        }
        
        // 3. 둘 다 해당 안되면 제외
        console.log('🔍 [고객 이미지 필터링] ai_tags와 file_path 모두 불일치 - 제외:', {
          imageId: img.id,
          filePath: img.file_path?.substring(0, 100),
          tags,
          customerTag,
          customerId
        });
        
        return false;
      });

      console.log('📦 [고객 이미지 필터링] ai_tags/file_path 필터링 결과:', {
        before: metadataImages?.length || 0,
        after: filteredMetadataImages.length,
        customerTag,
        customerId,
        folderPath: exactFolderPath
      });

      // Storage 파일 존재 여부 확인 함수
      const verifyFileExists = async (img) => {
        if (!img) return false;
        
        // file_path가 없으면 false 반환
        if (!img.file_path) {
          return false;
        }
        
        try {
          const pathParts = img.file_path.split('/');
          const lastPart = pathParts[pathParts.length - 1];
          // 날짜 폴더 패턴: YYYY-MM-DD 또는 YYYY.MM.DD 형식
          const isDateFolder = /^\d{4}[.-]\d{2}[.-]\d{2}$/.test(lastPart);
          // 파일명이 있는지 확인 (확장자가 있는지 체크)
          const hasFilename = lastPart.includes('.') && !isDateFolder;
          
          let actualFilePath = img.file_path;
          let folderPath = pathParts.slice(0, -1).join('/');
          let fileName = lastPart;
          
          // file_path에 파일명이 없는 경우 (날짜 폴더만 있는 경우)
          if (isDateFolder || (!hasFilename && !lastPart.includes('.'))) {
            // filename 필드에서 파일명 추출
            const fileNameFromField = img.filename;
            if (fileNameFromField) {
              actualFilePath = `${img.file_path}/${fileNameFromField}`;
              folderPath = img.file_path;
              fileName = fileNameFromField;
            } else {
              // filename도 없으면 false 반환
              console.warn('⚠️ [파일 존재 확인] file_path와 filename 모두 없음:', {
                imageId: img.id,
                file_path: img.file_path
              });
              return false;
            }
          }
          
          const { data: files, error } = await supabase.storage
            .from(bucketName)
            .list(folderPath, { 
              search: fileName,
              limit: 1
            });
          
          const exists = !error && files && files.length > 0;
          if (!exists) {
            console.warn('⚠️ [파일 존재 확인] Storage에 존재하지 않음:', {
              imageId: img.id,
              filePath: actualFilePath.substring(0, 100),
              folderPath,
              fileName
            });
          }
          return exists;
        } catch (error) {
          console.error('❌ [파일 존재 확인] 오류:', error);
          return false;
        }
      };

      // 날짜 필터 적용 (ai_tags의 visit-{date} 태그 우선, file_path에서 날짜 추출)
      if (dateFilter && filteredMetadataImages.length > 0) {
        filteredMetadataImages = filteredMetadataImages.filter(img => {
          // 1. ai_tags의 visit-{date} 태그 확인 (최우선)
          const tags = Array.isArray(img.ai_tags) ? img.ai_tags : [];
          const visitTag = tags.find((tag) => tag.startsWith('visit-'));
          const visitDate = visitTag ? visitTag.replace('visit-', '') : null;
          
          // visit-{date} 태그가 있으면 우선 사용
          if (visitDate) {
            const matches = visitDate === dateFilter;
            if (!matches) {
              console.log('🔍 [날짜 필터링] visit-{date} 태그 불일치:', {
                imageId: img.id,
                visitDate,
                dateFilter,
                file_path: img.file_path?.substring(0, 100)
              });
            }
            return matches;
          }
          
          // 2. file_path에서 날짜 추출
          const pathToCheck = img.file_path || img.folder_path || '';
          const dateMatch = pathToCheck.match(/(\d{4}-\d{2}-\d{2})/);
          const extractedDate = dateMatch ? dateMatch[1] : null;
          
          // 3. cdn_url에서도 날짜 추출 시도
          let urlDate = null;
          if (!extractedDate && img.cdn_url) {
            const urlDateMatch = img.cdn_url.match(/(\d{4}-\d{2}-\d{2})/);
            if (urlDateMatch) {
              urlDate = urlDateMatch[1];
            }
          }
          
          const finalDate = visitDate || extractedDate || urlDate;
          const matches = finalDate === dateFilter;
          
          if (!matches) {
            console.log('🔍 [날짜 필터링] 날짜 불일치:', {
              imageId: img.id,
              visitDate,
              extractedDate,
              urlDate,
              finalDate,
              dateFilter,
              file_path: img.file_path?.substring(0, 100)
            });
          }
          
          return matches;
        });
        
        console.log('📅 [날짜 필터링] 결과:', {
          dateFilter,
          before: filteredMetadataImages.length,
          after: filteredMetadataImages.length
        });
      }
      
      // file_path에 파일명이 없는 경우 수정 및 실제 Storage 파일 존재 여부 확인
      if (filteredMetadataImages.length > 0) {
        console.log('📝 [file_path 수정 및 파일 존재 확인] 시작:', {
          count: filteredMetadataImages.length
        });
        
        // file_path 수정 및 파일 존재 확인 (병렬 처리)
        const processedImages = await Promise.all(
          filteredMetadataImages.map(async (img) => {
            // file_path에 파일명이 없는 경우 수정
            if (img.file_path) {
              const pathParts = img.file_path.split('/');
              const lastPart = pathParts[pathParts.length - 1];
              // 날짜 폴더 패턴: YYYY-MM-DD 또는 YYYY.MM.DD 형식
              const isDateFolder = /^\d{4}[.-]\d{2}[.-]\d{2}$/.test(lastPart);
              // 파일명이 있는지 확인 (확장자가 있는지 체크)
              const hasFilename = lastPart.includes('.') && !isDateFolder;
              
              if (isDateFolder || (!hasFilename && !lastPart.includes('.'))) {
                const fileName = img.filename;
                if (fileName) {
                  img.file_path = `${img.file_path}/${fileName}`;
                  console.log('📝 [file_path 수정] 파일명 추가:', {
                    imageId: img.id,
                    originalFilePath: pathParts.join('/'),
                    correctedFilePath: img.file_path.substring(0, 100),
                    fileName
                  });
                } else {
                  console.warn('⚠️ [file_path 수정] filename 없음:', {
                    imageId: img.id,
                    file_path: img.file_path
                  });
                  // filename이 없으면 제외
                  return null;
                }
              }
            }
            
            // 실제 Storage 파일 존재 여부 확인 (수정된 file_path 사용)
            const exists = await verifyFileExists(img);
            if (!exists) {
              console.warn('⚠️ [잔상 이미지 제거] Storage에 존재하지 않는 이미지 메타데이터:', {
                imageId: img.id,
                file_path: img.file_path?.substring(0, 100),
                filename: img.filename
              });
              return null; // 존재하지 않으면 제외
            }
            
            return img;
          })
        );
        
        // null 제거
        filteredMetadataImages = processedImages.filter(img => img !== null);
        
        console.log('✅ [file_path 수정 및 파일 존재 확인] 완료:', {
          before: filteredMetadataImages.length + (processedImages.length - filteredMetadataImages.length),
          after: filteredMetadataImages.length,
          removed: processedImages.length - filteredMetadataImages.length
        });
      }

      let allImages = filteredMetadataImages || [];
      let storageImages = [];

      // 3. Storage에서 실제 파일 조회 (폴더명이 있는 경우)
      // ⚠️ 성능 최적화: 메타데이터 조회 결과가 충분하면 Storage 조회 건너뛰기
      // Storage 조회는 느리고, 메타데이터에 없는 파일은 보통 다른 고객의 파일이거나 삭제된 파일
      const shouldQueryStorage = filteredMetadataImages.length === 0;
      
      if (customerData?.folder_name && shouldQueryStorage) {
        const baseFolderPath = `originals/customers/${customerData.folder_name}`;
        
        // 날짜 필터가 있으면 해당 날짜 폴더만, 없으면 모든 하위 폴더 조회
        const folderPath = dateFilter 
          ? `${baseFolderPath}/${dateFilter}`
          : baseFolderPath;

        try {
          // Storage에서 파일 목록 조회
          // 날짜 필터가 있으면 해당 날짜 폴더만, 없으면 재귀적으로 모든 하위 폴더 조회
          let storageFiles = [];
          
          if (dateFilter) {
            // 특정 날짜 폴더만 조회
            const { data: files, error: storageError } = await supabase.storage
              .from(bucketName)
              .list(folderPath, {
                limit: 1000,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' }
              });
            
            if (!storageError && files) {
              storageFiles = files.filter(file => !file.name.endsWith('/'));
            }
          } else {
            // ⚠️ 성능 최적화: 날짜 필터가 없을 때는 Storage 조회 제한
            // 모든 날짜 폴더를 재귀 조회하면 너무 느려질 수 있음
            // 메타데이터 조회 결과가 있으면 Storage 조회 건너뛰기
            console.log('⚠️ [Storage 조회] 날짜 필터가 없어 Storage 조회를 건너뜁니다. (성능 최적화)');
            // Storage 조회 건너뛰기
          }

          if (storageFiles.length > 0) {
            // 날짜 추출 함수
            const extractDateFromPath = (path) => {
              const dateMatch = path.match(/(\d{4}-\d{2}-\d{2})/);
              return dateMatch ? dateMatch[1] : null;
            };

            // 이미지 타입 추출 함수
            const extractImageTypeFromFileName = (fileName) => {
              const match = fileName.match(/_s\d+_(.+?)_\d+\./);
              return match ? match[1] : null;
            };

            // 파일명 정규화 함수 (확장자 포함)
            const normalizeFileName = (fileName) => {
              if (!fileName) return '';
              return fileName.toLowerCase().replace(/[^a-z0-9.-]/g, '');
            };

            // 확장자 제거 함수
            const getFileNameWithoutExt = (fileName) => {
              if (!fileName) return '';
              return fileName.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9.-]/g, '');
            };

            // URL에서 파일명 추출 함수
            const extractFileNameFromUrl = (url) => {
              try {
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/');
                return pathParts[pathParts.length - 1].split('?')[0];
              } catch {
                return url.split('/').pop()?.split('?')[0] || '';
              }
            };

            // metadata 파일명 및 URL 맵 생성 (확장자 포함 및 제거 버전 모두)
            const metadataFileMap = new Map();
            (filteredMetadataImages || []).forEach(img => {
              // ⚠️ image_assets에는 english_filename, original_filename이 없으므로 file_path에서 추출
              const fileNameFromPath = img.file_path ? img.file_path.split('/').pop() : '';
              const metaFileName = normalizeFileName(fileNameFromPath || '');
              const metaFileNameWithoutExt = getFileNameWithoutExt(fileNameFromPath || '');
              
              // 확장자 포함 버전
              if (metaFileName) {
                metadataFileMap.set(metaFileName, img);
              }
              
              // 확장자 제거 버전 (같은 이름의 다른 확장자 파일 매칭용)
              if (metaFileNameWithoutExt && metaFileNameWithoutExt !== metaFileName) {
                // 이미 같은 키가 있으면 기존 것 유지 (첫 번째 매칭 우선)
                if (!metadataFileMap.has(metaFileNameWithoutExt)) {
                  metadataFileMap.set(metaFileNameWithoutExt, img);
                }
              }
              
              // URL에서 파일명 추출하여도 맵에 추가
              const urlFileName = normalizeFileName(extractFileNameFromUrl(img.cdn_url || img.image_url || ''));
              const urlFileNameWithoutExt = getFileNameWithoutExt(extractFileNameFromUrl(img.cdn_url || img.image_url || ''));
              
              if (urlFileName && urlFileName !== metaFileName) {
                metadataFileMap.set(urlFileName, img);
              }
              
              if (urlFileNameWithoutExt && urlFileNameWithoutExt !== urlFileName && !metadataFileMap.has(urlFileNameWithoutExt)) {
                metadataFileMap.set(urlFileNameWithoutExt, img);
              }
            });
            
            // 고객명 추출 (폴더명에서, 예: choiseokho-1801 -> choiseokho)
            const expectedCustomerName = customerData?.folder_name?.split('-')[0]?.toLowerCase() || '';
            
            storageImages = storageFiles
              .map(file => {
                const fileDate = dateFilter || file.dateFolder || 'unknown';
                const filePath = dateFilter 
                  ? `${folderPath}/${file.name}`
                  : `${baseFolderPath}/${fileDate}/${file.name}`;
                
                const { data: { publicUrl } } = supabase.storage
                  .from(bucketName)
                  .getPublicUrl(filePath);

                const normalizedFileName = normalizeFileName(file.name);
                const normalizedFileNameWithoutExt = getFileNameWithoutExt(file.name);
                
                // 확장자 포함 버전과 확장자 제거 버전 모두 확인
                const matchingMetadata = metadataFileMap.get(normalizedFileName) || 
                                        metadataFileMap.get(normalizedFileNameWithoutExt);
                
                // URL 정규화 (인코딩 문제 해결)
                let normalizedPublicUrl = publicUrl;
                try {
                  const urlObj = new URL(publicUrl);
                  normalizedPublicUrl = decodeURIComponent(urlObj.origin + urlObj.pathname);
                } catch {
                  normalizedPublicUrl = decodeURIComponent(publicUrl.split('?')[0]);
                }
                
                // metadata 이미지 목록에서 URL로도 확인 (인코딩 차이 고려)
                let metadataByUrl = null;
                if (!matchingMetadata) {
                  metadataByUrl = (filteredMetadataImages || []).find(meta => {
                    if (!meta.cdn_url && !meta.image_url) return false;
                    const metaUrl = meta.cdn_url || meta.image_url;
                    try {
                      const metaUrlObj = new URL(metaUrl);
                      const normalizedMetaUrl = decodeURIComponent(metaUrlObj.origin + metaUrlObj.pathname);
                      return normalizedMetaUrl === normalizedPublicUrl || metaUrl === publicUrl;
                    } catch {
                      return metaUrl === publicUrl;
                    }
                  });
                }
                
                const finalMetadata = matchingMetadata || metadataByUrl;
                
                // 파일명 추출 (URL 디코딩 포함)
                const extractFileName = (name) => {
                  if (!name) return null;
                  try {
                    return decodeURIComponent(name);
                  } catch {
                    return name;
                  }
                };
                
                const decodedFileName = extractFileName(file.name);
                
                return {
                  id: finalMetadata?.id || null,
                  image_url: publicUrl,
                  cdn_url: publicUrl, // 하위 호환성
                  english_filename: decodedFileName || file.name,
                  original_filename: decodedFileName || file.name,
                  date_folder: fileDate,
                  // ⚠️ image_assets에는 story_scene, image_type이 없을 수 있음
                  story_scene: null, // finalMetadata?.story_scene || null,
                  image_type: extractImageTypeFromFileName(file.name) || null, // finalMetadata?.image_type || null,
                  // 스캔 서류 필드 추가
                  is_scanned_document: finalMetadata?.is_scanned_document || false,
                  document_type: finalMetadata?.document_type || null,
                  // 고객 썸네일 대표 이미지 필드 추가
                  is_customer_representative: finalMetadata?.is_customer_representative || false,
                  isFromStorage: !finalMetadata, // metadata에 없으면 Storage에서 가져온 파일
                  metadataMissing: !finalMetadata, // metadata에 없는 파일
                  // 고객명 확인용 필드 추가
                  _customerNameFromFile: file.name.split('_')[0]?.toLowerCase() || ''
                };
              })
              .filter(img => {
                // 1. 파일명에서 고객명 추출하여 확인 (다른 고객 이미지 제외)
                if (expectedCustomerName && img._customerNameFromFile) {
                  // 파일명의 첫 부분이 고객명과 일치하는지 확인 (예: choiseokho_s1_...)
                  if (img._customerNameFromFile !== expectedCustomerName) {
                    // metadata에 있는 이미지는 tags로 이미 필터링되었으므로 통과
                    // metadata에 없는 Storage 이미지만 필터링
                    if (!img.id) {
                      return false; // 다른 고객의 Storage 이미지 제외
                    }
                  }
                }
                
                // 2. metadata에 없는 파일만 필터링 (id가 null인 파일)
                // 단, 이미 metadata 목록에 있는 URL과 중복되지 않는 경우만
                const isDuplicate = (filteredMetadataImages || []).some(meta => {
                  const metaUrl = meta.cdn_url || meta.image_url;
                  if (!metaUrl || !img.image_url) return false;
                  try {
                    const metaUrlObj = new URL(metaUrl);
                    const imgUrlObj = new URL(img.image_url);
                    const normalizedMetaUrl = decodeURIComponent(metaUrlObj.origin + metaUrlObj.pathname);
                    const normalizedImgUrl = decodeURIComponent(imgUrlObj.origin + imgUrlObj.pathname);
                    return normalizedMetaUrl === normalizedImgUrl;
                  } catch {
                    return metaUrl === img.image_url;
                  }
                });
                
                // metadata에 없고 중복도 아닌 파일만 반환
                return !img.id && !isDuplicate;
              })
              .map(img => {
                // _customerNameFromFile 필드 제거 (응답에 포함하지 않음)
                const { _customerNameFromFile, ...rest } = img;
                return rest;
              });

            // ✅ Storage 이미지도 ai_tags 확인하여 필터링 (metadata에 매칭된 경우만 포함)
            // Storage에서 가져온 이미지 중 metadata에 매칭된 것만 포함
            // metadata에 매칭되지 않은 Storage 이미지는 ai_tags가 없으므로 제외
            const storageImagesWithMetadata = storageImages.filter(img => {
              // metadata에 매칭된 이미지만 포함 (ai_tags가 있음)
              return !!img.id;
            });

            console.log('📦 [Storage 이미지 필터링] 결과:', {
              totalStorageImages: storageImages.length,
              withMetadata: storageImagesWithMetadata.length,
              withoutMetadata: storageImages.length - storageImagesWithMetadata.length,
              customerTag,
              customerId
            });

            // metadata와 병합 (metadata에 있는 이미지만 포함)
            allImages = [...(filteredMetadataImages || []), ...storageImagesWithMetadata];
          }
        } catch (storageErr) {
          console.warn('⚠️ Storage 조회 실패 (계속 진행):', storageErr);
        }
      }

      // date_folder가 없는 이미지에 대해 폴더 경로나 created_at에서 날짜 추출
      // ⚠️ image_assets에는 date_folder가 없으므로 항상 추출 필요
      allImages = allImages.map(img => {
        if (!img.date_folder) {
          // file_path에서 날짜 추출 (image_assets는 file_path 사용)
          if (img.file_path || img.folder_path) {
            const pathToCheck = img.file_path || img.folder_path;
            const dateMatch = pathToCheck.match(/(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
              img.date_folder = dateMatch[1];
            }
          }
          // cdn_url 또는 image_url에서 날짜 추출 시도
          const urlToCheck = img.cdn_url || img.image_url;
          if (!img.date_folder && urlToCheck) {
            const urlDateMatch = urlToCheck.match(/(\d{4}-\d{2}-\d{2})/);
            if (urlDateMatch) {
              img.date_folder = urlDateMatch[1];
            }
          }
          // created_at에서 날짜 추출
          if (!img.date_folder && img.created_at) {
            img.date_folder = img.created_at.slice(0, 10);
          }
          // 모두 실패하면 unknown
          if (!img.date_folder) {
            img.date_folder = 'unknown';
          }
        }
        
        // image_assets 형식으로 변환 (하위 호환성)
        // 프론트엔드가 기대하는 필드들 추가
        
        // 파일명 추출 함수 (URL 디코딩 포함)
        const extractFileName = (pathOrUrl) => {
          if (!pathOrUrl) return null;
          try {
            // file_path나 cdn_url에서 파일명 추출
            const fileName = pathOrUrl.split('/').pop() || '';
            // URL 인코딩된 파일명 디코딩
            try {
              return decodeURIComponent(fileName.split('?')[0]);
            } catch {
              return fileName.split('?')[0];
            }
          } catch {
            return null;
          }
        };
        
        // 파일명 추출 (여러 소스에서 시도)
        // ⚠️ filename 필드를 최우선으로 사용 (업데이트된 파일명)
        let fileName = img.filename || img.english_filename || img.original_filename || null;
        if (!fileName && img.file_path) {
          fileName = extractFileName(img.file_path);
        }
        if (!fileName && img.cdn_url) {
          fileName = extractFileName(img.cdn_url);
        }
        if (!fileName && img.image_url) {
          fileName = extractFileName(img.image_url);
        }
        
        // ⚠️ 갤러리 폴더 기준: file_path를 우선 사용하여 URL 생성 (가장 안정적)
        // file_path가 있으면 항상 file_path 기반 URL 사용 (갤러리 폴더 기준)
        let imageUrl = null;
        
        if (img.file_path) {
          // file_path에 파일명이 있는지 확인
          const pathParts = img.file_path.split('/');
          const lastPart = pathParts[pathParts.length - 1];
          const isDateFolder = /^\d{4}-\d{2}-\d{2}$/.test(lastPart);
          
          // file_path가 폴더 경로만 있고 파일명이 없는 경우
          if (isDateFolder || !lastPart.includes('.')) {
            // filename이나 cdn_url에서 파일명 추출
            const actualFileName = fileName || extractFileName(img.cdn_url) || 'unknown';
            const correctedFilePath = `${img.file_path}/${actualFileName}`;
            
            console.warn('⚠️ [고객 이미지 조회] file_path에 파일명 없음, 파일명 추가:', {
              imageId: img.id,
              originalFilePath: img.file_path,
              correctedFilePath: correctedFilePath.substring(0, 100),
              fileName: actualFileName
            });
            
            // 수정된 file_path로 URL 생성
            const { data: { publicUrl } } = supabase.storage
              .from(bucketName)
              .getPublicUrl(correctedFilePath);
            imageUrl = publicUrl;
            
            // file_path도 업데이트 (나중에 DB에 반영)
            img.file_path = correctedFilePath;
          } else {
            // file_path에 파일명이 있으면 그대로 사용
            const { data: { publicUrl } } = supabase.storage
              .from(bucketName)
              .getPublicUrl(img.file_path);
            imageUrl = publicUrl;
          }
          
          console.log('📝 [고객 이미지 조회] file_path 기반 URL 사용 (갤러리 폴더 기준):', {
            imageId: img.id,
            file_path: img.file_path?.substring(0, 100),
            generatedUrl: imageUrl?.substring(0, 100),
            oldCdnUrl: img.cdn_url?.substring(0, 100)
          });
        } else {
          // file_path가 없으면 기존 cdn_url 사용 (하위 호환성)
          imageUrl = img.cdn_url || img.image_url;
          if (!imageUrl) {
            console.warn('⚠️ [고객 이미지 조회] file_path와 cdn_url 모두 없음:', {
              imageId: img.id,
              filename: img.filename
            });
          }
        }
        
        
        return {
          ...img,
          image_url: imageUrl, // 하위 호환성 (프론트엔드가 image_url 사용)
          cdn_url: imageUrl, // cdn_url도 동일하게 설정
          // ⚠️ 파일명 필드 복구: filename을 최우선으로 사용 (업데이트된 파일명)
          filename: img.filename || fileName || null, // ⚠️ 중요: filename 필드 명시적으로 포함
          english_filename: img.english_filename || fileName || null,
          original_filename: img.original_filename || fileName || null,
          folder_path: img.file_path ? img.file_path.substring(0, img.file_path.lastIndexOf('/')) : null, // 하위 호환성
          // 스캔 서류 필드 추가
          is_scanned_document: img.is_scanned_document || false,
          document_type: img.document_type || null,
          // 고객 썸네일 대표 이미지 필드 추가
          is_customer_representative: img.is_customer_representative || false,
          // 프론트엔드가 사용하는 필드들
          // ⚠️ image_assets에 story_scene, display_order 컬럼이 추가되었으므로 실제 값 사용
          story_scene: img.story_scene !== undefined && img.story_scene !== null ? img.story_scene : null,
          display_order: img.display_order !== undefined && img.display_order !== null ? img.display_order : null,
          // image_assets에는 없는 필드들
          image_type: null, // image_assets에는 없음
          is_scene_representative: null // image_assets에는 없음
        };
      });

      // 날짜별로 그룹화
      const groupedByDate = allImages.reduce((acc, img) => {
        const date = img.date_folder || 'unknown';
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push({
          id: img.id,
          imageUrl: img.image_url,
          fileName: img.english_filename || img.original_filename || img.file_name,
          visitDate: date,
          createdAt: img.created_at
        });
        return acc;
      }, {});

      return res.status(200).json({
        success: true,
        images: allImages,
        groupedByDate,
        metadataCount: filteredMetadataImages?.length || 0,
        storageCount: storageImages.length,
        folderName: customerData?.folder_name || null
      });

    } catch (error) {
      console.error('❌ 고객 이미지 목록 조회 오류:', error);
      return res.status(500).json({
        success: false,
        error: '고객 이미지 목록 조회 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  } else {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}









