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
      
      // 전체 개수 조회 (캐싱 적용)
      let totalCount = totalCountCache;
      const now = Date.now();
      
      if (!totalCountCache || (now - cacheTimestamp) > CACHE_DURATION) {
        console.log('📊 전체 이미지 개수 조회 중...');
        let allFiles = [];
        let offset = 0;
        const batchSize = 1000;
        
        while (true) {
          const { data: batchFiles, error: batchError } = await supabase.storage
            .from('blog-images')
            .list('', {
              limit: batchSize,
              offset: offset,
              sortBy: { column: 'created_at', order: 'desc' }
            });

          if (batchError) {
            console.error('❌ 배치 조회 에러:', batchError);
            return res.status(500).json({
              error: '이미지 목록을 불러올 수 없습니다.',
              details: batchError.message
            });
          }

          if (!batchFiles || batchFiles.length === 0) {
            break; // 더 이상 파일이 없음
          }

          // 이미지 파일만 필터링 (폴더 제외)
          const imageFiles = batchFiles.filter(file => {
            if (!file.id) return false; // id가 null인 폴더만 제외
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
            return imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
          });

          allFiles = allFiles.concat(imageFiles);
          offset += batchSize;

          // 배치 크기보다 적게 반환되면 마지막 배치
          if (batchFiles.length < batchSize) {
            break;
          }
        }
        
        totalCount = allFiles.length;
        totalCountCache = totalCount;
        cacheTimestamp = now;
        console.log('✅ 전체 이미지 개수 조회 완료:', totalCount, '개');
      } else {
        console.log('📊 캐시된 전체 이미지 개수 사용:', totalCount, '개');
      }
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // 페이지네이션된 이미지 조회
      const { data: files, error } = await supabase.storage
        .from('blog-images')
        .list('', {
          limit: pageSize,
          offset: currentOffset,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('❌ 스토리지 조회 에러:', error);
        return res.status(500).json({
          error: '이미지 목록을 불러올 수 없습니다.',
          details: error.message
        });
      }

      // 이미지 파일만 필터링 (폴더 제외) - 디버깅용 완화
      console.log(`📁 원본 파일 목록:`, files.map(f => ({ name: f.name, id: f.id, size: f.size })));
      
      const imageFiles = files.filter(file => {
        // 폴더는 제외 (id가 null인 경우만)
        if (!file.id) {
          console.log(`📁 폴더 제외:`, file.name, 'id:', file.id);
          return false;
        }
        // 이미지 확장자만 허용
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const hasImageExtension = imageExtensions.some(ext => 
          file.name.toLowerCase().endsWith(ext)
        );
        if (!hasImageExtension) {
          console.log(`📁 확장자 제외:`, file.name);
        }
        return hasImageExtension;
      });

      console.log(`📁 폴더 제외: ${files.length}개 → ${imageFiles.length}개 이미지 파일`);

      // 이미지 URL 생성 및 메타데이터 조회
      const imagesWithUrl = await Promise.all(imageFiles.map(async (file) => {
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(file.name);
        
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
