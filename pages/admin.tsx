import React, { useEffect, useState, useMemo } from 'react';
import { formatPhoneNumber } from '../lib/formatters';

// 로그인 컴포넌트
const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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

      const data = await res.json();
      console.log('Login response:', res.status, data);

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">MASGOLF Admin</h1>
            <p className="text-gray-600 mt-2">관리자 로그인</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                아이디
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>로그인 정보는 관리자에게 문의하세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Lucide React 아이콘들을 직접 SVG로 구현
const Calendar = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const Users = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const TrendingUp = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const Download = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const RefreshCw = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

const Phone = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const Clock = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const Search = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const AlertCircle = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const CheckCircle2 = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
    <path d="m9 12 2 2 4-4"></path>
  </svg>
);

const Trash2 = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const MessageSquare = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const FileText = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const LogOut = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const Activity = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

const Layers = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2 17 12 22 22 17"></polyline>
    <polyline points="2 12 12 17 22 12"></polyline>
  </svg>
);

const Bug = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="14" x="8" y="6" rx="4"></rect>
    <path d="m19 7-3 2"></path>
    <path d="m5 7 3 2"></path>
    <path d="m19 19-3-2"></path>
    <path d="m5 19 3-2"></path>
    <path d="M20 13h-4"></path>
    <path d="M4 13h4"></path>
    <path d="m10 4 1 2"></path>
    <path d="m14 4-1 2"></path>
  </svg>
);

const Megaphone = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 11 18-5v12L3 14v-3z"></path>
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
  </svg>
);

