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
    const { images, targetFolder } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        error: '이미지 정보가 필요합니다.',
        details: 'images 배열이 비어있거나 없습니다.'
      });
    }

    if (!targetFolder || typeof targetFolder !== 'string') {
      return res.status(400).json({
        error: '대상 폴더가 필요합니다.',
        details: 'targetFolder가 비어있거나 유효하지 않습니다.'
      });
    }

    console.log('📋 이미지 복사 시작:', images.length, '개 이미지');
    console.log('📋 대상 폴더:', targetFolder);

    const copiedImages = [];
    const errors = [];

    // 대상 폴더의 기존 파일 목록 조회 (중복 파일명 확인용)
    const { data: existingFiles, error: listError } = await supabase.storage
      .from('blog-images')
      .list(targetFolder, {
        limit: 10000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.warn('⚠️ 폴더 목록 조회 실패 (계속 진행):', listError.message);
    }

    const existingFileNames = new Set(
      (existingFiles || []).map(file => file.name.toLowerCase())
    );

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        console.log(`📋 복사 중 (${i + 1}/${images.length}):`, image.name);
        console.log(`📋 원본 폴더:`, image.folder_path || '없음');

        // 같은 폴더인지 확인
        const sourceFolder = image.folder_path || '';
        const isSameFolder = sourceFolder === targetFolder;

        // 1. 원본 이미지 다운로드
        const imageResponse = await fetch(image.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
        let mimeType = 'image/jpeg';
        
        switch (fileExtension) {
          case 'png': mimeType = 'image/png'; break;
          case 'gif': mimeType = 'image/gif'; break;
          case 'webp': mimeType = 'image/webp'; break;
          case 'svg': mimeType = 'image/svg+xml'; break;
          case 'jpg':
          case 'jpeg': mimeType = 'image/jpeg'; break;
        }
        
        const imageBlob = new Blob([imageBuffer], { type: mimeType });

        // 2. 파일명 생성 (같은 폴더이거나 중복 파일명인 경우 순번 추가)
        let newFileName = image.name;
        
        if (isSameFolder || existingFileNames.has(image.name.toLowerCase())) {
          // 파일명에서 확장자 분리
          const baseName = image.name.replace(/\.[^/.]+$/, '');
          const extension = fileExtension;
          
          // 순번 추가
          let counter = 1;
          let candidateName = `${baseName}-${counter}.${extension}`;
          
          while (existingFileNames.has(candidateName.toLowerCase())) {
            counter++;
            candidateName = `${baseName}-${counter}.${extension}`;
          }
          
          newFileName = candidateName;
          existingFileNames.add(newFileName.toLowerCase());
          
          console.log(`📋 같은 폴더/중복 파일명 감지: ${image.name} → ${newFileName}`);
        } else {
          existingFileNames.add(newFileName.toLowerCase());
        }

        // 3. 전체 경로 생성
        const fullPath = `${targetFolder}/${newFileName}`;

        console.log(`📋 새 파일명: ${newFileName}`);
        console.log(`📋 전체 경로: ${fullPath}`);

        // 4. Supabase Storage에 업로드
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(fullPath, imageBlob, {
            contentType: mimeType,
            upsert: false
          });

        if (uploadError) {
          // 파일이 이미 존재하는 경우 (upsert: false이므로)
          if (uploadError.message.includes('already exists')) {
            // 순번을 다시 시도
            const baseName = image.name.replace(/\.[^/.]+$/, '');
            const extension = fileExtension;
            let counter = 1;
            let candidateName = `${baseName}-${counter}.${extension}`;
            
            while (existingFileNames.has(candidateName.toLowerCase())) {
              counter++;
              candidateName = `${baseName}-${counter}.${extension}`;
            }
            
            newFileName = candidateName;
            const retryPath = `${targetFolder}/${newFileName}`;
            
            const { data: retryUploadData, error: retryUploadError } = await supabase.storage
              .from('blog-images')
              .upload(retryPath, imageBlob, {
                contentType: mimeType,
                upsert: false
              });
            
            if (retryUploadError) {
              throw new Error(`업로드 실패: ${retryUploadError.message}`);
            }
            
            existingFileNames.add(newFileName.toLowerCase());
          } else {
            throw new Error(`업로드 실패: ${uploadError.message}`);
          }
        }

        // 5. 공개 URL 생성
        const finalPath = uploadData?.path || `${targetFolder}/${newFileName}`;
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(finalPath);

        // 6. 메타데이터 저장
        const metadata = {
          image_url: urlData.publicUrl,
          original_path: finalPath,
          file_name: newFileName,
          folder_path: targetFolder,
          alt_text: image.alt_text || '',
          title: image.title || image.name,
          description: image.description || '',
          tags: Array.isArray(image.keywords) ? image.keywords : (image.keywords ? [image.keywords] : []),
          file_size: imageBuffer.byteLength,
          upload_source: 'copy',
          status: 'active'
        };

        const { error: metadataError } = await supabase
          .from('image_metadata')
          .insert(metadata);

        if (metadataError) {
          console.warn('⚠️ 메타데이터 저장 실패:', metadataError);
          // 메타데이터 저장 실패해도 이미지는 저장되었으므로 계속 진행
        }

        copiedImages.push({
          originalName: image.name,
          originalFolder: sourceFolder,
          newName: newFileName,
          newUrl: urlData.publicUrl,
          newPath: finalPath,
          size: imageBuffer.byteLength,
          isSameFolder: isSameFolder
        });

        console.log(`✅ 복사 완료: ${image.name} → ${newFileName}`);

      } catch (error) {
        console.error(`❌ 복사 실패 (${image.name}):`, error);
        errors.push({
          originalName: image.name,
          originalUrl: image.url,
          error: error.message
        });
      }
    }

    console.log(`📋 이미지 복사 완료: 성공 ${copiedImages.length}개, 실패 ${errors.length}개`);

    return res.status(200).json({
      success: true,
      copiedCount: copiedImages.length,
      errorCount: errors.length,
      copiedImages: copiedImages,
      errors: errors,
      summary: {
        total: images.length,
        successful: copiedImages.length,
        failed: errors.length,
        sameFolderCount: copiedImages.filter(img => img.isSameFolder).length
      }
    });

  } catch (error) {
    console.error('❌ 이미지 복사 API 오류:', error);
    return res.status(500).json({
      error: '이미지 복사 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}


