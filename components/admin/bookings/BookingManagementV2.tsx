import React, { useState, useMemo } from 'react';
import { formatPhoneNumber } from '../../../lib/formatters';

interface QuizResult {
  id: string;
  name: string;
  phone: string;
  email?: string;
  swing_style?: string;
  priority?: string;
  current_distance?: string;
  recommended_flex?: string;
  expected_distance?: string;
  campaign_source?: string;
}

interface Booking {
  id: string;
  quiz_result_id?: string;
  date: string;
  time: string;
  club?: string;
  status?: string;
  memo?: string;
  created_at: string;
  // 조인된 퀴즈 결과 (뷰에서 가져올 때)
  quiz_results?: QuizResult;
  // 기존 호환성을 위한 필드들
  name?: string;
  phone?: string;
  swing_style?: string;
  priority?: string;
  current_distance?: string;
  recommended_flex?: string;
  expected_distance?: string;
}

interface BookingManagementProps {
  bookings: Booking[];
  supabase: any;
  onUpdate: () => void;
}

// 아이콘 컴포넌트들은 기존과 동일...
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

const Info = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export function BookingManagement({ bookings, supabase, onUpdate }: BookingManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMemo, setEditMemo] = useState('');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // 데이터 정규화 - quiz_results 또는 직접 필드 사용
  const normalizedBookings = useMemo(() => {
    return bookings.map(booking => {
      const quizData = booking.quiz_results || {};
      return {
        ...booking,
        name: booking.name || quizData.name || '정보없음',
        phone: booking.phone || quizData.phone || '정보없음',
        swing_style: booking.swing_style || quizData.swing_style,
        priority: booking.priority || quizData.priority,
        current_distance: booking.current_distance || quizData.current_distance,
        recommended_flex: booking.recommended_flex || quizData.recommended_flex,
        expected_distance: booking.expected_distance || quizData.expected_distance,
        campaign_source: booking.campaign_source || quizData.campaign_source
      };
    });
  }, [bookings]);

  // 필터링된 예약 목록
  const filteredBookings = useMemo(() => {
    return normalizedBookings.filter(booking => {
      // 검색어 필터
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!booking.name.toLowerCase().includes(search) && 
            !booking.phone.includes(search)) {
          return false;
        }
      }

      // 날짜 필터
      if (dateFilter !== 'all') {
        const bookingDate = new Date(booking.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case 'today':
            const todayEnd = new Date(today);
            todayEnd.setDate(todayEnd.getDate() + 1);
            if (bookingDate < today || bookingDate >= todayEnd) return false;
            break;
          case 'week':
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            if (bookingDate < today || bookingDate >= weekEnd) return false;
            break;
          case 'month':
            const monthEnd = new Date(today);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            if (bookingDate < today || bookingDate >= monthEnd) return false;
            break;
        }
      }

      // 상태 필터
      if (statusFilter !== 'all' && booking.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [normalizedBookings, searchTerm, dateFilter, statusFilter]);

  // 상태 업데이트
  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (!error) {
      onUpdate();
    }
  };

  // 메모 저장
  const saveMemo = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ memo: editMemo })
      .eq('id', bookingId);

    if (!error) {
      setEditingId(null);
      setEditMemo('');
      onUpdate();
    }
  };

  // 일괄 작업
  const handleBulkAction = async (action: string) => {
    if (selectedBookings.length === 0) return;

    switch (action) {
      case 'contacted':
        await supabase
          .from('bookings')
          .update({ status: 'contacted' })
          .in('id', selectedBookings);
        break;
      case 'completed':
        await supabase
          .from('bookings')
          .update({ status: 'completed' })
          .in('id', selectedBookings);
        break;
      case 'delete':
        if (confirm(`${selectedBookings.length}개의 예약을 삭제하시겠습니까?`)) {
          await supabase
            .from('bookings')
            .delete()
            .in('id', selectedBookings);
        }
        break;
    }

    setSelectedBookings([]);
    onUpdate();
  };

  // CSV 내보내기
  const exportToCSV = () => {
    const headers = ['이름', '전화번호', '날짜', '시간', '클럽', '스타일', '우선순위', '현재거리', '추천플렉스', '예상거리', '상태', '메모', '등록일'];
    const rows = filteredBookings.map(booking => [
      booking.name,
      booking.phone,
      booking.date,
      booking.time,
      booking.club || '',
      booking.swing_style || '',
      booking.priority || '',
      booking.current_distance || '',
      booking.recommended_flex || '',
      booking.expected_distance || '',
      booking.status || '대기중',
      booking.memo || '',
      new Date(booking.created_at).toLocaleDateString('ko-KR')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `예약목록_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 통계 계산
  const stats = useMemo(() => {
    const total = normalizedBookings.length;
    const pending = normalizedBookings.filter(b => b.status === 'pending' || !b.status).length;
    const contacted = normalizedBookings.filter(b => b.status === 'contacted').length;
    const completed = normalizedBookings.filter(b => b.status === 'completed').length;
    const withQuiz = normalizedBookings.filter(b => b.swing_style || b.priority || b.current_distance).length;

    return { total, pending, contacted, completed, withQuiz };
  }, [normalizedBookings]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">예약 관리</h2>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV 내보내기
          </button>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">전체</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="text-sm text-yellow-700">대기중</p>
            <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-700">연락완료</p>
            <p className="text-2xl font-bold text-blue-800">{stats.contacted}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-green-700">완료</p>
            <p className="text-2xl font-bold text-green-800">{stats.completed}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-sm text-purple-700">퀴즈완료</p>
            <p className="text-2xl font-bold text-purple-800">{stats.withQuiz}</p>
          </div>
        </div>

        {/* 필터 */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="이름 또는 전화번호로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">전체 기간</option>
            <option value="today">오늘</option>
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">전체 상태</option>
            <option value="pending">대기중</option>
            <option value="contacted">연락완료</option>
            <option value="completed">완료</option>
          </select>
        </div>
      </div>

      <div className="p-6">
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객정보</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">예약일시</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">클럽</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">퀴즈결과</th>
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
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{booking.name}</p>
                      <a
                        href={`tel:${booking.phone}`}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Phone className="w-3 h-3" />
                        {formatPhoneNumber(booking.phone)}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{booking.date}</p>
                        <p className="text-sm text-gray-500">{booking.time}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{booking.club || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {(booking.swing_style || booking.priority || booking.current_distance) ? (
                      <button
                        onClick={() => setShowDetails(showDetails === booking.id ? null : booking.id)}
                        className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                      >
                        <Info className="w-4 h-4" />
                        상세보기
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                    {showDetails === booking.id && (
                      <div className="absolute z-10 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">스타일:</span> {booking.swing_style || '-'}
                        </p>
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">우선순위:</span> {booking.priority || '-'}
                        </p>
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">현재거리:</span> {booking.current_distance || '-'}
                        </p>
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">추천플렉스:</span> {booking.recommended_flex || '-'}
                        </p>
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">예상거리:</span> {booking.expected_distance || '-'}
                        </p>
                      </div>
                    )}
                  </td>
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
