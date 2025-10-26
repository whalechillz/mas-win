import React, { useState, useEffect } from 'react';
import { 
  STORYTELLING_FRAMEWORKS, 
  CONTENT_TYPE_FRAMEWORK_MAPPING, 
  PERSONA_STRUCTURE, 
  CUSTOMER_CHANNEL_CTA,
  PERSONA_AUDIENCE_MAPPING,
  CONTENT_TYPE_RECOMMENDED_FRAMEWORKS,
  CONTENT_TYPE_DEFAULT_PERSONA
} from '../../lib/masgolf-brand-data';

interface BrandStrategyConfig {
  brandName: string;
  contentTypes: string[];
  personas: any;
  frameworks: any;
  channels: any;
  onStrategyChange?: (strategy: BrandStrategy) => void;
}

interface BrandStrategy {
  contentType: string;
  persona: string;
  framework: string;
  channel: string;
  brandStrength: string;
  audienceTemperature: string;
  conversionGoal: string;
}

interface BrandStrategySelectorProps {
  config?: BrandStrategyConfig;
  onStrategyChange?: (strategy: BrandStrategy) => void;
  onApplyStrategy?: (strategy: BrandStrategy) => void;
  onGenerateVariation?: (strategy: BrandStrategy) => void;
  showVariationButton?: boolean;
  isLoading?: boolean;
  className?: string;
}

