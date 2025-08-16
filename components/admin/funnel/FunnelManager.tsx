import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
// ABTestComparison import 제거
// import ABTestComparison from './ABTestComparison';

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

export function FunnelManager() {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    fetchFunnelData();
  }, []);

  const fetchFunnelData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/funnel-management');
      const data = await response.json();
      
      if (data.success) {
        setFunnelData(data.data);
        // 가장 최근 월을 기본 선택
        const months = Object.keys(data.data.groupedFunnels);
        if (months.length > 0) {
          setSelectedMonth(months[months.length - 1]);
        }
      } else {
        setError(data.error || '데이터 로드 실패');
      }
    } catch (err) {
      setError('퍼널 데이터 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-100 text-green-800';
      case 'staging': return 'bg-yellow-100 text-yellow-800';
      case 'dev': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">퍼널 관리</h2>
          <p className="text-gray-600">
            총 {funnelData.totalFiles}개의 퍼널 파일
          </p>
          <p className="text-sm text-gray-500">
            마지막 업데이트: {new Date(funnelData.lastUpdated).toLocaleString('ko-KR')}
          </p>
        </div>
      </div>

      {/* 월별 선택 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex space-x-2">
          {Object.keys(funnelData.groupedFunnels).map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMonth === month
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 월의 퍼널 목록 */}
      {selectedMonth && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedMonth} 퍼널 목록</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedFunnels.map((funnel) => (
              <div key={funnel.name} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900 truncate">{funnel.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(funnel.status)}`}>
                    {funnel.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>크기:</span>
                    <span>{formatFileSize(funnel.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>버전:</span>
                    <span>{funnel.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>수정일:</span>
                    <span>{formatDate(funnel.modifiedDate)}</span>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => window.open(funnel.url, '_blank')}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    미리보기
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(funnel.url)}
                    className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                    title="URL 복사"
                  >
                    📋
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 통계 차트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 상태별 분포 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">상태별 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Live', value: selectedFunnels.filter(f => f.status === 'live').length },
                  { name: 'Staging', value: selectedFunnels.filter(f => f.status === 'staging').length },
                  { name: 'Dev', value: selectedFunnels.filter(f => f.status === 'dev').length }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                <Cell fill="#10B981" />
                <Cell fill="#F59E0B" />
                <Cell fill="#3B82F6" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 파일 크기 분포 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">파일 크기 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={selectedFunnels.map(funnel => ({
              name: funnel.version,
              size: Math.round(funnel.size / 1024) // KB 단위
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} KB`, '크기']} />
              <Bar dataKey="size" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* A/B 테스트 비교 섹션 제거 */}
      {/* <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">A/B 테스트 성능 비교</h2>
        <ABTestComparison />
      </div> */}
    </div>
  );
}

export default FunnelManager;
