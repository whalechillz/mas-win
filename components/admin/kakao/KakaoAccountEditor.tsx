'use client';

import React, { useState } from 'react';
import { CheckCircle, Loader, User, MessageSquare, CheckCircle2, Circle, Upload, Smartphone, Send } from 'lucide-react';
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

  const handleAutoCreate = async () => {
    try {
      setIsGenerating(true);
      await onAutoCreate();
    } catch (error: any) {
      alert(`자동 생성 실패: ${error.message}`);
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
      {/* 계정 헤더 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {account.name} ({account.number})
            </h3>
            <div className="text-sm text-gray-600 mt-1">
              <div>페르소나: {account.persona}</div>
              <div>톤: {account.tone === 'gold' ? '골드톤 시니어 매너' : '블랙톤 젊은 매너'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoCreate}
              disabled={isGenerating || isCreating || (profileData.background.imageUrl && profileData.profile.imageUrl && feedData.imageUrl)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                profileData.background.imageUrl && profileData.profile.imageUrl && feedData.imageUrl
                  ? '모든 이미지가 생성되어 있습니다. X 버튼으로 삭제 후 다시 생성하세요.'
                  : '계정 자동 생성'
              }
            >
              {isGenerating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  생성 중...
                </>
              ) : profileData.background.imageUrl && profileData.profile.imageUrl && feedData.imageUrl ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  ✓ 생성 완료
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  계정 자동 생성
                </>
              )}
            </button>
            <button
              onClick={handleUploadToKakao}
              disabled={isUploading || !profileData.background.imageUrl || !profileData.profile.imageUrl || !profileData.message}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title={!profileData.background.imageUrl || !profileData.profile.imageUrl || !profileData.message 
                ? '이미지와 메시지를 먼저 생성해주세요' 
                : '카카오톡 프로필 업데이트'}
            >
              {isUploading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" />
                  카카오톡 업로드
                </>
              )}
            </button>
            <button
              onClick={handleSendToSlack}
              disabled={isSendingSlack || !feedData.imageUrl || !feedData.caption}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title={!feedData.imageUrl || !feedData.caption 
                ? '피드 이미지와 캡션을 먼저 생성해주세요' 
                : '슬랙으로 전송'}
            >
              {isSendingSlack ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  전송 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  슬랙 전송
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* 배포 상태 별도 줄 */}
        {onPublishStatusChange && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={() => {
                const newStatus = publishStatus === 'published' ? 'created' : 'published';
                onPublishStatusChange(newStatus);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                publishStatus === 'published'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
              }`}
              title={publishStatus === 'published' ? '배포 완료 - 클릭하여 배포 대기로 변경' : '배포 대기 - 클릭하여 배포 완료로 변경'}
            >
              {publishStatus === 'published' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>배포 완료</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 flex-shrink-0" />
                  <span>배포 대기</span>
                </>
              )}
            </button>
            {publishStatus === 'published' && publishedAt && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {new Date(publishedAt).toLocaleDateString('ko-KR', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
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
          onBasePromptUpdate={onBasePromptUpdate}
        />
      </div>
    </div>
  );
}