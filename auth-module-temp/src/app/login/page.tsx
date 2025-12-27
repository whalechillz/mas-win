'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/supabase';
import { formatPhoneNumberOnInput } from '@/utils/phoneUtils';
import { Phone, Lock, Loader2, User, Zap, TrendingUp } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTestMode, setIsTestMode] = useState(false);
  const [testUserInfo, setTestUserInfo] = useState<{
    name: string;
    phone: string;
    password: string;
  } | null>(null);

  // 테스트 모드 확인 및 설정
  useEffect(() => {
    const testUser = searchParams.get('test_user');
    const testPassword = searchParams.get('test_password');
    const testName = searchParams.get('test_name');

    if (testUser && testPassword && testName) {
      setIsTestMode(true);
      setTestUserInfo({
        name: decodeURIComponent(testName),
        phone: decodeURIComponent(testUser),
        password: decodeURIComponent(testPassword)
      });

      // 폼에 테스트 데이터 자동 입력
      setFormData({
        phone: decodeURIComponent(testUser),
        password: decodeURIComponent(testPassword)
      });
    }
  }, [searchParams]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumberOnInput(e.target.value, formData.phone);
    setFormData({ ...formData, phone: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await auth.signInWithPhone(formData.phone, formData.password);
      
      // 로그인 성공 시 활동 시간 업데이트
      localStorage.setItem('lastActivity', Date.now().toString());
      
      // 로그인 성공 후 리다이렉트 (프로젝트별로 수정 필요)
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 헤더 */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* 로고 */}
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Zap className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            MASLABS
          </h2>
          <p className="mt-2 text-center text-lg text-gray-600">
            직원 관리 시스템
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          {/* 테스트 모드 배너 */}
          {isTestMode && testUserInfo && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <User className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">테스트 모드</h3>
                  <p className="text-sm text-yellow-700">
                    {testUserInfo.name} ({testUserInfo.phone})
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* 전화번호 입력 */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    className="block w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder="010-0000-0000"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    readOnly={isTestMode}
                  />
                </div>
              </div>

              {/* 비밀번호 입력 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder="비밀번호"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    readOnly={isTestMode}
                  />
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        로그인 오류
                      </h3>
                      <div className="mt-1 text-sm text-red-700">
                        {error}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 로그인 버튼 */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" />
                  ) : (
                    <TrendingUp className="h-6 w-6 mr-2" />
                  )}
                  {isTestMode ? '테스트 로그인' : '로그인'}
                </button>
              </div>
            </form>

            {/* 간단한 안내 */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                로그인 후 바로 업무를 입력할 수 있습니다
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <div className="px-6 py-4 text-center">
        <p className="text-xs text-gray-400">
          © 2025 MASLABS. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

