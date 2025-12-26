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
    const year = typeof req.query.year === 'string' ? Number(req.query.year) : undefined;
    const month = typeof req.query.month === 'string' ? Number(req.query.month) : undefined;

    // 전체 지출 데이터 조회 (최근 12개월 또는 지정된 월)
    let query = supabase
      .from('expenses')
      .select('expense_date, amount, category, supplier_id')
      .order('expense_date', { ascending: true });

    if (year && month) {
      // 특정 월의 데이터만
      const from = new Date(Date.UTC(year, month - 1, 1)).toISOString();
      const to = new Date(Date.UTC(year, month, 1)).toISOString();
      query = query.gte('expense_date', from).lt('expense_date', to);
    } else if (year) {
      // 특정 연도의 데이터
      const from = new Date(Date.UTC(year, 0, 1)).toISOString();
      const to = new Date(Date.UTC(year + 1, 0, 1)).toISOString();
      query = query.gte('expense_date', from).lt('expense_date', to);
    } else {
      // 최근 12개월
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);
      query = query.gte('expense_date', startDate.toISOString()).lte('expense_date', endDate.toISOString());
    }

    const { data: expenses, error } = await query;
    if (error) throw error;

    // 1. 월별 합계 그래프 데이터
    const monthlyData: Record<string, number> = {};
    expenses?.forEach((expense: any) => {
      const date = new Date(expense.expense_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += expense.amount || 0;
    });

    const monthlyChartData = Object.entries(monthlyData)
      .map(([month, amount]) => ({
        month,
        amount,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 2. 카테고리별 막대 그래프 데이터
    const categoryData: Record<string, number> = {};
    expenses?.forEach((expense: any) => {
      const category = expense.category || '기타';
      if (!categoryData[category]) {
        categoryData[category] = 0;
      }
      categoryData[category] += expense.amount || 0;
    });

    const categoryChartData = Object.entries(categoryData)
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 3. 공급업체별 지출 파이 차트 데이터 (상위 10개)
    const supplierData: Record<number, number> = {};
    expenses?.forEach((expense: any) => {
      if (expense.supplier_id) {
        if (!supplierData[expense.supplier_id]) {
          supplierData[expense.supplier_id] = 0;
        }
        supplierData[expense.supplier_id] += expense.amount || 0;
      }
    });

    // 공급업체 이름 조회
    const supplierIds = Object.keys(supplierData).map(Number);
    let suppliersMap: Record<number, string> = {};
    if (supplierIds.length > 0) {
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name')
        .in('id', supplierIds);
      suppliers?.forEach((s: any) => {
        suppliersMap[s.id] = s.name;
      });
    }

    const supplierChartData = Object.entries(supplierData)
      .map(([supplierId, amount]) => ({
        supplier_id: Number(supplierId),
        supplier_name: suppliersMap[Number(supplierId)] || '알 수 없음',
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      monthlyChart: monthlyChartData,
      categoryChart: categoryChartData,
      supplierChart: supplierChartData,
    });
  } catch (error: any) {
    console.error('[admin/expenses/stats] ERROR', error);
    return res.status(500).json({
      success: false,
      message: error.message || '지출 통계 데이터 조회에 실패했습니다.',
    });
  }
}








