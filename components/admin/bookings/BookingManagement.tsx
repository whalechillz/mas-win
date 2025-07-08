import React, { useState, useMemo } from 'react';
import { formatPhoneNumber } from '../../../lib/formatters';

interface Booking {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  club?: string;
  created_at: string;
  status?: string;
  memo?: string;
}

interface BookingManagementProps {
  bookings: Booking[];
  supabase: any;
  onUpdate: () => void;
}

const Calendar = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const Search = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const Filter = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const Download = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const Phone = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const Check = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export function BookingManagement({ bookings, supabase, onUpdate }: BookingManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMemo, setEditMemo] = useState('');

  // 필터링된 예약 목록
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // 검색어 필터
      if (searchTerm && !booking.name.includes(searchTerm) && !booking.phone.includes(searchTerm)) {
        return false;
      }

      // 날짜 필터
      if (dateFilter !== 'all') {
        const bookingDate = new Date(booking.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case 'today':
            if (bookingDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (bookingDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            if (bookingDate < monthAgo) return false;
            break;
        }
      }

      // 상태 필터
      if (statusFilter !== 'all' && booking.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [bookings, searchTerm, dateFilter, statusFilter]);

  // 상태 업데이트
  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);

    if (!error) {
      onUpdate();
    }
  };

  // 메모 저장
  const saveMemo = async (id: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ memo: editMemo })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      setEditMemo('');
      onUpdate();
    }
  };

  // 선택된 예약 일괄 처리
  const handleBulkAction = async (action: string) => {
    if (selectedBookings.length === 0) return;

    switch (action) {
      case 'contacted':
        for (const id of selectedBookings) {
          await updateBookingStatus(id, 'contacted');
        }
        break;
      case 'completed':
        for (const id of selectedBookings) {
          await updateBookingStatus(id, 'completed');
        }
        break;
      case 'delete':
        if (confirm('선택한 예약을 삭제하시겠습니까?')) {
          const { error } = await supabase
            .from('bookings')
            .delete()
            .in('id', selectedBookings);
          
          if (!error) {
            setSelectedBookings([]);
            onUpdate();
          }
        }
        break;
    }
  };

  // 엑셀 다운로드
  const downloadExcel = () => {
    const csvContent = [
      ['고객명', '연락처', '예약일', '시간', '클럽', '상태', '메모', '등록일'],
      ...filteredBookings.map(booking => [
        booking.name,
        booking.phone,
        booking.date,
        booking.time,
        booking.club || '-',
        booking.status || '대기중',
        booking.memo || '',
        new Date(booking.created_at).toLocaleString('ko-KR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `예약목록_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">전체 예약</p>
          <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">오늘 예약</p>
          <p className="text-2xl font-bold text-blue-600">
            {bookings.filter(b => new Date(b.date).toDateString() === new Date().toDateString()).length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">연락 대기</p>
          <p className="text-2xl font-bold text-yellow-600">
            {bookings.filter(b => !b.status || b.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">완료</p>
          <p className="text-2xl font-bold text-green-600">
            {bookings.filter(b => b.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* 검색 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="고객명 또는 연락처로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* 날짜 필터 */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">전체 기간</option>
            <option value="today">오늘</option>
            <option value="week">최근 7일</option>
            <option value="month">최근 30일</option>
          </select>

          {/* 상태 필터 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">모든 상태</option>
            <option value="pending">대기중</option>
            <option value="contacted">연락완료</option>
            <option value="completed">완료</option>
          </select>

          {/* 엑셀 다운로드 */}
          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            엑셀 다운로드
          </button>
        </div>

        {/* 일괄 작업 */}
        {selectedBookings.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg mb-4">
            <span className="text-sm font-medium text-purple-900">
              {selectedBookings.length}개 선택됨
            </span>
            <button
              onClick={() => handleBulkAction('contacted')}
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              연락완료 처리
            </button>
            <button
              onClick={() => handleBulkAction('completed')}
              className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              완료 처리
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              삭제
            </button>
          </div>
        )}

        {/* 예약 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
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
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">예약일시</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">클럽</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">메모</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
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
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{booking.name}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`tel:${booking.phone}`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <Phone className="w-4 h-4" />
                      {formatPhoneNumber(booking.phone)}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{booking.date} {booking.time}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{booking.club || '-'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={booking.status || 'pending'}
                      onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        booking.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'contacted'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <option value="pending">대기중</option>
                      <option value="contacted">연락완료</option>
                      <option value="completed">완료</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === booking.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editMemo}
                          onChange={(e) => setEditMemo(e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded"
                          autoFocus
                        />
                        <button
                          onClick={() => saveMemo(booking.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(booking.id);
                          setEditMemo(booking.memo || '');
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        {booking.memo || '메모 추가'}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${booking.phone}`}
                        className="text-blue-600 hover:text-blue-700"
                        title="전화하기"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBookings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
