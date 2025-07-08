import React, { useMemo } from 'react';

interface CustomerStyleAnalysisProps {
  bookings: any[];
}

export function CustomerStyleAnalysis({ bookings }: CustomerStyleAnalysisProps) {
  // 스윙 스타일별 분석
  const styleAnalysis = useMemo(() => {
    const styles = bookings.reduce((acc, booking) => {
      if (booking.swing_style) {
        acc[booking.swing_style] = (acc[booking.swing_style] || 0) + 1;
      }
      return acc;
    }, {});

    const total = Object.values(styles).reduce((sum: number, count: any) => sum + count, 0);
    
    return Object.entries(styles).map(([style, count]: [string, any]) => ({
      name: style,
      value: count,
      percentage: ((count / total) * 100).toFixed(1)
    }));
  }, [bookings]);

  // 우선순위별 분석
  const priorityAnalysis = useMemo(() => {
    const priorities = bookings.reduce((acc, booking) => {
      if (booking.priority) {
        acc[booking.priority] = (acc[booking.priority] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(priorities).map(([priority, count]: [string, any]) => ({
      name: priority,
      value: count
    }));
  }, [bookings]);

  // 거리별 분석
  const distanceAnalysis = useMemo(() => {
    const distances: { [key: string]: number } = {
      '200m 미만': 0,
      '200-220m': 0,
      '220-240m': 0,
      '240m 이상': 0
    };

    bookings.forEach(booking => {
      if (booking.current_distance) {
        const distance = parseInt(booking.current_distance);
        if (distance < 200) distances['200m 미만']++;
        else if (distance <= 220) distances['200-220m']++;
        else if (distance <= 240) distances['220-240m']++;
        else distances['240m 이상']++;
      }
    });

    return Object.entries(distances).map(([range, count]) => ({
      name: range,
      value: count
    }));
  }, [bookings]);

  const colors = ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* 스윙 스타일 분석 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">고객 스타일 분석</h3>
        {styleAnalysis.length > 0 ? (
          <div className="relative">
            <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto">
              {(() => {
                let currentAngle = -90;
                const total = bookings.length || 1; // Division by zero 방지
                
                // 단일 항목일 때 (100%) 특별 처리
                if (styleAnalysis.length === 1) {
                  return (
                    <>
                      <circle cx="100" cy="100" r="80" fill={colors[0]} />
                      <circle cx="100" cy="100" r="40" fill="white" />
                    </>
                  );
                }
                
                return styleAnalysis.map((item, index) => {
                  const percentage = (item.value / total) * 100;
                  const angle = (percentage / 100) * 360;
                  
                  if (angle === 0) return null; // 0도 세그먼트 건너뛰기
                  
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + angle;
                  currentAngle = endAngle;

                  const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                  const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);

                  const largeArcFlag = angle > 180 ? 1 : 0;

                  return (
                    <path
                      key={index}
                      d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                      fill={colors[index % colors.length]}
                      stroke="white"
                      strokeWidth="2"
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  );
                });
              })()}
              {/* 중앙 원 */}
              <circle cx="100" cy="100" r="40" fill="white" />
            </svg>
            <div className="mt-4 space-y-2">
              {styleAnalysis.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">데이터가 없습니다</p>
        )}
      </div>

      {/* 우선순위 분석 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">클럽 선택 우선순위</h3>
        {priorityAnalysis.length > 0 ? (
          <div className="space-y-3">
            {priorityAnalysis.sort((a, b) => b.value - a.value).map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.value}명</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                    style={{ width: `${(item.value / bookings.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">데이터가 없습니다</p>
        )}
      </div>

      {/* 비거리 분포 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">현재 비거리 분포</h3>
        {distanceAnalysis.some(item => item.value > 0) ? (
          <div className="space-y-3">
            {distanceAnalysis.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.value}명</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-600 to-emerald-600 h-2 rounded-full"
                    style={{ width: `${(item.value / bookings.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">데이터가 없습니다</p>
        )}
      </div>
    </div>
  );
}
