'use client';

import React, { useMemo, useState } from 'react';
import { MessageSquare, CheckCircle, Calendar, X, FileText, Image as ImageIcon, Filter, Search, Download, Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';

interface MessageItem {
  date: string;
  account1: {
    profileMessage?: string;
    feedCaption?: string;
    created: boolean;
    status: string;
    imageUrl?: string;
    publishedAt?: string;
  };
  account2: {
    profileMessage?: string;
    feedCaption?: string;
    created: boolean;
    status: string;
    imageUrl?: string;
    publishedAt?: string;
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'created' | 'published' | 'planned'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showImages, setShowImages] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // 메시지 정리 함수
  const cleanMessage = (message: string | undefined): string | undefined => {
    if (!message) return undefined;
    
    let cleaned = message.trim();
    
    // "json { message: " 패턴 제거
    cleaned = cleaned.replace(/^json\s*\{\s*message\s*:\s*/i, '');
    cleaned = cleaned.replace(/\s*\}\s*$/i, '');
    
    // 따옴표 제거 (앞뒤 따옴표)
    cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '');
    
    return cleaned.trim() || undefined;
  };

  // 캡션 정리 함수 (피드 캡션용)
  const cleanCaption = (caption: string | undefined): string | undefined => {
    if (!caption) return undefined;
    
    let cleaned = caption.trim();
    
    // 따옴표 제거 (앞뒤 따옴표)
    cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '');
    
    return cleaned.trim() || undefined;
  };

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
        msgItem.account1.profileMessage = cleanMessage(item.message);
      }
      if (item.background?.imageUrl) {
        msgItem.account1.imageUrl = item.background.imageUrl;
      }
      msgItem.account1.created = item.created || false;
      // status와 publishedAt은 데이터가 있을 때만 업데이트 (초기값 덮어쓰기 방지)
      if (item.status) {
        msgItem.account1.status = item.status;
      }
      if (item.publishedAt) {
        msgItem.account1.publishedAt = item.publishedAt;
      }
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
        msgItem.account2.profileMessage = cleanMessage(item.message);
      }
      if (item.background?.imageUrl) {
        msgItem.account2.imageUrl = item.background.imageUrl;
      }
      msgItem.account2.created = item.created || false;
      // status와 publishedAt은 데이터가 있을 때만 업데이트 (초기값 덮어쓰기 방지)
      if (item.status) {
        msgItem.account2.status = item.status;
      }
      if (item.publishedAt) {
        msgItem.account2.publishedAt = item.publishedAt;
      }
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
        msgItem.account1.feedCaption = cleanCaption(item.account1.caption);
        msgItem.account1.created = item.account1.created || msgItem.account1.created;
        if (item.account1.status) {
          msgItem.account1.status = item.account1.status;
        }
      }
      if (item.account2?.caption) {
        msgItem.account2.feedCaption = cleanCaption(item.account2.caption);
        msgItem.account2.created = item.account2.created || msgItem.account2.created;
        if (item.account2.status) {
          msgItem.account2.status = item.account2.status;
        }
      }
    });

    return Array.from(dateMap.values());
  }, [calendarData]);

  // 날짜별 발행 상태 계산 함수 (getPublishStatus와 동일한 로직) - useMemo 이전에 정의
  const getDatePublishStatus = (date: string) => {
    if (!calendarData) return { status: 'empty', label: '미작성' };
    
    const account1Schedule = calendarData.profileContent?.account1?.dailySchedule || [];
    const account2Schedule = calendarData.profileContent?.account2?.dailySchedule || [];
    const feedSchedule = calendarData.kakaoFeed?.dailySchedule || [];
    
    const account1Profile = account1Schedule.find((item: any) => item.date === date);
    const account2Profile = account2Schedule.find((item: any) => item.date === date);
    const feed = feedSchedule.find((item: any) => item.date === date);
    
    const hasProfile1 = account1Profile?.background?.imageUrl && 
                       account1Profile?.profile?.imageUrl && 
                       account1Profile?.message;
    const hasProfile2 = account2Profile?.background?.imageUrl && 
                       account2Profile?.profile?.imageUrl && 
                       account2Profile?.message;
    const hasFeed1 = feed?.account1?.imageUrl && feed?.account1?.caption;
    const hasFeed2 = feed?.account2?.imageUrl && feed?.account2?.caption;
    
    const isCreated = account1Profile?.created || account2Profile?.created;
    const isPublished = account1Profile?.status === 'published' || 
                       account2Profile?.status === 'published';
    
    if (isPublished) {
      return { status: 'published', label: '발행됨' };
    } else if (isCreated && hasProfile1 && hasProfile2 && hasFeed1 && hasFeed2) {
      return { status: 'ready', label: '발행 준비' };
    } else if (hasProfile1 || hasProfile2 || hasFeed1 || hasFeed2) {
      return { status: 'partial', label: '부분 완료' };
    } else {
      return { status: 'empty', label: '미작성' };
    }
  };

  // 필터링 및 정렬
  const filteredMessages = useMemo(() => {
    let filtered = [...messages];

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

    // 타입 필터 - 데이터를 삭제하지 않고 필터링만 수행
    if (filterType !== 'all') {
      filtered = filtered.filter(item => {
        if (filterType === 'profile') {
          return (item.account1.profileMessage || item.account2.profileMessage);
        } else {
          return (item.account1.feedCaption || item.account2.feedCaption);
        }
      });
    }

    // 상태 필터 - 날짜별 발행 상태 기반으로 필터링
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => {
        const publishStatus = getDatePublishStatus(item.date);
        if (filterStatus === 'created') {
          // 생성됨 = 발행됨 또는 발행 준비
          return publishStatus.status === 'published' || publishStatus.status === 'ready';
        } else if (filterStatus === 'published') {
          // 배포됨 = 발행됨
          return publishStatus.status === 'published';
        } else {
          // 계획됨 = 미작성
          return publishStatus.status === 'empty';
        }
      });
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

    // 정렬
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        // 상태별 정렬 (created > published > planned)
        const statusOrder = { created: 3, published: 2, planned: 1 };
        const aStatus = a.account1.created || a.account2.created ? 'created' : 
                        a.account1.status === 'published' || a.account2.status === 'published' ? 'published' : 'planned';
        const bStatus = b.account1.created || b.account2.created ? 'created' : 
                        b.account1.status === 'published' || b.account2.status === 'published' ? 'published' : 'planned';
        return sortOrder === 'asc' 
          ? statusOrder[aStatus as keyof typeof statusOrder] - statusOrder[bStatus as keyof typeof statusOrder]
          : statusOrder[bStatus as keyof typeof statusOrder] - statusOrder[aStatus as keyof typeof statusOrder];
      }
    });

    return filtered;
  }, [messages, filterAccount, filterType, filterStatus, searchTerm, sortBy, sortOrder, calendarData]);

  const account1Name = calendarData?.profileContent?.account1?.name || '대표폰';
  const account2Name = calendarData?.profileContent?.account2?.name || '업무폰';

  const toggleRowExpansion = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (created: boolean, status: string, accountName: string, date: string) => {
    // 날짜별 발행 상태 확인
    const publishStatus = getDatePublishStatus(date);
    
    if (publishStatus.status === 'published') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          생성됨
        </span>
      );
    } else if (publishStatus.status === 'ready') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          생성됨
        </span>
      );
    } else if (created || publishStatus.status === 'partial') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          부분 완료
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
          미작성
        </span>
      );
    }
  };

  const getDeploymentBadge = (publishedAt: string | undefined, status: string, date: string) => {
    // 날짜별 발행 상태 확인
    const publishStatus = getDatePublishStatus(date);
    
    if (publishStatus.status === 'published') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
          발행됨
        </span>
      );
    } else if (publishStatus.status === 'ready') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
          미배포
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
          미배포
        </span>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">메시지 현황표</h2>
            <p className="text-sm text-gray-600 mt-1">카카오톡 콘텐츠 생성 및 배포 현황을 한눈에 확인하세요</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImages(!showImages)}
              className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
            >
              {showImages ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showImages ? '이미지 숨기기' : '이미지 보기'}
            </button>
          </div>
        </div>
        
        {/* 필터 및 검색 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="메시지 또는 날짜로 검색..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <label className="sr-only" htmlFor="filter-account">계정 필터</label>
          <select
            id="filter-account"
            value={filterAccount}
            onChange={(e) => {
              const newValue = e.target.value as 'all' | 'account1' | 'account2';
              setFilterAccount(newValue);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
            aria-label="계정 필터 선택"
          >
            <option value="all">전체 계정</option>
            <option value="account1">{account1Name}</option>
            <option value="account2">{account2Name}</option>
          </select>
          
          <label className="sr-only" htmlFor="filter-type">타입 필터</label>
          <select
            id="filter-type"
            value={filterType}
            onChange={(e) => {
              const newValue = e.target.value as 'all' | 'profile' | 'feed';
              setFilterType(newValue);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
            aria-label="타입 필터 선택"
          >
            <option value="all">전체 타입</option>
            <option value="profile">프로필 메시지</option>
            <option value="feed">피드 캡션</option>
          </select>

          <label className="sr-only" htmlFor="filter-status">상태 필터</label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => {
              const newValue = e.target.value as 'all' | 'created' | 'published' | 'planned';
              setFilterStatus(newValue);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
            aria-label="상태 필터 선택"
          >
            <option value="all">전체 상태</option>
            <option value="created">생성됨</option>
            <option value="published">배포됨</option>
            <option value="planned">계획됨</option>
          </select>
        </div>

        {/* 정렬 옵션 */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">정렬:</span>
            <label className="sr-only" htmlFor="sort-by">정렬 기준</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'status')}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              aria-label="정렬 기준 선택"
            >
              <option value="date">날짜</option>
              <option value="status">상태</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-gray-100 rounded"
              title={sortOrder === 'asc' ? '내림차순' : '오름차순'}
            >
              {sortOrder === 'asc' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 메시지 테이블 - 날짜별 계정 분리 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">날짜</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">계정</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">프로필</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">피드</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">상태</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">배포 상태</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMessages.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-12 h-12 text-gray-400" />
                    <p className="text-gray-500 font-medium">
                      {searchTerm ? '검색 결과가 없습니다.' : '메시지가 없습니다.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMessages.flatMap((item) => {
                const isExpanded = expandedRows.has(item.date);
                const rows = [];
                
                // Account1 행
                if (filterAccount === 'all' || filterAccount === 'account1') {
                  if (item.account1.profileMessage || item.account1.feedCaption) {
                    rows.push(
                    <React.Fragment key={`${item.date}-account1`}>
                      <tr
                        className="hover:bg-blue-50 transition-colors cursor-pointer border-l-4 border-l-yellow-400"
                        onClick={() => toggleRowExpansion(`${item.date}-account1`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{item.date}</span>
                          </div>
                        </td>
                        
                        {/* 계정명 */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium">
                            {account1Name}
                          </span>
                        </td>
                        
                        {/* 프로필 메시지 */}
                        <td className="px-6 py-4">
                          {item.account1.profileMessage ? (
                            <div className="flex items-start gap-2" style={{ maxWidth: '300px' }}>
                              <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700 line-clamp-1">
                                {item.account1.profileMessage}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* 피드 캡션 */}
                        <td className="px-6 py-4">
                          {item.account1.feedCaption ? (
                            <div className="flex items-start gap-2" style={{ maxWidth: '300px' }}>
                              <FileText className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700 line-clamp-1">
                                {item.account1.feedCaption}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* 상태 */}
                        <td className="px-6 py-4">
                          {getStatusBadge(item.account1.created, item.account1.status, account1Name, item.date)}
                        </td>

                        {/* 배포 상태 */}
                        <td className="px-6 py-4">
                          {getDeploymentBadge(item.account1.publishedAt, item.account1.status, item.date)}
                        </td>

                        {/* 작업 */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDateSelect(item.date);
                              onViewModeChange('today');
                            }}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium"
                          >
                            편집
                          </button>
                        </td>
                      </tr>
                      
                      {/* 확장된 행 (이미지 미리보기) */}
                      {isExpanded && showImages && item.account1.imageUrl && (
                        <tr className="bg-gray-50">
                          <td colSpan={7} className="px-6 py-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">{account1Name}</h4>
                              <img 
                                src={item.account1.imageUrl} 
                                alt="Account1"
                                className="w-full h-32 object-cover rounded"
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                    );
                  }
                }
                
                // Account2 행
                if (filterAccount === 'all' || filterAccount === 'account2') {
                  if (item.account2.profileMessage || item.account2.feedCaption) {
                    rows.push(
                    <React.Fragment key={`${item.date}-account2`}>
                      <tr
                        className="hover:bg-blue-50 transition-colors cursor-pointer border-l-4 border-l-gray-400"
                        onClick={() => toggleRowExpansion(`${item.date}-account2`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{item.date}</span>
                          </div>
                        </td>
                        
                        {/* 계정명 */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-medium">
                            {account2Name}
                          </span>
                        </td>
                        
                        {/* 프로필 메시지 */}
                        <td className="px-6 py-4">
                          {item.account2.profileMessage ? (
                            <div className="flex items-start gap-2" style={{ maxWidth: '300px' }}>
                              <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700 line-clamp-2">
                                {item.account2.profileMessage}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* 피드 캡션 */}
                        <td className="px-6 py-4">
                          {item.account2.feedCaption ? (
                            <div className="flex items-start gap-2" style={{ maxWidth: '300px' }}>
                              <FileText className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700 line-clamp-2">
                                {item.account2.feedCaption}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        
                        {/* 상태 */}
                        <td className="px-6 py-4">
                          {getStatusBadge(item.account2.created, item.account2.status, account2Name, item.date)}
                        </td>

                        {/* 배포 상태 */}
                        <td className="px-6 py-4">
                          {getDeploymentBadge(item.account2.publishedAt, item.account2.status, item.date)}
                        </td>

                        {/* 작업 */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDateSelect(item.date);
                              onViewModeChange('today');
                            }}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium"
                          >
                            편집
                          </button>
                        </td>
                      </tr>
                      
                      {/* 확장된 행 (이미지 미리보기) */}
                      {isExpanded && showImages && item.account2.imageUrl && (
                        <tr className="bg-gray-50">
                          <td colSpan={7} className="px-6 py-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">{account2Name}</h4>
                              <img 
                                src={item.account2.imageUrl} 
                                alt="Account2"
                                className="w-full h-32 object-cover rounded"
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                    );
                  }
                }
                
                return rows;
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 통계 및 푸터 */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            총 <span className="font-semibold text-gray-900">{filteredMessages.length}</span>개 날짜
            {filteredMessages.length > 0 && (
              <>
                {' '}(생성됨: <span className="font-semibold text-green-600">
                  {filteredMessages.filter(m => {
                    const status = getDatePublishStatus(m.date);
                    return status.status === 'published' || status.status === 'ready';
                  }).length}
                </span>개, 배포됨: <span className="font-semibold text-purple-600">
                  {filteredMessages.filter(m => {
                    const status = getDatePublishStatus(m.date);
                    return status.status === 'published';
                  }).length}
                </span>개)
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
