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
    const { folder, includeChildren = 'true' } = req.query;

    if (!folder || typeof folder !== 'string') {
      return res.status(400).json({ error: 'folder 파라미터가 필요합니다.' });
    }

    const folderPath = folder.trim();
    const shouldIncludeChildren = includeChildren === 'true' || includeChildren === true;

    console.log(`📁 [folder-images] 폴더 이미지 조회 시작: "${folderPath}" (하위 폴더 포함: ${shouldIncludeChildren})`);

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.heic', '.heif'];
    const videoExtensions = ['.mp4', '.avi', '.mov', '.webm', '.mkv', '.flv', '.m4v', '.3gp', '.wmv'];
    const mediaExtensions = [...imageExtensions, ...videoExtensions];

    // Storage에서 직접 조회
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

      // 이미지 및 동영상 파일 필터링
      const mediaFiles = files.filter(file => {
        if (!file.id) return false; // 폴더 제외

        const isMedia = mediaExtensions.some(ext => 
          file.name.toLowerCase().endsWith(ext)
        );

        // .keep.png 마커 파일 제외
        const isKeepFile = file.name.toLowerCase() === '.keep.png';

        return isMedia && !isKeepFile;
      });

      allFiles = allFiles.concat(mediaFiles);
      
      // 하위 폴더 목록 수집 (includeChildren이 true인 경우)
      const subFolders = shouldIncludeChildren ? files.filter(file => !file.id) : [];
      
      // 하위 폴더의 이미지도 조회
      if (subFolders.length > 0) {
        for (const subFolder of subFolders) {
          const subFolderPath = `${folderPath}/${subFolder.name}`;
          const { data: subFiles } = await supabase.storage
            .from('blog-images')
            .list(subFolderPath, {
              limit: 1000,
              sortBy: { column: 'created_at', order: 'desc' }
            });
          
          if (subFiles && subFiles.length > 0) {
            const subMediaFiles = subFiles.filter(file => {
              if (!file.id) return false;
              const isMedia = mediaExtensions.some(ext => 
                file.name.toLowerCase().endsWith(ext)
              );
              return isMedia && file.name.toLowerCase() !== '.keep.png';
            });
            
            // 하위 폴더의 파일도 추가
            subMediaFiles.forEach(file => {
              allFiles.push({
                ...file,
                _subFolder: subFolder.name // 하위 폴더 정보 저장
              });
            });
          }
        }
      }
      
      offset += batchSize;

      // 마지막 배치면 종료
      if (files.length < batchSize) {
        break;
      }
    }

    // URL 생성 및 응답 데이터 구성
    const media = allFiles.map(file => {
      const subFolder = file._subFolder || '';
      const filePath = subFolder 
        ? `${folderPath}/${subFolder}/${file.name}`
        : `${folderPath}/${file.name}`;
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      return {
        name: file.name,
        url: publicUrl,
        size: file.metadata?.size || 0,
        created_at: file.created_at || new Date().toISOString(),
        folder: subFolder || null
      };
    });

    console.log(`✅ [folder-images] 폴더 미디어 조회 완료: "${folderPath}" - ${media.length}개 파일 (하위 폴더 포함: ${shouldIncludeChildren})`);

    return res.status(200).json({
      images: media,
      count: media.length,
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

