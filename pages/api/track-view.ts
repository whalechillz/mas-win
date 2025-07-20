import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { campaign_id, page } = req.body;

    if (!campaign_id || !page) {
      return res.status(400).json({ error: '필수 필드가 누락되었습니다' });
    }

    // 조회수 기록 저장
    const { error: insertError } = await supabase
      .from('page_views')
      .insert({
        campaign_id,
        page_url: page,
        user_agent: req.headers['user-agent'] || '',
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || '',
        viewed_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('조회수 기록 실패:', insertError);
      // 테이블이 없는 경우를 대비해 캠페인 테이블 직접 업데이트
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ 
          views: supabase.raw('views + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', campaign_id);

      if (updateError) {
        console.error('캠페인 조회수 업데이트 실패:', updateError);
      }
    }

    // 캠페인 조회수 증가
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ 
        views: supabase.raw('views + 1'),
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign_id);

    if (updateError) {
      console.error('캠페인 조회수 업데이트 실패:', updateError);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('조회수 추적 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}
