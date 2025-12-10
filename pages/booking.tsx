import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { detectCustomerSegment, getSegmentMessage, getSegmentUIOptions } from '../lib/customer-segment-detector';
import CustomCalendar from '../components/booking/CustomCalendar';

interface AvailableTime {
  available_time: string;
}

interface CalendarData {
  start: string;
  end: string;
  bookings: Record<string, any[]>;
}

const formatDateWithDay = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} (${dayOfWeek})`;
};

export default function Booking() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [virtualTimes, setVirtualTimes] = useState<string[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [customerSegment, setCustomerSegment] = useState<'new' | 'returning' | 'vip'>('new');
  const [segmentMessage, setSegmentMessage] = useState<any>(null);
  const [uiOptions, setUIOptions] = useState<any>(null);
  const [minDate, setMinDate] = useState<string>('');
  const [maxDate, setMaxDate] = useState<string>('');
  const [nextAvailableDate, setNextAvailableDate] = useState<string | null>(null);
  const [nextAvailableFormatted, setNextAvailableFormatted] = useState<string | null>(null);

  // 최소 날짜는 설정에 따라 동적으로 계산
  useEffect(() => {
    const calculateMinDate = async () => {
      try {
        const response = await fetch('/api/bookings/settings');
        if (response.ok) {
          const settings = await response.json();
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let minDate = new Date(today);
          
          // 당일 예약 불가면 내일부터
          if (settings.disable_same_day_booking) {
            minDate.setDate(minDate.getDate() + 1);
          }
          
          // 최소 사전 예약 시간 고려
          if (settings.min_advance_hours > 0) {
            const hoursFromNow = settings.min_advance_hours;
            const minDateWithHours = new Date();
            minDateWithHours.setHours(minDateWithHours.getHours() + hoursFromNow);
            
            // 더 늦은 날짜 선택
            if (minDateWithHours > minDate) {
              minDate = new Date(minDateWithHours);
              minDate.setHours(0, 0, 0, 0);
            }
          }
          
          const minDateStr = minDate.toISOString().split('T')[0];
          setMinDate(minDateStr);
          
          // 최대 날짜는 예약 가능 기간 제한 적용
          const maxAdvanceDays = settings.max_advance_days || 14;
          const maxDateCalc = new Date(today);
          maxDateCalc.setDate(maxDateCalc.getDate() + maxAdvanceDays);
          setMaxDate(maxDateCalc.toISOString().split('T')[0]);
          
          // 최소 날짜로 자동 설정
          setSelectedDate(minDateStr);
          
          // 다음 예약 가능일 조회
          fetchNextAvailable();
        }
      } catch (err) {
        // 기본값: 내일
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        setMinDate(tomorrowStr);
        setSelectedDate(tomorrowStr);
        
        const maxDateCalc = new Date();
        maxDateCalc.setDate(maxDateCalc.getDate() + 14); // 기본값 14일
        setMaxDate(maxDateCalc.toISOString().split('T')[0]);
      }
    };
    
    calculateMinDate();
  }, []);

  // URL 쿼리에서 전화번호로 고객 정보 조회 (선택사항)
  useEffect(() => {
    const { phone } = router.query;
    if (phone && typeof phone === 'string') {
      fetchCustomerSegment(phone);
    }
  }, [router.query]);

  // 날짜 선택 시 예약 가능한 시간 조회
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimes(selectedDate);
    }
  }, [selectedDate]);

  // 다음 예약 가능일 조회 (초기 로드 및 설정 변경 시)
  useEffect(() => {
    fetchNextAvailable();
  }, []);

  const fetchCustomerSegment = async (phone: string) => {
    try {
      const response = await fetch(`/api/bookings/customer/${encodeURIComponent(phone)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.customer) {
          const segment = detectCustomerSegment(data.customer);
          const message = getSegmentMessage(segment, data.customer);
          const options = getSegmentUIOptions(segment);
          
          setCustomerSegment(segment);
          setSegmentMessage(message);
          setUIOptions(options);
        }
      }
    } catch (err) {
      // 고객 정보가 없어도 계속 진행
      console.log('Customer segment detection failed');
    }
  };

  const [restrictionMessage, setRestrictionMessage] = useState<string>('');
  const [showCallMessage, setShowCallMessage] = useState<boolean>(false);

  const fetchNextAvailable = async () => {
    try {
      // 캐시 방지를 위해 타임스탬프 추가
      const response = await fetch(`/api/bookings/next-available?duration=60&_t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setNextAvailableDate(data.date);
        setNextAvailableFormatted(data.formatted_date);
      } else {
        // 404인 경우 다음 예약 가능일이 없음
        setNextAvailableDate(null);
        setNextAvailableFormatted(null);
      }
    } catch (err) {
      // 다음 예약 가능일을 찾지 못해도 계속 진행
      console.log('Next available date not found:', err);
      setNextAvailableDate(null);
      setNextAvailableFormatted(null);
    }
  };

  const handleNextAvailableClick = async () => {
    // 항상 최신 정보를 가져오기 위해 다시 조회
    const response = await fetch(`/api/bookings/next-available?duration=60&_t=${Date.now()}`);
    if (response.ok) {
      const data = await response.json();
      const newNextDate = data.date;
      if (newNextDate) {
        setNextAvailableDate(newNextDate);
        setNextAvailableFormatted(data.formatted_date);
        setSelectedDate(newNextDate);
        await fetchAvailableTimes(newNextDate);
      }
    }
  };

  const fetchAvailableTimes = async (date: string, autoMoveToNext: boolean = false, depth: number = 0) => {
    // 무한 루프 방지: 최대 14일까지만 자동 이동
    if (depth > 14) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setSelectedTime('');
    setRestrictionMessage('');
    
    try {
      const response = await fetch(`/api/bookings/available?date=${date}&duration=60`);
      if (!response.ok) {
        throw new Error('예약 가능한 시간을 불러올 수 없습니다.');
      }
      
      const data = await response.json();
      
      // 예약 가능한 시간이 없고, 제한 메시지도 없으면 다음 예약 가능일로 자동 이동
      if (autoMoveToNext && (data.available_times || []).length === 0 && !data.restriction) {
        // 다음 예약 가능일 찾기 (선택된 날짜 다음날부터 검색)
        const selectedDateObj = new Date(date);
        selectedDateObj.setDate(selectedDateObj.getDate() + 1);
        const fromDateStr = selectedDateObj.toISOString().split('T')[0];
        
        // 다음 예약 가능일 API 호출 (특정 날짜 이후부터 검색)
        const nextResponse = await fetch(`/api/bookings/next-available?duration=60&from_date=${fromDateStr}&_t=${Date.now()}`);
        
        if (nextResponse.ok) {
          const nextData = await nextResponse.json();
          if (nextData.date && nextData.date !== date) {
            // 다음 예약 가능일로 자동 이동
            setSelectedDate(nextData.date);
            // 재귀 호출 (깊이 증가, autoMoveToNext=false로 설정하여 한 번만 이동)
            await fetchAvailableTimes(nextData.date, false, depth + 1);
            return;
          }
        }
      }
      
      // API에서 이미 정렬된 데이터를 받으므로 그대로 설정
      setAvailableTimes(data.available_times || []);
      setVirtualTimes(data.virtual_times || []); // 가상 예약 시간
      setBookedTimes(data.booked_times || []); // 실제 예약 시간
      setBlockedTimes(data.blocked_times || []); // 차단된 시간
      
      // 제한 메시지 표시
      if (data.restriction && data.message) {
        setRestrictionMessage(data.message);
      }
      
      // "전화 주세요" 메시지 표시 여부만 설정 (메시지 내용은 고정)
      setShowCallMessage(data.show_call_message || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setAvailableTimes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    // 날짜 선택 시 자동으로 다음 예약 가능일로 이동 (예약 가능한 시간이 없으면)
    fetchAvailableTimes(date, true);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  // 시간 정렬 함수 (useMemo에서 사용)
  const sortTimes = (times: string[]) => {
    return [...times].sort((a, b) => {
      const [aHour, aMin] = a.split(':').map(Number);
      const [bHour, bMin] = b.split(':').map(Number);
      if (aHour !== bHour) return aHour - bHour;
      return aMin - bMin;
    });
  };

  // 정렬된 시간 배열 메모이제이션
  const sortedAvailableTimes = useMemo(() => sortTimes(availableTimes), [availableTimes]);
  const sortedVirtualTimes = useMemo(() => sortTimes(virtualTimes), [virtualTimes]);
  const sortedBookedTimes = useMemo(() => sortTimes(bookedTimes), [bookedTimes]);
  
  // 가상 예약, 실제 예약, 차단된 시간 통합 (중복 제거 및 정렬)
  const sortedUnavailableTimes = useMemo(() => {
    const combined = [...new Set([...virtualTimes, ...bookedTimes, ...blockedTimes])]
      .filter(time => !availableTimes.includes(time));
    return sortTimes(combined);
  }, [virtualTimes, bookedTimes, blockedTimes, availableTimes]);

  const handleNext = () => {
    if (!selectedDate || !selectedTime) {
      setError('날짜와 시간을 모두 선택해주세요.');
      return;
    }
    
    router.push({
      pathname: '/booking/form',
      query: {
        date: selectedDate,
        time: selectedTime
      }
    });
  };


  return (
    <>
      <Head>
        <title>시타 예약 - 날짜 및 시간 선택 | 마쓰구골프</title>
        <meta name="description" content="KGFA 1급 시타 체험 예약. 원하시는 날짜와 시간을 선택해주세요." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center">
                <div className="relative h-8 w-auto max-w-[140px]">
                  <Image
                    src="/main/logo/massgoo_logo_black.png"
                    alt="MASSGOO 로고"
                    width={140}
                    height={32}
                    priority
                    className="h-8 w-auto object-contain max-w-full"
                  />
                </div>
              </Link>
              <Link href="/try-a-massgoo" className="text-gray-700 hover:text-gray-900">
                ← 돌아가기
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* 고객 세그먼트별 맞춤 메시지 */}
          {segmentMessage && (
            <div className={`mb-6 p-6 rounded-lg shadow-md ${
              customerSegment === 'vip' 
                ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300'
                : customerSegment === 'returning'
                ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300'
                : 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300'
            }`}>
              <div className="flex items-start gap-4">
                {customerSegment === 'vip' && <span className="text-3xl">👑</span>}
                {customerSegment === 'returning' && <span className="text-3xl">👋</span>}
                {customerSegment === 'new' && <span className="text-3xl">🎯</span>}
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-2 ${
                    customerSegment === 'vip' ? 'text-purple-900'
                    : customerSegment === 'returning' ? 'text-blue-900'
                    : 'text-gray-900'
                  }`}>
                    {segmentMessage.greeting}
                  </h3>
                  <p className={`text-sm ${
                    customerSegment === 'vip' ? 'text-purple-700'
                    : customerSegment === 'returning' ? 'text-blue-700'
                    : 'text-gray-700'
                  }`}>
                    {segmentMessage.valueProp}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2 text-gray-900">시타 예약</h1>
              <p className="text-gray-600">원하시는 날짜와 시간을 선택해주세요</p>
            </div>

            {/* 진행 단계 표시 */}
            <div className="mb-8 flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">날짜/시간 선택</span>
              </div>
              <div className="w-8 sm:w-12 h-0.5 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-sm">2</div>
                <span className="text-xs sm:text-sm text-gray-500">정보 입력</span>
              </div>
              <div className="w-8 sm:w-12 h-0.5 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-sm">3</div>
                <span className="text-xs sm:text-sm text-gray-500">완료</span>
              </div>
            </div>

            {/* 날짜 선택 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                날짜 선택
              </label>
              
              {minDate ? (
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <CustomCalendar
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    minDate={minDate}
                    maxDate={maxDate}
                    onNextAvailable={handleNextAvailableClick}
                    nextAvailableDate={nextAvailableFormatted}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  날짜 선택 정보를 불러오는 중...
                </div>
              )}
            </div>

            {/* 시간 선택 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시간 선택
              </label>
              
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  예약 가능한 시간을 불러오는 중...
                </div>
              ) : restrictionMessage ? (
                <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <p className="text-gray-800 font-medium mb-2">{restrictionMessage}</p>
                  {showCallMessage && (
                    <>
                      <a
                        href="tel:031-215-0013"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-3"
                      >
                        📞 031-215-0013 전화하기
                      </a>
                      <p className="text-sm text-gray-600">
                        운영시간: 평일 9:00-17:00
                      </p>
                    </>
                  )}
                </div>
              ) : availableTimes.length === 0 ? (
                showCallMessage ? (
                  <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg text-center">
                    <div className="text-4xl mb-4">📞</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      원하시는 시간에 예약이 어려우신가요?
                    </h3>
                    <a
                      href="tel:031-215-0013"
                      className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-3"
                    >
                      📞 031-215-0013 전화하기
                    </a>
                    <p className="text-sm text-gray-600">
                      운영시간: 평일 9:00-17:00
                    </p>
                  </div>
                ) : (
                  <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <p className="text-gray-600">예약 가능한 시간이 없습니다.</p>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {/* 모든 시간을 시간 순서대로 표시 (예약 가능 + 예약 불가) */}
                  {sortTimes([...sortedAvailableTimes, ...sortedUnavailableTimes]).map((time) => {
                    const isAvailable = sortedAvailableTimes.includes(time);
                    const isVirtual = virtualTimes.includes(time);
                    const isBooked = bookedTimes.includes(time);
                    const isBlocked = blockedTimes.includes(time);
                    
                    // 예약 가능한 시간
                    if (isAvailable) {
                      const isSelected = selectedTime === time;
                      const primaryColor = uiOptions?.primaryColor || 'blue';
                      const bgColor = isSelected 
                        ? primaryColor === 'purple' ? 'bg-purple-600'
                          : primaryColor === 'blue' ? 'bg-blue-600'
                          : 'bg-blue-600'
                        : 'bg-gray-100';
                      
                      return (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all transform hover:scale-105 text-sm sm:text-base relative ${
                            isSelected
                              ? `${bgColor} text-white shadow-lg`
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    }
                    
                    // 예약 불가한 시간 (가상 예약, 실제 예약, 차단된 시간)
                    return (
                      <button
                        key={time}
                        disabled
                        className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base relative bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
                        title={
                          isBlocked ? '매진' : 
                          isVirtual ? '가상 예약 (고객에게만 표시)' : 
                          '실제 예약됨'
                        }
                      >
                        {/* 시간과 매진 텍스트를 세로로 배치 */}
                        <div className="flex flex-col items-center justify-center h-full">
                          {/* 시간 표시 */}
                          <span className="mb-2">{time}</span>
                          {/* 매진 텍스트 (차단된 경우) */}
                          {isBlocked && (
                            <span className="text-xs text-red-500 font-semibold">
                              매진
                            </span>
                          )}
                        </div>
                        {/* X 표시 (오른쪽 위) */}
                        <span className="absolute top-1 right-1 text-gray-500 text-lg font-bold leading-none">
                          ✕
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 에러 메시지 */}
            {error && selectedDate && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
                {error}
              </div>
            )}

            {/* 선택된 정보 표시 */}
            {selectedDate && selectedTime && (
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">선택된 예약 정보</p>
                <p className="font-semibold text-gray-900">
                  {formatDateWithDay(selectedDate)} {selectedTime}
                </p>
              </div>
            )}

            {/* 다음 단계 버튼 */}
            <div className="flex justify-between">
              <Link
                href="/try-a-massgoo"
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </Link>
              <button
                onClick={handleNext}
                disabled={!selectedDate || !selectedTime}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:transform-none text-sm sm:text-base ${
                  uiOptions?.primaryColor === 'purple'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : uiOptions?.primaryColor === 'blue'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:bg-gray-300 disabled:cursor-not-allowed`}
              >
                다음 단계 →
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
