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
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-6 flex-wrap">
      {/* 전체 점수 */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getScoreBgColor(score.total)}`}>
            {score.total}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">제목 최적화 점수</h3>
            <p className={`text-xs ${getScoreColor(score.total)}`}>
              {getScoreIcon(score.total)} {score.total >= 80 ? '우수' : score.total >= 60 ? '양호' : '개선 필요'}
            </p>
          </div>
        </div>
        
        {/* 세부 점수 - 가로 배치 */}
        <div className="flex gap-6 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-600 text-xs">타겟 매칭</span>
            <span className={`font-semibold ${getScoreColor(score.audienceMatch)}`}>{score.audienceMatch}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-600 text-xs">심리 효과</span>
            <span className={`font-semibold ${getScoreColor(score.psychEffect)}`}>{score.psychEffect}</span>
        </div>
          <div className="flex flex-col">
            <span className="text-gray-600 text-xs">브랜드 적합성</span>
            <span className={`font-semibold ${getScoreColor(score.brandFit)}`}>{score.brandFit}</span>
      </div>
          <div className="flex flex-col">
            <span className="text-gray-600 text-xs">전환 잠재력</span>
            <span className={`font-semibold ${getScoreColor(score.conversionPotential)}`}>{score.conversionPotential}</span>
        </div>
      </div>

        {/* AI 추천 제목 버튼 */}
      {showRecommendations && (
          <div className="ml-auto">
            <button
              onClick={generateRecommendations}
              disabled={isGeneratingRecommendations}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isGeneratingRecommendations ? '생성 중...' : 'AI 추천 제목'}
            </button>
          </div>
        )}
          </div>
          
      {/* AI 추천 제목 목록 (있을 때만 표시) */}
          {recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
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
                className="p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => onRecommendationSelect?.(recTitle)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-800">{recTitle}</span>
                        <span className={`text-xs px-2 py-1 rounded ${getScoreBgColor(recScore.total)} text-white`}>
                    {recScore.total}점
                        </span>
                    </div>
                  </div>
                );
              })}
        </div>
      )}
    </div>
  );
};
