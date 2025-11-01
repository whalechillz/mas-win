import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        error: '이미지 정보가 필요합니다.',
        details: 'images 배열이 비어있거나 없습니다.'
      });
    }

    console.log('📋 일괄 복제 시작:', images.length, '개 이미지');
    console.log('📋 요청 데이터:', JSON.stringify(req.body, null, 2));

    const duplicatedImages = [];
    const errors = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        console.log(`📋 복제 중 (${i + 1}/${images.length}):`, image.name);
        console.log(`📋 이미지 URL:`, image.url);

        // 1. 원본 이미지 다운로드 (헤더 추가)
        const imageResponse = await fetch(image.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://www.masgolf.co.kr/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
          }
        });
        
        if (!imageResponse.ok) {
          throw new Error(`이미지 다운로드 실패: ${imageResponse.status} ${imageResponse.statusText}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        
        // MIME 타입을 파일 확장자에서 추정
        const fileExtension = image.name.split('.').pop()?.toLowerCase() || 'jpg';
        let mimeType = 'image/jpeg'; // 기본값
        
        switch (fileExtension) {
          case 'png': mimeType = 'image/png'; break;
          case 'gif': mimeType = 'image/gif'; break;
          case 'webp': mimeType = 'image/webp'; break;
          case 'svg': mimeType = 'image/svg+xml'; break;
          case 'jpg':
          case 'jpeg': mimeType = 'image/jpeg'; break;
        }
        
        const imageBlob = new Blob([imageBuffer], { type: mimeType });
        console.log(`📋 MIME 타입 설정: ${mimeType} (확장자: ${fileExtension})`);

        // 2. 새로운 파일명 생성 (타임스탬프 추가)
        const timestamp = Date.now();
        const baseName = image.name.replace(/\.[^/.]+$/, ''); // 확장자 제거
        const newFileName = `${baseName}_copy_${timestamp}.${fileExtension}`;

        // 3. 체계적인 폴더 구조 생성
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateFolder = `${year}-${month}-${day}`;
        
        // 폴더 경로: duplicated/YYYY-MM-DD/파일명
        const fullPath = `duplicated/${dateFolder}/${newFileName}`;

        console.log(`📋 새 파일명: ${newFileName}`);
        console.log(`📋 폴더 경로: ${fullPath}`);

        // 4. Supabase Storage에 업로드
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(fullPath, imageBlob, {
            contentType: mimeType,
            upsert: false
          });

        if (uploadError) {
          throw new Error(`업로드 실패: ${uploadError.message}`);
        }

        // 5. 공개 URL 생성
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fullPath);

        // 6. 메타데이터 저장
        // 주의: image_metadata 테이블 스키마에 맞춰 필드 제한
        const metadata = {
          image_url: urlData.publicUrl,
          prompt: `복제된 이미지: ${image.title || image.name}`,
          title: image.title || `복제본 - ${baseName}`,
          description: image.description || `원본 이미지의 복제본입니다.`,
          alt_text: image.alt_text || `복제된 이미지: ${baseName}`,
          tags: Array.isArray(image.keywords) ? image.keywords : (image.keywords ? [image.keywords] : []),
          file_size: imageBuffer.byteLength,
          upload_source: 'duplicate',
          status: 'active'
        };
        
        // category_id가 필요한 경우 동적으로 조회
        if (image.category) {
          // 카테고리 이름을 ID로 변환 (선택사항)
          const { data: categoryData } = await supabase
            .from('image_categories')
            .select('id')
            .eq('name', image.category)
            .single();
          
          if (categoryData) {
            metadata.category_id = categoryData.id;
          }
        }

        const { error: metadataError } = await supabase
          .from('image_metadata')
          .insert(metadata);

        if (metadataError) {
          console.warn('⚠️ 메타데이터 저장 실패:', metadataError);
          // 메타데이터 저장 실패해도 이미지는 저장되었으므로 계속 진행
        }

        duplicatedImages.push({
          originalName: image.name,
          newName: newFileName,
          newUrl: urlData.publicUrl,
          size: imageBuffer.byteLength
        });

        console.log(`✅ 복제 완료: ${image.name} → ${newFileName}`);

      } catch (error) {
        console.error(`❌ 복제 실패 (${image.name}):`, error);
        console.error(`❌ 실패한 URL:`, image.url);
        errors.push({
          originalName: image.name,
          originalUrl: image.url,
          error: error.message
        });
      }
    }

    console.log(`📋 일괄 복제 완료: 성공 ${duplicatedImages.length}개, 실패 ${errors.length}개`);

    return res.status(200).json({
      success: true,
      duplicatedCount: duplicatedImages.length,
      errorCount: errors.length,
      duplicatedImages: duplicatedImages,
      errors: errors,
      summary: {
        total: images.length,
        successful: duplicatedImages.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('❌ 일괄 복제 API 오류:', error);
    return res.status(500).json({
      error: '일괄 복제 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}
