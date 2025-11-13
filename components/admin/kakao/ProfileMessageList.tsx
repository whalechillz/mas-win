'use client';

import React, { useState, useMemo } from 'react';
import { MessageSquare, CheckCircle, Calendar, X } from 'lucide-react';

interface MessageItem {
  message: string;
  date: string;
  account: 'account1' | 'account2';
  created: boolean;
  status: string;
  isFromJson: boolean; // JSON에 정의된 메시지인지
}

interface ProfileMessageListProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (message: string) => void;
  account: 'account1' | 'account2';
  calendarData: any;
  currentMessage?: string;
}

export default function ProfileMessageList({
  isOpen,
  onClose,
  onSelect,
  account,
  calendarData,
  currentMessage
}: ProfileMessageListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // 캘린더 데이터에서 메시지 추출
  const messages = useMemo(() => {
    if (!calendarData?.profileContent?.[account]?.dailySchedule) {
      return [];
    }

    const messageMap = new Map<string, MessageItem>();
    const schedule = calendarData.profileContent[account].dailySchedule;

    schedule.forEach((item: any) => {
      if (item.message) {
        const key = item.message.trim();
        // 이미 존재하는 메시지면 created 상태가 true인 것을 우선
        if (!messageMap.has(key) || item.created) {
          messageMap.set(key, {
            message: item.message,
            date: item.date,
            account,
            created: item.created || false,
            status: item.status || 'planned',
            isFromJson: true // JSON에서 가져온 메시지
          });
        }
      }
    });

    return Array.from(messageMap.values());
  }, [calendarData, account]);

  // 메시지 정렬: 생성된 메시지 우선, 그 다음 날짜순
  const sortedMessages = useMemo(() => {
    const created = messages.filter(m => m.created).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const planned = messages.filter(m => !m.created).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return [...created, ...planned];
  }, [messages]);

  // 검색 필터링
  const filteredMessages = useMemo(() => {
    if (!searchTerm) return sortedMessages;
    const term = searchTerm.toLowerCase();
    return sortedMessages.filter(m => 
      m.message.toLowerCase().includes(term) ||
      m.date.includes(term)
    );
  }, [sortedMessages, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">프로필 메시지 목록</h3>
            <span className="text-sm text-gray-500">
              ({account === 'account1' ? '대표폰' : '업무폰'})
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 검색 */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="메시지 또는 날짜로 검색..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchTerm ? '검색 결과가 없습니다.' : '저장된 메시지가 없습니다.'}
            </div>
          ) : (
            filteredMessages.map((item, index) => {
              const isCurrent = item.message === currentMessage;
              return (
                <div
                  key={`${item.date}-${index}`}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    onSelect(item.message);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {item.message}
                        </span>
                        {item.created && (
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3" />
                            생성됨
                          </span>
                        )}
                        {item.isFromJson && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            JSON 정의
                          </span>
                        )}
                        {item.status === 'published' && (
                          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                            배포됨
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{item.date}</span>
                        {isCurrent && (
                          <span className="text-blue-600 font-medium">(현재 선택됨)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 통계 */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
          총 {filteredMessages.length}개 메시지
          {filteredMessages.length > 0 && (
            <>
              {' '}(생성됨: {filteredMessages.filter(m => m.created).length}개,
              계획: {filteredMessages.filter(m => !m.created).length}개)
            </>
          )}
        </div>
      </div>
    </div>
  );
}

