import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth-context';

export default function TeamDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return <div>로딩 중...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">MASGOLF</h1>
              <span className="ml-4 text-sm text-gray-500">팀 대시보드</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowManual(!showManual)}
                className="text-gray-600 hover:text-gray-900"
              >
                📚 매뉴얼
              </button>
              <div className="flex items-center space-x-2">
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}`}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/login');
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 매뉴얼 패널 */}
      {showManual && (
        <div className="fixed inset-0 z-50 flex">
          <div className="bg-black bg-opacity-50 flex-1" onClick={() => setShowManual(false)} />
          <div className="bg-white w-96 shadow-xl overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">📚 팀 멤버 매뉴얼</h2>
                <button
                  onClick={() => setShowManual(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-2">🚀 시작하기</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• 대시보드에서 오늘의 할 일 확인</li>
                    <li>• 새로운 리드 확인 및 관리</li>
                    <li>• 콘텐츠 작성 일정 체크</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">📝 콘텐츠 작성</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• 블로그: 주 2회 이상 포스팅</li>
                    <li>• SNS: 일 1회 이상 업로드</li>
                    <li>• SEO 키워드 필수 포함</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-2">👥 리드 관리</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• 신규 문의 30분 내 응답</li>
                    <li>• 상담 내용 CRM에 기록</li>
                    <li>• 팔로우업 일정 설정</li>
                  </ul>
                </div>

                <a
                  href="/manual"
                  target="_blank"
                  className="block w-full bg-purple-600 text-white text-center py-2 rounded-lg hover:bg-purple-700 transition-all"
                >
                  전체 매뉴얼 보기 →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">안녕하세요, {user.name}님! 👋</h2>
          <p className="text-gray-600">오늘도 최고의 하루 되세요!</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="font-bold text-purple-800 mb-2">오늘의 할 일</h3>
              <p className="text-3xl font-bold text-purple-600">5</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">신규 리드</h3>
              <p className="text-3xl font-bold text-blue-600">3</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-bold text-green-800 mb-2">이번 달 성과</h3>
              <p className="text-3xl font-bold text-green-600">85%</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}