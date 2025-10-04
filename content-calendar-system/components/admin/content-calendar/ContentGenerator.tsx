// Content Generator Component
// /components/admin/content-calendar/ContentGenerator.tsx

import React, { useState, useCallback } from 'react';
import { 
  ContentType, 
  ContentCalendarItem, 
  ToneAndManner,
  Season 
} from '@/types';
import { MassgooToneAndManner } from '@/lib/content-calendar/tone-and-manner';
import { generateAIContent } from '@/lib/ai/content-generator';

interface ContentGeneratorProps {
  onContentGenerated?: (content: ContentCalendarItem[]) => void;
  defaultMonth?: number;
  defaultYear?: number;
}

interface GenerationTarget {
  blog: number;
  social: number;
  email: number;
  funnel: number;
  video: number;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  onContentGenerated,
  defaultMonth = new Date().getMonth() + 1,
  defaultYear = new Date().getFullYear()
}) => {
  // =====================================================
  // State Management
  // =====================================================
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<ContentCalendarItem[]>([]);
  const [targets, setTargets] = useState<GenerationTarget>({
    blog: 8,
    social: 20,
    email: 4,
    funnel: 1,
    video: 2
  });
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [customTheme, setCustomTheme] = useState('');

  // =====================================================
  // Helper Functions
  // =====================================================
  const getSeasonFromMonth = (month: number): Season => {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  };

  const getMonthName = (month: number): string => {
    const months = [
      '1월', '2월', '3월', '4월', '5월', '6월',
      '7월', '8월', '9월', '10월', '11월', '12월'
    ];
    return months[month - 1];
  };

  const getCampaignTheme = (month: number): string => {
    const themes: { [key: number]: string } = {
      1: '새해 새 장비',
      2: '브랜드 스토리',
      3: '시즌 오픈 준비',
      4: '비거리 향상 프로젝트',
      5: '가족의 달 특집',
      6: '골든타임',
      7: '여름 특별전',
      8: '휴가철 이벤트',
      9: '시즌 절정',
      10: '가을 마스터',
      11: '연말 준비',
      12: '연말 특가'
    };
    return customTheme || themes[month] || '월간 캠페인';
  };

  // =====================================================
  // Content Generation Logic
  // =====================================================
  const generateMonthlyContent = useCallback(async () => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      const season = getSeasonFromMonth(month);
      const theme = getCampaignTheme(month);
      const seasonalSuggestions = MassgooToneAndManner.getSeasonalContentSuggestions(month);
      
      const contents: ContentCalendarItem[] = [];
      const totalItems = Object.values(targets).reduce((a, b) => a + b, 0);
      let currentProgress = 0;

      // Generate content for each type
      for (const [contentType, count] of Object.entries(targets)) {
        for (let i = 0; i < count; i++) {
          const content = await generateSingleContent(
            contentType as ContentType,
            season,
            theme,
            seasonalSuggestions.keywords,
            i + 1
          );
          
          contents.push(content);
          currentProgress++;
          setProgress(Math.round((currentProgress / totalItems) * 100));
          
          // Small delay to prevent API rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setGeneratedContent(contents);
      onContentGenerated?.(contents);
      
    } catch (error) {
      console.error('Content generation failed:', error);
      alert('콘텐츠 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  }, [month, year, targets, customTheme, onContentGenerated]);

  const generateSingleContent = async (
    contentType: ContentType,
    season: Season,
    theme: string,
    keywords: string[],
    index: number
  ): Promise<ContentCalendarItem> => {
    // Calculate content date (distribute throughout the month)
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayInterval = Math.floor(daysInMonth / (targets[contentType] || 1));
    const contentDay = Math.min(dayInterval * index, daysInMonth);
    const contentDate = new Date(year, month - 1, contentDay);

    // Generate title based on content type and theme
    const title = generateTitle(contentType, theme, index);
    
    // Apply tone and manner
    const toneAndManner: ToneAndManner = {
      tone: 'professional',
      voice: 'encouraging',
      style: ['informative', 'engaging'],
      emotions: ['confidence', 'excitement']
    };

    return {
      year,
      month,
      week: Math.ceil(contentDay / 7),
      contentDate,
      season,
      theme,
      campaignId: `${year}-${month.toString().padStart(2, '0')}-${theme.replace(/\s/g, '_')}`,
      contentType,
      title,
      subtitle: `${theme} - ${contentType} 콘텐츠 #${index}`,
      targetAudience: {
        primary: '시니어 골퍼',
        ageRange: '50-70',
        interests: ['골프', '건강', '여가'],
        painPoints: ['비거리 감소', '정확도 문제'],
        goals: ['스코어 개선', '즐거운 라운드']
      },
      keywords,
      hashtags: generateHashtags(contentType, theme, keywords),
      toneAndManner,
      status: 'planned',
      priority: 3,
      publishedChannels: [],
      performanceMetrics: {},
      seoMeta: {
        title,
        description: `MASSGOO ${theme} ${getMonthName(month)} 콘텐츠`,
        keywords
      }
    };
  };

  const generateTitle = (contentType: ContentType, theme: string, index: number): string => {
    const templates: { [key in ContentType]: string[] } = {
      blog: [
        `${theme}: 시니어 골퍼를 위한 완벽 가이드`,
        `[전문가 칼럼] ${theme}의 비밀`,
        `${theme} 성공 사례: 고객 인터뷰`,
        `${theme} 완전 정복하기`
      ],
      social: [
        `오늘의 팁: ${theme}`,
        `${theme} 이벤트 안내`,
        `고객님의 ${theme} 후기`,
        `${theme} 미니 강좌`
      ],
      email: [
        `[MASSGOO] ${theme} 특별 혜택 안내`,
        `${getMonthName(month)} ${theme} 소식`,
        `VIP 고객님을 위한 ${theme}`,
        `${theme} 마지막 기회`
      ],
      funnel: [
        `${theme} - 특별 프로모션 페이지`
      ],
      video: [
        `[동영상] ${theme} 완벽 분석`,
        `${theme} 실전 레슨`
      ]
    };

    const titleTemplates = templates[contentType];
    return titleTemplates[index % titleTemplates.length] || `${theme} 콘텐츠 ${index}`;
  };

  const generateHashtags = (contentType: ContentType, theme: string, keywords: string[]): string[] => {
    const baseHashtags = ['#MASSGOO', '#마스구', '#골프'];
    const themeHashtag = `#${theme.replace(/\s/g, '')}`;
    const keywordHashtags = keywords.slice(0, 3).map(k => `#${k}`);
    
    return [...baseHashtags, themeHashtag, ...keywordHashtags];
  };

  // =====================================================
  // Render
  // =====================================================
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">AI 콘텐츠 생성기</h2>
      
      {/* Generation Settings */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">연도</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
            disabled={isGenerating}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">월</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
            disabled={isGenerating}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {getMonthName(i + 1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">캠페인 테마</label>
        <input
          type="text"
          value={customTheme}
          onChange={(e) => setCustomTheme(e.target.value)}
          placeholder={getCampaignTheme(month)}
          className="w-full px-3 py-2 border rounded-lg"
          disabled={isGenerating}
        />
      </div>

      {/* Content Targets */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">콘텐츠 생성 목표</h3>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(targets).map(([type, count]) => (
            <div key={type}>
              <label className="block text-sm font-medium mb-1 capitalize">
                {type === 'blog' ? '블로그' :
                 type === 'social' ? '소셜' :
                 type === 'email' ? '이메일' :
                 type === 'funnel' ? '퍼널' : '비디오'}
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) => setTargets({
                  ...targets,
                  [type]: parseInt(e.target.value) || 0
                })}
                className="w-full px-2 py-1 border rounded"
                min="0"
                max="50"
                disabled={isGenerating}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Season Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold mb-2">시즌 정보</h4>
        <p className="text-sm">
          <span className="font-medium">시즌:</span> {getSeasonFromMonth(month)} | 
          <span className="font-medium ml-2">테마:</span> {getCampaignTheme(month)}
        </p>
        <p className="text-sm mt-1">
          <span className="font-medium">추천 키워드:</span> {
            MassgooToneAndManner.getSeasonalContentSuggestions(month).keywords.join(', ')
          }
        </p>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateMonthlyContent}
        disabled={isGenerating}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          isGenerating 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isGenerating ? `생성 중... (${progress}%)` : '콘텐츠 생성 시작'}
      </button>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Generated Content Preview */}
      {generatedContent.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">생성된 콘텐츠 ({generatedContent.length}개)</h3>
          <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
            {generatedContent.map((content, index) => (
              <div key={index} className="mb-3 pb-3 border-b last:border-b-0">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded mr-2">
                      {content.contentType}
                    </span>
                    <span className="text-sm text-gray-500">
                      {content.contentDate.toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
                <h4 className="font-medium mt-1">{content.title}</h4>
                <p className="text-sm text-gray-600">{content.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">💡 사용 팁</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 생성된 콘텐츠는 자동으로 브랜드 가이드라인이 적용됩니다</li>
          <li>• 각 콘텐츠는 MASSGOO 톤앤매너에 맞게 최적화됩니다</li>
          <li>• 생성 후 개별 편집 및 승인 과정을 거쳐 발행됩니다</li>
          <li>• 시즌별 테마와 키워드가 자동으로 반영됩니다</li>
        </ul>
      </div>
    </div>
  );
};

export default ContentGenerator;
