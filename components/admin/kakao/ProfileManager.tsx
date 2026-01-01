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
    imageCount?: number; // ✅ 이미지 개수 추가
  };
  profile: {
    image: string;
    prompt: string;
    imageUrl?: string;
    imageCount?: number; // ✅ 이미지 개수 추가
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
  const [isRegeneratingWithTextOption, setIsRegeneratingWithTextOption] = useState<{ background: string | null; profile: string | null }>({ background: null, profile: null });

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
    console.info(`ℹ️ ${type} 이미지 로드 실패, 자동 복구 시도 중:`, img.src);
    
    // 이미지 URL을 즉시 undefined로 설정하여 표시 제거 (캐시된 이미지 방지)
    if (type === 'background') {
      onUpdate({
        ...profileData,
        background: {
          ...profileData.background,
          imageUrl: undefined
        }
      });
    } else {
      onUpdate({
        ...profileData,
        profile: {
          ...profileData.profile,
          imageUrl: undefined
        }
      });
    }
    
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

  // 로고 옵션으로 이미지 재생성 함수
  const handleRegenerateWithLogoOption = async (type: 'background' | 'profile', logoOption: 'logo' | 'full-brand' | 'none') => {
    try {
      setIsRegeneratingWithTextOption(prev => ({ ...prev, [type]: logoOption }));
      
      let modifiedPrompt = type === 'background' 
        ? profileData.background.prompt 
        : profileData.profile.prompt;
      
      // 기존 브랜딩 관련 지시사항 제거
      modifiedPrompt = modifiedPrompt.replace(/\.?\s*(CRITICAL.*?MASSGOO|brandSpec|logo|branding|embroidery|ABSOLUTELY NO.*?MASSGOO)[^.]*\.?/gi, '');
      
      // account type에 맞는 나이/인물 지시사항
      const accountType = accountKey || (account.tone === 'gold' ? 'account1' : 'account2');
      const ageSpec = accountType === 'account1' 
        ? 'Korean senior golfer (50-70 years old, Korean ethnicity, Asian facial features, silver/gray hair)'
        : 'Korean young golfer (30-50 years old, Korean ethnicity, Asian facial features)';
      
      // 로고 옵션에 따른 브랜딩 지시사항
      let brandSpec = '';
      if (logoOption === 'logo') {
        // L: 인물의 옷, 모자, 건물, 매장, 조형물에 MASSGOO 로고
        brandSpec = 'CRITICAL: If the golfer is wearing a cap, hat, or any headwear, the cap MUST have "MASSGOO" logo or embroidery clearly visible and readable. If the golfer is wearing clothing (polo shirt, jacket, etc.), the clothing MUST have "MASSGOO" logo or branding clearly visible. If the scene includes buildings, stores, or structures, include "MASSGOO" store sign, logo, or branding visible on storefronts, interior walls, displays, or architectural elements. If the scene includes sculptures or decorative elements, include "MASSGOO" branding naturally integrated. The brand name "MASSGOO" must be naturally integrated into the cap/hat fabric as embroidery or printed logo, on clothing as a logo patch or embroidered text, and on buildings/structures as realistic store signs or architectural elements. Use "MASSGOO" (not "MASGOO") as the official brand name.';
      } else if (logoOption === 'full-brand') {
        // BL: 전체 MASSGOO (로고 + 브랜딩 요소 전체)
        brandSpec = 'CRITICAL: Prominently feature "MASSGOO" branding throughout the entire image. Include "MASSGOO" logo or embroidery on golfer\'s cap, hat, or headwear clearly visible and readable. Include "MASSGOO" logo or branding on golfer\'s clothing (polo shirt, jacket, etc.) clearly visible. If the scene includes buildings, stores, or structures, prominently display "MASSGOO" store signs, logos, or branding on storefronts, interior walls, displays, or architectural elements. If the scene includes sculptures, decorative elements, or background elements, integrate "MASSGOO" branding naturally throughout. The brand name "MASSGOO" should be visible in multiple locations naturally integrated into the scene. Use "MASSGOO" (not "MASGOO") as the official brand name.';
      } else {
        // X: 아무것도 안 넣음
        brandSpec = 'ABSOLUTELY NO "MASSGOO" branding, logo, text, or any brand elements whatsoever in the image. No logos on caps, hats, clothing, buildings, stores, structures, or any elements. The image must be completely brand-free.';
      }
      
      // 배경/프로필 이미지 모두: 나이 스펙 + 브랜딩 옵션
      modifiedPrompt = `${modifiedPrompt}. ${ageSpec}. ${brandSpec}`;
      
      // 프롬프트 재생성 없이 직접 이미지 생성 API 호출
      const account = accountKey || (account.tone === 'gold' ? 'account1' : 'account2');
      
      const response = await fetch('/api/kakao-content/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompts: [{ prompt: modifiedPrompt, paragraph: '' }],
          imageCount: 1,
          logoOption: logoOption, // 로고 옵션 전달
          metadata: {
            account: account,
            type: type,
            date: selectedDate || new Date().toISOString().split('T')[0],
            message: type === 'background' 
              ? profileData.background.image 
              : profileData.profile.image
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const imageUrls = data.imageUrls || [];
      
      if (imageUrls.length > 0) {
        onUpdate({
          ...profileData,
          [type]: {
            ...profileData[type],
            prompt: modifiedPrompt,
            imageUrl: imageUrls[0]
          }
        });
        alert(`✅ ${logoOption === 'logo' ? '로고 추가' : logoOption === 'full-brand' ? '전체 브랜딩' : '브랜딩 없음'} 옵션으로 이미지가 재생성되었습니다.`);
      }
    } catch (error: any) {
      alert(`이미지 재생성 실패: ${error.message}`);
    } finally {
      setIsRegeneratingWithTextOption(prev => ({ ...prev, [type]: null }));
    }
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
              {profileData.background.imageCount !== undefined && profileData.background.imageCount > 1 && (
                <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  이미지 {profileData.background.imageCount}개 중 1번째
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
          
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setShowBackgroundGallery(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              <Image className="w-4 h-4" />
              갤러리에서 선택
            </button>
            <div className="flex items-center gap-1">
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
              {profileData.background.imageUrl && (
                <>
                  <button
                    onClick={() => handleRegenerateWithLogoOption('background', 'logo')}
                    disabled={isRegeneratingWithTextOption.background !== null || isGeneratingBackground || isGenerating}
                    className="w-6 h-6 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50 flex items-center justify-center"
                    title="인물 옷/모자/건물/매장/조형물에 MASSGOO 로고 추가"
                  >로고</button>
                  <button
                    onClick={() => handleRegenerateWithLogoOption('background', 'full-brand')}
                    disabled={isRegeneratingWithTextOption.background !== null || isGeneratingBackground || isGenerating}
                    className="w-6 h-6 text-xs font-bold bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50 flex items-center justify-center"
                    title="전체 MASSGOO 브랜딩 추가"
                  >전체</button>
                  <button
                    onClick={() => handleRegenerateWithLogoOption('background', 'none')}
                    disabled={isRegeneratingWithTextOption.background !== null || isGeneratingBackground || isGenerating}
                    className="w-6 h-6 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50 flex items-center justify-center"
                    title="브랜딩 없음"
                  >없음</button>
                </>
              )}
            </div>
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
              {profileData.profile.imageCount !== undefined && profileData.profile.imageCount > 1 && (
                <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                  {profileData.profile.imageCount}개
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
          
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setShowProfileGallery(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              <Image className="w-4 h-4" />
              갤러리에서 선택
            </button>
            <div className="flex items-center gap-1">
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
              {profileData.profile.imageUrl && (
                <>
                  <button
                    onClick={() => handleRegenerateWithLogoOption('profile', 'logo')}
                    disabled={isRegeneratingWithTextOption.profile !== null || isGeneratingProfile || isGenerating}
                    className="w-6 h-6 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50 flex items-center justify-center"
                    title="인물 옷/모자/건물/매장/조형물에 MASSGOO 로고 추가"
                  >로고</button>
                  <button
                    onClick={() => handleRegenerateWithLogoOption('profile', 'full-brand')}
                    disabled={isRegeneratingWithTextOption.profile !== null || isGeneratingProfile || isGenerating}
                    className="w-6 h-6 text-xs font-bold bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50 flex items-center justify-center"
                    title="전체 MASSGOO 브랜딩 추가"
                  >전체</button>
                  <button
                    onClick={() => handleRegenerateWithLogoOption('profile', 'none')}
                    disabled={isRegeneratingWithTextOption.profile !== null || isGeneratingProfile || isGenerating}
                    className="w-6 h-6 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50 flex items-center justify-center"
                    title="브랜딩 없음"
                  >없음</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 메시지 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700" htmlFor={`profile-message-${accountKey || 'default'}`}>
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
          id={`profile-message-${accountKey || 'default'}`}
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
          // 프롬프트가 없으면 기본값 설정
          const currentPrompt = profileData.background.prompt || profileData.background.image || '';
          
          onUpdate({
            ...profileData,
            background: {
              ...profileData.background,
              imageUrl,
              // 프롬프트가 비어있으면 경고용 메시지 설정 (하지만 업데이트는 진행)
              prompt: currentPrompt || '프롬프트를 입력해주세요'
            }
          });
          setShowBackgroundGallery(false);
          
          // 프롬프트가 없으면 경고 메시지 (비동기로 표시하여 모달이 닫힌 후 표시)
          if (!currentPrompt) {
            setTimeout(() => {
              alert('⚠️ 프롬프트가 없습니다.\n\n나중에 AI 이미지 재생성을 하려면 프롬프트를 입력해주세요.');
            }, 300);
          }
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
          // 프롬프트가 없으면 기본값 설정
          const currentPrompt = profileData.profile.prompt || profileData.profile.image || '';
          
          onUpdate({
            ...profileData,
            profile: {
              ...profileData.profile,
              imageUrl,
              // 프롬프트가 비어있으면 경고용 메시지 설정 (하지만 업데이트는 진행)
              prompt: currentPrompt || '프롬프트를 입력해주세요'
            }
          });
          setShowProfileGallery(false);
          
          // 프롬프트가 없으면 경고 메시지 (비동기로 표시하여 모달이 닫힌 후 표시)
          if (!currentPrompt) {
            setTimeout(() => {
              alert('⚠️ 프롬프트가 없습니다.\n\n나중에 AI 이미지 재생성을 하려면 프롬프트를 입력해주세요.');
            }, 300);
          }
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

