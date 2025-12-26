import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import AdminNav from '../../../components/admin/AdminNav';
import BookingCalendarView from '../../../components/admin/bookings/BookingCalendarView';
import BookingListView from '../../../components/admin/bookings/BookingListView';
import BookingDashboard from '../../../components/admin/bookings/BookingDashboard';
import BookingSettings from '../../../components/admin/bookings/BookingSettings';
import CustomerGroupedView from '../../../components/admin/bookings/CustomerGroupedView';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BookingAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'dashboard' | 'calendar' | 'list' | 'customers' | 'settings'>('dashboard');
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listViewFilter, setListViewFilter] = useState<{ type: 'date' | 'status'; value: string } | null>(null);

  // 예약 및 고객 데이터 로드
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 예약 데이터 로드 (페이지네이션으로 모든 데이터 가져오기)
      let allBookings: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .order('date', { ascending: true })
          .order('time', { ascending: true })
          .range(from, from + pageSize - 1);

        if (bookingsError) {
          console.error('예약 데이터 로드 오류:', bookingsError);
          break;
        }

        if (bookingsData && bookingsData.length > 0) {
          allBookings = [...allBookings, ...bookingsData];
          from += pageSize;
          // 1000건 미만이면 마지막 페이지
          hasMore = bookingsData.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      setBookings(allBookings);

      // 고객 데이터 로드 (페이지네이션)
      let allCustomers: any[] = [];
      let customerFrom = 0;
      const customerPageSize = 1000;
      let hasMoreCustomers = true;

      while (hasMoreCustomers) {
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false })
          .range(customerFrom, customerFrom + customerPageSize - 1);

        if (customersError) {
          console.error('고객 데이터 로드 오류:', customersError);
          hasMoreCustomers = false;
          break;
        }

        if (customersData && customersData.length > 0) {
          allCustomers = [...allCustomers, ...customersData];
          customerFrom += customerPageSize;
          hasMoreCustomers = customersData.length === customerPageSize;
        } else {
          hasMoreCustomers = false;
        }
      }

      setCustomers(allCustomers);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      setBookings([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }
    
    // 세션 체크 (프로덕션에서 활성화)
    const isLocalDev = typeof window !== 'undefined' && 
                       (window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1');
    const DEBUG_MODE = process.env.NEXT_PUBLIC_ADMIN_DEBUG === 'true' || isLocalDev;
    
    if (!DEBUG_MODE && !session) {
      setLoading(false);
      router.push('/admin/login');
      return;
    }
    
    // if (session) {
    //   loadData();
    // } else {
    //   setLoading(false);
    // }
      loadData();
  }, [session, status, loadData, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 세션 체크 (프로덕션에서 활성화)
  const isLocalDev = typeof window !== 'undefined' && 
                     (window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1');
  const DEBUG_MODE = process.env.NEXT_PUBLIC_ADMIN_DEBUG === 'true' || isLocalDev;
  
  if (!DEBUG_MODE && !session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>시타예약 관리 - MAS Golf</title>
        <meta name="description" content="KGFA 1급 시타 예약 관리 시스템" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        
        <div className="max-w-[1600px] mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">예약 관리</h1>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="/try-a-massgoo"
                  target="_blank"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  예약 페이지 보기
                </a>
              </div>
            </div>
          </div>

          {/* 뷰 모드 전환 탭 */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setViewMode('dashboard')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'dashboard'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  대시보드
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'calendar'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  캘린더
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'list'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  목록
                </button>
                <button
                  onClick={() => setViewMode('customers')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'customers'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  고객별
                </button>
                <button
                  onClick={() => setViewMode('settings')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'settings'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  설정
                </button>
              </nav>
            </div>
          </div>

          {/* 뷰 모드별 콘텐츠 */}
          {viewMode === 'dashboard' && (
            <BookingDashboard 
              bookings={bookings}
              customers={customers}
              supabase={supabase}
              onUpdate={loadData}
              onFilterClick={(filter) => {
                setListViewFilter(filter);
                setViewMode('list');
              }}
            />
          )}
          {viewMode === 'calendar' && (
            <BookingCalendarView 
              bookings={bookings}
              customers={customers}
              supabase={supabase}
              onUpdate={loadData}
            />
          )}
          {viewMode === 'list' && (
            <BookingListView 
              bookings={bookings}
              customers={customers}
              supabase={supabase}
              onUpdate={loadData}
              initialFilter={listViewFilter || undefined}
            />
          )}
          {viewMode === 'customers' && (
            <CustomerGroupedView 
              bookings={bookings}
              customers={customers}
              supabase={supabase}
              onUpdate={loadData}
            />
          )}
          {viewMode === 'settings' && (
            <BookingSettings 
              supabase={supabase}
              onUpdate={loadData}
            />
          )}
        </div>
      </div>
    </>
  );
}

