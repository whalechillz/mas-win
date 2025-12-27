import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  username?: string;
  role: 'admin' | 'editor';
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface AccountManagementProps {
  session: any;
}

export default function AccountManagement({ session }: AccountManagementProps) {
  const { data: sessionData, status } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'team'>('profile');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  // 세션 로딩 타임아웃 처리 - 미들웨어가 통과시켰다면 세션이 있어야 함
  useEffect(() => {
    if (status === 'authenticated' && (sessionData?.user || session?.user)) {
      setShowProfile(true);
      return;
    }
    
    // 세션이 없어도 미들웨어가 통과시켰다면 3초 후 표시 시도
    if (status !== 'loading') {
      const timer = setTimeout(() => {
        setShowProfile(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, sessionData, session]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
      } else {
        setError('사용자를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('사용자 로드 오류:', err);
      setError('사용자를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: '총관리자', color: 'bg-red-100 text-red-800' },
      editor: { label: '편집자', color: 'bg-blue-100 text-blue-800' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.editor;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? '활성' : '비활성'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            내 프로필
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'team'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            팀 관리
          </button>
        </nav>
      </div>

      {/* 내 프로필 탭 */}
      {activeTab === 'profile' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">내 프로필</h2>
          
          {/* 세션 로딩 중 - status로 정확히 체크 */}
          {status === 'loading' && !showProfile && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">프로필 정보를 불러오는 중...</p>
            </div>
          )}
          
          {/* 세션 데이터가 있을 때 또는 showProfile이 true일 때 */}
          {((status === 'authenticated' && (sessionData?.user || session?.user)) || showProfile) && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">이름</label>
                <p className="mt-1 text-sm text-gray-900">
                  {sessionData?.user?.name || (session?.user as any)?.name || '관리자'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">이메일/전화번호</label>
                <p className="mt-1 text-sm text-gray-900">
                  {sessionData?.user?.email || (session?.user as any)?.phone || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">역할</label>
                <div className="mt-1">
                  {getRoleBadge(
                    (sessionData?.user as any)?.role || 
                    (session?.user as any)?.role || 
                    'editor'
                  )}
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 팀 관리 탭 */}
      {activeTab === 'team' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">팀 관리</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      전화번호
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      역할
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      생성일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      최종 로그인
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.is_active)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_login ? formatDate(user.last_login) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500">
                  등록된 사용자가 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
