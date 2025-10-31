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
  const [pageSize, setPageSize] = useState(50); // 기본값 50개
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [importMethod, setImportMethod] = useState<'csv' | 'google' | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [sheetName, setSheetName] = useState('MASSGOO');
  const [importing, setImporting] = useState(false);
  const [importingMissing, setImportingMissing] = useState(false);
  const [importResult, setImportResult] = useState<{success: boolean; message: string; count?: number; total?: number; errors?: string[]} | null>(null);

  const fetchCustomers = async (nextPage = page) => {
    setLoading(true);
    const params = new URLSearchParams({ q, page: String(nextPage), pageSize: String(pageSize), sortBy, sortOrder });
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

  // 초기 로드
  useEffect(() => { fetchCustomers(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 정렬/페이지사이즈 변경 시 자동 로드
  useEffect(() => { 
    setPage(1);
    fetchCustomers(1);
    // eslint-disable-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder, pageSize]);

  // 실시간 검색 (debounce 적용)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(1);
    }, 300); // 300ms 지연
    return () => clearTimeout(timer);
    // eslint-disable-line react-hooks/exhaustive-deps
  }, [q, onlyOptOut]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    fetchCustomers(1);
  };

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

  const handleDelete = async (c: Customer) => {
    if (!confirm(`정말 ${c.name} 고객을 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/customers?id=${c.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      alert('고객이 삭제되었습니다.');
      fetchCustomers(page);
    } else {
      alert(json.message || '삭제 실패');
    }
  };

  const handleEdit = (c: Customer) => {
    setEditingCustomer(c);
    setShowEditModal(true);
  };

  const handleImportMissing = async () => {
    if (!confirm('누락된 고객을 CSV 파일에서 찾아서 추가하시겠습니까?')) return;
    
    setImportingMissing(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/admin/customers/import-missing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const json = await res.json();
      
      if (!res.ok || !json.success) {
        setImportResult({
          success: false,
          message: json.message || '누락 고객 임포트 중 오류가 발생했습니다.',
          count: json.stats?.imported || 0,
          total: json.stats?.found || 0,
          errors: []
        });
        setImportingMissing(false);
        return;
      }

      setImportResult({
        success: true,
        message: json.message,
        count: json.stats?.imported || 0,
        total: json.stats?.found || 0,
        errors: []
      });

      // 성공 시 고객 목록 새로고침
      await fetchCustomers(1);
      // 3초 후 결과 메시지 제거
      setTimeout(() => {
        setImportResult(null);
      }, 5000);
    } catch (error: any) {
      console.error('누락 고객 임포트 오류:', error);
      setImportResult({
        success: false,
        message: error.message || '누락 고객 임포트 중 오류가 발생했습니다.',
        count: 0,
        total: 0,
        errors: []
      });
    } finally {
      setImportingMissing(false);
    }
  };

  // 전화번호 포맷팅 (하이픈 추가)
  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  // 날짜 포맷팅
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('ko-KR');
    } catch {
      return '-';
    }
  };

  // 최근 연락 날짜 포맷팅 (시간 포함, 초 제거)
  const formatContactDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      // 오전/오후 시간:분 형식 (초 제거)
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '-';
    }
  };

  const handleImport = async () => {
    if (!importMethod) return;
    
    setImporting(true);
    setImportResult(null);

    try {
      let res: Response;

      if (importMethod === 'csv') {
        if (!importFile) {
          alert('CSV 파일을 선택해주세요.');
          setImporting(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', importFile);
        res = await fetch('/api/admin/import-customers', {
          method: 'POST',
          body: formData
        });
      } else {
        // 구글 시트
        if (!googleSheetUrl) {
          alert('구글 시트 URL을 입력해주세요.');
          setImporting(false);
          return;
        }
        res = await fetch('/api/admin/import-customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            googleSheetUrl,
            sheetName
          })
        });
      }

      const json = await res.json();
      
      if (!res.ok || !json.success) {
        // 에러 응답 처리
        const errorMsg = json.message || json.error || '가져오기 중 오류가 발생했습니다.';
        setImportResult({
          success: false,
          message: errorMsg,
          count: json.count || 0,
          total: json.total || 0,
          errors: json.errors || []
        });
        setImporting(false);
        return;
      }

      setImportResult({
        success: json.success,
        message: json.message,
        count: json.count,
        total: json.total,
        errors: json.errors || []
      });

      if (json.success) {
        // 성공 시 고객 목록 새로고침
        await fetchCustomers(1);
        // 3초 후 모달 닫기
        setTimeout(() => {
          setShowImportModal(false);
          setImportMethod(null);
          setImportFile(null);
          setGoogleSheetUrl('');
          setImportResult(null);
        }, 3000);
      }
    } catch (error: any) {
      console.error('고객 데이터 가져오기 오류:', error);
      setImportResult({
        success: false,
        message: error.message || '가져오기 중 오류가 발생했습니다.',
        count: 0,
        total: 0,
        errors: []
      });
    } finally {
      setImporting(false);
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
                placeholder="이름/번호/주소 검색 (실시간)"
                className="px-3 py-2 border rounded-md"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={onlyOptOut} onChange={() => setOnlyOptOut(!onlyOptOut)} />
                수신거부만
              </label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value={20}>20개씩</option>
                <option value={50}>50개씩</option>
                <option value={100}>100개씩</option>
              </select>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                ➕ 고객 추가
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                📥 고객 데이터 가져오기
              </button>
              <button
                onClick={handleImportMissing}
                disabled={importingMissing}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
              >
                {importingMissing ? '임포트 중...' : '📋 누락된 고객 추가'}
              </button>
            </div>
          </div>

          {/* 누락 고객 임포트 결과 메시지 */}
          {importResult && importResult.total !== undefined && (
            <div className={`mb-4 p-3 rounded-md ${importResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p className="font-medium">{importResult.message}</p>
              {importResult.count !== undefined && (
                <p className="text-sm mt-1">
                  임포트: {importResult.count}명 / 찾은 누락: {importResult.total}명
                </p>
              )}
            </div>
          )}

          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('name')}>
                    이름 {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="p-2 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('phone')}>
                    전화 {sortBy === 'phone' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="p-2 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('vip_level')}>
                    VIP {sortBy === 'vip_level' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="p-2 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('first_purchase_date')}>
                    최초구매일 {sortBy === 'first_purchase_date' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="p-2 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('last_purchase_date')}>
                    마지막지불일 {sortBy === 'last_purchase_date' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="p-2 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('last_service_date')}>
                    마지막A/S출고일 {sortBy === 'last_service_date' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="p-2 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('last_contact_date')}>
                    최근 연락 {sortBy === 'last_contact_date' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="p-2 text-left">수신거부</th>
                  <th className="p-2 text-left">액션</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{c.name}</td>
                    <td className="p-2">{formatPhone(c.phone)}</td>
                    <td className="p-2">{c.vip_level || 'NONE'}</td>
                    <td className="p-2">{formatDate((c as any).first_purchase_date)}</td>
                    <td className="p-2">{formatDate(c.last_purchase_date)}</td>
                    <td className="p-2">{formatDate((c as any).last_service_date)}</td>
                    <td className="p-2">{formatContactDate(c.last_contact_date)}</td>
                    <td className="p-2">{c.opt_out ? '예' : '아니오'}</td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(c)} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                          수정
                        </button>
                        <button onClick={() => handleDelete(c)} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">
                          삭제
                        </button>
                        <button onClick={() => handleToggleOptOut(c)} className="px-2 py-1 text-xs border rounded hover:bg-gray-100">
                          {c.opt_out ? '수신허용' : '수신거부'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr><td className="p-4 text-center text-gray-500" colSpan={9}>{loading ? '로딩 중...' : '데이터 없음'}</td></tr>
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

      {/* 고객 데이터 가져오기 모달 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">고객 데이터 가져오기</h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportMethod(null);
                  setImportFile(null);
                  setGoogleSheetUrl('');
                  setImportResult(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {!importMethod ? (
              <div className="space-y-4">
                <p className="text-gray-600">데이터 가져오기 방법을 선택하세요:</p>
                <button
                  onClick={() => setImportMethod('csv')}
                  className="w-full p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 flex items-center justify-between"
                >
                  <span className="text-lg">📄 CSV 파일 업로드</span>
                  <span className="text-gray-500">→</span>
                </button>
                <button
                  onClick={() => setImportMethod('google')}
                  className="w-full p-4 border-2 border-green-500 rounded-lg hover:bg-green-50 flex items-center justify-between"
                >
                  <span className="text-lg">📊 구글 시트 연동</span>
                  <span className="text-gray-500">→</span>
                </button>
              </div>
            ) : importMethod === 'csv' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSV 파일 선택
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    CSV 형식: 이름,연락처,주소지,최초문의일,최초구매일,마지막지불일,마지막A/S출고일,최근연락내역
                  </p>
                </div>
                {importResult && (
                  <div className={`p-3 rounded-md ${importResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <p className="font-medium">{importResult.message}</p>
                    {importResult.count !== undefined && (
                      <p className="text-sm mt-1">
                        성공: {importResult.count}명 / 전체: {importResult.total}명
                      </p>
                    )}
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-2 text-sm">
                        <p className="font-semibold mb-1">오류 상세:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {importResult.errors.slice(0, 5).map((err: string, idx: number) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setImportMethod(null);
                      setImportFile(null);
                      setImportResult(null);
                    }}
                    className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                  >
                    뒤로
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || !importFile}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {importing ? '가져오는 중...' : '가져오기'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    구글 시트 URL
                  </label>
                  <input
                    type="text"
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시트 이름 (선택사항)
                  </label>
                  <input
                    type="text"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    placeholder="MASSGOO"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                {importResult && (
                  <div className={`p-3 rounded-md ${importResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <p className="font-medium">{importResult.message}</p>
                    {importResult.count !== undefined && (
                      <p className="text-sm mt-1">
                        성공: {importResult.count}명 / 전체: {importResult.total}명
                      </p>
                    )}
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-2 text-sm">
                        <p className="font-semibold mb-1">오류 상세:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {importResult.errors.slice(0, 5).map((err: string, idx: number) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setImportMethod(null);
                      setGoogleSheetUrl('');
                      setSheetName('MASSGOO');
                      setImportResult(null);
                    }}
                    className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                  >
                    뒤로
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || !googleSheetUrl}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {importing ? '가져오는 중...' : '가져오기'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 고객 추가 모달 */}
      {showCreateModal && (
        <CustomerFormModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCustomers(1);
          }}
        />
      )}

      {/* 고객 수정 모달 */}
      {showEditModal && editingCustomer && (
        <CustomerFormModal
          mode="edit"
          customer={editingCustomer}
          onClose={() => {
            setShowEditModal(false);
            setEditingCustomer(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingCustomer(null);
            fetchCustomers(page);
          }}
        />
      )}
    </>
  );
}

// 고객 추가/수정 폼 모달 컴포넌트
function CustomerFormModal({ mode, customer, onClose, onSuccess }: {
  mode: 'create' | 'edit';
  customer?: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    try {
      return dateStr.substring(0, 10);
    } catch {
      return '';
    }
  };

  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [firstInquiryDate, setFirstInquiryDate] = useState(formatDate((customer as any)?.first_inquiry_date));
  const [firstPurchaseDate, setFirstPurchaseDate] = useState(formatDate(customer?.first_purchase_date));
  const [lastPurchaseDate, setLastPurchaseDate] = useState(formatDate(customer?.last_purchase_date));
  const [lastServiceDate, setLastServiceDate] = useState(formatDate((customer as any)?.last_service_date));
  const [lastContactDate, setLastContactDate] = useState(formatDate(customer?.last_contact_date));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('이름과 전화번호는 필수입니다.');
      return;
    }

    setSaving(true);
    try {
      const url = mode === 'create' ? '/api/admin/customers' : '/api/admin/customers';
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const body = mode === 'create' ? {
        name,
        phone,
        address: address || null,
        first_inquiry_date: firstInquiryDate || null,
        first_purchase_date: firstPurchaseDate || null,
        last_purchase_date: lastPurchaseDate || null,
        last_service_date: lastServiceDate || null,
        last_contact_date: lastContactDate || null,
      } : {
        id: customer!.id,
        update: {
          name,
          phone,
          address: address || null,
          first_inquiry_date: firstInquiryDate || null,
          first_purchase_date: firstPurchaseDate || null,
          last_purchase_date: lastPurchaseDate || null,
          last_service_date: lastServiceDate || null,
          last_contact_date: lastContactDate || null,
        }
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.success) {
        alert(mode === 'create' ? '고객이 추가되었습니다.' : '고객 정보가 수정되었습니다.');
        onSuccess();
      } else {
        alert(json.message || '저장 실패');
      }
    } catch (error: any) {
      alert(error.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'create' ? '고객 추가' : '고객 수정'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전화번호 *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="01012345678"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최초 문의일</label>
              <input
                type="date"
                value={firstInquiryDate}
                onChange={(e) => setFirstInquiryDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최초 구매일</label>
              <input
                type="date"
                value={firstPurchaseDate}
                onChange={(e) => setFirstPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">마지막 구매일</label>
              <input
                type="date"
                value={lastPurchaseDate}
                onChange={(e) => setLastPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">마지막 A/S 출고일</label>
              <input
                type="date"
                value={lastServiceDate}
                onChange={(e) => setLastServiceDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최근 연락일</label>
            <input
              type="date"
              value={lastContactDate}
              onChange={(e) => setLastContactDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '저장 중...' : mode === 'create' ? '추가' : '수정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


