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
  year: number;
  month: number;
  funnel_stage_id: string;
  planned_contents: number;
  planned_budget: number;
  target_reach: number;
  target_conversions: number;
  actual_contents: number;
  actual_budget: number;
  actual_reach: number;
  actual_conversions: number;
}

interface MarketingFunnelPlanProps {
  stages: FunnelStage[];
  plans: MonthlyPlan[];
  currentYear: number;
  onUpdatePlan: (plan: MonthlyPlan) => void;
}

export const MarketingFunnelPlan: React.FC<MarketingFunnelPlanProps> = ({
  stages,
  plans,
  currentYear,
  onUpdatePlan
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  const months = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const getPlan = (month: number, stageId: string): MonthlyPlan | undefined => {
    return plans.find(p => 
      p.year === currentYear && 
      p.month === month && 
      p.funnel_stage_id === stageId
    );
  };

  const handleCellClick = (cellId: string, currentValue: number) => {
    setEditingCell(cellId);
    setTempValue(currentValue.toString());
  };

  const handleCellUpdate = (month: number, stageId: string, field: keyof MonthlyPlan, value: number) => {
    const existingPlan = getPlan(month, stageId);
    const updatedPlan: MonthlyPlan = existingPlan ? {
      ...existingPlan,
      [field]: value
    } : {
      year: currentYear,
      month,
      funnel_stage_id: stageId,
      planned_contents: 0,
      planned_budget: 0,
      target_reach: 0,
      target_conversions: 0,
      actual_contents: 0,
      actual_budget: 0,
      actual_reach: 0,
      actual_conversions: 0,
      [field]: value
    };
    
    onUpdatePlan(updatedPlan);
    setEditingCell(null);
  };

  const calculateTotal = (stageId: string, field: keyof MonthlyPlan): number => {
    return plans
      .filter(p => p.year === currentYear && p.funnel_stage_id === stageId)
      .reduce((sum, p) => sum + (p[field] as number || 0), 0);
  };

  const calculateMonthlyTotal = (month: number, field: keyof MonthlyPlan): number => {
    return plans
      .filter(p => p.year === currentYear && p.month === month)
      .reduce((sum, p) => sum + (p[field] as number || 0), 0);
  };

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
              <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                <option>계획</option>
                <option>실적</option>
                <option>비교</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 퍼널 단계 시각화 */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-center space-x-2">
          {stages.sort((a, b) => a.stage_order - b.stage_order).map((stage, index) => (
            <React.Fragment key={stage.id}>
              <div className="text-center">
                <div 
                  className="w-32 h-24 flex items-center justify-center rounded-lg text-white font-medium text-sm"
                  style={{ 
                    backgroundColor: stage.color,
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
                <div className="text-xs text-gray-600 mt-2">
                  {stage.description}
                </div>
              </div>
              {index < stages.length - 1 && (
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <th className="text-left p-4 font-medium text-gray-700">월</th>
              {stages.sort((a, b) => a.stage_order - b.stage_order).map(stage => (
                <th key={stage.id} className="text-center p-4 font-medium" style={{ color: stage.color }}>
                  {stage.name}
                </th>
              ))}
              <th className="text-center p-4 font-medium text-gray-700">월 합계</th>
            </tr>
          </thead>
          <tbody>
            {months.map((month, monthIndex) => {
              const monthNumber = monthIndex + 1;
              const isCurrentMonth = new Date().getMonth() === monthIndex;
              
              return (
                <tr 
                  key={monthNumber}
                  className={`border-b border-gray-200 hover:bg-gray-50 ${
                    isCurrentMonth ? 'bg-purple-50' : ''
                  }`}
                >
                  <td className="p-4 font-medium text-gray-700">
                    {month}
                    {isCurrentMonth && (
                      <span className="ml-2 text-xs text-purple-600">(현재)</span>
                    )}
                  </td>
                  {stages.sort((a, b) => a.stage_order - b.stage_order).map(stage => {
                    const plan = getPlan(monthNumber, stage.id);
                    const cellId = `${monthNumber}-${stage.id}`;
                    const isEditing = editingCell === cellId;
                    
                    return (
                      <td key={stage.id} className="p-2 text-center">
                        <div className="space-y-1">
                          <div className="text-sm">
                            {isEditing ? (
                              <input
                                type="number"
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                onBlur={() => {
                                  handleCellUpdate(monthNumber, stage.id, 'planned_contents', parseInt(tempValue) || 0);
                                }}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCellUpdate(monthNumber, stage.id, 'planned_contents', parseInt(tempValue) || 0);
                                  }
                                }}
                                className="w-16 px-1 py-0.5 text-center border border-purple-500 rounded"
                                autoFocus
                              />
                            ) : (
                              <button
                                onClick={() => handleCellClick(cellId, plan?.planned_contents || 0)}
                                className="w-16 px-1 py-0.5 hover:bg-gray-100 rounded"
                              >
                                {plan?.planned_contents || 0}
                              </button>
                            )}
                            <span className="text-xs text-gray-500 ml-1">개</span>
                          </div>
                          {plan && plan.actual_contents > 0 && (
                            <div className="text-xs text-green-600">
                              실적: {plan.actual_contents}개
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-4 text-center font-medium text-gray-700">
                    {calculateMonthlyTotal(monthNumber, 'planned_contents')}개
                  </td>
                </tr>
              );
            })}
            {/* 연간 합계 */}
            <tr className="bg-gray-100 font-medium">
              <td className="p-4 text-gray-700">연간 합계</td>
              {stages.sort((a, b) => a.stage_order - b.stage_order).map(stage => (
                <td key={stage.id} className="p-4 text-center">
                  {calculateTotal(stage.id, 'planned_contents')}개
                </td>
              ))}
              <td className="p-4 text-center text-gray-700">
                {plans
                  .filter(p => p.year === currentYear)
                  .reduce((sum, p) => sum + p.planned_contents, 0)}개
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
              {plans.filter(p => p.year === currentYear).reduce((sum, p) => sum + p.planned_contents, 0)}
            </div>
            <div className="text-sm text-gray-600">계획된 콘텐츠</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {plans.filter(p => p.year === currentYear).reduce((sum, p) => sum + p.actual_contents, 0)}
            </div>
            <div className="text-sm text-gray-600">발행된 콘텐츠</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(
                plans.filter(p => p.year === currentYear && p.planned_contents > 0).length / 12 * 100
              )}%
            </div>
            <div className="text-sm text-gray-600">계획 수립률</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {plans.filter(p => p.year === currentYear).length > 0 
                ? Math.round(
                    plans.filter(p => p.year === currentYear).reduce((sum, p) => sum + p.actual_contents, 0) /
                    plans.filter(p => p.year === currentYear).reduce((sum, p) => sum + p.planned_contents, 0) * 100
                  ) || 0
                : 0}%
            </div>
            <div className="text-sm text-gray-600">달성률</div>
          </div>
        </div>
      </div>
    </div>
  );
};