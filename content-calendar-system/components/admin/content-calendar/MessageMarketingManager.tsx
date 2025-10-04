// Message Marketing Manager Component
// /components/admin/content-calendar/MessageMarketingManager.tsx

import React, { useState, useEffect } from 'react';
import { HOOKING_MESSAGES, selectMessage, formatMessageForChannel } from '@/data/hooking-messages';

interface MessageMarketingManagerProps {
  onMessageSend?: (message: any) => void;
  onScheduleCreate?: (schedule: any) => void;
}

const MessageMarketingManager: React.FC<MessageMarketingManagerProps> = ({
  onMessageSend,
  onScheduleCreate
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'kakao' | 'email' | 'social'>('sms');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewMessage, setPreviewMessage] = useState<any>(null);
  const [scheduleSettings, setScheduleSettings] = useState<any>({});
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<'library' | 'schedule' | 'automation' | 'performance'>('library');
  const [stats, setStats] = useState<any>(null);

  // =====================================================
  // 메시지 미리보기
  // =====================================================
  const handlePreview = (messageId: string) => {
    const formatted = formatMessageForChannel(messageId, selectedChannel);
    setPreviewMessage(formatted);
  };

  // =====================================================
  // 즉시 발송
  // =====================================================
  const handleSendNow = async (messageId: string) => {
    try {
      const response = await fetch('/api/marketing/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          channel: selectedChannel,
          targetAudience: getTargetAudience(selectedChannel),
          sendNow: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`메시지 발송 완료! 대상: ${data.recipientCount}명`);
        onMessageSend?.(data);
      }
    } catch (error) {
      console.error('메시지 발송 실패:', error);
    }
  };

  // =====================================================
  // 스케줄 생성
  // =====================================================
  const handleScheduleCreate = async () => {
    try {
      const response = await fetch('/api/marketing/create-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: selectedChannel,
          schedule: scheduleSettings,
          messages: getSelectedMessages(),
          abTest: abTestEnabled
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('발송 스케줄 생성 완료!');
        onScheduleCreate?.(data);
      }
    } catch (error) {
      console.error('스케줄 생성 실패:', error);
    }
  };

  // =====================================================
  // 타겟 오디언스 결정
  // =====================================================
  const getTargetAudience = (channel: string) => {
    return HOOKING_MESSAGES.schedulingRules[channel as keyof typeof HOOKING_MESSAGES.schedulingRules]?.targetAudience || [];
  };

  // =====================================================
  // 선택된 메시지 가져오기
  // =====================================================
  const getSelectedMessages = () => {
    if (selectedCategory === 'all') {
      return HOOKING_MESSAGES.messages;
    }
    return HOOKING_MESSAGES.messages.filter(m => m.category === selectedCategory);
  };

  // =====================================================
  // 통계 로드
  // =====================================================
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/marketing/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  };

  // =====================================================
  // 렌더링
  // =====================================================
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">메시지 마케팅 관리</h2>
            <p className="text-gray-600 mt-1">후킹 메시지 라이브러리 및 자동 발송 시스템</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('library')}
              className={`px-4 py-2 rounded ${viewMode === 'library' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              메시지 라이브러리
            </button>
            <button
              onClick={() => setViewMode('schedule')}
              className={`px-4 py-2 rounded ${viewMode === 'schedule' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              발송 스케줄
            </button>
            <button
              onClick={() => setViewMode('automation')}
              className={`px-4 py-2 rounded ${viewMode === 'automation' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              자동화
            </button>
            <button
              onClick={() => setViewMode('performance')}
              className={`px-4 py-2 rounded ${viewMode === 'performance' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              성과
            </button>
          </div>
        </div>
      </div>

      {/* Channel Selector */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">채널 선택:</span>
          <div className="flex gap-2">
            {['sms', 'kakao', 'email', 'social'].map(channel => (
              <button
                key={channel}
                onClick={() => setSelectedChannel(channel as any)}
                className={`px-3 py-1 rounded ${
                  selectedChannel === channel 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border'
                }`}
              >
                {channel.toUpperCase()}
              </button>
            ))}
          </div>
          
          <span className="text-sm font-medium ml-8">카테고리:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="all">전체</option>
            {Object.values(HOOKING_MESSAGES.categories).map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Library View */}
        {viewMode === 'library' && (
          <MessageLibrary
            messages={getSelectedMessages()}
            channel={selectedChannel}
            onPreview={handlePreview}
            onSendNow={handleSendNow}
          />
        )}

        {/* Schedule View */}
        {viewMode === 'schedule' && (
          <ScheduleManager
            channel={selectedChannel}
            settings={scheduleSettings}
            onSettingsChange={setScheduleSettings}
            onCreate={handleScheduleCreate}
          />
        )}

        {/* Automation View */}
        {viewMode === 'automation' && (
          <AutomationSettings
            channel={selectedChannel}
            abTestEnabled={abTestEnabled}
            onAbTestToggle={setAbTestEnabled}
          />
        )}

        {/* Performance View */}
        {viewMode === 'performance' && (
          <PerformanceDashboard
            stats={stats}
            channel={selectedChannel}
          />
        )}
      </div>

      {/* Preview Modal */}
      {previewMessage && (
        <MessagePreview
          message={previewMessage}
          channel={selectedChannel}
          onClose={() => setPreviewMessage(null)}
        />
      )}
    </div>
  );
};

// =====================================================
// Message Library Component
// =====================================================
interface MessageLibraryProps {
  messages: any[];
  channel: string;
  onPreview: (id: string) => void;
  onSendNow: (id: string) => void;
}

const MessageLibrary: React.FC<MessageLibraryProps> = ({
  messages,
  channel,
  onPreview,
  onSendNow
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">메시지 라이브러리 ({messages.length}개)</h3>
      <div className="grid gap-4">
        {messages.map(message => (
          <div key={message.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {HOOKING_MESSAGES.categories[message.category]?.icon}
                  </span>
                  <span className="text-sm text-gray-500">
                    {HOOKING_MESSAGES.categories[message.category]?.label}
                  </span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {message.id}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900">{message.headline}</h4>
                <p className="text-sm text-gray-600 mt-1">{message.subline}</p>
                {channel === 'sms' && (
                  <p className="text-sm mt-2 p-2 bg-yellow-50 rounded">
                    SMS: {message.shortVersion}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  {message.keywords.map((keyword: string) => (
                    <span key={keyword} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onPreview(message.id)}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                >
                  미리보기
                </button>
                <button
                  onClick={() => onSendNow(message.id)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  즉시 발송
                </button>
                {message.performance?.tested && (
                  <div className="text-xs text-center">
                    <div>CTR: {message.performance.clickRate}%</div>
                    <div>CVR: {message.performance.conversionRate}%</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =====================================================
// Schedule Manager Component
// =====================================================
interface ScheduleManagerProps {
  channel: string;
  settings: any;
  onSettingsChange: (settings: any) => void;
  onCreate: () => void;
}

const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  channel,
  settings,
  onSettingsChange,
  onCreate
}) => {
  const rules = HOOKING_MESSAGES.schedulingRules[channel as keyof typeof HOOKING_MESSAGES.schedulingRules];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">발송 스케줄 설정</h3>
      
      {/* Channel Rules */}
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <h4 className="font-medium mb-2">📌 {channel.toUpperCase()} 채널 기본 규칙</h4>
        <div className="text-sm text-gray-700">
          <p>• 빈도: {rules?.frequency}</p>
          <p>• 최적 요일: {rules?.bestDays?.join(', ')}</p>
          <p>• 최적 시간: {rules?.bestTime}</p>
          <p>• 타겟: {rules?.targetAudience?.join(', ')}</p>
        </div>
      </div>

      {/* SMS-Kakao Sequencing */}
      {(channel === 'sms' || channel === 'kakao') && (
        <div className="bg-yellow-50 p-4 rounded-lg mb-4">
          <h4 className="font-medium mb-2">⏰ SMS-카카오톡 순차 발송</h4>
          <p className="text-sm">
            SMS 발송 3시간 후 카카오톡 자동 발송 (시너지 효과)
          </p>
        </div>
      )}

      {/* Schedule Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">발송 주기</label>
          <select
            value={settings.frequency || rules?.frequency}
            onChange={(e) => onSettingsChange({ ...settings, frequency: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="daily">매일</option>
            <option value="weekly">주 1회</option>
            <option value="biweekly">격주</option>
            <option value="bimonthly">월 2회</option>
            <option value="monthly">월 1회</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">발송 시간</label>
          <input
            type="time"
            value={settings.time || rules?.bestTime}
            onChange={(e) => onSettingsChange({ ...settings, time: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">타겟 고객</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span>기존 고객</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span>문의 고객</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span>신규 리드</span>
            </label>
          </div>
        </div>

        <button
          onClick={onCreate}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          스케줄 생성
        </button>
      </div>
    </div>
  );
};

// =====================================================
// Automation Settings Component
// =====================================================
interface AutomationSettingsProps {
  channel: string;
  abTestEnabled: boolean;
  onAbTestToggle: (enabled: boolean) => void;
}

const AutomationSettings: React.FC<AutomationSettingsProps> = ({
  channel,
  abTestEnabled,
  onAbTestToggle
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">자동화 설정</h3>

      {/* Auto Send */}
      <div className="border rounded-lg p-4 mb-4">
        <h4 className="font-medium mb-2">🤖 자동 발송</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span>스케줄에 따른 자동 발송 활성화</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span>메시지 자동 로테이션 (중복 방지)</span>
          </label>
          {channel === 'social' && (
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span>소셜미디어 스레드 자동 생성</span>
            </label>
          )}
        </div>
      </div>

      {/* A/B Testing */}
      <div className="border rounded-lg p-4 mb-4">
        <h4 className="font-medium mb-2">🔬 A/B 테스트</h4>
        <label className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={abTestEnabled}
            onChange={(e) => onAbTestToggle(e.target.checked)}
            className="mr-2"
          />
          <span>A/B 테스트 활성화</span>
        </label>
        {abTestEnabled && (
          <div className="space-y-2 ml-6">
            {HOOKING_MESSAGES.abTesting.testGroups.map(test => (
              <div key={test.name} className="text-sm p-2 bg-gray-50 rounded">
                <div className="font-medium">{test.name}</div>
                <div className="text-xs text-gray-600">
                  A: {test.messageA} vs B: {test.messageB} (50:50)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smart Optimization */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-2">📊 스마트 최적화</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>성과 기반 메시지 자동 선택</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>최적 발송 시간 자동 조정</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>저성과 메시지 자동 제외</span>
          </label>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// Performance Dashboard Component
// =====================================================
interface PerformanceDashboardProps {
  stats: any;
  channel: string;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  stats,
  channel
}) => {
  const goals = HOOKING_MESSAGES.performanceTracking.goals[channel as keyof typeof HOOKING_MESSAGES.performanceTracking.goals];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">성과 대시보드</h3>
      
      {/* Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold">1,234</div>
          <div className="text-sm text-gray-600">총 발송</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold">15.3%</div>
          <div className="text-sm text-gray-600">클릭률</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold">89</div>
          <div className="text-sm text-gray-600">전화 문의</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold">₩2.5M</div>
          <div className="text-sm text-gray-600">매출 기여</div>
        </div>
      </div>

      {/* Goals vs Actual */}
      {goals && (
        <div className="border rounded-lg p-4 mb-6">
          <h4 className="font-medium mb-3">목표 대비 실적</h4>
          <div className="space-y-2">
            {Object.entries(goals).map(([metric, goal]) => (
              <div key={metric} className="flex items-center justify-between">
                <span className="text-sm">{metric}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (15 / (goal as number)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm">15/{goal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performing Messages */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3">최고 성과 메시지</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>1. 힘은 그대로, 비거리는 플러스 20야드</span>
            <span className="text-green-600">CTR 22%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>2. COR 0.87 초고반발 페이스</span>
            <span className="text-green-600">CTR 18%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>3. 드라이버 바꿨을 뿐인데...</span>
            <span className="text-green-600">CTR 16%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// Message Preview Modal Component
// =====================================================
interface MessagePreviewProps {
  message: any;
  channel: string;
  onClose: () => void;
}

const MessagePreview: React.FC<MessagePreviewProps> = ({
  message,
  channel,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{channel.toUpperCase()} 미리보기</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          {channel === 'sms' && (
            <div className="font-mono text-sm whitespace-pre-wrap">
              {message}
            </div>
          )}
          {channel === 'kakao' && (
            <div className="space-y-2">
              <div className="font-semibold">{message.split('\n')[0]}</div>
              <div className="text-sm">{message.split('\n').slice(1).join('\n')}</div>
            </div>
          )}
          {channel === 'email' && (
            <div>
              <div className="font-semibold mb-2">제목: {message.subject}</div>
              <div className="text-sm text-gray-600 mb-2">미리보기: {message.preview}</div>
              <div className="border-t pt-2" dangerouslySetInnerHTML={{ __html: message.body }} />
            </div>
          )}
          {channel === 'social' && (
            <div className="space-y-3">
              <div className="p-2 bg-white rounded">{message.post1}</div>
              <div className="p-2 bg-white rounded">{message.post2}</div>
              <div className="p-2 bg-white rounded text-blue-600">{message.post3}</div>
            </div>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default MessageMarketingManager;
