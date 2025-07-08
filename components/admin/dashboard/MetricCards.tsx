import React, { useEffect, useState } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: 'up' | 'down' | 'neutral';
  sparklineData?: number[];
  isLoading?: boolean;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  trend = 'neutral',
  sparklineData,
  isLoading = false,
  onClick
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [value]);

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 border-blue-200',
    green: 'bg-green-100 text-green-600 border-green-200',
    purple: 'bg-purple-100 text-purple-600 border-purple-200',
    orange: 'bg-orange-100 text-orange-600 border-orange-200',
    red: 'bg-red-100 text-red-600 border-red-200'
  };

  const gradientClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600'
  };

  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length === 0) return null;

    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    const width = 100;
    const height = 30;

    const points = sparklineData.map((value, index) => {
      const x = (index / (sparklineData.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="absolute bottom-0 right-0 opacity-10">
        <svg width={width} height={height} className="overflow-visible">
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  };

  return (
    <div
      className={`relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-lg ${
        onClick ? 'cursor-pointer hover:-translate-y-1' : ''
      } ${isAnimating ? 'scale-[1.02]' : 'scale-100'}`}
      onClick={onClick}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend === 'up' && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
            {trend === 'down' && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>

      {renderSparkline()}

      {/* 미니 프로그레스 바 (선택적) */}
      {change !== undefined && (
        <div className="mt-4">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${gradientClasses[color]} transition-all duration-500`}
              style={{ width: `${Math.min(Math.abs(change), 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// 메트릭 카드 그룹 컴포넌트
interface MetricCardsProps {
  metrics: Array<{
    id: string;
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    trend?: 'up' | 'down' | 'neutral';
    sparklineData?: number[];
  }>;
  isLoading?: boolean;
  onCardClick?: (id: string) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  metrics,
  isLoading = false,
  onCardClick
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.id}
          {...metric}
          isLoading={isLoading}
          onClick={() => onCardClick?.(metric.id)}
        />
      ))}
    </div>
  );
};

// 실시간 업데이트를 위한 커스텀 훅
export const useRealtimeMetrics = (initialMetrics: any[], updateInterval = 5000) => {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdating(true);
      
      // 실제로는 API 호출로 데이터를 가져옴
      // 여기서는 시뮬레이션
      setTimeout(() => {
        setMetrics(prevMetrics => 
          prevMetrics.map(metric => ({
            ...metric,
            value: typeof metric.value === 'number' 
              ? metric.value + Math.floor(Math.random() * 10 - 5)
              : metric.value,
            change: metric.change !== undefined 
              ? metric.change + (Math.random() * 2 - 1)
              : undefined,
            sparklineData: metric.sparklineData
              ? [...metric.sparklineData.slice(1), Math.random() * 100]
              : undefined
          }))
        );
        setIsUpdating(false);
      }, 300);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return { metrics, isUpdating };
};

export default MetricCards;
