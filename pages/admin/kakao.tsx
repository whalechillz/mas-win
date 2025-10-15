import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const BaseChannelEditor = dynamic(() => import('@/components/shared/BaseChannelEditor'), { ssr: false });

export default function KakaoChannelEditor() {
  const router = useRouter();
  const { calendarId } = router.query;
  const [formData, setFormData] = useState({
    title: '',
    messageText: '',
    messageType: 'ALIMTALK',
    characterCount: 0,
    emoji: '',
    tags: []
  });

  // 카카오 채널 특화 컴포넌트
  const KakaoSpecificComponents = () => (
    <div className="space-y-6">
      {/* 메시지 타입 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          메시지 타입
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="ALIMTALK"
              checked={formData.messageType === 'ALIMTALK'}
              onChange={(e) => setFormData(prev => ({ ...prev, messageType: e.target.value }))}
              className="mr-2"
            />
            알림톡
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="FRIENDTALK"
              checked={formData.messageType === 'FRIENDTALK'}
              onChange={(e) => setFormData(prev => ({ ...prev, messageType: e.target.value }))}
              className="mr-2"
            />
            친구톡
          </label>
        </div>
      </div>

      {/* 이모지 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          이모지
        </label>
        <div className="flex gap-2 flex-wrap">
          {['📢', '💡', '🎯', '✨', '🔥', '📝', '🎉', '🚀', '💎', '⭐'].map(emoji => (
            <button
              key={emoji}
              onClick={() => setFormData(prev => ({ ...prev, emoji }))}
              className={`w-10 h-10 text-xl rounded-lg border-2 ${
                formData.emoji === emoji 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* 태그 입력 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          태그
        </label>
        <input
          type="text"
          value={formData.tags.join(', ')}
          onChange={(e) => {
            const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
            setFormData(prev => ({ ...prev, tags }));
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="태그를 쉼표로 구분하여 입력하세요"
        />
      </div>

      {/* 카카오톡 미리보기 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          카카오톡 미리보기
        </label>
        <div className="bg-yellow-100 p-4 rounded-lg max-w-sm">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">K</span>
              </div>
              <span className="text-sm font-medium">카카오 채널</span>
            </div>
            <div className="text-sm">
              {formData.emoji && <span className="mr-1">{formData.emoji}</span>}
              {formData.title && <span className="font-medium">{formData.title}</span>}
              {formData.messageText && (
                <div className="mt-1 text-gray-700">
                  {formData.messageText}
                </div>
              )}
              {formData.tags.length > 0 && (
                <div className="mt-2 text-blue-600">
                  #{formData.tags.join(' #')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <BaseChannelEditor
        channelType="kakao"
        channelName="카카오 채널"
        calendarId={calendarId as string}
        initialData={formData}
        onSave={(data) => {
          console.log('Kakao channel saved:', data);
          // 성공 메시지 표시
        }}
        onSend={(data) => {
          console.log('Kakao channel sent:', data);
          // 성공 메시지 표시
        }}
      >
        <KakaoSpecificComponents />
      </BaseChannelEditor>
    </div>
  );
}
