import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  platform: string;
  scheduled_date: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived' | 'writing' | 'ready';
  assignee?: string;
  topic?: string;
  tags?: string[];
}

interface BlogCalendarProps {
  supabase: any;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-600',
  published: 'bg-green-100 text-green-600',
  archived: 'bg-gray-50 text-gray-400',
  writing: 'bg-yellow-100 text-yellow-600',
  ready: 'bg-purple-100 text-purple-600'
};

const platformColors = {
  '카카오톡': 'bg-yellow-100 text-yellow-700',
  '문자': 'bg-blue-100 text-blue-700',
  '네이버블로그': 'bg-green-100 text-green-700',
  '자사블로그': 'bg-purple-100 text-purple-700',
  '인스타그램': 'bg-pink-100 text-pink-700',
  '유튜브': 'bg-red-100 text-red-700',
  '카카오채널': 'bg-orange-100 text-orange-700',
  '틱톡': 'bg-gray-800 text-white'
};

export const BlogCalendar: React.FC<BlogCalendarProps> = ({ supabase }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // 캘린더 날짜 생성
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // 데이터 로드
  const loadPosts = async () => {
    setLoading(true);
    try {
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('content_ideas')
        .select('*')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true });
      
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supabase) {
      loadPosts();
    }
  }, [currentMonth, supabase]);

  // 날짜별 포스트 그룹핑
  const postsByDate = posts.reduce((acc, post) => {
    const dateKey = format(new Date(post.scheduled_date), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(post);
    return acc;
  }, {} as Record<string, BlogPost[]>);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handlePostClick = (post: BlogPost) => {
    setSelectedPost(post);
  };

  const getDayPosts = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return postsByDate[dateKey] || [];
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* 캘린더 헤더 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              콘텐츠 캘린더
            </h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <h4 className="text-lg font-medium text-gray-900 min-w-[140px] text-center">
                {format(currentMonth, 'yyyy년 M월', { locale: ko })}
              </h4>
              
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                오늘
              </button>
            </div>
          </div>
        </div>

        {/* 캘린더 본체 */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                  <div 
                    key={day} 
                    className={`text-center text-sm font-medium py-2 ${
                      idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {days.map((day, idx) => {
                  const dayPosts = getDayPosts(day);
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const dayOfWeek = day.getDay();
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => handleDateClick(day)}
                      className={`
                        bg-white p-2 min-h-[100px] cursor-pointer transition-colors
                        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                        ${isToday ? 'ring-2 ring-purple-400' : ''}
                        ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}
                      `}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        dayOfWeek === 0 ? 'text-red-500' : 
                        dayOfWeek === 6 ? 'text-blue-500' : 
                        'text-gray-900'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      
                      {/* 포스트 목록 */}
                      <div className="space-y-1">
                        {dayPosts.slice(0, 3).map((post, pIdx) => (
                          <div
                            key={post.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePostClick(post);
                            }}
                            className={`
                              text-xs px-1 py-0.5 rounded truncate cursor-pointer
                              ${platformColors[post.platform] || 'bg-gray-100 text-gray-700'}
                              hover:opacity-80
                            `}
                            title={post.title}
                          >
                            {post.title}
                          </div>
                        ))}
                        {dayPosts.length > 3 && (
                          <div className="text-xs text-gray-500 px-1">
                            +{dayPosts.length - 3}개 더보기
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 선택된 날짜의 상세 포스트 목록 */}
      {selectedDate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold mb-4">
            {format(selectedDate, 'yyyy년 M월 d일', { locale: ko })} 콘텐츠
          </h4>
          
          <div className="space-y-2">
            {getDayPosts(selectedDate).length === 0 ? (
              <p className="text-gray-500 text-center py-4">예정된 콘텐츠가 없습니다.</p>
            ) : (
              getDayPosts(selectedDate).map((post) => (
                <div
                  key={post.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handlePostClick(post)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs rounded ${platformColors[post.platform] || 'bg-gray-100'}`}>
                      {post.platform}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${statusColors[post.status]}`}>
                      {post.status === 'published' ? '발행완료' :
                       post.status === 'ready' ? '발행준비' :
                       post.status === 'writing' ? '작성중' :
                       post.status === 'scheduled' ? '예약' : '초안'}
                    </span>
                  </div>
                  <h5 className="font-medium text-gray-900 mb-1">{post.title}</h5>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>담당: {post.assignee || '미정'}</span>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-1">
                        {post.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-xs">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 포스트 상세 모달 */}
      {selectedPost && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">콘텐츠 상세</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">플랫폼</label>
                <div className="mt-1">
                  <span className={`px-2 py-1 text-sm rounded ${platformColors[selectedPost.platform] || 'bg-gray-100'}`}>
                    {selectedPost.platform}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">제목</label>
                <p className="mt-1">{selectedPost.title}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">담당자</label>
                <p className="mt-1">{selectedPost.assignee || '미정'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">상태</label>
                <div className="mt-1">
                  <span className={`px-2 py-1 text-sm rounded ${statusColors[selectedPost.status]}`}>
                    {selectedPost.status === 'published' ? '발행완료' :
                     selectedPost.status === 'ready' ? '발행준비' :
                     selectedPost.status === 'writing' ? '작성중' :
                     selectedPost.status === 'scheduled' ? '예약' : '초안'}
                  </span>
                </div>
              </div>
              
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">태그</label>
                  <div className="mt-1 flex gap-1 flex-wrap">
                    {selectedPost.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedPost(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};