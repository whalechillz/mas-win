import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ContentEditorProps {
  content?: any;
  platforms: any[];
  categories: any[];
  teamMembers: any[];
  onSave: (data: any) => void;
  onCancel: () => void;
  onAISuggest?: (type: string) => Promise<any>;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  content,
  platforms,
  categories,
  teamMembers,
  onSave,
  onCancel,
  onAISuggest
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content_type: 'blog',
    platform_id: '',
    category_id: '',
    status: 'draft',
    topic: '',
    keywords: [] as string[],
    outline: '',
    content: '',
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    author_id: '',
    meta_title: '',
    meta_description: '',
    ...content
  });

  const [newKeyword, setNewKeyword] = useState('');
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      handleChange('keywords', [...formData.keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    handleChange('keywords', formData.keywords.filter(k => k !== keyword));
  };

  const handleAISuggest = async (type: string) => {
    if (!onAISuggest) return;
    
    setAiLoading(type);
    try {
      const suggestion = await onAISuggest(type);
      
      switch (type) {
        case 'title':
          handleChange('title', suggestion);
          break;
        case 'keywords':
          handleChange('keywords', [...formData.keywords, ...suggestion]);
          break;
        case 'outline':
          handleChange('outline', suggestion);
          break;
        case 'content':
          handleChange('content', suggestion);
          break;
      }
    } catch (error) {
      console.error('AI 제안 오류:', error);
    } finally {
      setAiLoading(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {content ? '콘텐츠 수정' : '새 콘텐츠 작성'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                플랫폼 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.platform_id}
                onChange={(e) => handleChange('platform_id', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">플랫폼 선택</option>
                {platforms.map(platform => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">카테고리 선택</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                예약 날짜 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => handleChange('scheduled_date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작성자
              </label>
              <select
                value={formData.author_id}
                onChange={(e) => handleChange('author_id', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">작성자 선택</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 제목 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                제목 <span className="text-red-500">*</span>
              </label>
              {onAISuggest && (
                <button
                  type="button"
                  onClick={() => handleAISuggest('title')}
                  disabled={aiLoading === 'title'}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  {aiLoading === 'title' ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  AI 제안
                </button>
              )}
            </div>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="콘텐츠 제목을 입력하세요"
              required
            />
          </div>

          {/* 주제/글감 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주제/글감 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={2}
              placeholder="이 콘텐츠의 주요 주제나 글감을 입력하세요"
              required
            />
          </div>

          {/* 키워드/태그 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                키워드/태그
              </label>
              {onAISuggest && (
                <button
                  type="button"
                  onClick={() => handleAISuggest('keywords')}
                  disabled={aiLoading === 'keywords'}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  {aiLoading === 'keywords' ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  AI 제안
                </button>
              )}
            </div>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="키워드 입력 후 Enter"
              />
              <button
                type="button"
                onClick={addKeyword}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                추가
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="hover:text-purple-900"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 개요 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                개요
              </label>
              {onAISuggest && (
                <button
                  type="button"
                  onClick={() => handleAISuggest('outline')}
                  disabled={aiLoading === 'outline'}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  {aiLoading === 'outline' ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  AI 제안
                </button>
              )}
            </div>
            <textarea
              value={formData.outline}
              onChange={(e) => handleChange('outline', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={4}
              placeholder="콘텐츠의 주요 구성이나 개요를 입력하세요"
            />
          </div>

          {/* 메타 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">SEO 설정</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메타 제목
              </label>
              <input
                type="text"
                value={formData.meta_title}
                onChange={(e) => handleChange('meta_title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="검색 결과에 표시될 제목"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메타 설명
              </label>
              <textarea
                value={formData.meta_description}
                onChange={(e) => handleChange('meta_description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder="검색 결과에 표시될 설명"
              />
            </div>
          </div>

          {/* 상태 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태
            </label>
            <div className="flex gap-4">
              {[
                { value: 'draft', label: '초안', color: 'gray' },
                { value: 'scheduled', label: '예약', color: 'blue' },
                { value: 'published', label: '발행', color: 'green' },
                { value: 'archived', label: '보관', color: 'gray' }
              ].map(status => (
                <label key={status.value} className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value={status.value}
                    checked={formData.status === status.value}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="mr-2"
                  />
                  <span className={`text-${status.color}-600`}>{status.label}</span>
                </label>
              ))}
            </div>
          </div>
        </form>

        {/* 푸터 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {content ? '수정' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};