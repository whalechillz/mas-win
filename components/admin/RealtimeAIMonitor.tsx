import React, { useState, useEffect, useRef } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AIUsageData {
  timestamp: string;
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  successRate: number;
}

interface RealtimeAIMonitorProps {
  refreshInterval?: number;
}

export default function RealtimeAIMonitor({ refreshInterval = 30000 }: RealtimeAIMonitorProps) {
  const [usageData, setUsageData] = useState<AIUsageData[]>([]);
  const [currentStats, setCurrentStats] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 실시간 데이터 가져오기
  const fetchRealtimeData = async () => {
    try {
      const response = await fetch('/api/admin/ai-stats');
      const data = await response.json();
      
      if (response.ok) {
        const newDataPoint: AIUsageData = {
          timestamp: new Date().toISOString(),
          totalCalls: data.stats.totalCalls,
          totalTokens: data.stats.totalTokens,
          totalCost: data.stats.totalCost,
          successRate: data.stats.successRate,
        };

        setUsageData(prev => {
          const updated = [...prev, newDataPoint].slice(-20); // 최근 20개 데이터만 유지
          return updated;
        });

        setCurrentStats(data.stats);
        setIsConnected(true);

        // 알림 체크
        checkAlerts(data.stats);
      }
    } catch (error) {
      console.error('실시간 데이터 가져오기 실패:', error);
      setIsConnected(false);
    }
  };

  // 알림 체크
  const checkAlerts = (stats: any) => {
    const newAlerts: any[] = [];

    // 비용 임계값 체크 (일일 $10 초과)
    if (stats.totalCost > 10) {
      newAlerts.push({
        id: Date.now(),
        type: 'cost',
        level: 'warning',
        message: `일일 AI 비용이 $${stats.totalCost.toFixed(2)}를 초과했습니다.`,
        timestamp: new Date().toISOString(),
      });
    }

    // 성공률 체크 (90% 미만)
    if (stats.successRate < 90) {
      newAlerts.push({
        id: Date.now() + 1,
        type: 'success_rate',
        level: 'error',
        message: `AI 성공률이 ${stats.successRate.toFixed(1)}%로 낮습니다.`,
        timestamp: new Date().toISOString(),
      });
    }

    // 토큰 사용량 체크 (일일 100만 토큰 초과)
    if (stats.totalTokens > 1000000) {
      newAlerts.push({
        id: Date.now() + 2,
        type: 'tokens',
        level: 'info',
        message: `일일 토큰 사용량이 ${stats.totalTokens.toLocaleString()}개를 초과했습니다.`,
        timestamp: new Date().toISOString(),
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // 최근 10개 알림만 유지
    }
  };

  // 알림 제거
  const dismissAlert = (alertId: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  useEffect(() => {
    // 초기 데이터 로드
    fetchRealtimeData();

    // 실시간 업데이트 설정
    intervalRef.current = setInterval(fetchRealtimeData, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval]);

  // 차트 데이터 준비
  const chartData = {
    labels: usageData.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'API 호출 수',
        data: usageData.map(d => d.totalCalls),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: '토큰 사용량 (천)',
        data: usageData.map(d => d.totalTokens / 1000),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
        yAxisID: 'y1',
      },
    ],
  };

  const costChartData = {
    labels: usageData.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: '비용 ($)',
        data: usageData.map(d => d.totalCost),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
      },
    ],
  };

  const successRateData = {
    labels: ['성공', '실패'],
    datasets: [
      {
        data: currentStats ? [currentStats.successRate, 100 - currentStats.successRate] : [0, 100],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '실시간 AI 사용량 추이',
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const costChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '실시간 비용 추이',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: '성공률',
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* 연결 상태 및 알림 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? '실시간 연결됨' : '연결 끊김'}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            업데이트 간격: {refreshInterval / 1000}초
          </div>
        </div>
        
        <button
          onClick={fetchRealtimeData}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          수동 새로고침
        </button>
      </div>

      {/* 알림 섹션 */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">🚨 실시간 알림</h3>
          <div className="space-y-2">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-2 rounded ${
                  alert.level === 'error' ? 'bg-red-50 border border-red-200' :
                  alert.level === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${
                    alert.level === 'error' ? 'text-red-700' :
                    alert.level === 'warning' ? 'text-yellow-700' :
                    'text-blue-700'
                  }`}>
                    {alert.message}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 실시간 통계 카드 */}
      {currentStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{currentStats.totalCalls}</div>
            <div className="text-sm text-gray-600">총 API 호출</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{currentStats.totalTokens.toLocaleString()}</div>
            <div className="text-sm text-gray-600">총 토큰</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">${currentStats.totalCost.toFixed(2)}</div>
            <div className="text-sm text-gray-600">총 비용</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{currentStats.successRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">성공률</div>
          </div>
        </div>
      )}

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 사용량 추이 차트 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* 비용 추이 차트 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="h-64">
            <Bar data={costChartData} options={costChartOptions} />
          </div>
        </div>
      </div>

      {/* 성공률 도넛 차트 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="h-64 flex items-center justify-center">
          <div className="w-48 h-48">
            <Doughnut data={successRateData} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
