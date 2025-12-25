import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

const AdminNav = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const isActive = (path: string) => router.pathname === path;

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
          
          {/* 사용자 정보 및 로그아웃 버튼 (임시로 항상 표시 - 디버깅용) */}
          <div className="flex items-center space-x-3">
            {session ? (
              <>
                <span className="text-sm text-gray-600">
                  {session.user?.name} ({(session.user as any)?.role === 'admin' ? '총관리자' : '편집자'})
                </span>
                <button
                  onClick={async () => {
                    const { signOut } = await import('next-auth/react');
                    await signOut({ callbackUrl: '/admin/login' });
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <span className="text-sm text-gray-400">세션 없음 (디버깅 모드)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNav;


