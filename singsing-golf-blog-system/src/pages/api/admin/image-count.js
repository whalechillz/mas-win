// 이미지 개수 조회 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('🔍 이미지 개수 조회 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      console.log('📊 정확한 이미지 개수 조회 중...');
      
      let totalCount = 0;
      let offset = 0;
      const batchSize = 1000;
      let batchNumber = 1;
      
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
            error: '이미지 개수를 조회할 수 없습니다.',
            details: batchError.message
          });
        }

        if (!batchFiles || batchFiles.length === 0) {
          break; // 더 이상 파일이 없음
        }

        totalCount += batchFiles.length;
        offset += batchSize;
        
        console.log(`📦 배치 ${batchNumber}: ${batchFiles.length}개 (누적: ${totalCount}개)`);
        batchNumber++;

        // 배치 크기보다 적게 반환되면 마지막 배치
        if (batchFiles.length < batchSize) {
          break;
        }
      }
      
      console.log('✅ 정확한 이미지 개수 조회 완료:', totalCount, '개');
      
      return res.status(200).json({ 
        totalCount,
        message: `총 ${totalCount}개의 이미지가 있습니다.`,
        timestamp: new Date().toISOString()
      });
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
    
  } catch (error) {
    console.error('❌ 이미지 개수 조회 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
