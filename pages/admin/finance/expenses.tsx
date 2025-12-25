import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminNav from '../../../components/admin/AdminNav';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type Supplier = {
  id: number;
  name: string;
};

type Expense = {
  id: number;
  expense_date: string;
  amount: number;
  description: string | null;
  category: string;
  supplier_id: number | null;
  note: string | null;
};

export default function ExpensesAdminPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [category, setCategory] = useState('');
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [monthlyChart, setMonthlyChart] = useState<any[]>([]);
  const [categoryChart, setCategoryChart] = useState<any[]>([]);
  const [supplierChart, setSupplierChart] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formCategory, setFormCategory] = useState('');
  const [formSupplierId, setFormSupplierId] = useState<number | ''>('');
  const [formDescription, setFormDescription] = useState('');
  const [formNote, setFormNote] = useState('');
  const [saving, setSaving] = useState(false);

  const loadSuppliers = async () => {
    try {
      const res = await fetch('/api/admin/suppliers');
      const json = await res.json();
      if (res.ok && json.success) {
        setSuppliers(json.suppliers || []);
      }
    } catch (error) {
      console.error('공급업체 목록 조회 오류:', error);
    }
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month),
      });
      if (category) params.set('category', category);
      if (supplierId) params.set('supplierId', String(supplierId));

      const res = await fetch(`/api/admin/expenses?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setExpenses(json.expenses || []);
        setTotalAmount(json.totalAmount || 0);
      } else {
        alert(json.message || '지출 내역 조회에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('지출 내역 조회 오류:', error);
      alert(error.message || '지출 내역 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadChartStats = async () => {
    setChartLoading(true);
    try {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month),
      });
      const res = await fetch(`/api/admin/expenses/stats?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setMonthlyChart(json.monthlyChart || []);
        setCategoryChart(json.categoryChart || []);
        setSupplierChart(json.supplierChart || []);
      }
    } catch (error: any) {
      console.error('차트 데이터 조회 오류:', error);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
    loadChartStats();
  }, [year, month, category, supplierId]);

  const resetForm = () => {
    setEditingExpense(null);
    setFormDate('');
    setFormAmount('');
    setFormCategory('');
    setFormSupplierId('');
    setFormDescription('');
    setFormNote('');
  };

  const openCreate = () => {
    resetForm();
    setFormDate(new Date().toISOString().slice(0, 10));
  };

  const openEdit = (e: Expense) => {
    setEditingExpense(e);
    setFormDate(e.expense_date ? e.expense_date.slice(0, 10) : '');
    setFormAmount(e.amount);
    setFormCategory(e.category);
    setFormSupplierId(e.supplier_id || '');
    setFormDescription(e.description || '');
    setFormNote(e.note || '');
  };

  const saveExpense = async () => {
    if (!formDate || !formAmount || !formCategory) {
      alert('날짜, 금액, 카테고리는 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      const body: any = {
        expense_date: new Date(`${formDate}T00:00:00+09:00`).toISOString(),
        amount: Number(formAmount),
        category: formCategory,
        description: formDescription || null,
        supplier_id: formSupplierId || null,
        note: formNote || null,
      };
      if (editingExpense) {
        body.id = editingExpense.id;
      }

      const res = await fetch('/api/admin/expenses', {
        method: editingExpense ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message || '저장에 실패했습니다.');
        setSaving(false);
        return;
      }
      alert('저장되었습니다.');
      resetForm();
      await loadExpenses();
    } catch (error: any) {
      console.error('지출 저장 오류:', error);
      alert(error.message || '지출 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (id: number) => {
    if (!confirm('이 지출 내역을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/expenses?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message || '삭제에 실패했습니다.');
        return;
      }
      await loadExpenses();
    } catch (error: any) {
      console.error('지출 삭제 오류:', error);
      alert(error.message || '지출 삭제 중 오류가 발생했습니다.');
    }
  };

  const formatAmount = (v: number) => v.toLocaleString('ko-KR');

  return (
    <>
      <Head>
        <title>지출 / 경비 관리 - MASGOLF</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">지출 / 경비 관리</h1>
              <p className="text-sm text-gray-600 mt-1">
                월별 임대료, 공과금, 택배비, 접대비 등 지출 내역을 관리합니다.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              ➕ 지출 추가
            </button>
          </div>

          {/* 필터 */}
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="px-2 py-1.5 border rounded-md"
              >
                {Array.from({ length: 5 }).map((_, idx) => {
                  const y = today.getFullYear() - 2 + idx;
                  return (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  );
                })}
              </select>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="px-2 py-1.5 border rounded-md"
              >
                {Array.from({ length: 12 }).map((_, idx) => {
                  const m = idx + 1;
                  return (
                    <option key={m} value={m}>
                      {m}월
                    </option>
                  );
                })}
              </select>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-2 py-1.5 border rounded-md"
            >
              <option value="">카테고리 전체</option>
              <option value="rent">임대료</option>
              <option value="utility">전기/공과금</option>
              <option value="telecom">통신비</option>
              <option value="supplies">소모품/비품</option>
              <option value="shipping">택배비</option>
              <option value="hospitality">접대/음료</option>
              <option value="marketing">마케팅/광고</option>
              <option value="etc">기타</option>
            </select>
            <select
              value={supplierId}
              onChange={(e) =>
                setSupplierId(e.target.value ? Number(e.target.value) : '')
              }
              className="px-2 py-1.5 border rounded-md"
            >
              <option value="">공급업체 전체</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="ml-auto text-sm font-medium text-gray-800">
              이 달 합계:{' '}
              <span className="text-blue-700">
                {loading ? '...' : `${formatAmount(totalAmount)} 원`}
              </span>
            </div>
          </div>

          {/* 그래프 섹션 */}
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 월별 합계 그래프 */}
            <div className="bg-white border rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">월별 지출 추이</h2>
              {chartLoading ? (
                <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                  로딩 중...
                </div>
              ) : monthlyChart.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                  데이터가 없습니다.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => `${value.toLocaleString('ko-KR')} 원`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="지출액"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* 카테고리별 막대 그래프 */}
            <div className="bg-white border rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">카테고리별 지출</h2>
              {chartLoading ? (
                <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                  로딩 중...
                </div>
              ) : categoryChart.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                  데이터가 없습니다.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categoryChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => `${value.toLocaleString('ko-KR')} 원`}
                    />
                    <Legend />
                    <Bar dataKey="amount" fill="#10b981" name="지출액" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 공급업체별 파이 차트 */}
          {supplierChart.length > 0 && (
            <div className="mb-6 bg-white border rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">공급업체별 지출 비중</h2>
              {chartLoading ? (
                <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                  로딩 중...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={supplierChart}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {supplierChart.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'][index % 10]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `${value.toLocaleString('ko-KR')} 원`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* 테이블 */}
          <div className="bg-white border rounded-lg overflow-hidden">
            {loading ? (
              <div className="py-10 text-center text-gray-500 text-sm">
                로딩 중...
              </div>
            ) : expenses.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-sm">
                이 달의 지출 내역이 없습니다.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">날짜</th>
                    <th className="p-2 text-left">카테고리</th>
                    <th className="p-2 text-left">공급업체</th>
                    <th className="p-2 text-left">설명</th>
                    <th className="p-2 text-right">금액</th>
                    <th className="p-2 text-left">비고</th>
                    <th className="p-2 text-left">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-t">
                      <td className="p-2">
                        {e.expense_date
                          ? new Date(e.expense_date).toLocaleDateString('ko-KR')
                          : '-'}
                      </td>
                      <td className="p-2">{e.category}</td>
                      <td className="p-2">
                        {e.supplier_id
                          ? suppliers.find((s) => s.id === e.supplier_id)?.name || '-'
                          : '-'}
                      </td>
                      <td className="p-2">{e.description || '-'}</td>
                      <td className="p-2 text-right">
                        {formatAmount(e.amount)} 원
                      </td>
                      <td className="p-2">{e.note || '-'}</td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(e)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => deleteExpense(e.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 입력/수정 폼 (페이지 하단) */}
          <div className="mt-6 bg-white border rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              {editingExpense ? '지출 내역 수정' : '새 지출 내역 추가'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  날짜 *
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-2 py-1.5 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  금액(원) *
                </label>
                <input
                  type="number"
                  value={formAmount}
                  onChange={(e) =>
                    setFormAmount(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full px-2 py-1.5 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  카테고리 *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-2 py-1.5 border rounded-md"
                >
                  <option value="">선택</option>
                  <option value="rent">임대료</option>
                  <option value="utility">전기/공과금</option>
                  <option value="telecom">통신비</option>
                  <option value="supplies">소모품/비품</option>
                  <option value="shipping">택배비</option>
                  <option value="hospitality">접대/음료</option>
                  <option value="marketing">마케팅/광고</option>
                  <option value="etc">기타</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  공급업체
                </label>
                <select
                  value={formSupplierId}
                  onChange={(e) =>
                    setFormSupplierId(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full px-2 py-1.5 border rounded-md"
                >
                  <option value="">선택 안 함</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  설명
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-2 py-1.5 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  비고
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-2 py-1.5 border rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 border rounded-md text-xs hover:bg-gray-50"
              >
                초기화
              </button>
              <button
                type="button"
                onClick={saveExpense}
                disabled={saving}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? '저장 중...'
                  : editingExpense
                  ? '지출 수정'
                  : '지출 추가'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


