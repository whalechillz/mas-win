/**
 * 드라이버 제품 목록 API
 * 메인 페이지에서 사용할 드라이버 제품 목록 반환
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('product_type', 'driver')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('❌ 드라이버 제품 조회 오류:', error);
      throw error;
    }

    return res.status(200).json({
      success: true,
      products: products || []
    });
  } catch (error) {
    console.error('❌ 드라이버 제품 API 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '드라이버 제품 조회에 실패했습니다.'
    });
  }
}

