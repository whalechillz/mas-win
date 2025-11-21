'use client';

import React, { useState } from 'react';
import { Image, Sparkles, X, RotateCcw, RefreshCw } from 'lucide-react';
import GalleryPicker from '../GalleryPicker';

interface FeedData {
  imageCategory: string;
  imagePrompt: string;
  caption: string;
  imageUrl?: string;
  url?: string;
  basePrompt?: string;
  abTest?: {
    methodA: {
      images: Array<{ imageUrl: string; originalUrl: string; method: string }>;
      totalSize: number;
      generationTime: number;
      method: string;
    } | null; // null 허용
    methodB: {
      images: Array<{ imageUrl: string; originalUrl: string; method: string }>;
      totalSize: number;
      generationTime: number;
      method: string;
    } | null; // null 허용
    comparison: {
      methodA: {
        fileSize: number;
        generationTime: number;
        imageCount: number;
      } | null; // null 허용
      methodB: {
        fileSize: number;
        generationTime: number;
        imageCount: number;
      } | null; // null 허용
    };
  };
}

interface FeedManagerProps {
  account: {
    number: string;
    name: string;
    persona: string;
    tone: 'gold' | 'black';
  };
  feedData: FeedData;
  onUpdate: (data: FeedData) => void;
  onGenerateImage: (prompt: string) => Promise<{ imageUrls: string[], generatedPrompt?: string, paragraphImages?: any[] }>;
  isGenerating?: boolean;
  accountKey?: 'account1' | 'account2';
  calendarData?: any;
  selectedDate?: string;
  onBasePromptUpdate?: (basePrompt: string) => void;
}

