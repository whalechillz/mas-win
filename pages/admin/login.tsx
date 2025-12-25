import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getToken } from 'next-auth/jwt';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // URL 파라미터에서 오류 메시지 읽기
  useEffect(() => {
    const errorParam = router.query.error as string;
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        login,
        password,
        redirect: false,
      });

      if (result?.error) {
        // NextAuth 오류 코드에 따른 메시지
        const errorMessages: { [key: string]: string } = {
          Configuration: '서버 설정 오류가 발생했습니다. 관리자에게 문의하세요.',
          AccessDenied: '접근이 거부되었습니다.',
          Verification: '인증 오류가 발생했습니다.',
          CredentialsSignin: '아이디와 비밀번호를 확인해주세요.',
        };
        setError(errorMessages[result.error] || '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
      } else {
        // 로그인 성공 시 이전 페이지로 리다이렉트 또는 블로그 관리 페이지로 이동
        const callbackUrl = (router.query.callbackUrl as string) || '/admin/blog';
        router.push(callbackUrl);
      }
    } catch (err: any) {
      setError(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            관리자 로그인
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="login" className="sr-only">
                아이디 또는 전화번호
              </label>
              <input
                id="login"
                name="login"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="아이디 또는 전화번호"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // getSession 대신 getToken 사용 (API 호출 없이 JWT 직접 읽기)
  // 이렇게 하면 리다이렉트 루프를 방지할 수 있습니다
  try {
    const token = await getToken({ 
      req: context.req, 
      secret: process.env.NEXTAUTH_SECRET || 'masgolf-admin-secret-key-2024'
    });

    if (token) {
      return {
        redirect: {
          destination: '/admin/blog',
          permanent: false,
        },
      };
    }
  } catch (error) {
    // 토큰 읽기 실패 시 로그인 페이지로 진행
    console.log('토큰 확인 실패 (정상 - 로그인 필요):', error);
  }

  return {
    props: {},
  };
};


