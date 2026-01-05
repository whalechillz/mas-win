import { createClient } from '@supabase/supabase-js';
// Sharp는 동적 import로 로드 (Vercel 환경 호환성)
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 동영상 파일인지 확인
 * @param {string} mimetype - MIME type
 * @param {string} filename - 파일명
 * @returns {boolean} 동영상 파일 여부
 */
function isVideoFile(mimetype, filename) {
  const videoMimeTypes = [
    'video/mp4', 
    'video/quicktime', 
    'video/x-msvideo', 
    'video/webm', 
    'video/x-matroska', 
    'video/x-flv', 
    'video/3gpp',
    'video/x-ms-wmv'
  ];
  const videoExtensions = ['.mp4', '.avi', '.mov', '.webm', '.mkv', '.flv', '.m4v', '.3gp', '.wmv'];
  
  const name = (filename || '').toLowerCase();
  return videoMimeTypes.includes(mimetype?.toLowerCase()) || 
         videoExtensions.some(ext => name.endsWith(ext));
}

/**
 * 폴더 경로에서 폴더명 추출 (영어로)
 * @param {string} targetFolder - 폴더 경로 (예: 'originals/blog/2025-12/487')
 * @returns {string} 폴더명 prefix (예: 'blog', 'goods', 'product')
 */
function extractFolderPrefix(targetFolder) {
  if (!targetFolder) return 'blog'; // 기본값
  
  // originals/ 이후 첫 번째 폴더명 추출
  const match = targetFolder.match(/originals\/([^\/]+)/);
  if (match) {
    const folderName = match[1];
    
    // 폴더명 매핑 (한글/복잡한 이름 → 영어)
    const folderMap = {
      'blog': 'blog',
      'products': 'product',
      'goods': 'goods',
      'daily-branding': 'branding',
      'campaigns': 'campaign',
      'customers': 'customer',
      'scraped-images': 'scraped',
      'ai-generated': 'ai',
    };
    
    return folderMap[folderName] || folderName.replace(/[^a-z0-9]/g, '-');
  }
  
  return 'blog'; // 기본값
}

