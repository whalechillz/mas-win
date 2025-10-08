import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const formidable = require('formidable');
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB 제한
    });

    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }

    // 파일을 Buffer로 읽기
    const fs = require('fs');
    const imageBuffer = fs.readFileSync(file.filepath);

    let processedBuffer = imageBuffer;
    let finalFileName = file.originalFilename || `image-${Date.now()}.jpg`;
    let imageMetadata = null;

    // 이미지 메타데이터 추출
    try {
      const sharpImage = sharp(imageBuffer);
      imageMetadata = await sharpImage.metadata();
      
      console.log(`📸 원본 이미지 메타데이터:`, {
        width: imageMetadata.width,
        height: imageMetadata.height,
        orientation: imageMetadata.orientation,
        format: imageMetadata.format,
        size: imageBuffer.length
      });
    } catch (metadataError) {
      console.warn('⚠️ 메타데이터 추출 실패:', metadataError.message);
    }

    // 이미지 최적화 (항상 실행)
    try {
      if (imageMetadata) {
        // 이미지 최적화 설정 (EXIF 회전 정보 자동 적용)
        const optimizedImage = sharp(imageBuffer)
          .rotate() // EXIF 회전 정보 자동 적용
          .resize(1200, 800, { // 최대 크기 제한
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ 
            quality: 85, // 품질 85%
            progressive: true,
            mozjpeg: true // 더 나은 JPEG 압축
          });

        processedBuffer = await optimizedImage.toBuffer();
        
        // 최적화된 이미지 메타데이터 확인
        const optimizedMetadata = await sharp(processedBuffer).metadata();
        console.log(`🔄 최적화된 이미지 메타데이터:`, {
          width: optimizedMetadata.width,
          height: optimizedMetadata.height,
          orientation: optimizedMetadata.orientation,
          size: processedBuffer.length
        });
        
        // 파일명을 .jpg로 변경
        finalFileName = finalFileName.replace(/\.[^/.]+$/, '.jpg');
        
        console.log(`✅ 이미지 최적화 완료: ${imageMetadata.width}x${imageMetadata.height} -> ${optimizedMetadata.width}x${optimizedMetadata.height}`);
        
        // 최적화된 메타데이터로 업데이트
        imageMetadata = optimizedMetadata;
        imageMetadata.size = processedBuffer.length;
      }
    } catch (optimizeError) {
      console.warn('⚠️ 이미지 최적화 실패, 원본 사용:', optimizeError.message);
      // 최적화 실패 시 원본 사용
    }

    // 고유한 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = finalFileName.split('.').pop();
    const uniqueFileName = `blog-${timestamp}-${randomString}.${fileExtension}`;

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('blog-images') // 버킷 이름
      .upload(uniqueFileName, processedBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase Storage 업로드 오류:', error);
      return res.status(500).json({ 
        error: '이미지 업로드에 실패했습니다.',
        details: error.message 
      });
    }

    // 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(uniqueFileName);

    const imageUrl = publicUrlData.publicUrl;

    console.log('✅ Supabase Storage 업로드 성공:', imageUrl);

    // 해시 생성 (중복 이미지 검사용)
    const hashMd5 = crypto.createHash('md5').update(processedBuffer).digest('hex');
    const hashSha256 = crypto.createHash('sha256').update(processedBuffer).digest('hex');

    // 파생 파일 생성 (썸네일, 중간 크기)
    let optimizedVersions = {};
    try {
      // 썸네일 생성 (150x150)
      const thumbnailBuffer = await sharp(processedBuffer)
        .resize(150, 150, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnailFileName = `thumb_${uniqueFileName}`;
      const { data: thumbnailData, error: thumbnailError } = await supabase.storage
        .from('blog-images')
        .upload(thumbnailFileName, thumbnailBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (!thumbnailError) {
        const { data: thumbnailUrlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(thumbnailFileName);
        optimizedVersions.thumbnail = thumbnailUrlData.publicUrl;
        console.log('✅ 썸네일 생성 완료:', optimizedVersions.thumbnail);
      }

      // 중간 크기 생성 (600x400)
      const mediumBuffer = await sharp(processedBuffer)
        .resize(600, 400, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      const mediumFileName = `medium_${uniqueFileName}`;
      const { data: mediumData, error: mediumError } = await supabase.storage
        .from('blog-images')
        .upload(mediumFileName, mediumBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (!mediumError) {
        const { data: mediumUrlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(mediumFileName);
        optimizedVersions.medium = mediumUrlData.publicUrl;
        console.log('✅ 중간 크기 생성 완료:', optimizedVersions.medium);
      }
    } catch (derivedError) {
      console.warn('⚠️ 파생 파일 생성 실패:', derivedError.message);
    }

    // 메타데이터를 image_metadata 테이블에 저장
    try {
      const metadataRecord = {
        image_url: imageUrl,
        title: finalFileName.replace(/\.[^/.]+$/, ''), // 확장자 제거한 파일명
        file_size: imageMetadata?.size || processedBuffer.length,
        width: imageMetadata?.width || null,
        height: imageMetadata?.height || null,
        format: imageMetadata?.format || 'jpeg',
        upload_source: 'file_upload',
        status: 'active',
        hash_md5: hashMd5,
        hash_sha256: hashSha256,
        optimized_versions: optimizedVersions,
        usage_count: 0
      };

      console.log('💾 메타데이터 저장 중:', metadataRecord);

      const { data: metadataData, error: metadataError } = await supabase
        .from('image_metadata')
        .upsert(metadataRecord, { 
          onConflict: 'image_url',
          ignoreDuplicates: false 
        })
        .select();

      if (metadataError) {
        console.error('❌ 메타데이터 저장 실패:', metadataError);
        // 메타데이터 저장 실패해도 업로드는 성공으로 처리
      } else {
        console.log('✅ 메타데이터 저장 성공:', metadataData?.[0]?.id);
      }
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
        width: imageMetadata?.width,
        height: imageMetadata?.height,
        format: imageMetadata?.format,
        file_size: imageMetadata?.size || processedBuffer.length
      }
    });

  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    res.status(500).json({ 
      error: '이미지 업로드에 실패했습니다.',
      details: error.message 
    });
  }
}
