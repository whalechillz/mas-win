import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

/**
 * /admin 경로는 단순 리다이렉트 페이지
 * - 세션이 없으면 /admin/login으로 리다이렉트
 * - 세션이 있으면 /admin/dashboard로 리다이렉트
 * - 디버깅 모드일 때는 대시보드로 리다이렉트
 */
export default function Admin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // 프로덕션에서는 디버깅 모드 비활성화
  const DEBUG_MODE = false;

  useEffect(() => {
    if (status === 'loading') return;
    
    // 디버깅 모드이면 바로 대시보드로
    if (DEBUG_MODE) {
      router.replace('/admin/dashboard');
      return;
    }
    
    // 세션이 없으면 로그인 페이지로
    if (!session) {
      router.replace('/admin/login');
      return;
    }
    
    // 세션이 있으면 대시보드로
    router.replace('/admin/dashboard');
  }, [status, session, router, DEBUG_MODE]);

  // 로딩 중 표시
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    </div>
  );
}
