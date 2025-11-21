// 폴더 목록 조회 API (최적화: 메타데이터 기반 + 캐싱)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 🔧 폴더 목록 캐싱 (5분간 유효)
let foldersCache = null;
let foldersCacheTimestamp = 0;
const FOLDERS_CACHE_DURATION = 5 * 60 * 1000; // 5분

// 캐시 무효화 함수 (외부에서 호출 가능)
export function invalidateFoldersCache() {
  foldersCache = null;
  foldersCacheTimestamp = 0;
  console.log('🗑️ 폴더 목록 캐시 무효화 완료');
}

// 폴백: Storage에서 직접 조회 (재귀적, 하위 경로 포함)
async function getFoldersFromStorage() {
  const folders = new Set();
  
  // 🔧 재귀적으로 모든 폴더 조회 (하위 경로 포함)
  const getAllFolders = async (prefix = '') => {
    const { data: files, error } = await supabase.storage
      .from('blog-images')
      .list(prefix, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error(`❌ 폴더 조회 에러 (${prefix}):`, error);
      return;
    }

    if (!files) return;

    for (const file of files) {
      if (!file.id) {
        // 폴더인 경우
        const folderPath = prefix ? `${prefix}/${file.name}` : file.name;
        folders.add(folderPath);
        // 재귀적으로 하위 폴더 조회
        await getAllFolders(folderPath);
      }
    }
  };

  await getAllFolders('');
  return Array.from(folders).sort();
}

export default async function handler(req, res) {
  const startTime = Date.now();
  console.log('🔍 폴더 목록 조회 API 요청:', req.method, req.url);
  
  // ✅ 타임아웃 방지: 55초 제한 (60초 설정 고려하여 여유 있게)
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('요청 시간 초과 (55초 제한)')), 55000);
  });
  
  try {
    // ✅ 타임아웃과 함께 실행
    await Promise.race([
      (async () => {
        if (req.method === 'GET') {
      // 🔧 캐시 확인
      const now = Date.now();
      if (foldersCache && (now - foldersCacheTimestamp) < FOLDERS_CACHE_DURATION) {
        const cacheTime = ((now - foldersCacheTimestamp) / 1000).toFixed(1);
        console.log(`✅ 폴더 목록 캐시 사용: ${foldersCache.length}개 (${cacheTime}초 전 캐시)`);
        return res.status(200).json({ 
          folders: foldersCache,
          count: foldersCache.length,
          cached: true
        });
      }

      // 🔧 최적화: 이미지 메타데이터에서 폴더 경로 추출 (더 빠름)
      const { data: images, error } = await supabase
        .from('image_metadata')
        .select('folder_path')
        .not('folder_path', 'is', null)
        .neq('folder_path', '');

      if (error) {
        console.error('❌ 메타데이터 조회 에러:', error);
        // 폴백: Storage에서 직접 조회
        console.log('🔄 Storage에서 직접 조회로 전환...');
        const folderList = await getFoldersFromStorage();
        
        // 캐시 저장
        foldersCache = folderList;
        foldersCacheTimestamp = now;
        
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ 폴더 목록 조회 완료 (Storage): ${folderList.length}개 (${elapsed}초)`);
        
        return res.status(200).json({ 
          folders: folderList,
          count: folderList.length,
          cached: false
        });
      }

      // 폴더 경로 추출 및 정규화 (하위 경로도 포함)
      const folders = new Set();
      if (images && images.length > 0) {
        images.forEach(img => {
          if (img.folder_path) {
            // 하위 경로도 포함 (예: originals/blog/2025-11 → originals, originals/blog, originals/blog/2025-11)
            const parts = img.folder_path.split('/').filter(Boolean);
            let currentPath = '';
            parts.forEach(part => {
              currentPath = currentPath ? `${currentPath}/${part}` : part;
              folders.add(currentPath);
            });
          }
        });
      }

      // 🔧 메타데이터 폴더와 Storage 폴더 병합 (항상 Storage에서도 조회하여 누락 방지)
      const folderList = Array.from(folders).sort();
      console.log(`📋 메타데이터에서 추출한 폴더: ${folderList.length}개`);
      
      // Storage에서 직접 조회하여 모든 폴더 확보
      console.log('🔄 Storage에서 직접 조회 중...');
      const storageFolders = await getFoldersFromStorage();
      console.log(`📋 Storage에서 추출한 폴더: ${storageFolders.length}개`);
      
      // Storage에서 가져온 폴더와 메타데이터 폴더 병합
      storageFolders.forEach(folder => folders.add(folder));
      const mergedFolderList = Array.from(folders).sort();
      
      // 🔧 캐시 저장
      foldersCache = mergedFolderList;
      foldersCacheTimestamp = now;
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ 폴더 목록 조회 완료 (메타데이터 + Storage 병합): ${mergedFolderList.length}개 (${elapsed}초)`);

      return res.status(200).json({ 
        folders: mergedFolderList,
        count: mergedFolderList.length,
        cached: false
      });
    } else {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
      })(),
      timeoutPromise
    ]);
    
  } catch (error) {
    console.error('❌ 폴더 목록 조회 오류:', error);
    
    // ✅ 타임아웃 오류 구분
    if (error.message && (error.message.includes('시간 초과') || error.message.includes('초과'))) {
      return res.status(504).json({
        error: '요청 시간 초과',
        details: '폴더 목록 조회가 너무 오래 걸려 시간 초과되었습니다.',
        suggestion: '캐시가 생성될 때까지 잠시 후 다시 시도해주세요.'
      });
    }
    
    return res.status(500).json({ 
      error: '폴더 목록을 불러올 수 없습니다.', 
      details: error.message 
    });
  }
}

