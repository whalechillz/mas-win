import React, { useState, useEffect } from 'react';
import { 
  STORYTELLING_FRAMEWORKS, 
  CONTENT_TYPE_FRAMEWORK_MAPPING, 
  PERSONA_STRUCTURE, 
  CUSTOMER_CHANNEL_CTA 
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
  className?: string;
}

export default function BrandStrategySelector({
  config,
  onStrategyChange,
  onApplyStrategy,
  onGenerateVariation,
  showVariationButton = false,
  className = ""
}: BrandStrategySelectorProps) {
  // 기본 설정
  const defaultConfig: BrandStrategyConfig = {
    brandName: '마쓰구',
    contentTypes: ['골프 정보', '튜토리얼', '고객 후기', '고객 스토리', '이벤트'],
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

  // 페르소나 변경 시 오디언스 온도 추천
  const getRecommendedAudience = (persona: string) => {
    const personaMap = {
      'tech_enthusiast': 'hot',
      'senior_fitting': 'warm',
      'high_rebound_enthusiast': 'hot',
      'competitive_maintainer': 'warm',
      'health_conscious_senior': 'warm',
      'returning_60plus': 'cold',
      'distance_seeking_beginner': 'cold'
    };
    return personaMap[persona] || 'warm';
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

  // 전략 변경 핸들러
  const handleStrategyChange = (field: keyof BrandStrategy, value: string) => {
    const newStrategy = { ...strategy, [field]: value };
    
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

  // 베리에이션 생성 핸들러
  const handleGenerateVariation = () => {
    // 브랜드 강도별 베리에이션 생성
    const variations = [];
    
    // 낮음, 중간, 높음 브랜드 강도별 베리에이션
    const brandStrengths = ['낮음', '중간', '높음'];
    
    brandStrengths.forEach(strength => {
      const variation = {
        ...strategy,
        brandStrength: strength,
        variationType: 'brand_strength',
        variationName: `${strategy.contentType} - ${strength} 브랜드 강도`
      };
      variations.push(variation);
    });
    
    // 페르소나별 베리에이션 생성
    const personas = ['tech_enthusiast', 'senior_fitting', 'high_rebound_enthusiast', 'competitive_maintainer', 'health_conscious_senior'];
    
    personas.forEach(persona => {
      const variation = {
        ...strategy,
        persona: persona,
        variationType: 'persona',
        variationName: `${strategy.contentType} - ${PERSONA_STRUCTURE.main[persona]?.name || PERSONA_STRUCTURE.sub[persona]?.name}`
      };
      variations.push(variation);
    });
    
    console.log('생성된 베리에이션:', variations);
    onGenerateVariation?.(variations);
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

          {/* 오디언스 온도 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">오디언스 온도</label>
            <select 
              value={strategy.audienceTemperature}
              onChange={(e) => handleStrategyChange('audienceTemperature', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <optgroup label="기본 온도">
                <option value="cold">Cold (관심 낮음)</option>
                <option value="warm">Warm (관심 보통)</option>
                <option value="hot">Hot (관심 높음)</option>
              </optgroup>
              <optgroup label="문의 단계">
                <option value="pre_customer_inquiry_phone">전화 문의</option>
                <option value="pre_customer_inquiry_kakao">카카오 문의</option>
                <option value="pre_customer_inquiry_website">홈페이지 문의</option>
                <option value="pre_customer_test_booking">시타 예약</option>
              </optgroup>
              <optgroup label="구매 고객">
                <option value="customer_purchase_lt_1y">구매 1년 이내</option>
                <option value="customer_purchase_1_2y">구매 1-2년</option>
                <option value="customer_purchase_2_5y">구매 2-5년</option>
                <option value="customer_purchase_gte_5y">구매 5년 이상</option>
              </optgroup>
            </select>
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

          {/* 고객 채널 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">고객 채널</label>
            <select 
              value={strategy.channel}
              onChange={(e) => handleStrategyChange('channel', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="local">근거리 고객</option>
              <option value="nationwide">전국 고객</option>
              <option value="event">행사 관심 고객</option>
              <option value="detail">상세 정보 탐색 고객</option>
              <option value="vip">VIP 고객</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              CTA: {autoMatchedValues.cta}
            </p>
          </div>

          {/* 전환 목표 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">전환 목표</label>
            <select 
              value={strategy.conversionGoal}
              onChange={(e) => handleStrategyChange('conversionGoal', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="awareness">인지 단계 (홈페이지 방문)</option>
              <option value="consideration">고려 단계 (상담 예약)</option>
              <option value="decision">결정 단계 (구매)</option>
              <option value="funnel">퍼널 페이지 (25-10 등)</option>
            </select>
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
            onClick={handleApplyStrategy}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            브랜드 전략 적용
          </button>
          
          {showVariationButton && (
            <button
              onClick={handleGenerateVariation}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              🎯 브랜드 강도별 & 페르소나별 베리에이션 생성 (8개)
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
