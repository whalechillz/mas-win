import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CheckDistance() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 오늘 날짜를 기본값으로 설정
  useEffect(() => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setSelectedDate(dateStr);
  }, []);

  // 날짜 선택 시 예약 가능한 시간 조회
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimes(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailableTimes = async (date: string) => {
    setLoading(true);
    setError('');
    setSelectedTime('');
    
    try {
      const response = await fetch(`/api/bookings/available?date=${date}&duration=60`);
      if (!response.ok) {
        throw new Error('예약 가능한 시간을 불러올 수 없습니다.');
      }
      
      const data = await response.json();
      setAvailableTimes(data.available_times || []);
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

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleNext = () => {
    if (!selectedDate || !selectedTime) {
      setError('날짜와 시간을 모두 선택해주세요.');
      return;
    }
    
    router.push({
      pathname: '/booking/form',
      query: {
        date: selectedDate,
        time: selectedTime,
        service: 'check-distance'
      }
    });
  };

  // 최소 날짜는 오늘
  const today = new Date().toISOString().split('T')[0];
  // 최대 날짜는 3개월 후
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <>
      <Head>
        <title>만족스런 비거리를 점검해 보세요 - 시타 예약 | 마쓰구골프</title>
        <meta name="description" content="현재 비거리를 점검하고 개선 가능성을 확인하세요. 전문 피터가 직접 분석해드립니다." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center">
                <div className="text-xl font-bold text-gray-900">MASSGOO</div>
              </Link>
              <Link href="/try-a-massgoo" className="text-gray-700 hover:text-gray-900">
                ← 돌아가기
              </Link>
            </div>
          </div>
        </header>

        {/* 히어로 섹션 */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                만족스런 비거리를 점검해 보세요
              </h1>
              <p className="text-xl md:text-2xl mb-6 text-blue-100">
                현재 비거리를 정확히 측정하고 개선 가능성을 확인하세요
              </p>
              <p className="text-lg text-blue-50">
                데이터 기반 분석으로 비거리 개선 포인트를 찾아드립니다
              </p>
            </div>
          </div>
        </section>

        {/* 예약 섹션 */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">예약 날짜 및 시간 선택</h2>
              <p className="text-gray-600 mb-8">
                예약 가능한 시간대를 확인하고 날짜 및 시간을 선택하세요.
              </p>

              {/* 날짜 선택 */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  날짜 선택
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  min={today}
                  max={maxDateStr}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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
                ) : availableTimes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {error || '선택하신 날짜에 예약 가능한 시간이 없습니다.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                          selectedTime === time
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
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
                    {selectedDate} {selectedTime}
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
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  다음 단계 →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 서비스 특징 */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                비거리 점검 서비스 특징
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-5xl mb-4">📊</div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">정확한 측정</h3>
                  <p className="text-gray-600">
                    최신 장비로 현재 비거리를 정확하게 측정합니다
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-5xl mb-4">📈</div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">개선 가능성 분석</h3>
                  <p className="text-gray-600">
                    데이터 기반으로 비거리 개선 포인트를 찾아드립니다
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-5xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">맞춤형 솔루션</h3>
                  <p className="text-gray-600">
                    개인별 스윙 특성에 맞는 클럽 추천을 받으실 수 있습니다
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

