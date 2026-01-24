'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Loader, User, MessageSquare, CheckCircle2, Circle, Upload, Smartphone, Send, RotateCcw, ChevronDown, Image, FileText, Rocket, Sparkles } from 'lucide-react';
import ProfileManager from './ProfileManager';
import FeedManager from './FeedManager';

interface ProfileData {
  background: {
    image: string;
    prompt: string;
    imageUrl?: string;
  };
  profile: {
    image: string;
    prompt: string;
    imageUrl?: string;
  };
  message: string;
}

interface FeedData {
  imageCategory: string;
  imagePrompt: string;
  caption: string;
  imageUrl?: string;
  url?: string;
  basePrompt?: string;
}

interface KakaoAccountEditorProps {
  account: {
    number: string;
    name: string;
    persona: string;
    tone: 'gold' | 'black';
  };
  profileData: ProfileData;
  feedData: FeedData;
  onProfileUpdate: (data: ProfileData) => void;
  onFeedUpdate: (data: FeedData) => void;
  onGenerateProfileImage: (type: 'background' | 'profile', prompt: string) => Promise<{ imageUrls: string[], generatedPrompt?: string, paragraphImages?: any[] }>;
  onGenerateFeedImage: (prompt: string) => Promise<{ imageUrls: string[], generatedPrompt?: string, paragraphImages?: any[] }>;
  onAutoCreate: () => Promise<void>;
  isCreating?: boolean;
  publishStatus?: 'created' | 'published';
  onPublishStatusChange?: (status: 'created' | 'published') => void;
  publishedAt?: string;
  selectedDate?: string;
  accountKey?: 'account1' | 'account2';
  calendarData?: any;
  onBasePromptUpdate?: (type: 'background' | 'profile', basePrompt: string) => void;
  setCalendarData?: (data: any) => void;
  saveCalendarData?: (data: any) => Promise<void>;
}

