import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 직접 값 사용 (테스트용)
    const supabaseUrl = 'https://yyytjudftrvpmcnppaymw.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 간단한 테스트 쿼리
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);

    if (error) {
      return res.status(200).json({ 
        success: false,
        message: 'DB 연결 실패',
        error: error.message,
        hint: error.hint
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'DB 연결 성공!',
      tableAccess: 'bookings 테이블 접근 가능',
      data
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Test failed',
      message: error.message
    });
  }
}