export const config = {
  api: {
    bodyParser: false, // FormData를 위해 bodyParser 비활성화
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // FormData에서 파일 추출
    const formidable = (await import('formidable')).default;
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB 제한 (Supabase 버킷 제한에 맞춤)
    });

    // Promise 래퍼로 변환 (formidable 버전 호환성)
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('❌ FormData 파싱 오류:', err);
          reject(err);
        } else {
          resolve([fields, files]);
        }
      });
    });
    
    // file 또는 image 필드명 지원 (하위 호환성)
    const file = files.file?.[0] || files.image?.[0];
    const targetFolder = fields.targetFolder?.[0] || ''; // targetFolder 파라미터 읽기
    const uploadMode = fields.uploadMode?.[0] || 'auto'; // 업로드 모드: 'auto' | 'preserve-name' | 'preserve-original'
    
    // 하위 호환성: 기존 preserveFilename, preserveExtension 파라미터 지원
    const preserveFilename = fields.preserveFilename?.[0] === 'true';
    const preserveExtension = fields.preserveExtension?.[0] === 'true';
    
    // 기존 파라미터가 있으면 uploadMode로 변환
    let effectiveUploadMode = uploadMode;
    if (preserveFilename && uploadMode === 'auto') {
      effectiveUploadMode = 'preserve-name';
    } else if (preserveExtension && uploadMode === 'auto') {
      effectiveUploadMode = 'preserve-name';
    }

    if (!file) {
      console.error('❌ 파일이 없습니다:', { files, fields });
      return res.status(400).json({ error: '파일이 필요합니다.' });
    }

    // filepath 확인 (formidable 버전 호환성)
    const filePath = file.filepath || file.path || file.tempFilePath;
    if (!filePath) {
      console.error('❌ 파일 경로가 없습니다:', file);
      return res.status(400).json({ error: '파일 경로를 찾을 수 없습니다.' });
    }

    // 파일 존재 확인
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      console.error('❌ 파일이 존재하지 않습니다:', filePath);
      return res.status(400).json({ error: '업로드된 파일을 찾을 수 없습니다.' });
    }

    // 업로드 시작 로깅
    console.log('📤 업로드 시작:', {
      fileName: file.originalFilename || 'unknown',
      fileSize: `${((file.size || 0) / 1024 / 1024).toFixed(2)}MB`,
      fileType: file.mimetype || 'unknown',
      filePath: filePath,
      targetFolder: targetFolder || '기본 폴더',
      uploadMode: effectiveUploadMode
    });

    // 파일을 Buffer로 읽기
    const fileBuffer = fs.readFileSync(filePath);

    // 원본 파일 확장자 추출
    const originalExtension = (file.originalFilename || '').split('.').pop()?.toLowerCase() || 'jpg';

    // 동영상 파일인지 확인
    const isVideo = isVideoFile(file.mimetype, file.originalFilename);

    let processedBuffer = fileBuffer;
    let finalFileName = file.originalFilename || (isVideo ? `video-${Date.now()}.mp4` : `image-${Date.now()}.jpg`);
    let imageMetadata = null;
    let contentType = file.mimetype || (isVideo ? 'video/mp4' : 'image/jpeg');

    // 동영상 파일 처리
    if (isVideo) {
      console.log('🎬 동영상 파일 감지:', {
        filename: file.originalFilename,
        mimetype: file.mimetype,
        size: fileBuffer.length,
        uploadMode: effectiveUploadMode
      });
      
      // 동영상은 원본 그대로 업로드 (최적화 없음)
      processedBuffer = fileBuffer;
      
      // 파일명 처리
      if (effectiveUploadMode === 'preserve-original') {
        // 옵션 1: 원본 파일명과 확장자 그대로
        finalFileName = file.originalFilename || `video-${Date.now()}.${originalExtension}`;
      } else {
        // 옵션 2: 파일명만 폴더에 맞게 최적화하고 확장자 유지
        const folderPrefix = extractFolderPrefix(targetFolder);
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        finalFileName = `${folderPrefix}-${timestamp}-${randomString}.${originalExtension}`;
      }
      
      // 동영상 Content-Type 설정
      if (file.mimetype) {
        contentType = file.mimetype;
      } else {
        // 확장자 기반 Content-Type
        const extension = originalExtension.toLowerCase();
        const mimeMap = {
          'mp4': 'video/mp4',
          'avi': 'video/x-msvideo',
          'mov': 'video/quicktime',
          'webm': 'video/webm',
          'mkv': 'video/x-matroska',
          'flv': 'video/x-flv',
          'm4v': 'video/mp4',
          '3gp': 'video/3gpp',
          'wmv': 'video/x-ms-wmv'
        };
        contentType = mimeMap[extension] || 'video/mp4';
      }
      
      console.log(`✅ 동영상 파일 준비 완료: ${finalFileName} (${contentType})`);
    } else {
      // 이미지 파일 처리
      // 이미지 메타데이터 추출
      try {
        // Sharp 동적 import (Vercel 환경 호환성)
        const sharp = (await import('sharp')).default;
        const sharpImage = sharp(fileBuffer);
        imageMetadata = await sharpImage.metadata();
        
        console.log(`📸 원본 이미지 메타데이터:`, {
          width: imageMetadata.width,
          height: imageMetadata.height,
          orientation: imageMetadata.orientation,
          format: imageMetadata.format,
          size: fileBuffer.length
        });
      } catch (metadataError) {
        console.warn('⚠️ 메타데이터 추출 실패:', metadataError.message);
      }

      // 이미지 파일만 최적화 처리 (동영상은 이미 위에서 처리됨)
      let outputFormat = 'jpeg';
      let outputExtension = 'jpg';
      // 업로드 모드에 따른 처리
      const originalFormat = imageMetadata?.format || originalExtension;
      outputFormat = 'jpeg';
      outputExtension = 'jpg';
      contentType = 'image/jpeg';

      if (effectiveUploadMode === 'preserve-original') {
        // 원본 파일 그대로 업로드 (최적화 건너뛰기)
        processedBuffer = fileBuffer;
        finalFileName = file.originalFilename || `image-${Date.now()}.${originalExtension}`;
        
        // 원본 포맷에 맞는 Content-Type 설정
        if (originalFormat === 'webp' || originalExtension === 'webp') {
          contentType = 'image/webp';
        } else if (originalFormat === 'png' || originalExtension === 'png') {
          contentType = 'image/png';
        } else if (originalFormat === 'gif' || originalExtension === 'gif') {
          contentType = 'image/gif';
        }
        
        console.log(`✅ 원본 파일 그대로 업로드: ${finalFileName} (${contentType})`);
      } else {
        // 최적화 적용
        // 출력 포맷 결정
        if (effectiveUploadMode === 'preserve-name') {
          // 파일명 유지 모드: 원본 확장자 유지
          outputExtension = originalExtension;
          
          // 포맷 매핑
          if (originalExtension === 'webp' || originalFormat === 'webp') {
            outputFormat = 'webp';
          } else if (originalExtension === 'png' || originalFormat === 'png') {
            outputFormat = 'png';
          } else {
            outputFormat = 'jpeg';
          }
        } else {
          // auto 모드: JPEG로 변환
          outputFormat = 'jpeg';
          outputExtension = 'jpg';
        }

        // 이미지 최적화
        try {
          if (imageMetadata) {
            const sharp = (await import('sharp')).default;
            
            // 이미지 최적화 설정 (EXIF 회전 정보 자동 적용)
            let optimizedImage = sharp(fileBuffer)
              .rotate() // EXIF 회전 정보 자동 적용
              .resize(1200, 800, { // 최대 크기 제한
                fit: 'inside',
                withoutEnlargement: true
              });

            // 포맷별 최적화 옵션 적용
            if (outputFormat === 'webp') {
              optimizedImage = optimizedImage.webp({ quality: 85 });
              contentType = 'image/webp';
            } else if (outputFormat === 'png') {
              optimizedImage = optimizedImage.png({ quality: 85, compressionLevel: 9 });
              contentType = 'image/png';
            } else {
              optimizedImage = optimizedImage.jpeg({ 
                quality: 85, // 품질 85%
                progressive: true,
                mozjpeg: true // 더 나은 JPEG 압축
              });
              contentType = 'image/jpeg';
            }

            processedBuffer = await optimizedImage.toBuffer();
            
            // 최적화된 이미지 메타데이터 확인
            const optimizedMetadata = await sharp(processedBuffer).metadata();
            console.log(`🔄 최적화된 이미지 메타데이터:`, {
              width: optimizedMetadata.width,
              height: optimizedMetadata.height,
              orientation: optimizedMetadata.orientation,
              format: optimizedMetadata.format,
              size: processedBuffer.length
            });
            
            // 파일명 확장자 업데이트
            if (effectiveUploadMode === 'preserve-name') {
              // 원본 확장자 유지
              const baseName = finalFileName.replace(/\.[^/.]+$/, '');
              finalFileName = `${baseName}.${outputExtension}`;
            } else {
              // 기본: JPEG로 변환
              finalFileName = finalFileName.replace(/\.[^/.]+$/, `.${outputExtension}`);
            }
            
            console.log(`✅ 이미지 최적화 완료: ${imageMetadata.width}x${imageMetadata.height} -> ${optimizedMetadata.width}x${optimizedMetadata.height} (포맷: ${outputFormat})`);
            
            // 최적화된 메타데이터로 업데이트
            imageMetadata = optimizedMetadata;
            imageMetadata.size = processedBuffer.length;
          }
        } catch (optimizeError) {
          console.warn('⚠️ 이미지 최적화 실패, 원본 사용:', optimizeError.message);
          // 최적화 실패 시 원본 사용
        }
      } // 이미지 처리 종료
    } // else 블록 닫기

    // 파일명 생성
    let uniqueFileName;
    if (isVideo) {
      // 동영상은 이미 finalFileName이 설정됨
      uniqueFileName = finalFileName;
    } else {
      // 이미지 파일명 처리
      if (effectiveUploadMode === 'preserve-original' || effectiveUploadMode === 'preserve-name') {
        // 원본 파일명 전체 유지 (한글 파일명도 그대로)
        uniqueFileName = file.originalFilename || `image-${Date.now()}.${outputExtension}`;
        
        // 확장자가 이미 올바른지 확인
        if (effectiveUploadMode === 'preserve-original') {
          // 원본 그대로 모드: 원본 확장자 그대로
          if (!uniqueFileName.endsWith(`.${originalExtension}`)) {
            const baseName = uniqueFileName.replace(/\.[^/.]+$/, '');
            uniqueFileName = `${baseName}.${originalExtension}`;
          }
        } else {
          // 파일명 유지 모드: 최적화된 확장자
          if (!uniqueFileName.endsWith(`.${outputExtension}`)) {
            const baseName = uniqueFileName.replace(/\.[^/.]+$/, '');
            uniqueFileName = `${baseName}.${outputExtension}`;
          }
        }
      } else {
        // auto 모드: 폴더명 + 타임스탬프 + 랜덤 문자열 (JPEG로 변환)
        const folderPrefix = extractFolderPrefix(targetFolder);
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        uniqueFileName = `${folderPrefix}-${timestamp}-${randomString}.${outputExtension}`;
      }
    }
    
    // targetFolder가 있으면 경로에 포함
    let uploadPath = targetFolder 
      ? `${targetFolder}/${uniqueFileName}`.replace(/\/+/g, '/') // 중복 슬래시 제거
      : uniqueFileName;
    
    // 원본 파일명 유지 옵션일 때 중복 체크
    if (effectiveUploadMode === 'preserve-original' || effectiveUploadMode === 'preserve-name') {
      const baseFileName = uniqueFileName;
      let counter = 0;
      let finalPath = uploadPath;
      
      // 중복 체크 (최대 10번 시도)
      while (counter < 10) {
        const folderPath = finalPath.split('/').slice(0, -1).join('/');
        const fileName = finalPath.split('/').pop();
        
        const { data: existingFiles, error: listError } = await supabase.storage
          .from('blog-images')
          .list(folderPath || '', {
            search: fileName
          });
        
        if (listError || !existingFiles || existingFiles.length === 0) {
          break; // 중복 없음
        }
        
        // 중복이면 번호 추가
        counter++;
        const pathParts = finalPath.split('/');
        const currentFileName = pathParts.pop();
        const nameWithoutExt = currentFileName.replace(/\.[^/.]+$/, '');
        const ext = currentFileName.match(/\.[^/.]+$/)?.[0] || '';
        pathParts.push(`${nameWithoutExt}-${counter}${ext}`);
        finalPath = pathParts.join('/');
      }
      
      uploadPath = finalPath;
    }

    // Supabase Storage에 업로드
    console.log('🔄 Supabase Storage 업로드 중...', {
      uploadPath,
      contentType,
      bufferSize: `${(processedBuffer.length / 1024 / 1024).toFixed(2)}MB`
    });
    
    const { data, error } = await supabase.storage
      .from('blog-images') // 버킷 이름
      .upload(uploadPath, processedBuffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Supabase Storage 업로드 오류:', {
        error: error.message,
        code: error.statusCode,
        uploadPath,
        fileSize: processedBuffer.length
      });
      return res.status(500).json({ 
        error: '이미지 업로드에 실패했습니다.',
        details: error.message 
      });
    }
    
    console.log('✅ Supabase Storage 업로드 완료:', uploadPath);

    // 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(uploadPath);

    const imageUrl = publicUrlData.publicUrl;

    console.log('✅ Supabase Storage 업로드 성공:', imageUrl);

    // ✅ 제품 이미지 경로인 경우 제품의 detail_images, composition_images, gallery_images에 자동 추가
    let productSyncResult = null;
    try {
      const { addImageToProduct } = await import('../../lib/product-image-sync');
      // uploadPath를 전체 경로로 변환 (이미 originals/products/... 형식일 수도 있음)
      const fullImagePath = uploadPath.startsWith('originals/products/') 
        ? uploadPath 
        : uploadPath;
      
      const syncSuccess = await addImageToProduct(fullImagePath);
      if (syncSuccess) {
        productSyncResult = { synced: true };
        console.log('✅ 제품 이미지 배열에 자동 추가 완료');
      }
    } catch (syncError) {
      console.warn('⚠️ 제품 이미지 동기화 실패 (계속 진행):', syncError);
      productSyncResult = { synced: false, error: syncError.message };
    }

    // 해시 생성 (중복 이미지 검사용)
    const hashMd5 = crypto.createHash('md5').update(processedBuffer).digest('hex');
    const hashSha256 = crypto.createHash('sha256').update(processedBuffer).digest('hex');

    // 파생 파일 생성 비활성화: 단일 원본만 업로드 (중복 생성 원인 제거)
    let optimizedVersions = {};

    // AI 메타데이터 자동 생성 (비동기로 처리)
    let aiMetadata = {
      alt_text: '',
      title: finalFileName.replace(/\.[^/.]+$/, ''), // 기본 제목
      description: '',
      tags: []
    };

    // AI 분석을 비동기로 실행 (업로드 속도에 영향 없음)
    setTimeout(async () => {
      try {
        console.log('🤖 AI 메타데이터 자동 생성 시작:', imageUrl);
        
        // OpenAI Vision API로 ALT 텍스트와 설명 생성
        const openaiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/analyze-image-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageUrl: imageUrl,
            title: '이미지 분석',
            excerpt: 'AI 메타데이터 자동 생성'
          })
        });

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          aiMetadata.alt_text = openaiData.prompt || '';
          aiMetadata.description = openaiData.prompt || '';
          console.log('✅ OpenAI Vision API 분석 완료');
        }

        // Google Vision API로 태그 생성
        const googleResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/image-ai-analyzer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageUrl: imageUrl,
            imageId: uniqueFileName
          })
        });

        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          aiMetadata.tags = googleData.tags || [];
          console.log('✅ Google Vision API 분석 완료');
        }

        // AI 생성된 메타데이터로 업데이트 (중복 방지)
        const { error: updateError } = await supabase
          .from('image_metadata')
          .update({
            alt_text: aiMetadata.alt_text,
            title: aiMetadata.title,
            description: aiMetadata.description,
            tags: aiMetadata.tags
          })
          .eq('image_url', imageUrl)
          .not('alt_text', 'is', null); // 이미 AI 메타데이터가 있는 경우만 업데이트

        if (updateError) {
          console.error('❌ AI 메타데이터 업데이트 실패:', updateError);
        } else {
          console.log('✅ AI 메타데이터 자동 저장 완료');
        }

      } catch (aiError) {
        console.error('❌ AI 메타데이터 생성 중 오류:', aiError);
        // AI 실패해도 업로드는 성공으로 처리
      }
    }, 1000); // 1초 후 비동기 실행

    // 메타데이터를 image_metadata 테이블에 저장
    console.log('🔄 메타데이터 저장 중...');
    try {
      // 동영상 파일의 경우 포맷을 확장자 기반으로 설정
      let fileFormat = imageMetadata?.format || 'jpeg';
      if (isVideo) {
        // 동영상 포맷 매핑
        const extension = originalExtension.toLowerCase();
        const formatMap = {
          'mp4': 'mp4',
          'avi': 'avi',
          'mov': 'mov',
          'webm': 'webm',
          'mkv': 'mkv',
          'flv': 'flv',
          'm4v': 'mp4',
          '3gp': '3gp',
          'wmv': 'wmv'
        };
        fileFormat = formatMap[extension] || 'mp4';
      }
      
      const metadataRecord = {
        image_url: imageUrl,
        title: finalFileName.replace(/\.[^/.]+$/, ''), // 확장자 제거한 파일명
        file_size: imageMetadata?.size || processedBuffer.length,
        width: imageMetadata?.width || null,
        height: imageMetadata?.height || null,
        format: fileFormat,
        upload_source: isVideo ? 'video_upload' : 'file_upload',
        status: 'active',
        hash_md5: hashMd5,
        hash_sha256: hashSha256,
        optimized_versions: optimizedVersions,
        usage_count: 0
      };

      console.log('💾 메타데이터 저장 중:', metadataRecord);

      // 중복 방지를 위해 먼저 기존 레코드 확인
      const { data: existingRecord, error: checkError } = await supabase
        .from('image_metadata')
        .select('id')
        .eq('image_url', imageUrl)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ 기존 레코드 확인 오류:', checkError);
        throw checkError;
      }

      let metadataData;
      if (existingRecord) {
        // 기존 레코드가 있으면 업데이트
        const { data: updateData, error: updateError } = await supabase
          .from('image_metadata')
          .update(metadataRecord)
          .eq('image_url', imageUrl)
          .select();
        
        if (updateError) {
          console.error('❌ 메타데이터 업데이트 실패:', updateError);
          throw updateError;
        }
        metadataData = updateData;
        console.log('✅ 기존 메타데이터 업데이트 완료');
      } else {
        // 새 레코드 생성
        const { data: insertData, error: insertError } = await supabase
          .from('image_metadata')
          .insert(metadataRecord)
          .select();
        
        if (insertError) {
          console.error('❌ 메타데이터 생성 실패:', insertError);
          throw insertError;
        }
        metadataData = insertData;
        console.log('✅ 새 메타데이터 생성 완료');
      }

      console.log('✅ 메타데이터 저장 성공:', metadataData?.[0]?.id);
    } catch (metadataSaveError) {
      console.error('❌ 메타데이터 저장 중 오류:', metadataSaveError);
      // 메타데이터 저장 실패해도 업로드는 성공으로 처리
    }

    res.status(200).json({ 
      success: true, 
      url: imageUrl,
      fileName: uniqueFileName,
      path: data.path,
      metadata: {
        width: imageMetadata?.width || null,
        height: imageMetadata?.height || null,
        format: isVideo ? (originalExtension.toLowerCase() === 'mp4' ? 'mp4' : originalExtension.toLowerCase()) : (imageMetadata?.format || 'jpeg'),
        file_size: imageMetadata?.size || processedBuffer.length,
        is_video: isVideo
      },
      productSync: productSyncResult
    });

  } catch (error) {
    // 파일 정보 추출 (에러 발생 시점에 file이 정의되어 있을 수 있음)
    const fileInfo = {
      fileName: file?.originalFilename || 'unknown',
      fileSize: file?.size || 0,
      fileType: file?.mimetype || 'unknown',
      targetFolder: targetFolder || 'unknown',
      uploadMode: effectiveUploadMode || 'unknown'
    };

    console.error('❌ 이미지 업로드 오류:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      fileInfo
    });

    res.status(500).json({ 
      error: '이미지 업로드에 실패했습니다.',
      details: error.message,
      // 개발 환경에서만 상세 정보 제공
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        errorType: error.name,
        errorCode: error.code,
        fileInfo
      })
    });
  }
}
