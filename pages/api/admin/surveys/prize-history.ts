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
    const { date, section, limit = 50, offset = 0 } = req.query;

    // 기본 쿼리
    let query = supabase
      .from('prize_recommendations')
      .select('*', { count: 'exact' })
      .order('recommendation_date', { ascending: false })
      .order('rank', { ascending: true });

    // 날짜 필터
    if (date) {
      query = query.eq('recommendation_date', date);
    }

    // 섹션 필터 (purchased, non_purchased, all)
    if (section) {
      query = query.eq('section', section);
    }

    // 페이지네이션
    if (limit) {
      query = query.limit(Number(limit));
    }
    if (offset) {
      query = query.range(Number(offset), Number(offset) + Number(limit) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('경품 추천 이력 조회 오류:', error);
      return res.status(500).json({ success: false, message: '이력 조회에 실패했습니다.' });
    }

    // 날짜별 그룹화
    const groupedByDate: Record<string, any[]> = {};
    data?.forEach((item) => {
      const date = item.recommendation_date;
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(item);
    });

    // 날짜별 통계 계산
    const dateStats = Object.keys(groupedByDate).map((date) => {
      const items = groupedByDate[date];
      const purchased = items.filter((i) => i.section === 'purchased').length;
      const nonPurchased = items.filter((i) => i.section === 'non_purchased').length;
      const all = items.filter((i) => i.section === 'all').length;

      return {
        date,
        total: items.length,
        purchased,
        nonPurchased,
        all,
        topScore: Math.max(...items.map((i) => i.total_score || 0)),
        avgScore: items.reduce((sum, i) => sum + (i.total_score || 0), 0) / items.length,
      };
    });

    // 고유한 날짜 목록
    const uniqueDates = Array.from(new Set(data?.map((item) => item.recommendation_date) || [])).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );

    return res.status(200).json({
      success: true,
      data: {
        recommendations: data || [],
        groupedByDate,
        dateStats,
        uniqueDates,
        total: count || 0,
      },
    });
  } catch (error: any) {
    console.error('경품 추천 이력 조회 오류:', error);
    return res.status(500).json({ success: false, message: error.message || '이력 조회 중 오류가 발생했습니다.' });
  }
}

