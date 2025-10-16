import React, { useState, useEffect } from 'react';
import { TitleScorer } from './TitleScorer';
import { scoreTitle, ScoreInput, ScoreBreakdown, Persona, BrandWeight, ConversionGoal } from '../../lib/titleScoring';

interface MessageOptimizerProps {
  content: string;
  channelType: 'sms' | 'kakao' | 'naver';
  onScoreChange?: (score: ScoreBreakdown) => void;
  showDetails?: boolean;
}

export const MessageOptimizer: React.FC<MessageOptimizerProps> = ({
  content,
  channelType,
  onScoreChange,
  showDetails = true
}) => {
  const [score, setScore] = useState<ScoreBreakdown | null>(null);

  // 채널별 최적화 설정
  const getChannelConfig = () => {
    switch (channelType) {
      case 'sms':
        return {
          persona: 'unknown' as Persona,
          contentType: 'marketing',
          targetProduct: 'service',
          brandWeight: 'medium' as BrandWeight,
          conversionGoal: 'homepage_visit' as ConversionGoal
        };
      case 'kakao':
        return {
          persona: 'unknown' as Persona,
          contentType: 'social',
          targetProduct: 'service',
          brandWeight: 'high' as BrandWeight,
          conversionGoal: 'engagement' as ConversionGoal
        };
      case 'naver':
        return {
          persona: 'unknown' as Persona,
          contentType: 'blog',
          targetProduct: 'service',
          brandWeight: 'medium' as BrandWeight,
          conversionGoal: 'homepage_visit' as ConversionGoal
        };
      default:
        return {
          persona: 'unknown' as Persona,
          contentType: 'marketing',
          targetProduct: 'service',
          brandWeight: 'medium' as BrandWeight,
          conversionGoal: 'homepage_visit' as ConversionGoal
        };
    }
  };

  // 점수 계산
  useEffect(() => {
    console.log('MessageOptimizer - content changed:', content);
    if (content.trim()) {
      const config = getChannelConfig();
      const input: ScoreInput = {
        title: content,
        persona: config.persona,
        contentType: config.contentType,
        targetProduct: config.targetProduct,
        brandWeight: config.brandWeight,
        conversionGoal: config.conversionGoal
      };
      const newScore = scoreTitle(input);
      console.log('MessageOptimizer - calculated score:', newScore);
      setScore(newScore);
      onScoreChange?.(newScore);
    } else {
      console.log('MessageOptimizer - no content, clearing score');
      setScore(null);
    }
  }, [content, channelType, onScoreChange]);

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

  const getChannelName = () => {
    switch (channelType) {
      case 'sms': return 'SMS/MMS';
      case 'kakao': return '카카오 채널';
      case 'naver': return '네이버 블로그';
      default: return '메시지';
    }
  };

  if (!score || !content.trim()) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* 전체 점수 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getScoreBgColor(score.total)}`}>
            {score.total}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{getChannelName()} 최적화 점수</h3>
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
      {showDetails && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">타겟 매칭</span>
              <span className="font-medium">{score.audienceMatch}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${score.audienceMatch}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">심리 효과</span>
              <span className="font-medium">{score.psychEffect}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${score.psychEffect}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">브랜드 적합성</span>
              <span className="font-medium">{score.brandFit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${score.brandFit}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">전환 잠재력</span>
              <span className="font-medium">{score.conversionPotential}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${score.conversionPotential}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 채널별 최적화 팁 */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="font-medium text-gray-800 mb-2">💡 {getChannelName()} 최적화 팁</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          {channelType === 'sms' && (
            <>
              <li>• 간결하고 명확한 메시지 작성</li>
              <li>• 행동 유도 문구 포함</li>
              <li>• 90자(SMS) 또는 2000자(LMS/MMS) 제한 준수</li>
            </>
          )}
          {channelType === 'kakao' && (
            <>
              <li>• 친근하고 개인적인 톤 사용</li>
              <li>• 이모지와 버튼 활용</li>
              <li>• 명확한 행동 유도</li>
            </>
          )}
          {channelType === 'naver' && (
            <>
              <li>• SEO 키워드 포함</li>
              <li>• 구조화된 제목과 내용</li>
              <li>• 메타 태그 최적화</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};
