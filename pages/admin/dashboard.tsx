import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import AdminNav from '../../components/admin/AdminNav';
import { menuCategories, colorClasses } from '../../lib/admin-menu-structure';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const redirectingRef = useRef(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentMenus, setRecentMenus] = useState<string[]>([]);
  const [canRender, setCanRender] = useState(false);

  // 세션 체크는 미들웨어에서 처리하므로 클라이언트 사이드 리다이렉트 제거
  // 미들웨어가 이미 인증되지 않은 사용자를 로그인 페이지로 리다이렉트함
  // 클라이언트 사이드에서 추가 리다이렉트를 하면 루프가 발생할 수 있음
  const DEBUG_MODE = process.env.NEXT_PUBLIC_ADMIN_DEBUG === 'true' || 
                     (typeof window !== 'undefined' && 
                      localStorage.getItem('admin_debug_mode') === 'true');
  
  // ✅ 모든 hooks는 조건부 return 전에 호출되어야 함 (React Hooks 규칙)
  // 디버깅 모드가 아니고 세션이 없을 때 렌더링 허용 로직
  useEffect(() => {
    if (DEBUG_MODE) {
      setCanRender(true);
      return;
    }
    
    // 세션이 있으면 즉시 렌더링
    if (session) {
      setCanRender(true);
      return;
    }
    
    // 세션이 없어도 미들웨어가 통과시켰다면 2초 후 렌더링 시도
    // (useSession이 세션을 가져오는 데 시간이 걸릴 수 있음)
    const timer = setTimeout(() => {
      setCanRender(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [session, DEBUG_MODE]);

  // 디버깅 모드가 아닐 때만 세션 상태 확인 (리다이렉트는 하지 않음)
  useEffect(() => {
    // 디버깅 모드이면 세션 체크 스킵
    if (DEBUG_MODE) return;
    
    // 세션이 없고 로딩이 완료되었을 때만 로그 (리다이렉트는 미들웨어가 처리)
    if (status === 'unauthenticated' && !session && status !== 'loading') {
      // 미들웨어가 이미 리다이렉트했을 것이므로 여기서는 아무것도 하지 않음
      console.log('[Dashboard] 세션 없음 - 미들웨어가 리다이렉트 처리');
    }
  }, [status, session, DEBUG_MODE]);

  // 최근 사용 메뉴 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const recent = localStorage.getItem('admin_recent_menus');
      if (recent) {
        try {
          setRecentMenus(JSON.parse(recent));
        } catch (e) {
          console.error('Failed to parse recent menus:', e);
        }
      }
    }
  }, []);

  // 메뉴 클릭 시 최근 메뉴에 추가
  const handleMenuClick = (path: string) => {
    if (typeof window !== 'undefined') {
      const recent = recentMenus.filter(p => p !== path);
      const updated = [path, ...recent].slice(0, 6);
      setRecentMenus(updated);
      localStorage.setItem('admin_recent_menus', JSON.stringify(updated));
    }
  };

  // 검색 필터링
  const filteredCategories = menuCategories.map(category => ({
    ...category,
    menus: category.menus.filter(menu => 
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.menus.length > 0);

  // 최근 메뉴 정보 가져오기
  const getRecentMenuInfo = (path: string) => {
    for (const category of menuCategories) {
      const menu = category.menus.find(m => m.path === path);
      if (menu) return menu;
    }
    return null;
  };

  // ✅ 이제 조건부 return (모든 hooks 호출 후)
  // 로딩 중 표시 (세션 체크는 미들웨어가 처리하므로 여기서는 로딩만 표시)
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 디버깅 모드가 아니고 세션이 없으면
  // 미들웨어가 이미 통과시켰으므로 세션 확인 중일 수 있음
  // 무한 로딩 방지를 위해 일정 시간 후 렌더링 시도
  if (!DEBUG_MODE && !session && !canRender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>관리자 대시보드 - 마쓰구골프</title>
        <meta name="description" content="마쓰구골프 관리자 대시보드" />
      </Head>

      <AdminNav />

      <div className="min-h-screen bg-gray-50">
        {/* 검색 바 */}
        <div className="bg-white border-b sticky top-12 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="relative">
              <input
                type="text"
                placeholder="메뉴 검색... (예: 블로그, 고객, 재고)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 최근 사용 메뉴 */}
          {recentMenus.length > 0 && !searchTerm && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">최근 사용 메뉴</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {recentMenus.map((path) => {
                  const menu = getRecentMenuInfo(path);
                  if (!menu) return null;
                  return (
                    <Link
                      key={path}
                      href={path}
                      onClick={() => handleMenuClick(path)}
                      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-200 hover:border-indigo-300"
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{menu.icon}</div>
                        <div className="text-sm font-medium text-gray-900 truncate">{menu.name}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* 카테고리별 메뉴 카드 */}
          <div className="space-y-6">
            {filteredCategories.map((category) => {
              const colors = colorClasses[category.color] || colorClasses.gray;
              return (
                <div
                  key={category.id}
                  className={`bg-white rounded-lg shadow-md p-6 border-2 ${colors.border} hover:shadow-lg transition-shadow`}
                >
                  {/* 카테고리 헤더 */}
                  <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                    <span className="text-3xl mr-3">{category.icon}</span>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold ${colors.text}`}>{category.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {category.menus.length}개 메뉴
                    </span>
                  </div>

                  {/* 하위 메뉴 그리드 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {category.menus.map((menu) => (
                      <Link
                        key={menu.id}
                        href={menu.path}
                        onClick={() => handleMenuClick(menu.path)}
                        className={`flex items-center p-4 rounded-lg border ${colors.border} hover:${colors.bg} transition-colors group`}
                      >
                        <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">
                          {menu.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${colors.text} group-hover:font-semibold`}>
                            {menu.name}
                          </div>
                          {menu.description && (
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {menu.description}
                            </div>
                          )}
                        </div>
                        <svg
                          className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 검색 결과 없음 */}
          {searchTerm && filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-500">다른 검색어를 시도해보세요.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