export default function BrandStrategySelector({
  config,
  onStrategyChange,
  onApplyStrategy,
  onGenerateVariation,
  showVariationButton = false,
  isLoading = false,
  className = ""
}: BrandStrategySelectorProps) {
  // 기본 설정
  const defaultConfig: BrandStrategyConfig = {
    brandName: '마쓰구',
    contentTypes: ['골프 정보', '제품 정보', '고객 후기', '브랜드 스토리', '이벤트', '기술 및 성능'],
    personas: PERSONA_STRUCTURE,
    frameworks: STORYTELLING_FRAMEWORKS,
    channels: CUSTOMER_CHANNEL_CTA,
    onStrategyChange: onStrategyChange
  };

  const finalConfig = { ...defaultConfig, ...config };

  // 브랜드 전략 상태
  const [strategy, setStrategy] = useState<BrandStrategy>({
    contentType: '골프 정보',
    persona: 'tech_enthusiast',
    framework: 'PAS',
    channel: 'local',
    brandStrength: '낮음',
    audienceTemperature: 'warm',
    conversionGoal: 'consideration'
  });

  // 자동 매칭된 값들
  const [autoMatchedValues, setAutoMatchedValues] = useState({
    brandStrength: '낮음',
    frameworks: ['PAS', 'STDC'],
    cta: '시타 체험 안내 (예약 유도형)'
  });

  // 콘텐츠 유형 변경 시 자동 매칭
  useEffect(() => {
    const mapping = CONTENT_TYPE_FRAMEWORK_MAPPING[strategy.contentType];
    if (mapping) {
      setAutoMatchedValues({
        brandStrength: mapping.brandStrength,
        frameworks: mapping.frameworks,
        cta: CUSTOMER_CHANNEL_CTA[strategy.channel]?.cta || ''
      });
      
      // 브랜드 강도 자동 설정
      setStrategy(prev => ({
        ...prev,
        brandStrength: mapping.brandStrength,
        framework: mapping.frameworks[0] // 첫 번째 프레임워크 자동 선택
      }));
    }
  }, [strategy.contentType, strategy.channel]);

  // 페르소나 변경 시 오디언스 온도 추천 (자동 매핑 사용)
  const getRecommendedAudience = (persona: string) => {
    return PERSONA_AUDIENCE_MAPPING[persona] || 'warm';
  };

  // 브랜드 강도 시각화
  const getBrandStrengthDisplay = (strength: string) => {
    const strengthMap = {
      '낮음': { level: 0, color: 'bg-gray-200', text: '낮음 (순수 정보)' },
      '중간': { level: 1, color: 'bg-yellow-400', text: '중간 (브랜드 언급)' },
      '높음': { level: 2, color: 'bg-red-500', text: '높음 (강력한 브랜딩)' }
    };
    return strengthMap[strength] || strengthMap['낮음'];
  };

  // 전략 변경 핸들러 (자동 추천 포함)
  const handleStrategyChange = (field: keyof BrandStrategy, value: string) => {
    const newStrategy = { ...strategy, [field]: value };
    
    // 콘텐츠 유형 변경 시 자동 추천
    if (field === 'contentType') {
      const defaultPersona = CONTENT_TYPE_DEFAULT_PERSONA[value];
      const recommendedFrameworks = CONTENT_TYPE_RECOMMENDED_FRAMEWORKS[value];
      
      if (defaultPersona) {
        newStrategy.persona = defaultPersona;
        newStrategy.audienceTemperature = getRecommendedAudience(defaultPersona);
      }
      
      if (recommendedFrameworks && recommendedFrameworks.length > 0) {
        newStrategy.framework = recommendedFrameworks[0];
      }
    }
    
    // 페르소나 변경 시 오디언스 온도 자동 설정
    if (field === 'persona') {
      newStrategy.audienceTemperature = getRecommendedAudience(value);
    }
    
    setStrategy(newStrategy);
    onStrategyChange?.(newStrategy);
  };

  // 적용 버튼 핸들러
  const handleApplyStrategy = () => {
    onApplyStrategy?.(strategy);
  };

  // 베리에이션 생성 핸들러 - 추천 모달 열기
  const handleGenerateVariation = () => {
    console.log('베리에이션 추천 모달 열기:', strategy);
    onGenerateVariation?.(strategy);
  };

  return (
    <div className={`brand-strategy-selector ${className}`}>
      <div className="border-t border-gray-200 pt-8">
        <div className="flex items-center space-x-2 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">🎯 {finalConfig.brandName} 브랜드 전략</h3>
          <span className="text-sm text-gray-500">페르소나와 오디언스 온도에 맞춘 맞춤형 콘텐츠 생성</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 콘텐츠 유형 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">콘텐츠 유형</label>
            <select 
              value={strategy.contentType}
              onChange={(e) => handleStrategyChange('contentType', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {finalConfig.contentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              브랜드 강도: {autoMatchedValues.brandStrength}
            </p>
          </div>

          {/* 고객 페르소나 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">고객 페르소나</label>
            <select 
              value={strategy.persona}
              onChange={(e) => handleStrategyChange('persona', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <optgroup label="메인 페르소나">
                <option value="tech_enthusiast">장비 선호 고객 (Tech 얼리어답터)</option>
                <option value="senior_fitting">시니어 피팅 고객</option>
              </optgroup>
              <optgroup label="서브 페르소나">
                <option value="high_rebound_enthusiast">고반발 드라이버 선호 상급 골퍼</option>
                <option value="competitive_maintainer">경기력을 유지하고 싶은 중상급 골퍼</option>
                <option value="health_conscious_senior">건강을 고려한 비거리 증가 시니어 골퍼</option>
                <option value="returning_60plus">최근 골프를 다시 시작한 60대 이상 골퍼</option>
                <option value="distance_seeking_beginner">골프 입문자를 위한 비거리 향상 초급 골퍼</option>
              </optgroup>
            </select>
          </div>

          {/* 오디언스 온도 (3단계 단순화) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">오디언스 온도</label>
            <div className="space-y-2">
              {[
                { value: 'cold', label: 'Cold (관심 낮음)', description: '정보 탐색 단계' },
                { value: 'warm', label: 'Warm (관심 보통)', description: '고려 단계' },
                { value: 'hot', label: 'Hot (관심 높음)', description: '구매 의향 높음' }
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="audienceTemperature"
                    value={option.value}
                    checked={strategy.audienceTemperature === option.value}
                    onChange={(e) => handleStrategyChange('audienceTemperature', e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              온도 가중치: {strategy.audienceTemperature === 'hot' ? '3' : strategy.audienceTemperature === 'warm' ? '2' : '1'}
            </p>
          </div>

          {/* 스토리텔링 프레임워크 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">스토리텔링 프레임워크</label>
            <select 
              value={strategy.framework}
              onChange={(e) => handleStrategyChange('framework', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <optgroup label="설득형 프레임워크">
                <option value="PAS">PAS (Problem-Agitate-Solution)</option>
                <option value="STDC">STDC (Star-Trouble-Discovery-Change)</option>
                <option value="FAB">FAB (Feature-Advantage-Benefit)</option>
                <option value="AIDA">AIDA (Attention-Interest-Desire-Action)</option>
                <option value="ACCA">ACCA (Awareness-Comprehension-Conviction-Action)</option>
                <option value="QUEST">QUEST (Qualify-Understand-Educate-Stimulate-Transition)</option>
              </optgroup>
              <optgroup label="스토리텔링형 프레임워크">
                <option value="pixar">픽사 스토리 (영웅의 여정)</option>
                <option value="heros_journey">Hero's Journey (영웅의 여정)</option>
                <option value="storybrand">스토리브랜드 7단계</option>
                <option value="cialdini">치알디니 (설득의 6가지 원칙)</option>
                <option value="customer_journey">고객 여정 스토리</option>
              </optgroup>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {STORYTELLING_FRAMEWORKS[strategy.framework]?.description}
            </p>
          </div>

          {/* 고객 채널 (3개로 간소화) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">고객 채널</label>
            <div className="space-y-2">
              {[
                { value: 'local', label: '근거리 고객', description: '수원 갤러리아 광교 근처', cta: '시타 체험 안내' },
                { value: 'nationwide', label: '전국 고객', description: '온라인 구매', cta: '온라인 구매 페이지 유도' },
                { value: 'vip', label: 'VIP 고객', description: '기존 고객, 프리미엄 서비스', cta: '프리미엄 피팅, 전용 라인업' }
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="channel"
                    value={option.value}
                    checked={strategy.channel === option.value}
                    onChange={(e) => handleStrategyChange('channel', e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description} - {option.cta}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 전환 목표 (4단계 단순화) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">전환 목표</label>
            <div className="space-y-2">
              {[
                { value: 'awareness', label: '인지 단계', description: '홈페이지 방문, 브랜드 인지' },
                { value: 'consideration', label: '고려 단계', description: '상담 예약, 정보 수집' },
                { value: 'decision', label: '결정 단계', description: '구매 결정, 결제' },
                { value: 'advocacy', label: '옹호 단계', description: '추천, 리뷰, 재구매' }
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="conversionGoal"
                    value={option.value}
                    checked={strategy.conversionGoal === option.value}
                    onChange={(e) => handleStrategyChange('conversionGoal', e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 브랜드 강도 표시 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">브랜드 강도</label>
            <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {getBrandStrengthDisplay(strategy.brandStrength).text}
                </span>
                <span className="text-xs text-gray-500">
                  {getBrandStrengthDisplay(strategy.brandStrength).level}
                </span>
              </div>
              <div className="mt-2 flex space-x-1">
                {[0, 1, 2].map(level => (
                  <div
                    key={level}
                    className={`h-2 flex-1 rounded ${
                      level <= getBrandStrengthDisplay(strategy.brandStrength).level
                        ? getBrandStrengthDisplay(strategy.brandStrength).color
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="mt-6 flex space-x-4">
          <button
            type="button"
            onClick={handleApplyStrategy}
            disabled={isLoading}
            className={`px-6 py-3 rounded-lg focus:outline-none focus:ring-2 ${
              isLoading 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {isLoading ? '브랜드 전략 적용 중...' : '브랜드 전략 적용'}
          </button>
          
          {showVariationButton && (
            <button
              type="button"
              onClick={handleGenerateVariation}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              🎯 현실적인 베리에이션 생성 (3개)
            </button>
          )}
        </div>

        {/* 전략 요약 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">선택된 브랜드 전략 요약</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">콘텐츠 유형:</span> {strategy.contentType}
            </div>
            <div>
              <span className="font-medium">페르소나:</span> {PERSONA_STRUCTURE.main[strategy.persona]?.name || PERSONA_STRUCTURE.sub[strategy.persona]?.name}
            </div>
            <div>
              <span className="font-medium">프레임워크:</span> {STORYTELLING_FRAMEWORKS[strategy.framework]?.name}
            </div>
            <div>
              <span className="font-medium">채널:</span> {CUSTOMER_CHANNEL_CTA[strategy.channel]?.name}
            </div>
            <div>
              <span className="font-medium">브랜드 강도:</span> {strategy.brandStrength}
            </div>
            <div>
              <span className="font-medium">오디언스 온도:</span> {strategy.audienceTemperature}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
