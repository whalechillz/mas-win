import React, { useEffect, useState, useMemo } from 'react';
import { formatPhoneNumber } from '../lib/formatters';
import { Campaign, CampaignMetrics, calculateCampaignMetrics, generateMockPerformanceData } from '../lib/campaign-types';
import { UnifiedCampaignManager } from '../components/admin/campaigns/UnifiedCampaignManager';
import { MetricCards, useRealtimeMetrics } from '../components/admin/dashboard/MetricCards';
import { ConversionFunnel, useRealtimeFunnel } from '../components/admin/dashboard/ConversionFunnel';

// 기존 로그인 컴포넌트와 아이콘 컴포넌트들은 그대로 유지...
const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        onLogin();
      } else {
        setError('아이디 또는 비밀번호가 잘못되었습니다.');
      }
    } catch (err) {
      console.error('Login error:', err);
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
            <h1 className="text-4xl font-bold text-white mb-2">MASGOLF Admin</h1>
            <p className="text-purple-200">세계 최고의 마케팅 대시보드</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="mt-6 text-center text-sm text-purple-200">
            <p>세계 최고의 마케팅 팀을 위한 대시보드</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// SVG 아이콘 컴포넌트들
const Calendar = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const Users = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const TrendingUp = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const Lightning = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const LogOut = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const RefreshCw = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const MessageSquare = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const Activity = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const Megaphone = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);

// Supabase configuration
const supabaseUrl = 'https://yyytjudftvpmcnppaymw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';

const createSupabaseClient = () => {
  if (typeof window !== 'undefined' && window.supabase) {
    return window.supabase.createClient(supabaseUrl, supabaseKey);
  }
  return null;
};

