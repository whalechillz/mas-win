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
    console.error('[admin/expenses] UNEXPECTED ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '서버 오류가 발생했습니다.',
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const year = typeof req.query.year === 'string' ? Number(req.query.year) : undefined;
    const month = typeof req.query.month === 'string' ? Number(req.query.month) : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const supplierIdParam = req.query.supplierId;
    const supplierId =
      typeof supplierIdParam === 'string' ? Number(supplierIdParam) : supplierIdParam;

    let query = supabase
      .from('expenses')
      .select(
        `
        id,
        expense_date,
        amount,
        description,
        category,
        supplier_id,
        note
      `,
      )
      .order('expense_date', { ascending: false });

    if (year && month) {
      const from = new Date(Date.UTC(year, month - 1, 1)).toISOString();
      const to = new Date(Date.UTC(year, month, 1)).toISOString();
      query = query.gte('expense_date', from).lt('expense_date', to);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const totalAmount =
      data?.reduce((sum, row: any) => sum + (row.amount || 0), 0) ?? 0;

    return res.status(200).json({
      success: true,
      expenses: data ?? [],
      totalAmount,
    });
  } catch (error: any) {
    console.error('[admin/expenses][GET] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '지출 내역 조회에 실패했습니다.',
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { expense_date, amount, description, category, supplier_id, note } = req.body || {};

    if (!expense_date || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: 'expense_date, amount, category 는 필수입니다.',
      });
    }

    const payload: any = {
      expense_date,
      amount: Number(amount),
      description: description || null,
      category,
      supplier_id: supplier_id || null,
      note: note || null,
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(payload)
      .select(
        `
        id,
        expense_date,
        amount,
        description,
        category,
        supplier_id,
        note
      `,
      )
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: '지출 내역이 생성되었습니다.',
      expense: data,
    });
  } catch (error: any) {
    console.error('[admin/expenses][POST] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '지출 내역 생성에 실패했습니다.',
    });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, expense_date, amount, description, category, supplier_id, note } =
      req.body || {};

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'id 가 필요합니다.',
      });
    }

    const update: any = {};
    if (expense_date !== undefined) update.expense_date = expense_date;
    if (amount !== undefined) update.amount = Number(amount);
    if (description !== undefined) update.description = description || null;
    if (category !== undefined) update.category = category;
    if (supplier_id !== undefined) update.supplier_id = supplier_id || null;
    if (note !== undefined) update.note = note || null;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: '변경할 값이 없습니다.',
      });
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(update)
      .eq('id', id)
      .select(
        `
        id,
        expense_date,
        amount,
        description,
        category,
        supplier_id,
        note
      `,
      )
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: '지출 내역이 수정되었습니다.',
      expense: data,
    });
  } catch (error: any) {
    console.error('[admin/expenses][PUT] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '지출 내역 수정에 실패했습니다.',
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

    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: '지출 내역이 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('[admin/expenses][DELETE] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '지출 내역 삭제에 실패했습니다.',
    });
  }
}


