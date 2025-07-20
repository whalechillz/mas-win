import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Search, BarChart2, BookOpen, Globe, Image, Video, MapPin, Type } from 'lucide-react';

// 검증 규칙 타입 정의
interface ValidationRule {
  id: string;
  ruleName: string;
  ruleType: string;
  config: any;
  weight: number;
}

interface BlogPost {
  id: string;
  blogUrl: string;
  title: string;
  content: string;
  author: string;
  publishedAt: string;
  imageCount: number;
  videoCount: number;
  hasLocation: boolean;
  wordCount: number;
}

interface ValidationDetail {
  ruleName: string;
  passed: boolean;
  score: number;
  maxScore: number;
  feedback: string;
  suggestions: string[];
}

interface ContentValidation {
  contentId: string;
  channel: string;
  title?: string;
  content: string;
  blogUrl?: string;
  validations: {
    seoScore: number;
    readability: number;
    brandConsistency: number;
    channelOptimization: number;
    suggestions: string[];
  };
  details?: ValidationDetail[];
  overallScore: number;
  grade: string;
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

interface Props {
  year: number;
  month: number;
}

// 점수에 따른 색상
const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600 dark:text-green-400';
  if (score >= 75) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 60) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

// 점수에 따른 배경색
const getScoreBgColor = (score: number) => {
  if (score >= 90) return 'bg-green-100 dark:bg-green-900/30';
  if (score >= 75) return 'bg-yellow-100 dark:bg-yellow-900/30';
  if (score >= 60) return 'bg-orange-100 dark:bg-orange-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
};

// 등급 계산
const calculateGrade = (score: number): string => {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  return 'D';
};

// 상태 아이콘
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'excellent':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'good':
      return <CheckCircle className="w-5 h-5 text-yellow-600" />;
    case 'needs-improvement':
      return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    case 'poor':
      return <XCircle className="w-5 h-5 text-red-600" />;
    default:
      return null;
  }
};

// 규칙 아이콘
const getRuleIcon = (ruleType: string) => {
  switch (ruleType) {
    case 'keyword':
      return <Search className="w-4 h-4" />;
    case 'length':
      return <Type className="w-4 h-4" />;
    case 'media':
      return <Image className="w-4 h-4" />;
    case 'video':
      return <Video className="w-4 h-4" />;
    case 'location':
      return <MapPin className="w-4 h-4" />;
    default:
      return <BookOpen className="w-4 h-4" />;
  }
};

