'use client';

import React, { useState } from 'react';
import { Image, Upload, Sparkles, X, RotateCcw } from 'lucide-react';
import GalleryPicker from '../GalleryPicker';

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
}

export default function ProfileManager({
  account,
  profileData,
  onUpdate,
  onGenerateImage,
  isGenerating = false
}: ProfileManagerProps) {
  const [showBackgroundGallery, setShowBackgroundGallery] = useState(false);
  const [showProfileGallery, setShowProfileGallery] = useState(false);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);

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

  return (
    <div className="space-y-4">
      {/* 배경 이미지 */}
      <div className="border rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          배경 이미지
        </label>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            <strong>설명:</strong> {profileData.background.image}
          </div>
          <div className="text-xs text-gray-500">
            <strong>프롬프트:</strong> {profileData.background.prompt}
          </div>
          
          {profileData.background.imageUrl && (
            <div className="mt-2 relative">
              <img 
                src={profileData.background.imageUrl} 
                alt="배경 이미지"
                className="w-full aspect-video object-cover rounded"
              />
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
      <div className="border rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          프로필 이미지
        </label>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            <strong>설명:</strong> {profileData.profile.image}
          </div>
          <div className="text-xs text-gray-500">
            <strong>프롬프트:</strong> {profileData.profile.prompt}
          </div>
          
          {profileData.profile.imageUrl && (
            <div className="mt-2 relative inline-block">
              <img 
                src={profileData.profile.imageUrl} 
                alt="프로필 이미지"
                className="w-24 h-24 object-cover rounded-full"
              />
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
      <div className="border rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          프로필 메시지
        </label>
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
      {showBackgroundGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">배경 이미지 선택</h3>
              <button
                onClick={() => setShowBackgroundGallery(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
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
            />
          </div>
        </div>
      )}

      {showProfileGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">프로필 이미지 선택</h3>
              <button
                onClick={() => setShowProfileGallery(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
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
            />
          </div>
        </div>
      )}
    </div>
  );
}