export default function AdminDashboard() {
  const [supabase, setSupabase] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 통합 캠페인 데이터
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: "2025-07",
      name: "여름 특별 캠페인",
      status: "active",
      period: { start: "2025-07-01", end: "2025-07-31" },
      assets: {
        landingPage: "/versions/funnel-2025-07-complete.html",
        landingPageUrl: "/funnel-2025-07",
        opManual: "/docs/op-manuals/2025-07-여름특별/",
        googleAds: "/google_ads/2025.07.여름특별/"
      },
      settings: {
        phoneNumber: "080-028-8888",
        eventDate: "7월 31일",
        remainingSlots: 10,
        discountRate: 50,
        targetAudience: "골프 입문자 및 실력 향상 희망자"
      },
      metrics: {
        views: 1523,
        bookings: 87,
        inquiries: 245,
        conversionRate: 5.7,
        roi: 250,
        costPerAcquisition: 50000
      },
      performance: { daily: [] }
    },
    {
      id: "2025-06",
      name: "프라임타임 캠페인",
      status: "ended",
      period: { start: "2025-06-01", end: "2025-06-30" },
      assets: {
        landingPage: "/versions/funnel-2025-06.html",
        landingPageUrl: "/funnel-2025-06",
        googleAds: "/google_ads/2025.06.11.프라임타임/"
      },
      settings: {
        phoneNumber: "080-028-8888",
        eventDate: "6월 30일",
        remainingSlots: 0,
        discountRate: 40,
        targetAudience: "주말 골퍼"
      },
      metrics: {
        views: 2341,
        bookings: 134,
        inquiries: 389,
        conversionRate: 5.7,
        roi: 180,
        costPerAcquisition: 65000
      },
      performance: { daily: [] }
    },
    {
      id: "2025-05",
      name: "가정의 달 캠페인",
      status: "ended",
      period: { start: "2025-05-01", end: "2025-05-31" },
      assets: {
        landingPage: "/versions/funnel-2025-05.html",
        landingPageUrl: "/funnel-2025-05",
        googleAds: "/google_ads/2025.05.01.가정의달/"
      },
      settings: {
        phoneNumber: "080-028-8888",
        eventDate: "5월 31일",
        remainingSlots: 0,
        discountRate: 30,
        targetAudience: "가족 단위 고객"
      },
      metrics: {
        views: 2897,
        bookings: 156,
        inquiries: 412,
        conversionRate: 5.4,
        roi: 220,
        costPerAcquisition: 55000
      },
      performance: { daily: [] }
    }
  ]);

  // 인증 체크
  useEffect(() => {
    const checkAuth = () => {
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('admin_auth='));
      if (authCookie && authCookie.split('=')[1] === '1') {
        setIsAuthenticated(true);
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Initialize Supabase
  useEffect(() => {
    const initSupabase = async () => {
      if (!window.supabase) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
          const client = createSupabaseClient();
          setSupabase(client);
        };
        document.head.appendChild(script);
      } else {
        const client = createSupabaseClient();
        setSupabase(client);
      }
    };

    initSupabase();
  }, []);

  // Load data
  useEffect(() => {
    if (supabase) {
      loadAllData();
    }
  }, [supabase]);

  const loadAllData = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      await Promise.all([loadBookings(), loadContacts()]);
      // 캠페인 데이터에 모의 성과 데이터 추가
      setCampaigns(prev => prev.map(campaign => generateMockPerformanceData(campaign)));
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) {
      setBookings(data || []);
    }
  };

  const loadContacts = async () => {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) {
      setContacts(data || []);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAllData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleLogout = () => {
    document.cookie = 'admin_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setIsAuthenticated(false);
  };

  // 탭 구성 (중복 제거)
  const tabs = [
    { id: 'overview', label: '대시보드', icon: Activity },
    { id: 'campaigns', label: '캠페인 관리', icon: Megaphone },
    { id: 'bookings', label: '예약 관리', icon: Calendar },
    { id: 'contacts', label: '문의 관리', icon: MessageSquare },
  ];

  // 실시간 메트릭 데이터 (DB 데이터 기반으로 수정)
  const initialMetrics = [
    {
      id: 'total-revenue',
      title: '총 매출',
      value: bookings.length * 1000000, // 예약 1건당 100만원 가정
      change: 12.5,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'green' as const,
      trend: 'up' as const,
      sparklineData: [65, 70, 68, 72, 78, 82, 85, 90]
    },
    {
      id: 'active-campaigns',
      title: '활성 캠페인',
      value: campaigns.filter(c => c.status === 'active').length,
      change: 0,
      icon: <Lightning className="w-6 h-6" />,
      color: 'purple' as const,
      trend: 'neutral' as const
    },
    {
      id: 'conversion-rate',
      title: '평균 전환율',
      value: bookings.length > 0 ? `${((bookings.length / (bookings.length + contacts.length)) * 100).toFixed(1)}%` : '0%',
      change: 8.3,
      icon: <Activity className="w-6 h-6" />,
      color: 'blue' as const,
      trend: 'up' as const,
      sparklineData: [4.8, 5.0, 5.2, 5.1, 5.3, 5.4, 5.5, 5.6]
    },
    {
      id: 'total-customers',
      title: '총 고객수',
      value: bookings.length + contacts.length,
      change: 15.2,
      icon: <Users className="w-6 h-6" />,
      color: 'orange' as const,
      trend: 'up' as const,
      sparklineData: [3200, 3300, 3450, 3500, 3600, 3700, 3800, 3847]
    }
  ];

  const { metrics: realtimeMetrics } = useRealtimeMetrics(initialMetrics, 5000);

  // 전환 깔때기 데이터 (실제 데이터 기반)
  const totalViews = campaigns.reduce((sum, c) => sum + c.metrics.views, 0);
  const totalInquiries = campaigns.reduce((sum, c) => sum + c.metrics.inquiries, 0);
  const totalBookings = campaigns.reduce((sum, c) => sum + c.metrics.bookings, 0);

  const funnelStages = [
    {
      name: '페이지 방문',
      value: totalViews,
      percentage: 100,
      color: '#8B5CF6',
      icon: <Users className="w-5 h-5" />
    },
    {
      name: '관심 표현',
      value: Math.floor(totalViews * 0.5),
      percentage: 50,
      color: '#7C3AED',
      icon: <Activity className="w-5 h-5" />
    },
    {
      name: '문의/상담',
      value: totalInquiries + contacts.length,
      percentage: ((totalInquiries + contacts.length) / totalViews * 100).toFixed(1),
      color: '#6D28D9',
      icon: <MessageSquare className="w-5 h-5" />
    },
    {
      name: '시타 예약',
      value: totalBookings + bookings.length,
      percentage: ((totalBookings + bookings.length) / totalViews * 100).toFixed(1),
      color: '#5B21B6',
      icon: <Calendar className="w-5 h-5" />
    },
    {
      name: '구매 완료',
      value: Math.floor((totalBookings + bookings.length) * 0.8),
      percentage: ((totalBookings + bookings.length) * 0.8 / totalViews * 100).toFixed(1),
      color: '#4C1D95',
      icon: <TrendingUp className="w-5 h-5" />
    }
  ];

  const realtimeFunnelStages = useRealtimeFunnel(funnelStages, 10000);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                MASGOLF Admin
              </h1>
              <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 rounded-full">
                Premium Dashboard
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshData}
                className={`flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>새로고침</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* 네비게이션 */}
        <nav className="px-6">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 실시간 메트릭 카드 */}
            <MetricCards metrics={realtimeMetrics} />

            {/* 전환 깔때기 & 실시간 차트 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ConversionFunnel
                stages={realtimeFunnelStages}
                title="실시간 전환 깔때기"
                animate={true}
                showDropoff={true}
              />
              
              {/* 실시간 활동 피드 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">실시간 활동</h3>
                <div className="space-y-3">
                  {[...bookings.slice(0, 3), ...contacts.slice(0, 3)]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            'date' in item ? 'bg-green-500' : 'bg-blue-500'
                          } animate-pulse`} />
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              {'date' in item ? '시타 예약' : '문의 접수'}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleTimeString('ko-KR')}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* 캠페인 성과 요약 */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-4">이번 달 성과 하이라이트</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <p className="text-purple-100 text-sm">최고 성과 캠페인</p>
                  <p className="text-2xl font-bold mt-1">여름 특별 캠페인</p>
                  <p className="text-purple-100 text-sm mt-2">ROI 250% 달성</p>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <p className="text-purple-100 text-sm">목표 달성률</p>
                  <p className="text-2xl font-bold mt-1">127%</p>
                  <p className="text-purple-100 text-sm mt-2">월 목표 초과 달성</p>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <p className="text-purple-100 text-sm">신규 고객</p>
                  <p className="text-2xl font-bold mt-1">+{bookings.length + contacts.length}명</p>
                  <p className="text-purple-100 text-sm mt-2">실시간 데이터</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <UnifiedCampaignManager
            campaigns={campaigns}
            onCampaignUpdate={(campaign) => {
              setCampaigns(prev => prev.map(c => c.id === campaign.id ? campaign : c));
            }}
            onCreateCampaign={() => {
              // 새 캠페인 생성 모달 열기
              console.log('새 캠페인 만들기');
            }}
          />
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">시타 예약 관리</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객명</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예약일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">클럽</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPhoneNumber(booking.phone)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.club || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(booking.created_at).toLocaleDateString('ko-KR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">문의 관리</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객명</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">통화가능시간</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contacts.map((contact) => (
                      <tr key={contact.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPhoneNumber(contact.phone)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.call_times || '시간무관'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            contact.contacted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {contact.contacted ? '연락완료' : '대기중'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(contact.created_at).toLocaleDateString('ko-KR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
