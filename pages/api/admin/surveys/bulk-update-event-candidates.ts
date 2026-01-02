import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 선물을 받은 고객들의 설문 ID 조회 (지급 완료된 선물만)
    const { data: gifts, error: giftsError } = await supabase
      .from('customer_gifts')
      .select('survey_id')
      .eq('delivery_status', 'sent')
      .not('survey_id', 'is', null);

    if (giftsError) {
      console.error('[admin/surveys/bulk-update-event-candidates] 선물 조회 오류:', giftsError);
      return res.status(500).json({
        success: false,
        message: '선물 기록 조회에 실패했습니다.',
      });
    }

    // 고유한 survey_id 추출
    const surveyIds = [...new Set(gifts?.map((g) => g.survey_id).filter(Boolean) || [])];

    if (surveyIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: '업데이트할 설문이 없습니다.',
        updatedCount: 0,
      });
    }

    // 해당 설문들의 gift_delivered를 true로 업데이트 (이벤트 응모 대상이 아닌 선물 지급 완료)
    const { data: updatedSurveys, error: updateError } = await supabase
      .from('surveys')
      .update({ gift_delivered: true })
      .in('id', surveyIds)
      .select('id');

    if (updateError) {
      console.error('[admin/surveys/bulk-update-event-candidates] 업데이트 오류:', updateError);
      return res.status(500).json({
        success: false,
        message: '설문 업데이트에 실패했습니다.',
      });
    }

    return res.status(200).json({
      success: true,
      message: '일괄 업데이트가 완료되었습니다.',
      updatedCount: updatedSurveys?.length || 0,
      surveyIds: surveyIds,
    });
  } catch (error: any) {
    console.error('[admin/surveys/bulk-update-event-candidates] 오류:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.',
    });
  }
}

