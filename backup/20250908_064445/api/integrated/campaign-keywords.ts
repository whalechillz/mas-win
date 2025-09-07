import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({ error: 'Year and month are required' });
  }

  try {
    // 월별 테마에서 키워드 가져오기
    const { data: theme } = await supabase
      .from('monthly_themes')
      .select('main_keywords, sub_keywords')
      .eq('year', parseInt(year as string))
      .eq('month', parseInt(month as string))
      .single();

    if (!theme) {
      // 기본 키워드 반환
      return res.status(200).json({
        keywords: ['이천전골', '이천순대국', '마쓰구골프', '싱싱골프']
      });
    }

    // 메인 키워드와 서브 키워드 합치기
    const keywords = [
      ...(theme.main_keywords || []),
      ...(theme.sub_keywords || [])
    ];

    // 중복 제거
    const uniqueKeywords = [...new Set(keywords)];

    return res.status(200).json({ keywords: uniqueKeywords });
  } catch (error) {
    console.error('Error fetching campaign keywords:', error);
    return res.status(500).json({ error: 'Failed to fetch campaign keywords' });
  }
}