// 제품 이미지 삭제 API
// Supabase Storage에서 이미지 파일을 삭제합니다

import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: '이미지 URL이 필요합니다.' });
    }

    const supabase = createServerSupabase();

    // URL에서 파일 경로 추출
    let filePath = null;

    // 1. 전체 Supabase URL인 경우
    // 예: https://xxx.supabase.co/storage/v1/object/public/blog-images/originals/goods/xxx.webp
    const urlMatch = imageUrl.match(/\/blog-images\/(.+?)(?:\?|$)/);
    if (urlMatch) {
      filePath = decodeURIComponent(urlMatch[1]);
    } 
    // 2. 상대 경로인 경우 (예: /originals/products/... 또는 originals/products/...)
    else if (imageUrl.startsWith('/originals/') || imageUrl.startsWith('originals/')) {
      filePath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    }
    // 3. 기타 상대 경로 (예: /main/products/...)
    else if (imageUrl.startsWith('/') || !imageUrl.includes('://')) {
      // /main/products/... 경로를 originals/...로 변환 시도
      let normalizedPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
      
      // /main/products/... → originals/products/...
      if (normalizedPath.startsWith('main/products/')) {
        normalizedPath = normalizedPath.replace('main/products/', 'originals/products/');
      }
      // /main/products/goods/... → originals/goods/...
      else if (normalizedPath.startsWith('main/products/goods/')) {
        normalizedPath = normalizedPath.replace('main/products/goods/', 'originals/goods/');
      }
      
      filePath = normalizedPath;
    }

    if (!filePath) {
      console.warn('⚠️ 이미지 경로 추출 실패:', imageUrl);
      // 이미 삭제된 파일로 간주하고 성공 처리
      return res.status(200).json({ 
        success: true, 
        message: '이미지가 이미 삭제되었거나 경로를 찾을 수 없습니다.',
        deletedPath: null,
        skipped: true
      });
    }

    console.log('🗑️ 이미지 삭제 시도:', filePath);

    // Supabase Storage에서 파일 삭제
    const { error: deleteError } = await supabase.storage
      .from('blog-images')
      .remove([filePath]);

    if (deleteError) {
      // 파일이 이미 없는 경우 (404 또는 ObjectNotFound) 성공으로 처리
      if (deleteError.message?.includes('not found') || 
          deleteError.message?.includes('does not exist') ||
          deleteError.statusCode === '404') {
        console.log('ℹ️ 이미지가 이미 삭제되어 있음:', filePath);
        return res.status(200).json({ 
          success: true, 
          message: '이미지가 이미 삭제되었습니다.',
          deletedPath: filePath,
          alreadyDeleted: true
        });
      }
      
      console.error('❌ 이미지 삭제 오류:', deleteError);
      return res.status(500).json({ 
        error: '이미지 삭제에 실패했습니다.',
        details: deleteError.message 
      });
    }

    console.log('✅ 이미지 삭제 성공:', filePath);

    return res.status(200).json({ 
      success: true, 
      message: '이미지가 성공적으로 삭제되었습니다.',
      deletedPath: filePath
    });

  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    return res.status(500).json({ 
      error: '이미지 삭제에 실패했습니다.',
      details: error.message 
    });
  }
}

