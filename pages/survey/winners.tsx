import Head from 'next/head';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';

type Winner = {
  id: string;
  name: string;
  phone: string;
  selected_model: string;
  important_factors: string[];
  is_winner: boolean;
  event_winner: boolean;
  gift_delivered: boolean;
  created_at: string;
};

export default function WinnersPage() {
  const router = useRouter();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'winner' | 'gift'>('all');
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 당첨자 목록 조회
  useEffect(() => {
    const fetchWinners = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/survey/winners?type=${filter}&campaign_source=muziik-survey-2025`);
        const data = await res.json();
        
        if (data.success) {
          setWinners(data.data.winners || []);
          setCurrentGroupIndex(0); // 필터 변경 시 첫 그룹으로 리셋
        }
      } catch (error) {
        console.error('당첨자 명단 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWinners();
  }, [filter]);

  // 모바일: 3~5명씩 그룹으로 나누기
  const groupSize = 5;
  const groups = useMemo(() => {
    const result = [];
    for (let i = 0; i < winners.length; i += groupSize) {
      result.push(winners.slice(i, i + groupSize));
    }
    return result;
  }, [winners]);

  // 자동 스크롤 (모바일, 5초마다)
  useEffect(() => {
    if (!isMobile || groups.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentGroupIndex((prev) => (prev + 1) % groups.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isMobile, groups.length]);

  // 전화번호 포맷팅
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    return phone;
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <Head>
        <title>MASSGOO X MUZIIK 설문 조사 당첨자 명단 | 마쓰구골프</title>
        <meta name="description" content="MASSGOO X MUZIIK 설문 조사 당첨자 명단을 확인하세요." />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        {/* 헤더 */}
        <section className="py-12 md:py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent">
                축하 드립니다! 🎉
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8">
              MASSGOO X MUZIIK 설문 조사 당첨자 명단
            </p>
          </div>
        </section>

        {/* 필터 탭 */}
        <div className="flex justify-center gap-4 mb-8 px-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            전체 ({winners.length})
          </button>
          <button
            onClick={() => setFilter('winner')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              filter === 'winner'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            경품 당첨자
          </button>
          <button
            onClick={() => setFilter('gift')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              filter === 'gift'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            선물 수령자
          </button>
        </div>

        {/* 명단 표시 영역 */}
        <div className="max-w-6xl mx-auto px-4 pb-16">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
              <p className="mt-4 text-gray-400">명단을 불러오는 중...</p>
            </div>
          ) : winners.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">당첨자가 없습니다.</p>
            </div>
          ) : isMobile ? (
            /* 모바일: 자동 스크롤 카드 형식 */
            <div className="space-y-6">
              {groups.map((group, groupIdx) => (
                <div
                  key={groupIdx}
                  className={`transition-opacity duration-500 ${
                    groupIdx === currentGroupIndex ? 'opacity-100' : 'opacity-0 absolute'
                  }`}
                  style={{
                    display: groupIdx === currentGroupIndex ? 'block' : 'none',
                  }}
                >
                  <div className="space-y-4">
                    {group.map((winner) => (
                      <div
                        key={winner.id}
                        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-yellow-400/30 shadow-xl"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xl font-bold text-yellow-400">{winner.name}</h3>
                          {winner.is_winner && (
                            <span className="px-3 py-1 bg-yellow-400/20 text-yellow-300 rounded-full text-xs font-semibold">
                              🎁 당첨
                            </span>
                          )}
                        </div>
                        <div className="space-y-2 text-sm text-gray-300">
                          <p>전화번호: {formatPhone(winner.phone)}</p>
                          <p>선택 모델: {winner.selected_model}</p>
                          {winner.important_factors.length > 0 && (
                            <p>중요 요소: {winner.important_factors.join(', ')}</p>
                          )}
                          <p className="text-xs text-gray-500">제출일: {formatDate(winner.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* 인디케이터 */}
              {groups.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {groups.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentGroupIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentGroupIndex
                          ? 'bg-yellow-400 w-8'
                          : 'bg-gray-600 w-2 hover:bg-gray-500'
                      }`}
                      aria-label={`그룹 ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* 데스크톱: 표 형식 */
            <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-yellow-400/20 to-yellow-300/20">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300">이름</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300">전화번호</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300">선택 모델</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300">중요 요소</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-300">제출일</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-yellow-300">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {winners.map((winner) => (
                      <tr key={winner.id} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-white">{winner.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{formatPhone(winner.phone)}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{winner.selected_model}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {winner.important_factors.length > 0 ? winner.important_factors.join(', ') : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">{formatDate(winner.created_at)}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            {winner.is_winner && (
                              <span className="px-2 py-1 bg-yellow-400/20 text-yellow-300 rounded text-xs font-semibold">
                                🎁 당첨
                              </span>
                            )}
                            {winner.gift_delivered && (
                              <span className="px-2 py-1 bg-green-400/20 text-green-300 rounded text-xs font-semibold">
                                📦 선물
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 하단 링크 */}
        <div className="text-center pb-12">
          <button
            onClick={() => router.push('/survey')}
            className="text-yellow-400 hover:text-yellow-300 text-sm underline"
          >
            설문 조사 페이지로 돌아가기
          </button>
        </div>
      </div>
    </>
  );
}
