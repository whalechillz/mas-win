import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 사용 가능한 campaign_source 목록 조회 API
 * GET /api/admin/surveys/campaign-sources
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // surveys 테이블에서 고유한 campaign_source 목록 조회
    const { data, error } = await supabase
      .from('surveys')
      .select('campaign_source')
      .not('campaign_source', 'is', null);

    if (error) {
      console.error('캠페인 소스 목록 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '캠페인 소스 목록을 불러오는데 실패했습니다.',
        error: error.message,
      });
    }

    // 고유한 campaign_source 추출 및 정렬
    const uniqueSources = Array.from(
      new Set(
        (data || [])
          .map((item: any) => item.campaign_source)
          .filter((source: string | null) => source && source.trim() !== '')
      )
    ).sort();

    // 기본값이 없으면 추가
    if (!uniqueSources.includes('muziik-survey-2025')) {
      uniqueSources.unshift('muziik-survey-2025');
    }

    return res.status(200).json({
      success: true,
      data: uniqueSources,
    });
  } catch (error: any) {
    console.error('캠페인 소스 목록 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
}
