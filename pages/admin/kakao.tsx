import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import AdminNav from '@/components/admin/AdminNav';
import { KakaoFriendSyncStatus } from '@/components/admin/KakaoFriendSyncStatus';

const BaseChannelEditor = dynamic(() => import('@/components/shared/BaseChannelEditor'), { ssr: false });

export default function KakaoChannelEditor() {
  const router = useRouter();
  const { calendarId, id } = router.query;
  const [formData, setFormData] = useState({
    title: '',
    messageText: '',
    messageType: 'ALIMTALK',
    templateType: 'BASIC_TEXT', // 기본 텍스트형
    characterCount: 0,
    emoji: '',
    buttonText: '', // 빈 값으로 시작, 사용자가 입력
    buttonLink: '' // 빈 값으로 시작, 사용자가 입력
  });
  const [baseEditorFormData, setBaseEditorFormData] = useState<any>(null); // BaseChannelEditor의 formData
  const [loading, setLoading] = useState(false);

  // 기존 메시지 로드
  useEffect(() => {
    if (id) {
      loadExistingMessage(id as string);
    }
  }, [id]);

  const [channelPostId, setChannelPostId] = useState<number | null>(null);

  const loadExistingMessage = async (messageId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/kakao?id=${messageId}`);
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        const message = data.data[0];
        setChannelPostId(message.id); // channelPostId 저장
        setFormData({
          title: message.title || '',
          messageText: message.content || '',
          messageType: message.message_type || 'FRIENDTALK',
          templateType: message.template_type || 'BASIC_TEXT',
          characterCount: (message.content || '').length,
          emoji: message.emoji || '',
          buttonText: message.button_text || '',
          buttonLink: message.button_link || ''
        });
      }
    } catch (error) {
      console.error('메시지 로드 오류:', error);
      alert('메시지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const [selectedFriendGroupId, setSelectedFriendGroupId] = useState<number | null>(null);
  const [friendGroups, setFriendGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // 친구 그룹 목록 조회
  useEffect(() => {
    const fetchFriendGroups = async () => {
      setLoadingGroups(true);
      try {
        const response = await fetch('/api/kakao/recipient-groups');
        const data = await response.json();
        if (data.success) {
          setFriendGroups(data.data || []);
        }
      } catch (error) {
        console.error('친구 그룹 조회 오류:', error);
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchFriendGroups();
  }, []);

  // 카카오 채널 특화 컴포넌트
  const KakaoSpecificComponents = () => (
    <div className="space-y-6">
      {/* 카카오 친구 목록 동기화 상태 */}
      <div className="space-y-2">
        <KakaoFriendSyncStatus />
        <div className="flex justify-end">
          <button
            onClick={() => router.push('/admin/kakao-friend-groups')}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            👥 친구 그룹 관리 →
          </button>
        </div>
      </div>

      {/* 메시지 타겟 설정 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          메시지 타겟 설정
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="targetType"
              value="all"
              checked={selectedFriendGroupId === null}
              onChange={() => setSelectedFriendGroupId(null)}
              className="mr-2"
            />
            <span className="text-sm">타겟 설정 안함 (전체 친구 대상 발송)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="targetType"
              value="group"
              checked={selectedFriendGroupId !== null}
              onChange={() => {
                if (friendGroups.length > 0 && selectedFriendGroupId === null) {
                  setSelectedFriendGroupId(friendGroups[0].id);
                }
              }}
              className="mr-2"
            />
            <span className="text-sm">친구그룹 타게팅</span>
          </label>
          
          {selectedFriendGroupId !== null && (
            <div className="ml-6 mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                지정할 친구그룹
              </label>
              <select
                value={selectedFriendGroupId || ''}
                onChange={(e) => setSelectedFriendGroupId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingGroups}
              >
                <option value="">그룹 선택</option>
                {friendGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.recipient_count}명)
                  </option>
                ))}
              </select>
              {selectedFriendGroupId && (
                <p className="mt-2 text-sm text-gray-600">
                  총 예상 발송 대상: {
                    friendGroups.find(g => g.id === selectedFriendGroupId)?.recipient_count || 0
                  }명
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 메시지 템플릿 타입 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          메시지 템플릿 타입
        </label>
        <select
          value={formData.templateType}
          onChange={(e) => setFormData(prev => ({ ...prev, templateType: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="BASIC_TEXT">기본 텍스트형 (제목 없음)</option>
          <option value="WIDE_IMAGE">와이드 이미지형 (제목 있음)</option>
          <option value="WIDE_LIST">와이드 리스트형 (제목 있음)</option>
          <option value="CAROUSEL_FEED">캐러셀 피드형 (제목 있음)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {formData.templateType === 'BASIC_TEXT' 
            ? '기본 텍스트형은 제목 없이 내용만 작성합니다.' 
            : '제목과 내용을 모두 작성합니다.'}
        </p>
      </div>

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

      {/* 카카오톡 버튼 설정 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          카카오톡 버튼 설정
        </label>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">버튼명</label>
            <input
              type="text"
              value={formData.buttonText || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 설문 참여하기, 자세히 보기, 바로가기"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">버튼 링크</label>
            <input
              type="url"
              value={formData.buttonLink || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, buttonLink: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://www.masgolf.co.kr/survey"
            />
          </div>
        </div>
      </div>

      {/* 카카오톡 미리보기 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          카카오톡 미리보기
          {formData.templateType === 'BASIC_TEXT' && (
            <span className="text-xs text-gray-500 ml-2">(기본 텍스트형)</span>
          )}
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
              {/* 기본 텍스트형이 아닐 때만 제목 표시 */}
              {formData.templateType !== 'BASIC_TEXT' && (baseEditorFormData?.title || formData.title) && (
                <span className="font-medium">{baseEditorFormData?.title || formData.title}</span>
              )}
              {/* BaseChannelEditor의 content를 우선 사용, 없으면 formData.messageText 사용 */}
              {(baseEditorFormData?.content || formData.messageText) && (
                <div className={`text-gray-700 ${formData.templateType === 'BASIC_TEXT' ? 'mt-0' : 'mt-1'}`}>
                  {baseEditorFormData?.content || formData.messageText}
                </div>
              )}
              {formData.buttonText && formData.buttonLink && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <a
                    href={formData.buttonLink}
                    className="inline-block px-4 py-2 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600"
                  >
                    {formData.buttonText}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
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
          templateType={formData.templateType}
          initialData={{
            channelPostId: channelPostId || undefined, // 기존 메시지 ID 전달
            title: formData.title,
            content: formData.messageText,
            messageType: formData.messageType,
            templateType: formData.templateType,
            emoji: formData.emoji,
            buttonLink: formData.buttonLink,
            buttonText: formData.buttonText,
            friendGroupId: selectedFriendGroupId || undefined // 친구 그룹 ID 전달
          }}
          key={`${formData.title}-${formData.messageText}-${formData.buttonText}-${formData.buttonLink}`}
          onFormDataChange={(newFormData) => {
            // BaseChannelEditor의 formData 변경 시 동기화
            setBaseEditorFormData(newFormData);
            // formData도 업데이트 (버튼 설정 등)
            if (newFormData.buttonText) {
              setFormData(prev => ({ ...prev, buttonText: newFormData.buttonText }));
            }
            if (newFormData.buttonLink) {
              setFormData(prev => ({ ...prev, buttonLink: newFormData.buttonLink }));
            }
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
