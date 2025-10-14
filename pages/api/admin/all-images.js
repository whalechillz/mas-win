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
      
      // image_metadata 테이블에서 전체 개수 조회
      let totalCount = totalCountCache;
      const now = Date.now();
      
      if (!totalCountCache || (now - cacheTimestamp) > CACHE_DURATION) {
        console.log('📊 image_metadata 테이블에서 전체 이미지 개수 조회 중...');
        const { count, error: countError } = await supabase
          .from('image_metadata')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.error('❌ 개수 조회 에러:', countError);
          return res.status(500).json({
            error: '이미지 개수를 불러올 수 없습니다.',
            details: countError.message
          });
        }
        
        totalCount = count || 0;
        totalCountCache = totalCount;
        cacheTimestamp = now;
        console.log('✅ 전체 이미지 개수 조회 완료:', totalCount, '개');
      } else {
        console.log('📊 캐시된 전체 이미지 개수 사용:', totalCount, '개');
      }
      
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // image_metadata 테이블에서 페이지네이션된 이미지 조회
      const { data: metadata, error } = await supabase
        .from('image_metadata')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + pageSize - 1);

      if (error) {
        console.error('❌ 메타데이터 조회 에러:', error);
        return res.status(500).json({
          error: '이미지 목록을 불러올 수 없습니다.',
          details: error.message
        });
      }

      // 메타데이터를 갤러리 형식으로 변환
      const imagesWithUrl = (metadata || []).map(item => ({
        id: item.id,
        name: item.file_name || item.image_url?.split('/').pop() || 'unknown',
        size: item.file_size || 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
        url: item.image_url,
        is_featured: item.is_featured || false,
        // 추가 메타데이터
        alt_text: item.alt_text,
        title: item.title,
        description: item.excerpt,
        content_type: item.content_type,
        brand_strategy: item.brand_strategy,
        usage_count: item.usage_count || 0
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
