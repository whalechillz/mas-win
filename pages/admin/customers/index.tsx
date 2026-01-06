import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import AdminNav from '../../../components/admin/AdminNav';
import CustomerMessageHistoryModal from '../../../components/admin/CustomerMessageHistoryModal';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { uploadImageToSupabase } from '../../../lib/image-upload-utils';

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
  // 최신 설문 정보
  latest_survey_date?: string | null;
  latest_selected_model?: string | null;
  latest_important_factors?: string[] | null;
  latest_additional_feedback?: string | null;
  survey_count?: number | null;
  // 최신 시타 예약 정보
  latest_booking_date?: string | null;
  latest_club_brand?: string | null;
  latest_club_loft?: number | null;
  latest_club_shaft?: string | null;
  latest_trajectory?: string | null;
  latest_shot_shape?: string | null;
  latest_current_distance?: number | null;
  booking_count?: number | null;
  // 통합 프로필
  preferred_trajectory?: string | null;
  typical_shot_shape?: string | null;
  avg_distance?: number | null;
  // 이력 통계
  last_consultation_date?: string | null;
  last_service_date?: string | null;
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
  const [showGiftsModal, setShowGiftsModal] = useState(false);
  const [selectedCustomerForGifts, setSelectedCustomerForGifts] = useState<Customer | null>(null);
  const [pendingAutoEditPhone, setPendingAutoEditPhone] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedCustomerForInfo, setSelectedCustomerForInfo] = useState<Customer | null>(null);
  const [showMessageSendModal, setShowMessageSendModal] = useState(false);

  const fetchCustomers = async (nextPage = page, searchOverride?: string) => {
    setLoading(true);
    const searchValue = typeof searchOverride === 'string' ? searchOverride : q;
    const params = new URLSearchParams({ q: searchValue, page: String(nextPage), pageSize: String(pageSize), sortBy, sortOrder });
    if (onlyOptOut) params.set('optout', 'true');
    const res = await fetch(`/api/admin/customers?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      let customersData = json.data || [];
      
      // last_contact_date로 정렬할 때는 NULL 값을 맨 아래로
      if (sortBy === 'last_contact_date') {
        const withDate = customersData.filter((c: Customer) => c.last_contact_date);
        const withoutDate = customersData.filter((c: Customer) => !c.last_contact_date);
        
        // 날짜가 있는 것들을 먼저 정렬
        withDate.sort((a: Customer, b: Customer) => {
          const dateA = new Date(a.last_contact_date || 0).getTime();
          const dateB = new Date(b.last_contact_date || 0).getTime();
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
        
        // NULL인 것들을 맨 아래로
        customersData = [...withDate, ...withoutDate];
      }
      
      setCustomers(customersData);
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
                  <th className="p-2 text-left">설문</th>
                  <th className="p-2 text-left">시타예약</th>
                  <th className="p-2 text-left">수신거부</th>
                  <th className="p-2 text-left">액션</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">
                      <button
                        onClick={() => {
                          setSelectedCustomerForInfo(c);
                          setShowInfoModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="p-2">{formatPhone(c.phone)}</td>
                    <td className="p-2">{c.vip_level || 'NONE'}</td>
                    <td className="p-2">{formatDate((c as any).first_purchase_date)}</td>
                    <td className="p-2">{formatDate(c.last_purchase_date)}</td>
                    <td className="p-2">{formatDate((c as any).last_service_date)}</td>
                    <td className="p-2">{formatContactDate(c.last_contact_date)}</td>
                    <td className="p-2">
                      {c.latest_selected_model ? (
                        <span className="text-xs" title={`${c.survey_count || 0}회, ${c.latest_survey_date ? new Date(c.latest_survey_date).toLocaleDateString('ko-KR') : ''}`}>
                          📝 {c.latest_selected_model}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-2">
                      {c.latest_booking_date ? (
                        <span className="text-xs" title={`${c.booking_count || 0}회, ${c.latest_club_brand || ''} ${c.latest_club_loft ? c.latest_club_loft + '°' : ''} ${c.latest_club_shaft || ''}`}>
                          🏌️ {new Date(c.latest_booking_date).toLocaleDateString('ko-KR')}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
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
                        <button
                          onClick={() => {
                            setSelectedCustomerForGifts(c);
                            setShowGiftsModal(true);
                          }}
                          className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          🎁 선물
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
                  <tr><td className="p-4 text-center text-gray-500" colSpan={11}>{loading ? '로딩 중...' : '데이터 없음'}</td></tr>
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

      {/* 고객 선물 / 굿즈 히스토리 모달 */}
      {showGiftsModal && selectedCustomerForGifts && (
        <CustomerGiftsModal
          customer={selectedCustomerForGifts}
          onClose={async () => {
            setShowGiftsModal(false);
            setSelectedCustomerForGifts(null);
            // 선물 지급이 구매/방문과 연결될 수 있으니 목록 새로고침
            await fetchCustomers(page);
          }}
        />
      )}

      {/* 고객 기본 정보 모달 */}
      {showInfoModal && selectedCustomerForInfo && (
        <CustomerInfoModal
          customer={selectedCustomerForInfo}
          onClose={() => {
            setShowInfoModal(false);
            setSelectedCustomerForInfo(null);
          }}
          onSendMessage={() => {
            setShowInfoModal(false);
            setShowMessageSendModal(true);
          }}
        />
      )}

      {/* 고객 메시지 발송 모달 */}
      {showMessageSendModal && selectedCustomerForInfo && (
        <CustomerMessageSendModal
          customer={selectedCustomerForInfo}
          onClose={() => {
            setShowMessageSendModal(false);
            setSelectedCustomerForInfo(null);
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
      // ISO 문자열을 KST 기준으로 파싱하여 날짜만 추출
      const date = new Date(dateStr);
      // KST 오프셋(+9시간)을 고려하여 날짜 추출
      const kstYear = date.getFullYear();
      const kstMonth = String(date.getMonth() + 1).padStart(2, '0');
      const kstDay = String(date.getDate()).padStart(2, '0');
      return `${kstYear}-${kstMonth}-${kstDay}`;
    } catch {
      // fallback: 원래 방식
      return dateStr.substring(0, 10);
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

  // 날짜 문자열(YYYY-MM-DD)을 KST 자정 ISO로 변환하여 UTC 저장 시 날짜가 당겨지지 않도록 처리
  const toKstIso = (dateStr?: string | null) =>
    dateStr ? new Date(`${dateStr}T00:00:00+09:00`).toISOString() : null;

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
      first_inquiry_date: toKstIso(firstInquiryDate),
      first_purchase_date: toKstIso(firstPurchaseDate),
      last_purchase_date: toKstIso(lastPurchaseDate),
      last_service_date: toKstIso(lastServiceDate),
      last_contact_date: toKstIso(lastContactDate),
    } : {
      id: customer!.id,
      update: {
        name,
        phone,
        address: address || null,
        first_inquiry_date: toKstIso(firstInquiryDate),
        first_purchase_date: toKstIso(firstPurchaseDate),
        last_purchase_date: toKstIso(lastPurchaseDate),
        last_service_date: toKstIso(lastServiceDate),
        last_contact_date: toKstIso(lastContactDate),
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMode, setUploadMode] = useState<'optimize-filename' | 'preserve-filename'>('optimize-filename');
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

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    if (!visitDate) {
      alert('방문일자를 선택해주세요.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 고객 ID를 customer-001 형식으로 변환
      const customerId = `customer-${String(customer.id).padStart(3, '0')}`;
      const targetFolder = `originals/customers/${customerId}/${visitDate}`;
      
      let successCount = 0;
      let failCount = 0;

      // 모든 파일을 순차적으로 업로드
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          // 공통 업로드 함수 사용
          const uploadResult = await uploadImageToSupabase(file, {
            targetFolder: targetFolder,
            enableHEICConversion: true,
            enableEXIFBackfill: true,
            uploadMode: uploadMode,
            onProgress: (progress) => {
              // 전체 진행률 계산 (각 파일의 평균)
              const totalProgress = ((i * 100) + progress) / files.length;
              setUploadProgress(Math.round(totalProgress));
            },
          });

          // 업로드된 URL에서 파일 경로 추출
          const urlObj = new URL(uploadResult.url);
          const filePath = urlObj.pathname.replace('/storage/v1/object/public/blog-images/', '');

          // 고객 이미지 메타데이터 저장
          const saveResponse = await fetch('/api/admin/upload-customer-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerId: customer.id,
              customerName: customer.name,
              visitDate: visitDate,
              imageUrl: uploadResult.url,
              filePath: filePath,
              fileName: uploadResult.fileName || file.name,
              fileSize: uploadResult.metadata?.file_size || file.size
            })
          });

          if (!saveResponse.ok) {
            throw new Error('메타데이터 저장 실패');
          }

          successCount++;
          console.log(`✅ 파일 ${i + 1}/${files.length} 업로드 완료:`, uploadResult.fileName || file.name);
        } catch (fileError: any) {
          failCount++;
          console.error(`❌ 파일 ${i + 1}/${files.length} 업로드 실패:`, file.name, fileError);
        }
      }

      // 결과 알림
      if (failCount === 0) {
        alert(`${successCount}개 파일 업로드 완료!`);
      } else {
        alert(`업로드 완료: ${successCount}개 성공, ${failCount}개 실패`);
      }

      // 이미지 목록 새로고침
      if (successCount > 0) {
        loadCustomerImages();
      }
    } catch (error: any) {
      console.error('❌ 업로드 오류:', error);
      alert(`업로드 실패: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            고객 이미지 관리: {customer.name}
          </h2>
          <button 
            onClick={onClose} 
            disabled={uploading}
            className={`text-gray-400 hover:text-gray-600 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >✕</button>
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
              disabled={uploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* 업로드 모드 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              업로드 모드
            </label>
            <div className="space-y-2">
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="uploadMode"
                  value="optimize-filename"
                  checked={uploadMode === 'optimize-filename'}
                  onChange={(e) => setUploadMode('optimize-filename')}
                  disabled={uploading}
                  className="mt-1 mr-2 w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <span className="text-sm text-gray-700 font-medium">파일명 최적화 (기본)</span>
                  <p className="text-xs text-gray-500 mt-1">
                    파일명: 폴더 기반 최적화 + 타임스탬프 + 중복방지<br/>
                    확장자: 원본 유지<br/>
                    최적화: 없음 (원본 그대로)
                  </p>
                </div>
              </label>
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="uploadMode"
                  value="preserve-filename"
                  checked={uploadMode === 'preserve-filename'}
                  onChange={(e) => setUploadMode('preserve-filename')}
                  disabled={uploading}
                  className="mt-1 mr-2 w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <span className="text-sm text-gray-700 font-medium">파일명 유지</span>
                  <p className="text-xs text-gray-500 mt-1">
                    파일명: 원본 그대로<br/>
                    확장자: 원본 유지<br/>
                    최적화: 없음 (원본 그대로)
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 파일 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지/영상 업로드
            </label>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                uploading 
                  ? 'border-gray-200 bg-gray-50 pointer-events-none opacity-50' 
                  : 'border-gray-300 hover:border-blue-400'
              }`}
              onDragOver={(e) => {
                if (uploading) return;
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={async (e) => {
                if (uploading) return;
                e.preventDefault();
                e.stopPropagation();
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                  await handleFileUpload(files);
                }
              }}
            >
              <input
                type="file"
                multiple
                disabled={uploading}
                accept="image/*,video/*,.heic,.heif"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    handleFileUpload(files);
                  }
                }}
                className="hidden"
                id="customer-image-upload"
              />
              <label htmlFor="customer-image-upload" className={`cursor-pointer ${uploading ? 'pointer-events-none' : ''}`}>
                <svg className="mx-auto h-12 w-12 text-gray-400 hover:text-blue-500 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  파일 선택 또는 드래그
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  이미지: PNG, JPG, GIF, HEIC | 동영상: MP4, AVI, MOV, WEBM
                </span>
              </label>
            </div>

            {/* 업로드 진행률 */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">업로드 중...</span>
                  <span className="text-xs text-gray-500">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploading && uploadProgress === 0 && (
              <div className="mt-2 text-sm text-blue-600 text-center">처리 중...</div>
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
            disabled={uploading}
            className={`px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}


// 고객 선물 / 굿즈 히스토리 모달 컴포넌트
function CustomerGiftsModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [giftProducts, setGiftProducts] = useState<
    { id: number; name: string; sku?: string | null }[]
  >([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productId, setProductId] = useState<number | null>(null);
  const [giftText, setGiftText] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [deliveryType, setDeliveryType] = useState<'in_person' | 'courier' | 'etc'>('in_person');
  const [deliveryStatus, setDeliveryStatus] = useState<'pending' | 'sent' | 'canceled'>('pending');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [note, setNote] = useState('');
  const [editingGiftId, setEditingGiftId] = useState<number | null>(null);
  const [giftType, setGiftType] =
    useState<'normal' | 'event' | 'promo'>('normal');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // 사은품으로 표시된 상품 목록
        const productsRes = await fetch('/api/admin/products?isGift=true');
        const productsJson = await productsRes.json();
        if (productsJson.success) {
          setGiftProducts(productsJson.products || []);
        }
        // 고객 선물 히스토리
        const giftsRes = await fetch(`/api/admin/customer-gifts?customerId=${customer.id}`);
        const giftsJson = await giftsRes.json();
        if (giftsJson.success) {
          setGifts(giftsJson.gifts || []);
        }
      } catch (error) {
        console.error('고객 선물 정보 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [customer.id]);

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId && !giftText) {
      alert('사은품을 선택하거나 메모를 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const isEdit = editingGiftId !== null;
      const url = isEdit ? '/api/admin/customer-gifts' : '/api/admin/customer-gifts';
      const method = isEdit ? 'PUT' : 'POST';
      const body: any = {
        customer_id: customer.id,
        product_id: productId,
        gift_text: giftText || null,
        quantity,
        delivery_type: deliveryType,
        delivery_status: deliveryStatus,
        delivery_date: deliveryDate || null,
        note: note || null,
        gift_type: giftType,
      };
      if (isEdit) {
        body.id = editingGiftId;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.message || '선물 기록 저장에 실패했습니다.');
        return;
      }
      // 목록 다시 로드
      const giftsRes = await fetch(`/api/admin/customer-gifts?customerId=${customer.id}`);
      const giftsJson = await giftsRes.json();
      if (giftsJson.success) {
        setGifts(giftsJson.gifts || []);
      }
      // 폼 초기화
      setProductId(null);
      setGiftText('');
      setQuantity(1);
      setDeliveryType('in_person');
      setDeliveryStatus('pending');
      setDeliveryDate('');
      setNote('');
      setEditingGiftId(null);
      setGiftType('normal');
      alert(isEdit ? '선물 기록이 수정되었습니다.' : '선물 기록이 추가되었습니다.');
    } catch (error: any) {
      console.error('선물 기록 저장 오류:', error);
      alert(error.message || '선물 기록 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const formatDelivery = (g: any) => {
    const typeLabel =
      g.delivery_type === 'courier'
        ? '택배'
        : g.delivery_type === 'etc'
        ? '기타'
        : '직접수령';
    const statusLabel =
      g.delivery_status === 'sent'
        ? '발송 완료'
        : g.delivery_status === 'canceled'
        ? '취소'
        : '대기';
    return `${typeLabel} / ${statusLabel}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              선물 / 굿즈 히스토리 - {customer.name}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              설문/방문 시 제공한 모자, 버킷햇, 공, 커스터마이징팩 등의 지급 이력을 관리합니다.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">지급 이력</h3>
          {loading ? (
            <div className="py-4 text-sm text-gray-500">로딩 중...</div>
          ) : gifts.length === 0 ? (
            <div className="py-4 text-sm text-gray-500">등록된 선물 기록이 없습니다.</div>
          ) : (
            <table className="w-full text-xs border rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">날짜</th>
                  <th className="p-2 text-left">사은품</th>
                  <th className="p-2 text-left">수량</th>
                  <th className="p-2 text-left">배송/상태</th>
                  <th className="p-2 text-left">메모</th>
                  <th className="p-2 text-left">관리</th>
                </tr>
              </thead>
              <tbody>
                {gifts.map((g) => (
                  <tr key={g.id} className="border-t">
                    <td className="p-2">
                      {g.delivery_date
                        ? new Date(g.delivery_date).toLocaleDateString('ko-KR')
                        : '-'}
                    </td>
                    <td className="p-2">
                      <div className="font-medium text-gray-900">
                        {g.products?.name || g.gift_text || '사은품'}
                      </div>
                      {g.products?.sku && (
                        <div className="text-[10px] text-gray-500">{g.products.sku}</div>
                      )}
                      {g.gift_type === 'event' && (
                        <span className="mt-1 inline-flex px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px]">
                          🎯 이벤트 경품
                        </span>
                      )}
                      {g.gift_type === 'promo' && (
                        <span className="mt-1 inline-flex px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px]">
                          📢 프로모션
                        </span>
                      )}
                    </td>
                    <td className="p-2">{g.quantity}</td>
                    <td className="p-2">{formatDelivery(g)}</td>
                    <td className="p-2">{g.note || '-'}</td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="px-2 py-1 text-[11px] bg-blue-500 text-white rounded hover:bg-blue-600"
                          onClick={() => {
                            setEditingGiftId(g.id);
                            setProductId(g.product_id ?? null);
                            setGiftText(g.gift_text || '');
                            setQuantity(g.quantity || 1);
                            setDeliveryType(
                              (g.delivery_type as 'in_person' | 'courier' | 'etc') || 'in_person',
                            );
                            setDeliveryStatus(
                              (g.delivery_status as 'pending' | 'sent' | 'canceled') || 'pending',
                            );
                            setDeliveryDate(g.delivery_date || '');
                            setNote(g.note || '');
                            setGiftType(
                              (g.gift_type as 'normal' | 'event' | 'promo') || 'normal',
                            );
                          }}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 text-[11px] bg-red-500 text-white rounded hover:bg-red-600"
                          onClick={async () => {
                            if (!confirm('이 선물 기록을 삭제하시겠습니까?')) {
                              return;
                            }
                            try {
                              const res = await fetch(`/api/admin/customer-gifts?id=${g.id}`, {
                                method: 'DELETE',
                              });
                              const json = await res.json();
                              if (!json.success) {
                                alert(json.message || '삭제에 실패했습니다.');
                                return;
                              }
                              setGifts((prev) => prev.filter((item) => item.id !== g.id));
                              if (editingGiftId === g.id) {
                                setEditingGiftId(null);
                              }
                            } catch (error: any) {
                              console.error('선물 기록 삭제 오류:', error);
                              alert(error.message || '선물 기록 삭제 중 오류가 발생했습니다.');
                            }
                          }}
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

        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">새 선물 기록 추가</h3>
          <form onSubmit={handleAddGift} className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  사은품 선택
                </label>
                <select
                  value={productId ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    const id = v ? Number(v) : null;
                    setProductId(id);
                    if (id && !giftText) {
                      const p = giftProducts.find((gp) => gp.id === id);
                      if (p) setGiftText(p.name);
                    }
                  }}
                  className="w-full px-2 py-1.5 border rounded-md"
                >
                  <option value="">선택 안 함</option>
                  {giftProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.sku ? `(${p.sku})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  기타 메모 (색/사이즈, 상세명 등)
                </label>
                <input
                  type="text"
                  value={giftText}
                  onChange={(e) => setGiftText(e.target.value)}
                  className="w-full px-2 py-1.5 border rounded-md"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">수량</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-2 py-1.5 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  전달 방식
                </label>
                <select
                  value={deliveryType}
                  onChange={(e) =>
                    setDeliveryType(e.target.value as 'in_person' | 'courier' | 'etc')
                  }
                  className="w-full px-2 py-1.5 border rounded-md"
                >
                  <option value="in_person">직접수령</option>
                  <option value="courier">택배 발송</option>
                  <option value="etc">기타</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  상태
                </label>
                <select
                  value={deliveryStatus}
                  onChange={(e) =>
                    setDeliveryStatus(e.target.value as 'pending' | 'sent' | 'canceled')
                  }
                  className="w-full px-2 py-1.5 border rounded-md"
                >
                  <option value="pending">대기</option>
                  <option value="sent">발송/지급 완료</option>
                  <option value="canceled">취소</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  지급일
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-2 py-1.5 border rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                선물 유형
              </label>
              <select
                value={giftType}
                onChange={(e) =>
                  setGiftType(e.target.value as 'normal' | 'event' | 'promo')
                }
                className="w-full px-2 py-1.5 border rounded-md"
              >
                <option value="normal">일반 선물 / 시타 사은품</option>
                <option value="event">이벤트 경품 (추첨/프로모션)</option>
                <option value="promo">프로모션/기타</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">비고</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-2 py-1.5 border rounded-md"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border rounded-md text-xs hover:bg-gray-50"
              >
                닫기
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? '저장 중...'
                  : editingGiftId
                  ? '선물 기록 수정'
                  : '선물 기록 추가'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 고객 기본 정보 모달 컴포넌트
function CustomerInfoModal({ customer, onClose, onSendMessage }: {
  customer: Customer;
  onClose: () => void;
  onSendMessage: () => void;
}) {
  // 전화번호 포맷팅
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">고객 정보</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-4">
          {/* 고객 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <div className="text-gray-900">{customer.name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
              <div className="text-gray-900">{formatPhone(customer.phone)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
              <div className="text-gray-900">{customer.address || '-'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VIP 레벨</label>
              <div className="text-gray-900">{customer.vip_level || 'NONE'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최초 구매일</label>
              <div className="text-gray-900">{formatDate(customer.first_purchase_date)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">마지막 구매일</label>
              <div className="text-gray-900">{formatDate(customer.last_purchase_date)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최근 연락일</label>
              <div className="text-gray-900">{formatDate(customer.last_contact_date)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">수신거부</label>
              <div className="text-gray-900">{customer.opt_out ? '예' : '아니오'}</div>
            </div>
          </div>

          {/* 시타사이트&약도 버튼 */}
          <div className="flex gap-2 pt-4 border-t">
            <a
              href="https://www.masgolf.co.kr/try-a-massgoo"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              시타사이트&약도
            </a>
            <button
              onClick={onSendMessage}
              className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            >
              메시지 발송
            </button>
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

// 고객 메시지 발송 모달 컴포넌트
function CustomerMessageSendModal({ customer, onClose }: {
  customer: Customer;
  onClose: () => void;
}) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledHour, setScheduledHour] = useState(10);
  const [scheduledMinute, setScheduledMinute] = useState(0);
  const [sending, setSending] = useState(false);

  // datetime-local 입력값을 UTC ISO 문자열로 변환 (한국 시간 기준) - 기존 시스템과 동일
  const convertLocalInputToUTC = (dateStr: string, hour: number, minute: number) => {
    if (!dateStr) return null;
    // 한국 시간대(UTC+9)를 명시적으로 지정
    const kstString = `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`;
    const kstDate = new Date(kstString);
    if (Number.isNaN(kstDate.getTime())) return null;
    // toISOString()이 자동으로 UTC로 변환 (9시간 빼짐)
    return kstDate.toISOString();
  };

  // 메시지 템플릿
  const messageTemplate = `친애하는 ${customer.name} 고객님, 

안녕하세요! 마쓰구골프입니다.
요청하신 최대 비거리 드라이버 시타 예약과 관련하여 마쓰구 수원본점 방문 안내를 드립니다. 

고객님께서 편하게 방문하실 수 있도록 최선을 다해 준비하겠습니다. 
궁금하신 사항이 있으시면 언제든지 연락 주세요.

▶ 시타 예약: https://www.masgolf.co.kr/try-a-massgoo
▶ 약도 안내: https://www.masgolf.co.kr/contact 

☎ 마쓰구 수원본점
수원시 영통구 법조로149번길 200 마스골프
TEL 031-215-0013
무료 080-028-8888 (무료 상담)
OPEN 09:00~17:00(월~금)`;

  // 메시지 발송 처리
  const handleSend = async () => {
    // 수신거부 확인
    if (customer.opt_out) {
      if (!confirm('이 고객은 수신거부 상태입니다. 그래도 발송하시겠습니까?')) {
        return;
      }
    }

    setSending(true);
    try {
      // 전화번호 정규화
      const phone = customer.phone.replace(/[\s\-]/g, '');
      if (!phone || !/^010\d{8}$/.test(phone)) {
        alert('유효한 전화번호가 아닙니다.');
        setSending(false);
        return;
      }

      // 예약 발송 시간 계산
      const scheduledAt = scheduledDate ? convertLocalInputToUTC(scheduledDate, scheduledHour, scheduledMinute) : null;

      if (scheduledAt) {
        // 예약 발송: 현재 시간보다 미래인지 확인
        const now = new Date();
        const scheduledDateObj = new Date(scheduledAt);
        if (scheduledDateObj <= now) {
          alert('예약 시간은 현재 시간보다 미래여야 합니다.');
          setSending(false);
          return;
        }
      }

      // 1단계: 메시지를 DB에 저장
      const saveResponse = await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageTemplate,
          type: 'LMS', // LMS로 고정
          status: scheduledAt ? 'draft' : 'draft', // 일단 draft로 저장 (즉시 발송도 먼저 저장 후 발송)
          recipientNumbers: [phone],
          scheduledAt: scheduledAt || undefined,
          note: `고객 메시지 발송: ${customer.name} (${customer.id})`
        })
      });

      const saveResult = await saveResponse.json();
      if (!saveResult.success) {
        alert(saveResult.message || '메시지 저장 실패');
        setSending(false);
        return;
      }

      const channelPostId = saveResult.smsId || saveResult.smsContent?.id;
      if (!channelPostId) {
        alert('메시지 ID를 가져올 수 없습니다.');
        setSending(false);
        return;
      }

      // 2단계: 예약 발송이 아닌 경우 즉시 발송
      if (!scheduledAt) {
        try {
          const sendResponse = await fetch('/api/channels/sms/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channelPostId: channelPostId,
              messageType: 'LMS',
              messageText: messageTemplate,
              content: messageTemplate,
              recipientNumbers: [phone]
            })
          });

          const sendResult = await sendResponse.json();
          
          if (sendResponse.ok && (sendResult.success || sendResult.result?.successCount > 0)) {
            alert('메시지가 발송되었습니다.');
            onClose();
          } else {
            alert(sendResult.message || '발송 실패');
          }
        } catch (sendError: any) {
          console.error('메시지 발송 오류:', sendError);
          alert('메시지는 저장되었지만 발송 중 오류가 발생했습니다: ' + (sendError.message || '알 수 없는 오류'));
        }
      } else {
        // 예약 발송인 경우
        alert('예약 발송이 설정되었습니다.');
        onClose();
      }
    } catch (error: any) {
      console.error('메시지 발송 오류:', error);
      alert(error.message || '발송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  // 날짜는 선택 사항이므로 기본값 설정하지 않음 (즉시 발송 가능)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">LMS 발송</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="space-y-4">
          {/* 고객 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">고객명</label>
              <div className="text-gray-900">{customer.name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
              <div className="text-gray-900">{customer.phone}</div>
            </div>
          </div>

          {/* 예약 발송 일시 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">알림톡 발송일시</label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
              <select
                value={scheduledHour}
                onChange={(e) => setScheduledHour(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-md"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i}시</option>
                ))}
              </select>
              <select
                value={scheduledMinute}
                onChange={(e) => setScheduledMinute(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-md"
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                  <option key={m} value={m}>{m}분</option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              날짜를 선택하지 않으면 즉시 발송됩니다.
            </p>
          </div>

          {/* 메시지 미리보기 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">알림톡 미리보기</label>
            <div className="border rounded-lg p-4 bg-gray-50 whitespace-pre-wrap text-sm max-h-96 overflow-y-auto">
              {messageTemplate}
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
          >
            닫기
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? '발송 중...' : '전송'}
          </button>
        </div>
      </div>
    </div>
  );
}

