'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, Award, TrendingUp } from 'lucide-react';

interface SEOValidationResult {
  category: string;
  items: {
    name: string;
    status: 'pass' | 'warning' | 'fail';
    message: string;
    score: number;
  }[];
}

interface NaverSEOValidatorProps {
  title: string;
  content: string;
  tags: string[];
  images: { name: string; size: number; alt?: string }[];
  onScoreChange?: (score: number) => void;
}

export const NaverSEOValidator: React.FC<NaverSEOValidatorProps> = ({
  title,
  content,
  tags,
  images,
  onScoreChange
}) => {
  const [validationResults, setValidationResults] = useState<SEOValidationResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // 키워드 추출 함수
  const extractKeywords = (text: string): string[] => {
    // 명사 추출 로직 (간단한 버전)
    const words = text.split(/\s+/).filter(word => word.length > 2);
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  };

  useEffect(() => {
    validateContent();
  }, [title, content, tags, images]);

  const validateContent = () => {
    const results: SEOValidationResult[] = [];
    let score = 0;
    let maxScore = 0;

    // 1. 제목 검증
    const titleValidation: SEOValidationResult = {
      category: '제목 최적화',
      items: []
    };

    // 제목 길이
    if (title.length >= 25 && title.length <= 40) {
      titleValidation.items.push({
        name: '제목 길이',
        status: 'pass',
        message: `${title.length}자 (권장: 25-40자)`,
        score: 10
      });
      score += 10;
    } else {
      titleValidation.items.push({
        name: '제목 길이',
        status: 'warning',
        message: `${title.length}자 (권장: 25-40자)`,
        score: 5
      });
      score += 5;
    }
    maxScore += 10;

    // 감성 키워드 포함
    const emotionalKeywords = ['최고', '추천', '인기', '필수', '꿀팁', '총정리', '완벽'];
    const hasEmotionalKeyword = emotionalKeywords.some(keyword => title.includes(keyword));
    if (hasEmotionalKeyword) {
      titleValidation.items.push({
        name: '감성 키워드',
        status: 'pass',
        message: '감성 키워드 포함됨',
        score: 5
      });
      score += 5;
    } else {
      titleValidation.items.push({
        name: '감성 키워드',
        status: 'warning',
        message: '감성 키워드 추가 권장',
        score: 0
      });
    }
    maxScore += 5;

    results.push(titleValidation);

    // 2. 본문 검증
    const contentValidation: SEOValidationResult = {
      category: '본문 최적화',
      items: []
    };

    // 본문 길이
    const contentLength = content.length;
    if (contentLength >= 1500 && contentLength <= 3000) {
      contentValidation.items.push({
        name: '본문 길이',
        status: 'pass',
        message: `${contentLength}자 (권장: 1,500-3,000자)`,
        score: 15
      });
      score += 15;
    } else if (contentLength >= 1000) {
      contentValidation.items.push({
        name: '본문 길이',
        status: 'warning',
        message: `${contentLength}자 (권장: 1,500-3,000자)`,
        score: 10
      });
      score += 10;
    } else {
      contentValidation.items.push({
        name: '본문 길이',
        status: 'fail',
        message: `${contentLength}자 (최소 1,000자 필요)`,
        score: 0
      });
    }
    maxScore += 15;

    // 키워드 밀도
    const keywords = extractKeywords(title);
    const keywordDensity = keywords.reduce((sum, keyword) => {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex);
      return sum + (matches ? matches.length : 0);
    }, 0) / (contentLength / 100);

    if (keywordDensity >= 2 && keywordDensity <= 3) {
      contentValidation.items.push({
        name: '키워드 밀도',
        status: 'pass',
        message: `${keywordDensity.toFixed(1)}% (권장: 2-3%)`,
        score: 10
      });
      score += 10;
    } else {
      contentValidation.items.push({
        name: '키워드 밀도',
        status: 'warning',
        message: `${keywordDensity.toFixed(1)}% (권장: 2-3%)`,
        score: 5
      });
      score += 5;
    }
    maxScore += 10;

    // 단락 구성
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    const avgParagraphLength = contentLength / paragraphs.length;
    if (avgParagraphLength >= 150 && avgParagraphLength <= 300) {
      contentValidation.items.push({
        name: '단락 구성',
        status: 'pass',
        message: '적절한 단락 구성',
        score: 10
      });
      score += 10;
    } else {
      contentValidation.items.push({
        name: '단락 구성',
        status: 'warning',
        message: '단락이 너무 길거나 짧음',
        score: 5
      });
      score += 5;
    }
    maxScore += 10;

    results.push(contentValidation);

    // 3. 이미지 검증
    const imageValidation: SEOValidationResult = {
      category: '이미지 최적화',
      items: []
    };

    // 이미지 개수
    if (images.length >= 3 && images.length <= 7) {
      imageValidation.items.push({
        name: '이미지 개수',
        status: 'pass',
        message: `${images.length}개 (권장: 3-7개)`,
        score: 10
      });
      score += 10;
    } else if (images.length >= 1) {
      imageValidation.items.push({
        name: '이미지 개수',
        status: 'warning',
        message: `${images.length}개 (권장: 3-7개)`,
        score: 5
      });
      score += 5;
    } else {
      imageValidation.items.push({
        name: '이미지 개수',
        status: 'fail',
        message: '이미지 없음',
        score: 0
      });
    }
    maxScore += 10;

    // 이미지 파일명 SEO
    const seoFriendlyImages = images.filter(img => 
      keywords.some(keyword => img.name.toLowerCase().includes(keyword.toLowerCase()))
    );
    const seoImageRatio = images.length > 0 ? seoFriendlyImages.length / images.length : 0;
    
    if (seoImageRatio >= 0.8) {
      imageValidation.items.push({
        name: '이미지 파일명',
        status: 'pass',
        message: 'SEO 최적화된 파일명',
        score: 10
      });
      score += 10;
    } else if (seoImageRatio >= 0.5) {
      imageValidation.items.push({
        name: '이미지 파일명',
        status: 'warning',
        message: '일부 파일명 개선 필요',
        score: 5
      });
      score += 5;
    } else {
      imageValidation.items.push({
        name: '이미지 파일명',
        status: 'fail',
        message: 'SEO 파일명 사용 권장',
        score: 0
      });
    }
    maxScore += 10;

    // 이미지 용량
    const oversizedImages = images.filter(img => img.size > 200 * 1024); // 200KB
    if (oversizedImages.length === 0) {
      imageValidation.items.push({
        name: '이미지 용량',
        status: 'pass',
        message: '모든 이미지 최적화됨',
        score: 5
      });
      score += 5;
    } else {
      imageValidation.items.push({
        name: '이미지 용량',
        status: 'warning',
        message: `${oversizedImages.length}개 이미지 용량 초과`,
        score: 2
      });
      score += 2;
    }
    maxScore += 5;

    results.push(imageValidation);

    // 4. 해시태그 검증
    const tagValidation: SEOValidationResult = {
      category: '해시태그 최적화',
      items: []
    };

    // 해시태그 개수
    if (tags.length >= 5 && tags.length <= 10) {
      tagValidation.items.push({
        name: '태그 개수',
        status: 'pass',
        message: `${tags.length}개 (권장: 5-10개)`,
        score: 10
      });
      score += 10;
    } else {
      tagValidation.items.push({
        name: '태그 개수',
        status: 'warning',
        message: `${tags.length}개 (권장: 5-10개)`,
        score: 5
      });
      score += 5;
    }
    maxScore += 10;

    // 관련성 검사
    const relevantTags = tags.filter(tag => 
      keywords.some(keyword => tag.includes(keyword) || keyword.includes(tag))
    );
    const tagRelevanceRatio = tags.length > 0 ? relevantTags.length / tags.length : 0;
    
    if (tagRelevanceRatio >= 0.7) {
      tagValidation.items.push({
        name: '태그 관련성',
        status: 'pass',
        message: '높은 관련성',
        score: 10
      });
      score += 10;
    } else {
      tagValidation.items.push({
        name: '태그 관련성',
        status: 'warning',
        message: '일부 태그 관련성 낮음',
        score: 5
      });
      score += 5;
    }
    maxScore += 10;

    results.push(tagValidation);

    // 점수 계산
    const finalScore = Math.round((score / maxScore) * 100);
    setValidationResults(results);
    setTotalScore(finalScore);
    
    if (onScoreChange) {
      onScoreChange(finalScore);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', label: '최상위 노출 가능' };
    if (score >= 80) return { grade: 'A', label: '상위 노출 가능' };
    if (score >= 70) return { grade: 'B+', label: '중상위 노출 가능' };
    if (score >= 60) return { grade: 'B', label: '개선 필요' };
    return { grade: 'C', label: '대폭 개선 필요' };
  };

  const { grade, label } = getScoreGrade(totalScore);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-3xl font-bold ${getScoreColor(totalScore)}`}>
              {totalScore}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Award className={`w-5 h-5 ${getScoreColor(totalScore)}`} />
                <span className="font-medium text-gray-900">네이버 SEO 점수</span>
                <span className={`px-2 py-0.5 rounded text-sm font-medium ${
                  totalScore >= 80 ? 'bg-green-100 text-green-700' :
                  totalScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {grade}
                </span>
              </div>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200">
          {validationResults.map((result, idx) => (
            <div key={idx} className="border-b border-gray-100 last:border-0">
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">{result.category}</h4>
                <div className="space-y-2">
                  {result.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.status === 'pass' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : item.status === 'warning' ? (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </div>
                      <span className={`text-sm ${
                        item.status === 'pass' ? 'text-green-600' :
                        item.status === 'warning' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {item.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* SEO 팁 */}
          <div className="p-4 bg-blue-50">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">네이버 최신 SEO 팁</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>C-Rank 알고리즘은 체류시간과 완독률을 중요시합니다</li>
                  <li>이미지 사이에 충분한 텍스트를 배치하세요</li>
                  <li>첫 문단에 핵심 키워드를 자연스럽게 포함하세요</li>
                  <li>모바일 최적화된 레이아웃을 사용하세요</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NaverSEOValidator;