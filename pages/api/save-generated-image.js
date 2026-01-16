// 생성된 이미지를 Supabase Storage에 저장하는 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, fileName, blogPostId, folderPath, originalImageUrl } = req.body;

    if (!imageUrl || !fileName) {
      return res.status(400).json({ error: 'imageUrl and fileName are required' });
    }

    console.log('🖼️ 이미지 저장 시작:', { imageUrl, fileName, blogPostId, folderPath });

    // 1. 외부 이미지 URL에서 이미지 데이터 다운로드
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageData = Buffer.from(imageBuffer);

    // 2. 파일명 생성 (타임스탬프 포함)
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const finalFileName = `generated-${timestamp}-${fileName}`;

    // 3. 원본 이미지의 메타데이터 먼저 조회 (폴더 경로 결정을 위해)
    let targetFolderPath = folderPath && folderPath.trim() !== '' ? folderPath.trim() : null;
    let targetDateFolder = targetFolderPath ? targetFolderPath.split('/').pop() : new Date().toISOString().slice(0, 10);
    let originalMetadata = null;

    if (originalImageUrl) {
      try {
        const { data: metadata, error: metadataError } = await supabase
          .from('image_metadata')
          .select('*')
          .eq('image_url', originalImageUrl)
          .maybeSingle();

        if (!metadataError && metadata) {
          originalMetadata = metadata;
          
          // 원본이 고객 폴더인 경우 그대로 사용
          if (metadata.folder_path && metadata.folder_path.includes('originals/customers/')) {
            targetFolderPath = metadata.folder_path;
            targetDateFolder = metadata.date_folder || targetDateFolder;
            console.log('✅ 원본이 고객 폴더입니다. 같은 폴더에 저장:', targetFolderPath);
          } else if (metadata.folder_path) {
            // 원본 메타데이터에 folder_path가 있으면 우선 사용
            targetFolderPath = metadata.folder_path;
            targetDateFolder = metadata.date_folder || targetDateFolder;
          }
        }
      } catch (metadataError) {
        console.warn('⚠️ 원본 메타데이터 조회 실패 (기본 경로 사용):', metadataError);
      }
    }

    // 4. Supabase Storage에 업로드 (폴더 경로 포함)
    const uploadPath = targetFolderPath 
      ? `${targetFolderPath}/${finalFileName}` 
      : finalFileName;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(uploadPath, imageData, {
        contentType: `image/${fileExtension}`,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase 업로드 에러:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 5. 공개 URL 생성 (폴더 경로 포함)
    const { data: publicUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(uploadPath);

    const publicUrl = publicUrlData.publicUrl;

    console.log('✅ 이미지 저장 완료:', { finalFileName, publicUrl });

    // 6. 원본 이미지의 메타데이터 복사 (originalImageUrl이 있는 경우)
    if (originalImageUrl && originalMetadata) {
      try {
        console.log('📋 원본 메타데이터 발견, 복사 중...', {
          originalUrl: originalImageUrl,
          newUrl: publicUrl
        });

        // 새 메타데이터 생성 (파일명 관련 필드 제외)
        const newMetadata = {
          image_url: publicUrl,
          folder_path: targetFolderPath,
          date_folder: targetDateFolder,
          // 원본 메타데이터 복사 (파일명 관련 필드 제외)
          alt_text: originalMetadata.alt_text || null,
          title: originalMetadata.title || null,
          description: originalMetadata.description || null,
          tags: originalMetadata.tags || null,
          prompt: originalMetadata.prompt || null,
          category_id: originalMetadata.category_id || null,
          file_size: imageData.length,
          width: originalMetadata.width || null,
          height: originalMetadata.height || null,
          format: fileExtension,
          upload_source: 'variation-replicate', // Replicate 변형으로 생성된 이미지 표시
          status: originalMetadata.status || 'active',
          // 고객 이미지 관련 필드도 복사
          story_scene: originalMetadata.story_scene || null,
          image_type: originalMetadata.image_type || null,
          customer_name_en: originalMetadata.customer_name_en || null,
          customer_initials: originalMetadata.customer_initials || null,
          english_filename: finalFileName,
          original_filename: originalMetadata.original_filename || finalFileName,
          // GPS 및 촬영일시 복사
          gps_lat: originalMetadata.gps_lat || null,
          gps_lng: originalMetadata.gps_lng || null,
          taken_at: originalMetadata.taken_at || null,
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
      } catch (metadataCopyError) {
        console.warn('⚠️ 메타데이터 복사 중 오류 (계속 진행):', metadataCopyError);
      }
    }

    // 6. 데이터베이스에 이미지 정보 저장 (선택사항)
    if (blogPostId) {
      const { error: dbError } = await supabase
        .from('blog_images')
        .insert({
          blog_post_id: blogPostId,
          original_url: imageUrl,
          stored_url: publicUrl,
          file_name: finalFileName,
          created_at: new Date().toISOString()
        });

      if (dbError) {
        console.warn('⚠️ 데이터베이스 저장 실패 (이미지는 저장됨):', dbError);
      }
    }

    return res.status(200).json({
      success: true,
      originalUrl: imageUrl,
      storedUrl: publicUrl,
      fileName: finalFileName,
      message: '이미지가 성공적으로 저장되었습니다.'
    });

  } catch (error) {
    console.error('❌ 이미지 저장 에러:', error);
    return res.status(500).json({
      error: '이미지 저장에 실패했습니다.',
      details: error.message
    });
  }
}
