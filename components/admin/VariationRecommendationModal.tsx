import React, { useState, useEffect } from 'react';

interface VariationRecommendation {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  preview: string;
  brandStrength?: string;
  persona?: string;
  framework?: string;
}

interface VariationRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVariation: (variation: VariationRecommendation) => void;
  currentContent: string;
  brandStrategy: {
    contentType: string;
    persona: string;
    framework: string;
    channel: string;
    brandStrength: string;
    audienceTemperature: string;
    conversionGoal: string;
  };
}

export default function VariationRecommendationModal({
  isOpen,
  onClose,
  onSelectVariation,
  currentContent,
  brandStrategy
}: VariationRecommendationModalProps) {
  const [recommendations, setRecommendations] = useState<VariationRecommendation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<VariationRecommendation | null>(null);

  // 기본 추천 생성 로직
  const generateBasicRecommendations = (strategy: any): VariationRecommendation[] => {
    const baseRecommendations: VariationRecommendation[] = [
      {
        id: 'current',
        type: 'current',
        name: '현재 전략',
        description: '선택한 브랜드 전략 그대로 적용',
        icon: '🎯',
        preview: `${strategy.contentType} + ${strategy.persona} + ${strategy.framework}`,
        brandStrength: strategy.brandStrength,
        persona: strategy.persona,
        framework: strategy.framework
      }
    ];

    // 브랜드 강도 변경 추천
    const getNextBrandStrength = (current: string) => {
      const levels = ['낮음', '중간', '높음'];
      const currentIndex = levels.indexOf(current);
      return levels[(currentIndex + 1) % levels.length];
    };

    if (strategy.brandStrength !== '높음') {
      baseRecommendations.push({
        id: 'brand_strength',
        type: 'brand_strength',
        name: '브랜드 강도 증가',
        description: `브랜드 언급을 ${getNextBrandStrength(strategy.brandStrength)} 수준으로 강화`,
        icon: '💪',
        preview: `${strategy.contentType} + ${strategy.persona} + 브랜드 강화`,
        brandStrength: getNextBrandStrength(strategy.brandStrength),
        persona: strategy.persona,
        framework: strategy.framework
      });
    }

    // 대안 페르소나 추천
    const getAlternativePersona = (currentPersona: string) => {
      const alternatives: { [key: string]: string } = {
        'tech_enthusiast': 'senior_fitting',
        'senior_fitting': 'tech_enthusiast',
        'high_rebound_enthusiast': 'health_conscious_senior',
        'competitive_maintainer': 'returning_60plus',
        'health_conscious_senior': 'high_rebound_enthusiast',
        'returning_60plus': 'competitive_maintainer',
        'distance_seeking_beginner': 'tech_enthusiast'
      };
      return alternatives[currentPersona] || 'tech_enthusiast';
    };

    const alternativePersona = getAlternativePersona(strategy.persona);
    const personaNames: { [key: string]: string } = {
      'tech_enthusiast': '장비 선호 고객',
      'senior_fitting': '시니어 피팅 고객',
      'high_rebound_enthusiast': '고반발 드라이버 선호 상급 골퍼',
      'competitive_maintainer': '경기력 유지 중상급 골퍼',
      'health_conscious_senior': '건강 고려 시니어 골퍼',
      'returning_60plus': '60대 이상 재시작 골퍼',
      'distance_seeking_beginner': '비거리 향상 초급 골퍼'
    };

    baseRecommendations.push({
      id: 'persona_shift',
      type: 'persona',
      name: '페르소나 변경',
      description: `다른 고객층 타겟: ${personaNames[alternativePersona]}`,
      icon: '👥',
      preview: `${strategy.contentType} + ${personaNames[alternativePersona]} + ${strategy.framework}`,
      brandStrength: strategy.brandStrength,
      persona: alternativePersona,
      framework: strategy.framework
    });

    // 프레임워크 변경 추천
    const getAlternativeFramework = (currentFramework: string) => {
      const alternatives: { [key: string]: string[] } = {
        'PAS': ['STDC', 'FAB'],
        'STDC': ['PAS', 'AIDA'],
        'FAB': ['PAS', 'STDC'],
        'AIDA': ['STDC', 'ACCA'],
        'ACCA': ['AIDA', 'QUEST'],
        'QUEST': ['ACCA', 'pixar'],
        'pixar': ['heros_journey', 'storybrand'],
        'heros_journey': ['pixar', 'customer_journey'],
        'storybrand': ['heros_journey', 'cialdini'],
        'cialdini': ['storybrand', 'customer_journey'],
        'customer_journey': ['cialdini', 'pixar']
      };
      return alternatives[currentFramework]?.[0] || 'PAS';
    };

    const alternativeFramework = getAlternativeFramework(strategy.framework);
    const frameworkNames: { [key: string]: string } = {
      'PAS': 'PAS (문제-자극-해결)',
      'STDC': 'STDC (영웅-문제-발견-변화)',
      'FAB': 'FAB (기능-장점-혜택)',
      'AIDA': 'AIDA (주목-관심-욕구-행동)',
      'ACCA': 'ACCA (인식-이해-확신-행동)',
      'QUEST': 'QUEST (자격-이해-교육-자극-전환)',
      'pixar': '픽사 스토리',
      'heros_journey': '영웅의 여정',
      'storybrand': '스토리브랜드 7단계',
      'cialdini': '치알디니 설득 원칙',
      'customer_journey': '고객 여정 스토리'
    };

    baseRecommendations.push({
      id: 'framework_change',
      type: 'framework',
      name: '스토리텔링 변경',
      description: `다른 스토리 구조: ${frameworkNames[alternativeFramework]}`,
      icon: '📖',
      preview: `${strategy.contentType} + ${strategy.persona} + ${frameworkNames[alternativeFramework]}`,
      brandStrength: strategy.brandStrength,
      persona: strategy.persona,
      framework: alternativeFramework
    });

    return baseRecommendations;
  };

  useEffect(() => {
    if (isOpen && brandStrategy) {
      const recs = generateBasicRecommendations(brandStrategy);
      setRecommendations(recs);
    }
  }, [isOpen, brandStrategy]);

  const handleSelectVariation = (variation: VariationRecommendation) => {
    setSelectedVariation(variation);
  };

  const handleConfirmSelection = () => {
    if (selectedVariation) {
      onSelectVariation(selectedVariation);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🎯 베리에이션 추천</h2>
            <p className="text-gray-600 mt-1">원하는 베리에이션을 선택하면 AI가 맞춤 콘텐츠를 생성합니다</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 현재 전략 표시 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">현재 브랜드 전략</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
            <div><span className="font-medium">콘텐츠:</span> {brandStrategy.contentType}</div>
            <div><span className="font-medium">페르소나:</span> {brandStrategy.persona}</div>
            <div><span className="font-medium">프레임워크:</span> {brandStrategy.framework}</div>
            <div><span className="font-medium">브랜드 강도:</span> {brandStrategy.brandStrength}</div>
          </div>
        </div>

        {/* 추천 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {recommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedVariation?.id === recommendation.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSelectVariation(recommendation)}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{recommendation.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {recommendation.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {recommendation.description}
                  </p>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {recommendation.preview}
                  </div>
                </div>
                {selectedVariation?.id === recommendation.id && (
                  <span className="text-purple-500 text-xl">✓</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={!selectedVariation}
            className={`px-6 py-2 rounded-lg font-medium ${
              selectedVariation
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {selectedVariation ? '선택한 베리에이션으로 생성' : '베리에이션을 선택해주세요'}
          </button>
        </div>
      </div>
    </div>
  </div>
  );
}
