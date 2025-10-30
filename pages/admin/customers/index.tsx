import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminNav from '../../../components/admin/AdminNav';

type Customer = {
  id: number;
  name: string;
  phone: string;
  address?: string | null;
  opt_out: boolean;
  first_purchase_date?: string | null;
  last_purchase_date?: string | null;
  last_contact_date?: string | null;
  vip_level?: string | null;
  updated_at?: string | null;
};

export default function CustomersPage() {
  const [q, setQ] = useState('');
  const [onlyOptOut, setOnlyOptOut] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async (nextPage = page) => {
    setLoading(true);
    const params = new URLSearchParams({ q, page: String(nextPage), pageSize: String(pageSize) });
    if (onlyOptOut) params.set('optout', 'true');
    const res = await fetch(`/api/admin/customers?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      setCustomers(json.data || []);
      setCount(json.count || 0);
      setPage(json.page || nextPage);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(1); }, []);

  const handleToggleOptOut = async (c: Customer) => {
    const res = await fetch('/api/admin/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, update: { opt_out: !c.opt_out } })
    });
    const json = await res.json();
    if (json.success) {
      setCustomers(prev => prev.map(p => p.id === c.id ? { ...p, opt_out: !c.opt_out } : p));
    } else {
      alert(json.message || '업데이트 실패');
    }
  };

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <>
      <Head><title>고객 관리 - MASGOLF</title></Head>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">고객 관리</h1>
            <div className="flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="이름/번호/주소 검색"
                className="px-3 py-2 border rounded-md"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={onlyOptOut} onChange={() => setOnlyOptOut(!onlyOptOut)} />
                수신거부만
              </label>
              <button onClick={() => fetchCustomers(1)} className="px-4 py-2 bg-blue-600 text-white rounded">검색</button>
            </div>
          </div>

          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">이름</th>
                  <th className="p-2 text-left">전화</th>
                  <th className="p-2 text-left">VIP</th>
                  <th className="p-2 text-left">최근 연락</th>
                  <th className="p-2 text-left">수신거부</th>
                  <th className="p-2 text-left">액션</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{c.name}</td>
                    <td className="p-2">{c.phone}</td>
                    <td className="p-2">{c.vip_level || 'NONE'}</td>
                    <td className="p-2">{c.last_contact_date ? new Date(c.last_contact_date).toLocaleString('ko-KR') : '-'}</td>
                    <td className="p-2">{c.opt_out ? '예' : '아니오'}</td>
                    <td className="p-2">
                      <button onClick={() => handleToggleOptOut(c)} className="px-3 py-1 border rounded">
                        {c.opt_out ? '수신 허용' : '수신 거부'}
                      </button>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr><td className="p-4 text-center text-gray-500" colSpan={6}>{loading ? '로딩 중...' : '데이터 없음'}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <div>총 {count}명</div>
            <div className="flex gap-2">
              <button disabled={page<=1} onClick={() => fetchCustomers(page-1)} className="px-3 py-1 border rounded disabled:opacity-50">이전</button>
              <div>{page} / {totalPages}</div>
              <button disabled={page>=totalPages} onClick={() => fetchCustomers(page+1)} className="px-3 py-1 border rounded disabled:opacity-50">다음</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


