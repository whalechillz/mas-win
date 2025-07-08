import React, { useState, useEffect } from 'react';

interface FunnelStage {
  name: string;
  value: number;
  percentage: number;
  color: string;
  icon?: React.ReactNode;
}

interface ConversionFunnelProps {
  stages: FunnelStage[];
  title?: string;
  showPercentages?: boolean;
  showDropoff?: boolean;
  animate?: boolean;
  height?: string;
  onStageClick?: (stage: FunnelStage, index: number) => void;
}

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({
  stages,
  title = '전환 깔때기',
  showPercentages = true,
  showDropoff = true,
  animate = true,
  height = 'h-96',
  onStageClick
}) => {
  const [animatedStages, setAnimatedStages] = useState<FunnelStage[]>(
    stages.map(stage => ({ ...stage, value: 0, percentage: 0 }))
  );

  useEffect(() => {
    if (animate) {
      // 애니메이션 효과
      const timer = setTimeout(() => {
        setAnimatedStages(stages);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedStages(stages);
    }
  }, [stages, animate]);

  const maxValue = Math.max(...stages.map(s => s.value));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      <div className={`relative ${height}`}>
        <div className="flex flex-col justify-between h-full">
          {animatedStages.map((stage, index) => {
            const widthPercentage = (stage.value / maxValue) * 100;
            const dropoffPercentage = index > 0 
              ? ((animatedStages[index - 1].value - stage.value) / animatedStages[index - 1].value * 100).toFixed(1)
              : '0';

            return (
              <div key={index} className="relative flex-1 flex flex-col justify-center">
                <div
                  className={`relative overflow-hidden transition-all duration-1000 ease-out cursor-pointer group ${
                    index < animatedStages.length - 1 ? 'mb-2' : ''
                  }`}
                  onClick={() => onStageClick?.(stage, index)}
                  style={{
                    width: animate ? `${widthPercentage}%` : `${widthPercentage}%`,
                    minWidth: '200px'
                  }}
                >
                  {/* 깔때기 모양 만들기 */}
                  <div
                    className={`h-full relative overflow-hidden transition-all duration-300 group-hover:shadow-lg`}
                    style={{
                      backgroundColor: stage.color,
                      clipPath: index < animatedStages.length - 1 
                        ? 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)'
                        : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                      opacity: 0.9
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    
                    <div className="relative z-10 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {stage.icon && (
                          <div className="text-white/80">
                            {stage.icon}
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{stage.name}</p>
                          <p className="text-white/80 text-sm">
                            {stage.value.toLocaleString()} 
                            {showPercentages && (
                              <span className="ml-1">({stage.percentage}%)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 드롭오프 표시 */}
                  {showDropoff && index > 0 && (
                    <div className="absolute -top-6 right-0 text-xs text-red-600 font-medium">
                      -{dropoffPercentage}%
                    </div>
                  )}
                </div>

                {/* 연결선 */}
                {index < animatedStages.length - 1 && (
                  <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2">
                    <svg width="20" height="40" className="text-gray-300">
                      <path
                        d="M0,20 L20,20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="2,2"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 사이드 메트릭스 */}
        <div className="absolute -right-4 top-0 bottom-0 w-32 flex flex-col justify-around">
          {animatedStages.map((stage, index) => {
            const conversionRate = index > 0 
              ? ((stage.value / animatedStages[0].value) * 100).toFixed(1)
              : '100';

            return (
              <div key={index} className="text-right">
                <p className="text-xs text-gray-500">전체 전환율</p>
                <p className="text-sm font-semibold text-gray-900">{conversionRate}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 통계 */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">총 방문자</p>
            <p className="text-xl font-semibold text-gray-900">
              {animatedStages[0]?.value.toLocaleString() || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">최종 전환</p>
            <p className="text-xl font-semibold text-green-600">
              {animatedStages[animatedStages.length - 1]?.value.toLocaleString() || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">전체 전환율</p>
            <p className="text-xl font-semibold text-purple-600">
              {animatedStages.length > 0 && animatedStages[0].value > 0
                ? ((animatedStages[animatedStages.length - 1].value / animatedStages[0].value) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 미니 깔때기 컴포넌트 (대시보드용)
export const MiniFunnel: React.FC<{
  stages: Array<{ name: string; value: number }>;
  color?: string;
}> = ({ stages, color = 'purple' }) => {
  const maxValue = Math.max(...stages.map(s => s.value));

  const colorVariants = {
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="flex items-end gap-1 h-16">
      {stages.map((stage, index) => {
        const heightPercentage = (stage.value / maxValue) * 100;
        
        return (
          <div
            key={index}
            className="flex-1 relative group"
          >
            <div
              className={`${colorVariants[color]} opacity-80 hover:opacity-100 transition-all duration-300 rounded-t`}
              style={{
                height: `${heightPercentage}%`,
                minHeight: '20%'
              }}
            />
            <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {stage.name}: {stage.value.toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 실시간 깔때기 데이터 훅
export const useRealtimeFunnel = (initialStages: FunnelStage[], updateInterval = 10000) => {
  const [stages, setStages] = useState(initialStages);

  useEffect(() => {
    const interval = setInterval(() => {
      // 실제로는 API에서 데이터를 가져옴
      setStages(prevStages => 
        prevStages.map((stage, index) => {
          const variation = Math.random() * 0.1 - 0.05; // ±5% 변동
          const newValue = Math.max(0, Math.floor(stage.value * (1 + variation)));
          
          // 깔때기는 항상 이전 단계보다 작거나 같아야 함
          const maxValue = index > 0 ? prevStages[index - 1].value : newValue;
          const constrainedValue = Math.min(newValue, maxValue);
          
          return {
            ...stage,
            value: constrainedValue,
            percentage: initialStages[0].value > 0 
              ? Number(((constrainedValue / initialStages[0].value) * 100).toFixed(1))
              : 0
          };
        })
      );
    }, updateInterval);

    return () => clearInterval(interval);
  }, [initialStages, updateInterval]);

  return stages;
};

export default ConversionFunnel;
