import React, { useState, useEffect } from 'react';
import { useChannelEditor } from '@/lib/hooks/useChannelEditor';
import { TitleScorer } from './TitleScorer';
import { SEOOptimizer } from './SEOOptimizer';
import { ShortLinkGenerator } from './ShortLinkGenerator';
import { AIImagePicker } from './AIImagePicker';

interface BaseChannelEditorProps {
  channelType: 'sms' | 'kakao' | 'naver';
  channelName: string;
  calendarId?: string;
  hubId?: string;
  channelKey?: string;
  initialData?: any;
  onSave?: (data: any) => void;
  onSend?: (data: any) => void;
  children?: React.ReactNode;
}

export default function BaseChannelEditor({
  channelType,
  channelName,
  calendarId,
  hubId,
  channelKey,
  initialData,
  onSave,
  onSend,
  children
}: BaseChannelEditorProps) {
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [shortLink, setShortLink] = useState<string>('');
  const [titleScore, setTitleScore] = useState<number>(0);

  const {
    formData,
    updateFormData,
    isLoading,
    error,
    saveDraft,
    sendMessage,
    loadFromBlog
  } = useChannelEditor(channelType, calendarId, initialData, hubId, channelKey);

  // 블로그 소스에서 내용 가져오기
  const handleFetchBlogSource = async () => {
    if (!calendarId) return;
    
    try {
      const response = await fetch('/api/channels/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogPostId: calendarId,
          channelType
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          updateFormData(result.data.optimizedContent);
        }
      }
    } catch (error) {
      console.error('Failed to fetch blog source:', error);
    }
  };

  // 저장
  const handleSave = async () => {
    try {
      updateFormData({
        imageUrl: selectedImage || '',
        shortLink
      });
      
      const result = await saveDraft();
      
      if (result.success && onSave) {
        onSave(result.data);
      }
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  // 발송
  const handleSend = async () => {
    try {
      updateFormData({
        imageUrl: selectedImage || '',
        shortLink
      });
      
      const result = await sendMessage();
      
      if (result.success && onSend) {
        onSend(result.data);
      }
    } catch (error) {
      console.error('Send failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {channelName} 에디터
        </h1>
        <p className="text-gray-600">
          {channelName}에 최적화된 콘텐츠를 작성하고 발송하세요.
        </p>
      </div>

      {/* 블로그 소스 가져오기 */}
      {calendarId && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            블로그 소스에서 가져오기
          </h3>
          <p className="text-blue-700 mb-3">
            콘텐츠 캘린더의 블로그 포스트를 {channelName}에 최적화된 형태로 변환합니다.
          </p>
          <button
            onClick={handleFetchBlogSource}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            블로그 소스 가져오기
          </button>
        </div>
      )}

      {/* 제목 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          제목
        </label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => updateFormData({ title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-md"
          placeholder="제목을 입력하세요"
        />
        {titleScore > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            제목 점수: {titleScore}/100
          </p>
        )}
      </div>

      {/* 제목 최적화 점수 - 가로 배치 */}
      {formData.title && (
        <div className="mb-6">
          <TitleScorer
            title={formData.title || ''}
            persona="unknown"
            contentType="marketing"
            targetProduct="service"
            brandWeight="medium"
            conversionGoal="homepage_visit"
            onScoreChange={(score) => setTitleScore(score.total)}
          />
        </div>
      )}

      {/* 메시지 내용 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          메시지 내용
        </label>
        <textarea
          value={formData.content || ''}
          onChange={(e) => updateFormData({ content: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="메시지 내용을 입력하세요"
        />
        {formData.content && (
          <p className="text-sm text-gray-600 mt-1">
            글자 수: {formData.content.length}
          </p>
        )}
      </div>

      {/* 채널별 특화 컴포넌트 */}
      {children}

      {/* 이미지 미리보기 (선택된 이미지가 있을 때만 표시) */}
      {selectedImage && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            선택된 이미지
          </label>
          <div className="flex items-center gap-2">
            <img
              src={selectedImage}
              alt="Selected"
              className="w-32 h-32 object-cover rounded border border-gray-300"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              제거
            </button>
          </div>
        </div>
      )}

      {/* 짧은 링크 생성 */}
      <div className="mb-6">
        <ShortLinkGenerator
          originalUrl={channelType === 'kakao' ? 'https://www.masgolf.co.kr/survey' : 'https://masgolf.co.kr'}
          onLinkGenerated={(link) => {
            setShortLink(link);
            // 카카오 채널인 경우 버튼 링크로도 설정
            if (channelType === 'kakao') {
              updateFormData({ buttonLink: link, shortLink: link });
            }
          }}
        />
      </div>

      {/* SEO 최적화 (네이버 블로그용) */}
      {channelType === 'naver' && (
        <div className="mb-6">
          <SEOOptimizer
            title={formData.title || ''}
            content={formData.content || ''}
            metaTitle={formData.metaTitle || formData.title || ''}
            metaDescription={formData.metaDescription || formData.content?.substring(0, 160) || ''}
            metaKeywords={formData.metaKeywords || ''}
            slug={formData.slug || formData.title?.toLowerCase().replace(/\s+/g, '-') || ''}
            onMetaTitleChange={(value) => updateFormData({ metaTitle: value })}
            onMetaDescriptionChange={(value) => updateFormData({ metaDescription: value })}
            onMetaKeywordsChange={(value) => updateFormData({ metaKeywords: value })}
            onSlugChange={(value) => updateFormData({ slug: value })}
            onOptimize={(optimized) => {
              updateFormData(optimized);
            }}
          />
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? '저장 중...' : '초안 저장'}
        </button>
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? '발송 중...' : '발송하기'}
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* 이미지 갤러리 */}
      {showGallery && (
        <AIImagePicker
          selectedImage={selectedImage || ''}
          onImageSelect={(imageUrl) => {
            setSelectedImage(imageUrl);
            setShowGallery(false);
          }}
          channelType={channelType}
        />
      )}
    </div>
  );
}
