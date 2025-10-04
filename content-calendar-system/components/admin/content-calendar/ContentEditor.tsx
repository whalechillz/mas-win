// Content Editor Component
// /components/admin/content-calendar/ContentEditor.tsx

import React, { useState, useEffect } from 'react';
import { 
  ContentCalendarItem,
  ContentType,
  ContentStatus,
  ToneAndManner 
} from '@/types';
import { format } from 'date-fns';
import { MassgooToneAndManner } from '@/lib/content-calendar/tone-and-manner';
import ContentQualityChecker from '@/lib/quality/content-quality-checker';

interface ContentEditorProps {
  content?: ContentCalendarItem | null;
  onSave: (content: ContentCalendarItem) => void;
  onClose: () => void;
}

const ContentEditor: React.FC<ContentEditorProps> = ({
  content: initialContent,
  onSave,
  onClose
}) => {
  // =====================================================
  // State Management
  // =====================================================
  const [content, setContent] = useState<Partial<ContentCalendarItem>>({
    contentType: 'blog',
    status: 'draft',
    priority: 3,
    contentDate: new Date(),
    season: 'spring',
    theme: '',
    title: '',
    subtitle: '',
    description: '',
    keywords: [],
    hashtags: [],
    contentBody: '',
    targetAudience: {
      primary: '시니어 골퍼',
      ageRange: '50-70',
      interests: ['골프', '건강', '여가'],
      painPoints: ['비거리 감소', '정확도 문제'],
      goals: ['스코어 개선', '즐거운 라운드']
    },
    toneAndManner: {
      tone: 'professional',
      voice: 'encouraging',
      style: ['informative', 'engaging'],
      emotions: ['confidence', 'excitement']
    },
    ...initialContent
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'seo' | 'settings'>('basic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // =====================================================
  // Quality Check
  // =====================================================
  useEffect(() => {
    if (content.contentBody && content.contentBody.length > 100) {
      checkContentQuality();
    }
  }, [content.contentBody]);

  const checkContentQuality = async () => {
    const checker = new ContentQualityChecker();
    const result = await checker.checkContent(content as ContentCalendarItem);
    setQualityScore(result.score);
  };

  // =====================================================
  // Form Handlers
  // =====================================================
  const handleInputChange = (field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleKeywordAdd = (keyword: string) => {
    if (keyword && !content.keywords?.includes(keyword)) {
      handleInputChange('keywords', [...(content.keywords || []), keyword]);
    }
  };

  const handleKeywordRemove = (keyword: string) => {
    handleInputChange('keywords', content.keywords?.filter(k => k !== keyword) || []);
  };

  const handleHashtagAdd = (hashtag: string) => {
    const formattedHashtag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
    if (!content.hashtags?.includes(formattedHashtag)) {
      handleInputChange('hashtags', [...(content.hashtags || []), formattedHashtag]);
    }
  };

  const handleHashtagRemove = (hashtag: string) => {
    handleInputChange('hashtags', content.hashtags?.filter(h => h !== hashtag) || []);
  };

  // =====================================================
  // AI Generation
  // =====================================================
  const handleGenerateContent = async () => {
    if (!content.title || !content.contentType) {
      alert('제목과 콘텐츠 타입을 먼저 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/content-calendar/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: content.title,
          contentType: content.contentType,
          keywords: content.keywords,
          tone: content.toneAndManner
        })
      });

      const data = await response.json();
      
      if (data.success) {
        handleInputChange('contentBody', data.content);
        handleInputChange('subtitle', data.subtitle);
        if (!content.keywords?.length) {
          handleInputChange('keywords', data.keywords);
        }
        if (!content.hashtags?.length) {
          handleInputChange('hashtags', data.hashtags);
        }
      }
    } catch (error) {
      console.error('콘텐츠 생성 실패:', error);
      alert('콘텐츠 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // =====================================================
  // Tone & Manner Application
  // =====================================================
  const applyToneAndManner = () => {
    if (!content.contentBody) return;
    
    const improved = MassgooToneAndManner.applyToneAndManner(
      content.contentBody,
      content.contentType as ContentType,
      '시니어_타겟'
    );
    
    handleInputChange('contentBody', improved);
  };

  // =====================================================
  // Validation & Save
  // =====================================================
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!content.title) newErrors.title = '제목은 필수입니다';
    if (!content.contentType) newErrors.contentType = '콘텐츠 타입을 선택해주세요';
    if (!content.contentDate) newErrors.contentDate = '날짜를 선택해주세요';
    if (!content.theme) newErrors.theme = '테마를 입력해주세요';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      setActiveTab('basic');
      return;
    }

    setIsSaving(true);
    try {
      // Calculate additional fields
      const contentDate = new Date(content.contentDate!);
      const enrichedContent: ContentCalendarItem = {
        ...content as ContentCalendarItem,
        year: contentDate.getFullYear(),
        month: contentDate.getMonth() + 1,
        week: Math.ceil(contentDate.getDate() / 7),
        season: getSeasonFromMonth(contentDate.getMonth() + 1)
      };

      await onSave(enrichedContent);
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const getSeasonFromMonth = (month: number): 'spring' | 'summer' | 'autumn' | 'winter' => {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  };

  // =====================================================
  // Render
  // =====================================================
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {initialContent ? '콘텐츠 편집' : '새 콘텐츠 작성'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quality Score */}
          {qualityScore !== null && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">품질 점수</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        qualityScore >= 80 ? 'bg-green-500' :
                        qualityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${qualityScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{qualityScore}점</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <TabButton
              active={activeTab === 'basic'}
              onClick={() => setActiveTab('basic')}
              label="기본 정보"
              hasError={!!(errors.title || errors.contentType || errors.contentDate || errors.theme)}
            />
            <TabButton
              active={activeTab === 'content'}
              onClick={() => setActiveTab('content')}
              label="콘텐츠"
            />
            <TabButton
              active={activeTab === 'seo'}
              onClick={() => setActiveTab('seo')}
              label="SEO"
            />
            <TabButton
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              label="설정"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  label="제목"
                  required
                  error={errors.title}
                >
                  <input
                    type="text"
                    value={content.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="콘텐츠 제목을 입력하세요"
                  />
                </FormField>

                <FormField
                  label="부제목"
                >
                  <input
                    type="text"
                    value={content.subtitle || ''}
                    onChange={(e) => handleInputChange('subtitle', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="부제목 (선택사항)"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <FormField
                  label="콘텐츠 타입"
                  required
                  error={errors.contentType}
                >
                  <select
                    value={content.contentType || ''}
                    onChange={(e) => handleInputChange('contentType', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="blog">블로그</option>
                    <option value="social">소셜 미디어</option>
                    <option value="email">이메일</option>
                    <option value="funnel">퍼널</option>
                    <option value="video">비디오</option>
                  </select>
                </FormField>

                <FormField
                  label="발행 날짜"
                  required
                  error={errors.contentDate}
                >
                  <input
                    type="date"
                    value={content.contentDate ? format(new Date(content.contentDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleInputChange('contentDate', new Date(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>

                <FormField
                  label="상태"
                >
                  <select
                    value={content.status || 'draft'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="planned">계획됨</option>
                    <option value="draft">초안</option>
                    <option value="review">검토 중</option>
                    <option value="approved">승인됨</option>
                    <option value="published">발행됨</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  label="테마"
                  required
                  error={errors.theme}
                >
                  <input
                    type="text"
                    value={content.theme || ''}
                    onChange={(e) => handleInputChange('theme', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 비거리 향상, 여름 특별전"
                  />
                </FormField>

                <FormField
                  label="우선순위"
                >
                  <select
                    value={content.priority || 3}
                    onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">매우 높음</option>
                    <option value="2">높음</option>
                    <option value="3">보통</option>
                    <option value="4">낮음</option>
                    <option value="5">매우 낮음</option>
                  </select>
                </FormField>
              </div>

              <FormField
                label="설명"
              >
                <textarea
                  value={content.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="콘텐츠 설명 (선택사항)"
                />
              </FormField>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">콘텐츠 본문</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateContent}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {isGenerating ? '생성 중...' : '🤖 AI 생성'}
                  </button>
                  <button
                    onClick={applyToneAndManner}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    ✨ 톤 개선
                  </button>
                </div>
              </div>

              <textarea
                value={content.contentBody || ''}
                onChange={(e) => handleInputChange('contentBody', e.target.value)}
                className="w-full h-96 px-4 py-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="콘텐츠 본문을 입력하세요..."
              />

              {/* Word Count */}
              <div className="flex justify-between text-sm text-gray-500">
                <span>{content.contentBody?.length || 0}자</span>
                <span>약 {Math.ceil((content.contentBody?.length || 0) / 500)}분 읽기</span>
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <FormField label="키워드">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="키워드 입력 후 Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          handleKeywordAdd(input.value);
                          input.value = '';
                        }
                      }}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {content.keywords?.map((keyword, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-1"
                      >
                        {keyword}
                        <button
                          onClick={() => handleKeywordRemove(keyword)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </FormField>

              <FormField label="해시태그">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="해시태그 입력 후 Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          handleHashtagAdd(input.value);
                          input.value = '';
                        }
                      }}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {content.hashtags?.map((hashtag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1"
                      >
                        {hashtag}
                        <button
                          onClick={() => handleHashtagRemove(hashtag)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </FormField>

              <FormField label="메타 제목">
                <input
                  type="text"
                  value={content.seoMeta?.title || content.title || ''}
                  onChange={(e) => handleInputChange('seoMeta', {
                    ...content.seoMeta,
                    title: e.target.value
                  })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="검색 결과에 표시될 제목"
                />
              </FormField>

              <FormField label="메타 설명">
                <textarea
                  value={content.seoMeta?.description || ''}
                  onChange={(e) => handleInputChange('seoMeta', {
                    ...content.seoMeta,
                    description: e.target.value
                  })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="검색 결과에 표시될 설명 (160자 이내)"
                  maxLength={160}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {content.seoMeta?.description?.length || 0}/160
                </div>
              </FormField>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <FormField label="톤앤매너">
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={content.toneAndManner?.tone || 'professional'}
                    onChange={(e) => handleInputChange('toneAndManner', {
                      ...content.toneAndManner,
                      tone: e.target.value
                    })}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="professional">전문적</option>
                    <option value="casual">캐주얼</option>
                    <option value="encouraging">격려적</option>
                    <option value="educational">교육적</option>
                    <option value="inspirational">영감적</option>
                  </select>
                  <select
                    value={content.toneAndManner?.voice || 'encouraging'}
                    onChange={(e) => handleInputChange('toneAndManner', {
                      ...content.toneAndManner,
                      voice: e.target.value
                    })}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="authoritative">권위적</option>
                    <option value="friendly">친근한</option>
                    <option value="supportive">지원적</option>
                    <option value="expert">전문가</option>
                    <option value="peer">동료</option>
                  </select>
                </div>
              </FormField>

              <FormField label="타겟 오디언스">
                <div className="space-y-4">
                  <input
                    type="text"
                    value={content.targetAudience?.primary || ''}
                    onChange={(e) => handleInputChange('targetAudience', {
                      ...content.targetAudience,
                      primary: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="주요 타겟 (예: 50-70대 시니어 골퍼)"
                  />
                  <input
                    type="text"
                    value={content.targetAudience?.ageRange || ''}
                    onChange={(e) => handleInputChange('targetAudience', {
                      ...content.targetAudience,
                      ageRange: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="연령대 (예: 50-70)"
                  />
                </div>
              </FormField>

              <FormField label="담당자">
                <input
                  type="text"
                  value={content.assignedTo || ''}
                  onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="담당자 이메일"
                />
              </FormField>

              <FormField label="캠페인 ID">
                <input
                  type="text"
                  value={content.campaignId || ''}
                  onChange={(e) => handleInputChange('campaignId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="연결된 캠페인 ID (선택사항)"
                />
              </FormField>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              취소
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleInputChange('status', 'draft');
                  handleSave();
                }}
                disabled={isSaving}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
              >
                초안 저장
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// Sub Components
// =====================================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  hasError?: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, label, hasError }) => (
  <button
    onClick={onClick}
    className={`
      px-4 py-2 font-medium transition relative
      ${active 
        ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
        : 'text-gray-500 hover:text-gray-700'}
    `}
  >
    {label}
    {hasError && (
      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
    )}
  </button>
);

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1 text-sm text-red-500">{error}</p>
    )}
  </div>
);

export default ContentEditor;
