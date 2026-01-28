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
          .from('image_assets')
          .select('*')
          .eq('cdn_url', originalImageUrl)
          .maybeSingle();

        if (!metadataError && metadata) {
          originalMetadata = metadata;
          
          // 원본이 고객 폴더인 경우 그대로 사용 (file_path 사용)
          if (metadata.file_path && metadata.file_path.includes('originals/customers/')) {
            targetFolderPath = metadata.file_path.substring(0, metadata.file_path.lastIndexOf('/'));
            console.log('✅ 원본이 고객 폴더입니다. 같은 폴더에 저장:', targetFolderPath);
          } else if (metadata.file_path) {
            // 원본 메타데이터에 file_path가 있으면 우선 사용
            targetFolderPath = metadata.file_path.substring(0, metadata.file_path.lastIndexOf('/'));
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

        // 새 메타데이터 생성 (image_assets 형식)
        // ⚠️ image_assets에는 많은 필드가 없으므로 기본 필드만 사용
        const newMetadata = {
          cdn_url: publicUrl,
          file_path: targetFolderPath ? `${targetFolderPath}/${finalFileName}` : finalFileName,
          // 원본 메타데이터 복사
          alt_text: originalMetadata.alt_text || null,
          title: originalMetadata.title || null,
          description: originalMetadata.description || null,
          ai_tags: originalMetadata.ai_tags || originalMetadata.tags || null,
          file_size: imageData.length,
          width: originalMetadata.width || null,
          height: originalMetadata.height || null,
          format: fileExtension,
          upload_source: 'variation-replicate', // Replicate 변형으로 생성된 이미지 표시
          status: originalMetadata.status || 'active',
          // GPS 및 촬영일시 복사
          gps_lat: originalMetadata.gps_lat || null,
          gps_lng: originalMetadata.gps_lng || null,
          taken_at: originalMetadata.taken_at || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
          // ⚠️ image_assets에는 다음 필드들이 없음: folder_path, date_folder, prompt, category_id, story_scene, image_type, customer_name_en, customer_initials, english_filename, original_filename
        };

        // 고객 폴더인 경우 고객 정보 조회 및 ai_tags에 추가
        if (targetFolderPath && targetFolderPath.includes('originals/customers/')) {
          try {
            // 고객 폴더명 추출
            const customerMatch = targetFolderPath.match(/customers\/([^/]+)/);
            if (customerMatch) {
              const customerFolderName = customerMatch[1];
              
              const { data: customer, error: customerError } = await supabase
                .from('customers')
                .select('id, folder_name')
                .eq('folder_name', customerFolderName)
                .maybeSingle();

              if (!customerError && customer) {
                console.log('✅ 고객 정보 조회 완료:', {
                  customerId: customer.id,
                  folderName: customer.folder_name
                });

                // 날짜 추출 (file_path에서 또는 현재 날짜)
                const dateMatch = newMetadata.file_path?.match(/(\d{4}-\d{2}-\d{2})/);
                const visitDate = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);
                
                // ai_tags에 고객 정보 추가
                const customerTag = `customer-${customer.id}`;
                const visitTag = `visit-${visitDate}`;
                
                // 기존 ai_tags가 있으면 배열로 변환, 없으면 새 배열 생성
                const existingTags = Array.isArray(newMetadata.ai_tags) 
                  ? newMetadata.ai_tags 
                  : newMetadata.ai_tags 
                    ? [newMetadata.ai_tags] 
                    : [];
                
                // 고객 태그가 이미 있으면 제거 후 다시 추가 (중복 방지)
                const tagsWithoutCustomer = existingTags.filter(
                  (tag) => typeof tag === 'string' && !tag.startsWith('customer-') && !tag.startsWith('visit-')
                );
                
                newMetadata.ai_tags = [customerTag, visitTag, ...tagsWithoutCustomer];
                
                console.log('✅ 고객 태그 추가 완료:', {
                  customerTag,
                  visitTag,
                  ai_tags: newMetadata.ai_tags
                });
              } else {
                console.warn('⚠️ 고객 정보 조회 실패:', customerError?.message || '고객을 찾을 수 없음');
              }
            }
          } catch (error) {
            console.warn('⚠️ 고객 정보 조회 중 오류 (계속 진행):', error.message);
          }
        }

        // 메타데이터 저장 (upsert 사용)
        const { error: saveError } = await supabase
          .from('image_assets')
          .upsert(newMetadata, {
            onConflict: 'cdn_url',
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
