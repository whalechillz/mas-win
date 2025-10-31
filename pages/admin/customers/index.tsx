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
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMethod, setImportMethod] = useState<'csv' | 'google' | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [sheetName, setSheetName] = useState('MASSGOO');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{success: boolean; message: string; count?: number; total?: number; errors?: string[]} | null>(null);

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
                placeholder="이름/번호/주소 검색"
                className="px-3 py-2 border rounded-md"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={onlyOptOut} onChange={() => setOnlyOptOut(!onlyOptOut)} />
                수신거부만
              </label>
              <button onClick={() => fetchCustomers(1)} className="px-4 py-2 bg-blue-600 text-white rounded">검색</button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                📥 고객 데이터 가져오기
              </button>
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
    </>
  );
}


