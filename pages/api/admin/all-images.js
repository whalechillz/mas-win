// 전체 이미지 조회 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전체 개수 캐싱 (5분간 유효)
let totalCountCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export default async function handler(req, res) {
  console.log('🔍 전체 이미지 조회 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      const { limit = 1000, offset = 0, page = 1 } = req.query;
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

        await getAllImagesRecursively();
        
        totalCount = allFiles.length;
        totalCountCache = totalCount;
        cacheTimestamp = now;
        console.log('✅ 전체 이미지 개수 조회 완료 (폴더 포함):', totalCount, '개');
      } else {
        console.log('📊 캐시된 전체 이미지 개수 사용:', totalCount, '개');
      }
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // 페이지네이션된 이미지 조회 (폴더 포함)
      let allFilesForPagination = [];
      
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

      await getAllImagesForPagination();
      
      // 생성일 기준으로 정렬
      allFilesForPagination.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // 페이지네이션 적용
      const imageFiles = allFilesForPagination.slice(currentOffset, currentOffset + pageSize);
      
      console.log(`📁 폴더 포함 조회: 총 ${allFilesForPagination.length}개 → 페이지 ${imageFiles.length}개 이미지 파일`);

      // 이미지 URL 생성 및 메타데이터 조회
      const imagesWithUrl = await Promise.all(imageFiles.map(async (file) => {
        // 폴더 경로를 포함한 전체 경로로 URL 생성
        const fullPath = file.folderPath ? `${file.folderPath}/${file.name}` : file.name;
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fullPath);
        
        // image_metadata 테이블에서 추가 정보 조회
        const { data: metadata } = await supabase
          .from('image_metadata')
          .select('*')
          .eq('image_url', urlData.publicUrl)
          .single();
        
        return {
          id: file.id,
          name: file.name,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          updated_at: file.updated_at,
          url: urlData.publicUrl,
          folder_path: file.folderPath || '', // 폴더 경로 추가
          is_featured: metadata?.is_featured || false,
          // 메타데이터가 있으면 추가 정보 포함
          alt_text: metadata?.alt_text || '',
          title: metadata?.title || '',
          description: metadata?.excerpt || '',
          content_type: metadata?.content_type || '',
          brand_strategy: metadata?.brand_strategy || '',
          usage_count: metadata?.usage_count || 0
        };
      }));

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
