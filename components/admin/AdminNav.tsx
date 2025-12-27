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
      // 1. 모든 쿠키 즉시 삭제 (signOut 전에 먼저 삭제)
      const cookieNames = [
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        '__Host-next-auth.session-token',
        'next-auth.csrf-token',
        '__Secure-next-auth.csrf-token',
        '__Host-next-auth.csrf-token'
      ];
      
      // 모든 가능한 경로와 도메인 조합으로 삭제
      const domains = ['', '.masgolf.co.kr', 'www.masgolf.co.kr', 'masgolf.co.kr'];
      const paths = ['/', '/admin', '/admin/login'];
      
      cookieNames.forEach(name => {
        domains.forEach(domain => {
          paths.forEach(path => {
            // 일반 쿠키
            document.cookie = `${name}=; Path=${path}; Max-Age=0; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`;
            // Secure 쿠키
            document.cookie = `${name}=; Path=${path}; Max-Age=0; SameSite=Lax; Secure${domain ? `; Domain=${domain}` : ''}`;
          });
        });
      });
      
      // 2. localStorage/sessionStorage 정리
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // 3. NextAuth signOut 시도 (실패해도 무시)
      try {
        const { signOut } = await import('next-auth/react');
        await signOut({ redirect: false });
      } catch (e) {
        console.log('signOut 실패 (무시):', e);
      }
      
      // 4. 즉시 리다이렉트 (replace로 히스토리 제거, 절대 경로 사용)
      setTimeout(() => {
        window.location.replace('https://www.masgolf.co.kr/admin/login');
      }, 100);
      
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
      
      const domains = ['', '.masgolf.co.kr', 'www.masgolf.co.kr', 'masgolf.co.kr'];
      const paths = ['/', '/admin', '/admin/login'];
      
      cookieNames.forEach(name => {
        domains.forEach(domain => {
          paths.forEach(path => {
            document.cookie = `${name}=; Path=${path}; Max-Age=0; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`;
            document.cookie = `${name}=; Path=${path}; Max-Age=0; SameSite=Lax; Secure${domain ? `; Domain=${domain}` : ''}`;
          });
        });
      });
      
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      window.location.replace('https://www.masgolf.co.kr/admin/login');
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
                  {session?.user?.name || '관리자'} ({(session?.user as any)?.role === 'admin' ? '총관리자' : '편집자'})
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


