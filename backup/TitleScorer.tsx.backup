import React, { useState, useEffect } from 'react';
import { scoreTitle, ScoreInput, ScoreBreakdown, Persona, BrandWeight, ConversionGoal } from '../../lib/titleScoring';

interface TitleScorerProps {
  title: string;
  persona: Persona;
  contentType: string;
  targetProduct: string;
  brandWeight: BrandWeight;
  conversionGoal: ConversionGoal;
  onScoreChange?: (score: ScoreBreakdown) => void;
  showRecommendations?: boolean;
  onRecommendationSelect?: (title: string) => void;
}

export const TitleScorer: React.FC<TitleScorerProps> = ({
  title,
  persona,
  contentType,
  targetProduct,
  brandWeight,
  conversionGoal,
  onScoreChange,
  showRecommendations = true,
  onRecommendationSelect
}) => {
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);

  // 점수 계산
  useEffect(() => {
    if (title.trim()) {
      const input: ScoreInput = {
        title,
        persona,
        contentType,
        targetProduct,
        brandWeight,
        conversionGoal
      };
      const newScore = scoreTitle(input);
      setScore(newScore);
      onScoreChange?.(newScore);
    }
  }, [title, persona, contentType, targetProduct, brandWeight, conversionGoal, onScoreChange]);

  // AI 추천 제목 생성
  const generateRecommendations = async () => {
    if (!title.trim()) return;
    
    setIsGeneratingRecommendations(true);
    try {
      const response = await fetch('/api/generate-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalTitle: title,
          persona,
          contentType,
          targetProduct,
          brandWeight,
          conversionGoal
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.titles || []);
      }
    } catch (error) {
      console.error('제목 추천 생성 오류:', error);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return '🏆';
    if (score >= 60) return '⭐';
    return '⚠️';
  };

  if (!score) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* 전체 점수 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getScoreBgColor(score.total)}`}>
            {score.total}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">제목 최적화 점수</h3>
            <p className={`text-sm ${getScoreColor(score.total)}`}>
              {getScoreIcon(score.total)} {score.total >= 80 ? '우수' : score.total >= 60 ? '양호' : '개선 필요'}
            </p>
          </div>
        </div>
        
        {/* 진행률 바 */}
        <div className="flex-1 max-w-32">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                score.total >= 80 ? 'bg-green-500' : score.total >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${score.total}%` }}
            />
          </div>
        </div>
      </div>

      {/* 세부 점수 */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">타겟 매칭</span>
          <span className={getScoreColor(score.audienceMatch)}>{score.audienceMatch}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">심리 효과</span>
          <span className={getScoreColor(score.psychEffect)}>{score.psychEffect}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">브랜드 적합성</span>
          <span className={getScoreColor(score.brandFit)}>{score.brandFit}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">전환 잠재력</span>
          <span className={getScoreColor(score.conversionPotential)}>{score.conversionPotential}</span>
        </div>
      </div>

      {/* AI 추천 제목 */}
      {showRecommendations && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-800">AI 추천 제목</h4>
            <button
              onClick={generateRecommendations}
              disabled={isGeneratingRecommendations}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isGeneratingRecommendations ? '생성 중...' : '추천 생성'}
            </button>
          </div>
          
          {recommendations.length > 0 && (
            <div className="space-y-2">
              {recommendations.map((recTitle, index) => {
                const recScore = scoreTitle({
                  title: recTitle,
                  persona,
                  contentType,
                  targetProduct,
                  brandWeight,
                  conversionGoal
                });
                
                return (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => onRecommendationSelect?.(recTitle)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-800">{recTitle}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${getScoreBgColor(recScore.total)} text-white`}>
                          {recScore.total}
                        </span>
                        <span className="text-xs text-gray-500">점</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
