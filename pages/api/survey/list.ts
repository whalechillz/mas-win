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
    const {
      page = '1',
      pageSize = '50',
      q = '', // 검색어 (이름, 전화번호)
      selected_model = '', // 모델 필터
      age_group = '', // 연령대 필터
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const sizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 50));
    const from = (pageNum - 1) * sizeNum;
    const to = from + sizeNum - 1;

    // 정렬 컬럼 검증
    const allowedSortColumns = ['created_at', 'name', 'phone', 'selected_model', 'age_group'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const ascending = sortOrder === 'asc';

    let query = supabase
      .from('surveys')
      .select('*', { count: 'exact' })
      .order(sortColumn, { ascending })
      .range(from, to);

    // 검색 필터
    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      const cleanSearchTerm = searchTerm.replace(/[^0-9]/g, '');
      
      if (cleanSearchTerm.length > 0) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${cleanSearchTerm}%`);
      } else {
        query = query.ilike('name', `%${searchTerm}%`);
      }
    }

    // 모델 필터
    if (selected_model) {
      query = query.eq('selected_model', selected_model);
    }

    // 연령대 필터
    if (age_group) {
      query = query.eq('age_group', age_group);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('설문 목록 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: '설문 목록을 불러오는데 실패했습니다.',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: data || [],
      pagination: {
        page: pageNum,
        pageSize: sizeNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / sizeNum),
      },
    });
  } catch (error: any) {
    console.error('설문 목록 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    });
  }
}


