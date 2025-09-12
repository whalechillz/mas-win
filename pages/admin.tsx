import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

      // 문의 데이터 로드
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contactsError) {
        console.error('문의 데이터 로드 오류:', contactsError);
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
    const checkAuth = async () => {
      try {
        // 관리자 인증 확인
        const res = await fetch('/api/admin-check-auth');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            console.log('Admin authentication valid:', data);
            setIsAuthenticated(true);
            loadData(); // 인증 후 데이터 로드
            return;
          }
        }
        
        // Supabase 세션도 확인 (백업)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          loadData();
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Login attempt:', { username, password });

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      console.log('API response status:', res.status);

      if (res.ok) {
        console.log('Login successful!');
        setIsAuthenticated(true);
        loadData(); // 로그인 성공 후 데이터 로드
      } else {
        const errorData = await res.json();
        console.log('Login failed:', errorData);
        setError('아이디 또는 비밀번호가 잘못되었습니다.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // 관리자 로그아웃 API 호출
      await fetch('/api/admin-logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Supabase 로그아웃도 실행 (백업)
      await supabase.auth.signOut();
      
      // 상태 초기화
      setIsAuthenticated(false);
      setUsername('');
      setPassword('');
      
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // 에러가 있어도 로컬 상태는 초기화
      setIsAuthenticated(false);
      setUsername('');
      setPassword('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">MASGOLF Admin</h1>
              <p className="text-purple-200">세계 최고의 마케팅 대시보드</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  아이디
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur"
                  placeholder="관리자 아이디"
                  required
                  autoFocus
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
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    로그인 중...
                  </span>
                ) : (
                  '로그인'
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/20">
              <div className="text-center text-sm text-purple-200">
                <p className="mb-2">🌟 세계 최고의 마케팅 팀을 위한 대시보드 🌟</p>
                <p className="text-xs text-white/60">
                  관리자 전용 시스템 | 무단 접근 금지
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">MASGOLF 관리자</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'dashboard', name: '대시보드' },
                { id: 'google-ads', name: 'Google Ads 관리' },
                { id: 'ga4-analytics', name: 'GA4 분석' },
                { id: 'funnel-manager', name: '퍼널 관리' },
                { id: 'campaigns', name: '캠페인 관리' },
                { id: 'customer-management', name: '예약상담관리' },
                { id: 'marketing', name: '마케팅 콘텐츠' },
                { id: 'team', name: '팀 관리' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 종합 대시보드</h2>
                  <p className="text-gray-600 mb-6">전체 성과 요약 및 주요 KPI를 한눈에 확인하세요.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">🎯 Google Ads</h3>
                      <p className="text-sm text-gray-600 mb-3">캠페인 성과 및 광고 데이터</p>
                      <button 
                        onClick={() => setActiveTab('google-ads')}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Google Ads 관리로 이동
                      </button>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">📈 GA4 분석</h3>
                      <p className="text-sm text-gray-600 mb-3">사용자 행동 및 웹사이트 분석</p>
                      <button 
                        onClick={() => setActiveTab('ga4-analytics')}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                      >
                        GA4 분석으로 이동
                      </button>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">🔄 퍼널 관리</h3>
                      <p className="text-sm text-gray-600 mb-3">랜딩페이지 성과 및 A/B 테스트</p>
                      <button 
                        onClick={() => setActiveTab('funnel-manager')}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
                      >
                        퍼널 관리로 이동
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'google-ads' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">🎯 Google Ads 관리</h2>
                  <p className="text-gray-600">캠페인 성과, 광고 그룹 분석, 키워드 성과를 관리하세요.</p>
                </div>
                
                {/* Google Ads API 진단 도구 */}
                <GoogleAdsDiagnostic />
                
                {/* Google Ads 캠페인 KPI */}
                <CampaignKPIDashboard />
              </div>
            )}

            {activeTab === 'ga4-analytics' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">📈 GA4 분석</h2>
                  <p className="text-gray-600">실시간 데이터, 사용자 행동 분석, 페이지 성과를 확인하세요.</p>
                </div>
                <GA4RealtimeDashboard />
              </div>
            )}

            {activeTab === 'funnel-manager' && (
              <div className="space-y-6">
                <FunnelManagerSimplified />
              </div>
            )}

            {activeTab === 'campaigns' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">캠페인 관리</h2>
                <MonthlyCampaignAnalytics />
              </div>
            )}

            {activeTab === 'customer-management' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">예약 & 상담 통합 관리</h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">예약 관리</h3>
                    <BookingManagement 
                      bookings={bookings || []} 
                      supabase={supabase} 
                      onUpdate={loadData}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">상담 관리</h3>
                    <ContactManagement 
                      contacts={contacts || []} 
                      supabase={supabase} 
                      onUpdate={loadData}
                    />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'marketing' && <IntegratedMarketingHub />}
            {activeTab === 'team' && <TeamMemberManagement supabase={supabase} />}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AdvancedUserAnalyticsProps {
  campaignId?: string;
}

export function AdvancedUserAnalytics({ campaignId }: AdvancedUserAnalyticsProps) {
  const [dateRange, setDateRange] = useState('month'); // 'today', 'week', 'month'
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    dateRange: { startDate: '', endDate: '' },
    sessionMetrics: {
      totalSessions: 0,
      averageSessionDuration: 0,
      bounceRate: 0,
      pagesPerSession: 0,
      activeUsers: 0
    },
    funnelMetrics: {
      eventCounts: {
        pageViews: 0,
        quizStarts: 0,
        quizCompletes: 0,
        bookingFormViews: 0,
        inquiryFormViews: 0,
        phoneClicks: 0,
        bookingSubmits: 0,
        inquirySubmits: 0
      },
      conversionRates: {
        heroToQuiz: 0,
        quizStartToComplete: 0,
        quizToBooking: 0,
        quizToInquiry: 0,
        overallConversion: 0
      }
    },
    scrollMetrics: {
      scrollDepth: { '25%': 0, '50%': 0, '75%': 0, '100%': 0 },
      timeOnPage: { '0-30s': 0, '30s-2m': 0, '2m-5m': 0, '5m+': 0 },
      totalUsers: 0
    },
    performanceMetrics: {
      overall: {
        pageLoadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0
      },
      byDevice: {
        mobile: { avgLoadTime: 0, avgFCP: 0, avgLCP: 0 },
        desktop: { avgLoadTime: 0, avgFCP: 0, avgLCP: 0 },
        tablet: { avgLoadTime: 0, avgFCP: 0, avgLCP: 0 }
      },
      totalSessions: 0
    }
  });

  useEffect(() => {
    const fetchAllAnalytics = async () => {
      setLoading(true);
      try {
        // 모든 API 호출을 병렬로 실행
        const [basicResponse, funnelResponse, scrollResponse, performanceResponse] = await Promise.all([
          fetch(`/api/analytics/advanced-metrics?dateRange=${dateRange}&campaignId=${campaignId}`),
          fetch(`/api/analytics/funnel-metrics?dateRange=${dateRange}&campaignId=${campaignId}`),
          fetch(`/api/analytics/scroll-metrics?dateRange=${dateRange}&campaignId=${campaignId}`),
          fetch(`/api/analytics/performance-metrics?dateRange=${dateRange}&campaignId=${campaignId}`)
        ]);

        const [basicData, funnelData, scrollData, performanceData] = await Promise.all([
          basicResponse.json(),
          funnelResponse.json(),
          scrollResponse.json(),
          performanceResponse.json()
        ]);

        setAnalyticsData({
          dateRange: basicData.dateRange,
          sessionMetrics: basicData.sessionMetrics,
          funnelMetrics: funnelData,
          scrollMetrics: scrollData,
          performanceMetrics: performanceData
        });

      } catch (error) {
        console.error('고급 분석 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAnalytics();
  }, [dateRange, campaignId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">고급 사용자 행동 분석</h2>
        
        {/* 날짜 범위 버튼 - 개선된 스타일 */}
        <div className="flex space-x-2">
          <button
            onClick={() => setDateRange('today')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateRange === 'today' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            오늘
          </button>
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateRange === 'week' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            이번 주
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              dateRange === 'month' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            이번 달
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        분석 기간: {analyticsData.dateRange.startDate} ~ {analyticsData.dateRange.endDate}
      </div>

      {loading ? (
        <div className="text-center py-8">데이터 로딩 중...</div>
      ) : (
        <>
          {/* 세션 메트릭 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">총 세션</h3>
              <p className="text-2xl font-bold text-blue-600">
                {analyticsData.sessionMetrics.totalSessions.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">평균 세션 시간</h3>
              <p className="text-2xl font-bold text-green-600">
                {Math.floor(analyticsData.sessionMetrics.averageSessionDuration / 60)}분 
                {analyticsData.sessionMetrics.averageSessionDuration % 60}초
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">바운스율</h3>
              <p className="text-2xl font-bold text-red-600">
                {typeof analyticsData.sessionMetrics.bounceRate === 'number'
                  ? `${analyticsData.sessionMetrics.bounceRate.toFixed(1)}%`
                  : analyticsData.sessionMetrics.bounceRate || 'NA'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">페이지/세션</h3>
              <p className="text-2xl font-bold text-purple-600">
                {typeof analyticsData.sessionMetrics.pagesPerSession === 'number'
                  ? analyticsData.sessionMetrics.pagesPerSession.toFixed(1)
                  : analyticsData.sessionMetrics.pagesPerSession || 'NA'}
              </p>
            </div>
          </div>

          {/* 퍼널 전환율 (실제 데이터) */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">퍼널 전환율 (실제 데이터)</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData.funnelMetrics.conversionRates.heroToQuiz.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">히어로 → 퀴즈</div>
                <div className="text-xs text-gray-400">
                  {analyticsData.funnelMetrics.eventCounts.quizStarts} / {analyticsData.funnelMetrics.eventCounts.pageViews}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData.funnelMetrics.conversionRates.quizStartToComplete.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">퀴즈 시작 → 완료</div>
                <div className="text-xs text-gray-400">
                  {analyticsData.funnelMetrics.eventCounts.quizCompletes} / {analyticsData.funnelMetrics.eventCounts.quizStarts}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analyticsData.funnelMetrics.conversionRates.quizToBooking.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">퀴즈 → 예약</div>
                <div className="text-xs text-gray-400">
                  {analyticsData.funnelMetrics.eventCounts.bookingFormViews} / {analyticsData.funnelMetrics.eventCounts.quizCompletes}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData.funnelMetrics.conversionRates.quizToInquiry.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">퀴즈 → 문의</div>
                <div className="text-xs text-gray-400">
                  {analyticsData.funnelMetrics.eventCounts.inquiryFormViews} / {analyticsData.funnelMetrics.eventCounts.quizCompletes}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {analyticsData.funnelMetrics.conversionRates.overallConversion.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">전체 전환율</div>
                <div className="text-xs text-gray-400">
                  {analyticsData.funnelMetrics.eventCounts.bookingSubmits + analyticsData.funnelMetrics.eventCounts.inquirySubmits + analyticsData.funnelMetrics.eventCounts.phoneClicks} / {analyticsData.funnelMetrics.eventCounts.pageViews}
                </div>
              </div>
            </div>
          </div>

          {/* 스크롤 깊이 분석 (실제 데이터) */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">스크롤 깊이 분석 (실제 데이터)</h3>
            {analyticsData.scrollMetrics.totalUsers > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(analyticsData.scrollMetrics.scrollDepth).map(([key, value]) => ({
                  depth: key,
                  users: value,
                  percentage: ((value / analyticsData.scrollMetrics.totalUsers) * 100).toFixed(1)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="depth" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`${value}명 (${((value / analyticsData.scrollMetrics.totalUsers) * 100).toFixed(1)}%)`, '사용자 수']} />
                  <Bar dataKey="users" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <p className="text-gray-600 mb-2">스크롤 깊이 데이터가 없습니다</p>
                <p className="text-sm text-gray-500 mb-4">
                  사용자가 페이지를 스크롤하면 25%, 50%, 75%, 100% 지점에서 데이터가 수집됩니다
                </p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>• 스크롤 이벤트가 GA4에 전송되고 있는지 확인</p>
                  <p>• 페이지에 충분한 콘텐츠가 있는지 확인</p>
                  <p>• 사용자가 실제로 스크롤하는지 확인</p>
                </div>
              </div>
            )}
          </div>

          {/* 성능 메트릭 (실제 데이터) */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">페이지 성능 (실제 데이터)</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">페이지 로드 시간</span>
                  <span className="text-sm font-medium">
                    {analyticsData.performanceMetrics?.overall?.pageLoadTime?.toFixed(1) || '0.0'}s
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((analyticsData.performanceMetrics?.overall?.pageLoadTime || 0) * 20, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">첫 번째 콘텐츠풀 페인트</span>
                  <span className="text-sm font-medium">
                    {analyticsData.performanceMetrics?.overall?.firstContentfulPaint?.toFixed(1) || '0.0'}s
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((analyticsData.performanceMetrics?.overall?.firstContentfulPaint || 0) * 30, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">최대 콘텐츠풀 페인트</span>
                  <span className="text-sm font-medium">
                    {analyticsData.performanceMetrics?.overall?.largestContentfulPaint?.toFixed(1) || '0.0'}s
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-orange-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((analyticsData.performanceMetrics?.overall?.largestContentfulPaint || 0) * 25, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
