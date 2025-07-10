import React, { useState } from 'react';

export default function TeamMemberLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/team-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setLoggedInUser(data.member);
        if (data.member.must_change_password) {
          setMustChangePassword(true);
          setIsLogin(false);
        } else {
          // 메인 페이지로 이동
          window.location.href = '/admin';
        }
      } else {
        setError(data.error || '로그인 실패');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('비밀번호가 성공적으로 변경되었습니다.');
        setTimeout(() => {
          window.location.href = '/admin';
        }, 2000);
      } else {
        setError(data.error || '비밀번호 변경 실패');
      }
    } catch (err) {
      setError('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'login' | 'change') => {
    if (e.key === 'Enter') {
      if (action === 'login') {
        handleLogin();
      } else {
        handleChangePassword();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'MASGOLF 팀 로그인' : '비밀번호 변경'}
            </h1>
            <p className="text-purple-200">
              {isLogin ? '팀 멤버 전용 로그인' : '새로운 비밀번호를 설정하세요'}
            </p>
            {mustChangePassword && (
              <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  ⚠️ 첫 로그인입니다. 비밀번호를 변경해주세요.
                </p>
              </div>
            )}
          </div>

          {/* 로그인 폼 */}
          {isLogin ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'login')}
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
                  onKeyPress={(e) => handleKeyPress(e, 'login')}
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
                onClick={handleLogin}
                disabled={loading || !email || !password}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </div>
          ) : (
            /* 비밀번호 변경 폼 */
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'change')}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur"
                  placeholder="현재 비밀번호"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'change')}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur"
                  placeholder="새 비밀번호 (최소 4자)"
                  required
                  minLength={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'change')}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur"
                  placeholder="새 비밀번호 확인"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/20 backdrop-blur text-red-200 p-3 rounded-lg text-sm border border-red-500/30">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/20 backdrop-blur text-green-200 p-3 rounded-lg text-sm border border-green-500/30">
                  {success}
                </div>
              )}

              <button
                onClick={handleChangePassword}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>

              {!mustChangePassword && (
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="w-full text-white/60 hover:text-white text-sm"
                >
                  로그인으로 돌아가기
                </button>
              )}
            </div>
          )}

          {/* 팀 멤버 안내 */}
          <div className="mt-6 text-center">
            <div className="text-sm text-purple-200">
              <p>작성자 계정:</p>
              <div className="text-xs mt-2 space-y-1 text-white/60">
                <p>제이: mas9golf2@gmail.com</p>
                <p>스테피: mas9golf3@gmail.com</p>
                <p>나부장: singsingstour@gmail.com</p>
                <p className="text-yellow-300 mt-2">초기 비밀번호: 1234</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}