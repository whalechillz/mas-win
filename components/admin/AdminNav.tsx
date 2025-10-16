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
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Link href="/admin" className={`px-2 py-1 rounded font-semibold ${isActive('/admin') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>관리자</Link>
            <span className="text-gray-300">|</span>
            <Link href="/admin/blog" className={`px-2 py-1 rounded ${isActive('/admin/blog') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>블로그 관리</Link>
            <Link href="/admin/sms-list" className={`px-2 py-1 rounded ${isActive('/admin/sms-list') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>📱 SMS 관리</Link>
        <Link href="/admin/kakao" className={`px-2 py-1 rounded ${isActive('/admin/kakao') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>💬 카카오 채널</Link>
        <Link href="/admin/naver-blog" className={`px-2 py-1 rounded ${isActive('/admin/naver-blog') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>📝 네이버 블로그</Link>
            <Link href="/admin/gallery" className={`px-2 py-1 rounded ${isActive('/admin/gallery') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>갤러리 관리</Link>
            <Link href="/admin/content-calendar" className={`px-2 py-1 rounded ${isActive('/admin/content-calendar') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>📅 콘텐츠 캘린더</Link>
            <Link href="/admin/multichannel-dashboard" className={`px-2 py-1 rounded ${isActive('/admin/multichannel-dashboard') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>📊 멀티채널 대시보드</Link>
            <Link href="/admin/ai-dashboard" className={`px-2 py-1 rounded ${isActive('/admin/ai-dashboard') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>AI 관리</Link>
          </div>
          
          {/* 사용자 정보 및 로그아웃 버튼 */}
          {session && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {session.user?.name} ({session.user?.role === 'admin' ? '총관리자' : '편집자'})
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNav;


