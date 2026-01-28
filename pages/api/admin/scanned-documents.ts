/**
 * 스캔 서류 목록 조회 API
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { 
    customerId, 
    documentType, 
    visitDate, 
    page = '1', 
    pageSize = '50' 
  } = req.query;
  
  try {
    let query = supabase
      .from('scanned_documents')
      .select(`
        *,
        image_assets (
          id,
          cdn_url,
          file_path,
          filename,
          file_size,
          created_at
        ),
        customers (
          id,
          name,
          phone
        )
      `, { count: 'exact' })
      .order('visit_date', { ascending: false })
      .order('detected_at', { ascending: false });
    
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    
    if (documentType && documentType !== 'all') {
      query = query.eq('document_type', documentType);
    }
    
    if (visitDate) {
      query = query.eq('visit_date', visitDate);
    }
    
    // 페이지네이션
    const pageNum = parseInt(page as string, 10);
    const sizeNum = parseInt(pageSize as string, 10);
    const from = (pageNum - 1) * sizeNum;
    const to = from + sizeNum - 1;
    
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('문서 조회 오류:', error);
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      documents: data || [],
      count: count || 0,
      page: pageNum,
      pageSize: sizeNum,
      totalPages: Math.ceil((count || 0) / sizeNum)
    });
    
  } catch (error: any) {
    console.error('문서 조회 오류:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch documents' 
    });
  }
}
