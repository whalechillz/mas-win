import React, { useState } from 'react';
import { Zap, DollarSign, Settings, Info, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';

export const AIGenerationSettings = ({ onSettingsChange }) => {
  const [useAI, setUseAI] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [monthlyBudget, setMonthlyBudget] = useState(100);
  const [customSettings, setCustomSettings] = useState({
    contentModel: 'claude-sonnet',
    usePerplexity: false,
    useImageGen: true,
    imageCount: 3
  });

  // AI 플랜 정의
  const aiPlans = {
    basic: {
      name: '베이직',
      price: '$50-100/월',
      features: [
        'GPT-3.5 기반 생성',
        '기본 템플릿 활용',
        '이미지 2개/포스트',
        '월 30개 콘텐츠'
      ],
      models: {
        content: 'gpt-3.5-turbo',
        image: 'stable-diffusion'
      }
    },
    standard: {
      name: '스탠다드',
      price: '$200-300/월',
      features: [
        'Claude Sonnet 3.5',
        'Perplexity 트렌드 분석',
        '이미지 3개/포스트',
        '월 50개 콘텐츠'
      ],
      models: {
        content: 'claude-sonnet',
        trends: 'perplexity',
        image: 'fal-ai'
      }
    },
    premium: {
      name: '프리미엄',
      price: '$500+/월',
      features: [
        'Claude Opus 4 최신',
        'Perplexity Pro 리서치',
        '이미지 5개/포스트',
        '무제한 콘텐츠'
      ],
      models: {
        content: 'claude-opus-4',
        trends: 'perplexity-pro',
        image: 'fal-ai-pro'
      }
    },
    custom: {
      name: '커스텀',
      price: '직접 설정',
      features: [
        '모델 직접 선택',
        '예산 맞춤 설정',
        '기능 선택 가능',
        '유연한 사용'
      ]
    }
  };

  const handlePlanChange = (plan) => {
    setSelectedPlan(plan);
    
    // 플랜에 따른 설정 자동 업데이트
    if (plan !== 'custom') {
      const planModels = aiPlans[plan].models;
      setCustomSettings({
        contentModel: planModels.content || 'gpt-3.5-turbo',
        usePerplexity: !!planModels.trends,
        useImageGen: !!planModels.image,
        imageCount: plan === 'premium' ? 5 : plan === 'standard' ? 3 : 2
      });
    }
    
    // 부모 컴포넌트에 설정 전달
    onSettingsChange?.({
      useAI,
      plan,
      budget: monthlyBudget,
      settings: customSettings
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold">AI 자동 생성 설정</h2>
        </div>
        
        {/* AI 사용 토글 */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={useAI}
            onChange={(e) => {
              setUseAI(e.target.checked);
              onSettingsChange?.({
                useAI: e.target.checked,
                plan: selectedPlan,
                budget: monthlyBudget,
                settings: customSettings
              });
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ml-3 text-sm font-medium">
            {useAI ? 'AI 켜짐' : 'AI 꺼짐'}
          </span>
        </label>
      </div>

      {/* AI 설정 영역 */}
      {useAI && (
        <>
          {/* 플랜 선택 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">AI 플랜 선택</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(aiPlans).map(([key, plan]) => (
                <div
                  key={key}
                  onClick={() => handlePlanChange(key)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPlan === key
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{plan.name}</h4>
                    {key === 'premium' && (
                      <span className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full">
                        추천
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{plan.price}</p>
                  <div className="text-xs text-gray-500">
                    {plan.features[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 선택된 플랜 상세 정보 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium mb-2">{aiPlans[selectedPlan].name} 플랜 특징</h4>
                <ul className="space-y-1">
                  {aiPlans[selectedPlan].features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 예산 설정 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">월 예산 설정</label>
              <span className="text-lg font-semibold text-purple-600">${monthlyBudget}</span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #9333ea 0%, #9333ea ${(monthlyBudget - 50) / 950 * 100}%, #e5e7eb ${(monthlyBudget - 50) / 950 * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$50</span>
              <span>$500</span>
              <span>$1000+</span>
            </div>
          </div>

          {/* 커스텀 설정 (커스텀 플랜 선택 시) */}
          {selectedPlan === 'custom' && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">상세 설정</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">콘텐츠 생성 모델</label>
                  <select
                    value={customSettings.contentModel}
                    onChange={(e) => setCustomSettings({...customSettings, contentModel: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo ($)</option>
                    <option value="gpt-4">GPT-4 ($$)</option>
                    <option value="claude-sonnet">Claude Sonnet 3.5 ($$$)</option>
                    <option value="claude-opus-4">Claude Opus 4 ($$$$)</option>
                  </select>
                </div>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={customSettings.usePerplexity}
                    onChange={(e) => setCustomSettings({...customSettings, usePerplexity: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">Perplexity 트렌드 분석 사용 (+$50/월)</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={customSettings.useImageGen}
                    onChange={(e) => setCustomSettings({...customSettings, useImageGen: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">AI 이미지 생성 사용</span>
                </label>

                {customSettings.useImageGen && (
                  <div>
                    <label className="text-sm text-gray-600">포스트당 이미지 수</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={customSettings.imageCount}
                      onChange={(e) => setCustomSettings({...customSettings, imageCount: parseInt(e.target.value)})}
                      className="mt-1 w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 예상 결과 */}
          <div className="mt-6 bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium">예상 생성 결과</h4>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {selectedPlan === 'premium' ? '100+' : selectedPlan === 'standard' ? '50' : '30'}
                </p>
                <p className="text-xs text-gray-600">월 콘텐츠 수</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {selectedPlan === 'premium' ? '95%' : selectedPlan === 'standard' ? '85%' : '70%'}
                </p>
                <p className="text-xs text-gray-600">품질 점수</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(monthlyBudget / 30)}
                </p>
                <p className="text-xs text-gray-600">콘텐츠당 비용($)</p>
              </div>
            </div>
          </div>

          {/* 경고 메시지 */}
          {monthlyBudget < 200 && (
            <div className="mt-4 flex items-start gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <p>낮은 예산으로는 기본적인 품질의 콘텐츠만 생성 가능합니다. SEO 성과를 위해서는 $200 이상을 권장합니다.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
