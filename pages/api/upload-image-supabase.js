import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

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
        status: 'active'
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
