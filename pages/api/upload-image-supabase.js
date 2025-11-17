import { createClient } from '@supabase/supabase-js';
// Sharp는 동적 import로 로드 (Vercel 환경 호환성)
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
    const formidable = (await import('formidable')).default;
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB 제한
    });

    // Promise 래퍼로 변환 (formidable 버전 호환성)
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });
    const file = files.file?.[0];
    const targetFolder = fields.targetFolder?.[0] || ''; // targetFolder 파라미터 읽기

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
      // Sharp 동적 import (Vercel 환경 호환성)
      const sharp = (await import('sharp')).default;
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
        // Sharp 동적 import (Vercel 환경 호환성)
        const sharp = (await import('sharp')).default;
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
        // sharp는 위에서 import했으므로 같은 스코프에서 재사용 가능
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
    
    // targetFolder가 있으면 경로에 포함
    const uploadPath = targetFolder 
      ? `${targetFolder}/${uniqueFileName}`.replace(/\/+/g, '/') // 중복 슬래시 제거
      : uniqueFileName;

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('blog-images') // 버킷 이름
      .upload(uploadPath, processedBuffer, {
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
      .getPublicUrl(uploadPath);

    const imageUrl = publicUrlData.publicUrl;

    console.log('✅ Supabase Storage 업로드 성공:', imageUrl);

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
    console.error('❌ 이미지 업로드 오류:', error);
    console.error('에러 스택:', error.stack);
    console.error('에러 상세:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({ 
      error: '이미지 업로드에 실패했습니다.',
      details: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
}
