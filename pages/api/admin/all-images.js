// 전체 이미지 조회 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전체 개수 캐싱 (10분간 유효)
let totalCountCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10분

// 이미지 목록 캐싱 (5분간 유효)
let imagesCache = new Map();
let imagesCacheTimestamp = 0;
const IMAGES_CACHE_DURATION = 5 * 60 * 1000; // 5분

export default async function handler(req, res) {
  console.log('🔍 전체 이미지 조회 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      const { limit = 1000, offset = 0, page = 1, prefix = '', includeChildren = 'true' } = req.query;
      const pageSize = parseInt(limit);
      const currentPage = parseInt(page);
      const currentOffset = parseInt(offset) || (currentPage - 1) * pageSize;
      
      console.log('📝 전체 이미지 목록 조회 중...', { limit: pageSize, offset: currentOffset, page: currentPage });
      
      // 전체 개수 조회 (캐싱 적용) - 폴더 포함
      let totalCount = totalCountCache;
      const now = Date.now();
      
      if (!totalCountCache || (now - cacheTimestamp) > CACHE_DURATION) {
        console.log('📊 전체 이미지 개수 조회 중 (폴더 포함)...');
        let allFiles = [];
        
        // 재귀적으로 모든 폴더의 이미지 조회
      const getAllImagesRecursively = async (folderPath = '') => {
          console.log(`📁 폴더 조회 중: ${folderPath || '루트'}`);
          
          const { data: files, error } = await supabase.storage
            .from('blog-images')
            .list(folderPath, {
              sortBy: { column: 'created_at', order: 'desc' }
            });

          if (error) {
            console.error(`❌ 폴더 조회 에러 (${folderPath}):`, error);
            return;
          }

          if (!files) return;

          for (const file of files) {
            if (!file.id) {
              // 폴더인 경우 재귀적으로 조회
              const subFolderPath = folderPath ? `${folderPath}/${file.name}` : file.name;
              await getAllImagesRecursively(subFolderPath);
            } else {
              // 이미지 파일인 경우
              const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
              const isImage = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
              
              if (isImage) {
                allFiles.push({
                  ...file,
                  folderPath: folderPath // 폴더 경로 추가
                });
              }
            }
          }
        };

        // prefix 기반 시작 폴더만 조회(하위 포함)
        await getAllImagesRecursively(prefix || '');
        
        totalCount = allFiles.length;
        totalCountCache = totalCount;
        cacheTimestamp = now;
        console.log('✅ 전체 이미지 개수 조회 완료 (폴더 포함):', totalCount, '개');
      } else {
        console.log('📊 캐시된 전체 이미지 개수 사용:', totalCount, '개');
      }
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // 캐시된 이미지 목록 확인
      const cacheKey = `${prefix || 'root'}_${includeChildren}`;
      const currentTime = Date.now();
      let allFilesForPagination = [];
      
      if (imagesCache.has(cacheKey) && (currentTime - imagesCacheTimestamp) < IMAGES_CACHE_DURATION) {
        console.log('📊 캐시된 이미지 목록 사용:', cacheKey);
        allFilesForPagination = imagesCache.get(cacheKey);
      } else {
        console.log('📊 이미지 목록 새로 조회:', cacheKey);
        
        // 재귀적으로 모든 폴더의 이미지 조회 (페이지네이션용)
        const getAllImagesForPagination = async (folderPath = '') => {
          const { data: files, error } = await supabase.storage
            .from('blog-images')
            .list(folderPath, {
              sortBy: { column: 'created_at', order: 'desc' }
            });

          if (error) {
            console.error(`❌ 폴더 조회 에러 (${folderPath}):`, error);
            return;
          }

          if (!files) return;

          for (const file of files) {
            if (!file.id) {
              // 폴더인 경우 재귀적으로 조회
              const subFolderPath = folderPath ? `${folderPath}/${file.name}` : file.name;
              await getAllImagesForPagination(subFolderPath);
            } else {
              // 이미지 파일인 경우
              const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
              const isImage = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
              
              if (isImage) {
                allFilesForPagination.push({
                  ...file,
                  folderPath: folderPath // 폴더 경로 추가
                });
              }
            }
          }
        };

        // includeChildren 파라미터 처리 (boolean 또는 문자열 모두 지원)
        const shouldIncludeChildren = includeChildren === 'true' || includeChildren === true || includeChildren === '1';
        if (shouldIncludeChildren) {
          await getAllImagesForPagination(prefix || '');
        } else {
          // 현재 폴더만(하위 미포함)
          const { data: files, error } = await supabase.storage
            .from('blog-images')
            .list(prefix || '', { sortBy: { column: 'created_at', order: 'desc' } });
          if (!error && files) {
            for (const file of files) {
              if (file.id) {
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
                const isImage = imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
                if (isImage) {
                  allFilesForPagination.push({ ...file, folderPath: prefix || '' });
                }
              }
            }
          }
        }
        
        // 생성일 기준으로 정렬
        allFilesForPagination.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // 캐시에 저장
        imagesCache.set(cacheKey, allFilesForPagination);
        imagesCacheTimestamp = currentTime;
        console.log('✅ 이미지 목록 캐시 저장:', allFilesForPagination.length, '개');
      }
      
      // 페이지네이션 적용
      const imageFiles = allFilesForPagination.slice(currentOffset, currentOffset + pageSize);
      
      console.log(`📁 폴더 포함 조회: 총 ${allFilesForPagination.length}개 → 페이지 ${imageFiles.length}개 이미지 파일`);

      // 이미지 URL 생성 및 메타데이터 일괄 조회
      const imageUrls = imageFiles.map(file => {
        const fullPath = file.folderPath ? `${file.folderPath}/${file.name}` : file.name;
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fullPath);
        return {
          file,
          url: urlData.publicUrl,
          fullPath
        };
      });

      // 모든 URL을 한 번에 조회하여 메타데이터 가져오기
      // 주의: image_metadata 테이블 스키마에 맞춰 컬럼 조회
      const urls = imageUrls.map(item => item.url);
      const { data: allMetadata } = await supabase
        .from('image_metadata')
        .select('id, alt_text, title, description, tags, category_id, image_url, usage_count, upload_source, status')
        .in('image_url', urls);

      // 메타데이터를 URL 기준으로 매핑
      const metadataMap = new Map();
      if (allMetadata) {
        allMetadata.forEach(meta => {
          metadataMap.set(meta.image_url, meta);
        });
      }

      // 이미지 데이터 생성
      const imagesWithUrl = imageUrls.map(({ file, url, fullPath }) => {
        const metadata = metadataMap.get(url);
        
        return {
          id: file.id,
          name: file.name,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          updated_at: file.updated_at,
          url: url,
          folder_path: file.folderPath || '',
          alt_text: metadata?.alt_text || '',
          title: metadata?.title || '',
          description: metadata?.description || '',
          keywords: Array.isArray(metadata?.tags) ? metadata.tags : (metadata?.tags ? [metadata.tags] : []),
          category: metadata?.category_id || '',
          usage_count: metadata?.usage_count || 0,
          upload_source: metadata?.upload_source || 'manual',
          status: metadata?.status || 'active'
        };
      });

      console.log('✅ 전체 이미지 조회 성공:', imagesWithUrl.length, '개 (총', totalCount, '개 중)');
      return res.status(200).json({ 
        images: imagesWithUrl,
        count: imagesWithUrl.length,
        total: totalCount,
        pagination: {
          currentPage,
          totalPages,
          pageSize,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
          nextPage: currentPage < totalPages ? currentPage + 1 : null,
          prevPage: currentPage > 1 ? currentPage - 1 : null
        }
      });
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
    
  } catch (error) {
    console.error('❌ 전체 이미지 조회 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
