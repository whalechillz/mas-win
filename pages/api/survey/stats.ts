import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 전체 설문 수
    const { count: totalCount } = await supabase
      .from('surveys')
      .select('*', { count: 'exact', head: true });

    // 모델별 통계
    const { data: modelData, error: modelError } = await supabase
      .from('surveys')
      .select('selected_model');
    
    if (modelError) throw modelError;
    
    const modelStats: Record<string, number> = {};
    modelData?.forEach((item) => {
      modelStats[item.selected_model] = (modelStats[item.selected_model] || 0) + 1;
    });

    // 연령대별 통계
    const { data: ageGroupData, error: ageGroupError } = await supabase
      .from('surveys')
      .select('age_group');
    
    if (ageGroupError) throw ageGroupError;
    
    const ageGroupStats: Record<string, number> = {};
    ageGroupData?.forEach((item) => {
      const group = item.age_group || '미입력';
      ageGroupStats[group] = (ageGroupStats[group] || 0) + 1;
    });

    // 중요 요소 통계
    const { data: factorData, error: factorError } = await supabase
      .from('surveys')
      .select('important_factors');
    
    if (factorError) throw factorError;
    
    const factorStats: Record<string, number> = {
      distance: 0,
      direction: 0,
      feel: 0,
    };
    factorData?.forEach((item) => {
      if (Array.isArray(item.important_factors)) {
        item.important_factors.forEach((factor: string) => {
          if (factorStats[factor] !== undefined) {
            factorStats[factor]++;
          }
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        total: totalCount || 0,
        byModel: modelStats,
        byAgeGroup: ageGroupStats,
        byFactor: factorStats,
      },
    });
  } catch (error: any) {
    console.error('통계 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
}

