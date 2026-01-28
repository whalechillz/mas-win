/**
 * 고객 폴더의 모든 이미지 삭제 API
 * 
 * originals/customers/customer-{id}/ 폴더의 모든 이미지와 메타데이터 삭제
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 폴더 내 모든 파일 재귀적으로 삭제
 */
async function deleteFolderRecursively(folderPath) {
  const deletedFiles = [];
  const errors = [];

  try {
    // 폴더 내 모든 파일 목록 조회
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error(`❌ 폴더 목록 조회 오류 (${folderPath}):`, listError);
      errors.push({ folder: folderPath, error: listError.message });
      return { deletedFiles, errors };
    }

    if (!files || files.length === 0) {
      console.log(`ℹ️ 폴더가 비어있음: ${folderPath}`);
      return { deletedFiles, errors };
    }

    // 파일과 하위 폴더 처리
    for (const file of files) {
      const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;

      if (file.id === null) {
        // 하위 폴더인 경우 재귀적으로 삭제
        const subResult = await deleteFolderRecursively(filePath);
        deletedFiles.push(...subResult.deletedFiles);
        errors.push(...subResult.errors);
      } else {
        // 파일인 경우 삭제
        try {
          const { error: deleteError } = await supabase.storage
            .from('blog-images')
            .remove([filePath]);

          if (deleteError) {
            console.error(`❌ 파일 삭제 오류 (${filePath}):`, deleteError);
            errors.push({ file: filePath, error: deleteError.message });
          } else {
            console.log(`✅ 파일 삭제 완료: ${filePath}`);
            deletedFiles.push(filePath);
          }
        } catch (error) {
          console.error(`❌ 파일 삭제 예외 (${filePath}):`, error);
          errors.push({ file: filePath, error: error.message });
        }
      }
    }

    return { deletedFiles, errors };
  } catch (error) {
    console.error(`❌ 폴더 삭제 예외 (${folderPath}):`, error);
    errors.push({ folder: folderPath, error: error.message });
    return { deletedFiles, errors };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { customerIds } = req.body;

  if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
    return res.status(400).json({ 
      error: 'customerIds 배열이 필요합니다.',
      example: { customerIds: ['13528', '15203'] }
    });
  }

  try {
    const results = [];

    for (const customerId of customerIds) {
      const folderPath = `originals/customers/customer-${customerId}`;
      
      console.log(`🗑️ 고객 이미지 삭제 시작: customer-${customerId} (${folderPath})`);

      // 1. Storage에서 폴더 내 모든 파일 삭제
      const { deletedFiles, errors: storageErrors } = await deleteFolderRecursively(folderPath);

      // 2. image_metadata 테이블에서 해당 고객 이미지 메타데이터 삭제
      const { error: metadataError } = await supabase
        .from('image_assets')
        .delete()
        .ilike('folder_path', `${folderPath}%`);

      if (metadataError) {
        console.error(`❌ 메타데이터 삭제 오류 (customer-${customerId}):`, metadataError);
      } else {
        console.log(`✅ 메타데이터 삭제 완료: customer-${customerId}`);
      }

      // 3. image_assets 테이블에서도 삭제 (폴더 경로 기반)
      const { data: assets, error: assetsListError } = await supabase
        .from('image_assets')
        .select('id, file_path')
        .ilike('file_path', `${folderPath}%`);

      if (!assetsListError && assets && assets.length > 0) {
        const assetIds = assets.map(asset => asset.id);
        const { error: assetsDeleteError } = await supabase
          .from('image_assets')
          .delete()
          .in('id', assetIds);

        if (assetsDeleteError) {
          console.error(`❌ image_assets 삭제 오류 (customer-${customerId}):`, assetsDeleteError);
        } else {
          console.log(`✅ image_assets 삭제 완료: customer-${customerId} (${assetIds.length}개)`);
        }
      }

      results.push({
        customerId,
        folderPath,
        deletedFilesCount: deletedFiles.length,
        deletedFiles: deletedFiles.slice(0, 10), // 처음 10개만 반환
        storageErrors: storageErrors.length > 0 ? storageErrors : null,
        metadataDeleted: !metadataError,
        assetsDeleted: !assetsListError && assets && assets.length > 0
      });
    }

    const totalDeleted = results.reduce((sum, r) => sum + r.deletedFilesCount, 0);
    const hasErrors = results.some(r => r.storageErrors);

    return res.status(200).json({
      success: true,
      message: `${customerIds.length}명의 고객 이미지 삭제 완료`,
      totalDeletedFiles: totalDeleted,
      results,
      hasErrors
    });

  } catch (error) {
    console.error('❌ 고객 이미지 삭제 오류:', error);
    return res.status(500).json({
      error: '고객 이미지 삭제 중 오류가 발생했습니다',
      details: error.message
    });
  }
}


