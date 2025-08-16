import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface WinnerData {
  testName: string;
  currentWinner: string | null;
  previousWinner: string | null;
  confidence: number;
  significance: {
    conversionRate: boolean;
    sessionDuration: boolean;
    bounceRate: boolean;
  };
  lastUpdated: string;
  totalSessions: number;
  minimumSessionsRequired: number;
  isStatisticallySignificant: boolean;
  autoSwitchEnabled: boolean;
}

interface VersionPerformance {
  version: string;
  sessions: number;
  conversions: number;
  conversionRate: number;
  avgSessionDuration: number;
  bounceRate: number;
  pageViews: number;
  confidence: number;
}

export function RealTimeWinnerMonitor() {
  const [winnerData, setWinnerData] = useState<WinnerData | null>(null);
  const [versions, setVersions] = useState<VersionPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    fetchWinnerData();
    
    // 5분마다 자동 업데이트
    const interval = setInterval(fetchWinnerData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchWinnerData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/real-time-winner?action=check');
      const data = await response.json();
      
      if (data.success) {
        setWinnerData(data.winnerData);
        setVersions(data.versions);
        setLastUpdate(new Date().toLocaleTimeString('ko-KR'));
        
        // 승자 변경 시 알림
        if (data.winnerChanged && data.winnerData.currentWinner) {
          showWinnerChangeNotification(data.winnerData.currentWinner);
        }
      }
    } catch (error) {
      console.error('실시간 승자 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSwitch = async () => {
    try {
      const response = await fetch('/api/analytics/real-time-winner?action=auto-switch');
      const data = await response.json();
      
      if (data.success) {
        alert(`퍼널이 ${data.winnerData.currentWinner}로 자동 전환되었습니다!`);
        fetchWinnerData();
      }
    } catch (error) {
      console.error('자동 전환 실패:', error);
      alert('자동 전환 중 오류가 발생했습니다.');
    }
  };

  const showWinnerChangeNotification = (winner: string) => {
    // 브라우저 알림
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('A/B 테스트 승자 변경', {
        body: `새로운 승자: ${winner}`,
        icon: '/favicon.ico'
      });
    }
    
    // 페이지 내 알림
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
      <div class="font-bold">🎉 새로운 승자!</div>
      <div>버전 ${winner}가 승자로 선정되었습니다.</div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('ko-KR');
  };

  const getStatusColor = (isSignificant: boolean) => {
    return isSignificant ? 'text-green-600' : 'text-yellow-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">실시간 승자 데이터를 로드하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">실시간 승자 모니터링</h2>
          <p className="text-gray-600">
            마지막 업데이트: {lastUpdate}
          </p>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={fetchWinnerData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            새로고침
          </button>
          
          <button
            onClick={handleAutoSwitch}
            disabled={!winnerData?.isStatisticallySignificant || winnerData?.totalSessions < 50}
            className={`px-4 py-2 rounded-lg ${
              winnerData?.isStatisticallySignificant && winnerData?.totalSessions >= 50
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            승자로 자동 전환
          </button>
        </div>
      </div>

      {/* 현재 승자 정보 */}
      {winnerData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {winnerData.currentWinner || '미정'}
              </div>
              <div className="text-sm text-gray-600">현재 승자</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${getStatusColor(winnerData.isStatisticallySignificant)}`}>
                {winnerData.isStatisticallySignificant ? '✅' : '⏳'}
              </div>
              <div className="text-sm text-gray-600">통계적 유의성</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {winnerData.confidence}%
              </div>
              <div className="text-sm text-gray-600">신뢰도</div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">총 세션:</span> {winnerData.totalSessions}
            </div>
            <div>
              <span className="font-medium">최소 필요 세션:</span> {winnerData.minimumSessionsRequired}
            </div>
            <div>
              <span className="font-medium">자동 전환:</span> {winnerData.autoSwitchEnabled ? '활성화' : '비활성화'}
            </div>
            <div>
              <span className="font-medium">마지막 업데이트:</span> {formatTime(winnerData.lastUpdated)}
            </div>
          </div>
        </div>
      )}

      {/* 버전별 성능 비교 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">버전별 실시간 성능</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {versions.map((version) => (
            <div key={version.version} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">버전 {version.version}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  version.version === winnerData?.currentWinner
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {version.version === winnerData?.currentWinner ? '승자' : '도전자'}
                </span>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>세션:</span>
                  <span className="font-medium">{version.sessions}</span>
                </div>
                <div className="flex justify-between">
                  <span>전환:</span>
                  <span className="font-medium">{version.conversions}</span>
                </div>
                <div className="flex justify-between">
                  <span>전환율:</span>
                  <span className="font-medium">{version.conversionRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>신뢰도:</span>
                  <span className="font-medium">{version.confidence}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 전환율 비교 차트 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">실시간 전환율 비교</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={versions}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="version" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value}%`, '전환율']} />
            <Bar 
              dataKey="conversionRate" 
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default RealTimeWinnerMonitor;
