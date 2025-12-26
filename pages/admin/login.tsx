import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getToken } from 'next-auth/jwt';
import Head from 'next/head';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      } else if (result?.ok) {
        // 로그인 성공 확인 - result?.ok를 명시적으로 체크
        const callbackUrl = (router.query.callbackUrl as string) || '/admin/dashboard';
        // 세션이 설정될 시간을 주기 위해 약간의 지연
        setTimeout(() => {
          router.push(callbackUrl);
        }, 100);
      } else {
        // result가 null이거나 예상치 못한 경우
        setError('로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch (err: any) {
      setError(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>관리자 로그인 - 마쓰구골프</title>
        <meta name="description" content="마쓰구골프 관리자 로그인" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">마쓰구골프</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-8">
            관리자 로그인
          </h2>
        </div>
          <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleSubmit}>
          {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4 animate-shake">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
              <div className="text-sm text-red-700">{error}</div>
                </div>
            </div>
          )}
            <div className="space-y-4">
            <div>
                <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-1">
                아이디 또는 전화번호
              </label>
              <input
                id="login"
                name="login"
                type="text"
                required
                  autoComplete="username"
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                  placeholder="아이디 또는 전화번호를 입력하세요"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                  disabled={isLoading}
              />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
                <div className="relative">
              <input
                id="password"
                name="password"
                    type={showPassword ? 'text' : 'password'}
                required
                    autoComplete="current-password"
                    className="appearance-none relative block w-full px-4 py-3 pr-12 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                    placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
              />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
                className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
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
          destination: '/admin/dashboard',
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


