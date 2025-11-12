'use client';

import React, { useState } from 'react';
import { CheckCircle, Loader, User, MessageSquare, CheckCircle2, Circle, Upload, Smartphone } from 'lucide-react';
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
  onGenerateProfileImage: (type: 'background' | 'profile', prompt: string) => Promise<{ imageUrls: string[], generatedPrompt?: string }>;
  onGenerateFeedImage: (prompt: string) => Promise<{ imageUrls: string[], generatedPrompt?: string }>;
  onAutoCreate: () => Promise<void>;
  isCreating?: boolean;
  publishStatus?: 'created' | 'published';
  onPublishStatusChange?: (status: 'created' | 'published') => void;
  publishedAt?: string;
  selectedDate?: string;
  accountKey?: 'account1' | 'account2';
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
  accountKey
}: KakaoAccountEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  const toneColor = account.tone === 'gold' 
    ? 'bg-yellow-50 border-yellow-200' 
    : 'bg-blue-50 border-blue-200';

  return (
    <div className={`border-2 rounded-lg p-6 ${toneColor}`}>
      {/* 계정 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {account.name} ({account.number})
          </h3>
          <div className="text-sm text-gray-600 mt-1">
            <div>페르소나: {account.persona}</div>
            <div>톤: {account.tone === 'gold' ? '골드톤 시니어 매너' : '블랙톤 젊은 매너'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 배포 완료 체크 */}
          {onPublishStatusChange && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={publishStatus === 'published'}
                onChange={(e) => {
                  const newStatus = e.target.checked ? 'published' : 'created';
                  onPublishStatusChange(newStatus);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="text-sm">
                <div className="font-medium text-gray-700">
                  {publishStatus === 'published' ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      배포 완료
                    </span>
                  ) : (
                    <span className="text-gray-500 flex items-center gap-1">
                      <Circle className="w-4 h-4" />
                      배포 대기
                    </span>
                  )}
                </div>
                {publishStatus === 'published' && publishedAt && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(publishedAt).toLocaleDateString('ko-KR')}
                  </div>
                )}
              </div>
            </label>
          )}
          <button
            onClick={handleAutoCreate}
            disabled={isGenerating || isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                생성 중...
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
        </div>
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
        />
      </div>
    </div>
  );
}

