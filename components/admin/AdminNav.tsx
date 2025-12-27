import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import UserProfileDropdown from './UserProfileDropdown';
import ProfileEditModal from './ProfileEditModal';

const AdminNav = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
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
      // 1. NextAuth signOut 먼저 시도
      try {
        const { signOut } = await import('next-auth/react');
        await signOut({ 
          redirect: false,
          callbackUrl: 'https://www.masgolf.co.kr/admin/login'
        });
      } catch (e) {
        console.log('signOut 실패 (무시):', e);
      }
      
      // 2. 모든 쿠키 삭제 (더 강력하게)
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
            // 모든 가능한 조합으로 삭제
            document.cookie = `${name}=; Path=${path}; Max-Age=0; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`;
            document.cookie = `${name}=; Path=${path}; Max-Age=0; SameSite=None; Secure${domain ? `; Domain=${domain}` : ''}`;
            document.cookie = `${name}=; Path=${path}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${domain ? `; Domain=${domain}` : ''}`;
            // Secure 없이도 시도
            if (!domain) {
              document.cookie = `${name}=; Path=${path}; Max-Age=0`;
            }
          });
        });
      });
      
      // 3. localStorage/sessionStorage 정리
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        // 특정 키도 개별 삭제
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('currentEmployee');
          localStorage.removeItem('isLoggedIn');
        } catch (e) {
          // 무시
        }
      }
      
      // 4. 즉시 리다이렉트 (타임아웃 없이, replace 사용)
      window.location.replace('https://www.masgolf.co.kr/admin/login');
      
    } catch (error) {
      console.error('로그아웃 오류:', error);
      // 에러 발생 시에도 강제 리다이렉트
      window.location.replace('https://www.masgolf.co.kr/admin/login');
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
            <UserProfileDropdown
              onLogout={handleLogout}
              onEditProfile={() => setShowProfileModal(true)}
            />
          </div>
        </div>
      </div>

      {/* 개인정보 수정 모달 */}
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUpdate={() => {
          // 세션 새로고침은 모달 내부에서 처리
        }}
      />
    </div>
  );
};

export default AdminNav;