export default function KakaoAccountEditor({
  account,
  profileData,
  feedData,
  onProfileUpdate,
  onFeedUpdate,
  onGenerateProfileImage,
  onGenerateFeedImage,
  onAutoCreate,
  isCreating = false,
  publishStatus = 'created',
  onPublishStatusChange,
  publishedAt,
  selectedDate,
  accountKey,
  calendarData,
  onBasePromptUpdate,
  setCalendarData,
  saveCalendarData
}: KakaoAccountEditorProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingSlack, setIsSendingSlack] = useState(false);
  const [showPartialGenerateMenu, setShowPartialGenerateMenu] = useState(false);
  const [showPartialRegenerateMenu, setShowPartialRegenerateMenu] = useState(false);
  const partialGenerateMenuRef = useRef<HTMLDivElement>(null);
  const partialRegenerateMenuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (partialGenerateMenuRef.current && !partialGenerateMenuRef.current.contains(event.target as Node)) {
        setShowPartialGenerateMenu(false);
      }
      if (partialRegenerateMenuRef.current && !partialRegenerateMenuRef.current.contains(event.target as Node)) {
        setShowPartialRegenerateMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [generationProgress, setGenerationProgress] = useState<{
    currentStep: string;
    progress: number;
    totalSteps: number;
  } | null>(null);

  // 누락 항목 감지
  const missingItems = React.useMemo(() => {
    const items: string[] = [];
    if (!profileData.background.imageUrl) items.push('배경 이미지');
    if (!profileData.profile.imageUrl) items.push('프로필 이미지');
    if (!profileData.message || profileData.message.trim() === '') items.push('프로필 메시지');
    if (!feedData.imageUrl) items.push('피드 이미지');
    if (!feedData.caption || feedData.caption.trim() === '') items.push('피드 캡션');
    return items;
  }, [profileData, feedData]);

  const handleAutoCreate = async () => {
    try {
      setIsGenerating(true);
      setGenerationProgress({ currentStep: '초기화 중...', progress: 0, totalSteps: 3 });
      
      // 배경 이미지 생성
      setGenerationProgress({ currentStep: '배경 이미지 생성 중...', progress: 1, totalSteps: 3 });
      
      await onAutoCreate();
      
      setGenerationProgress({ currentStep: '완료', progress: 3, totalSteps: 3 });
      setTimeout(() => setGenerationProgress(null), 1000);
    } catch (error: any) {
      setGenerationProgress(null);
      alert(`자동 생성 실패: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    // ✅ 배포 완료 상태면 차단
    if (publishStatus === 'published') {
      alert('배포 완료 상태에서는 이미지를 재생성할 수 없습니다. 배포 대기로 변경해주세요.');
      return;
    }

    if (!confirm('기존 이미지를 모두 삭제하고 재생성하시겠습니까?\n\n⚠️ 기존 이미지가 모두 삭제되고 새로운 이미지가 생성됩니다.')) {
      return;
    }
    
    try {
      setIsGenerating(true);
      setGenerationProgress({ currentStep: '기존 이미지 삭제 중...', progress: 0, totalSteps: 4 });
      
      // 기존 이미지 URL 초기화
      onProfileUpdate({
        ...profileData,
        background: { ...profileData.background, imageUrl: undefined },
        profile: { ...profileData.profile, imageUrl: undefined }
      });
      
      onFeedUpdate({
        ...feedData,
        imageUrl: undefined
      });
      
      setGenerationProgress({ currentStep: '재생성 시작...', progress: 1, totalSteps: 4 });
      
      // 재생성 실행
      await onAutoCreate();
      
      setGenerationProgress({ currentStep: '완료', progress: 4, totalSteps: 4 });
      setTimeout(() => setGenerationProgress(null), 1000);
    } catch (error: any) {
      setGenerationProgress(null);
      alert(`재생성 실패: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 부분 생성 핸들러
  const handlePartialGenerate = async (type: 'background' | 'profile' | 'feed' | 'message' | 'caption') => {
    setShowPartialGenerateMenu(false);
    
    // ✅ 이미지 생성 타입이면 배포 상태 확인
    if (publishStatus === 'published' && ['background', 'profile', 'feed'].includes(type)) {
      alert('배포 완료 상태에서는 이미지를 생성할 수 없습니다. 배포 대기로 변경해주세요.');
      return;
    }
    
    try {
      setIsGenerating(true);
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const account = accountKey || 'account1';
      
      if (!selectedDate) {
        alert('날짜를 선택해주세요.');
        return;
      }

      if (type === 'background') {
        setGenerationProgress({ currentStep: '배경 이미지 생성 중...', progress: 1, totalSteps: 1 });
        const result = await onGenerateProfileImage('background', profileData.background.prompt);
        if (result.imageUrls.length > 0) {
          onProfileUpdate({
            ...profileData,
            background: { ...profileData.background, imageUrl: result.imageUrls[0] }
          });
        }
      } else if (type === 'profile') {
        setGenerationProgress({ currentStep: '프로필 이미지 생성 중...', progress: 1, totalSteps: 1 });
        const result = await onGenerateProfileImage('profile', profileData.profile.prompt);
        if (result.imageUrls.length > 0) {
          onProfileUpdate({
            ...profileData,
            profile: { ...profileData.profile, imageUrl: result.imageUrls[0] }
          });
        }
      } else if (type === 'feed') {
        setGenerationProgress({ currentStep: '피드 이미지 생성 중...', progress: 1, totalSteps: 1 });
        const result = await onGenerateFeedImage(feedData.imagePrompt);
        if (result.imageUrls.length > 0) {
          onFeedUpdate({
            ...feedData,
            imageUrl: result.imageUrls[0]
          });
        }
      } else if (type === 'message') {
        setGenerationProgress({ currentStep: '프로필 메시지 생성 중...', progress: 1, totalSteps: 1 });
        const response = await fetch(`${baseUrl}/api/kakao-content/generate-prompt-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'message',
            accountType: account,
            brandStrategy: {
              customerpersona: account === 'account1' ? 'senior_fitting' : 'tech_enthusiast',
              customerChannel: 'local_customers',
              brandWeight: account === 'account1' ? '높음' : '중간',
              audienceTemperature: 'warm',
              audienceWeight: account === 'account1' ? '높음' : undefined
            },
            weeklyTheme: calendarData?.weeklyTheme || '비거리의 감성 – 스윙과 마음의 연결',
            date: selectedDate
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.message) {
            let cleanedMessage = data.data.message.trim();
            cleanedMessage = cleanedMessage.replace(/^json\s*\{\s*message\s*:\s*/i, '');
            cleanedMessage = cleanedMessage.replace(/\s*\}\s*$/i, '');
            cleanedMessage = cleanedMessage.replace(/^["'`]+|["'`]+$/g, '').trim();
            onProfileUpdate({ ...profileData, message: cleanedMessage });
          }
        }
      } else if (type === 'caption') {
        setGenerationProgress({ currentStep: '피드 캡션 생성 중...', progress: 1, totalSteps: 1 });
        const response = await fetch(`${baseUrl}/api/kakao-content/generate-feed-caption`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageCategory: feedData.imageCategory || '시니어 골퍼의 스윙',
            accountType: account,
            weeklyTheme: calendarData?.weeklyTheme || '비거리의 감성 – 스윙과 마음의 연결',
            date: selectedDate
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.caption) {
            onFeedUpdate({ ...feedData, caption: data.caption });
          }
        }
      }
      
      setGenerationProgress({ currentStep: '완료', progress: 1, totalSteps: 1 });
      setTimeout(() => setGenerationProgress(null), 1000);
      alert(`✅ ${type === 'background' ? '배경 이미지' : type === 'profile' ? '프로필 이미지' : type === 'feed' ? '피드 이미지' : type === 'message' ? '프로필 메시지' : '피드 캡션'} 생성 완료!`);
    } catch (error: any) {
      setGenerationProgress(null);
      alert(`생성 실패: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 부분 재생성 핸들러
  const handlePartialRegenerate = async (type: 'background' | 'profile' | 'feed' | 'message' | 'caption' | 'all') => {
    setShowPartialRegenerateMenu(false);
    
    // ✅ 이미지 생성 타입이면 배포 상태 확인
    if (publishStatus === 'published' && ['background', 'profile', 'feed', 'all'].includes(type)) {
      alert('배포 완료 상태에서는 이미지를 재생성할 수 없습니다. 배포 대기로 변경해주세요.');
      return;
    }
    
    if (type === 'all') {
      await handleRegenerate();
      return;
    }
    
    const typeNames = {
      background: '배경 이미지',
      profile: '프로필 이미지',
      feed: '피드 이미지',
      message: '프로필 메시지',
      caption: '피드 캡션'
    };
    
    if (!confirm(`${typeNames[type]}를 재생성하시겠습니까?`)) {
      return;
    }
    
    try {
      setIsGenerating(true);
      
      if (type === 'background') {
        onProfileUpdate({
          ...profileData,
          background: { ...profileData.background, imageUrl: undefined }
        });
        await handlePartialGenerate('background');
      } else if (type === 'profile') {
        onProfileUpdate({
          ...profileData,
          profile: { ...profileData.profile, imageUrl: undefined }
        });
        await handlePartialGenerate('profile');
      } else if (type === 'feed') {
        onFeedUpdate({
          ...feedData,
          imageUrl: undefined
        });
        await handlePartialGenerate('feed');
      } else if (type === 'message') {
        onProfileUpdate({
          ...profileData,
          message: ''
        });
        await handlePartialGenerate('message');
      } else if (type === 'caption') {
        onFeedUpdate({
          ...feedData,
          caption: ''
        });
        await handlePartialGenerate('caption');
      }
    } catch (error: any) {
      alert(`재생성 실패: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadToKakao = async () => {
    if (!selectedDate || !accountKey) {
      alert('날짜와 계정 정보가 필요합니다.');
      return;
    }

    if (!profileData.background.imageUrl || !profileData.profile.imageUrl) {
      alert('배경 이미지와 프로필 이미지를 먼저 생성해주세요.');
      return;
    }

    if (!profileData.message) {
      alert('상태 메시지를 입력해주세요.');
      return;
    }

    const confirmMessage = `카카오톡 프로필을 업데이트하시겠습니까?\n\n계정: ${account.name} (${account.number})\n날짜: ${selectedDate}\n\n⚠️ 주의: 브라우저가 열리며 자동으로 업데이트됩니다.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsUploading(true);
      
      const response = await fetch('/api/kakao-content/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: accountKey,
          date: selectedDate
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ 카카오톡 프로필 업데이트가 시작되었습니다!\n\n브라우저가 열리면 자동으로 진행됩니다.\n수동 확인이 필요할 수 있습니다.');
        
        // 배포 상태를 published로 변경
        if (onPublishStatusChange) {
          onPublishStatusChange('published');
        }
      } else {
        throw new Error(data.message || '업데이트 실패');
      }
    } catch (error: any) {
      console.error('카카오톡 업로드 오류:', error);
      alert(`카카오톡 업로드 실패: ${error.message}\n\n수동으로 업로드해주세요.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendToSlack = async () => {
    if (!selectedDate || !accountKey) {
      alert('날짜와 계정 정보가 필요합니다.');
      return;
    }

    if (!feedData.imageUrl || !feedData.caption) {
      alert('피드 이미지와 캡션을 먼저 생성해주세요.');
      return;
    }

    try {
      setIsSendingSlack(true);
      
      const response = await fetch('/api/kakao-content/slack-send-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: accountKey,
          date: selectedDate
        })
      });

      // 응답이 JSON인지 확인
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ 서버 응답이 JSON이 아닙니다:', text.substring(0, 200));
        throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        alert('✅ 슬랙으로 전송되었습니다!');
      } else {
        throw new Error(data.error || '전송 실패');
      }
    } catch (error: any) {
      console.error('슬랙 전송 오류:', error);
      alert(`슬랙 전송 실패: ${error.message}`);
    } finally {
      setIsSendingSlack(false);
    }
  };

  const toneColor = account.tone === 'gold' 
    ? 'bg-yellow-50 border-yellow-200' 
    : 'bg-blue-50 border-blue-200';

  return (
    <div className={`border-2 rounded-lg p-6 ${toneColor}`}>
      {/* 계정 헤더 - 4행 구조 */}
      <div className="mb-4">
        {/* 1행: 계정명 + 전화번호 */}
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 break-words">
            {account.name} <span className="text-sm font-normal text-gray-600">({account.number})</span>
          </h3>
        </div>
        
        {/* 2행: 페르소나/톤 배지 */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
            {account.persona}
          </span>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
            account.tone === 'gold' 
              ? 'bg-amber-50 text-amber-700 border-amber-200' 
              : 'bg-gray-50 text-gray-700 border-gray-200'
          }`}>
            {account.tone === 'gold' ? '골드톤' : '블랙톤'}
          </span>
        </div>
      </div>

      {/* 액션 패널 - 4행 구조 */}
      <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-3 mb-4 shadow-sm">
        {/* 3행: 생성 상태, 재생성, 배포 상태 (한 줄 배치, 작은 크기) */}
        <div className="flex items-center gap-1 flex-nowrap mb-3 pb-3 border-b border-gray-200">
          {/* 생성 상태 & 액션 버튼 */}
          {profileData.background.imageUrl && profileData.profile.imageUrl && feedData.imageUrl && profileData.message && feedData.caption ? (
            <>
              <div className="flex items-center gap-1 px-2 py-1.5 min-h-[28px] bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded text-[10px] font-semibold text-green-700 shadow-sm whitespace-nowrap">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span>생성완료</span>
              </div>
              <div className="relative" ref={partialRegenerateMenuRef}>
                <button
                  onClick={() => setShowPartialRegenerateMenu(!showPartialRegenerateMenu)}
                  disabled={isGenerating || isCreating}
                  className="flex items-center gap-1 px-2 py-1.5 min-h-[28px] bg-white border border-orange-200 hover:border-orange-300 text-orange-700 rounded text-[10px] font-medium transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
                  <span>재생성</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showPartialRegenerateMenu ? 'rotate-180' : ''}`} />
                </button>
                  {showPartialRegenerateMenu && !isGenerating && (
                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[200px] overflow-hidden">
                      <button
                        onClick={() => handlePartialRegenerate('all')}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm font-medium transition-colors"
                      >
                        전체 재생성
                      </button>
                      <div className="border-t border-gray-200" />
                      <button
                        onClick={() => handlePartialRegenerate('background')}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 transition-colors"
                      >
                        <Image className="w-4 h-4 text-gray-500" />
                        배경 이미지만
                      </button>
                      <button
                        onClick={() => handlePartialRegenerate('profile')}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 transition-colors"
                      >
                        <Image className="w-4 h-4 text-gray-500" />
                        프로필 이미지만
                      </button>
                      <button
                        onClick={() => handlePartialRegenerate('feed')}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 transition-colors"
                      >
                        <Image className="w-4 h-4 text-gray-500" />
                        피드 이미지만
                      </button>
                      <button
                        onClick={() => handlePartialRegenerate('message')}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-gray-500" />
                        프로필 메시지만
                      </button>
                      <button
                        onClick={() => handlePartialRegenerate('caption')}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-gray-500" />
                        피드 캡션만
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleAutoCreate}
                  disabled={isGenerating || isCreating}
                  className="flex items-center gap-1 px-2 py-1.5 min-h-[28px] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded text-[10px] font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed group whitespace-nowrap"
                  title="계정 자동 생성"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="w-3 h-3 animate-spin" />
                      <span>생성 중...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-3 h-3 group-hover:translate-y-[-2px] transition-transform" />
                      <span>전체 생성</span>
                    </>
                  )}
                </button>
                <div className="relative" ref={partialGenerateMenuRef}>
                  <button
                    onClick={() => setShowPartialGenerateMenu(!showPartialGenerateMenu)}
                    disabled={isGenerating || isCreating}
                    className="flex items-center gap-1 px-2 py-1.5 min-h-[28px] bg-white border border-blue-200 hover:border-blue-300 text-blue-700 rounded text-[10px] font-medium transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group whitespace-nowrap"
                  >
                    <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                    <span>선택 생성</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showPartialGenerateMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showPartialGenerateMenu && !isGenerating && (
                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[200px] overflow-hidden">
                      {!profileData.background.imageUrl && (
                        <button
                          onClick={() => handlePartialGenerate('background')}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 transition-colors"
                        >
                          <Image className="w-4 h-4 text-gray-500" />
                          배경 이미지
                        </button>
                      )}
                      {!profileData.profile.imageUrl && (
                        <button
                          onClick={() => handlePartialGenerate('profile')}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 transition-colors"
                        >
                          <Image className="w-4 h-4 text-gray-500" />
                          프로필 이미지
                        </button>
                      )}
                      {!feedData.imageUrl && (
                        <button
                          onClick={() => handlePartialGenerate('feed')}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 transition-colors"
                        >
                          <Image className="w-4 h-4 text-gray-500" />
                          피드 이미지
                        </button>
                      )}
                      {(!profileData.message || profileData.message.trim() === '') && (
                        <button
                          onClick={() => handlePartialGenerate('message')}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-gray-500" />
                          프로필 메시지
                        </button>
                      )}
                      {(!feedData.caption || feedData.caption.trim() === '') && (
                        <button
                          onClick={() => handlePartialGenerate('caption')}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-gray-500" />
                          피드 캡션
                        </button>
                      )}
                      {profileData.background.imageUrl && profileData.profile.imageUrl && feedData.imageUrl && profileData.message && feedData.caption && (
                        <div className="px-4 py-2.5 text-xs text-gray-500 bg-gray-50">
                          모든 항목이 생성되었습니다
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          
          {/* 배포 상태 */}
          {onPublishStatusChange && (
            <button
              onClick={() => {
                const newStatus = publishStatus === 'published' ? 'created' : 'published';
                onPublishStatusChange(newStatus);
              }}
              className={`flex items-center gap-1 px-2 py-1.5 min-h-[28px] rounded text-[10px] font-semibold transition-all whitespace-nowrap shadow-sm hover:shadow ${
                publishStatus === 'published'
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 hover:from-green-200 hover:to-emerald-200 border border-green-300'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
              }`}
              title={publishStatus === 'published' ? '배포 완료 - 클릭하여 배포 대기로 변경' : '배포 대기 - 클릭하여 배포 완료로 변경'}
            >
              {publishStatus === 'published' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  <span>배포완료</span>
                </>
              ) : (
                <>
                  <Circle className="w-3 h-3 flex-shrink-0" />
                  <span>배포대기</span>
                </>
              )}
            </button>
          )}
        </div>
        
        {/* 4행: 카카오톡, 슬랙 버튼 */}
        {(profileData.background.imageUrl && profileData.profile.imageUrl) && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleUploadToKakao}
              disabled={isUploading || !profileData.background.imageUrl || !profileData.profile.imageUrl || !profileData.message}
              className="flex items-center justify-center gap-2 px-4 py-2 min-h-[36px] flex-1 min-w-[120px] bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg text-xs font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              title={!profileData.background.imageUrl || !profileData.profile.imageUrl || !profileData.message 
                ? '이미지와 메시지를 먼저 생성해주세요' 
                : '카카오톡 프로필 업데이트'}
            >
              {isUploading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>업로드 중...</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>카카오톡</span>
                </>
              )}
            </button>
            <button
              onClick={handleSendToSlack}
              disabled={isSendingSlack || !feedData.imageUrl || !feedData.caption}
              className="flex items-center justify-center gap-2 px-4 py-2 min-h-[36px] flex-1 min-w-[120px] bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-xs font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              title={!feedData.imageUrl || !feedData.caption 
                ? '피드 이미지와 캡션을 먼저 생성해주세요' 
                : '슬랙으로 전송'}
            >
              {isSendingSlack ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>전송 중...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>슬랙</span>
                </>
              )}
            </button>
            
            {/* 배포 진행 상태 표시 */}
            {(isUploading || isSendingSlack) && (
              <div className="w-full mt-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Loader className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-sm font-semibold text-purple-900">
                    {isUploading ? '카카오톡 업로드 중...' : '슬랙 전송 중...'}
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
                </div>
              </div>
            )}
          </div>
        )}
          
        {/* 누락 항목 알림 (세련된 디자인) */}
        {missingItems.length > 0 && (
          <div className="flex items-start gap-3 p-3.5 bg-amber-50/50 border border-amber-200/50 rounded-lg mb-3">
            <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs">⚠️</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 mb-1">
                {missingItems.length}개 항목 누락
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                {missingItems.join(', ')}
              </p>
            </div>
          </div>
        )}
        
        {/* 진행 상태 표시 - 컴팩트 */}
        {generationProgress && (
          <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">{generationProgress.currentStep}</span>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {generationProgress.progress} / {generationProgress.totalSteps}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${(generationProgress.progress / generationProgress.totalSteps) * 100}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 프로필 관리 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-5 h-5 text-gray-600" />
          <h4 className="font-semibold text-gray-900">프로필</h4>
        </div>
        <ProfileManager
          account={account}
          profileData={profileData}
          onUpdate={onProfileUpdate}
          onGenerateImage={onGenerateProfileImage}
          isGenerating={isGenerating}
          accountKey={accountKey}
          calendarData={calendarData}
          selectedDate={selectedDate}
          onBasePromptUpdate={onBasePromptUpdate}
          publishStatus={publishStatus} // ✅ 배포 상태 전달
        />
      </div>

      {/* 피드 관리 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <h4 className="font-semibold text-gray-900">피드</h4>
        </div>
        <FeedManager
          account={account}
          feedData={feedData}
          onUpdate={onFeedUpdate}
          onGenerateImage={onGenerateFeedImage}
          isGenerating={isGenerating}
          accountKey={accountKey}
          calendarData={calendarData}
          selectedDate={selectedDate}
          publishStatus={publishStatus} // ✅ 배포 상태 전달
          onBasePromptUpdate={async (basePrompt: string) => {
            // 피드용 basePrompt 업데이트 핸들러
            if (calendarData && accountKey && selectedDate && setCalendarData && saveCalendarData) {
              const updated = { ...calendarData };
              const feedIndex = updated.kakaoFeed?.dailySchedule?.findIndex(
                (f: any) => f.date === selectedDate
              );
              
              if (feedIndex >= 0 && updated.kakaoFeed?.dailySchedule?.[feedIndex]) {
                if (!updated.kakaoFeed.dailySchedule[feedIndex][accountKey]) {
                  updated.kakaoFeed.dailySchedule[feedIndex][accountKey] = {};
                }
                updated.kakaoFeed.dailySchedule[feedIndex][accountKey].basePrompt = basePrompt;
                
                setCalendarData(updated);
                await saveCalendarData(updated);
              }
            }
          }}
        />
      </div>
    </div>
  );
}