import React, { useState, useEffect } from 'react';

interface SEOOptimizerProps {
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  slug: string;
  onMetaTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
  onMetaKeywordsChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onOptimize?: (optimized: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    slug: string;
  }) => void;
}

export const SEOOptimizer: React.FC<SEOOptimizerProps> = ({
  title,
  content,
  metaTitle,
  metaDescription,
  metaKeywords,
  slug,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onMetaKeywordsChange,
  onSlugChange,
  onOptimize
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // SEO 점수 계산
  const calculateSEOScore = () => {
    let score = 0;
    const issues: string[] = [];

    // 메타 제목 검사
    if (metaTitle.length >= 30 && metaTitle.length <= 60) {
      score += 25;
    } else {
      issues.push('메타 제목은 30-60자 사이여야 합니다.');
    }

    // 메타 설명 검사
    if (metaDescription.length >= 120 && metaDescription.length <= 160) {
      score += 25;
    } else {
      issues.push('메타 설명은 120-160자 사이여야 합니다.');
    }

    // 키워드 검사
    if (metaKeywords.trim()) {
      score += 20;
    } else {
      issues.push('메타 키워드를 입력해주세요.');
    }

    // 슬러그 검사
    if (slug && /^[a-z0-9-]+$/.test(slug)) {
      score += 15;
    } else {
      issues.push('슬러그는 소문자, 숫자, 하이픈만 사용 가능합니다.');
    }

    // 제목에 키워드 포함 검사
    if (metaKeywords && title.toLowerCase().includes(metaKeywords.toLowerCase())) {
      score += 15;
    } else {
      issues.push('제목에 주요 키워드를 포함해주세요.');
    }

    setSeoScore(score);
    setRecommendations(issues);
  };

  useEffect(() => {
    calculateSEOScore();
  }, [metaTitle, metaDescription, metaKeywords, slug, title]);

  // AI SEO 최적화
  const handleOptimize = async () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 먼저 입력해주세요.');
      return;
    }

    setIsOptimizing(true);
    try {
      const response = await fetch('/api/optimize-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          currentMeta: {
            metaTitle,
            metaDescription,
            metaKeywords,
            slug
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const optimized = data.optimized;
        
        onMetaTitleChange(optimized.metaTitle);
        onMetaDescriptionChange(optimized.metaDescription);
        onMetaKeywordsChange(optimized.metaKeywords);
        onSlugChange(optimized.slug);
        
        onOptimize?.(optimized);
      }
    } catch (error) {
      console.error('SEO 최적화 오류:', error);
      alert('SEO 최적화 중 오류가 발생했습니다.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // 슬러그 자동 생성
  const generateSlug = () => {
    const generatedSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
    
    onSlugChange(generatedSlug);
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* SEO 점수 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getScoreBgColor(seoScore)}`}>
            {seoScore}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">SEO 최적화</h3>
            <p className={`text-sm ${getScoreColor(seoScore)}`}>
              {seoScore >= 80 ? '우수' : seoScore >= 60 ? '양호' : '개선 필요'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleOptimize}
          disabled={isOptimizing}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isOptimizing ? '최적화 중...' : 'AI 최적화'}
        </button>
      </div>

      {/* SEO 필드들 */}
      <div className="space-y-4">
        {/* 메타 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            메타 제목 ({metaTitle.length}/60)
          </label>
          <input
            type="text"
            value={metaTitle}
            onChange={(e) => onMetaTitleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="검색 결과에 표시될 제목"
            maxLength={60}
          />
        </div>

        {/* 메타 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            메타 설명 ({metaDescription.length}/160)
          </label>
          <textarea
            value={metaDescription}
            onChange={(e) => onMetaDescriptionChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="검색 결과에 표시될 설명"
            rows={3}
            maxLength={160}
          />
        </div>

        {/* 메타 키워드 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            메타 키워드
          </label>
          <input
            type="text"
            value={metaKeywords}
            onChange={(e) => onMetaKeywordsChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="쉼표로 구분된 키워드"
          />
        </div>

        {/* 슬러그 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL 슬러그
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="url-friendly-slug"
            />
            <button
              onClick={generateSlug}
              className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              자동 생성
            </button>
          </div>
        </div>
      </div>

      {/* 권장사항 */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">개선 권장사항</h4>
          <ul className="space-y-1">
            {recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-red-600 flex items-center gap-2">
                <span>⚠️</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
