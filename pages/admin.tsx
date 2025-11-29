import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';
import CampaignKPIDashboard from '../components/admin/dashboard/CampaignKPIDashboard';
import MarketingDashboardComplete from '../components/admin/marketing/MarketingDashboardComplete';
import { TeamMemberManagement } from '../components/admin/team/TeamMemberManagement';
import AccountManagement from '../components/admin/AccountManagement';
import GA4RealtimeDashboard from '../components/admin/dashboard/GA4RealtimeDashboard';
import IntegratedMarketingHub from '../components/admin/marketing/integrated/IntegratedMarketingHub';
import MonthlyCampaignAnalytics from '../components/admin/campaigns/MonthlyCampaignAnalytics';
import GA4AdvancedDashboard from '../components/admin/dashboard/GA4AdvancedDashboard';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import FunnelManagerSimplified from '../components/admin/funnel/FunnelManagerSimplified';
import GoogleAdsDiagnostic from '../components/admin/google-ads/GoogleAdsDiagnostic';
import MarketingManagementUnified from '../components/admin/marketing/MarketingManagementUnified';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Admin() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('dashboard');
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // 로딩 중이면 대기
    
    if (!session) {
      // 미들웨어 비활성화로 인한 임시 클라이언트 사이드 보호
      window.location.href = '/admin/login';
      return;
    }
  }, [session, status]);

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/admin/login' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // 로딩 중이거나 인증되지 않은 경우
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // 리다이렉트 중
  }

  const tabs = [
    { id: 'dashboard', name: '대시보드', icon: '📊' },
    { id: 'team', name: '계정 관리', icon: '👨‍💼' },
    { id: 'marketing', name: '마케팅', icon: '📈' },
    { id: 'blog', name: '블로그 관리', icon: '📝' },
    { id: 'analytics', name: '분석', icon: '📊' },
    { id: 'funnel', name: '퍼널 관리', icon: '🔄' },
    { id: 'google-ads', name: '구글 광고', icon: '🎯' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <CampaignKPIDashboard />;
      case 'marketing':
        return <MarketingManagementUnified />;
      case 'blog':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📝 블로그 관리</h2>
              <p className="text-gray-600 mb-6">블로그 게시물을 작성, 수정, 관리할 수 있습니다.</p>
              <div className="space-y-4">
                <Link 
                  href="/admin/blog" 
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  📝 블로그 관리 페이지로 이동
                </Link>
                <div className="text-sm text-gray-500">
                  게시물 작성, 수정, 삭제, 카테고리 관리 등 모든 블로그 기능을 이용하실 수 있습니다.
                </div>
              </div>
            </div>
          </div>
        );
      case 'team':
        return <AccountManagement session={session} />;
      case 'analytics':
        return (
          <div className="space-y-6">
            <GA4RealtimeDashboard />
            <MonthlyCampaignAnalytics />
            <GA4AdvancedDashboard />
          </div>
        );
      case 'funnel':
        return <FunnelManagerSimplified />;
      case 'google-ads':
        return <GoogleAdsDiagnostic />;
      default:
        return <CampaignKPIDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>관리자 대시보드 - 마쓰구골프</title>
        <meta name="description" content="마쓰구골프 관리자 대시보드" />
      </Head>

      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                마쓰구골프 관리자
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{session.user?.name}</span>
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {session.user?.role === 'admin' ? '총관리자' : '부관리자'}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderTabContent()}
      </main>
    </div>
  );
}
