import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    // FormData 파싱 (formidable 동적 import)
    const formidable = (await import('formidable')).default;
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB 제한
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.image?.[0];
    const folderPath = fields.folderPath?.[0] || '';
    const fileName = fields.fileName?.[0] || `processed-${Date.now()}.png`;
    const originalImageUrl = fields.originalImageUrl?.[0] || '';

    if (!file) {
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }

    // 파일명에서 확장자 추출하여 contentType 결정
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'png';
    const contentType = fileExtension === 'webp' ? 'image/webp' :
                       fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'image/jpeg' :
                       fileExtension === 'png' ? 'image/png' :
                       fileExtension === 'gif' ? 'image/gif' :
                       file.mimetype || 'image/png';

    // 파일을 Buffer로 읽기
    const fileBuffer = fs.readFileSync(file.filepath);

    // Supabase Storage에 업로드
    const bucket = 'blog-images';
    const uploadPath = folderPath ? `${folderPath}/${fileName}` : fileName;

    console.log('💾 처리된 이미지 Supabase Storage에 업로드 중:', uploadPath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(uploadPath, fileBuffer, {
        contentType,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase 업로드 오류:', uploadError);
      throw uploadError;
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadPath);

    // 원본 이미지의 메타데이터 복사
    if (originalImageUrl) {
      try {
        // 원본 이미지의 메타데이터 조회
        const { data: originalMetadata, error: metadataError } = await supabase
          .from('image_metadata')
          .select('*')
          .eq('image_url', originalImageUrl)
          .maybeSingle();

        if (!metadataError && originalMetadata) {
          console.log('📋 원본 메타데이터 발견, 복사 중...', {
            originalUrl: originalImageUrl,
            newUrl: urlData.publicUrl
          });

          // 새 메타데이터 생성 (파일명 관련 필드 제외)
          const newMetadata = {
            image_url: urlData.publicUrl,
            folder_path: folderPath,
            // 원본 메타데이터 복사 (파일명 관련 필드 제외)
            alt_text: originalMetadata.alt_text || null,
            title: originalMetadata.title || null,
            description: originalMetadata.description || null,
            tags: originalMetadata.tags || null,
            prompt: originalMetadata.prompt || null,
            category_id: originalMetadata.category_id || null,
            file_size: fileBuffer.length,
            width: originalMetadata.width || null,
            height: originalMetadata.height || null,
            format: fileExtension,
            upload_source: 'rotation', // 회전으로 생성된 이미지 표시
            status: originalMetadata.status || 'active',
            // 고객 이미지 관련 필드도 복사
            story_scene: originalMetadata.story_scene || null,
            image_type: originalMetadata.image_type || null,
            customer_name_en: originalMetadata.customer_name_en || null,
            customer_initials: originalMetadata.customer_initials || null,
            date_folder: originalMetadata.date_folder || null,
            english_filename: fileName, // 새 파일명만 설정
            original_filename: originalMetadata.original_filename || fileName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // 메타데이터 저장 (upsert 사용)
          const { error: saveError } = await supabase
            .from('image_metadata')
            .upsert(newMetadata, {
              onConflict: 'image_url',
              ignoreDuplicates: false
            });

          if (saveError) {
            console.warn('⚠️ 메타데이터 저장 실패 (계속 진행):', saveError);
          } else {
            console.log('✅ 메타데이터 복사 완료');
          }
        } else {
          console.log('ℹ️ 원본 메타데이터를 찾을 수 없습니다:', originalImageUrl);
        }
      } catch (metadataCopyError) {
        console.warn('⚠️ 메타데이터 복사 중 오류 (계속 진행):', metadataCopyError);
      }
    }

    // 임시 파일 삭제
    try {
      fs.unlinkSync(file.filepath);
    } catch (unlinkError) {
      console.warn('⚠️ 임시 파일 삭제 실패:', unlinkError);
    }

    console.log('✅ 처리된 이미지 업로드 완료:', urlData.publicUrl);

    res.json({
      success: true,
      imageUrl: urlData.publicUrl,
      fileName: fileName,
      size: fileBuffer.length
    });

  } catch (error) {
    console.error('❌ 처리된 이미지 업로드 오류:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        error: error.message || '이미지 업로드 중 오류가 발생했습니다.' 
      });
    }
  }
}

