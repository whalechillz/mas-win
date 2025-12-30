import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import AdminNav from '@/components/admin/AdminNav';
import { KakaoRecipientSelector } from '@/components/admin/KakaoRecipientSelector';

const BaseChannelEditor = dynamic(() => import('@/components/shared/BaseChannelEditor'), { ssr: false });

export default function KakaoChannelEditor() {
  const router = useRouter();
  const { calendarId, id } = router.query;
  const [formData, setFormData] = useState({
    title: '',
    messageText: '',
    messageType: 'ALIMTALK',
    characterCount: 0,
    emoji: '',
    tags: []
  });
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [recipientStats, setRecipientStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 기존 메시지 로드
  useEffect(() => {
    if (id) {
      loadExistingMessage(id as string);
    }
  }, [id]);

  const loadExistingMessage = async (messageId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/kakao?id=${messageId}`);
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        const message = data.data[0];
        setFormData({
          title: message.title || '',
          messageText: message.content || '',
          messageType: message.message_type || 'FRIENDTALK',
          characterCount: (message.content || '').length,
          emoji: message.emoji || '',
          tags: message.tags || []
        });
        setSelectedRecipients(message.recipient_uuids || []);
      }
    } catch (error) {
      console.error('메시지 로드 오류:', error);
      alert('메시지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

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

      {/* 수신자 선택 및 필터링 */}
      <div className="mt-6">
        <KakaoRecipientSelector
          onRecipientsChange={(recipients, stats) => {
            setSelectedRecipients(recipients);
            setRecipientStats(stats);
          }}
          smsMessageIds={[232, 273, 227, 231]}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">메시지를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {id && (
            <div className="mb-4">
              <a
                href="/admin/kakao-list"
                className="text-blue-600 hover:text-blue-900 text-sm"
              >
                ← 목록으로 돌아가기
              </a>
            </div>
          )}
        </div>
        <BaseChannelEditor
          channelType="kakao"
          channelName="카카오 채널"
          calendarId={calendarId as string}
          initialData={{
            title: formData.title,
            content: formData.messageText,
            messageType: formData.messageType,
            emoji: formData.emoji,
            tags: formData.tags,
            buttonLink: undefined, // API에서 로드
            buttonText: undefined // API에서 로드
          }}
          onSave={(data) => {
            console.log('Kakao channel saved:', data);
            alert('저장되었습니다.');
            if (id) {
              router.push('/admin/kakao-list');
            }
          }}
          onSend={(data) => {
            console.log('Kakao channel sent:', data);
            alert('발송되었습니다.');
            router.push('/admin/kakao-list');
          }}
        >
          <KakaoSpecificComponents />
        </BaseChannelEditor>
      </div>
    </div>
  );
}
