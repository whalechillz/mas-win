import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatPhoneNumber } from '../../../lib/formatters.js';
import BookingDetailModal from './BookingDetailModal';

interface Booking {
  id: string | number;
  customer_profile_id?: number;
  name: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  club?: string;
  club_brand?: string;
  club_loft?: number;
  club_shaft?: string;
  service_type?: string;
  current_distance?: number;
  age_group?: string;
  trajectory?: string;
  shot_shape?: string;
  duration?: number;
  location?: string;
  assigned_to?: string;
  created_at: string;
  updated_at?: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  status?: string;
  attendance_status?: string;
  notes?: string;
}

interface BookingListViewProps {
  bookings: Booking[];
  customers: any[];
  supabase: any;
  onUpdate: () => void;
  initialFilter?: { type: 'date' | 'status'; value: string };
}

export default function BookingListView({ bookings, customers, supabase, onUpdate, initialFilter }: BookingListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(initialFilter?.type === 'date' ? initialFilter.value : 'all');
  const [combinedStatusFilter, setCombinedStatusFilter] = useState(initialFilter?.type === 'status' ? initialFilter.value : 'all'); // 통합 필터
  const [serviceFilter, setServiceFilter] = useState('all');
  const [selectedBookings, setSelectedBookings] = useState<(string | number)[]>([]);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editMemo, setEditMemo] = useState('');
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [syncingBooking, setSyncingBooking] = useState<Booking | null>(null);
  const [bulkSyncMode, setBulkSyncMode] = useState(false);
  const [syncOptions, setSyncOptions] = useState({
    syncName: true,
    syncPhone: false,
    syncEmail: true,
    linkCustomer: true,
  });
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'email' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 정렬 핸들러
  const handleSort = (column: 'name' | 'date' | 'email') => {
    if (sortBy === column) {
      // 같은 컬럼 클릭 시 정렬 순서 토글
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 컬럼 클릭 시 해당 컬럼으로 정렬 (기본 오름차순)
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // 필터링 및 정렬된 예약 목록
  const filteredBookings = useMemo(() => {
    let filtered = bookings.filter(booking => {
      // 검색어 필터
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = booking.name?.toLowerCase().includes(searchLower);
        const matchesPhone = booking.phone?.includes(searchTerm);
        const matchesEmail = booking.email?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesPhone && !matchesEmail) {
          return false;
        }
      }

      // 날짜 필터
      if (dateFilter !== 'all') {
        const bookingDate = new Date(booking.date);
        bookingDate.setHours(0, 0, 0, 0); // 시간을 0으로 설정하여 날짜만 비교
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case 'today':
            if (bookingDate.getTime() !== today.getTime()) return false;
            break;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            weekAgo.setHours(0, 0, 0, 0);
            if (bookingDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setDate(monthAgo.getDate() - 30); // 정확히 30일 전
            monthAgo.setHours(0, 0, 0, 0);
            // 최근 30일 = 오늘부터 30일 전까지 (과거 30일)
            if (bookingDate < monthAgo || bookingDate > today) return false;
            break;
        }
      }

      // 통합 상태 필터
      if (combinedStatusFilter !== 'all') {
        const status = booking.status || 'pending';
        const attendance = booking.attendance_status || 'pending';
        
        switch (combinedStatusFilter) {
          case 'booking_pending':
            if (status !== 'pending') return false;
            break;
          case 'booking_confirmed':
            if (status !== 'confirmed') return false;
            break;
          case 'booking_completed':
            if (status !== 'completed') return false;
            break;
          case 'booking_cancelled':
            if (status !== 'cancelled') return false;
            break;
          case 'attendance_attended':
            if (attendance !== 'attended') return false;
            break;
          case 'attendance_no_show':
            if (attendance !== 'no_show') return false;
            break;
          case 'attendance_pending':
            if (attendance !== 'pending') return false;
            break;
          case 'attendance_cancelled':
            if (attendance !== 'cancelled') return false;
            break;
          case 'needs_attention':
            // 확정되었지만 참석 상태가 대기중이고 날짜가 지난 경우
            if (status === 'confirmed' && attendance === 'pending') {
              const bookingDate = new Date(booking.date);
              bookingDate.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (bookingDate < today) {
                return true; // 확인 필요 항목
              }
            }
            return false; // 조건에 맞지 않으면 제외
        }
      }

      // 서비스 타입 필터
      if (serviceFilter !== 'all' && booking.service_type !== serviceFilter) {
        return false;
      }

      return true;
    });

    // 정렬 적용
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        
        if (sortBy === 'name') {
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          comparison = nameA.localeCompare(nameB, 'ko');
        } else if (sortBy === 'date') {
          // 날짜와 시간을 결합하여 정렬
          const dateTimeA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime();
          const dateTimeB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime();
          comparison = dateTimeA - dateTimeB;
        } else if (sortBy === 'email') {
          // 이메일 정렬 (없는 경우 맨 뒤로)
          const emailA = (a.email || '').toLowerCase();
          const emailB = (b.email || '').toLowerCase();
          if (!emailA && !emailB) {
            comparison = 0;
          } else if (!emailA) {
            comparison = 1; // A가 없으면 뒤로
          } else if (!emailB) {
            comparison = -1; // B가 없으면 뒤로
          } else {
            comparison = emailA.localeCompare(emailB, 'en');
          }
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else {
      // ⭐ 추가: sortBy가 null인 경우에도 기본 정렬 적용 (최신 예약일순)
      filtered = [...filtered].sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime();
        const dateTimeB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime();
        return dateTimeB - dateTimeA; // 내림차순 (최신순)
      });
    }

    return filtered;
  }, [bookings, searchTerm, dateFilter, combinedStatusFilter, serviceFilter, sortBy, sortOrder]);

  // 상태 업데이트
  const updateBookingStatus = async (id: string | number, status: string) => {
    const bookingId = typeof id === 'number' ? id : parseInt(String(id));
    
    // 기존 예약 정보 조회 (상태 변경 전)
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single();
    
    const previousStatus = existingBooking?.status || 'pending';
    const updateData: any = { status };
    
    const now = new Date().toISOString();
    if (status === 'confirmed' && !updateData.confirmed_at) {
      updateData.confirmed_at = now;
    }
    if (status === 'completed' && !updateData.completed_at) {
      updateData.completed_at = now;
    }
    if (status === 'cancelled' && !updateData.cancelled_at) {
      updateData.cancelled_at = now;
    }

    const { error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (!error) {
      // 상태가 'confirmed'로 변경된 경우 알림 발송
      if (status === 'confirmed' && previousStatus !== 'confirmed') {
        try {
          // 고객 알림 (카카오톡 → SMS 대체)
          fetch('/api/bookings/notify-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId,
              notificationType: 'booking_confirmed',
            }),
          }).catch(err => console.error('고객 알림 발송 오류 (무시):', err));

          // Slack 알림 (관리자)
          fetch('/api/slack/booking-notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'booking_confirmed',
              bookingId,
            }),
          }).catch(err => console.error('Slack 알림 발송 오류 (무시):', err));
        } catch (notificationError) {
          // 알림 실패해도 상태 업데이트는 성공 처리
          console.error('알림 발송 중 오류 (무시):', notificationError);
        }
      }
      
      // 상태가 'completed'로 변경된 경우 알림 발송 (선택사항)
      if (status === 'completed' && previousStatus !== 'completed') {
        try {
          // 고객 알림 (감사 메시지)
          fetch('/api/bookings/notify-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId,
              notificationType: 'booking_completed',
            }),
          }).catch(err => console.error('고객 알림 발송 오류 (무시):', err));

          // Slack 알림 (관리자)
          fetch('/api/slack/booking-notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'booking_completed',
              bookingId,
            }),
          }).catch(err => console.error('Slack 알림 발송 오류 (무시):', err));
        } catch (notificationError) {
          console.error('알림 발송 중 오류 (무시):', notificationError);
        }
      }
      
      onUpdate();
    }
  };

  // 메모 저장
  const saveMemo = async (id: string | number) => {
    const bookingId = typeof id === 'number' ? id : parseInt(String(id));
    const { error } = await supabase
      .from('bookings')
      .update({ notes: editMemo })
      .eq('id', bookingId);

    if (!error) {
      setEditingId(null);
      setEditMemo('');
      onUpdate();
    }
  };

  // 삭제
  const deleteBooking = async (id: string | number) => {
    if (!confirm('이 예약을 삭제하시겠습니까?')) return;
    
    const bookingId = typeof id === 'number' ? id : parseInt(String(id));
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (!error) {
      onUpdate();
    }
  };

  // 고객 정보 찾기
  const getCustomerInfo = (phone: string) => {
    if (!customers || customers.length === 0) return null;
    return customers.find((c: any) => c.phone === phone);
  };

  // 고객 연결 상태 확인
  const getCustomerConnectionStatus = (booking: Booking) => {
    const customerInfo = getCustomerInfo(booking.phone);
    const isLinked = booking.customer_profile_id !== null && booking.customer_profile_id !== undefined;
    
    return {
      hasCustomer: !!customerInfo,
      isLinked,
      customerInfo,
      needsSync: customerInfo && !isLinked, // 고객은 있지만 연결 안됨
    };
  };

  // 개별 예약 동기화
  const syncBookingWithCustomer = async (booking: Booking, options: typeof syncOptions) => {
    const customerInfo = getCustomerInfo(booking.phone);
    if (!customerInfo) {
      alert('고객 정보를 찾을 수 없습니다.');
      return false;
    }
    
    const updateData: any = {};
    
    if (options.syncName && booking.name !== customerInfo.name) {
      updateData.name = customerInfo.name;
    }
    
    if (options.syncPhone && booking.phone !== customerInfo.phone) {
      updateData.phone = customerInfo.phone;
    }
    
    if (options.syncEmail) {
      if (customerInfo.email && booking.email !== customerInfo.email) {
        updateData.email = customerInfo.email;
      } else if (!customerInfo.email && booking.email) {
        // 고객에 이메일이 없으면 예약 이메일을 고객에 업데이트할 수도 있지만, 여기서는 예약만 업데이트
      }
    }
    
    if (options.linkCustomer) {
      updateData.customer_profile_id = customerInfo.id;
    }
    
    if (Object.keys(updateData).length === 0) {
      return false; // 동기화할 항목이 없음
    }
    
    const bookingId = typeof booking.id === 'number' ? booking.id : parseInt(String(booking.id));
    const { error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);
    
    if (error) {
      console.error('동기화 실패:', error);
      return false;
    }
    
    return true;
  };

  // 일괄 동기화
  const bulkSyncBookings = async () => {
    if (selectedBookings.length === 0) {
      alert('동기화할 예약을 선택해주세요.');
      return;
    }

    const bookingsToSync = filteredBookings.filter(b => selectedBookings.includes(b.id));
    const syncableBookings = bookingsToSync.filter(b => {
      const status = getCustomerConnectionStatus(b);
      return status.hasCustomer;
    });

    if (syncableBookings.length === 0) {
      alert('선택한 예약 중 동기화 가능한 예약이 없습니다. (고객 정보가 있는 예약만 동기화 가능)');
      return;
    }

    if (!confirm(`${syncableBookings.length}건의 예약을 동기화하시겠습니까?`)) {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const booking of syncableBookings) {
      const success = await syncBookingWithCustomer(booking, syncOptions);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    alert(`동기화 완료!\n성공: ${successCount}건\n실패: ${failCount}건`);
    setSelectedBookings([]);
    setBulkSyncMode(false);
    onUpdate();
  };

  // 시간 포맷팅 (초 제거)
  const formatTime = (time: string): string => {
    if (!time) return '';
    // "HH:MM:SS" 형식을 "HH:MM"으로 변환
    return time.split(':').slice(0, 2).join(':');
  };

  // 날짜에 요일 추가
  const formatDateWithDay = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}(${dayOfWeek})`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="고객명, 전화번호, 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
          >
            <option value="all">전체 기간</option>
            <option value="today">오늘</option>
            <option value="week">최근 7일</option>
            <option value="month">최근 30일</option>
          </select>
          <select
            value={combinedStatusFilter}
            onChange={(e) => setCombinedStatusFilter(e.target.value)}
            className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
          >
            <option value="all">전체</option>
            <optgroup label="예약 상태 (회사)">
              <option value="booking_pending">예약 대기중</option>
              <option value="booking_confirmed">예약 확정</option>
              <option value="booking_completed">서비스 완료</option>
              <option value="booking_cancelled">예약 취소</option>
            </optgroup>
            <optgroup label="참석 상태 (고객)">
              <option value="attendance_attended">실제 참석</option>
              <option value="attendance_no_show">노쇼</option>
              <option value="attendance_pending">참석 대기중</option>
              <option value="attendance_cancelled">참석 취소</option>
            </optgroup>
            <optgroup label="관리">
              <option value="needs_attention">확인 필요 (확정+과거날짜+참석대기)</option>
            </optgroup>
          </select>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
          >
            <option value="all">모든 서비스</option>
            {Array.from(new Set(bookings.map(b => b.service_type).filter(Boolean))).map(service => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 일괄 동기화 버튼 */}
      {selectedBookings.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedBookings.length}건 선택됨
            </span>
            {bulkSyncMode && (
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={syncOptions.syncName}
                    onChange={(e) => setSyncOptions({...syncOptions, syncName: e.target.checked})}
                  />
                  <span>이름</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={syncOptions.syncPhone}
                    onChange={(e) => setSyncOptions({...syncOptions, syncPhone: e.target.checked})}
                  />
                  <span>전화번호</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={syncOptions.syncEmail}
                    onChange={(e) => setSyncOptions({...syncOptions, syncEmail: e.target.checked})}
                  />
                  <span>이메일</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={syncOptions.linkCustomer}
                    onChange={(e) => setSyncOptions({...syncOptions, linkCustomer: e.target.checked})}
                  />
                  <span>고객 연결</span>
                </label>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!bulkSyncMode ? (
              <button
                onClick={() => setBulkSyncMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                일괄 동기화 설정
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setBulkSyncMode(false);
                    setSyncOptions({ syncName: true, syncPhone: false, syncEmail: true, linkCustomer: true });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                >
                  취소
                </button>
                <button
                  onClick={bulkSyncBookings}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  일괄 동기화 실행
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedBookings([])}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
            >
              선택 해제
            </button>
          </div>
        </div>
      )}

      {/* 예약 목록 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '1400px' }}>
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                  <input
                    type="checkbox"
                    checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBookings(filteredBookings.map(b => b.id));
                      } else {
                        setSelectedBookings([]);
                      }
                    }}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    고객명
                    {sortBy === 'name' && (
                      <span className="text-blue-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                    {sortBy !== 'name' && (
                      <span className="text-gray-300">⇅</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <button
                    onClick={() => handleSort('email')}
                    className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    이메일
                    {sortBy === 'email' && (
                      <span className="text-blue-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                    {sortBy !== 'email' && (
                      <span className="text-gray-300">⇅</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    예약일시
                    {sortBy === 'date' && (
                      <span className="text-blue-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                    {sortBy !== 'date' && (
                      <span className="text-gray-300">⇅</span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">서비스</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">사용클럽</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">비거리</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연령대</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">탄도</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">구질</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '180px' }}>상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">메모</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => {
                const connectionStatus = getCustomerConnectionStatus(booking);
                const customerInfo = connectionStatus.customerInfo;
                return (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedBookings.includes(booking.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBookings([...selectedBookings, booking.id]);
                          } else {
                            setSelectedBookings(selectedBookings.filter(id => id !== booking.id));
                          }
                        }}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/customers?phone=${encodeURIComponent(booking.phone)}&autoEdit=true`}
                          className="text-sm font-medium text-gray-900 hover:text-red-600 underline-offset-2 hover:underline"
                          title="고객 정보 보기"
                        >
                          {booking.name || '-'}
                        </Link>
                        {customerInfo ? (
                          connectionStatus.isLinked ? (
                            <Link
                              href={`/admin/customers?phone=${encodeURIComponent(booking.phone)}&autoEdit=true`}
                              className="text-xs text-green-600 hover:text-green-700"
                              title="고객 연결됨"
                            >
                              ✅
                            </Link>
                          ) : (
                            <button
                              onClick={() => setSyncingBooking(booking)}
                              className="text-xs text-orange-600 hover:text-orange-700"
                              title="고객 연결 필요 - 동기화"
                            >
                              🔗
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-gray-400" title="고객 정보 없음">
                            ⚠️
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${booking.phone}`}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {formatPhoneNumber(booking.phone)}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {booking.email ? (
                        <a
                          href={`mailto:${booking.email}`}
                          className="text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {booking.email}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {booking.date} {formatTime(booking.time)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {booking.service_type || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(() => {
                        // club_brand가 있으면 우선 표시
                        if (booking.club_brand) {
                          let clubStr = booking.club_brand;
                          if (booking.club_loft) clubStr += ` ${booking.club_loft}°`;
                          if (booking.club_shaft) clubStr += ` ${booking.club_shaft}`;
                          return clubStr;
                        }
                        // club 필드가 service_type과 같으면 '-' 표시 (잘못된 데이터)
                        if (booking.club && booking.club === booking.service_type) {
                          return '-';
                        }
                        // club 필드가 비어있거나 공백이면 '-' 표시
                        if (!booking.club || booking.club.trim() === '') {
                          return '-';
                        }
                        return booking.club;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {booking.current_distance ? `${booking.current_distance}m` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {booking.age_group || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {booking.trajectory === 'high' ? '고' :
                       booking.trajectory === 'mid' ? '중' :
                       booking.trajectory === 'low' ? '저' : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {booking.shot_shape === 'fade' ? '페이드' :
                       booking.shot_shape === 'draw' ? '드로우' :
                       booking.shot_shape === 'straight' ? '스트레이트' :
                       booking.shot_shape === 'hook' ? '훅' :
                       booking.shot_shape === 'slice' ? '슬라이스' : '-'}
                    </td>
                    <td className="px-4 py-3" style={{ minWidth: '180px' }}>
                      <div className="flex flex-col gap-1.5">
                        {/* 예약 상태 (회사) */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 whitespace-nowrap" style={{ minWidth: '50px' }}>예약:</span>
                          <select
                            value={booking.status || 'pending'}
                            onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                            className={`px-2 py-1 text-xs rounded border-0 flex-1 ${
                              booking.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-800'
                                : booking.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            <option value="pending">대기중</option>
                            <option value="confirmed">확정</option>
                            <option value="completed">완료</option>
                            <option value="cancelled">취소</option>
                          </select>
                        </div>
                        {/* 참석 상태 (고객) */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 whitespace-nowrap" style={{ minWidth: '50px' }}>참석:</span>
                          <select
                            value={booking.attendance_status || 'pending'}
                            onChange={async (e) => {
                              const bookingId = typeof booking.id === 'number' ? booking.id : parseInt(String(booking.id));
                              const { error } = await supabase
                                .from('bookings')
                                .update({ attendance_status: e.target.value })
                                .eq('id', bookingId);
                              if (!error) {
                                onUpdate();
                              }
                            }}
                            className={`px-2 py-1 text-xs rounded border-0 flex-1 ${
                              booking.attendance_status === 'attended'
                                ? 'bg-green-50 text-green-700 border border-green-300'
                                : booking.attendance_status === 'no_show'
                                ? 'bg-red-50 text-red-700 border border-red-300'
                                : booking.attendance_status === 'cancelled'
                                ? 'bg-gray-50 text-gray-700 border border-gray-300'
                                : 'bg-yellow-50 text-yellow-700 border border-yellow-300'
                            }`}
                          >
                            <option value="pending">대기</option>
                            <option value="attended">참석</option>
                            <option value="no_show">노쇼</option>
                            <option value="cancelled">취소</option>
                          </select>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === booking.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editMemo}
                            onChange={(e) => setEditMemo(e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded w-32"
                            autoFocus
                          />
                          <button
                            onClick={() => saveMemo(booking.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(booking.id);
                            setEditMemo(booking.notes || '');
                          }}
                          className="text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded"
                        >
                          {booking.notes || '메모 추가'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingBooking(booking)}
                          className="text-purple-600 hover:text-purple-700"
                          title="상세보기"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => setEditingBooking(booking)}
                          className="text-green-600 hover:text-green-700"
                          title="수정"
                        >
                          ✏️
                        </button>
                        {connectionStatus.needsSync && (
                          <button
                            onClick={() => setSyncingBooking(booking)}
                            className="text-orange-600 hover:text-orange-700"
                            title="고객 동기화"
                          >
                            🔄
                          </button>
                        )}
                        <a
                          href={`tel:${booking.phone}`}
                          className="text-blue-600 hover:text-blue-700"
                          title="전화하기"
                        >
                          📞
                        </a>
                        <button
                          onClick={() => deleteBooking(booking.id)}
                          className="text-red-600 hover:text-red-700"
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            검색 결과가 없습니다.
          </div>
        )}
      </div>

      {/* 예약 상세 모달 */}
      {viewingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">예약 상세</h2>
                <button
                  onClick={() => setViewingBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {(() => {
                const customerInfo = getCustomerInfo(viewingBooking.phone);
                return customerInfo ? (
                  <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-900">👤 등록된 고객 정보</p>
                        <p className="text-xs text-purple-700 mt-1">
                          VIP: {customerInfo.customer_grade || 'NONE'}
                        </p>
                      </div>
                      <Link
                        href={`/admin/customers?phone=${encodeURIComponent(viewingBooking.phone)}&autoEdit=true`}
                        className="text-xs text-purple-600 hover:text-purple-700 hover:underline"
                      >
                        고객 정보 보기 →
                      </Link>
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">고객명</label>
                  <p className="text-gray-900">{viewingBooking.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">전화번호</label>
                  <p className="text-gray-900">{viewingBooking.phone}</p>
                </div>
                {viewingBooking.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">이메일</label>
                    <p className="text-gray-900">{viewingBooking.email}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">예약일시</label>
                  <p className="text-gray-900">{formatDateWithDay(viewingBooking.date)} {formatTime(viewingBooking.time)}</p>
                </div>
                {viewingBooking.service_type && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">서비스</label>
                    <p className="text-gray-900">{viewingBooking.service_type}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">위치</label>
                  <p className="text-gray-900">{viewingBooking.location || 'Massgoo Studio'}</p>
                </div>
              </div>

              {viewingBooking.notes && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">메모</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{viewingBooking.notes}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setViewingBooking(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 예약 수정 모달 */}
      {editingBooking && (
        <BookingDetailModal
          booking={editingBooking}
          customers={customers}
          supabase={supabase}
          onClose={() => setEditingBooking(null)}
          onUpdate={() => {
            setEditingBooking(null);
            onUpdate();
          }}
          defaultEditing={true}
        />
      )}

      {/* 동기화 모달 */}
      {syncingBooking && (() => {
        const customerInfo = getCustomerInfo(syncingBooking.phone);
        if (!customerInfo) {
          setTimeout(() => setSyncingBooking(null), 100);
          return null;
        }
        
        // 모달이 열릴 때마다 기본 옵션 계산
        const defaultOptions = {
          syncName: syncingBooking.name !== customerInfo.name,
          syncPhone: false,
          syncEmail: syncingBooking.email !== customerInfo.email,
          linkCustomer: !syncingBooking.customer_profile_id,
        };
        
        // 모달용 로컬 옵션 (모달이 열릴 때마다 초기화)
        const modalSyncOptions = {
          syncName: syncOptions.syncName !== undefined ? syncOptions.syncName : defaultOptions.syncName,
          syncPhone: syncOptions.syncPhone !== undefined ? syncOptions.syncPhone : defaultOptions.syncPhone,
          syncEmail: syncOptions.syncEmail !== undefined ? syncOptions.syncEmail : defaultOptions.syncEmail,
          linkCustomer: syncOptions.linkCustomer !== undefined ? syncOptions.linkCustomer : defaultOptions.linkCustomer,
        };
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4">예약-고객 동기화</h3>
              
              <div className="mb-4 space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">예약 정보:</p>
                  <div className="bg-gray-50 p-2 rounded text-sm">
                    <p>이름: <span className="font-medium">{syncingBooking.name}</span></p>
                    <p>전화번호: <span className="font-medium">{formatPhoneNumber(syncingBooking.phone)}</span></p>
                    {syncingBooking.email && <p>이메일: <span className="font-medium">{syncingBooking.email}</span></p>}
                    {!syncingBooking.customer_profile_id && (
                      <p className="text-orange-600 text-xs mt-1">⚠️ 고객 연결 안됨</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">고객 정보:</p>
                  <div className="bg-blue-50 p-2 rounded text-sm">
                    <p>이름: <span className="font-medium">{customerInfo.name}</span></p>
                    <p>전화번호: <span className="font-medium">{formatPhoneNumber(customerInfo.phone)}</span></p>
                    {customerInfo.email && <p>이메일: <span className="font-medium">{customerInfo.email}</span></p>}
                  </div>
                </div>
              </div>
              
              <div className="mb-4 space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">동기화할 항목 선택:</p>
                <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalSyncOptions.syncName}
                    onChange={(e) => {
                      setSyncOptions({...modalSyncOptions, syncName: e.target.checked});
                    }}
                  />
                  <span className="text-sm">
                    이름 동기화
                    {modalSyncOptions.syncName && (
                      <span className="text-gray-500 ml-1">
                        ({syncingBooking.name} → {customerInfo.name})
                      </span>
                    )}
                  </span>
                </label>
                <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalSyncOptions.syncPhone}
                    onChange={(e) => {
                      setSyncOptions({...modalSyncOptions, syncPhone: e.target.checked});
                    }}
                  />
                  <span className="text-sm">전화번호 동기화</span>
                </label>
                <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalSyncOptions.syncEmail}
                    onChange={(e) => {
                      setSyncOptions({...modalSyncOptions, syncEmail: e.target.checked});
                    }}
                  />
                  <span className="text-sm">
                    이메일 동기화
                    {modalSyncOptions.syncEmail && (
                      <span className="text-gray-500 ml-1">
                        ({syncingBooking.email || '(없음)'} → {customerInfo.email || '(없음)'})
                      </span>
                    )}
                  </span>
                </label>
                <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalSyncOptions.linkCustomer}
                    onChange={(e) => {
                      setSyncOptions({...modalSyncOptions, linkCustomer: e.target.checked});
                    }}
                  />
                  <span className="text-sm">
                    고객 연결 (customer_profile_id 설정)
                    {modalSyncOptions.linkCustomer && (
                      <span className="text-green-600 ml-1">✓ 필수 권장</span>
                    )}
                  </span>
                </label>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSyncingBooking(null);
                    setSyncOptions({ syncName: true, syncPhone: false, syncEmail: true, linkCustomer: true });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    const success = await syncBookingWithCustomer(syncingBooking, modalSyncOptions);
                    if (success) {
                      alert('동기화 완료!');
                      setSyncingBooking(null);
                      setSyncOptions({ syncName: true, syncPhone: false, syncEmail: true, linkCustomer: true });
                      onUpdate();
                    } else {
                      alert('동기화할 항목이 없거나 실패했습니다.');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  동기화
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

