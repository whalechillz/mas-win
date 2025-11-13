'use client';

import React, { useMemo, useState } from 'react';
import { MessageSquare, CheckCircle, Calendar, X, FileText, Image as ImageIcon } from 'lucide-react';

interface MessageItem {
  date: string;
  account1: {
    profileMessage?: string;
    feedCaption?: string;
    created: boolean;
    status: string;
  };
  account2: {
    profileMessage?: string;
    feedCaption?: string;
    created: boolean;
    status: string;
  };
}

interface MessageListViewProps {
  calendarData: any;
  onDateSelect: (date: string) => void;
  onViewModeChange: (mode: 'today' | 'week' | 'month') => void;
}

export default function MessageListView({
  calendarData,
  onDateSelect,
  onViewModeChange
}: MessageListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState<'all' | 'account1' | 'account2'>('all');
  const [filterType, setFilterType] = useState<'all' | 'profile' | 'feed'>('all');

  // 모든 메시지 추출
  const messages = useMemo(() => {
    if (!calendarData) return [];

    const messageList: MessageItem[] = [];
    const account1Schedule = calendarData.profileContent?.account1?.dailySchedule || [];
    const account2Schedule = calendarData.profileContent?.account2?.dailySchedule || [];
    const feedSchedule = calendarData.kakaoFeed?.dailySchedule || [];

    // 날짜별로 그룹화
    const dateMap = new Map<string, MessageItem>();

    // Account1 프로필 메시지
    account1Schedule.forEach((item: any) => {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, {
          date: item.date,
          account1: { created: item.created || false, status: item.status || 'planned' },
          account2: { created: false, status: 'planned' }
        });
      }
      const msgItem = dateMap.get(item.date)!;
      if (item.message) {
        msgItem.account1.profileMessage = item.message;
      }
      msgItem.account1.created = item.created || false;
      msgItem.account1.status = item.status || 'planned';
    });

    // Account2 프로필 메시지
    account2Schedule.forEach((item: any) => {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, {
          date: item.date,
          account1: { created: false, status: 'planned' },
          account2: { created: item.created || false, status: item.status || 'planned' }
        });
      }
      const msgItem = dateMap.get(item.date)!;
      if (item.message) {
        msgItem.account2.profileMessage = item.message;
      }
      msgItem.account2.created = item.created || false;
      msgItem.account2.status = item.status || 'planned';
    });

    // 피드 캡션
    feedSchedule.forEach((item: any) => {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, {
          date: item.date,
          account1: { created: false, status: 'planned' },
          account2: { created: false, status: 'planned' }
        });
      }
      const msgItem = dateMap.get(item.date)!;
      if (item.account1?.caption) {
        msgItem.account1.feedCaption = item.account1.caption;
        msgItem.account1.created = item.account1.created || msgItem.account1.created;
      }
      if (item.account2?.caption) {
        msgItem.account2.feedCaption = item.account2.caption;
        msgItem.account2.created = item.account2.created || msgItem.account2.created;
      }
    });

    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [calendarData]);

  // 필터링
  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // 계정 필터
    if (filterAccount !== 'all') {
      filtered = filtered.filter(item => {
        if (filterAccount === 'account1') {
          return item.account1.profileMessage || item.account1.feedCaption;
        } else {
          return item.account2.profileMessage || item.account2.feedCaption;
        }
      });
    }

    // 타입 필터
    if (filterType !== 'all') {
      filtered = filtered.map(item => {
        const newItem = { ...item };
        if (filterType === 'profile') {
          newItem.account1.feedCaption = undefined;
          newItem.account2.feedCaption = undefined;
        } else {
          newItem.account1.profileMessage = undefined;
          newItem.account2.profileMessage = undefined;
        }
        return newItem;
      }).filter(item => 
        item.account1.profileMessage || item.account1.feedCaption ||
        item.account2.profileMessage || item.account2.feedCaption
      );
    }

    // 검색 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const account1Match = 
          item.account1.profileMessage?.toLowerCase().includes(term) ||
          item.account1.feedCaption?.toLowerCase().includes(term);
        const account2Match = 
          item.account2.profileMessage?.toLowerCase().includes(term) ||
          item.account2.feedCaption?.toLowerCase().includes(term);
        return account1Match || account2Match || item.date.includes(term);
      });
    }

    return filtered;
  }, [messages, filterAccount, filterType, searchTerm]);

  const account1Name = calendarData?.profileContent?.account1?.name || '대표폰';
  const account2Name = calendarData?.profileContent?.account2?.name || '업무폰';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">메시지 현황표</h2>
        
        {/* 필터 및 검색 */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">계정:</label>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">전체</option>
              <option value="account1">{account1Name}</option>
              <option value="account2">{account2Name}</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">타입:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">전체</option>
              <option value="profile">프로필 메시지</option>
              <option value="feed">피드 캡션</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="메시지 또는 날짜로 검색..."
              className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* 메시지 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">날짜</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                {account1Name} 프로필
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                {account1Name} 피드
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                {account2Name} 프로필
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                {account2Name} 피드
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">상태</th>
            </tr>
          </thead>
          <tbody>
            {filteredMessages.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? '검색 결과가 없습니다.' : '메시지가 없습니다.'}
                </td>
              </tr>
            ) : (
              filteredMessages.map((item) => (
                <tr
                  key={item.date}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    onDateSelect(item.date);
                    onViewModeChange('today');
                  }}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {item.date}
                    </div>
                  </td>
                  
                  {/* Account1 프로필 메시지 */}
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.account1.profileMessage ? (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{item.account1.profileMessage}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  
                  {/* Account1 피드 캡션 */}
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.account1.feedCaption ? (
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{item.account1.feedCaption}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  
                  {/* Account2 프로필 메시지 */}
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.account2.profileMessage ? (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{item.account2.profileMessage}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  
                  {/* Account2 피드 캡션 */}
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.account2.feedCaption ? (
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{item.account2.feedCaption}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  
                  {/* 상태 */}
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col gap-1">
                      {item.account1.created && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          <CheckCircle className="w-3 h-3" />
                          {account1Name} 생성
                        </span>
                      )}
                      {item.account2.created && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          <CheckCircle className="w-3 h-3" />
                          {account2Name} 생성
                        </span>
                      )}
                      {item.account1.status === 'published' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                          {account1Name} 배포
                        </span>
                      )}
                      {item.account2.status === 'published' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                          {account2Name} 배포
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 통계 */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
        총 {filteredMessages.length}개 날짜
        {filteredMessages.length > 0 && (
          <>
            {' '}(생성됨: {filteredMessages.filter(m => m.account1.created || m.account2.created).length}개)
          </>
        )}
      </div>
    </div>
  );
}

