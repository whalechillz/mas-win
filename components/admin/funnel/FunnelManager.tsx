import { useState, useEffect } from 'react';

interface FunnelFile {
  name: string;
  path: string;
  size: number;
  createdDate: string;
  modifiedDate: string;
  version: string;
  status: 'live' | 'staging' | 'dev';
  url: string;
}

interface FunnelData {
  totalFiles: number;
  groupedFunnels: Record<string, FunnelFile[]>;
  lastUpdated: string;
}

export default function FunnelManager() {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('2025-09');

  useEffect(() => {
    fetchFunnelData();
  }, []);

  const fetchFunnelData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/funnel-management');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setFunnelData(data.data);
      } else {
        throw new Error(data.message || '데이터 로드 실패');
      }
    } catch (err) {
      console.error('퍼널 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      
      // 기본 데이터 설정
      setFunnelData({
        totalFiles: 6,
        groupedFunnels: {
          '2025-05': [
            {
              name: 'funnel-2025-05-live.html',
              path: '/versions/funnel-2025-05-live.html',
              size: 1024000,
              createdDate: '2025-05-01',
              modifiedDate: '2025-05-01',
              version: '1.0.0',
              status: 'live',
              url: '/versions/funnel-2025-05-live.html'
            }
          ],
          '2025-06': [
            {
              name: 'funnel-2025-06-live.html',
              path: '/versions/funnel-2025-06-live.html',
              size: 1024000,
              createdDate: '2025-06-01',
              modifiedDate: '2025-06-01',
              version: '1.0.0',
              status: 'live',
              url: '/versions/funnel-2025-06-live.html'
            }
          ],
          '2025-07': [
            {
              name: 'funnel-2025-07-live.html',
              path: '/versions/funnel-2025-07-live.html',
              size: 1024000,
              createdDate: '2025-07-01',
              modifiedDate: '2025-07-01',
              version: '1.0.0',
              status: 'live',
              url: '/versions/funnel-2025-07-live.html'
            }
          ],
          '2025-08': [
            {
              name: 'funnel-2025-08-live-a.html',
              path: '/versions/funnel-2025-08-live-a.html',
              size: 1024000,
              createdDate: '2025-08-01',
              modifiedDate: '2025-08-01',
              version: '1.0.0',
              status: 'dev',
              url: '/versions/funnel-2025-08-live-a.html'
            },
            {
              name: 'funnel-2025-08-live-b.html',
              path: '/versions/funnel-2025-08-live-b.html',
              size: 1024000,
              createdDate: '2025-08-01',
              modifiedDate: '2025-08-01',
              version: '1.0.0',
              status: 'live',
              url: '/versions/funnel-2025-08-live-b.html'
            }
          ],
          '2025-09': [
            {
              name: 'funnel-2025-09-live.html',
              path: '/versions/funnel-2025-09-live.html',
              size: 1024000,
              createdDate: '2025-09-01',
              modifiedDate: '2025-09-01',
              version: '1.0.0',
              status: 'live',
              url: '/versions/funnel-2025-09-live.html'
            }
          ]
        },
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">퍼널 파일을 스캔하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong className="font-bold">오류:</strong>
        <span className="block sm:inline"> {error}</span>
        <button 
          onClick={fetchFunnelData}
          className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!funnelData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">퍼널 데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const selectedFunnels = selectedMonth ? funnelData.groupedFunnels[selectedMonth] || [] : [];

  return (
    <div className="space-y-6">
      {/* 간단한 버전 - 안전한 최소 버전 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">퍼널 관리</h2>
          <p className="text-gray-600">
            총 {funnelData.totalFiles}개의 퍼널 파일
          </p>
        </div>
      </div>

      {/* 월별 탭 */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {Object.keys(funnelData.groupedFunnels).map((month) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedMonth === month
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {month}
              </button>
            ))}
          </nav>
        </div>

        {/* 선택된 월의 퍼널 목록 */}
        {selectedMonth && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedMonth} 퍼널 목록</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedFunnels.length > 0 ? (
                selectedFunnels.map((funnel) => (
                  <div
                    key={funnel.name}
                    className={`border-2 rounded-lg p-6 ${
                      funnel.status === 'live'
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <h4 className="text-xl font-bold text-gray-900">{funnel.name}</h4>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                      funnel.status === 'live'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {funnel.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  {selectedMonth}에 해당하는 퍼널이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}