import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { ids, update } = req.body || {};

    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: '일괄 수정할 상품 ID 목록(ids)이 필요합니다.' });
    }

    if (!update || typeof update !== 'object') {
      return res
        .status(400)
        .json({ success: false, message: 'update 객체에 수정할 필드를 지정해야 합니다.' });
    }

    const payload: any = {};

    if (update.normal_price !== undefined) {
      payload.normal_price =
        update.normal_price === null || update.normal_price === ''
          ? null
          : Number(update.normal_price);
    }

    if (update.sale_price !== undefined) {
      payload.sale_price =
        update.sale_price === null || update.sale_price === ''
          ? null
          : Number(update.sale_price);
    }

    if (Object.keys(payload).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: '변경할 필드가 없습니다. 가격 필드를 확인해주세요.' });
    }

    const { error } = await supabase.from('products').update(payload).in('id', ids);

    if (error) {
      console.error('[admin/products/bulk-update] ERROR', error);
      return res.status(500).json({
        success: false,
        message: error.message || '상품 일괄 수정에 실패했습니다.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `상품 ${ids.length}개의 가격이 일괄 수정되었습니다.`,
    });
  } catch (error: any) {
    console.error('[admin/products/bulk-update] UNEXPECTED ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.',
    });
  }
}









