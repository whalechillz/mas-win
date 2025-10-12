import Link from 'next/link';
import { useRouter } from 'next/router';

const AdminNav = () => {
  const router = useRouter();
  const isActive = (path: string) => router.pathname === path;

  return (
    <div className="bg-white border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-semibold">관리자</span>
            <span className="text-gray-300">|</span>
            <Link href="/admin/blog" className={`px-2 py-1 rounded ${isActive('/admin/blog') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>블로그 관리</Link>
            <Link href="/admin/gallery" className={`px-2 py-1 rounded ${isActive('/admin/gallery') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>갤러리 관리</Link>
            <Link href="/admin/content-calendar" className={`px-2 py-1 rounded ${isActive('/admin/content-calendar') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>📅 콘텐츠 캘린더</Link>
            <Link href="/admin/multichannel-dashboard" className={`px-2 py-1 rounded ${isActive('/admin/multichannel-dashboard') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>📊 멀티채널 대시보드</Link>
            <Link href="/admin/ai-dashboard" className={`px-2 py-1 rounded ${isActive('/admin/ai-dashboard') ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>AI 관리</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNav;


