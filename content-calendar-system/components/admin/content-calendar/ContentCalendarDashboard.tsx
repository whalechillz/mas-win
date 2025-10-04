// Content Calendar Dashboard Component
// /components/admin/content-calendar/ContentCalendarDashboard.tsx

import React, { useState, useMemo } from 'react';
import { 
  ContentCalendarItem,
  ContentType,
  ContentStatus 
} from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ContentCalendarDashboardProps {
  contents: ContentCalendarItem[];
  onContentClick: (content: ContentCalendarItem) => void;
  onDateClick: (date: Date) => void;
}

const ContentCalendarDashboard: React.FC<ContentCalendarDashboardProps> = ({
  contents,
  onContentClick,
  onDateClick
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');

  // =====================================================
  // 캘린더 데이터 계산
  // =====================================================
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // 첫 주의 빈 날짜 채우기
    const startDayOfWeek = getDay(start);
    const previousMonthDays = Array(startDayOfWeek).fill(null);
    
    return [...previousMonthDays, ...days];
  }, [currentMonth]);

  // 날짜별 콘텐츠 그룹화
  const contentsByDate = useMemo(() => {
    const grouped: { [key: string]: ContentCalendarItem[] } = {};
    
    contents.forEach(content => {
      const dateKey = format(new Date(content.contentDate), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(content);
    });
    
    return grouped;
  }, [contents]);

  // =====================================================
  // 이벤트 핸들러
  // =====================================================
  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick(date);
  };

  // =====================================================
  // 컴포넌트 렌더링
  // =====================================================
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold">
              {format(currentMonth, 'yyyy년 M월', { locale: ko })}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="이전 달"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
              >
                오늘
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="다음 달"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* View Type Selector */}
          <div className="flex items-center space-x-2">
            <ViewTypeButton
              active={viewType === 'month'}
              onClick={() => setViewType('month')}
              label="월"
            />
            <ViewTypeButton
              active={viewType === 'week'}
              onClick={() => setViewType('week')}
              label="주"
            />
            <ViewTypeButton
              active={viewType === 'day'}
              onClick={() => setViewType('day')}
              label="일"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <StatCard
            label="총 콘텐츠"
            value={contents.filter(c => 
              format(new Date(c.contentDate), 'yyyy-MM') === format(currentMonth, 'yyyy-MM')
            ).length}
            color="blue"
          />
          <StatCard
            label="발행 예정"
            value={contents.filter(c => 
              format(new Date(c.contentDate), 'yyyy-MM') === format(currentMonth, 'yyyy-MM') &&
              c.status === 'approved'
            ).length}
            color="green"
          />
          <StatCard
            label="작성 중"
            value={contents.filter(c => 
              format(new Date(c.contentDate), 'yyyy-MM') === format(currentMonth, 'yyyy-MM') &&
              c.status === 'draft'
            ).length}
            color="yellow"
          />
          <StatCard
            label="검토 중"
            value={contents.filter(c => 
              format(new Date(c.contentDate), 'yyyy-MM') === format(currentMonth, 'yyyy-MM') &&
              c.status === 'review'
            ).length}
            color="purple"
          />
          <StatCard
            label="발행 완료"
            value={contents.filter(c => 
              format(new Date(c.contentDate), 'yyyy-MM') === format(currentMonth, 'yyyy-MM') &&
              c.status === 'published'
            ).length}
            color="gray"
          />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-32" />;
            }

            const dateKey = format(date, 'yyyy-MM-dd');
            const dayContents = contentsByDate[dateKey] || [];
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isCurrentDay = isToday(date);

            return (
              <div
                key={dateKey}
                onClick={() => handleDateClick(date)}
                className={`
                  min-h-[128px] p-2 border rounded-lg cursor-pointer transition-all
                  ${isCurrentDay ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'}
                  ${isSelected ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`
                    text-sm font-medium
                    ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}
                    ${getDay(date) === 0 ? 'text-red-500' : ''}
                    ${getDay(date) === 6 ? 'text-blue-500' : ''}
                  `}>
                    {format(date, 'd')}
                  </span>
                  {dayContents.length > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {dayContents.length}
                    </span>
                  )}
                </div>

                {/* Content Items */}
                <div className="space-y-1">
                  {dayContents.slice(0, 3).map((content, i) => (
                    <ContentItem
                      key={content.id || i}
                      content={content}
                      onClick={(e) => {
                        e.stopPropagation();
                        onContentClick(content);
                      }}
                    />
                  ))}
                  {dayContents.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayContents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="border-t p-6">
          <h3 className="text-lg font-semibold mb-4">
            {format(selectedDate, 'yyyy년 M월 d일 (EEEE)', { locale: ko })} 콘텐츠
          </h3>
          <div className="space-y-2">
            {(contentsByDate[format(selectedDate, 'yyyy-MM-dd')] || []).map(content => (
              <DetailedContentItem
                key={content.id}
                content={content}
                onClick={() => onContentClick(content)}
              />
            ))}
            {(!contentsByDate[format(selectedDate, 'yyyy-MM-dd')] || 
              contentsByDate[format(selectedDate, 'yyyy-MM-dd')].length === 0) && (
              <div className="text-center py-8 text-gray-500">
                이 날짜에 예정된 콘텐츠가 없습니다.
                <button
                  onClick={() => onDateClick(selectedDate)}
                  className="block mx-auto mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  새 콘텐츠 추가
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// Sub Components
// =====================================================

interface ViewTypeButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

const ViewTypeButton: React.FC<ViewTypeButtonProps> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`
      px-3 py-1 text-sm rounded-lg transition
      ${active 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
    `}
  >
    {label}
  </button>
);

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    purple: 'bg-purple-50 text-purple-700',
    gray: 'bg-gray-50 text-gray-700'
  };

  return (
    <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
};

interface ContentItemProps {
  content: ContentCalendarItem;
  onClick: (e: React.MouseEvent) => void;
}

const ContentItem: React.FC<ContentItemProps> = ({ content, onClick }) => {
  const typeColors = {
    blog: 'bg-blue-100 text-blue-700',
    social: 'bg-purple-100 text-purple-700',
    email: 'bg-green-100 text-green-700',
    funnel: 'bg-orange-100 text-orange-700',
    video: 'bg-red-100 text-red-700'
  };

  const statusIcons = {
    planned: '📝',
    draft: '✏️',
    review: '👀',
    approved: '✅',
    published: '🚀',
    archived: '📦'
  };

  return (
    <div
      onClick={onClick}
      className={`
        px-1.5 py-0.5 rounded text-xs truncate cursor-pointer
        ${typeColors[content.contentType] || 'bg-gray-100 text-gray-700'}
        hover:opacity-80 transition
      `}
      title={content.title}
    >
      <span className="mr-1">{statusIcons[content.status]}</span>
      {content.title}
    </div>
  );
};

interface DetailedContentItemProps {
  content: ContentCalendarItem;
  onClick: () => void;
}

const DetailedContentItem: React.FC<DetailedContentItemProps> = ({ content, onClick }) => {
  const typeLabels = {
    blog: '블로그',
    social: '소셜',
    email: '이메일',
    funnel: '퍼널',
    video: '비디오'
  };

  const statusLabels = {
    planned: '계획됨',
    draft: '초안',
    review: '검토 중',
    approved: '승인됨',
    published: '발행됨',
    archived: '보관됨'
  };

  const statusColors = {
    planned: 'bg-gray-100 text-gray-700',
    draft: 'bg-yellow-100 text-yellow-700',
    review: 'bg-purple-100 text-purple-700',
    approved: 'bg-green-100 text-green-700',
    published: 'bg-blue-100 text-blue-700',
    archived: 'bg-gray-100 text-gray-500'
  };

  return (
    <div
      onClick={onClick}
      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{content.title}</h4>
          {content.subtitle && (
            <p className="text-sm text-gray-500 mt-1">{content.subtitle}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-1 bg-gray-100 rounded">
              {typeLabels[content.contentType]}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${statusColors[content.status]}`}>
              {statusLabels[content.status]}
            </span>
            {content.priority && (
              <span className="text-xs text-gray-500">
                우선순위: {content.priority}
              </span>
            )}
          </div>
        </div>
        <button
          className="ml-4 p-2 hover:bg-gray-100 rounded transition"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ContentCalendarDashboard;
