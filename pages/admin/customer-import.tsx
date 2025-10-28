import React, { useState } from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';
import { useSession } from 'next-auth/react';

export default function CustomerImport() {
  const { data: session, status } = useSession();
  const [googleSheetUrl, setGoogleSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1MUvJyKGXFBZLUCuSnuOjZMjQqkSi5byu9d7u4O6uf9w/edit?pli=1&gid=0#gid=0');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [sheetName, setSheetName] = useState('마쓰구골프');

  if (status === 'loading') {
    return <div>로딩 중...</div>;
  }

  if (!session) {
    return <div>로그인이 필요합니다.</div>;
  }

  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const response = await fetch('/api/admin/import-customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleSheetUrl: googleSheetUrl,
          sheetName: sheetName
        })
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        setCustomers(result.customers || []);
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: '고객 데이터 가져오기 중 오류가 발생했습니다.',
        error: error.message
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCsvUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/import-customers', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        setCustomers(result.customers || []);
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: 'CSV 파일 업로드 중 오류가 발생했습니다.',
        error: error.message
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <Head>
        <title>고객 DB 마이그레이션 - MASGOLF</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">고객 DB 마이그레이션</h1>
            <p className="mt-2 text-gray-600">구글 시트 또는 CSV 파일에서 고객 데이터를 가져옵니다</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 구글 시트 연동 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">구글 시트 연동</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    구글 시트 URL
                  </label>
                  <input
                    type="url"
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시트 이름
                  </label>
                  <input
                    type="text"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="마쓰구골프"
                  />
                  <p className="text-xs text-gray-500 mt-1">기본값: 마쓰구골프</p>
                </div>

                <button
                  onClick={handleImport}
                  disabled={isImporting || !googleSheetUrl}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? '가져오는 중...' : '구글 시트에서 가져오기'}
                </button>
              </div>
            </div>

            {/* CSV 업로드 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">CSV 파일 업로드</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSV 파일 선택
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="text-sm text-gray-600">
                  <p className="font-medium">CSV 형식:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>첫 번째 행: 고객명</li>
                    <li>두 번째 행: 전화번호</li>
                    <li>구분자: 쉼표(,)</li>
                    <li>인코딩: UTF-8</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 결과 표시 */}
          {importResult && (
            <div className="mt-8">
              <div className={`rounded-lg p-4 ${
                importResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <h3 className={`font-semibold ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {importResult.success ? '✅ 성공' : '❌ 실패'}
                </h3>
                <p className={`mt-1 ${
                  importResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {importResult.message}
                </p>
                {importResult.error && (
                  <p className="mt-2 text-sm text-red-600">
                    오류: {importResult.error}
                  </p>
                )}
                {importResult.count && (
                  <p className="mt-2 text-sm text-green-600">
                    가져온 고객 수: {importResult.count}명
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 고객 목록 */}
          {customers.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">가져온 고객 목록</h3>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        고객명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        전화번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.status === 'success' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {customer.status === 'success' ? '성공' : '실패'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
