import React from 'react';

interface FunnelStage {
  name: string;
  count: number;
  goal: string;
  color?: string;
}

interface ConversionFunnelChartProps {
  funnel: {
    awareness: FunnelStage;
    consideration: FunnelStage;
    decision: FunnelStage;
    funnel: FunnelStage;
  };
  className?: string;
}

export default function ConversionFunnelChart({ funnel, className = '' }: ConversionFunnelChartProps) {
  const stages = [
    { ...funnel.awareness, color: 'bg-blue-500' },
    { ...funnel.consideration, color: 'bg-green-500' },
    { ...funnel.decision, color: 'bg-purple-500' },
    { ...funnel.funnel, color: 'bg-orange-500' }
  ];

  const maxCount = Math.max(...stages.map(stage => stage.count));

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">전환 퍼널</h3>
      
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const widthPercentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          const isLast = index === stages.length - 1;
          
          return (
            <div key={stage.name} className="relative">
              {/* 퍼널 바 */}
              <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden">
                <div 
                  className={`h-full ${stage.color} transition-all duration-500 ease-out`}
                  style={{ width: `${Math.max(widthPercentage, 10)}%` }}
                >
                  <div className="absolute inset-0 flex items-center justify-between px-4">
                    <div className="text-white">
                      <p className="font-semibold">{stage.name}</p>
                      <p className="text-sm opacity-90">{stage.goal}</p>
                    </div>
                    <div className="text-white text-right">
                      <p className="text-2xl font-bold">{stage.count.toLocaleString()}</p>
                      <p className="text-sm opacity-90">명</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 전환율 표시 */}
              {!isLast && (
                <div className="flex justify-center mt-2">
                  <div className="bg-gray-200 rounded-full px-3 py-1">
                    <span className="text-xs font-medium text-gray-600">
                      {stages[index + 1].count > 0 
                        ? ((stages[index + 1].count / stage.count) * 100).toFixed(1)
                        : 0
                      }% 전환
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* 범례 */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {stages.map((stage) => (
          <div key={stage.name} className="flex items-center">
            <div className={`w-3 h-3 ${stage.color} rounded-full mr-2`}></div>
            <div>
              <p className="text-sm font-medium text-gray-900">{stage.name}</p>
              <p className="text-xs text-gray-500">{stage.count.toLocaleString()}명</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