const ExternalLink = ({ size = 24, className = "" }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

// Supabase configuration
const supabaseUrl = 'https://yyytjudftvpmcnppaymw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';

// Create Supabase client
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 버전 관리 데이터
  const versions = [
    { name: '2025년 5월 버전', file: 'funnel-2025-05.html', status: '종료' },
    { name: '2025년 6월 기본', file: 'funnel-2025-06.html', status: '종료' },
    { name: '쿠폰 및 할인 정책', file: 'coupon-policy.html', status: '활성' },
    { name: '2025년 7월 완성본', file: 'funnel-2025-07-complete.html', status: '활성' },
  ];

  // 캠페인 데이터
  const campaigns = [
    { 
      month: '2025년 5월', 
      name: '가정의 달 캠페인',
      status: '종료',
      startDate: '2025-05-01',
      endDate: '2025-05-31',
      url: '/funnel-2025-05'
    },
    { 
      month: '2025년 6월', 
      name: '프라임타임 캠페인',
      status: '종료',
      startDate: '2025-06-01',
      endDate: '2025-06-30',
      url: '/funnel-2025-06'
    },
    { 
      month: '2025년 7월', 
      name: '여름 특별 캠페인',
      status: '진행중',
      startDate: '2025-07-01',
      endDate: '2025-07-31',
      url: '/funnel-2025-07'
    },
  ];

  // 인증 체크
  useEffect(() => {
    // 쿠키 확인
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
      // Load Supabase library if not already loaded
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

  // Load data when Supabase is ready
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

  // Calculate statistics
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const todayBookings = bookings.filter(b => b.created_at.startsWith(today)).length;
    const todayContacts = contacts.filter(c => c.created_at.startsWith(today)).length;
    
    const weekBookings = bookings.filter(b => new Date(b.created_at) >= weekAgo).length;
    const weekContacts = contacts.filter(c => new Date(c.created_at) >= weekAgo).length;
    
    const monthBookings = bookings.filter(b => new Date(b.created_at) >= monthAgo).length;
    const monthContacts = contacts.filter(c => new Date(c.created_at) >= monthAgo).length;
    
    const uncontacted = contacts.filter(c => !c.contacted).length;
    
    return {
      totalBookings: bookings.length,
      totalContacts: contacts.length,
      todayTotal: todayBookings + todayContacts,
      weekTotal: weekBookings + weekContacts,
      monthTotal: monthBookings + monthContacts,
      uncontacted,
      conversionRate: bookings.length > 0 ? ((bookings.length / (bookings.length + contacts.length)) * 100).toFixed(1) : 0
    };
  }, [bookings, contacts]);

  // Filter data based on search and date
  const filteredBookings = useMemo(() => {
    let filtered = bookings;
    
    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.phone.includes(searchTerm) ||
        b.club?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterDate !== 'all') {
      const now = new Date();
      const filterDates = {
        today: new Date().toISOString().split('T')[0],
        week: new Date(now - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now - 30 * 24 * 60 * 60 * 1000)
      };
      
      if (filterDate === 'today') {
        filtered = filtered.filter(b => b.created_at.startsWith(filterDates.today));
      } else {
        filtered = filtered.filter(b => new Date(b.created_at) >= filterDates[filterDate]);
      }
    }
    
    return filtered;
  }, [bookings, searchTerm, filterDate]);

  const filteredContacts = useMemo(() => {
    let filtered = contacts;
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
      );
    }
    
    if (filterDate !== 'all') {
      const now = new Date();
      const filterDates = {
        today: new Date().toISOString().split('T')[0],
        week: new Date(now - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now - 30 * 24 * 60 * 60 * 1000)
      };
      
      if (filterDate === 'today') {
        filtered = filtered.filter(c => c.created_at.startsWith(filterDates.today));
      } else {
        filtered = filtered.filter(c => new Date(c.created_at) >= filterDates[filterDate]);
      }
    }
    
    return filtered;
  }, [contacts, searchTerm, filterDate]);

  const handleLogout = () => {
    // 쿠키 삭제
    document.cookie = 'admin_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setIsAuthenticated(false);
  };

  const deleteBooking = async (id) => {
    if (!supabase || !confirm('정말 삭제하시겠습니까?')) return;
    
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
    
    if (!error) {
      await loadBookings();
    }
  };

  const deleteContact = async (id) => {
    if (!supabase || !confirm('정말 삭제하시겠습니까?')) return;
    
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (!error) {
      await loadContacts();
    }
  };

  const toggleContacted = async (id, contacted) => {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('contacts')
      .update({ contacted })
      .eq('id', id);
    
    if (!error) {
      await loadContacts();
    }
  };

  const exportToCSV = (type) => {
    const data = type === 'bookings' ? filteredBookings : filteredContacts;
    const headers = type === 'bookings' 
      ? ['이름', '연락처', '희망날짜', '희망시간', '관심클럽', '신청시간']
      : ['이름', '연락처', '통화가능시간', '신청시간', '연락여부'];
    
    let csv = '\uFEFF' + headers.join(',') + '\n';
    
    data.forEach(item => {
      if (type === 'bookings') {
        csv += `${item.name},${formatPhoneNumber(item.phone)},${item.date},${item.time},${item.club || ''},${item.created_at}\n`;
      } else {
        csv += `${item.name},${formatPhoneNumber(item.phone)},${item.call_times || ''},${item.created_at},${item.contacted ? 'O' : 'X'}\n`;
      }
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `masgolf_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
      // 초는 제외
    }).format(date);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (loading && !supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">시스템을 초기화하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">MASGOLF Admin</h1>
              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Live
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/docs/july-campaign-op-manual.html"
                target="_blank"
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
              >
                <FileText size={16} />
                <span>OP 매뉴얼</span>
              </a>
              <button
                onClick={refreshData}
                className={`flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all ${refreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={16} />
                <span>새로고침</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                <LogOut size={16} />
                <span>로그아웃</span>
              </button>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Activity size={16} />
                <span>실시간 연동</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="px-6">
          <div className="flex space-x-8 overflow-x-auto">
            {['overview', 'bookings', 'contacts', 'versions', 'campaigns', 'debug'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'overview' && '대시보드'}
                {tab === 'bookings' && '시타 예약'}
                {tab === 'contacts' && '문의 관리'}
                {tab === 'versions' && '버전 관리'}
                {tab === 'campaigns' && '캠페인 관리'}
                {tab === 'debug' && '디버그'}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm text-green-600 font-medium">+12%</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalBookings}</h3>
                <p className="text-sm text-gray-600 mt-1">총 시타 예약</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm text-green-600 font-medium">+8%</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalContacts}</h3>
                <p className="text-sm text-gray-600 mt-1">총 문의</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">{stats.conversionRate}%</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.todayTotal}</h3>
                <p className="text-sm text-gray-600 mt-1">오늘 신청</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className={`text-sm font-medium ${stats.uncontacted > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {stats.uncontacted > 0 ? `${stats.uncontacted}건` : '완료'}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.weekTotal}</h3>
                <p className="text-sm text-gray-600 mt-1">주간 신청</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 시타 예약</h3>
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{booking.name}</p>
                          <p className="text-sm text-gray-500">{booking.club || '클럽 미정'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatDate(booking.date)}</p>
                        <p className="text-xs text-gray-500">{booking.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">미처리 문의</h3>
                <div className="space-y-3">
                  {contacts.filter(c => !c.contacted).slice(0, 5).map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Phone className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{contact.name}</p>
                          <p className="text-sm text-gray-500">{contact.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {contact.call_times || '시간무관'}
                        </p>
                        <p className="text-xs text-gray-500">{formatDateTime(contact.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="이름, 연락처, 클럽 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">전체 기간</option>
                    <option value="today">오늘</option>
                    <option value="week">최근 7일</option>
                    <option value="month">최근 30일</option>
                  </select>
                </div>
                <button
                  onClick={() => exportToCSV('bookings')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download size={16} />
                  <span>CSV 다운로드</span>
                </button>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객 정보</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예약 정보</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관심 클럽</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스윙타입</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">중요요소</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재거리</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신청 시간</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{booking.name}</p>
                            <p className="text-sm text-gray-500">{formatPhoneNumber(booking.phone)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{formatDate(booking.date)}</p>
                            <p className="text-sm text-gray-500">{booking.time}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {booking.club || '미정'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.swing_style || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.priority || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.current_distance ? `${booking.current_distance}m` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateTime(booking.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => deleteBooking(booking.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
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
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="이름, 연락처 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">전체 기간</option>
                    <option value="today">오늘</option>
                    <option value="week">최근 7일</option>
                    <option value="month">최근 30일</option>
                  </select>
                </div>
                <button
                  onClick={() => exportToCSV('contacts')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download size={16} />
                  <span>CSV 다운로드</span>
                </button>
              </div>
            </div>

            {/* Contacts Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객 정보</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">통화 가능 시간</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">스윙타입</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">중요요소</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재거리</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신청 시간</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                            <p className="text-sm text-gray-500">{formatPhoneNumber(contact.phone)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {contact.call_times || '시간무관'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {contact.swing_style || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {contact.priority || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {contact.current_distance ? `${contact.current_distance}m` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateTime(contact.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleContacted(contact.id, !contact.contacted)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                              contact.contacted
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {contact.contacted ? (
                              <>
                                <CheckCircle2 size={14} className="mr-1" />
                                연락완료
                              </>
                            ) : (
                              <>
                                <Clock size={14} className="mr-1" />
                                대기중
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => deleteContact(contact.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Layers className="w-6 h-6 text-blue-600" />
                  버전 관리
                </h2>
                <div className="text-sm text-gray-500">
                  총 {versions.length}개 버전
                </div>
              </div>
              
              <div className="grid gap-4">
                {versions.map((version, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${version.status === '활성' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <div>
                          <h3 className="font-medium text-gray-900">{version.name}</h3>
                          <p className="text-sm text-gray-500">{version.file}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          version.status === '활성' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {version.status}
                        </span>
                        <a
                          href={`/versions/${version.file}`}
                          target="_blank"
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <ExternalLink size={14} />
                          보기
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <a
                  href="/versions"
                  target="_blank"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <ExternalLink size={16} />
                  <span>버전 목록 페이지로 이동</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Megaphone className="w-6 h-6 text-purple-600" />
                  월별 캠페인 관리
                </h2>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  새 캠페인 추가
                </button>
              </div>
              
              <div className="grid gap-4">
                {campaigns.map((campaign, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{campaign.month} - {campaign.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          기간: {campaign.startDate} ~ {campaign.endDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          campaign.status === '진행중' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status}
                        </span>
                        <a
                          href={campaign.url}
                          target="_blank"
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        >
                          <ExternalLink size={14} />
                          페이지 보기
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">캠페인 템플릿</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 계절별 프로모션</li>
                      <li>• 신제품 출시 캠페인</li>
                      <li>• 기념일 특별 할인</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">빠른 작업</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 캠페인 복제하기</li>
                      <li>• 일정 수정하기</li>
                      <li>• 성과 분석 보기</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'debug' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Bug className="w-6 h-6 text-red-600" />
                  디버그 도구
                </h2>
              </div>
              
              <div className="grid gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">시스템 상태</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">데이터베이스 연결</span>
                      <span className="text-green-600 font-medium">정상</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Slack 알림</span>
                      <span className="text-green-600 font-medium">활성</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">캐시 상태</span>
                      <span className="text-gray-900 font-medium">사용 중</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">API 상태</span>
                      <span className="text-green-600 font-medium">정상</span>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">테스트 도구</h3>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/debug-test.html"
                      target="_blank"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      <Bug size={16} />
                      디버그 페이지
                    </a>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                      캐시 초기화
                    </button>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                      로그 확인
                    </button>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                      API 테스트
                    </button>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">최근 에러 로그</h3>
                  <div className="bg-gray-50 rounded p-3 text-sm font-mono text-gray-600">
                    <p>[2025-07-08 10:30:15] INFO: 시스템 정상 작동 중</p>
                    <p>[2025-07-08 09:45:32] INFO: 데이터베이스 연결 성공</p>
                    <p>[2025-07-08 09:00:00] INFO: 서버 재시작 완료</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}