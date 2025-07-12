import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function UnifiedLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/unified-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // 권한에 따라 다른 대시보드로 이동
        if (data.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/team-dashboard');
        }
        
        // 첫 로그인이면 비밀번호 변경 페이지로
        if (data.isTempPassword) {
          router.push('/password-reset');
        }
      } else {
        setError('이메일 또는 비밀번호가 잘못되었습니다.');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">MASGOLF</h1>
            <p className="text-purple-200">통합 관리 시스템</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur"
                placeholder="이메일 주소"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur"
                placeholder="비밀번호"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 backdrop-blur text-red-200 p-3 rounded-lg text-sm border border-red-500/30">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/password-reset" className="text-purple-300 hover:text-purple-200 text-sm">
              비밀번호를 잊으셨나요?
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-white/20">
            <div className="text-center text-sm text-purple-200">
              <p className="mb-2">🌟 세계 최고의 마케팅 팀 🌟</p>
              <div className="flex justify-center space-x-4 text-xs text-white/60">
                <span>슈퍼바이저</span>
                <span>•</span>
                <span>제이</span>
                <span>•</span>
                <span>스테피</span>
                <span>•</span>
                <span>나부장</span>
                <span>•</span>
                <span>허상원</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}