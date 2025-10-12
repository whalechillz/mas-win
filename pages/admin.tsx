import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSession, signOut } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';
import CampaignKPIDashboard from '../components/admin/dashboard/CampaignKPIDashboard';
import { ContactManagement } from '../components/admin/contacts/ContactManagement';
import { BookingManagement } from '../components/admin/bookings/BookingManagement';
import MarketingDashboardComplete from '../components/admin/marketing/MarketingDashboardComplete';
import { TeamMemberManagement } from '../components/admin/team/TeamMemberManagement';
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

  // 데이터 상태 추가
  const [bookings, setBookings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // 데이터 로딩 함수
  const loadData = async () => {
    setDataLoading(true);
    try {
      // 예약 데이터 로드
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('예약 데이터 로드 오류:', bookingsError);
      } else {
        setBookings(bookingsData || []);
      }

      // 연락처 데이터 로드
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contactsError) {
        console.error('연락처 데이터 로드 오류:', contactsError);
      } else {
        setContacts(contactsData || []);
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return; // 로딩 중이면 대기
    
    if (!session) {
      // 미들웨어에서 처리하므로 클라이언트 사이드 리다이렉트 제거
      return;
    }
    
    // 인증된 경우 데이터 로드
    loadData();
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
    { id: 'marketing', name: '마케팅', icon: '📈' },
    { id: 'bookings', name: '예약 관리', icon: '📅' },
    { id: 'contacts', name: '연락처 관리', icon: '👥' },
    { id: 'team', name: '팀 관리', icon: '👨‍💼' },
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
      case 'bookings':
        return <BookingManagement bookings={bookings} onUpdate={loadData} />;
      case 'contacts':
        return <ContactManagement contacts={contacts} onUpdate={loadData} />;
      case 'team':
        return <TeamMemberManagement />;
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
        {dataLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          renderTabContent()
        )}
      </main>
    </div>
  );
}
