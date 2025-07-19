'use client';

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  scheduled_date: string;
  status: 'draft' | 'scheduled' | 'published';
  platform?: string;
}

interface BlogCalendarProps {
  blogPosts?: BlogPost[];
  onEdit?: (post: BlogPost) => void;
  onRefresh?: () => void;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-600',
  published: 'bg-green-100 text-green-600'
};

const BlogCalendarSimple: React.FC<BlogCalendarProps> = ({ 
  blogPosts = [], 
  onEdit,
  onRefresh 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const getDayPosts = (date: Date) => {
    return blogPosts.filter(post => {
      const postDate = new Date(post.scheduled_date);
      return isSameDay(postDate, date);
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(isSameDay(date, selectedDate || new Date()) ? null : date);
  };

  return (
    <div className="bg-white rounded-lg">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          콘텐츠 캘린더
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-medium min-w-[150px] text-center">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayPosts = getDayPosts(day);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(day)}
              className={`
                min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all
                ${!isSameMonth(day, currentDate) ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                ${isToday ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
                ${isSelected ? 'bg-blue-50' : ''}
                hover:bg-gray-50
              `}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayPosts.slice(0, 2).map((post) => (
                  <div
                    key={post.id}
                    className={`text-xs px-1 py-0.5 rounded truncate ${statusColors[post.status]}`}
                  >
                    {post.title}
                  </div>
                ))}
                {dayPosts.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayPosts.length - 2} 더보기
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 선택된 날짜의 포스트 목록 */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">
            {format(selectedDate, 'M월 d일', { locale: ko })} 콘텐츠
          </h4>
          {getDayPosts(selectedDate).length > 0 ? (
            <div className="space-y-2">
              {getDayPosts(selectedDate).map((post) => (
                <div
                  key={post.id}
                  onClick={() => onEdit?.(post)}
                  className="p-3 bg-white rounded-lg hover:shadow-sm cursor-pointer transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">{post.title}</h5>
                      <p className="text-sm text-gray-500">{post.platform || '블로그'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[post.status]}`}>
                      {post.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              이 날짜에 예정된 콘텐츠가 없습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogCalendarSimple;