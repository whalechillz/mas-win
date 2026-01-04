import React, { useState, useEffect } from 'react';

interface KakaoSendOptionProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  messageType: 'FRIENDTALK' | 'ALIMTALK';
  onMessageTypeChange: (type: 'FRIENDTALK' | 'ALIMTALK') => void;
  fallbackToSms: boolean;
  onFallbackToSmsChange: (fallback: boolean) => void;
  recipientGroupId: number | null;
  onRecipientGroupChange: (groupId: number | null) => void;
  templateId?: string;
  onTemplateIdChange?: (templateId: string) => void;
}

export const KakaoSendOption: React.FC<KakaoSendOptionProps> = ({
  enabled,
  onEnabledChange,
  messageType,
  onMessageTypeChange,
  fallbackToSms,
  onFallbackToSmsChange,
  recipientGroupId,
  onRecipientGroupChange,
  templateId,
  onTemplateIdChange
}) => {
  const [recipientGroups, setRecipientGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // 수신자 그룹 목록 로드
  useEffect(() => {
    if (enabled) {
      loadRecipientGroups();
    }
  }, [enabled]);

  const loadRecipientGroups = async () => {
    setLoadingGroups(true);
    try {
      const response = await fetch('/api/kakao/recipient-groups');
      const data = await response.json();
      if (data.success) {
        setRecipientGroups(data.data || []);
      }
    } catch (error) {
      console.error('수신자 그룹 로드 오류:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  if (!enabled) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={false}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="mr-2 w-4 h-4 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">
            카카오톡 대행 발송 사용
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          친구 추가된 번호는 카카오톡으로, 그 외는 SMS로 발송됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="mr-2 w-4 h-4 text-blue-600"
          />
          <span className="text-sm font-medium text-blue-900">
            💬 카카오톡 대행 발송
          </span>
        </label>
      </div>

      {enabled && (
        <div className="ml-6 space-y-4">
          {/* 발송 방식 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              발송 방식
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="FRIENDTALK"
                  checked={messageType === 'FRIENDTALK'}
                  onChange={(e) => onMessageTypeChange(e.target.value as 'FRIENDTALK')}
                  className="mr-2"
                />
                <span className="text-sm">친구톡 (카카오 API)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="ALIMTALK"
                  checked={messageType === 'ALIMTALK'}
                  onChange={(e) => onMessageTypeChange(e.target.value as 'ALIMTALK')}
                  className="mr-2"
                />
                <span className="text-sm">알림톡 (Solapi)</span>
              </label>
            </div>
          </div>

          {/* 알림톡 템플릿 ID (알림톡 선택 시) */}
          {messageType === 'ALIMTALK' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                템플릿 ID
              </label>
              <input
                type="text"
                value={templateId || ''}
                onChange={(e) => onTemplateIdChange?.(e.target.value)}
                placeholder="Solapi에서 발급받은 템플릿 코드"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                알림톡 발송을 위해 템플릿 ID가 필요합니다.
              </p>
            </div>
          )}

          {/* 친구 추가 안 된 번호 처리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              친구 추가 안 된 번호 처리
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={fallbackToSms}
                  onChange={() => onFallbackToSmsChange(true)}
                  className="mr-2"
                />
                <span className="text-sm">SMS로 대체 발송</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!fallbackToSms}
                  onChange={() => onFallbackToSmsChange(false)}
                  className="mr-2"
                />
                <span className="text-sm">발송 건너뛰기</span>
              </label>
            </div>
          </div>

          {/* 수신자 그룹 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              수신자 그룹 선택 (선택사항)
            </label>
            <div className="flex gap-2">
              <select
                value={recipientGroupId || ''}
                onChange={(e) => onRecipientGroupChange(e.target.value ? parseInt(e.target.value) : null)}
                disabled={loadingGroups}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">그룹 선택 안 함 (개별 번호 사용)</option>
                {recipientGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.recipient_count}명)
                  </option>
                ))}
              </select>
              <button
                onClick={() => window.open('/admin/kakao-list', '_blank')}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                title="카카오 메시지 페이지에서 그룹 관리"
              >
                그룹 관리
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              그룹을 선택하면 개별 번호 입력이 무시되고 그룹의 수신자에게 발송됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};