export default function ContentValidator({ year, month }: Props) {
  const [contents, setContents] = useState<ContentValidation[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [blogUrl, setBlogUrl] = useState('');
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);

  // 검증 규칙 로드
  useEffect(() => {
    fetchValidationRules();
    fetchMonthlyKeywords();
    fetchValidatedContents();
  }, [year, month]);

  const fetchValidationRules = async () => {
    try {
      const response = await fetch('/api/integrated/validation-rules');
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error('Failed to fetch validation rules:', error);
    }
  };

  const fetchMonthlyKeywords = async () => {
    try {
      const response = await fetch(`/api/integrated/campaign-keywords?year=${year}&month=${month}`);
      const data = await response.json();
      setKeywords(data.keywords || ['이천전골', '이천순대국', '마쓰구골프']);
    } catch (error) {
      console.error('Failed to fetch keywords:', error);
    }
  };

  const fetchValidatedContents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/integrated/validated-contents?year=${year}&month=${month}`);
      const data = await response.json();
      setContents(data);
    } catch (error) {
      console.error('Failed to fetch validated contents:', error);
    } finally {
      setLoading(false);
    }
  };

  // 블로그 URL 검증
  const validateBlogPost = async () => {
    if (!blogUrl) return;
    
    setValidating(true);
    try {
      const response = await fetch('/api/integrated/validate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          blogUrl,
          year,
          month,
          keywords,
          rules
        })
      });
      
      const result = await response.json();
      
      // 검증 결과를 목록에 추가
      setContents(prev => [result, ...prev]);
      setSelectedContent(result);
      setBlogUrl('');
      
      // 성공 알림
      alert(`검증 완료! 점수: ${result.overallScore}점 (${result.grade}등급)`);
    } catch (error) {
      console.error('Validation failed:', error);
      alert('검증 중 오류가 발생했습니다.');
    } finally {
      setValidating(false);
    }
  };

  // SEO 점수 계산 로직
  const calculateSEOScore = (content: string, title: string): number => {
    let score = 0;
    const maxScore = 100;
    
    // 1. 키워드 밀도 (30점)
    const keywordDensity = calculateKeywordDensity(content, keywords);
    if (keywordDensity >= 1 && keywordDensity <= 3) {
      score += 30;
    } else if (keywordDensity < 1) {
      score += keywordDensity * 30;
    } else {
      score += Math.max(0, 30 - (keywordDensity - 3) * 10);
    }
    
    // 2. 제목 최적화 (20점)
    if (title.length >= 30 && title.length <= 60) {
      score += 20;
    } else {
      score += Math.max(0, 20 - Math.abs(45 - title.length) * 0.5);
    }
    
    // 3. 키워드 위치 (20점)
    if (keywords.some(kw => title.includes(kw))) {
      score += 10;
    }
    if (keywords.some(kw => content.slice(0, 200).includes(kw))) {
      score += 10;
    }
    
    // 4. 내부 링크 (15점)
    const internalLinks = (content.match(/https?:\/\/[^"'\s]+/g) || []).length;
    score += Math.min(15, internalLinks * 3);
    
    // 5. 단락 구조 (15점)
    const paragraphs = content.split(/\n\n+/).filter(p => p.length > 50).length;
    score += Math.min(15, paragraphs * 3);
    
    return Math.round((score / maxScore) * 100);
  };

  // 키워드 밀도 계산
  const calculateKeywordDensity = (content: string, keywords: string[]): number => {
    const totalWords = content.split(/\s+/).length;
    let keywordCount = 0;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex);
      keywordCount += matches ? matches.length : 0;
    });
    
    return (keywordCount / totalWords) * 100;
  };

  // 가독성 점수 계산 (한국어 버전)
  const calculateReadabilityScore = (content: string): number => {
    let score = 0;
    
    // 1. 평균 문장 길이 (40점)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = content.length / sentences.length;
    
    if (avgSentenceLength >= 40 && avgSentenceLength <= 60) {
      score += 40;
    } else {
      score += Math.max(0, 40 - Math.abs(50 - avgSentenceLength) * 0.5);
    }
    
    // 2. 단락 구조 (30점)
    const paragraphs = content.split(/\n\n+/).filter(p => p.length > 50);
    const avgParagraphLength = content.length / paragraphs.length;
    
    if (avgParagraphLength >= 200 && avgParagraphLength <= 400) {
      score += 30;
    } else {
      score += Math.max(0, 30 - Math.abs(300 - avgParagraphLength) * 0.05);
    }
    
    // 3. 소제목 사용 (30점)
    const hasSubheadings = content.includes('##') || content.includes('**') || content.includes('<h');
    if (hasSubheadings) {
      score += 30;
    }
    
    return Math.round(score);
  };

  // 채널별 최적화 점수
  const calculateChannelOptimization = (channel: string, content: string): number => {
    let score = 0;
    
    switch (channel) {
      case 'blog':
        // 블로그: 이미지, 길이, SEO 중심
        if (content.length >= 1000) score += 40;
        if ((content.match(/<img/g) || []).length >= 15) score += 30;
        if (content.includes('지도') || content.includes('map')) score += 30;
        break;
        
      case 'kakao':
      case 'sms':
        // 카카오/SMS: 간결성, CTA 명확성
        if (content.length <= 90) score += 40;
        if (content.includes('클릭') || content.includes('바로가기')) score += 30;
        if (content.includes('http')) score += 30;
        break;
        
      case 'email':
        // 이메일: 제목, 프리헤더, CTA
        if (content.includes('안녕하세요')) score += 20;
        if (content.includes('감사합니다')) score += 20;
        if ((content.match(/http/g) || []).length >= 2) score += 30;
        if (content.length >= 300 && content.length <= 1000) score += 30;
        break;
        
      case 'instagram':
        // 인스타그램: 해시태그, 이모지
        const hashtags = (content.match(/#\w+/g) || []).length;
        if (hashtags >= 5 && hashtags <= 15) score += 40;
        // 이모티콘 사용 체크
        if (content.match(/[😀😁😂🤣😃😄😅😆😉😊😋😎😍]/g)) score += 30;
        if (content.length <= 500) score += 30;
        break;
    }
    
    return score;
  };

  // 브랜드 일관성 점수
  const calculateBrandConsistency = (content: string): number => {
    let score = 0;
    const brandTerms = ['마쓰구골프', '싱싱골프', 'MASLABS', '최고의 서비스'];
    
    // 브랜드 언급
    brandTerms.forEach(term => {
      if (content.includes(term)) {
        score += 25;
      }
    });
    
    return Math.min(100, score);
  };

  // AI 개선 제안 생성
  const generateAISuggestions = async (validation: ContentValidation) => {
    try {
      const response = await fetch('/api/integrated/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: validation.content,
          scores: validation.validations,
          channel: validation.channel,
          details: validation.details
        })
      });
      
      const suggestions = await response.json();
      return suggestions;
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          콘텐츠 검증 도구
        </h2>
        
        {/* URL 입력 폼 */}
        <div className="flex gap-4 mb-6">
          <input
            type="url"
            value={blogUrl}
            onChange={(e) => setBlogUrl(e.target.value)}
            placeholder="네이버 블로그 URL을 입력하세요"
            className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
          <button
            onClick={validateBlogPost}
            disabled={validating || !blogUrl}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {validating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            검증하기
          </button>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">전체 콘텐츠</p>
            <p className="text-2xl font-bold">{contents.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">A등급</p>
            <p className="text-2xl font-bold text-green-600">
              {contents.filter(c => c.grade === 'A').length}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">평균 점수</p>
            <p className="text-2xl font-bold text-yellow-600">
              {contents.length > 0 
                ? Math.round(contents.reduce((sum, c) => sum + c.overallScore, 0) / contents.length)
                : 0}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">개선 필요</p>
            <p className="text-2xl font-bold text-blue-600">
              {contents.filter(c => c.status === 'needs-improvement' || c.status === 'poor').length}
            </p>
          </div>
        </div>
      </div>

      {/* 콘텐츠 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold">검증된 콘텐츠</h3>
        </div>
        <div className="divide-y dark:divide-gray-700">
          {contents.map((content) => (
            <div
              key={content.contentId}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => setSelectedContent(content)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(content.status)}
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {content.title || '제목 없음'}
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {content.channel}
                    </span>
                  </div>
                  {content.blogUrl && (
                    <a 
                      href={content.blogUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Globe className="w-4 h-4 inline mr-1" />
                      블로그 보기
                    </a>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(content.overallScore)}`}>
                    {content.overallScore}
                  </div>
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(content.overallScore)}`}>
                    {content.grade}등급
                  </div>
                </div>
              </div>
              
              {/* 점수 요약 */}
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">SEO</p>
                  <p className={`font-semibold ${getScoreColor(content.validations.seoScore)}`}>
                    {content.validations.seoScore}점
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">가독성</p>
                  <p className={`font-semibold ${getScoreColor(content.validations.readability)}`}>
                    {content.validations.readability}점
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">브랜드</p>
                  <p className={`font-semibold ${getScoreColor(content.validations.brandConsistency)}`}>
                    {content.validations.brandConsistency}점
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">채널 최적화</p>
                  <p className={`font-semibold ${getScoreColor(content.validations.channelOptimization)}`}>
                    {content.validations.channelOptimization}점
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 상세 모달 */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold">콘텐츠 검증 상세 결과</h3>
              <button
                onClick={() => setSelectedContent(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              {/* 전체 점수 */}
              <div className={`text-center mb-8 p-6 rounded-lg ${getScoreBgColor(selectedContent.overallScore)}`}>
                <div className={`text-5xl font-bold mb-2 ${getScoreColor(selectedContent.overallScore)}`}>
                  {selectedContent.overallScore}점
                </div>
                <div className="text-2xl font-medium">{selectedContent.grade}등급</div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {selectedContent.status === 'excellent' && '훌륭한 콘텐츠입니다!'}
                  {selectedContent.status === 'good' && '양호한 콘텐츠입니다.'}
                  {selectedContent.status === 'needs-improvement' && '개선이 필요합니다.'}
                  {selectedContent.status === 'poor' && '대폭 수정이 필요합니다.'}
                </p>
              </div>

              {/* 세부 검증 결과 */}
              {selectedContent.details && (
                <div className="space-y-4 mb-8">
                  <h4 className="font-semibold text-lg mb-4">검증 항목별 결과</h4>
                  {selectedContent.details.map((detail, index) => (
                    <div key={index} className="border dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getRuleIcon(detail.ruleName)}
                          <span className="font-medium">{detail.ruleName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${getScoreColor((detail.score / detail.maxScore) * 100)}`}>
                            {detail.score}/{detail.maxScore}점
                          </span>
                          {detail.passed ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {detail.feedback}
                      </p>
                      {detail.suggestions.length > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/30 rounded p-3 mt-2">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                            개선 제안:
                          </p>
                          <ul className="text-sm text-blue-700 dark:text-blue-400 list-disc list-inside">
                            {detail.suggestions.map((suggestion, idx) => (
                              <li key={idx}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* AI 개선 제안 */}
              {selectedContent.validations.suggestions.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5" />
                    AI 종합 개선 제안
                  </h4>
                  <ul className="space-y-2">
                    {selectedContent.validations.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400">•</span>
                        <span className="text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}