// Supabase 연결 테스트 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  try {
    // 환경 변수 확인
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ 
        error: '환경 변수가 설정되지 않았습니다.',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      });
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 스토리지 버킷 목록 조회
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      return res.status(500).json({ 
        error: 'Supabase 연결 실패',
        details: error.message
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Supabase 연결 성공',
      buckets: buckets.map(bucket => bucket.name)
    });

  } catch (error) {
    console.error('API 오류:', error);
    res.status(500).json({ 
      error: '서버 오류',
      details: error.message
    });
  }
}
