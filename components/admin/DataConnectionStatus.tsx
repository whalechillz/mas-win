// components/admin/DataConnectionStatus.tsx
import { useEffect, useState } from 'react';

interface DataStatus {
  ga4: 'connected' | 'disconnected' | 'loading';
  googleAds: 'connected' | 'disconnected' | 'loading';
  database: 'connected' | 'disconnected' | 'loading';
  lastUpdate: string;
}

export function DataConnectionStatus() {
  const [status, setStatus] = useState<DataStatus>({
    ga4: 'loading',
    googleAds: 'loading', 
    database: 'loading',
    lastUpdate: ''
  });

  useEffect(() => {
    checkDataConnections();
    const interval = setInterval(checkDataConnections, 30000); // 30초마다 체크
    return () => clearInterval(interval);
  }, []);

  const checkDataConnections = async () => {
    try {
      // GA4 연결 상태 확인
      const ga4Response = await fetch('/api/ga4-test');
      const ga4Data = await ga4Response.json();
      
      // Google Ads 연결 상태 확인 (환경변수로 판단)
      const adsResponse = await fetch('/api/test-google-ads-connection');
      const adsConnected = adsResponse.ok;

      // Database 연결 상태 (Supabase)
      const dbResponse = await fetch('/api/test-db-connection');
      const dbConnected = dbResponse.ok;

      setStatus({
        ga4: ga4Data.status?.includes('성공') ? 'connected' : 'disconnected',
        googleAds: adsConnected ? 'connected' : 'disconnected',
        database: dbConnected ? 'connected' : 'disconnected',
        lastUpdate: new Date().toLocaleTimeString('ko-KR')
      });
    } catch (error) {
      console.error('데이터 연결 상태 확인 실패:', error);
    }
  };

  const getStatusIcon = (connectionStatus: string) => {
    switch (connectionStatus) {
      case 'connected': return '✅';
      case 'disconnected': return '❌';
      case 'loading': return '⏳';
      default: return '❓';
    }
  };

  const getStatusColor = (connectionStatus: string) => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'disconnected': return 'text-red-600 bg-red-50';
      case 'loading': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDataAccuracy = () => {
    const connections = [status.ga4, status.googleAds, status.database];
    const connected = connections.filter(s => s === 'connected').length;
    const total = connections.length;
    return Math.round((connected / total) * 100);
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg text-white mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">📊 실시간 데이터 연동 현황</h3>
        <div className="text-right">
          <div className="text-2xl font-bold">{getDataAccuracy()}%</div>
          <div className="text-xs text-blue-200">데이터 정확도</div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {/* GA4 상태 */}
        <div className={`p-3 rounded-lg ${getStatusColor(status.ga4)} border-2 border-opacity-20`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getStatusIcon(status.ga4)}</span>
            <span className="font-semibold">Google Analytics</span>
          </div>
          <div className="text-xs opacity-80">
            {status.ga4 === 'connected' ? '실시간 추적 중' : '연결 확인 필요'}
          </div>
          <div className="text-xs mt-1">
            페이지뷰, 이벤트, 사용자
          </div>
        </div>

        {/* Google Ads 상태 */}
        <div className={`p-3 rounded-lg ${getStatusColor(status.googleAds)} border-2 border-opacity-20`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getStatusIcon(status.googleAds)}</span>
            <span className="font-semibold">Google Ads</span>
          </div>
          <div className="text-xs opacity-80">
            {status.googleAds === 'connected' ? '광고 데이터 연동' : 'API 설정 필요'}
          </div>
          <div className="text-xs mt-1">
            클릭, 노출, 전환, ROI
          </div>
        </div>

        {/* Database 상태 */}
        <div className={`p-3 rounded-lg ${getStatusColor(status.database)} border-2 border-opacity-20`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getStatusIcon(status.database)}</span>
            <span className="font-semibold">Database</span>
          </div>
          <div className="text-xs opacity-80">
            {status.database === 'connected' ? '실시간 저장 중' : '연결 확인 필요'}
          </div>
          <div className="text-xs mt-1">
            예약, 문의, 캠페인
          </div>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="mt-3 pt-3 border-t border-white border-opacity-20">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <span>마지막 업데이트:</span>
            <span className="font-mono bg-white bg-opacity-20 px-2 py-1 rounded">
              {status.lastUpdate || '확인 중...'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {status.googleAds === 'disconnected' && (
              <span className="text-yellow-200 text-xs">
                💡 Google Ads 연동 시 100% 실시간 데이터 가능
              </span>
            )}
            <button 
              onClick={checkDataConnections}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-xs transition-all"
            >
              🔄 새로고침
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}