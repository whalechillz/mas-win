import React from 'react';
import { SEORecommendation } from '../types/metadata.types';
import { getScoreColor, getScoreBgColor } from '../utils/validation';

interface SEOScoreProps {
  score: number;
  recommendations: SEORecommendation[];
  onRecommendationClick?: (field: string) => void;
}

export const SEOScore: React.FC<SEOScoreProps> = ({
  score,
  recommendations,
  onRecommendationClick
}) => {
  const getScoreIcon = (score: number) => {
    if (score >= 90) return '🏆';
    if (score >= 80) return '⭐';
    if (score >= 60) return '👍';
    return '⚠️';
  };

  const getScoreText = (score: number) => {
    if (score >= 90) return '완벽';
    if (score >= 80) return '우수';
    if (score >= 60) return '양호';
    return '개선 필요';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* 전체 SEO 점수 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getScoreBgColor(score)}`}>
            {score}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">최적화 점수</h3>
            <p className={`text-sm ${getScoreColor(score)}`}>
              {getScoreIcon(score)} {getScoreText(score)}
            </p>
          </div>
        </div>
        
        {/* 진행률 바 */}
        <div className="flex-1 max-w-32">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      {/* 개별 필드 권장사항 */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">개선 권장사항</h4>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                  rec.score >= 80 ? 'bg-green-50 border-green-200' :
                  rec.score >= 60 ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}
                onClick={() => onRecommendationClick?.(rec.field)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {rec.field.replace('_', ' ')}
                  </span>
                  <span className={`text-xs font-medium ${getScoreColor(rec.score)}`}>
                    {rec.score}/100
                  </span>
                </div>
                
                <div className="text-xs text-gray-600 mb-2">
                  현재: {rec.current}자 | 권장: {rec.recommended.min}-{rec.recommended.max}자
                </div>
                
                {rec.suggestions.length > 0 && (
                  <div className="text-xs text-gray-500">
                    💡 {rec.suggestions[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO 팁 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h5 className="text-sm font-medium text-blue-800 mb-2">💡 최적화 팁</h5>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• ALT 텍스트는 이미지를 정확히 설명하세요</li>
          <li>• 키워드는 쉼표로 구분하여 관련성 높은 것만 사용하세요</li>
          <li>• 제목은 간결하고 매력적으로 작성하세요</li>
          <li>• 설명은 사용자에게 유용한 정보를 제공하세요</li>
        </ul>
      </div>
    </div>
  );
};
