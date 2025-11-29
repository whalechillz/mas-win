import { useState, useEffect, useMemo } from 'react';

interface CustomCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  minDate: string;
  maxDate: string;
  onNextAvailable?: () => void;
  nextAvailableDate?: string | null;
}

export default function CustomCalendar({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  onNextAvailable,
  nextAvailableDate
}: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>({});

  // 선택된 날짜를 기준으로 현재 월 설정
  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [selectedDate]);

  // 월의 첫 날과 마지막 날
  const monthStart = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  }, [currentMonth]);

  const monthEnd = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  }, [currentMonth]);

  // 달력에 표시할 날짜들 생성
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // 주의 시작일 (일요일)

    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // 주의 마지막일 (토요일)

    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [monthStart, monthEnd]);

  // 이전/다음 월 이동
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // 한국 시간 기준으로 날짜 문자열 생성
  const getDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 한국 시간 기준으로 오늘 날짜 가져오기
  const getKoreaToday = (): Date => {
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    return new Date(koreaTime.getFullYear(), koreaTime.getMonth(), koreaTime.getDate());
  };

  // 날짜가 선택 가능한지 확인
  const isDateSelectable = (date: Date): boolean => {
    const dateStr = getDateString(date);
    return dateStr >= minDate && dateStr <= maxDate;
  };

  // 날짜가 선택된 날짜인지 확인
  const isSelected = (date: Date): boolean => {
    const dateStr = getDateString(date);
    return dateStr === selectedDate;
  };

  // 날짜가 오늘인지 확인 (한국 시간 기준)
  const isToday = (date: Date): boolean => {
    const today = getKoreaToday();
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return (
      dateOnly.getDate() === today.getDate() &&
      dateOnly.getMonth() === today.getMonth() &&
      dateOnly.getFullYear() === today.getFullYear()
    );
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    if (isDateSelectable(date)) {
      const dateStr = getDateString(date);
      onDateSelect(dateStr);
    }
  };

  // 날짜 포맷팅
  const formatDate = (date: Date): string => {
    return date.getDate().toString();
  };

  // 월/년 포맷팅
  const formatMonthYear = (date: Date): string => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  // 요일 헤더
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="w-full">
      {/* 달력 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="이전 달"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-xl font-bold text-gray-900">
          {formatMonthYear(currentMonth)}
        </h2>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="다음 달"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 다음 예약 가능일 버튼 */}
      {onNextAvailable && nextAvailableDate && (
        <div className="mb-4">
          <button
            onClick={onNextAvailable}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            다음 예약 가능일: {nextAvailableDate}
          </button>
        </div>
      )}

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) return <div key={index} className="aspect-square" />;

          const dateStr = getDateString(date);
          const selectable = isDateSelectable(date);
          const selected = isSelected(date);
          const today = isToday(date);
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          
          // 과거 날짜인지 확인
          const koreaToday = getKoreaToday();
          const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const isPast = dateOnly < koreaToday;

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={!selectable}
              className={`
                aspect-square rounded-lg transition-all
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${!selectable ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-gray-100'}
                ${selected 
                  ? 'bg-blue-600 text-white font-bold shadow-lg scale-105' 
                  : today && selectable
                  ? 'bg-blue-50 text-blue-600 font-semibold border-2 border-blue-300'
                  : today && !selectable
                  ? 'bg-gray-100 text-gray-400 line-through'
                  : isPast
                  ? 'text-gray-300 line-through'
                  : selectable
                  ? 'text-gray-700 hover:bg-gray-50'
                  : 'text-gray-400'
                }
              `}
            >
              {formatDate(date)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

