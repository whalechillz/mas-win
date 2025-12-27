import { createClient } from '@supabase/supabase-js';
import { invalidateCache } from './all-images';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('🗑️ 이미지 삭제 API 요청:', req.method, req.url);

  try {
    // 1) POST: 일괄 삭제 지원 (imageNames 배열)
    if (req.method === 'POST') {
      const { imageNames, imageName } = req.body || {};

      // 단일 키로 들어오면 배열로 정규화
      const targets = Array.isArray(imageNames)
        ? imageNames
        : (imageName ? [imageName] : []);

      if (!targets || targets.length === 0) {
        return res.status(400).json({ 
          error: '삭제할 이미지 이름이 필요합니다. (imageNames: string[])' 
        });
      }

      console.log('🗑️ 일괄 이미지 삭제 중:', targets.length, '개');
      console.log('🗑️ 삭제 대상 파일들:', targets);

      // 실제 존재하는 파일들만 필터링 (폴더 경로 포함)
      const existingFiles = [];
      for (const target of targets) {
        // 파일명 그대로 사용 (폴더 경로 포함)
        const targetWithExtension = target;
        
        // 폴더 경로가 포함된 경우와 루트의 경우 모두 확인
        let fileFound = false;
        
        // 1. 루트에서 검색 (폴더 경로가 없는 경우)
        if (!targetWithExtension.includes('/')) {
          const { data: rootFiles, error: rootError } = await supabase.storage
            .from('blog-images')
            .list('', { search: targetWithExtension });
          
          if (!rootError && rootFiles && rootFiles.length > 0) {
            existingFiles.push(targetWithExtension);
            fileFound = true;
            console.log('✅ 루트에서 파일 존재 확인:', targetWithExtension);
          }
        } else {
          // 2. 폴더 경로가 있는 경우 - 여러 방법으로 검색
          const pathParts = targetWithExtension.split('/');
          const folderPath = pathParts.slice(0, -1).join('/');
          const fileName = pathParts[pathParts.length - 1];
          
          console.log('🔍 폴더 경로 검색:', { folderPath, fileName, fullPath: targetWithExtension });
          
          // 방법 1: 정확한 폴더 경로로 검색
          const { data: folderFiles, error: folderError } = await supabase.storage
            .from('blog-images')
            .list(folderPath, { search: fileName });
          
          if (!folderError && folderFiles && folderFiles.length > 0) {
            const exactFile = folderFiles.find(file => file.name === fileName);
            if (exactFile) {
              existingFiles.push(targetWithExtension);
              fileFound = true;
              console.log('✅ 폴더에서 파일 존재 확인 (방법1):', targetWithExtension);
            }
          }
          
          // 방법 1-1: 폴더 경로가 잘못된 경우 재귀적 검색
          if (!fileFound && folderPath.includes('/')) {
            const pathSegments = folderPath.split('/');
            for (let i = pathSegments.length; i > 0; i--) {
              const partialPath = pathSegments.slice(0, i).join('/');
              console.log('🔍 부분 경로 검색:', partialPath);
              
              const { data: partialFiles, error: partialError } = await supabase.storage
                .from('blog-images')
                .list(partialPath, { search: fileName });
              
              if (!partialError && partialFiles && partialFiles.length > 0) {
                const exactFile = partialFiles.find(file => file.name === fileName);
                if (exactFile) {
                  const correctedPath = `${partialPath}/${fileName}`;
                  existingFiles.push(correctedPath);
                  fileFound = true;
                  console.log('✅ 부분 경로에서 파일 발견 (방법1-1):', correctedPath);
                  break;
                }
              }
            }
          }
          
          // 방법 2: 파일명만으로 전체 검색 (폴더 경로 무시)
          if (!fileFound) {
            console.log('🔍 전체 검색 시도:', fileName);
            const { data: allFiles, error: allError } = await supabase.storage
              .from('blog-images')
              .list('', { search: fileName });
            
            if (!allError && allFiles && allFiles.length > 0) {
              const matchingFile = allFiles.find(file => 
                file.name === fileName || 
                file.name.includes(fileName) ||
                fileName.includes(file.name)
              );
              
              if (matchingFile) {
                // 실제 경로 재구성
                const actualPath = matchingFile.name.includes('/') ? matchingFile.name : targetWithExtension;
                existingFiles.push(actualPath);
                fileFound = true;
                console.log('✅ 전체 검색에서 파일 발견 (방법2):', actualPath);
              }
            }
          }
          
          // 방법 3: 직접 파일 존재 확인 (getPublicUrl로 테스트)
          if (!fileFound) {
            console.log('🔍 직접 파일 존재 확인:', targetWithExtension);
            try {
              const { data: urlData } = supabase.storage
                .from('blog-images')
                .getPublicUrl(targetWithExtension);
              
              // URL로 HEAD 요청하여 파일 존재 확인
              const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
              if (response.ok) {
                existingFiles.push(targetWithExtension);
                fileFound = true;
                console.log('✅ 직접 확인으로 파일 존재 확인 (방법3):', targetWithExtension);
              }
            } catch (error) {
              console.log('⚠️ 직접 확인 실패:', error.message);
            }
          }
          
          // 방법 4: 모든 가능한 경로 조합 시도
          if (!fileFound) {
            console.log('🔍 모든 경로 조합 시도:', fileName);
            const possiblePaths = [
              targetWithExtension,
              fileName,
              `duplicated/${fileName}`,
              `scraped-images/${fileName}`,
              `duplicated/2025-10-14/${fileName}`,
              `scraped-images/2025-10-14/${fileName}`
            ];
            
            for (const testPath of possiblePaths) {
              try {
                const { data: urlData } = supabase.storage
                  .from('blog-images')
                  .getPublicUrl(testPath);
                
                const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
                if (response.ok) {
                  existingFiles.push(testPath);
                  fileFound = true;
                  console.log('✅ 경로 조합에서 파일 발견 (방법4):', testPath);
                  break;
                }
              } catch (error) {
                console.log('⚠️ 경로 조합 실패:', testPath, error.message);
              }
            }
          }
        }
        
        if (!fileFound) {
          console.warn('⚠️ 파일이 존재하지 않음:', targetWithExtension);
        }
      }

      console.log('🗑️ 실제 존재하는 파일들:', existingFiles);

      if (existingFiles.length === 0) {
        console.warn('⚠️ 삭제할 파일이 존재하지 않음');
        return res.status(200).json({
          success: true,
          message: '삭제할 파일이 존재하지 않습니다.',
          deletedImages: [],
          originalTargets: targets
        });
      }

      // 1. Supabase Storage에서 파일 삭제
      console.log('🗑️ 스토리지 삭제 시도:', existingFiles);
      const { data, error } = await supabase.storage
        .from('blog-images')
        .remove(existingFiles);

      if (error) {
        console.error('❌ 이미지 일괄 삭제 에러:', error);
        return res.status(500).json({
          error: '이미지 일괄 삭제에 실패했습니다.',
          details: error.message,
          attemptedFiles: existingFiles
        });
      }

      console.log('✅ 이미지 일괄 삭제 성공:', existingFiles.length, '개');
      console.log('✅ 삭제된 파일들:', data);

      // 1-1. 삭제 결과 검증 (실제로 삭제되었는지 확인)
      console.log('🔍 삭제 결과 검증 시작');
      const stillExistingFiles = [];
      for (const filePath of existingFiles) {
        try {
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(filePath);
          
          const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
          if (response.ok) {
            stillExistingFiles.push(filePath);
            console.log('⚠️ 파일이 여전히 존재:', filePath);
          } else {
            console.log('✅ 파일 삭제 확인:', filePath);
          }
        } catch (error) {
          console.log('✅ 파일 삭제 확인 (접근 불가):', filePath);
        }
      }

      if (stillExistingFiles.length > 0) {
        console.warn('⚠️ 일부 파일이 삭제되지 않음:', stillExistingFiles);
      }

      // 2. image_metadata 테이블에서 메타데이터 삭제 (개선된 로직)
      let metadataDeletedCount = 0;
      for (const fileName of existingFiles) {
        console.log('🗑️ 메타데이터 삭제 시도:', fileName);
        
        // 방법 1: 정확한 file_name 매칭
        const { error: nameError } = await supabase
          .from('image_metadata')
          .delete()
          .eq('file_name', fileName);

        if (nameError) {
          console.warn('⚠️ file_name 매칭 삭제 실패:', fileName, nameError);
        } else {
          metadataDeletedCount++;
          console.log('✅ file_name 매칭 삭제 성공:', fileName);
          continue;
        }

        // 방법 2: LIKE 연산자로 부분 매칭
        const { error: likeError } = await supabase
          .from('image_metadata')
          .delete()
          .like('file_name', `%${fileName}%`);

        if (likeError) {
          console.warn('⚠️ LIKE 매칭 삭제 실패:', fileName, likeError);
        } else {
          metadataDeletedCount++;
          console.log('✅ LIKE 매칭 삭제 성공:', fileName);
          continue;
        }

        // 방법 3: image_url로 삭제 (URL 기반)
        try {
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(fileName);
          
          const { error: urlError } = await supabase
            .from('image_metadata')
            .delete()
            .eq('image_url', urlData.publicUrl);

          if (urlError) {
            console.warn('⚠️ URL 매칭 삭제 실패:', fileName, urlError);
          } else {
            metadataDeletedCount++;
            console.log('✅ URL 매칭 삭제 성공:', fileName);
          }
        } catch (urlError) {
          console.warn('⚠️ URL 생성 실패:', fileName, urlError);
        }
      }

      console.log('✅ 메타데이터 삭제 완료:', metadataDeletedCount, '개');
      
      // ✅ 이미지 목록 캐시 무효화 (삭제 후 목록 동기화)
      try {
        invalidateCache();
        console.log('🗑️ 이미지 목록 캐시 무효화 완료');
      } catch (cacheError) {
        console.warn('⚠️ 캐시 무효화 실패 (계속 진행):', cacheError);
      }
      
      return res.status(200).json({
        success: true,
        deletedImages: existingFiles,
        originalTargets: targets,
        deletionResult: data,
        metadataDeletedCount: metadataDeletedCount,
        // 삭제 검증 결과 추가
        deletionVerification: {
          totalAttempted: existingFiles.length,
          stillExisting: stillExistingFiles,
          actuallyDeleted: existingFiles.length - stillExistingFiles.length,
          deletionSuccess: stillExistingFiles.length === 0
        }
      });

    } else if (req.method === 'DELETE' || req.method === 'POST') {
      const { imageName } = req.body;

      if (!imageName) {
        return res.status(400).json({ 
          error: 'imageName 파라미터가 필요합니다.' 
        });
      }

      console.log('🗑️ 이미지 삭제 중:', imageName);

      // 파일명 그대로 사용 (확장자 자동 추가 제거)
      const targetWithExtension = imageName;
      console.log('🗑️ 삭제할 파일명:', targetWithExtension);

      // 파일 존재 여부 확인
      const { data: fileData, error: checkError } = await supabase.storage
        .from('blog-images')
        .list('', { search: targetWithExtension });
      
      if (checkError || !fileData || fileData.length === 0) {
        console.warn('⚠️ 파일이 존재하지 않음:', targetWithExtension);
        return res.status(404).json({
          error: '파일을 찾을 수 없습니다.',
          details: `파일 '${targetWithExtension}'이 존재하지 않습니다.`
        });
      }

      console.log('✅ 파일 존재 확인:', targetWithExtension);

      // 1. Supabase Storage에서 이미지 삭제
      const { data, error } = await supabase.storage
        .from('blog-images')
        .remove([targetWithExtension]);

      if (error) {
        console.error('❌ 이미지 삭제 에러:', error);
        return res.status(500).json({
          error: '이미지 삭제에 실패했습니다.',
          details: error.message
        });
      }

      console.log('✅ 이미지 삭제 성공:', targetWithExtension);
      console.log('✅ 삭제 결과:', data);

      // 1-1. 삭제 결과 검증 (실제로 삭제되었는지 확인)
      console.log('🔍 삭제 결과 검증 시작');
      let deletionVerified = false;
      try {
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(targetWithExtension);
        
        const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log('⚠️ 파일이 여전히 존재:', targetWithExtension);
        } else {
          deletionVerified = true;
          console.log('✅ 파일 삭제 확인:', targetWithExtension);
        }
      } catch (error) {
        deletionVerified = true;
        console.log('✅ 파일 삭제 확인 (접근 불가):', targetWithExtension);
      }

      if (!deletionVerified) {
        console.warn('⚠️ 파일 삭제 검증 실패:', targetWithExtension);
      }

      // 2. image_metadata 테이블에서 메타데이터 삭제 (개선된 로직)
      console.log('🗑️ 메타데이터 삭제 시도:', targetWithExtension);
      
      let metadataDeleted = false;
      
      // 방법 1: 정확한 file_name 매칭
      const { error: nameError } = await supabase
        .from('image_metadata')
        .delete()
        .eq('file_name', targetWithExtension);

      if (nameError) {
        console.warn('⚠️ file_name 매칭 삭제 실패:', targetWithExtension, nameError);
      } else {
        metadataDeleted = true;
        console.log('✅ file_name 매칭 삭제 성공:', targetWithExtension);
      }

      // 방법 2: LIKE 연산자로 부분 매칭 (방법 1이 실패한 경우)
      if (!metadataDeleted) {
        const { error: likeError } = await supabase
          .from('image_metadata')
          .delete()
          .like('file_name', `%${targetWithExtension}%`);

        if (likeError) {
          console.warn('⚠️ LIKE 매칭 삭제 실패:', targetWithExtension, likeError);
        } else {
          metadataDeleted = true;
          console.log('✅ LIKE 매칭 삭제 성공:', targetWithExtension);
        }
      }

      // 방법 3: image_url로 삭제 (URL 기반)
      if (!metadataDeleted) {
        try {
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(targetWithExtension);
          
          const { error: urlError } = await supabase
            .from('image_metadata')
            .delete()
            .eq('image_url', urlData.publicUrl);

          if (urlError) {
            console.warn('⚠️ URL 매칭 삭제 실패:', targetWithExtension, urlError);
          } else {
            metadataDeleted = true;
            console.log('✅ URL 매칭 삭제 성공:', targetWithExtension);
          }
        } catch (urlError) {
          console.warn('⚠️ URL 생성 실패:', targetWithExtension, urlError);
        }
      }

      if (!metadataDeleted) {
        console.warn('⚠️ 모든 메타데이터 삭제 방법 실패:', targetWithExtension);
      }
      
      // ✅ 제품의 detail_images, composition_images, gallery_images에서도 제거
      let productSyncResult = null;
      try {
        const { removeImageFromProduct } = await import('../../../lib/product-image-sync');
        // 전체 경로 구성 (imageName이 전체 경로일 수도 있고 파일명만일 수도 있음)
        const fullImagePath = imageName.startsWith('originals/products/') 
          ? imageName 
          : `originals/products/${imageName}`;
        
        const syncSuccess = await removeImageFromProduct(fullImagePath);
        if (syncSuccess) {
          productSyncResult = { synced: true };
          console.log('✅ 제품 이미지 배열에서도 제거 완료');
        }
      } catch (syncError) {
        console.warn('⚠️ 제품 이미지 동기화 실패 (계속 진행):', syncError);
        productSyncResult = { synced: false, error: syncError.message };
      }
      
      // ✅ 이미지 목록 캐시 무효화 (삭제 후 목록 동기화)
      try {
        invalidateCache();
        console.log('🗑️ 이미지 목록 캐시 무효화 완료');
      } catch (cacheError) {
        console.warn('⚠️ 캐시 무효화 실패 (계속 진행):', cacheError);
      }
      
      return res.status(200).json({
        success: true,
        message: '이미지가 성공적으로 삭제되었습니다.',
        deletedImage: targetWithExtension,
        originalName: imageName,
        deletionVerified: deletionVerified,
        metadataDeleted: metadataDeleted,
        productSync: productSyncResult,
        // 삭제 검증 결과 추가
        deletionVerification: {
          fileDeleted: deletionVerified,
          metadataDeleted: metadataDeleted,
          productSynced: productSyncResult?.synced || false,
          overallSuccess: deletionVerified && metadataDeleted
        }
      });

    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }

  } catch (error) {
    console.error('❌ 이미지 삭제 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
