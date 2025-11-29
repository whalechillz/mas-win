import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import AdminNav from '../../../components/admin/AdminNav';
import CustomerMessageHistoryModal from '../../../components/admin/CustomerMessageHistoryModal';
import { useRouter } from 'next/router';

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
  const router = useRouter();
  const [q, setQ] = useState('');
  const [onlyOptOut, setOnlyOptOut] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100); // 기본값 100개
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
  const [importResult, setImportResult] = useState<{success: boolean; message: string; count?: number; total?: number; errors?: string[]} | null>(null);
  const [updatingVipLevels, setUpdatingVipLevels] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedCustomerForImage, setSelectedCustomerForImage] = useState<Customer | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [pendingAutoEditPhone, setPendingAutoEditPhone] = useState<string | null>(null);

  const fetchCustomers = async (nextPage = page, searchOverride?: string) => {
    setLoading(true);
    const searchValue = typeof searchOverride === 'string' ? searchOverride : q;
    const params = new URLSearchParams({ q: searchValue, page: String(nextPage), pageSize: String(pageSize), sortBy, sortOrder });
    if (onlyOptOut) params.set('optout', 'true');
    const res = await fetch(`/api/admin/customers?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      setCustomers(json.data || []);
      // count가 0보다 큰 경우에만 업데이트 (0이면 이전 값 유지)
      if (json.count !== undefined && json.count !== null) {
        setCount(json.count);
        console.log('고객 목록 업데이트:', { count: json.count, page: json.page });
      }
      setPage(json.page || nextPage);
    }
    setLoading(false);
  };

  const normalizePhone = (phone?: string | null) => phone ? phone.replace(/[^0-9]/g, '') : '';

  // 초기 로드 & URL 파라미터 반영
  useEffect(() => {
    if (!router.isReady) return;
    const phoneParam = typeof router.query.phone === 'string' ? router.query.phone : undefined;
    const queryParam = typeof router.query.q === 'string' ? router.query.q : undefined;
    const searchValue = phoneParam || queryParam || '';

    if (searchValue && searchValue !== q) {
      setQ(searchValue);
      fetchCustomers(1, searchValue);
    } else if (!searchValue && q) {
      setQ('');
      fetchCustomers(1, '');
    } else if (!searchValue) {
      fetchCustomers(1);
    }

    if (router.query.autoEdit === 'true' && phoneParam) {
      setPendingAutoEditPhone(phoneParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.autoEdit, router.query.phone, router.query.q]);

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

  const handleEdit = useCallback((c: Customer) => {
    setEditingCustomer(c);
    setShowEditModal(true);
  }, []);

  // URL 파라미터 autoEdit 처리
  useEffect(() => {
    if (!pendingAutoEditPhone || customers.length === 0) return;
    const normalizedTarget = normalizePhone(pendingAutoEditPhone);
    const target = customers.find(c => normalizePhone(c.phone) === normalizedTarget);
    if (target) {
      handleEdit(target);
      setPendingAutoEditPhone(null);
    }
  }, [customers, pendingAutoEditPhone, handleEdit]);

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

  // 최근 연락 날짜 포맷팅 (날짜만 표시)
  const formatContactDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      // 날짜만 표시 (시간 제거)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">고객 관리</h1>
              <p className="text-sm text-gray-600 mt-1">총 {count.toLocaleString()}명</p>
            </div>
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
                <option value={100}>100개씩</option>
                <option value={500}>500개씩</option>
                <option value={1000}>1000개씩</option>
              </select>
              <button
                onClick={async () => {
                  setUpdatingVipLevels(true);
                  try {
                    const res = await fetch('/api/admin/customers/update-vip-levels', { method: 'POST' });
                    const json = await res.json();
                    if (json.success) {
                      alert(`VIP 레벨 업데이트 완료!\n${json.message}\n\n분포:\n- Platinum: ${json.stats?.distribution?.platinum || 0}명\n- Gold: ${json.stats?.distribution?.gold || 0}명\n- Silver: ${json.stats?.distribution?.silver || 0}명\n- Bronze: ${json.stats?.distribution?.bronze || 0}명\n- 비구매자: ${json.stats?.distribution?.noPurchase || 0}명`);
                      fetchCustomers(1);
                    } else {
                      alert('VIP 레벨 업데이트 실패: ' + json.message);
                    }
                  } catch (error) {
                    console.error('VIP 레벨 업데이트 오류:', error);
                    alert('VIP 레벨 업데이트 중 오류가 발생했습니다.');
                  } finally {
                    setUpdatingVipLevels(false);
                  }
                }}
                disabled={updatingVipLevels}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {updatingVipLevels ? '업데이트 중...' : '⭐ VIP 레벨 자동 업데이트'}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                ➕ 고객 추가
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                📥 고객 데이터 가져오기
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
                        <button 
                          onClick={() => {
                            setSelectedCustomerForImage(c);
                            setShowImageModal(true);
                          }} 
                          className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                        >
                          이미지
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomerForHistory(c);
                            setShowHistoryModal(true);
                          }}
                          className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          📱 메시지
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
            <div>총 {count.toLocaleString()}명</div>
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

      {/* 고객 이미지 업로드 모달 */}
      {showImageModal && selectedCustomerForImage && (
        <CustomerImageModal
          customer={selectedCustomerForImage}
          onClose={() => {
            setShowImageModal(false);
            setSelectedCustomerForImage(null);
          }}
        />
      )}

      {/* 고객 메시지 이력 모달 */}
      {showHistoryModal && selectedCustomerForHistory && (
        <CustomerMessageHistoryModal
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedCustomerForHistory(null);
          }}
          customer={selectedCustomerForHistory}
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

// 고객 이미지 업로드 모달 컴포넌트
function CustomerImageModal({ customer, onClose }: {
  customer: Customer;
  onClose: () => void;
}) {
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // 고객 이미지 목록 로드
  const loadCustomerImages = async () => {
    setLoadingImages(true);
    try {
      const response = await fetch(`/api/admin/upload-customer-image?customerId=${customer.id}`);
      const result = await response.json();
      if (result.success) {
        setUploadedImages(result.images || []);
      }
    } catch (error) {
      console.error('이미지 목록 로드 실패:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  useEffect(() => {
    loadCustomerImages();
  }, [customer.id]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      // Supabase 클라이언트 초기화
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
      }
      const sb = createClient(supabaseUrl, supabaseAnonKey);

      // 고객 ID를 customer-001 형식으로 변환
      const customerId = `customer-${String(customer.id).padStart(3, '0')}`;
      const folderPath = `originals/customers/${customerId}/${visitDate}`;

      // 파일명 정리
      const baseName = (file.name || 'upload').replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/\s+/g, '_');
      const ts = Date.now();
      const objectPath = `${folderPath}/${ts}_${baseName}`;

      // 서명 업로드 URL 발급
      const res = await fetch('/api/admin/storage-signed-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: objectPath })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '서명 URL 발급 실패');
      }

      const { token } = await res.json();

      // Supabase SDK로 업로드
      const { error: uploadError } = await sb.storage
        .from('blog-images')
        .uploadToSignedUrl(objectPath, token, file);

      if (uploadError) {
        throw new Error(`업로드 실패: ${uploadError.message}`);
      }

      // 공개 URL 가져오기
      const { data: publicUrlData } = sb.storage
        .from('blog-images')
        .getPublicUrl(objectPath);
      const publicUrl = publicUrlData?.publicUrl;

      if (!publicUrl) {
        throw new Error('공개 URL을 가져올 수 없습니다.');
      }

      // 고객 이미지 메타데이터 저장
      const saveResponse = await fetch('/api/admin/upload-customer-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          customerName: customer.name,
          visitDate: visitDate,
          imageUrl: publicUrl,
          filePath: objectPath,
          fileName: file.name,
          fileSize: file.size
        })
      });

      if (!saveResponse.ok) {
        throw new Error('메타데이터 저장 실패');
      }

      alert('이미지 업로드 완료');
      loadCustomerImages(); // 이미지 목록 새로고침
    } catch (error: any) {
      console.error('❌ 이미지 업로드 오류:', error);
      alert(`업로드 실패: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            고객 이미지 관리: {customer.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-6">
          {/* 방문일자 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              방문일자 *
            </label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* 파일 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지/영상 업로드
            </label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  await handleFileUpload(files[0]);
                }
              }}
            >
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                className="hidden"
                id="customer-image-upload"
              />
              <label htmlFor="customer-image-upload" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400 hover:text-blue-500 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  이미지/영상 파일을 선택하거나 드래그하세요
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  PNG, JPG, GIF, HEIC, MP4 파일 지원
                </span>
              </label>
            </div>
            {uploading && (
              <div className="mt-2 text-sm text-blue-600">업로드 중...</div>
            )}
          </div>

          {/* 업로드된 이미지 목록 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              업로드된 이미지 ({uploadedImages.length}개)
            </h3>
            {loadingImages ? (
              <div className="text-center py-8 text-gray-500">로딩 중...</div>
            ) : uploadedImages.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {uploadedImages.map((img: any, index: number) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {img.imageUrl && (
                        <img
                          src={img.imageUrl}
                          alt={img.fileName || '고객 이미지'}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-600 truncate" title={img.visitDate}>
                      {img.visitDate}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                업로드된 이미지가 없습니다.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}


