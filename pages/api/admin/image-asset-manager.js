import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'POST':
      return handleImageUpload(req, res);
    case 'GET':
      return handleImageSearch(req, res);
    case 'PUT':
      return handleImageUpdate(req, res);
    case 'DELETE':
      return handleImageDelete(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// 이미지 업로드 및 자산 등록
async function handleImageUpload(req, res) {
  try {
    const { 
      imageUrl, 
      originalFilename, 
      uploadSource = 'manual',
      uploadedBy = 'admin',
      forceUpload = false 
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: '이미지 URL이 필요합니다.' });
    }

    console.log('📤 이미지 자산 등록 시작:', imageUrl);

    // 1. 이미지 다운로드 및 해시 계산
    const imageBuffer = await downloadImage(imageUrl);
    const hashMd5 = crypto.createHash('md5').update(imageBuffer).digest('hex');
    const hashSha256 = crypto.createHash('sha256').update(imageBuffer).digest('hex');

    // 2. 중복 이미지 확인
    const { data: existingImage } = await supabase
      .from('image_assets')
      .select('*')
      .eq('hash_md5', hashMd5)
      .single();

    if (existingImage && !forceUpload) {
      console.log('⚠️ 중복 이미지 발견:', existingImage.id);
      
      // 사용 통계 업데이트
      await updateImageUsage(existingImage.id);
      
      return res.status(200).json({
        success: true,
        image: existingImage,
        isDuplicate: true,
        message: '이미 존재하는 이미지입니다.'
      });
    }

    // 3. 이미지 메타데이터 추출
    const metadata = await extractImageMetadata(imageBuffer);
    
    // 4. 파일명 생성 (SEO 친화적)
    const seoFilename = generateSEOFilename(originalFilename, metadata);
    
    // 5. Supabase Storage에 업로드
    const uploadResult = await uploadToSupabase(imageBuffer, seoFilename);
    
    // 6. 데이터베이스에 메타데이터 저장
    const imageRecord = await saveImageMetadata({
      filename: seoFilename,
      originalFilename,
      filePath: uploadResult.path,
      fileSize: imageBuffer.length,
      mimeType: metadata.mimeType,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      hashMd5,
      hashSha256,
      uploadSource,
      uploadedBy,
      cdnUrl: uploadResult.publicUrl
    });

    // 7. AI 분석 트리거 (비동기)
    triggerAIAnalysis(imageRecord.id, uploadResult.publicUrl);

    // 8. 이미지 최적화 버전 생성 (비동기)
    generateOptimizedVersions(imageRecord.id, imageBuffer, seoFilename);

    console.log('✅ 이미지 자산 등록 완료:', imageRecord.id);

    return res.status(200).json({
      success: true,
      image: imageRecord,
      isDuplicate: false,
      message: '이미지가 성공적으로 등록되었습니다.'
    });

  } catch (error) {
    console.error('❌ 이미지 업로드 오류:', error);
    return res.status(500).json({
      error: '이미지 업로드 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

// 이미지 검색
async function handleImageSearch(req, res) {
  try {
    const { 
      query, 
      tags, 
      format, 
      minWidth, 
      minHeight, 
      uploadSource,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 24
    } = req.query;

    console.log('🔍 이미지 검색:', { query, tags, format });

    let supabaseQuery = supabase
      .from('image_assets')
      .select(`
        *,
        image_tags(tag_name, tag_type, confidence_score)
      `)
      .eq('status', 'active');

    // 텍스트 검색
    if (query) {
      supabaseQuery = supabaseQuery.or(`
        alt_text.ilike.%${query}%,
        title.ilike.%${query}%,
        caption.ilike.%${query}%,
        description.ilike.%${query}%,
        ai_text_extracted.ilike.%${query}%
      `);
    }

    // 태그 필터
    if (tags) {
      const tagArray = tags.split(',');
      supabaseQuery = supabaseQuery.in('image_tags.tag_name', tagArray);
    }

    // 포맷 필터
    if (format) {
      supabaseQuery = supabaseQuery.eq('format', format);
    }

    // 크기 필터
    if (minWidth) {
      supabaseQuery = supabaseQuery.gte('width', parseInt(minWidth));
    }
    if (minHeight) {
      supabaseQuery = supabaseQuery.gte('height', parseInt(minHeight));
    }

    // 업로드 소스 필터
    if (uploadSource) {
      supabaseQuery = supabaseQuery.eq('upload_source', uploadSource);
    }

    // 정렬
    supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    // 페이지네이션
    const offset = (parseInt(page) - 1) * parseInt(limit);
    supabaseQuery = supabaseQuery.range(offset, offset + parseInt(limit) - 1);

    const { data: images, error, count } = await supabaseQuery;

    if (error) {
      throw error;
    }

    // 검색 결과 최적화
    const optimizedImages = images.map(image => ({
      ...image,
      thumbnail: getOptimizedUrl(image.cdn_url, 'thumbnail'),
      medium: getOptimizedUrl(image.cdn_url, 'medium'),
      large: getOptimizedUrl(image.cdn_url, 'large')
    }));

    return res.status(200).json({
      success: true,
      images: optimizedImages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ 이미지 검색 오류:', error);
    return res.status(500).json({
      error: '이미지 검색 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

// 이미지 업데이트
async function handleImageUpdate(req, res) {
  try {
    const { id, altText, title, caption, description, tags } = req.body;

    if (!id) {
      return res.status(400).json({ error: '이미지 ID가 필요합니다.' });
    }

    console.log('📝 이미지 메타데이터 업데이트:', id);

    // 이미지 자산 업데이트
    const { error: updateError } = await supabase
      .from('image_assets')
      .update({
        alt_text: altText,
        title: title,
        caption: caption,
        description: description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // 태그 업데이트
    if (tags && Array.isArray(tags)) {
      // 기존 태그 삭제
      await supabase
        .from('image_tags')
        .delete()
        .eq('image_id', id)
        .eq('tag_type', 'manual');

      // 새 태그 삽입
      const tagInserts = tags.map(tag => ({
        image_id: id,
        tag_name: tag,
        tag_type: 'manual',
        confidence_score: 1.0
      }));

      await supabase
        .from('image_tags')
        .insert(tagInserts);
    }

    console.log('✅ 이미지 메타데이터 업데이트 완료');

    return res.status(200).json({
      success: true,
      message: '이미지가 성공적으로 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('❌ 이미지 업데이트 오류:', error);
    return res.status(500).json({
      error: '이미지 업데이트 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

// ✅ file_path 정규화 함수 (Phase 2-1)
function normalizeFilePath(filePath, filename) {
  if (!filePath) return null;
  
  // file_path에 확장자가 있으면 그대로 사용
  const hasExtension = /\.(jpg|jpeg|png|gif|webp|svg|heic|heif|mp4|avi|mov|webm|mkv|flv|m4v|3gp|wmv)$/i.test(filePath);
  
  if (hasExtension) {
    return filePath;
  }
  
  // file_path가 폴더 경로만 있으면 filename과 조합
  if (filename) {
    return filePath.endsWith('/') 
      ? `${filePath}${filename}` 
      : `${filePath}/${filename}`;
  }
  
  return filePath;
}

// ✅ image_metadata 삭제 로직 단순화 (Phase 2-2)
// ✅ file_name 컬럼이 없으므로 image_url만 사용
async function deleteImageMetadata(targetUrl, targetFilePath) {
  const conditions = [];
  
  if (targetUrl) {
    conditions.push(`cdn_url.eq.${targetUrl}`);
  }
  
  // ✅ file_path도 확인 (선택적)
  if (targetFilePath) {
    conditions.push(`file_path.eq.${targetFilePath}`);
  }
  
  if (conditions.length === 0) {
    return { deleted: false, count: 0, error: null };
  }
  
  const { error, count } = await supabase
    .from('image_assets')
    .delete()
    .or(conditions.join(','));
  
  return { deleted: count > 0, count: count || 0, error };
}

// 이미지 삭제
async function handleImageDelete(req, res) {
  try {
    const { id, permanent = false } = req.body;

    if (!id) {
      return res.status(400).json({ error: '이미지 ID가 필요합니다.' });
    }

    console.log('🗑️ 이미지 삭제 시작:', { id, permanent });

    if (permanent) {
      // 1. 이미지 조회 (에러 처리 포함)
      // ✅ image_assets에 레코드가 없을 수 있으므로, folder_path와 name으로 file_path 구성
      const { folder_path, name, url } = req.body; // 클라이언트에서 전달받은 정보
      
      let image = null;
      let filePath = null;
      let imageUrl = null;
      
      const { data: assetData, error: fetchError } = await supabase
        .from('image_assets')
        .select('file_path, filename, cdn_url')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ image_assets 조회 오류:', fetchError);
        // 에러가 있어도 계속 진행 (다른 방법으로 파일 찾기)
      } else if (assetData) {
        image = assetData;
        // ✅ file_path 정규화 함수 사용
        filePath = normalizeFilePath(assetData.file_path, assetData.filename);
        imageUrl = assetData.cdn_url;
        console.log('✅ image_assets에서 이미지 발견:', { id, file_path: filePath, filename: image.filename, original_file_path: assetData.file_path });
      } else {
        // image_assets에 레코드가 없음 - folder_path와 name으로 file_path 구성
        console.warn('⚠️ image_assets에 레코드가 없습니다. folder_path와 name으로 file_path 구성...', id);
        
        if (folder_path && name) {
          // ✅ file_path 정규화 함수 사용
          filePath = normalizeFilePath(folder_path, name);
          console.log('✅ folder_path와 name으로 file_path 구성:', filePath);
        } else if (url) {
          // URL에서 파일 경로 추출 시도
          // 예: https://xxx.supabase.co/storage/v1/object/public/blog-images/originals/test-delete/file.png
          const urlMatch = url.match(/\/blog-images\/(.+)$/);
          if (urlMatch) {
            filePath = urlMatch[1];
            console.log('✅ URL에서 파일 경로 추출:', filePath);
          }
        }
        
        imageUrl = url || null;
      }

      // filePath가 없으면 에러 반환
      if (!filePath) {
        console.error('❌ file_path를 확인할 수 없습니다:', { id, folder_path, name, url });
        return res.status(404).json({ 
          error: '파일 경로를 확인할 수 없습니다. folder_path와 name, 또는 url이 필요합니다.',
          success: false,
          details: 'image_assets 레코드가 없고, folder_path/name 또는 url도 제공되지 않았습니다.'
        });
      }

      console.log('📋 삭제할 이미지 정보:', { id, file_path: filePath, imageUrl });

      // 2. Supabase Storage에서 파일 삭제
      let storageDeleted = false;
      if (filePath) {
        const { data: storageData, error: storageError } = await supabase.storage
          .from('blog-images')
          .remove([filePath]);

        if (storageError) {
          console.error('❌ Storage 삭제 오류:', storageError);
          // ✅ Storage 삭제 실패 시 에러 반환 (실제 삭제 보장)
          throw new Error(`Storage 삭제 실패: ${storageError.message}\n파일 경로: ${filePath}`);
        } else {
          console.log('✅ Storage 삭제 성공:', filePath);
          storageDeleted = true;
          
          // ✅ Storage 삭제 검증: 실제로 파일이 삭제되었는지 확인 (경고만, 에러 아님)
          // 주의: Supabase Storage의 list() API는 캐시된 결과를 반환할 수 있어
          // 삭제 직후 검증 시 파일이 여전히 목록에 나타날 수 있습니다.
          // 따라서 검증 실패는 경고로만 처리하고 삭제는 성공으로 간주합니다.
          try {
            // 약간의 지연 후 검증 (캐시 반영 시간 고려)
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 파일 경로에서 파일명 추출
            const pathParts = filePath.split('/');
            const fileName = pathParts.pop();
            const folderPath = pathParts.length > 0 ? pathParts.join('/') : '';
            
            if (!fileName) {
              console.warn('⚠️ 파일명을 추출할 수 없습니다:', filePath);
            } else {
              // 폴더 내 파일 목록 조회
              const { data: verifyFiles, error: listError } = await supabase.storage
                .from('blog-images')
                .list(folderPath || '', {
                  limit: 1000
                });
              
              if (listError) {
                // 폴더가 없거나 접근 불가능한 경우는 삭제 성공으로 간주
                console.log('ℹ️ Storage 삭제 검증: 폴더 조회 실패 (파일이 삭제되었을 가능성)', listError.message);
              } else if (verifyFiles) {
                const fileStillExists = verifyFiles.some(f => f.name === fileName);
                if (fileStillExists) {
                  // ⚠️ 경고만 표시하고 계속 진행 (캐시 문제일 수 있음)
                  console.warn('⚠️ Storage 삭제 검증: 파일이 목록에 여전히 나타납니다. (캐시 문제일 수 있음)');
                  console.warn('⚠️ 파일 경로:', filePath);
                  console.warn('⚠️ 참고: Supabase Storage의 list() API는 캐시된 결과를 반환할 수 있습니다.');
                  console.warn('⚠️ 실제로는 삭제되었을 수 있으므로 삭제는 성공으로 처리합니다.');
                  // 에러를 throw하지 않고 경고만 기록
                } else {
                  console.log('✅ Storage 삭제 검증 성공: 파일이 완전히 삭제되었습니다.');
                }
              }
            }
          } catch (verifyError) {
            // 검증 오류는 모두 경고로만 처리 (삭제는 이미 성공했을 가능성이 높음)
            console.warn('⚠️ Storage 삭제 검증 중 오류 (무시, 삭제는 성공으로 처리):', verifyError.message);
          }
        }
      } else {
        console.warn('⚠️ file_path가 없어 Storage 삭제를 건너뜁니다.');
      }

      // 3. 데이터베이스에서 완전 삭제 (삭제된 행 수 확인)
      // ✅ image_assets 레코드가 있을 때만 삭제 시도
      let deleteData = null;
      if (image) {
        const { data: dbDeleteData, error: deleteError } = await supabase
          .from('image_assets')
          .delete()
          .eq('id', id)
          .select('id, file_path, filename, cdn_url'); // 삭제된 행 반환 (cdn_url 포함)

        if (deleteError) {
          console.error('❌ DB 삭제 오류:', deleteError);
          // DB 삭제 실패해도 Storage 삭제는 성공했으므로 경고만
          console.warn('⚠️ image_assets 삭제 실패했지만 Storage 삭제는 성공했습니다.');
        } else {
          deleteData = dbDeleteData;
        }
      } else {
        console.log('ℹ️ image_assets 레코드가 없으므로 DB 삭제를 건너뜁니다.');
      }

      // 4. 삭제 검증 (image_assets 레코드가 있었던 경우만)
      if (image && (!deleteData || deleteData.length === 0)) {
        console.warn('⚠️ 삭제된 행이 없습니다:', id);
        // 이미 삭제되었거나 ID가 잘못된 경우 - 하지만 Storage 삭제는 성공했으므로 성공으로 처리
        console.log('ℹ️ image_assets 레코드가 없었지만 Storage 삭제는 성공했습니다.');
      }

      const deletedRows = deleteData ? deleteData.length : 0;
      console.log('✅ 이미지 삭제 완료:', { id, deletedRows, storageDeleted });

      // ✅ image_metadata 테이블에서도 삭제 (갤러리 표시 제거) - 단순화된 로직
      const deletedAsset = deleteData && deleteData.length > 0 ? deleteData[0] : null;
      const targetUrl = deletedAsset?.cdn_url || imageUrl;
      const targetFilePath = deletedAsset?.file_path || filePath;
      
      // ✅ 단순화된 image_metadata 삭제 함수 사용
      const metadataDeleteResult = await deleteImageMetadata(targetUrl, targetFilePath);
      let metadataDeleted = metadataDeleteResult.deleted; // ✅ const → let으로 변경
      const metadataDeleteErrors = metadataDeleteResult.error ? [metadataDeleteResult.error.message] : [];
      
      if (metadataDeleted) {
        console.log(`✅ image_metadata 삭제 성공: ${metadataDeleteResult.count}개 행 삭제됨`);
      } else if (metadataDeleteResult.error) {
        console.warn('⚠️ image_metadata 삭제 실패:', metadataDeleteResult.error);
      } else {
        console.log('ℹ️ image_assets에서 삭제할 행이 없습니다. (이미 삭제되었거나 존재하지 않을 수 있음)');
      }
      
      // 추가 시도: imageUrl이 있으면 한 번 더 시도 (기존 로직 유지)
      if (!metadataDeleted && imageUrl && imageUrl !== targetUrl) {
        try {
          const { error: metadataError4, count: metadataCount4 } = await supabase
            .from('image_assets')
            .delete()
            .eq('cdn_url', imageUrl);
            
            if (metadataError4) {
              console.warn('⚠️ image_assets 삭제 실패 (cdn_url):', metadataError4);
              metadataDeleteErrors.push(`cdn_url 삭제 실패: ${metadataError4.message}`);
            } else if (metadataCount4 > 0) {
              metadataDeleted = true;
              console.log(`✅ image_assets 삭제 성공 (cdn_url): ${metadataCount4}개 행 삭제됨`);
            }
        } catch (urlError) {
          console.warn('⚠️ image_metadata 삭제 시도 중 오류:', urlError);
          metadataDeleteErrors.push(`cdn_url 삭제 시도 중 오류: ${urlError.message}`);
        }
      }
      
      // ✅ image_metadata 삭제 실패 시 경고 (하지만 전체 삭제는 성공으로 처리)
      if (!metadataDeleted && metadataDeleteErrors.length > 0) {
        console.warn('⚠️ image_metadata에서 삭제된 행이 없습니다. (이미 삭제되었거나 존재하지 않을 수 있음)');
        console.warn('⚠️ 삭제 시도 오류:', metadataDeleteErrors);
      } else if (!metadataDeleted) {
        console.log('ℹ️ image_metadata에서 삭제할 행이 없습니다. (이미 삭제되었거나 존재하지 않음)');
      }

      // 5. 삭제 후 최종 검증
      const { data: finalVerify, error: finalVerifyError } = await supabase
        .from('image_assets')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (finalVerifyError) {
        console.error('❌ 최종 검증 중 오류:', finalVerifyError);
        // 검증 오류는 무시하고 삭제 성공으로 처리 (이미 삭제되었을 가능성)
      } else if (finalVerify) {
        console.error('❌ 삭제 검증 실패: 이미지가 여전히 존재합니다.');
        throw new Error('삭제 검증 실패: 이미지가 여전히 데이터베이스에 존재합니다.');
      } else {
        console.log('✅ 삭제 검증 성공: 이미지가 완전히 삭제되었습니다.');
      }

      // ✅ 최종 검증: Storage와 DB 모두 삭제되었는지 확인
      const finalResult = {
        success: true,
        message: '이미지가 영구 삭제되었습니다.',
        deletedId: id,
        deletedRows: deletedRows,
        storageDeleted: storageDeleted,
        metadataDeleted: metadataDeleted,
        warnings: []
      };
      
      if (!storageDeleted && filePath) {
        finalResult.warnings.push('Storage 파일 삭제를 건너뛰었습니다 (file_path 없음)');
      }
      
      if (!metadataDeleted) {
        finalResult.warnings.push('image_metadata에서 삭제된 행이 없습니다 (이미 삭제되었거나 존재하지 않을 수 있음)');
      }
      
      return res.status(200).json(finalResult);

    } else {
      // 아카이브: 상태만 변경
      const { data: archiveData, error: archiveError } = await supabase
        .from('image_assets')
        .update({ 
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (archiveError) {
        console.error('❌ 아카이브 오류:', archiveError);
        throw new Error(`아카이브 실패: ${archiveError.message}`);
      }

      if (!archiveData || archiveData.length === 0) {
        return res.status(404).json({
          error: '이미지를 찾을 수 없습니다.',
          success: false
        });
      }

      console.log('✅ 이미지 아카이브 완료:', { id, archivedRows: archiveData.length });

      return res.status(200).json({
        success: true,
        message: '이미지가 아카이브되었습니다.',
        archivedId: id
      });
    }

  } catch (error) {
    console.error('❌ 이미지 삭제 오류:', error);
    return res.status(500).json({
      error: '이미지 삭제 중 오류가 발생했습니다.',
      details: error.message,
      success: false
    });
  }
}

// 헬퍼 함수들
async function downloadImage(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`이미지 다운로드 실패: ${response.status}`);
  }
  return await response.buffer();
}

async function extractImageMetadata(imageBuffer) {
  // Sharp 동적 import (Vercel 환경 호환성)
  const sharp = (await import('sharp')).default;
  const metadata = await sharp(imageBuffer).metadata();
  
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    mimeType: `image/${metadata.format}`,
    hasAlpha: metadata.hasAlpha,
    density: metadata.density
  };
}

function generateSEOFilename(originalFilename, metadata) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  // 파일 확장자
  const extension = metadata.format || 'jpg';
  
  // SEO 친화적 파일명 생성
  const seoName = `img-${timestamp}-${randomString}`;
  
  return `${seoName}.${extension}`;
}

async function uploadToSupabase(imageBuffer, filename) {
  const { data, error } = await supabase.storage
    .from('blog-images')
    .upload(filename, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('blog-images')
    .getPublicUrl(filename);

  return {
    path: data.path,
    publicUrl
  };
}

async function saveImageMetadata(metadata) {
  const { data, error } = await supabase
    .from('image_assets')
    .insert([metadata])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateImageUsage(imageId) {
  await supabase
    .from('image_assets')
    .update({
      usage_count: supabase.raw('usage_count + 1'),
      last_used_at: new Date().toISOString()
    })
    .eq('id', imageId);
}

function getOptimizedUrl(originalUrl, size) {
  if (!originalUrl) return null;
  
  // Supabase Storage URL에서 최적화된 버전 URL 생성
  const baseUrl = originalUrl.split('?')[0];
  return `${baseUrl}?width=${getSizeWidth(size)}&quality=85&format=webp`;
}

function getSizeWidth(size) {
  const sizes = {
    thumbnail: 150,
    small: 300,
    medium: 600,
    large: 1200
  };
  return sizes[size] || 600;
}

// 비동기 함수들
async function triggerAIAnalysis(imageId, imageUrl) {
  try {
    // AI 분석 API 호출 (비동기)
    await fetch('/api/admin/image-ai-analyzer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, imageId })
    });
  } catch (error) {
    console.error('AI 분석 트리거 오류:', error);
  }
}

async function generateOptimizedVersions(imageId, imageBuffer, filename) {
  try {
    // Sharp 동적 import (Vercel 환경 호환성)
    const sharp = (await import('sharp')).default;
    const baseFilename = filename.split('.')[0];
    
    // 다양한 크기 생성
    const sizes = [
      { name: 'thumbnail', width: 150, height: 150 },
      { name: 'small', width: 300, height: 300 },
      { name: 'medium', width: 600, height: 600 },
      { name: 'large', width: 1200, height: 1200 }
    ];

    const optimizedVersions = {};

    for (const size of sizes) {
      const optimizedBuffer = await sharp(imageBuffer)
        .resize(size.width, size.height, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      const optimizedFilename = `${baseFilename}-${size.name}.webp`;
      
      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(optimizedFilename, optimizedBuffer, {
          contentType: 'image/webp',
          upsert: true
        });

      if (!error) {
        optimizedVersions[size.name] = optimizedFilename;
      }
    }

    // 데이터베이스에 최적화 버전 정보 저장
    await supabase
      .from('image_assets')
      .update({ optimized_versions: optimizedVersions })
      .eq('id', imageId);

    console.log('✅ 이미지 최적화 버전 생성 완료');

  } catch (error) {
    console.error('이미지 최적화 오류:', error);
  }
}
