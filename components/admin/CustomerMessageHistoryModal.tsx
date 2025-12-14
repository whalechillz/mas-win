import React, { useCallback, useEffect, useMemo, useState } from 'react';

type CustomerLite = {
  id?: number;
  name?: string | null;
  phone: string;
};

type CustomerMessage = {
  logId: number | null;
  messageId: number | null;
  messageText: string | null;
  messageType: string | null;
  sentAt: string | null;
  sendStatus: string | null;
  messageStatus: string | null;
  note: string | null;
  solapiGroupId: string | null;
  successCount: number | null;
  failCount: number | null;
  imageUrl: string | null;
  isBookingMessage?: boolean;
  bookingId?: number | null;
  notificationType?: string | null;
};

type Props = {
  isOpen: boolean;
  customer: CustomerLite;
  onClose: () => void;
};

const statusBadgeClass = (status?: string | null) => {
  switch ((status || '').toLowerCase()) {
    case 'sent':
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'partial':
    case 'partial_success':
      return 'bg-amber-100 text-amber-800';
    case 'failed':
    case 'fail':
      return 'bg-red-100 text-red-800';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatSendStatus = (status?: string | null) => {
  switch ((status || '').toLowerCase()) {
    case 'sent':
    case 'success':
      return '발송 완료';
    case 'partial':
    case 'partial_success':
      return '일부 발송';
    case 'failed':
    case 'fail':
      return '발송 실패';
    case 'draft':
      return '예정';
    case 'scheduled':
      return '예약 발송';
    default:
      return '알 수 없음';
  }
};

const formatMessageStatus = (status?: string | null) => {
  switch ((status || '').toLowerCase()) {
    case 'sent':
    case 'success':
      return '메시지 완료';
    case 'partial':
    case 'partial_success':
      return '메시지 부분 발송';
    case 'failed':
    case 'fail':
      return '메시지 실패';
    case 'draft':
      return '초안';
    case 'scheduled':
      return '예약됨';
    default:
      return status || '알 수 없음';
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return value;
  }
};

type TabType = 'all' | 'booking' | 'promotion';

export default function CustomerMessageHistoryModal({ isOpen, customer, onClose }: Props) {
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(50);
  const [checkingMessageId, setCheckingMessageId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const ensureSmsRecord = useCallback(async (message: CustomerMessage) => {
    if (!message.messageId) {
      throw new Error('메시지 ID가 없어 상세 정보를 열 수 없습니다.');
    }

    const checkExisting = await fetch(`/api/channels/sms/${message.messageId}`);
    if (checkExisting.ok) {
      return true;
    }

    if (checkExisting.status === 404) {
      if (!message.solapiGroupId) {
        throw new Error('SMS 상세 데이터를 찾을 수 없습니다. (솔라피 그룹 ID 정보가 없습니다.)');
      }

      const syncResponse = await fetch('/api/admin/sync-solapi-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.messageId,
          groupId: message.solapiGroupId
        })
      });

      let syncJson: any = {};
      try {
        syncJson = await syncResponse.json();
      } catch (err) {
        console.error('솔라피 동기화 응답 파싱 오류:', err);
      }

      if (!syncResponse.ok || !syncJson.success) {
        const syncErrorMsg =
          syncJson?.message ||
          (syncResponse.status === 404
            ? '솔라피 그룹 정보를 찾을 수 없습니다.'
            : '솔라피 자료 동기화 중 오류가 발생했습니다.');
        throw new Error(syncErrorMsg);
      }

      const recheck = await fetch(`/api/channels/sms/${message.messageId}`);
      if (recheck.ok) {
        return true;
      }

      throw new Error('솔라피 자료를 동기화했지만 SMS 상세 데이터를 찾을 수 없습니다.');
    }

    throw new Error('SMS 데이터를 불러오는 중 오류가 발생했습니다.');
  }, []);

  useEffect(() => {
    if (!isOpen || !customer?.phone) return;

    const controller = new AbortController();
    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/admin/customers/${encodeURIComponent(customer.phone)}/messages?limit=${limit}`;
        const res = await fetch(url, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || '메시지 이력을 불러오지 못했습니다.');
        }
        setMessages(json.messages || []);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('고객 메시지 이력 조회 오류:', err);
        setError(err.message || '메시지 이력을 불러오지 못했습니다.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMessages();
    return () => controller.abort();
  }, [isOpen, customer?.phone, limit]);

  // 탭별 메시지 필터링
  const filteredMessages = useMemo(() => {
    switch (activeTab) {
      case 'booking':
        return messages.filter(msg => msg.isBookingMessage === true);
      case 'promotion':
        return messages.filter(msg => msg.isBookingMessage !== true);
      default:
        return messages;
    }
  }, [messages, activeTab]);

  // 탭별 메시지 개수 계산
  const tabCounts = useMemo(() => {
    const bookingCount = messages.filter(msg => msg.isBookingMessage === true).length;
    const promotionCount = messages.filter(msg => msg.isBookingMessage !== true).length;
    return {
      all: messages.length,
      booking: bookingCount,
      promotion: promotionCount,
    };
  }, [messages]);

  const messageCount = useMemo(() => filteredMessages.length, [filteredMessages]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">고객 메시지 이력</h2>
            <p className="text-sm text-gray-600">
              고객: <span className="font-medium">{customer?.name || '-'}</span> (
              {customer?.phone || '-'}) · {activeTab === 'all' ? '전체' : activeTab === 'booking' ? '예약' : '홍보'} {messageCount.toLocaleString()}건
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="border-b border-gray-200 px-6">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('all')}
              className={`
                py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              전체
              {tabCounts.all > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === 'all' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tabCounts.all}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('booking')}
              className={`
                py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'booking'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              예약 메시지
              {tabCounts.booking > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === 'booking' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tabCounts.booking}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('promotion')}
              className={`
                py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'promotion'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              홍보 메시지
              {tabCounts.promotion > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === 'promotion' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tabCounts.promotion}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex items-center justify-center py-8 text-sm text-gray-500">
              불러오는 중입니다...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {!loading && !error && filteredMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-gray-500">
              <span>
                {activeTab === 'all' 
                  ? '아직 발송된 메시지가 없습니다.'
                  : activeTab === 'booking'
                  ? '예약 관련 메시지가 없습니다.'
                  : '홍보 메시지가 없습니다.'}
              </span>
            </div>
          )}

          {!loading && !error && filteredMessages.length > 0 && (
            <div className="space-y-4">
              {filteredMessages.map((message, index) => (
                <div
                  key={message.logId || message.messageId || `message-${index}`}
                  className={`rounded-xl border p-4 shadow-sm transition hover:border-purple-200 hover:bg-white ${
                    message.isBookingMessage 
                      ? 'border-blue-200 bg-blue-50/30' 
                      : 'border-gray-100 bg-gray-50/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDateTime(message.sentAt)}
                      </div>
                      {message.isBookingMessage && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          📅 예약
                        </span>
                      )}
                      {message.bookingId && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          예약 ID: {message.bookingId}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded-full px-2 py-1 ${statusBadgeClass(message.messageType)}`}>
                        {message.messageType || '유형 미정'}
                      </span>
                      <span className={`rounded-full px-2 py-1 ${statusBadgeClass(message.sendStatus)}`}>
                        발송 상태: {formatSendStatus(message.sendStatus)}
                      </span>
                      <span className={`rounded-full px-2 py-1 ${statusBadgeClass(message.messageStatus)}`}>
                        메시지 상태: {formatMessageStatus(message.messageStatus)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-800 whitespace-pre-line">
                    {message.messageText || '메시지 내용이 없습니다.'}
                  </div>

                  {message.note && (
                    <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      메모: {message.note}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {typeof message.successCount === 'number' && (
                      <span>✅ {message.successCount.toLocaleString()}건</span>
                    )}
                    {typeof message.failCount === 'number' && message.failCount > 0 && (
                      <span>❌ {message.failCount.toLocaleString()}건</span>
                    )}
                    {message.solapiGroupId && (
                      <button
                        type="button"
                        className="text-purple-600 underline underline-offset-2"
                        onClick={() => {
                          // 콤마로 구분된 여러 그룹 ID 중 첫 번째만 사용
                          const groupId = message.solapiGroupId.split(',')[0].trim();
                          window.open(`https://console.solapi.com/message-log?criteria=groupId&value=${groupId}&cond=eq`, '_blank');
                        }}
                      >
                        Solapi 그룹 보기
                      </button>
                    )}
                    {message.messageId && (
                      <button
                        type="button"
                        className="text-blue-600 underline underline-offset-2 disabled:opacity-50"
                        onClick={async () => {
                          if (!message.messageId) {
                            return;
                          }
                          setCheckingMessageId(message.messageId);
                          try {
                            const exists = await ensureSmsRecord(message);
                            if (exists) {
                              window.open(`/admin/sms?id=${message.messageId}`, '_blank');
                            }
                          } catch (err: any) {
                            alert(err?.message || 'SMS 상세 데이터를 불러오지 못했습니다.');
                          } finally {
                            setCheckingMessageId(null);
                          }
                        }}
                        disabled={checkingMessageId === message.messageId}
                      >
                        {checkingMessageId === message.messageId ? '확인 중...' : 'SMS 상세 보기'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}





