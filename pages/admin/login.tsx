import { useState } from 'react';

export default function AdminLogin() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // 임시 로그인: 입력만 있으면 통과, 세션 없이 관리자 페이지 접근 허용
    if (!login || !password) {
      setError('아이디와 비밀번호를 입력하세요.');
      return;
    }
    try {
      window.location.href = '/admin/blog';
    } catch {
      setError('로그인 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">관리자 로그인(임시)</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
          <input value={login} onChange={(e) => setLogin(e.target.value)} className="w-full px-3 py-2 border rounded" />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded" />
        </div>
        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">로그인</button>
      </form>
    </div>
  );
}
