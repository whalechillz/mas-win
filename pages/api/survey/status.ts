import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 설문 조사 종료 여부 확인 API
 * GET /api/survey/status
 * 
 * 데이터베이스에서 설문 캠페인별 설정 확인:
 * - campaign_source: 설문 캠페인 (기본값: muziik-survey-2025)
 * - is_active: 설문 활성화 여부
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { campaign_source = 'muziik-survey-2025' } = req.query as { campaign_source?: string };

    // 데이터베이스에서 설정 조회
    const { data: settings, error } = await supabase
      .from('survey_settings')
      .select('is_active, winners_page_enabled')
      .eq('campaign_source', campaign_source)
      .maybeSingle();

    if (error) {
      console.error('설문 설정 조회 오류:', error);
      // 오류 발생 시 활성 상태로 간주
      return res.status(200).json({
        success: true,
        isActive: true,
        message: '설문이 진행 중입니다.',
      });
    }

    // 설정이 없으면 활성 상태로 간주
    const isActive = settings?.is_active !== false;

    return res.status(200).json({
      success: true,
      isActive,
      winners_page_enabled: settings?.winners_page_enabled !== false,
      campaign_source,
      message: isActive 
        ? '설문이 진행 중입니다.' 
        : '설문이 종료되었습니다. 다음 설문에 또 뵙겠습니다.',
    });
  } catch (error: any) {
    console.error('설문 상태 확인 오류:', error);
    // 오류 발생 시 활성 상태로 간주
    return res.status(200).json({
      success: true,
      isActive: true,
      message: '설문이 진행 중입니다.',
    });
  }
}
