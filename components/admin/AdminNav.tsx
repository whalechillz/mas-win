import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

const AdminNav = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isActive = (path: string) => router.pathname === path;

  // 미들웨어가 통과시켰다면 세션이 곧 올 것이므로 일정 시간 후 표시
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setShowUserInfo(true);
      return;
    }
    
    // 세션이 없어도 미들웨어가 통과시켰다면 2초 후 표시 시도
    if (status !== 'loading') {
      const timer = setTimeout(() => {
        setShowUserInfo(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, session]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      // 1. NextAuth signOut API 직접 호출 (서버 사이드에서 쿠키 삭제)
      try {
        await fetch('/api/auth/signout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (apiError) {
        console.log('signOut API 호출 실패 (무시):', apiError);
      }
      
      // 2. 클라이언트 사이드 signOut 시도
      const { signOut } = await import('next-auth/react');
      await signOut({ 
        callbackUrl: '/admin/login',
        redirect: false // 수동 리다이렉트를 위해 false
      });
      
      // 3. 쿠키 직접 삭제 (모든 변형 버전)
      const cookieNames = [
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        '__Host-next-auth.session-token',
        'next-auth.csrf-token',
        '__Secure-next-auth.csrf-token',
        '__Host-next-auth.csrf-token'
      ];
      
      cookieNames.forEach(name => {
        // 일반 쿠키
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
        // Secure 쿠키
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
        // Domain 쿠키
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax; Domain=.masgolf.co.kr`;
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax; Secure; Domain=.masgolf.co.kr`;
        // www 도메인
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax; Domain=www.masgolf.co.kr`;
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax; Secure; Domain=www.masgolf.co.kr`;
      });
      
      // 4. localStorage도 정리 (혹시 모를 경우)
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // 5. 강제 리다이렉트 (완전 새로고침)
      window.location.replace('/admin/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      
      // 에러 발생 시에도 쿠키 삭제 및 리다이렉트
      const cookieNames = [
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        '__Host-next-auth.session-token',
        'next-auth.csrf-token',
        '__Secure-next-auth.csrf-token',
        '__Host-next-auth.csrf-token'
      ];
      
      cookieNames.forEach(name => {
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax; Domain=.masgolf.co.kr`;
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax; Secure; Domain=.masgolf.co.kr`;
      });
      
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      window.location.replace('/admin/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="bg-white border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-12 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-700 flex-wrap">
            <Link href="/admin/dashboard" className={`px-2 py-1 rounded font-semibold ${isActive('/admin/dashboard') || isActive('/admin') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
              📊 대시보드
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/admin/content-calendar-hub" className={`px-2 py-1 rounded ${isActive('/admin/content-calendar-hub') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
              🎯 허브 시스템
            </Link>
            <Link href="/admin/blog" className={`px-2 py-1 rounded ${isActive('/admin/blog') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
              📝 블로그 관리
            </Link>
            <Link href="/admin/gallery" className={`px-2 py-1 rounded ${isActive('/admin/gallery') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
              🖼️ 갤러리 관리
            </Link>
            <Link href="/admin/customers" className={`px-2 py-1 rounded ${isActive('/admin/customers') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
              👥 고객 관리
            </Link>
            <Link href="/admin/kakao-content" className={`px-2 py-1 rounded ${isActive('/admin/kakao-content') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
              📱 데일리 콘텐츠
            </Link>
            <Link href="/admin/dashboard" className={`px-2 py-1 rounded text-gray-400 hover:text-gray-600`}>
              더보기 →
            </Link>
          </div>
          
          {/* 사용자 정보 및 로그아웃 버튼 */}
          <div className="flex items-center space-x-3">
            {status === 'loading' && !showUserInfo && (
              <span className="text-sm text-gray-400">로딩 중...</span>
            )}
            
            {(status === 'authenticated' && session?.user) || showUserInfo ? (
              <>
                <span className="text-sm text-gray-600">
                  {session?.user?.name || '관리자'} ({session?.user?.role === 'admin' ? '총관리자' : '편집자'})
                </span>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNav;


