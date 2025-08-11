import React, { useState } from 'react';

interface FunnelStage {
  id: string;
  name: string;
  stage_order: number;
  description: string;
  target_conversion_rate: number;
  color: string;
}

interface MonthlyPlan {
  id?: string;
  year: number;
  month: number;
  funnel_stage_id: string;
  planned_contents: number;
  planned_budget: number;
  target_reach: number;
  target_conversions: number;
  actual_contents?: number;
  actual_budget?: number;
  actual_reach?: number;
  actual_conversions?: number;
}

interface MarketingFunnelPlanProps {
  funnelStages: FunnelStage[];
  marketingPlans: MonthlyPlan[];
  onRefresh?: () => void;
  supabase?: any;
}

export const MarketingFunnelPlanFixed: React.FC<MarketingFunnelPlanProps> = ({
  funnelStages = [],
  marketingPlans = [],
  onRefresh,
  supabase
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [currentYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'plan' | 'actual' | 'compare'>('plan');

  const months = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const getPlan = (month: number, stageId: string): MonthlyPlan | undefined => {
    return marketingPlans.find(p => 
      p.year === currentYear && 
      p.month === month && 
      p.funnel_stage_id === stageId
    );
  };

  const handleCellClick = (cellId: string, currentValue: number) => {
    setEditingCell(cellId);
    setTempValue(currentValue.toString());
  };

  const handleCellUpdate = async (month: number, stageId: string, field: keyof MonthlyPlan, value: number) => {
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }

    const existingPlan = getPlan(month, stageId);
    
    try {
      if (existingPlan && existingPlan.id) {
        // 기존 계획 업데이트
        const { error } = await supabase
          .from('annual_marketing_plans')
          .update({ [field]: value })
          .eq('id', existingPlan.id);

        if (error) throw error;
      } else {
        // 새 계획 생성
        const newPlan = {
          year: currentYear,
          month,
          funnel_stage_id: stageId,
          planned_contents: 0,
          planned_budget: 0,
          target_reach: 0,
          target_conversions: 0,
          [field]: value
        };

        const { error } = await supabase
          .from('annual_marketing_plans')
          .insert([newPlan]);

        if (error) throw error;
      }

      // 데이터 새로고침
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('계획 업데이트 중 오류가 발생했습니다.');
    }
    
    setEditingCell(null);
  };

  const calculateTotal = (stageId: string, field: keyof MonthlyPlan): number => {
    return marketingPlans
      .filter(p => p.year === currentYear && p.funnel_stage_id === stageId)
      .reduce((sum, p) => sum + ((p[field] as number) || 0), 0);
  };

  const calculateMonthlyTotal = (month: number, field: keyof MonthlyPlan): number => {
    return marketingPlans
      .filter(p => p.year === currentYear && p.month === month)
      .reduce((sum, p) => sum + ((p[field] as number) || 0), 0);
  };

  const getFieldByViewMode = (mode: 'plan' | 'actual' | 'compare'): keyof MonthlyPlan => {
    return mode === 'actual' ? 'actual_contents' : 'planned_contents';
  };

  // 퍼널 단계가 없는 경우 안내 메시지
  if (funnelStages.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">마케팅 퍼널이 설정되지 않았습니다</h3>
          <p className="text-sm mb-4">시스템 설정에서 퍼널 단계를 먼저 설정해주세요.</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              새로고침
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">연간 마케팅 퍼널 계획</h3>
            <p className="text-sm text-gray-500 mt-1">{currentYear}년 마케팅 전략 및 실행 계획</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">보기:</span>
              <select 
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'plan' | 'actual' | 'compare')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="plan">계획</option>
                <option value="actual">실적</option>
                <option value="compare">비교</option>
              </select>
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="새로고침"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 퍼널 단계 시각화 */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-center space-x-2 overflow-x-auto">
          {funnelStages.sort((a, b) => a.stage_order - b.stage_order).map((stage, index) => (
            <React.Fragment key={stage.id}>
              <div className="text-center flex-shrink-0">
                <div 
                  className="w-32 h-24 flex items-center justify-center rounded-lg text-white font-medium text-sm"
                  style={{ 
                    backgroundColor: stage.color || '#6B7280',
                    opacity: 1 - (index * 0.15)
                  }}
                >
                  <div>
                    <div className="font-semibold">{stage.name}</div>
                    <div className="text-xs opacity-90 mt-1">
                      {stage.target_conversion_rate}%
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2 max-w-[128px]">
                  {stage.description}
                </div>
              </div>
              {index < funnelStages.length - 1 && (
                <svg className="w-6 h-6 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 월별 계획 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-4 font-medium text-gray-700 sticky left-0 bg-white">월</th>
              {funnelStages.sort((a, b) => a.stage_order - b.stage_order).map(stage => (
                <th key={stage.id} className="text-center p-4 font-medium" style={{ color: stage.color || '#6B7280' }}>
                  {stage.name}
                </th>
              ))}
              <th className="text-center p-4 font-medium text-gray-700">월 합계</th>
            </tr>
          </thead>
          <tbody>
            {months.map((month, monthIndex) => {
              const monthNumber = monthIndex + 1;
              const isCurrentMonth = new Date().getMonth() === monthIndex && new Date().getFullYear() === currentYear;
              const field = getFieldByViewMode(viewMode);
              
              return (
                <tr 
                  key={monthNumber}
                  className={`border-b border-gray-200 hover:bg-gray-50 ${
                    isCurrentMonth ? 'bg-purple-50' : ''
                  }`}
                >
                  <td className="p-4 font-medium text-gray-700 sticky left-0 bg-inherit">
                    {month}
                    {isCurrentMonth && (
                      <span className="ml-2 text-xs text-purple-600">(현재)</span>
                    )}
                  </td>
                  {funnelStages.sort((a, b) => a.stage_order - b.stage_order).map(stage => {
                    const plan = getPlan(monthNumber, stage.id);
                    const cellId = `${monthNumber}-${stage.id}`;
                    const isEditing = editingCell === cellId;
                    
                    return (
                      <td key={stage.id} className="p-2 text-center">
                        <div className="space-y-1">
                          {viewMode === 'compare' ? (
                            <div className="text-sm">
                              <div className="text-gray-700">{plan?.planned_contents || 0}</div>
                              <div className="text-green-600 text-xs">/{plan?.actual_contents || 0}</div>
                            </div>
                          ) : (
                            <div className="text-sm">
                              {isEditing && viewMode === 'plan' ? (
                                <input
                                  type="number"
                                  value={tempValue}
                                  onChange={(e) => setTempValue(e.target.value)}
                                  onBlur={() => {
                                    handleCellUpdate(monthNumber, stage.id, field, parseInt(tempValue) || 0);
                                  }}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleCellUpdate(monthNumber, stage.id, field, parseInt(tempValue) || 0);
                                    }
                                  }}
                                  className="w-16 px-1 py-0.5 text-center border border-purple-500 rounded"
                                  autoFocus
                                />
                              ) : (
                                <button
                                  onClick={() => viewMode === 'plan' && handleCellClick(cellId, plan?.[field] || 0)}
                                  className={`w-16 px-1 py-0.5 rounded ${
                                    viewMode === 'plan' ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-default'
                                  }`}
                                  disabled={viewMode !== 'plan'}
                                >
                                  {plan?.[field] || 0}
                                </button>
                              )}
                              <span className="text-xs text-gray-500 ml-1">개</span>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-4 text-center font-medium text-gray-700">
                    {calculateMonthlyTotal(monthNumber, field)}개
                  </td>
                </tr>
              );
            })}
            {/* 연간 합계 */}
            <tr className="bg-gray-100 font-medium">
              <td className="p-4 text-gray-700 sticky left-0 bg-gray-100">연간 합계</td>
              {funnelStages.sort((a, b) => a.stage_order - b.stage_order).map(stage => (
                <td key={stage.id} className="p-4 text-center">
                  {viewMode === 'compare' ? (
                    <div>
                      <div>{calculateTotal(stage.id, 'planned_contents')}</div>
                      <div className="text-green-600 text-xs">/{calculateTotal(stage.id, 'actual_contents')}</div>
                    </div>
                  ) : (
                    <span>{calculateTotal(stage.id, getFieldByViewMode(viewMode))}개</span>
                  )}
                </td>
              ))}
              <td className="p-4 text-center text-gray-700">
                {marketingPlans
                  .filter(p => p.year === currentYear)
                  .reduce((sum, p) => sum + (p[getFieldByViewMode(viewMode)] || 0), 0)}개
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 요약 정보 */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {marketingPlans.filter(p => p.year === currentYear).reduce((sum, p) => sum + (p.planned_contents || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">계획된 콘텐츠</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {marketingPlans.filter(p => p.year === currentYear).reduce((sum, p) => sum + (p.actual_contents || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">발행된 콘텐츠</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(
                marketingPlans.filter(p => p.year === currentYear && p.planned_contents > 0).length / 
                (funnelStages.length * 12) * 100
              )}%
            </div>
            <div className="text-sm text-gray-600">계획 수립률</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(() => {
                const totalPlanned = marketingPlans.filter(p => p.year === currentYear).reduce((sum, p) => sum + (p.planned_contents || 0), 0);
                const totalActual = marketingPlans.filter(p => p.year === currentYear).reduce((sum, p) => sum + (p.actual_contents || 0), 0);
                return totalPlanned > 0 ? Math.round(totalActual / totalPlanned * 100) : 0;
              })()}%
            </div>
            <div className="text-sm text-gray-600">달성률</div>
          </div>
        </div>
      </div>
    </div>
  );
};