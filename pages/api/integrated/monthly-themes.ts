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

  try {
    // 특정 월의 테마 가져오기
    if (year && month) {
      const { data, error } = await supabase
        .from('monthly_themes')
        .select('*')
        .eq('year', parseInt(year as string))
        .eq('month', parseInt(month as string))
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return res.status(200).json(data || null);
    }

    // 연도별 전체 테마 가져오기
    if (year) {
      const { data, error } = await supabase
        .from('monthly_themes')
        .select('*')
        .eq('year', parseInt(year as string))
        .order('month', { ascending: true });

      if (error) {
        throw error;
      }

      return res.status(200).json(data || []);
    }

    // 전체 테마 가져오기
    const { data, error } = await supabase
      .from('monthly_themes')
      .select('*')
      .order('year', { ascending: true })
      .order('month', { ascending: true });

    if (error) {
      throw error;
    }

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Error fetching monthly themes:', error);
    return res.status(500).json({ error: 'Failed to fetch monthly themes' });
  }
}