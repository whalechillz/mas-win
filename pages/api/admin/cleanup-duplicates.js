import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blogPostId } = req.body;

    if (!blogPostId) {
      return res.status(400).json({ error: 'blogPostId is required' });
    }

    console.log(`🧹 blog_post_id ${blogPostId}와 관련된 중복 데이터 정리 시작`);

    // 1. 먼저 어떤 데이터가 있는지 확인
    const { data: existingData, error: selectError } = await supabase
      .from('cc_content_calendar')
      .select('id, title, content_type, parent_content_id, blog_post_id, year, month, content_date, created_at')
      .or(`parent_content_id.eq.${blogPostId},blog_post_id.eq.${blogPostId}`)
      .eq('content_type', 'multichannel')
      .order('created_at', { ascending: false });

    if (selectError) {
      console.error('❌ 데이터 조회 오류:', selectError);
      return res.status(500).json({ error: '데이터 조회 실패', details: selectError.message });
    }

    console.log(`📊 발견된 멀티채널 콘텐츠: ${existingData?.length || 0}개`);
    
    if (existingData && existingData.length > 0) {
      console.log('🔍 기존 데이터:', existingData.map(d => ({ 
        id: d.id, 
        title: d.title,
        date: `${d.year}-${d.month}-${d.content_date}`,
        created_at: d.created_at
      })));

      // 2. 모든 중복 데이터 삭제
      const { error: deleteError } = await supabase
        .from('cc_content_calendar')
        .delete()
        .or(`parent_content_id.eq.${blogPostId},blog_post_id.eq.${blogPostId}`)
        .eq('content_type', 'multichannel');

      if (deleteError) {
        console.error('❌ 데이터 삭제 오류:', deleteError);
        return res.status(500).json({ error: '데이터 삭제 실패', details: deleteError.message });
      }

      console.log(`✅ ${existingData.length}개 항목 삭제 완료`);
    }

    // 3. 삭제 후 확인
    const { data: remainingData, error: remainingError } = await supabase
      .from('cc_content_calendar')
      .select('id')
      .eq('content_type', 'multichannel');

    if (remainingError) {
      console.error('❌ 남은 데이터 확인 오류:', remainingError);
    } else {
      console.log(`📊 남은 멀티채널 콘텐츠: ${remainingData?.length || 0}개`);
    }

    return res.status(200).json({
      success: true,
      message: `blog_post_id ${blogPostId}와 관련된 중복 데이터 정리 완료`,
      deletedCount: existingData?.length || 0,
      remainingCount: remainingData?.length || 0
    });

  } catch (error) {
    console.error('❌ 정리 작업 오류:', error);
    return res.status(500).json({ 
      error: '정리 작업 실패', 
      details: error.message 
    });
  }
}
