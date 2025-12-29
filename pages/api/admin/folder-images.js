/**
 * 폴더 이미지 조회 API (빠른 버전)
 * Storage에서 직접 조회만 수행 (메타데이터 조회 생략)
 * GET /api/admin/folder-images?folder={folderPath}
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { folder } = req.query;

    if (!folder || typeof folder !== 'string') {
      return res.status(400).json({ error: 'folder 파라미터가 필요합니다.' });
    }

    const folderPath = folder.trim();

    console.log(`📁 [folder-images] 폴더 이미지 조회 시작: "${folderPath}"`);

    // Storage에서 직접 조회만 수행 (빠름)
    let allFiles = [];
    let offset = 0;
    const batchSize = 1000;

    while (true) {
      const { data: files, error } = await supabase.storage
        .from('blog-images')
        .list(folderPath, {
          limit: batchSize,
          offset: offset,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error(`❌ 폴더 조회 에러 (${folderPath}, offset: ${offset}):`, error);
        // 폴더가 없을 수도 있으므로 빈 배열 반환
        if (error.message && error.message.includes('not found')) {
          return res.status(200).json({ images: [] });
        }
        throw error;
      }

      if (!files || files.length === 0) {
        break; // 더 이상 파일이 없음
      }

      // 이미지 파일만 필터링
      const imageFiles = files.filter(file => {
        if (!file.id) return false; // 폴더 제외

        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const isImage = imageExtensions.some(ext => 
          file.name.toLowerCase().endsWith(ext)
        );

        // .keep.png 마커 파일 제외
        const isKeepFile = file.name.toLowerCase() === '.keep.png';

        return isImage && !isKeepFile;
      });

      allFiles = allFiles.concat(imageFiles);
      offset += batchSize;

      // 마지막 배치면 종료
      if (files.length < batchSize) {
        break;
      }
    }

    // URL 생성 및 응답 데이터 구성
    const images = allFiles.map(file => {
      const filePath = `${folderPath}/${file.name}`;
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      return {
        name: file.name,
        url: publicUrl,
        size: file.metadata?.size || 0,
        created_at: file.created_at || new Date().toISOString()
      };
    });

    console.log(`✅ [folder-images] 폴더 이미지 조회 완료: "${folderPath}" - ${images.length}개 이미지`);

    return res.status(200).json({
      images,
      count: images.length,
      folder: folderPath
    });

  } catch (error) {
    console.error('❌ 폴더 이미지 조회 오류:', error);
    return res.status(500).json({
      error: '이미지 조회 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

