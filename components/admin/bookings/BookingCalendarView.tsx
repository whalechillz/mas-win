import React, { useState, useMemo, useEffect, useRef } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, startOfMonth, endOfMonth, eachWeekOfInterval } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import BookingDetailModal from './BookingDetailModal';
import QuickAddBookingModal from './QuickAddBookingModal';
import BlockTimeModal from './BlockTimeModal';

interface Booking {
  id: string | number;
  name: string;
  phone: string;
  date: string;
  time: string;
  status?: string;
  service_type?: string;
  duration?: number;
}

interface BookingCalendarViewProps {
  bookings: Booking[];
  customers: any[];
  supabase: any;
  onUpdate: () => void;
}

export default function BookingCalendarView({ bookings, customers, supabase, onUpdate }: BookingCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [quickAddModal, setQuickAddModal] = useState<{ date: string; time: string } | null>(null);
  const [blockModal, setBlockModal] = useState<{ date: string; time: string } | null>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [operatingHours, setOperatingHours] = useState<Record<number, any[]>>({});
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 주간 뷰
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // 월간 뷰
  const monthWeeks = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachWeekOfInterval({ start, end }, { weekStartsOn: 0 });
  }, [currentDate]);

  // 날짜별 예약 그룹화
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    bookings.forEach(booking => {
      if (!grouped[booking.date]) {
        grouped[booking.date] = [];
      }
      grouped[booking.date].push(booking);
    });
    return grouped;
  }, [bookings]);

  // 예약 불가 시간대 로드
  useEffect(() => {
    const loadBlocks = async () => {
      try {
        const response = await fetch('/api/bookings/blocks');
        if (response.ok) {
          const data = await response.json();
          setBlocks(data.blocks || []);
        }
      } catch (error) {
        console.error('예약 불가 시간대 로드 오류:', error);
      }
    };
    loadBlocks();
  }, [onUpdate]);

  // 운영시간 로드
  useEffect(() => {
    const loadOperatingHours = async () => {
      try {
        const { data, error } = await supabase
          .from('booking_hours')
          .select('day_of_week, start_time, end_time, is_available')
          .eq('is_available', true)
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true });

        if (!error && data) {
          // 요일별로 그룹화
          const grouped: Record<number, any[]> = {};
          data.forEach(hour => {
            if (!grouped[hour.day_of_week]) {
              grouped[hour.day_of_week] = [];
            }
            grouped[hour.day_of_week].push(hour);
          });
          setOperatingHours(grouped);
        }
      } catch (error) {
        console.error('운영시간 로드 오류:', error);
      }
    };
    loadOperatingHours();
  }, [supabase]);

  // 날짜별 예약 불가 시간대 그룹화
  const blocksByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    blocks.forEach(block => {
      if (!grouped[block.date]) {
        grouped[block.date] = [];
      }
      grouped[block.date].push(block);
    });
    return grouped;
  }, [blocks]);

  // 시간대별 예약 표시
  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookingsByDate[dateStr] || [];
  };

  // 시간대가 차단되었는지 확인 (가상 예약 제외)
  const isTimeBlocked = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayBlocks = blocksByDate[dateStr] || [];
    const [hour, minute] = time.split(':').map(Number);
    
    return dayBlocks.some(block => {
      // 가상 예약은 차단으로 간주하지 않음
      if (block.is_virtual) return false;
      
      const [blockHour, blockMinute] = block.time.split(':').map(Number);
      const blockEnd = blockHour * 60 + blockMinute + (block.duration || 60);
      const timeStart = hour * 60 + minute;
      const timeEnd = timeStart + 60; // 기본 1시간
      
      return (timeStart < blockEnd && timeEnd > blockHour * 60 + blockMinute);
    });
  };

  // 운영시간 확인
  const isOperatingHour = (date: Date, time: string) => {
    const dayOfWeek = date.getDay();
    const dayHours = operatingHours[dayOfWeek] || [];
    const [hour, minute] = time.split(':').map(Number);
    
    return dayHours.some(oh => {
      const [startHour, startMin] = oh.start_time.split(':').map(Number);
      const [endHour, endMin] = oh.end_time.split(':').map(Number);
      
      const timeMin = hour * 60 + minute;
      const startMinTotal = startHour * 60 + startMin;
      const endMinTotal = endHour * 60 + endMin;
      
      return timeMin >= startMinTotal && timeMin < endMinTotal;
    });
  };

  // 차단된 시간대의 block 정보 가져오기
  const getBlockForTime = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayBlocks = blocksByDate[dateStr] || [];
    const [hour, minute] = time.split(':').map(Number);
    
    return dayBlocks.find(block => {
      // 가상 예약은 제외
      if (block.is_virtual) return false;
      
      const [blockHour, blockMinute] = block.time.split(':').map(Number);
      const blockEnd = blockHour * 60 + blockMinute + (block.duration || 60);
      const timeStart = hour * 60 + minute;
      const timeEnd = timeStart + 60; // 기본 1시간
      
      return (timeStart < blockEnd && timeEnd > blockHour * 60 + blockMinute);
    });
  };

  // 가상 예약의 block 정보 가져오기
  const getVirtualBlockForTime = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayBlocks = blocksByDate[dateStr] || [];
    const [hour, minute] = time.split(':').map(Number);
    
    return dayBlocks.find(block => {
      if (!block.is_virtual) return false;
      
      const [blockHour, blockMinute] = block.time.split(':').map(Number);
      const blockEnd = blockHour * 60 + blockMinute + (block.duration || 60);
      const timeStart = hour * 60 + minute;
      const timeEnd = timeStart + 60; // 기본 1시간
      
      return (timeStart < blockEnd && timeEnd > blockHour * 60 + blockMinute);
    });
  };

  // 차단 삭제 핸들러
  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('이 차단을 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/bookings/blocks?id=${blockId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '차단 삭제에 실패했습니다.');
      }

      // 차단 목록 새로고침
      const loadBlocks = async () => {
        try {
          const response = await fetch('/api/bookings/blocks');
          if (response.ok) {
            const data = await response.json();
            setBlocks(data.blocks || []);
          }
        } catch (error) {
          console.error('예약 불가 시간대 로드 오류:', error);
        }
      };
      loadBlocks();
      onUpdate();
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 시간대가 가상 예약인지 확인
  const isVirtualBooking = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayBlocks = blocksByDate[dateStr] || [];
    const [hour, minute] = time.split(':').map(Number);
    
    return dayBlocks.some(block => {
      if (!block.is_virtual) return false;
      
      const [blockHour, blockMinute] = block.time.split(':').map(Number);
      const blockEnd = blockHour * 60 + blockMinute + (block.duration || 60);
      const timeStart = hour * 60 + minute;
      const timeEnd = timeStart + 60; // 기본 1시간
      
      return (timeStart < blockEnd && timeEnd > blockHour * 60 + blockMinute);
    });
  };

  // 시간대 클릭 핸들러 (단일 클릭용)
  const handleSingleClick = (date: Date, hour: number) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    
    const dayBookings = getBookingsForDate(date).filter(b => {
      const bookingHour = parseInt(b.time.split(':')[0]);
      return bookingHour === hour;
    });
    
    if (dayBookings.length === 0 && !isTimeBlocked(date, timeStr)) {
      setQuickAddModal({ date: dateStr, time: timeStr });
    }
  };

  // 시간대 더블클릭 핸들러
  const handleDoubleClick = (date: Date, hour: number) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    setBlockModal({ date: dateStr, time: timeStr });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* 캘린더 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {viewMode === 'week' 
                ? `${format(weekDays[0], 'yyyy년 M월 d일', { locale: ko })} - ${format(weekDays[6], 'M월 d일', { locale: ko })}`
                : format(currentDate, 'yyyy년 M월', { locale: ko })
              }
            </h2>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              오늘
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-sm rounded-lg ${
                viewMode === 'week' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              주간
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 text-sm rounded-lg ${
                viewMode === 'month' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              월간
            </button>
          </div>
        </div>
      </div>

      {/* 캘린더 그리드 */}
      {viewMode === 'week' ? (
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* 시간 헤더 */}
            <div className="grid grid-cols-8 border-b border-gray-200">
              <div className="p-3 border-r border-gray-200 bg-gray-50 font-medium text-sm text-gray-700">
                시간
              </div>
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className={`p-3 border-r border-gray-200 text-center ${
                    isSameDay(day, new Date()) ? 'bg-red-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-xs text-gray-500">{format(day, 'EEE', { locale: ko })}</div>
                  <div className={`text-lg font-semibold mt-1 ${
                    isSameDay(day, new Date()) ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* 시간대별 예약 */}
            <div className="divide-y divide-gray-200">
              {Array.from({ length: 10 }, (_, i) => i + 9).map(hour => (
                <div key={hour} className="grid grid-cols-8">
                  <div className="p-2 border-r border-gray-200 bg-gray-50 text-sm text-gray-600 text-center">
                    {hour}:00
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const dayBookings = getBookingsForDate(day).filter(b => {
                      const bookingHour = parseInt(b.time.split(':')[0]);
                      return bookingHour === hour;
                    });
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                    const blocked = isTimeBlocked(day, timeStr);
                    const virtual = isVirtualBooking(day, timeStr);
                    const blockInfo = blocked ? getBlockForTime(day, timeStr) : null;
                    const virtualBlockInfo = virtual ? getVirtualBlockForTime(day, timeStr) : null;

                    const isOperating = isOperatingHour(day, timeStr);
                    
                    // 운영시간이 있는 빈 슬롯 (예약/차단 없음)
                    const isAvailableSlot = isOperating && !blocked && !virtual && dayBookings.length === 0;
                    
                    // 운영시간이 없는 슬롯
                    const isNonOperatingSlot = !isOperating;
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`p-1 border-r border-gray-200 min-h-[60px] relative group ${
                          isNonOperatingSlot 
                            ? 'bg-gray-100 opacity-50 hover:opacity-70 cursor-pointer' // 운영시간 없음: 클릭 가능하도록 변경
                            : isAvailableSlot
                            ? 'border-dashed border-2 border-blue-400 bg-blue-100/50 hover:bg-blue-200/70 cursor-pointer' // 빈 슬롯: 점선 + 밝은 배경
                            : isOperating
                            ? 'border-dashed border-blue-300 bg-blue-50/30' // 운영시간 있음: 기본 점선
                            : 'bg-white'
                        }`}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // 운영시간 체크 제거 - 모든 슬롯 차단 가능
                          // if (!isOperating) {
                          //   alert('운영시간이 설정되지 않은 시간대는 차단할 수 없습니다.');
                          //   return;
                          // }
                          
                          // 타이머 취소
                          if (clickTimerRef.current) {
                            clearTimeout(clickTimerRef.current);
                            clickTimerRef.current = null;
                          }
                          // 차단된 시간이면 삭제, 아니면 차단 설정
                          if (blocked && blockInfo) {
                            handleDeleteBlock(blockInfo.id);
                          } else if (virtual && virtualBlockInfo) {
                            handleDeleteBlock(virtualBlockInfo.id);
                          } else {
                            handleDoubleClick(day, hour);
                          }
                        }}
                        onClick={(e) => {
                          // 운영시간 체크 제거 - 모든 슬롯 클릭 가능
                          // if (!isOperating) {
                          //   return;
                          // }
                          
                          // 차단된 시간을 클릭하면 삭제 확인
                          if (blocked && blockInfo) {
                            e.stopPropagation();
                            if (confirm('이 차단을 삭제하시겠습니까?')) {
                              handleDeleteBlock(blockInfo.id);
                            }
                            return;
                          }
                          // 가상 예약을 클릭하면 삭제 확인
                          if (virtual && virtualBlockInfo) {
                            e.stopPropagation();
                            if (confirm('이 가상 예약을 삭제하시겠습니까?')) {
                              handleDeleteBlock(virtualBlockInfo.id);
                            }
                            return;
                          }
                          
                          // 타이머가 있으면 취소 (더블클릭 가능성)
                          if (clickTimerRef.current) {
                            clearTimeout(clickTimerRef.current);
                            clickTimerRef.current = null;
                            // 더블클릭으로 처리
                            handleDoubleClick(day, hour);
                            return;
                          }
                          
                          // 단일 클릭인지 확인하기 위해 짧은 지연
                          clickTimerRef.current = setTimeout(() => {
                            clickTimerRef.current = null;
                            // 운영시간 체크 제거 - 모든 빈 슬롯에서 예약 추가 가능
                            if (dayBookings.length === 0 && !blocked && !virtual) {
                              handleSingleClick(day, hour);
                            }
                          }, 300); // 300ms 내에 두 번째 클릭이 오면 더블클릭
                        }}
                      >
                        {blocked ? (
                          <div className="mb-1 p-2 rounded text-xs bg-gray-300 border border-gray-400 cursor-pointer hover:bg-gray-400 group/block">
                            <div className="font-medium text-gray-700 group-hover/block:text-white">차단됨</div>
                            <div className="text-gray-600 text-[10px] group-hover/block:text-gray-200">{blockInfo?.location || 'Massgoo Studio'}</div>
                            {blockInfo?.reason && (
                              <div className="text-gray-500 text-[10px] mt-1 group-hover/block:text-gray-300">{blockInfo.reason}</div>
                            )}
                            <div className="text-[9px] text-gray-500 mt-1 group-hover/block:text-gray-300">클릭: 삭제</div>
                          </div>
                        ) : virtual ? (
                          <div className="mb-1 p-2 rounded text-xs bg-yellow-100 border border-yellow-300 cursor-pointer hover:bg-yellow-200 group/virtual">
                            <div className="font-medium text-yellow-800">가상 예약</div>
                            <div className="text-yellow-700 text-[10px]">고객에게만 표시</div>
                            <div className="text-[9px] text-yellow-600 mt-1">클릭: 삭제</div>
                          </div>
                        ) : isAvailableSlot ? (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="text-xs text-blue-600 font-medium text-center">
                              빈 슬롯
                              <br />
                              <span className="text-[10px] text-gray-500">더블클릭: 차단</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            {dayBookings.map(booking => (
                              <div
                                key={booking.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBooking(booking);
                                }}
                                className={`mb-1 p-2 rounded text-xs cursor-pointer hover:shadow-md transition-shadow ${
                                  booking.status === 'confirmed' ? 'bg-blue-100 border border-blue-300' :
                                  booking.status === 'completed' ? 'bg-green-100 border border-green-300' :
                                  booking.status === 'cancelled' ? 'bg-red-100 border border-red-300' :
                                  'bg-yellow-100 border border-yellow-300'
                                }`}
                              >
                                <div className="font-medium text-gray-900 truncate">{booking.name}</div>
                                <div className="text-gray-600">{booking.time}</div>
                              </div>
                            ))}
                            {dayBookings.length === 0 && (
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="text-xs text-gray-400">클릭: 예약 추가 | 더블클릭: 차단</div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-700 bg-gray-50 rounded">
                {day}
              </div>
            ))}
            {monthWeeks.map((weekStart, weekIndex) => {
              const weekDays = eachDayOfInterval({
                start: weekStart,
                end: endOfWeek(weekStart, { weekStartsOn: 0 })
              });
              return weekDays.map((day, dayIndex) => {
                const dayBookings = getBookingsForDate(day);
                const isCurrentMonth = format(day, 'M') === format(currentDate, 'M');
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`min-h-[100px] p-2 border border-gray-200 rounded ${
                      !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                    } ${isToday ? 'ring-2 ring-red-500' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isToday ? 'text-red-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map(booking => (
                        <div
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`p-1 rounded text-xs cursor-pointer truncate ${
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {booking.time} {booking.name}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayBookings.length - 3}개 더
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>
      )}

      {/* 예약 상세 모달 */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          customers={customers}
          supabase={supabase}
          onClose={() => setSelectedBooking(null)}
          onUpdate={onUpdate}
        />
      )}

      {/* 빠른 예약 추가 모달 */}
      {quickAddModal && (
        <QuickAddBookingModal
          date={quickAddModal.date}
          time={quickAddModal.time}
          supabase={supabase}
          customers={customers}
          onClose={() => setQuickAddModal(null)}
          onSuccess={onUpdate}
        />
      )}

      {/* 예약 불가 시간 설정 모달 */}
      {blockModal && (
        <BlockTimeModal
          date={blockModal.date}
          time={blockModal.time}
          onClose={() => setBlockModal(null)}
          onSuccess={onUpdate}
        />
      )}
    </div>
  );
}

