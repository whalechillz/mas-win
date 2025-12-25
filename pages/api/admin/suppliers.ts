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
    console.error('[admin/suppliers] UNEXPECTED ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.',
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    let query = supabase
      .from('suppliers')
      .select('id, name, category, order_method, contact, note')
      .order('name', { ascending: true });

    if (q) {
      query = query.or(
        `name.ilike.%${q}%,category.ilike.%${q}%,order_method.ilike.%${q}%,note.ilike.%${q}%`,
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      suppliers: data ?? [],
    });
  } catch (error: any) {
    console.error('[admin/suppliers][GET] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '공급업체 목록 조회에 실패했습니다.',
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, category, order_method, contact, note } = req.body || {};

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'name 은 필수입니다.',
      });
    }

    const payload: any = {
      name,
      category: category || null,
      order_method: order_method || null,
      contact: contact || null,
      note: note || null,
    };

    const { data, error } = await supabase
      .from('suppliers')
      .insert(payload)
      .select('id, name, category, order_method, contact, note')
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: '공급업체가 생성되었습니다.',
      supplier: data,
    });
  } catch (error: any) {
    console.error('[admin/suppliers][POST] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '공급업체 생성에 실패했습니다.',
    });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, name, category, order_method, contact, note } = req.body || {};

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'id 가 필요합니다.',
      });
    }

    const update: any = {};
    if (name !== undefined) update.name = name;
    if (category !== undefined) update.category = category || null;
    if (order_method !== undefined) update.order_method = order_method || null;
    if (contact !== undefined) update.contact = contact || null;
    if (note !== undefined) update.note = note || null;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: '변경할 값이 없습니다.',
      });
    }

    const { data, error } = await supabase
      .from('suppliers')
      .update(update)
      .eq('id', id)
      .select('id, name, category, order_method, contact, note')
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: '공급업체가 수정되었습니다.',
      supplier: data,
    });
  } catch (error: any) {
    console.error('[admin/suppliers][PUT] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '공급업체 수정에 실패했습니다.',
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
        message: 'id 가 필요합니다.',
      });
    }

    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: '공급업체가 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('[admin/suppliers][DELETE] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '공급업체 삭제에 실패했습니다.',
    });
  }
}


