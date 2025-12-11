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
            <Link href="/admin" className={`px-2 py-1 rounded font-semibold ${isActive('/admin') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>관리자</Link>
            <span className="text-gray-300">|</span>
            <Link href="/admin/blog" className={`px-2 py-1 rounded ${isActive('/admin/blog') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>블로그 관리</Link>
            <Link href="/admin/sms-list" className={`px-2 py-1 rounded ${isActive('/admin/sms-list') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>📱 SMS 관리</Link>
        <Link href="/admin/kakao" className={`px-2 py-1 rounded ${isActive('/admin/kakao') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>💬 카카오 채널</Link>
            <Link href="/admin/kakao-content" className={`px-2 py-1 rounded ${isActive('/admin/kakao-content') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>📱 카톡 콘텐츠</Link>
        <Link href="/admin/naver-blog-advanced" className={`px-2 py-1 rounded ${isActive('/admin/naver-blog-advanced') || isActive('/admin/naver-blog') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>📝 네이버 블로그</Link>
            <Link href="/admin/gallery" className={`px-2 py-1 rounded ${isActive('/admin/gallery') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>갤러리 관리</Link>
            <Link href="/admin/category-management" className={`px-2 py-1 rounded ${isActive('/admin/category-management') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>📂 카테고리 관리</Link>
        <Link href="/admin/content-calendar-hub" className={`px-2 py-1 rounded ${isActive('/admin/content-calendar-hub') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>🎯 허브 시스템</Link>
            <Link href="/admin/multichannel-dashboard" className={`px-2 py-1 rounded ${isActive('/admin/multichannel-dashboard') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>📊 멀티채널 대시보드</Link>
            <Link href="/admin/ai-image-generator" className={`px-2 py-1 rounded ${isActive('/admin/ai-image-generator') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>🎨 AI 이미지 생성</Link>
            <Link href="/admin/product-composition" className={`px-2 py-1 rounded ${isActive('/admin/product-composition') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>🛍️ 제품 합성 관리</Link>
            <Link href="/admin/ai-dashboard" className={`px-2 py-1 rounded ${isActive('/admin/ai-dashboard') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>AI 관리</Link>
            <Link href="/admin/booking" className={`px-2 py-1 rounded font-medium ${isActive('/admin/booking') ? 'bg-red-600 text-white' : 'hover:bg-red-50 text-red-600'}`}>📅 시타예약</Link>
            <Link href="/admin/customers" className={`px-2 py-1 rounded ${isActive('/admin/customers') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>👥 고객</Link>
            <Link href="/admin/surveys" className={`px-2 py-1 rounded ${isActive('/admin/surveys') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>📋 설문 관리</Link>
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


