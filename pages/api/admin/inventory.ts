import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      case 'PUT':
        return handlePut(req, res);
      case 'DELETE':
        return handleDelete(req, res);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('[admin/inventory] UNEXPECTED ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.',
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const productIdParam = req.query.productId;
    const productId =
      typeof productIdParam === 'string' ? Number(productIdParam) : productIdParam;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId 쿼리 파라미터가 필요합니다.',
      });
    }

    // 전체 수량 집계
    const { data: summaryRows, error: summaryError } = await supabase
      .from('inventory_transactions')
      .select('quantity')
      .eq('product_id', productId);

    if (summaryError) {
      throw summaryError;
    }

    const currentQuantity =
      summaryRows?.reduce((sum, row: any) => sum + (row.quantity || 0), 0) ?? 0;

    // 최근 이력 50건
    const { data: history, error: historyError } = await supabase
      .from('inventory_transactions')
      .select(
        `
        id,
        product_id,
        tx_type,
        quantity,
        tx_date,
        note,
        supplier_id
      `,
      )
      .eq('product_id', productId)
      .order('tx_date', { ascending: false })
      .limit(50);

    if (historyError) {
      throw historyError;
    }

    return res.status(200).json({
      success: true,
      productId,
      currentQuantity,
      history: history ?? [],
    });
  } catch (error: any) {
    console.error('[admin/inventory][GET] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '재고 정보 조회에 실패했습니다.',
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { product_id, tx_type, quantity, tx_date, note, supplier_id } = req.body || {};

    if (!product_id || !tx_type || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'product_id, tx_type, quantity 는 필수입니다.',
      });
    }

    const allowedTypes = ['inbound', 'outbound', 'scrap', 'adjustment'];
    if (!allowedTypes.includes(tx_type)) {
      return res.status(400).json({
        success: false,
        message: `tx_type 은 ${allowedTypes.join(', ')} 중 하나여야 합니다.`,
      });
    }

    const payload: any = {
      product_id,
      tx_type,
      quantity: Number(quantity),
      tx_date: tx_date || new Date().toISOString(),
      note: note || null,
      supplier_id: supplier_id || null,
    };

    const { data, error } = await supabase
      .from('inventory_transactions')
      .insert(payload)
      .select(
        `
        id,
        product_id,
        tx_type,
        quantity,
        tx_date,
        note,
        supplier_id
      `,
      )
      .single();

    if (error) {
      console.error('[admin/inventory][POST] ERROR', error);
      return res.status(500).json({
        success: false,
        message: error.message || '재고 이력 추가에 실패했습니다.',
      });
    }

    return res.status(201).json({
      success: true,
      message: '재고 이력이 추가되었습니다.',
      transaction: data,
    });
  } catch (error: any) {
    console.error('[admin/inventory][POST] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '재고 이력 추가 중 서버 오류가 발생했습니다.',
    });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, tx_type, quantity, tx_date, note, supplier_id } = req.body || {};

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'id는 필수입니다.',
      });
    }

    const update: any = {};
    if (tx_type !== undefined) {
      const allowedTypes = ['inbound', 'outbound', 'scrap', 'adjustment'];
      if (!allowedTypes.includes(tx_type)) {
        return res.status(400).json({
          success: false,
          message: `tx_type은 ${allowedTypes.join(', ')} 중 하나여야 합니다.`,
        });
      }
      update.tx_type = tx_type;
    }
    if (quantity !== undefined) update.quantity = Number(quantity);
    if (tx_date !== undefined) update.tx_date = tx_date;
    if (note !== undefined) update.note = note || null;
    if (supplier_id !== undefined) update.supplier_id = supplier_id || null;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: '변경할 값이 없습니다.',
      });
    }

    const { data, error } = await supabase
      .from('inventory_transactions')
      .update(update)
      .eq('id', id)
      .select('id, product_id, tx_type, quantity, tx_date, note, supplier_id')
      .single();

    if (error) {
      console.error('[admin/inventory][PUT] ERROR', error);
      return res.status(500).json({
        success: false,
        message: error.message || '재고 이력 수정에 실패했습니다.',
      });
    }

    return res.status(200).json({
      success: true,
      message: '재고 이력이 수정되었습니다.',
      transaction: data,
    });
  } catch (error: any) {
    console.error('[admin/inventory][PUT] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '재고 이력 수정 중 서버 오류가 발생했습니다.',
    });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const idParam = req.query.id ?? (req.body && req.body.id);
    const id = typeof idParam === 'string' ? Number(idParam) : idParam;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'id가 필요합니다.',
      });
    }

    const { error } = await supabase.from('inventory_transactions').delete().eq('id', id);

    if (error) {
      console.error('[admin/inventory][DELETE] ERROR', error);
      return res.status(500).json({
        success: false,
        message: error.message || '재고 이력 삭제에 실패했습니다.',
      });
    }

    return res.status(200).json({
      success: true,
      message: '재고 이력이 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('[admin/inventory][DELETE] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '재고 이력 삭제 중 서버 오류가 발생했습니다.',
    });
  }
}

