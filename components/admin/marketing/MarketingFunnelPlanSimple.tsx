'use client';

import React, { useState } from 'react';
import { Target, ChevronRight, Users, Eye, MessageSquare, Calendar, ShoppingCart } from 'lucide-react';

interface FunnelStage {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

const MarketingFunnelPlanSimple: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  const funnelStages: FunnelStage[] = [
    { name: '인지 (Awareness)', value: 10000, percentage: 100, color: 'bg-blue-500' },
    { name: '관심 (Interest)', value: 5000, percentage: 50, color: 'bg-indigo-500' },
    { name: '고려 (Consideration)', value: 2000, percentage: 20, color: 'bg-purple-500' },
    { name: '구매 의도 (Intent)', value: 500, percentage: 5, color: 'bg-pink-500' },
    { name: '구매 (Purchase)', value: 100, percentage: 1, color: 'bg-red-500' }
  ];

  const stageIcons = [
    <Eye className="w-5 h-5" />,
    <Users className="w-5 h-5" />,
    <MessageSquare className="w-5 h-5" />,
    <Calendar className="w-5 h-5" />,
    <ShoppingCart className="w-5 h-5" />
  ];

  return (
    <div className="bg-white rounded-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Target className="w-5 h-5" />
          마케팅 퍼널 플랜
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          고객 여정의 각 단계별 전환율을 관리하고 최적화합니다.
        </p>
      </div>

      {/* 퍼널 시각화 */}
      <div className="space-y-3">
        {funnelStages.map((stage, index) => (
          <div
            key={index}
            onClick={() => setSelectedStage(index === selectedStage ? null : index)}
            className="cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {stageIcons[index]}
                <span className="font-medium">{stage.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{stage.value.toLocaleString()}명</span>
                <span className="text-sm font-medium">{stage.percentage}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
              <div
                className={`h-full ${stage.color} transition-all duration-500 flex items-center justify-end pr-3`}
                style={{ width: `${stage.percentage}%` }}
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </div>
            
            {selectedStage === index && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">최적화 전략</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 타겟 고객층 분석 및 세분화</li>
                  <li>• A/B 테스트를 통한 전환율 개선</li>
                  <li>• 콘텐츠 최적화 및 개인화</li>
                  <li>• 리타겟팅 캠페인 실행</li>
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 요약 정보 */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900">전체 전환율</h4>
          <p className="text-2xl font-bold text-blue-600 mt-1">1.0%</p>
          <p className="text-xs text-blue-700 mt-1">인지 → 구매</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-900">목표 달성률</h4>
          <p className="text-2xl font-bold text-green-600 mt-1">85%</p>
          <p className="text-xs text-green-700 mt-1">월간 목표 대비</p>
        </div>
      </div>
    </div>
  );
};

export default MarketingFunnelPlanSimple;