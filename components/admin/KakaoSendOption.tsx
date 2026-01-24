import React, { useState, useEffect } from 'react';

interface Template {
  templateId: string;
  name: string;
  content: string;
  status: string;
  channelId?: string;
  variables: string[];
  createdAt?: string;
  updatedAt?: string;
}

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
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // 수신자 그룹 목록 로드
  useEffect(() => {
    if (enabled) {
      loadRecipientGroups();
    }
  }, [enabled]);

  // 템플릿 목록 로드 (알림톡 선택 시)
  useEffect(() => {
    if (enabled && messageType === 'ALIMTALK') {
      loadTemplates();
    }
  }, [enabled, messageType]);

  // 선택된 템플릿 ID에 맞는 템플릿 찾기
  useEffect(() => {
    if (templateId && templates.length > 0) {
      const found = templates.find(t => t.templateId === templateId);
      if (found) {
        setSelectedTemplate(found);
      }
    }
  }, [templateId, templates]);

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

  const loadTemplates = async (search?: string) => {
    setLoadingTemplates(true);
    try {
      const url = search 
        ? `/api/solapi/templates?search=${encodeURIComponent(search)}`
        : '/api/solapi/templates';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates || []);
        
        // 현재 템플릿 ID가 있으면 해당 템플릿 선택
        if (templateId && data.templates) {
          const found = data.templates.find((t: Template) => t.templateId === templateId);
          if (found) {
            setSelectedTemplate(found);
          }
        }
      } else {
        console.error('템플릿 목록 로드 실패:', data.message);
      }
    } catch (error) {
      console.error('템플릿 목록 로드 오류:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleTemplateSelect = (selectedTemplateId: string) => {
    if (selectedTemplateId) {
      const found = templates.find(t => t.templateId === selectedTemplateId);
      if (found) {
        setSelectedTemplate(found);
        onTemplateIdChange?.(found.templateId);
      }
    } else {
      setSelectedTemplate(null);
      onTemplateIdChange?.('');
    }
  };

  const handleTemplateSearch = (search: string) => {
    setTemplateSearch(search);
    if (search.trim()) {
      loadTemplates(search);
    } else {
      loadTemplates();
    }
  };

  // 검색 필터링된 템플릿 목록
  const filteredTemplates = templateSearch
    ? templates.filter(t => 
        t.name?.toLowerCase().includes(templateSearch.toLowerCase()) ||
        t.templateId?.toLowerCase().includes(templateSearch.toLowerCase())
      )
    : templates;

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
            <div className="space-y-2">
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
              <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2">
                <p className="font-medium mb-1">💡 발송 방식 안내:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>친구톡 (카카오 API):</strong> 카카오 비즈니스 채널 API 사용. 카카오 개발자 콘솔의 "친구 목록/메시지" 권한과는 별개입니다.</li>
                  <li><strong>알림톡 (Solapi):</strong> Solapi를 통한 알림톡 발송. 템플릿 ID가 필요합니다.</li>
                </ul>
              </div>
              
              {/* 친구톡 선택 시 안내 */}
              {messageType === 'FRIENDTALK' && (
                <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                  <p className="font-medium mb-1">⚠️ 친구톡 발송 전 확인사항:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>친구톡은 <strong>카카오 친구로 등록된 번호</strong>에게만 발송 가능합니다.</li>
                    <li>친구 수가 0명이면 <strong>친구 그룹</strong>을 사용하거나 <strong>친구를 수동으로 등록</strong>해주세요.</li>
                    <li>친구가 아닌 번호는 "친구 추가 안 된 번호 처리" 옵션에 따라 SMS로 대체 발송되거나 건너뜁니다.</li>
                    <li>친구 등록 방법: <a href="/admin/kakao-friend-groups" target="_blank" className="text-blue-600 underline">친구 그룹 관리</a>에서 친구 추가</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 알림톡 템플릿 선택 (알림톡 선택 시) */}
          {messageType === 'ALIMTALK' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  템플릿 선택
                </label>
                <button
                  onClick={() => loadTemplates(templateSearch)}
                  disabled={loadingTemplates}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
                  title="템플릿 목록 새로고침"
                >
                  <span>🔄</span>
                  {loadingTemplates ? '로딩...' : '새로고침'}
                </button>
              </div>

              {/* 템플릿 검색 */}
              <input
                type="text"
                value={templateSearch}
                onChange={(e) => handleTemplateSearch(e.target.value)}
                placeholder="템플릿 이름 또는 ID로 검색..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />

              {/* 템플릿 선택 드롭다운 */}
              <select
                value={templateId || ''}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                disabled={loadingTemplates}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">템플릿 선택 안 함 (직접 입력)</option>
                {filteredTemplates.map((template) => (
                  <option key={template.templateId} value={template.templateId}>
                    {template.name} ({template.templateId})
                  </option>
                ))}
              </select>

              {/* 템플릿 ID 직접 입력 (드롭다운에서 선택 안 한 경우) */}
              {(!templateId || !selectedTemplate) && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    또는 템플릿 ID 직접 입력
                  </label>
                  <input
                    type="text"
                    value={templateId || ''}
                    onChange={(e) => onTemplateIdChange?.(e.target.value)}
                    placeholder="Solapi에서 발급받은 템플릿 코드"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              )}

              {/* 템플릿 미리보기 */}
              {selectedTemplate && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">
                      템플릿 미리보기
                    </span>
                    <button
                      onClick={() => setShowTemplatePreview(!showTemplatePreview)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {showTemplatePreview ? '접기' : '펼치기'}
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-600 mb-1">
                    <strong>템플릿명:</strong> {selectedTemplate.name}
                  </div>
                  
                  {showTemplatePreview && (
                    <div className="mt-2 space-y-2">
                      <div className="bg-white border border-gray-200 rounded p-2 text-xs text-gray-700 whitespace-pre-wrap">
                        {selectedTemplate.content || '내용 없음'}
                      </div>
                      
                      {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                        <div className="text-xs">
                          <strong className="text-gray-700">사용 변수:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedTemplate.variables.map((variable) => (
                              <span
                                key={variable}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded"
                              >
                                #{'{'}{variable}{'}'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-500">
                알림톡 발송을 위해 템플릿 ID가 필요합니다. 드롭다운에서 선택하거나 직접 입력하세요.
              </p>

              {loadingTemplates && (
                <div className="text-xs text-gray-500 text-center py-2">
                  템플릿 목록을 불러오는 중...
                </div>
              )}

              {!loadingTemplates && templates.length === 0 && (
                <div className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded p-2">
                  ⚠️ 템플릿을 찾을 수 없습니다. Solapi 콘솔에서 템플릿이 등록되어 있는지 확인하세요.
                </div>
              )}
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







