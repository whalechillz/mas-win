import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 설문 캠페인별 설정 조회/업데이트 API
 * GET: 설정 조회
 * PUT: 설정 업데이트
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // 설정 조회
    try {
      const { campaign_source = 'muziik-survey-2025' } = req.query as { campaign_source?: string };

      const { data, error } = await supabase
        .from('survey_settings')
        .select('*')
        .eq('campaign_source', campaign_source)
        .maybeSingle();

      if (error) {
        console.error('설문 설정 조회 오류:', error);
        return res.status(500).json({
          success: false,
          message: '설문 설정 조회에 실패했습니다.',
          error: error.message,
        });
      }

      // 설정이 없으면 기본값 반환
      if (!data) {
        return res.status(200).json({
          success: true,
          data: {
            campaign_source,
            is_active: true,
            winners_page_enabled: true,
          },
        });
      }

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('서버 오류:', error);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.',
        error: error.message,
      });
    }
  } else if (req.method === 'PUT') {
    // 설정 업데이트
    try {
      const { campaign_source, is_active, winners_page_enabled } = req.body;

      if (!campaign_source) {
        return res.status(400).json({
          success: false,
          message: 'campaign_source는 필수입니다.',
        });
      }

      // upsert (있으면 업데이트, 없으면 생성)
      const { data, error } = await supabase
        .from('survey_settings')
        .upsert(
          {
            campaign_source,
            is_active: is_active !== undefined ? is_active : true,
            winners_page_enabled: winners_page_enabled !== undefined ? winners_page_enabled : true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'campaign_source',
          }
        )
        .select()
        .single();

      if (error) {
        console.error('설문 설정 업데이트 오류:', error);
        return res.status(500).json({
          success: false,
          message: '설문 설정 업데이트에 실패했습니다.',
          error: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        data,
        message: '설문 설정이 업데이트되었습니다.',
      });
    } catch (error: any) {
      console.error('서버 오류:', error);
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.',
        error: error.message,
      });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
