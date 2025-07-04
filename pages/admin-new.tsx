import React from 'react';
import dynamic from 'next/dynamic';

// 클라이언트 사이드에서만 렌더링되도록 dynamic import 사용
const AdminDashboard = dynamic(
  () => import('../components/AdminDashboard'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">관리자 대시보드 로딩 중...</p>
        </div>
      </div>
    )
  }
);

export default function AdminPage() {
  return <AdminDashboard />;
}