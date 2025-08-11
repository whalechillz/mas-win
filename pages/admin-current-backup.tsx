import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import CampaignKPIDashboard from '../components/admin/dashboard/CampaignKPIDashboard';
import ContactManagement from '../components/admin/contacts/ContactManagement';
import BookingManagement from '../components/admin/bookings/BookingManagement';
import MarketingDashboardComplete from '../components/admin/marketing/MarketingDashboardComplete';
import TeamMemberManagement from '../components/admin/team/TeamMemberManagement';
import GA4RealtimeDashboard from '../components/admin/dashboard/GA4RealtimeDashboard';

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

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
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
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
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
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'dashboard', name: '대시보드' },
                { id: 'campaigns', name: '캠페인 관리' },
                { id: 'contacts', name: '고객 관리' },
                { id: 'bookings', name: '예약 관리' },
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
                <CampaignKPIDashboard />
                
                {/* GA4 실시간 데이터 */}
                <GA4RealtimeDashboard campaignId="2025-07" />
              </div>
            )}

            {activeTab === 'campaigns' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">캠페인 관리</h2>
                <p className="text-gray-600">캠페인 관리 기능이 여기에 표시됩니다.</p>
              </div>
            )}

            {activeTab === 'contacts' && <ContactManagement supabase={supabase} />}
            {activeTab === 'bookings' && <BookingManagement supabase={supabase} />}
            {activeTab === 'marketing' && <MarketingDashboardComplete supabase={supabase} />}
            {activeTab === 'team' && <TeamMemberManagement supabase={supabase} />}
          </div>
        </div>
      </div>
    </div>
  );
}