export default function FeedManager({
  account,
  feedData,
  onUpdate,
  onGenerateImage,
  isGenerating = false,
  accountKey,
  calendarData,
  selectedDate,
  onBasePromptUpdate
}: FeedManagerProps) {
  const [showGallery, setShowGallery] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingBasePrompt, setIsGeneratingBasePrompt] = useState(false);
  const [isRegeneratingPrompt, setIsRegeneratingPrompt] = useState(false);
  const [isRecoveringImage, setIsRecoveringImage] = useState(false);

  // 이미지 자동 복구 함수 (갤러리에서 해당 날짜 이미지 찾기)
  const handleAutoRecoverImage = async () => {
    if (!selectedDate || !accountKey) {
      console.warn('날짜 또는 계정 정보가 없어 자동 복구를 수행할 수 없습니다.');
      return;
    }

    try {
      setIsRecoveringImage(true);

      // 갤러리에서 해당 날짜의 피드 이미지 조회
      const response = await fetch(
        `/api/kakao-content/fetch-gallery-images-by-date?date=${selectedDate}&account=${accountKey}&type=feed`
      );

      if (!response.ok) {
        throw new Error('갤러리 이미지 조회 실패');
      }

      const data = await response.json();
      
      if (data.success && data.images && data.images.length > 0) {
        // 첫 번째 이미지 사용 (가장 최근 생성된 이미지)
        const recoveredImageUrl = data.images[0].url;
        
        onUpdate({
          ...feedData,
          imageUrl: recoveredImageUrl
        });

        console.log('✅ 피드 이미지 자동 복구 완료:', recoveredImageUrl);
        alert('✅ 피드 이미지가 갤러리에서 자동으로 복구되었습니다.');
      } else {
        console.warn('⚠️ 갤러리에서 피드 이미지를 찾을 수 없습니다.');
        alert('⚠️ 갤러리에서 피드 이미지를 찾을 수 없습니다.');
      }
    } catch (error: any) {
      console.error('❌ 피드 이미지 자동 복구 실패:', error);
      alert(`이미지 자동 복구 실패: ${error.message}`);
    } finally {
      setIsRecoveringImage(false);
    }
  };

  // 이미지 에러 핸들러
  const handleImageError = async (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    console.warn('⚠️ 피드 이미지 로드 실패:', img.src);
    
    // 이미지 URL을 즉시 undefined로 설정하여 표시 제거 (캐시된 이미지 방지)
    onUpdate({
      ...feedData,
      imageUrl: undefined
    });
    
    // 자동 복구 시도
    await handleAutoRecoverImage();
  };

  // basePrompt 가져오기
  const getBasePrompt = (): string | undefined => {
    if (calendarData && accountKey && selectedDate) {
      const feedSchedule = calendarData.kakaoFeed?.dailySchedule || [];
      const schedule = feedSchedule.find((s: any) => s.date === selectedDate);
      if (schedule) {
        return accountKey === 'account1' 
          ? schedule.account1?.basePrompt || schedule.account1?.imageCategory
          : schedule.account2?.basePrompt || schedule.account2?.imageCategory;
      }
    }
    return feedData.basePrompt || feedData.imageCategory;
  };

  // basePrompt 자동 생성
  const handleGenerateBasePrompt = async () => {
    try {
      setIsGeneratingBasePrompt(true);
      
      const weeklyTheme = calendarData?.profileContent?.[accountKey || 'account1']?.weeklyThemes?.week1 || 
                          '비거리의 감성 – 스윙과 마음의 연결';
      
      const response = await fetch('/api/kakao-content/generate-base-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate || new Date().toISOString().split('T')[0],
          accountType: accountKey || (account.tone === 'gold' ? 'account1' : 'account2'),
          type: 'feed',
          weeklyTheme: weeklyTheme
        })
      });

      const data = await response.json();
      if (data.success && data.basePrompt) {
        // 자동으로 저장
        if (onBasePromptUpdate) {
          onBasePromptUpdate(data.basePrompt);
        }
        onUpdate({ ...feedData, basePrompt: data.basePrompt });
        alert('✅ basePrompt가 자동 생성되어 저장되었습니다.');
      } else {
        throw new Error(data.message || 'basePrompt 생성 실패');
      }
    } catch (error: any) {
      alert(`basePrompt 생성 실패: ${error.message}`);
    } finally {
      setIsGeneratingBasePrompt(false);
    }
  };


  // 프롬프트 재생성 (basePrompt 기반)
  const handleRegeneratePrompt = async () => {
    try {
      setIsRegeneratingPrompt(true);
      
      let basePrompt: string | undefined = getBasePrompt();
      
      if (!basePrompt) {
        alert('basePrompt를 먼저 설정해주세요.');
        return;
      }

      // 프롬프트 재생성 API 호출
      const promptResponse = await fetch('/api/kakao-content/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: basePrompt,
          accountType: accountKey || (account.tone === 'gold' ? 'account1' : 'account2'),
          type: 'feed',
          brandStrategy: {
            customerpersona: account.tone === 'gold' ? 'senior_fitting' : 'tech_enthusiast',
            customerChannel: 'local_customers',
            brandWeight: account.tone === 'gold' ? '높음' : '중간',
            audienceTemperature: 'warm'
          },
          weeklyTheme: calendarData?.profileContent?.[accountKey || 'account1']?.weeklyThemes?.week1 || 
                      '비거리의 감성 – 스윙과 마음의 연결',
          date: selectedDate || new Date().toISOString().split('T')[0]
        })
      });

      const promptData = await promptResponse.json();
      if (!promptData.success) {
        throw new Error(promptData.message || '프롬프트 재생성 실패');
      }

      const newPrompt = promptData.prompt;

      // 새 프롬프트로 이미지 재생성
      const result = await onGenerateImage(newPrompt);
      if (result.imageUrls.length > 0) {
        onUpdate({
          ...feedData,
          imagePrompt: newPrompt,
          imageUrl: result.imageUrls[0]
        });
        alert('✅ 프롬프트와 이미지가 재생성되었습니다.');
      }
    } catch (error: any) {
      alert(`프롬프트 재생성 실패: ${error.message}`);
    } finally {
      setIsRegeneratingPrompt(false);
    }
  };

  const handleGenerateImage = async () => {
    try {
      setIsGeneratingImage(true);
      const result = await onGenerateImage(feedData.imagePrompt);
      if (result.imageUrls.length > 0) {
        const updateData: FeedData = {
          ...feedData,
          imageUrl: result.imageUrls[0],
          imagePrompt: result.generatedPrompt || feedData.imagePrompt
        };
        
        onUpdate(updateData);
      }
    } catch (error: any) {
      alert(`피드 이미지 생성 실패: ${error.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 이미지 카테고리 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          피드 이미지
        </label>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            <strong>카테고리:</strong> {feedData.imageCategory}
          </div>
          
          {/* basePrompt 관리 */}
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600">Base Prompt (요일별 템플릿)</label>
              <button
                onClick={handleGenerateBasePrompt}
                disabled={isGeneratingBasePrompt}
                className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50 flex items-center gap-1"
                title="자동 생성"
              >
                {isGeneratingBasePrompt ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>생성 중...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" />
                    <span>자동 생성</span>
                  </>
                )}
              </button>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
              {getBasePrompt() || 'basePrompt 없음'}
            </div>
          </div>
          
          <div className="text-xs text-gray-500 max-h-20 overflow-y-auto flex items-start justify-between gap-2 mt-2">
            <div className="flex-1 break-words">
              <strong>프롬프트:</strong> {feedData.imagePrompt}
            </div>
            <button
              onClick={handleRegeneratePrompt}
              disabled={isRegeneratingPrompt || isGeneratingImage || isGenerating}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="프롬프트 재생성 (새로운 로직 적용) + 이미지 자동 재생성"
            >
              {isRegeneratingPrompt ? '🔄 재생성 중...' : '🔄 재생성'}
            </button>
          </div>
          <div className="text-xs text-gray-500">
            <strong>생성 사이즈:</strong> 1080x1350 (4:5 세로형, 카카오톡 피드 최적화)
          </div>
          
          {feedData.imageUrl && (
            <div className="mt-2 relative">
              <img 
                src={feedData.imageUrl} 
                alt="피드 이미지"
                className="w-full aspect-[4/5] object-cover rounded-lg"
                onError={handleImageError}
              />
              {isRecoveringImage && (
                <div className="absolute inset-0 bg-blue-100 bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <div className="text-sm text-blue-700">갤러리에서 이미지 복구 중...</div>
                  </div>
                </div>
              )}
              <button
                onClick={() => onUpdate({
                  ...feedData,
                  imageUrl: undefined
                })}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                title="이미지 삭제"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="mt-1 text-xs text-gray-500">
                피드 이미지 사이즈: 1080x1350 (4:5 세로형, 최적화됨)
              </div>
            </div>
          )}
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowGallery(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              <Image className="w-4 h-4" />
              갤러리에서 선택
            </button>
            <button
              onClick={handleGenerateImage}
              disabled={isGeneratingImage || isGenerating}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm disabled:opacity-50"
            >
              {isGeneratingImage ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  {feedData.imageUrl ? '이미지 재생성' : '⚡ 피드 이미지 생성'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 캡션 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          피드 캡션
        </label>
        <textarea
          value={feedData.caption}
          onChange={(e) => onUpdate({ ...feedData, caption: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="피드 캡션을 입력하세요"
        />
        <div className="text-xs text-gray-500 mt-1">
          {feedData.caption.length}자
        </div>
      </div>

      {/* URL */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          피드 URL (캡션 하단에 표시)
        </label>
        <label className="sr-only" htmlFor="feed-url">피드 URL 선택</label>
        <select
          id="feed-url"
          value={feedData.url || ''}
          onChange={(e) => onUpdate({ ...feedData, url: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          aria-label="피드 URL 선택"
        >
          <option value="">URL 선택 (선택사항)</option>
          <option value="https://masgolf.co.kr">신규 홈페이지 (masgolf.co.kr)</option>
          <option value="https://www.mas9golf.com">기존 홈페이지 (mas9golf.com)</option>
          <option value="https://masgolf.co.kr/muziik">뮤직 콜라보 (MUZIIK)</option>
          <option value="https://www.masgolf.co.kr/contact">시타 매장 안내</option>
          <option value="https://www.mas9golf.com/try-a-massgo">시타 예약</option>
          <option value="https://smartstore.naver.com/mas9golf">네이버 스마트스토어</option>
        </select>
        {feedData.url && (
          <div className="mt-2 text-xs text-gray-600">
            선택된 URL: <a href={feedData.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{feedData.url}</a>
          </div>
        )}
        <div className="mt-2">
          <input
            type="text"
            value={feedData.url || ''}
            onChange={(e) => onUpdate({ ...feedData, url: e.target.value })}
            placeholder="또는 직접 URL 입력"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* 갤러리 모달 */}
      <GalleryPicker
        isOpen={showGallery}
        onSelect={(imageUrl) => {
          onUpdate({
            ...feedData,
            imageUrl
          });
          setShowGallery(false);
        }}
        onClose={() => setShowGallery(false)}
        autoFilterFolder={
          selectedDate && accountKey
            ? `originals/daily-branding/kakao/${selectedDate}/${accountKey}/feed`
            : undefined
        }
        showCompareMode={true}
        maxCompareCount={3}
      />
    </div>
  );
}

