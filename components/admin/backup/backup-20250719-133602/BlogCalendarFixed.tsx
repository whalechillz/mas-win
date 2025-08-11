import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';

interface BlogPost {
  id: string;
  title: string;
  platform_id?: string;
  platform_name?: string;
  platform_type?: string;
  scheduled_date: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived' | 'idea' | 'writing' | 'ready';
  author_id?: string;
  category_id?: string;
  category_name?: string;
  category_color?: string;
  assignee?: string;
  platform?: string;
}

interface BlogCalendarProps {
  blogPosts: BlogPost[];
  platforms?: any[];
  categories?: any[];
  onEdit?: (post: BlogPost) => void;
  onRefresh?: () => void;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-600',
  published: 'bg-green-100 text-green-600',
  archived: 'bg-gray-50 text-gray-400',
  idea: 'bg-purple-100 text-purple-600',
  writing: 'bg-yellow-100 text-yellow-600',
  ready: 'bg-blue-100 text-blue-600'
};

const statusLabels = {
  draft: '초안',
  scheduled: '예약',
  published: '발행',
  archived: '보관',
  idea: '아이디어',
  writing: '작성중',
  ready: '발행준비'
};

const platformIcons: Record<string, string> = {
  website: '🌐',
  naver: 'N',
  google_ads: 'G',
  naver_ads: 'N',
  instagram: '📷',
  facebook: 'f',
  youtube: '▶️',
  shorts: '📱',
  '네이버블로그': '📝',
  '카카오톡': '💬',
  '문자': '📱',
  '자사블로그': '🌐',
  '인스타그램': '📷',
  '유튜브': '▶️',
  blog: '📝',
  kakao: '💬',
  sms: '📱'
};

export const BlogCalendarFixed: React.FC<BlogCalendarProps> = ({ 
  blogPosts = [], 
  platforms = [], 
  categories = [],
  onEdit,
  onRefresh 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 날짜별 포스트 그룹핑
  const postsByDate = blogPosts.reduce((acc, post) => {
    if (!post.scheduled_date) return acc;
    const dateKey = format(new Date(post.scheduled_date), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(post);
    return acc;
  }, {} as Record<string, BlogPost[]>);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handlePostClick = (post: BlogPost) => {
    if (onEdit) {
      onEdit(post);
    }
  };

  const getDayPosts = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return postsByDate[dateKey] || [];
  };

  const getPlatformIcon = (post: BlogPost) => {
    return platformIcons[post.platform_type || ''] || 
           platformIcons[post.platform || ''] || 
           '📄';
  };

  const getPlatformName = (post: BlogPost) => {
    return post.platform_name || post.platform || '기타';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* 캘린더 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">콘텐츠 캘린더</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h4 className="text-lg font-medium text-gray-900 min-w-[140px] text-center">
              {format(currentMonth, 'yyyy년 M월', { locale: ko })}
            </h4>
            
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              오늘
            </button>

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="새로고침"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 범례 */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">상태:</span>
            {Object.entries(statusColors).map(([status, className]) => (
              <div key={status} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${className.split(' ')[0]}`} />
                <span className="text-gray-600">
                  {statusLabels[status as keyof typeof statusLabels]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 캘린더 그리드 */}
      <div className="p-6">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
            <div 
              key={day} 
              className={`text-center text-sm font-medium py-2 ${
                index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-2">
          {/* 첫 주 빈 날짜 채우기 */}
          {Array.from({ length: monthStart.getDay() }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* 실제 날짜들 */}
          {days.map((date) => {
            const dayPosts = getDayPosts(date);
            const isToday = isSameDay(date, new Date());
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const dayOfWeek = date.getDay();
            
            return (
              <div
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className={`
                  aspect-square border rounded-lg p-2 cursor-pointer transition-all
                  ${isToday ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}
                  ${isSelected ? 'ring-2 ring-purple-500' : ''}
                  ${dayPosts.length > 0 ? 'bg-gray-50' : 'bg-white'}
                `}
              >
                <div className="h-full flex flex-col">
                  <div className={`text-sm font-medium mb-1 ${
                    dayOfWeek === 0 ? 'text-red-600' : 
                    dayOfWeek === 6 ? 'text-blue-600' : 
                    'text-gray-900'
                  }`}>
                    {format(date, 'd')}
                  </div>
                  
                  {/* 포스트 미리보기 */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {dayPosts.slice(0, 3).map((post, idx) => (
                      <div
                        key={post.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePostClick(post);
                        }}
                        className={`
                          text-xs px-1.5 py-0.5 rounded truncate cursor-pointer
                          ${statusColors[post.status] || statusColors.draft} hover:opacity-80
                        `}
                        title={post.title}
                      >
                        <span className="mr-1">{getPlatformIcon(post)}</span>
                        {post.title}
                      </div>
                    ))}
                    {dayPosts.length > 3 && (
                      <div className="text-xs text-gray-500 px-1.5">
                        +{dayPosts.length - 3}개 더
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 선택된 날짜의 포스트 목록 */}
      {selectedDate && (
        <div className="border-t border-gray-200 p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            {format(selectedDate, 'M월 d일', { locale: ko })} 콘텐츠
          </h4>
          <div className="space-y-2">
            {getDayPosts(selectedDate).length > 0 ? (
              getDayPosts(selectedDate).map((post) => (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-lg font-medium border border-gray-200">
                      {getPlatformIcon(post)}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{post.title}</h5>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{getPlatformName(post)}</span>
                        {post.category_name && (
                          <>
                            <span>•</span>
                            <span style={{ color: post.category_color || '#6B7280' }}>
                              {post.category_name}
                            </span>
                          </>
                        )}
                        {post.assignee && (
                          <>
                            <span>•</span>
                            <span>{post.assignee}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${statusColors[post.status] || statusColors.draft}`}>
                    {statusLabels[post.status as keyof typeof statusLabels] || post.status}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                이 날짜에 예정된 콘텐츠가 없습니다.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};