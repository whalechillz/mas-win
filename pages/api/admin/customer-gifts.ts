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
      case 'PATCH':
        return handlePut(req, res);
      case 'DELETE':
        return handleDelete(req, res);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('[admin/customer-gifts] UNEXPECTED ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.',
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const customerIdParam = req.query.customerId;
    const surveyIdParam = req.query.surveyId;
    
    const customerId =
      typeof customerIdParam === 'string' ? Number(customerIdParam) : customerIdParam;
    const surveyId = typeof surveyIdParam === 'string' ? surveyIdParam : surveyIdParam;

    if (!customerId && !surveyId) {
      return res.status(400).json({
        success: false,
        message: 'customerId 또는 surveyId 쿼리 파라미터가 필요합니다.',
      });
    }

    let query = supabase
      .from('customer_gifts')
      .select(
        `
        id,
        customer_id,
        survey_id,
        product_id,
        gift_text,
        quantity,
        delivery_type,
        delivery_status,
        delivery_date,
        note,
        gift_type,
        created_at,
        updated_at,
        products:product_id (
          id,
          name,
          sku,
          category,
          color,
          size
        )
      `,
      );

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (surveyId) {
      query = query.eq('survey_id', surveyId);
    }

    const { data, error } = await query
      .order('delivery_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/customer-gifts][GET] ERROR', error);
      return res.status(500).json({
        success: false,
        message: error.message || '선물 기록 조회에 실패했습니다.',
      });
    }

    return res.status(200).json({
      success: true,
      gifts: data ?? [],
    });
  } catch (error: any) {
    console.error('[admin/customer-gifts][GET] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '선물 기록 조회 중 서버 오류가 발생했습니다.',
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      customer_id,
      survey_id,
      product_id,
      gift_text,
      quantity = 1,
      delivery_type = 'in_person',
      delivery_status = 'pending',
      delivery_date,
      note,
      gift_type = 'normal',
    } = req.body || {};

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: 'customer_id는 필수입니다.',
      });
    }

    const payload: any = {
      customer_id,
      survey_id: survey_id || null,
      product_id: product_id || null,
      gift_text: gift_text || null,
      quantity: quantity || 1,
      delivery_type: delivery_type || 'in_person',
      delivery_status: delivery_status || 'pending',
      delivery_date: delivery_date || null,
      note: note || null,
      gift_type: gift_type || 'normal',
    };

    const { data, error } = await supabase
      .from('customer_gifts')
      .insert(payload)
      .select(
        `
        id,
        customer_id,
        survey_id,
        product_id,
        gift_text,
        quantity,
        delivery_type,
        delivery_status,
        delivery_date,
        note,
        gift_type,
        created_at,
        updated_at
      `,
      )
      .single();

    if (error) {
      console.error('[admin/customer-gifts][POST] ERROR', error);
      return res.status(500).json({
        success: false,
        message: error.message || '선물 기록 생성에 실패했습니다.',
      });
    }

    return res.status(201).json({
      success: true,
      message: '선물 기록이 추가되었습니다.',
      gift: data,
    });
  } catch (error: any) {
    console.error('[admin/customer-gifts][POST] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '선물 기록 생성 중 서버 오류가 발생했습니다.',
    });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      id,
      product_id,
      gift_text,
      quantity,
      delivery_type,
      delivery_status,
      delivery_date,
      note,
      gift_type,
    } = req.body || {};

    if (!id) {
      return res.status(400).json({
        success: false,
        message: '선물 기록 ID(id)가 필요합니다.',
      });
    }

    const update: any = {};

    if (product_id !== undefined) update.product_id = product_id || null;
    if (gift_text !== undefined) update.gift_text = gift_text || null;
    if (quantity !== undefined) update.quantity = quantity;
    if (delivery_type !== undefined) update.delivery_type = delivery_type;
    if (delivery_status !== undefined) update.delivery_status = delivery_status;
    if (delivery_date !== undefined) update.delivery_date = delivery_date || null;
    if (note !== undefined) update.note = note || null;
    if (gift_type !== undefined) update.gift_type = gift_type || 'normal';

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: '변경할 값이 없습니다.',
      });
    }

    // delivery_date가 변경되는 경우, 관련된 inventory_transactions의 tx_date도 업데이트
    if (delivery_date !== undefined) {
      const { data: relatedTransactions } = await supabase
        .from('inventory_transactions')
        .select('id')
        .eq('related_gift_id', id)
        .eq('tx_type', 'outbound');

      if (relatedTransactions && relatedTransactions.length > 0) {
        await supabase
          .from('inventory_transactions')
          .update({ tx_date: delivery_date || null })
          .in('id', relatedTransactions.map((t) => t.id));
      }
    }

    const { data, error } = await supabase
      .from('customer_gifts')
      .update(update)
      .eq('id', id)
      .select(
        `
        id,
        customer_id,
        survey_id,
        product_id,
        gift_text,
        quantity,
        delivery_type,
        delivery_status,
        delivery_date,
        note,
        gift_type,
        created_at,
        updated_at
      `,
      )
      .single();

    if (error) {
      console.error('[admin/customer-gifts][PUT] ERROR', error);
      return res.status(500).json({
        success: false,
        message: error.message || '선물 기록 수정에 실패했습니다.',
      });
    }

    return res.status(200).json({
      success: true,
      message: '선물 기록이 수정되었습니다.',
      gift: data,
    });
  } catch (error: any) {
    console.error('[admin/customer-gifts][PUT] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '선물 기록 수정 중 서버 오류가 발생했습니다.',
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
        message: '선물 기록 ID(id)가 필요합니다.',
      });
    }

    const { error } = await supabase.from('customer_gifts').delete().eq('id', id);

    if (error) {
      console.error('[admin/customer-gifts][DELETE] ERROR', error);
      return res.status(500).json({
        success: false,
        message: error.message || '선물 기록 삭제에 실패했습니다.',
      });
    }

    return res.status(200).json({
      success: true,
      message: '선물 기록이 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('[admin/customer-gifts][DELETE] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '선물 기록 삭제 중 서버 오류가 발생했습니다.',
    });
  }
}


