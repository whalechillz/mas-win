import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import BookingDetailModal from './BookingDetailModal';

interface Booking {
  id: string | number;
  name: string;
  phone: string;
  date: string;
  time: string;
  status?: string;
  attendance_status?: string;
  service_type?: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  customer_grade?: string;
  visit_count?: number;
  no_show_count?: number;
  last_visit_date?: string;
  first_inquiry_date?: string;
}

interface BookingDashboardProps {
  bookings: Booking[];
  customers: Customer[];
  supabase: any;
  onUpdate: () => void;
}

export default function BookingDashboard({ bookings, customers, supabase, onUpdate }: BookingDashboardProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  // 통계 계산
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayBookings = bookings.filter(b => {
      const bookingDate = new Date(b.date);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate.getTime() === today.getTime();
    });

    const upcomingBookings = bookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate >= today && (b.status === 'pending' || b.status === 'confirmed');
    });

    // 참석 상태 통계
    const attended = bookings.filter(b => b.attendance_status === 'attended').length;
    const noShow = bookings.filter(b => b.attendance_status === 'no_show').length;
    const attendanceCancelled = bookings.filter(b => b.attendance_status === 'cancelled').length;
    const attendancePending = bookings.filter(b => !b.attendance_status || b.attendance_status === 'pending').length;
    
    // 노쇼율 계산
    const totalWithAttendance = attended + noShow + attendanceCancelled;
    const noShowRate = totalWithAttendance > 0 ? ((noShow / totalWithAttendance) * 100).toFixed(1) : '0.0';
    
    // 재방문율 계산
    const customersWithMultipleVisits = customers.filter(c => (c.visit_count || 0) > 1).length;
    const repeatVisitRate = customers.length > 0 ? ((customersWithMultipleVisits / customers.length) * 100).toFixed(1) : '0.0';
    
    // 평균 방문 횟수 계산 - 실제 예약이 있는 고객만 기준으로 계산
    const customersWithBookings = customers.filter(c => (c.visit_count || 0) > 0);
    const avgVisitCount = customersWithBookings.length > 0
      ? (customersWithBookings.reduce((sum, c) => sum + (c.visit_count || 0), 0) / customersWithBookings.length).toFixed(1)
      : '0.0';

    return {
      total: bookings.length,
      today: todayBookings.length,
      upcoming: upcomingBookings.length,
      pending: bookings.filter(b => b.status === 'pending' || !b.status).length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      // 참석 상태 통계
      attended,
      noShow,
      attendanceCancelled,
      attendancePending,
      noShowRate,
      // 재방문 통계
      customersWithMultipleVisits,
      repeatVisitRate,
      avgVisitCount,
      totalCustomers: customers.length,
    };
  }, [bookings, customers]);

  // 최근 예약 (오늘 + 향후 7일)
  const recentBookings = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return bookings
      .filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= today && bookingDate <= nextWeek;
      })
      .slice(0, 10)
      .sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [bookings]);

  // 최다 방문 고객 TOP 10
  const topCustomers = useMemo(() => {
    const customerStats = new Map<string, {
      name: string;
      phone: string;
      visitCount: number;
      noShowCount: number;
      dates: string[];
      firstVisit: string | null;
      lastVisit: string | null;
    }>();

    bookings.forEach(booking => {
      const phone = booking.phone;
      if (!customerStats.has(phone)) {
        customerStats.set(phone, {
          name: booking.name,
          phone,
          visitCount: 0,
          noShowCount: 0,
          dates: [],
          firstVisit: null,
          lastVisit: null,
        });
      }
      const stat = customerStats.get(phone)!;
      stat.visitCount++;
      if (booking.attendance_status === 'no_show') {
        stat.noShowCount++;
      }
      if (booking.date) {
        stat.dates.push(booking.date);
        if (!stat.firstVisit || booking.date < stat.firstVisit) {
          stat.firstVisit = booking.date;
        }
        if (!stat.lastVisit || booking.date > stat.lastVisit) {
          stat.lastVisit = booking.date;
        }
      }
    });

    return Array.from(customerStats.values())
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, 10);
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 예약</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">오늘 예약</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.today}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📌</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">대기중</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">완료</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* 추가 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">노쇼율</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.noShowRate}%</p>
              <p className="text-xs text-gray-500 mt-1">노쇼: {stats.noShow}건</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">재방문율</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.repeatVisitRate}%</p>
              <p className="text-xs text-gray-500 mt-1">재방문: {stats.customersWithMultipleVisits}명</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔄</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">평균 방문 횟수</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.avgVisitCount}회</p>
              <p className="text-xs text-gray-500 mt-1">전체 고객: {stats.totalCustomers}명</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">참석</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.attended}</p>
              <p className="text-xs text-gray-500 mt-1">대기: {stats.attendancePending}건</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* 상태별 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">예약 상태</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">확정</span>
              <span className="text-lg font-semibold text-blue-600">{stats.confirmed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">완료</span>
              <span className="text-lg font-semibold text-green-600">{stats.completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">취소</span>
              <span className="text-lg font-semibold text-red-600">{stats.cancelled}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">다가오는 예약</h3>
          <div className="space-y-2">
            {recentBookings.length > 0 ? (
              recentBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="text-sm font-medium text-gray-900 hover:text-red-600 cursor-pointer"
                    >
                      {booking.name}
                    </button>
                    <p className="text-xs text-gray-500">{booking.date} {booking.time}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status || '대기중'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">다가오는 예약이 없습니다.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">최다 방문 고객 TOP 10</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {topCustomers.length > 0 ? (
              topCustomers.map((customer, idx) => (
                <div key={customer.phone} className="py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-6">{idx + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-blue-600">{customer.visitCount}회</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 ml-8">
                    <span>{customer.phone}</span>
                    {customer.noShowCount > 0 && (
                      <span className="text-red-600">노쇼 {customer.noShowCount}회</span>
                    )}
                  </div>
                  {customer.firstVisit && customer.lastVisit && (
                    <div className="text-xs text-gray-400 ml-8 mt-1">
                      {customer.firstVisit} ~ {customer.lastVisit}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">데이터가 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      {/* 빠른 작업 섹션 */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h3>
        <div className="space-y-2">
          <Link
            href="/try-a-massgoo"
            target="_blank"
            className="block w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium text-center"
          >
            예약 페이지 보기
          </Link>
          <button
            onClick={onUpdate}
            className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            데이터 새로고침
          </button>
        </div>
      </div>

      {/* 예약 상세 모달 */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          customers={customers}
          supabase={supabase}
          onClose={() => setSelectedBooking(null)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}

