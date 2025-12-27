/**
 * 제품 상세 정보 API (slug 기반)
 * detail_images, gallery_images 반환
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'Product slug is required' });
  }

  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ 제품 조회 오류:', error);
      return res.status(404).json({
        success: false,
        error: '제품을 찾을 수 없습니다.'
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        error: '제품을 찾을 수 없습니다.'
      });
    }

    return res.status(200).json({
      success: true,
      product: product
    });
  } catch (error) {
    console.error('❌ 제품 API 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '제품 조회에 실패했습니다.'
    });
  }
}
