import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';
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
  const [winnersPageEnabled, setWinnersPageEnabled] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const touchStartX = useRef<number | null>(null);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 당첨자 페이지 접근 권한 확인
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch('/api/survey/status');
        const data = await res.json();
        
        if (data.success) {
          const enabled = data.winners_page_enabled !== false;
          setWinnersPageEnabled(enabled);
          
          // 비활성화되어 있으면 설문 페이지로 리다이렉트
          if (!enabled) {
            setTimeout(() => {
              router.push('/survey');
            }, 2000);
          }
        } else {
          // API 오류 시 접근 허용 (기본값)
          setWinnersPageEnabled(true);
        }
      } catch (error) {
        console.error('당첨자 페이지 접근 확인 오류:', error);
        // 오류 발생 시 접근 허용 (기본값)
        setWinnersPageEnabled(true);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [router]);

  // 당첨자 목록 조회
  useEffect(() => {
    // 페이지가 활성화되어 있을 때만 조회
    if (winnersPageEnabled === false) {
      return;
    }

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

    if (winnersPageEnabled === true) {
      fetchWinners();
    }
  }, [filter, winnersPageEnabled]);

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

  // 모바일: 좌우 스와이프로 그룹 전환
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || groups.length <= 1) return;
    const endX = e.changedTouches[0].clientX;
    const delta = endX - touchStartX.current;
    const threshold = 50;
    if (delta > threshold) {
      setCurrentGroupIndex((prev) => (prev <= 0 ? groups.length - 1 : prev - 1));
    } else if (delta < -threshold) {
      setCurrentGroupIndex((prev) => (prev + 1) % groups.length);
    }
    touchStartX.current = null;
  };

  // 이름 마스킹 함수 (개인정보 보호)
  const maskName = (name: string): string => {
    if (!name) return name;
    
    // 공백 제거 후 실제 글자 수 계산
    const trimmedName = name.trim();
    const nameLength = trimmedName.length;
    
    if (nameLength <= 1) return trimmedName;
    
    if (nameLength === 2) {
      // 2글자 이름: 첫 글자만 표시
      return `${trimmedName[0]}O`;
    } else if (nameLength === 3) {
      // 3글자 이름: 첫 글자 + 마스킹 + 마지막 글자
      return `${trimmedName[0]}O${trimmedName[2]}`;
    } else {
      // 4글자 이상: 첫 글자 + 마스킹 + 마지막 글자
      const masked = 'O'.repeat(nameLength - 2);
      return `${trimmedName[0]}${masked}${trimmedName[nameLength - 1]}`;
    }
  };

  // 전화번호 포맷팅 및 마스킹 (개인정보 보호)
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length === 11) {
      // 010-1234-5678 → 010-****-5678 (중간 4자리 마스킹)
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3');
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
  // 모바일용 짧은 날짜 (세로 공간 절약)
  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }).replace(/\. /g, '/');
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
            전체
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
          {checkingAccess ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
              <p className="mt-4 text-gray-400">접근 권한 확인 중...</p>
            </div>
          ) : winnersPageEnabled === false ? (
            <div className="text-center py-12">
              <div className="bg-gray-800/50 rounded-xl p-8 max-w-md mx-auto border border-gray-700">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold text-gray-200 mb-4">접근이 제한되었습니다</h2>
                <p className="text-gray-400 mb-6">
                  당첨자 페이지가 현재 비활성화되어 있습니다.
                  <br />
                  관리자에게 문의하시거나 설문 페이지로 돌아가세요.
                </p>
                <button
                  onClick={() => router.push('/survey')}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 font-semibold rounded-xl hover:from-yellow-300 hover:to-yellow-200 transition-all duration-300"
                >
                  설문 페이지로 돌아가기
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  잠시 후 자동으로 이동합니다...
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
              <p className="mt-4 text-gray-400">명단을 불러오는 중...</p>
            </div>
          ) : winners.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">당첨자가 없습니다.</p>
            </div>
          ) : isMobile ? (
            /* 모바일: 좌우 스와이프 + 압축 카드 (5명 한 화면 노출 목표) */
            <div
              className="touch-pan-y select-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'pan-y' }}
            >
              <p className="text-center text-gray-500 text-xs mb-2">← 좌우로 드래그하여 그룹 이동</p>
              {groups.map((group, groupIdx) => (
                <div
                  key={groupIdx}
                  className={`transition-opacity duration-300 ${
                    groupIdx === currentGroupIndex ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
                  }`}
                  style={{
                    display: groupIdx === currentGroupIndex ? 'block' : 'none',
                  }}
                >
                  <div className="space-y-2">
                    {group.map((winner) => (
                      <div
                        key={winner.id}
                        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg px-3 py-2.5 border border-yellow-400/30 shadow"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="text-base font-bold text-yellow-400 truncate">{maskName(winner.name)}</h3>
                          {winner.is_winner && (
                            <span className="shrink-0 px-2 py-0.5 bg-yellow-400/20 text-yellow-300 rounded-full text-[10px] font-semibold">
                              🎁 당첨
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5 text-xs text-gray-300">
                          <p className="truncate">전화: <span className="text-gray-400">{formatPhone(winner.phone)}</span></p>
                          <p className="truncate">
                            모델: {winner.selected_model}
                            {winner.important_factors.length > 0 && (
                              <span className="text-gray-400"> · 요소: {winner.important_factors.join(', ')}</span>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-500">제출: {formatDateShort(winner.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {/* 인디케이터 */}
              {groups.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {groups.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentGroupIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentGroupIndex
                          ? 'bg-yellow-400 w-6'
                          : 'bg-gray-600 w-1.5 hover:bg-gray-500'
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
                        <td className="px-6 py-4 text-sm font-medium text-white">{maskName(winner.name)}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{formatPhone(winner.phone)}</td>
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

        {/* 신제품 보기 CTA + 시타안내 + 하단 링크 */}
        <section className="max-w-2xl mx-auto px-4 pb-12">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-yellow-400/30 p-6 md:p-8 text-center mb-8">
            <p className="text-gray-300 text-sm md:text-base mb-4">
              MASSGOO X MUZIIK 신제품을 만나보세요
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/products/secret-force-pro-3-muziik"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 font-semibold rounded-xl hover:from-yellow-300 hover:to-yellow-200 transition-all duration-300 shadow-lg"
              >
                시크리트포스 PRO3 MUZIIK 신제품 보기
              </Link>
              <Link
                href="/try-a-massgoo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white font-semibold rounded-xl border border-gray-500 hover:bg-gray-600 transition-all duration-300"
              >
                시타 안내
              </Link>
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={() => router.push('/survey')}
              className="text-yellow-400 hover:text-yellow-300 text-sm underline"
            >
              설문 조사 페이지로 돌아가기
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
