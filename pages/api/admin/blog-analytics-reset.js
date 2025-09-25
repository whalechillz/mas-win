import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('🔄 블로그 분석 리셋 API 요청:', req.method, req.url);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
    return res.status(500).json({ error: '서버 설정 오류' });
  }

  try {
    const { action, excludeInternal = false } = req.body;
    
    if (action === 'reset') {
      // 모든 블로그 분석 데이터 삭제
      const { error: deleteError } = await supabase
        .from('blog_analytics')
        .delete()
        .neq('id', 0); // 모든 데이터 삭제

      if (deleteError) {
        console.error('❌ 데이터 삭제 에러:', deleteError);
        return res.status(500).json({ error: '데이터 삭제에 실패했습니다.' });
      }

      console.log('✅ 모든 블로그 분석 데이터가 삭제되었습니다');
      return res.status(200).json({ 
        success: true, 
        message: '모든 블로그 분석 데이터가 삭제되었습니다.' 
      });
    }

    if (action === 'exclude_internal') {
      // 내부 카운터 제외 (test, localhost, 127.0.0.1 등)
      const { error: deleteError } = await supabase
        .from('blog_analytics')
        .delete()
        .or('traffic_source.eq.test,ip_address.eq.127.0.0.1,user_agent.like.%localhost%');

      if (deleteError) {
        console.error('❌ 내부 카운터 삭제 에러:', deleteError);
        return res.status(500).json({ error: '내부 카운터 삭제에 실패했습니다.' });
      }

      console.log('✅ 내부 카운터가 제외되었습니다');
      return res.status(200).json({ 
        success: true, 
        message: '내부 카운터가 제외되었습니다.' 
      });
    }

    return res.status(400).json({ error: '잘못된 액션입니다.' });

  } catch (error) {
    console.error('❌ 블로그 분석 리셋 API 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.', details: error.message });
  }
}
