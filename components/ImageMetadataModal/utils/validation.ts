import { MetadataForm, ValidationRule, SEORecommendation } from '../types/metadata.types';

// SEO 최적화 권장사항
export const SEO_RECOMMENDATIONS = {
  alt_text: { min: 50, max: 125, optimal: 100 },
  keywords: { min: 10, max: 30, optimal: 20 },
  title: { min: 25, max: 60, optimal: 30 },
  description: { min: 80, max: 160, optimal: 100 }
};

// 유효성 검사 규칙
export const VALIDATION_RULES: ValidationRule[] = [
  {
    field: 'alt_text',
    maxLength: 200,
    required: false,
    message: 'ALT 텍스트는 200자 이하로 입력해주세요'
  },
  {
    field: 'keywords',
    maxLength: 200,  // ✅ 키워드 길이 제한 증가 (50 → 200자, 카테고리 자동 추가 대응)
    required: false,
    message: '키워드는 200자 이하로 입력해주세요'
  },
  {
    field: 'title',
    maxLength: 100,
    required: false,
    message: '제목은 100자 이하로 입력해주세요'
  },
  {
    field: 'description',
    maxLength: 300,
    required: false,
    message: '설명은 300자 이하로 입력해주세요'
  },
  {
    field: 'category',
    required: true,
    message: '카테고리를 선택해주세요'
  }
];

// 폼 유효성 검사
export const validateForm = (form: MetadataForm): Record<string, string> => {
  const errors: Record<string, string> = {};

  VALIDATION_RULES.forEach(rule => {
    const value = form[rule.field];
    
    if (rule.required && (!value || value.trim() === '')) {
      errors[rule.field] = rule.message || `${rule.field}는 필수입니다`;
      return;
    }

    if (rule.maxLength && value && value.length > rule.maxLength) {
      errors[rule.field] = rule.message || `${rule.field}는 ${rule.maxLength}자 이하로 입력해주세요`;
    }
  });

  return errors;
};

// SEO 점수 계산
export const calculateSEOScore = (form: MetadataForm): number => {
  let totalScore = 0;
  let fieldCount = 0;

  Object.entries(SEO_RECOMMENDATIONS).forEach(([field, recommendation]) => {
    const value = form[field as keyof MetadataForm];
    if (value && value.trim()) {
      const length = value.length;
      let score = 0;

      if (length >= recommendation.min && length <= recommendation.max) {
        score = 100;
      } else if (length < recommendation.min) {
        score = Math.max(0, (length / recommendation.min) * 100);
      } else {
        score = Math.max(0, 100 - ((length - recommendation.max) / recommendation.max) * 50);
      }

      totalScore += score;
      fieldCount++;
    }
  });

  return fieldCount > 0 ? Math.round(totalScore / fieldCount) : 0;
};

// SEO 권장사항 생성
export const getSEORecommendations = (form: MetadataForm): SEORecommendation[] => {
  const recommendations: SEORecommendation[] = [];

  Object.entries(SEO_RECOMMENDATIONS).forEach(([field, recommendation]) => {
    const value = form[field as keyof MetadataForm];
    if (value) {
      const current = value.length;
      const score = calculateFieldScore(current, recommendation);
      const suggestions = generateSuggestions(field, current, recommendation);

      recommendations.push({
        field: field as keyof MetadataForm,
        current,
        recommended: recommendation,
        score,
        suggestions
      });
    }
  });

  return recommendations;
};

// 개별 필드 점수 계산
const calculateFieldScore = (current: number, recommendation: any): number => {
  if (current >= recommendation.min && current <= recommendation.max) {
    return 100;
  } else if (current < recommendation.min) {
    return Math.max(0, (current / recommendation.min) * 100);
  } else {
    return Math.max(0, 100 - ((current - recommendation.max) / recommendation.max) * 50);
  }
};

// 개선 제안 생성
const generateSuggestions = (field: string, current: number, recommendation: any): string[] => {
  const suggestions: string[] = [];

  if (current < recommendation.min) {
    suggestions.push(`${recommendation.min - current}자 더 추가하세요`);
  } else if (current > recommendation.max) {
    suggestions.push(`${current - recommendation.max}자 줄이세요`);
  } else {
    suggestions.push('적절한 길이입니다');
  }

  return suggestions;
};

// 색상 클래스 반환
export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

// 배경 색상 클래스 반환
export const getScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-green-50 border-green-200';
  if (score >= 60) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
};
