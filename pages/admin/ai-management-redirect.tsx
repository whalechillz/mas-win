import { useEffect } from 'react';

export default function RedirectAIManagement() {
  useEffect(() => {
    window.location.replace('/admin/ai-dashboard');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">AI & 블로그 대시보드로 이동 중...</p>
    </div>
  );
}


