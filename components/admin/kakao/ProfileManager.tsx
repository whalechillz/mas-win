'use client';

import React, { useState } from 'react';
import { Image, Upload, Sparkles, X, RotateCcw, List } from 'lucide-react';
import GalleryPicker from '../GalleryPicker';
import ProfileMessageList from './ProfileMessageList';

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

interface ProfileManagerProps {
  account: {
    number: string;
    name: string;
    persona: string;
    tone: 'gold' | 'black';
  };
  profileData: ProfileData;
  onUpdate: (data: ProfileData) => void;
  onGenerateImage: (type: 'background' | 'profile', prompt: string) => Promise<{ imageUrls: string[], generatedPrompt?: string }>;
  isGenerating?: boolean;
  accountKey?: 'account1' | 'account2';
  calendarData?: any;
  selectedDate?: string;
  onBasePromptUpdate?: (type: 'background' | 'profile', basePrompt: string) => void;
}

export default function ProfileManager({
  account,
  profileData,
  onUpdate,
  onGenerateImage,
  isGenerating = false,
  accountKey,
  calendarData,
  selectedDate,
  onBasePromptUpdate
}: ProfileManagerProps) {
  const [showBackgroundGallery, setShowBackgroundGallery] = useState(false);
  const [showProfileGallery, setShowProfileGallery] = useState(false);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [showMessageList, setShowMessageList] = useState(false);
  const [isRegeneratingPrompt, setIsRegeneratingPrompt] = useState<'background' | 'profile' | null>(null);
  const [isRecoveringImage, setIsRecoveringImage] = useState<{ background: boolean; profile: boolean }>({ background: false, profile: false });
  const [isGeneratingBasePrompt, setIsGeneratingBasePrompt] = useState<{ background: boolean; profile: boolean }>({ background: false, profile: false });
  const [editingBasePrompt, setEditingBasePrompt] = useState<{ type: 'background' | 'profile' | null; value: string }>({ type: null, value: '' });

  const handleGenerateBackground = async () => {
    try {
      setIsGeneratingBackground(true);
      const result = await onGenerateImage('background', profileData.background.prompt);
      if (result.imageUrls.length > 0) {
        onUpdate({
          ...profileData,
          background: {
            ...profileData.background,
            imageUrl: result.imageUrls[0],
            prompt: result.generatedPrompt || profileData.background.prompt // 생성된 프롬프트 저장
          }
        });
      }
    } catch (error: any) {
      alert(`배경 이미지 생성 실패: ${error.message}`);
    } finally {
      setIsGeneratingBackground(false);
    }
  };

  const handleGenerateProfile = async () => {
    try {
      setIsGeneratingProfile(true);
      const result = await onGenerateImage('profile', profileData.profile.prompt);
      if (result.imageUrls.length > 0) {
        onUpdate({
          ...profileData,
          profile: {
            ...profileData.profile,
            imageUrl: result.imageUrls[0],
            prompt: result.generatedPrompt || profileData.profile.prompt // 생성된 프롬프트 저장
          }
        });
      }
    } catch (error: any) {
      alert(`프로필 이미지 생성 실패: ${error.message}`);
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  // 이미지 자동 복구 함수 (갤러리에서 해당 날짜 이미지 찾기)
  const handleAutoRecoverImage = async (type: 'background' | 'profile') => {
    if (!selectedDate || !accountKey) {
      console.warn('날짜 또는 계정 정보가 없어 자동 복구를 수행할 수 없습니다.');
      return;
    }

    try {
      setIsRecoveringImage(prev => ({ ...prev, [type]: true }));

      // 갤러리에서 해당 날짜의 이미지 조회
      const response = await fetch(
        `/api/kakao-content/fetch-gallery-images-by-date?date=${selectedDate}&account=${accountKey}&type=${type}`
      );

      if (!response.ok) {
        throw new Error('갤러리 이미지 조회 실패');
      }

      const data = await response.json();
      
      if (data.success && data.images && data.images.length > 0) {
        // 첫 번째 이미지 사용 (가장 최근 생성된 이미지)
        const recoveredImageUrl = data.images[0].url;
        
        onUpdate({
          ...profileData,
          [type]: {
            ...profileData[type],
            imageUrl: recoveredImageUrl
          }
        });

        console.log(`✅ ${type} 이미지 자동 복구 완료:`, recoveredImageUrl);
        alert(`✅ ${type === 'background' ? '배경' : '프로필'} 이미지가 갤러리에서 자동으로 복구되었습니다.`);
      } else {
        console.warn(`⚠️ 갤러리에서 ${type} 이미지를 찾을 수 없습니다.`);
        alert(`⚠️ 갤러리에서 ${type === 'background' ? '배경' : '프로필'} 이미지를 찾을 수 없습니다.`);
      }
    } catch (error: any) {
      console.error(`❌ ${type} 이미지 자동 복구 실패:`, error);
      alert(`이미지 자동 복구 실패: ${error.message}`);
    } finally {
      setIsRecoveringImage(prev => ({ ...prev, [type]: false }));
    }
  };

  // 이미지 에러 핸들러
  const handleImageError = async (type: 'background' | 'profile', event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    console.warn(`⚠️ ${type} 이미지 로드 실패:`, img.src);
    
    // 자동 복구 시도
    await handleAutoRecoverImage(type);
  };

  // basePrompt 자동 생성
  const handleGenerateBasePrompt = async (type: 'background' | 'profile') => {
    try {
      setIsGeneratingBasePrompt({ ...isGeneratingBasePrompt, [type]: true });
      
      const weeklyTheme = calendarData?.profileContent?.[accountKey || 'account1']?.weeklyThemes?.week1 || 
                          '비거리의 감성 – 스윙과 마음의 연결';
      
      const response = await fetch('/api/kakao-content/generate-base-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate || new Date().toISOString().split('T')[0],
          accountType: accountKey || (account.tone === 'gold' ? 'account1' : 'account2'),
          type: type,
          weeklyTheme: weeklyTheme
        })
      });

      const data = await response.json();
      if (data.success && data.basePrompt) {
        setEditingBasePrompt({ type, value: data.basePrompt });
        
        // 부모 컴포넌트에 basePrompt 저장 요청
        if (onBasePromptUpdate) {
          onBasePromptUpdate(type, data.basePrompt);
        }
      } else {
        throw new Error(data.message || 'basePrompt 생성 실패');
      }
    } catch (error: any) {
      alert(`basePrompt 생성 실패: ${error.message}`);
    } finally {
      setIsGeneratingBasePrompt({ ...isGeneratingBasePrompt, [type]: false });
    }
  };

  // basePrompt 저장
  const handleSaveBasePrompt = async (type: 'background' | 'profile') => {
    if (!editingBasePrompt.value.trim()) {
      alert('basePrompt를 입력해주세요.');
      return;
    }

    // 부모 컴포넌트에 basePrompt 저장 요청
    if (onBasePromptUpdate) {
      onBasePromptUpdate(type, editingBasePrompt.value);
    }
    
    setEditingBasePrompt({ type: null, value: '' });
    alert('✅ basePrompt가 저장되었습니다.');
  };

  // 프롬프트 재생성 함수 (프롬프트 재생성 + 이미지 자동 재생성)
  const handleRegeneratePrompt = async (type: 'background' | 'profile') => {
    try {
      setIsRegeneratingPrompt(type);
      
      // calendarData에서 basePrompt 가져오기
      let basePrompt: string | undefined;
      if (calendarData && accountKey) {
        const targetDate = selectedDate || new Date().toISOString().split('T')[0];
        const accountData = calendarData.profileContent?.[accountKey];
        const schedule = accountData?.dailySchedule?.find((s: any) => s.date === targetDate);
        
        if (schedule) {
          basePrompt = type === 'background' 
            ? schedule.background?.basePrompt || schedule.background?.image
            : schedule.profile?.basePrompt || schedule.profile?.image;
        }
      }
      
      if (!basePrompt) {
        // basePrompt가 없으면 현재 프롬프트의 첫 부분 사용 (한글 설명 추출)
        basePrompt = type === 'background' 
          ? profileData.background.image
          : profileData.profile.image;
      }

      if (!basePrompt) {
        alert('기본 프롬프트를 찾을 수 없습니다.');
        return;
      }

      // 프롬프트 재생성 API 호출
      const promptResponse = await fetch('/api/kakao-content/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: basePrompt,
          accountType: accountKey || (account.tone === 'gold' ? 'account1' : 'account2'),
          type: type,
          brandStrategy: {
            customerpersona: account.tone === 'gold' ? 'senior_fitting' : 'tech_enthusiast',
            customerChannel: 'local_customers',
            brandWeight: account.tone === 'gold' ? '높음' : '중간',
            audienceTemperature: 'warm'
          },
          weeklyTheme: '비거리의 감성 – 스윙과 마음의 연결',
          date: new Date().toISOString().split('T')[0]
        })
      });

      const promptData = await promptResponse.json();
      if (!promptData.success) {
        throw new Error(promptData.message || '프롬프트 재생성 실패');
      }

      const newPrompt = promptData.prompt;

      // 새 프롬프트로 이미지 재생성
      const result = await onGenerateImage(type, newPrompt);
      if (result.imageUrls.length > 0) {
        onUpdate({
          ...profileData,
          [type]: {
            ...profileData[type],
            prompt: newPrompt, // 새 프롬프트 저장
            imageUrl: result.imageUrls[0] // 새 이미지 저장
          }
        });
        alert('✅ 프롬프트와 이미지가 재생성되었습니다.');
      }
    } catch (error: any) {
      alert(`프롬프트 재생성 실패: ${error.message}`);
    } finally {
      setIsRegeneratingPrompt(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 배경 이미지 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          배경 이미지
        </label>
        <div className="space-y-2">
          {/* Base Prompt 섹션 */}
          <div className="bg-gray-50 p-2 rounded text-xs">
            <div className="flex items-center justify-between mb-1">
              <strong className="text-gray-700">Base Prompt (요일별 템플릿):</strong>
              {editingBasePrompt.type === 'background' ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleSaveBasePrompt('background')}
                    className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs"
                  >
                    💾 저장
                  </button>
                  <button
                    onClick={() => setEditingBasePrompt({ type: null, value: '' })}
                    className="px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs"
                  >
                    ❌ 취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleGenerateBasePrompt('background')}
                  disabled={isGeneratingBasePrompt.background || isGenerating}
                  className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs disabled:opacity-50"
                >
                  {isGeneratingBasePrompt.background ? '🔄 생성 중...' : '🔄 자동 생성'}
                </button>
              )}
            </div>
            {editingBasePrompt.type === 'background' ? (
              <textarea
                value={editingBasePrompt.value}
                onChange={(e) => setEditingBasePrompt({ type: 'background', value: e.target.value })}
                className="w-full p-1 border rounded text-xs"
                rows={2}
                placeholder="basePrompt를 입력하세요..."
              />
            ) : (
              <div className="text-gray-500 italic">
                {calendarData && accountKey && selectedDate ? (
                  (() => {
                    const schedule = calendarData.profileContent?.[accountKey]?.dailySchedule?.find((s: any) => s.date === selectedDate);
                    return schedule?.background?.basePrompt || 'basePrompt 없음';
                  })()
                ) : (
                  'basePrompt 없음'
                )}
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            <strong>설명:</strong> {profileData.background.image}
          </div>
          <div className="text-xs text-gray-500 flex items-start justify-between gap-2">
            <div className="flex-1 break-words">
              <strong>프롬프트:</strong> {profileData.background.prompt}
            </div>
            <button
              onClick={() => handleRegeneratePrompt('background')}
              disabled={isRegeneratingPrompt === 'background' || isGenerating}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="프롬프트 재생성 (새로운 로직 적용) + 이미지 자동 재생성"
            >
              {isRegeneratingPrompt === 'background' ? '🔄 재생성 중...' : '🔄 재생성'}
            </button>
          </div>
          
          {profileData.background.imageUrl && (
            <div className="mt-2 relative">
              <img 
                src={profileData.background.imageUrl} 
                alt="배경 이미지"
                className="w-full aspect-square object-cover rounded border border-gray-200"
                style={{ maxWidth: '400px' }}
                onError={handleImageError.bind(null, 'background')}
              />
              {isRecoveringImage.background && (
                <div className="absolute inset-0 bg-blue-100 bg-opacity-75 flex items-center justify-center rounded">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <div className="text-sm text-blue-700">갤러리에서 이미지 복구 중...</div>
                  </div>
                </div>
              )}
              <button
                onClick={() => onUpdate({
                  ...profileData,
                  background: {
                    ...profileData.background,
                    imageUrl: undefined
                  }
                })}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                title="이미지 삭제"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowBackgroundGallery(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              <Image className="w-4 h-4" />
              갤러리에서 선택
            </button>
            <button
              onClick={handleGenerateBackground}
              disabled={isGeneratingBackground || isGenerating}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm disabled:opacity-50"
            >
              {isGeneratingBackground ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  {profileData.background.imageUrl ? '이미지 재생성' : (account.tone === 'gold' ? '골드톤 이미지 생성' : '블랙톤 이미지 생성')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 프로필 이미지 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          프로필 이미지
        </label>
        <div className="space-y-2">
          {/* Base Prompt 섹션 */}
          <div className="bg-gray-50 p-2 rounded text-xs">
            <div className="flex items-center justify-between mb-1">
              <strong className="text-gray-700">Base Prompt (요일별 템플릿):</strong>
              {editingBasePrompt.type === 'profile' ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleSaveBasePrompt('profile')}
                    className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs"
                  >
                    💾 저장
                  </button>
                  <button
                    onClick={() => setEditingBasePrompt({ type: null, value: '' })}
                    className="px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs"
                  >
                    ❌ 취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleGenerateBasePrompt('profile')}
                  disabled={isGeneratingBasePrompt.profile || isGenerating}
                  className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs disabled:opacity-50"
                >
                  {isGeneratingBasePrompt.profile ? '🔄 생성 중...' : '🔄 자동 생성'}
                </button>
              )}
            </div>
            {editingBasePrompt.type === 'profile' ? (
              <textarea
                value={editingBasePrompt.value}
                onChange={(e) => setEditingBasePrompt({ type: 'profile', value: e.target.value })}
                className="w-full p-1 border rounded text-xs"
                rows={2}
                placeholder="basePrompt를 입력하세요..."
              />
            ) : (
              <div className="text-gray-500 italic">
                {calendarData && accountKey && selectedDate ? (
                  (() => {
                    const schedule = calendarData.profileContent?.[accountKey]?.dailySchedule?.find((s: any) => s.date === selectedDate);
                    return schedule?.profile?.basePrompt || 'basePrompt 없음';
                  })()
                ) : (
                  'basePrompt 없음'
                )}
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            <strong>설명:</strong> {profileData.profile.image}
          </div>
          <div className="text-xs text-gray-500 flex items-start justify-between gap-2">
            <div className="flex-1 break-words">
              <strong>프롬프트:</strong> {profileData.profile.prompt}
            </div>
            <button
              onClick={() => handleRegeneratePrompt('profile')}
              disabled={isRegeneratingPrompt === 'profile' || isGenerating}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="프롬프트 재생성 (새로운 로직 적용) + 이미지 자동 재생성"
            >
              {isRegeneratingPrompt === 'profile' ? '🔄 재생성 중...' : '🔄 재생성'}
            </button>
          </div>
          
          {profileData.profile.imageUrl && (
            <div className="mt-2 relative inline-block">
              <img 
                src={profileData.profile.imageUrl} 
                alt="프로필 이미지"
                className="w-24 h-24 object-cover rounded-full"
                onError={handleImageError.bind(null, 'profile')}
              />
              {isRecoveringImage.profile && (
                <div className="absolute inset-0 bg-blue-100 bg-opacity-75 flex items-center justify-center rounded-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-1"></div>
                    <div className="text-xs text-blue-700">복구 중...</div>
                  </div>
                </div>
              )}
              <button
                onClick={() => onUpdate({
                  ...profileData,
                  profile: {
                    ...profileData.profile,
                    imageUrl: undefined
                  }
                })}
                className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                title="이미지 삭제"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowProfileGallery(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              <Image className="w-4 h-4" />
              갤러리에서 선택
            </button>
            <button
              onClick={handleGenerateProfile}
              disabled={isGeneratingProfile || isGenerating}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm disabled:opacity-50"
            >
              {isGeneratingProfile ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  {profileData.profile.imageUrl ? '이미지 재생성' : (account.tone === 'gold' ? '골드톤 이미지 생성' : '블랙톤 이미지 생성')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 메시지 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            프로필 메시지
          </label>
          {accountKey && calendarData && (
            <button
              onClick={() => setShowMessageList(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
              title="저장된 메시지 목록에서 선택"
            >
              <List className="w-3 h-3" />
              목록에서 선택
            </button>
          )}
        </div>
        <textarea
          value={profileData.message}
          onChange={(e) => onUpdate({ ...profileData, message: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="짧고 명확한 헤드라인 + 한 문장 철학형"
        />
        <div className="text-xs text-gray-500 mt-1">
          {profileData.message.length}자
        </div>
      </div>

      {/* 갤러리 모달 */}
      <GalleryPicker
        isOpen={showBackgroundGallery}
        onSelect={(imageUrl) => {
          onUpdate({
            ...profileData,
            background: {
              ...profileData.background,
              imageUrl
            }
          });
          setShowBackgroundGallery(false);
        }}
        onClose={() => setShowBackgroundGallery(false)}
        autoFilterFolder={
          selectedDate && accountKey
            ? `originals/daily-branding/kakao/${selectedDate}/${accountKey}/background`
            : undefined
        }
        showCompareMode={true}
        maxCompareCount={3}
      />

      <GalleryPicker
        isOpen={showProfileGallery}
        onSelect={(imageUrl) => {
          onUpdate({
            ...profileData,
            profile: {
              ...profileData.profile,
              imageUrl
            }
          });
          setShowProfileGallery(false);
        }}
        onClose={() => setShowProfileGallery(false)}
        autoFilterFolder={
          selectedDate && accountKey
            ? `originals/daily-branding/kakao/${selectedDate}/${accountKey}/profile`
            : undefined
        }
        showCompareMode={true}
        maxCompareCount={3}
      />

      {/* 메시지 목록 모달 */}
      {accountKey && calendarData && (
        <ProfileMessageList
          isOpen={showMessageList}
          onClose={() => setShowMessageList(false)}
          onSelect={(message) => {
            onUpdate({ ...profileData, message });
          }}
          account={accountKey}
          calendarData={calendarData}
          currentMessage={profileData.message}
        />
      )}
    </div>
  );
}

