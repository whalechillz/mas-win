import React, { useState, useMemo } from 'react';
import { formatPhoneNumber } from '../../../lib/formatters.js';
import BookingDetailModal from './BookingDetailModal';

interface Booking {
  id: string | number;
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
  status?: string;
  attendance_status?: string;
  notes?: string;
  created_at: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  visit_count?: number;
  no_show_count?: number;
  last_visit_date?: string;
  first_inquiry_date?: string;
}

interface CustomerGroupedViewProps {
  bookings: Booking[];
  customers: Customer[];
  supabase: any;
  onUpdate: () => void;
}

export default function CustomerGroupedView({ bookings, customers, supabase, onUpdate }: CustomerGroupedViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPhones, setExpandedPhones] = useState<Set<string>>(new Set());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'visitCount' | 'lastVisit'>('visitCount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 고객별로 그룹화
  const groupedByCustomer = useMemo(() => {
    const grouped = new Map<string, {
      customer: Customer | undefined;
      bookings: Booking[];
      stats: {
        visitCount: number;
        noShowCount: number;
        attendedCount: number;
        firstVisit: string | null;
        lastVisit: string | null;
      };
    }>();

    bookings.forEach(booking => {
      const phone = booking.phone;
      if (!grouped.has(phone)) {
        const customer = customers.find(c => c.phone === phone);
        grouped.set(phone, {
          customer,
          bookings: [],
          stats: {
            visitCount: 0,
            noShowCount: 0,
            attendedCount: 0,
            firstVisit: null,
            lastVisit: null,
          },
        });
      }
      const group = grouped.get(phone)!;
      group.bookings.push(booking);
      group.stats.visitCount++;
      if (booking.attendance_status === 'no_show') {
        group.stats.noShowCount++;
      }
      if (booking.attendance_status === 'attended') {
        group.stats.attendedCount++;
      }
      if (booking.date) {
        if (!group.stats.firstVisit || booking.date < group.stats.firstVisit) {
          group.stats.firstVisit = booking.date;
        }
        if (!group.stats.lastVisit || booking.date > group.stats.lastVisit) {
          group.stats.lastVisit = booking.date;
        }
      }
    });

    // 정렬
    const sorted = Array.from(grouped.values()).sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        const nameA = (a.customer?.name || a.bookings[0]?.name || '').toLowerCase();
        const nameB = (b.customer?.name || b.bookings[0]?.name || '').toLowerCase();
        comparison = nameA.localeCompare(nameB, 'ko');
      } else if (sortBy === 'visitCount') {
        comparison = a.stats.visitCount - b.stats.visitCount;
      } else if (sortBy === 'lastVisit') {
        const dateA = a.stats.lastVisit || '';
        const dateB = b.stats.lastVisit || '';
        comparison = dateA.localeCompare(dateB);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // 검색 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return sorted.filter(group => {
        const name = (group.customer?.name || group.bookings[0]?.name || '').toLowerCase();
        const phone = group.customer?.phone || group.bookings[0]?.phone || '';
        return name.includes(searchLower) || phone.includes(searchTerm);
      });
    }

    return sorted;
  }, [bookings, customers, searchTerm, sortBy, sortOrder]);

  const toggleExpand = (phone: string) => {
    const newExpanded = new Set(expandedPhones);
    if (newExpanded.has(phone)) {
      newExpanded.delete(phone);
    } else {
      newExpanded.add(phone);
    }
    setExpandedPhones(newExpanded);
  };

  const formatTime = (time: string): string => {
    if (!time) return '';
    return time.split(':').slice(0, 2).join(':');
  };

  const getStatusBadge = (status?: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      confirmed: { label: '확정', className: 'bg-blue-100 text-blue-800' },
      completed: { label: '완료', className: 'bg-green-100 text-green-800' },
      cancelled: { label: '취소', className: 'bg-red-100 text-red-800' },
      pending: { label: '대기중', className: 'bg-yellow-100 text-yellow-800' },
    };
    const statusInfo = statusMap[status || 'pending'] || statusMap.pending;
    return (
      <span className={`px-2 py-1 text-xs rounded ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getAttendanceBadge = (attendance?: string) => {
    const attendanceMap: Record<string, { label: string; className: string }> = {
      attended: { label: '참석', className: 'bg-green-100 text-green-800' },
      no_show: { label: '노쇼', className: 'bg-red-100 text-red-800' },
      cancelled: { label: '취소', className: 'bg-gray-100 text-gray-800' },
      pending: { label: '대기', className: 'bg-yellow-100 text-yellow-800' },
    };
    const attendanceInfo = attendanceMap[attendance || 'pending'] || attendanceMap.pending;
    return (
      <span className={`px-2 py-1 text-xs rounded ${attendanceInfo.className}`}>
        {attendanceInfo.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* 검색 및 정렬 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="고객명, 전화번호로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'visitCount' | 'lastVisit')}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="visitCount">방문 횟수</option>
              <option value="name">고객명</option>
              <option value="lastVisit">마지막 방문일</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* 고객별 그룹화 목록 */}
      <div className="space-y-2">
        {groupedByCustomer.length > 0 ? (
          groupedByCustomer.map((group) => {
            const phone = group.customer?.phone || group.bookings[0]?.phone;
            const name = group.customer?.name || group.bookings[0]?.name;
            const isExpanded = expandedPhones.has(phone);
            const sortedBookings = [...group.bookings].sort((a, b) => {
              const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime();
              const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime();
              return dateB - dateA; // 최신순
            });

            return (
              <div key={phone} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* 고객 헤더 */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(phone)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <button className="text-gray-400 hover:text-gray-600">
                          {isExpanded ? '▼' : '▶'}
                        </button>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                          <p className="text-sm text-gray-600">{formatPhoneNumber(phone)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-gray-600">방문</p>
                        <p className="font-bold text-blue-600">{group.stats.visitCount}회</p>
                      </div>
                      {group.stats.noShowCount > 0 && (
                        <div className="text-center">
                          <p className="text-gray-600">노쇼</p>
                          <p className="font-bold text-red-600">{group.stats.noShowCount}회</p>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-gray-600">참석</p>
                        <p className="font-bold text-green-600">{group.stats.attendedCount}회</p>
                      </div>
                      {group.stats.lastVisit && (
                        <div className="text-center">
                          <p className="text-gray-600">마지막</p>
                          <p className="font-semibold text-gray-700">{group.stats.lastVisit}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 예약 목록 (아코디언) */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">예약일시</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">서비스</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">클럽</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">거리</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">연령대</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">탄도</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">구질</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">상태</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">참석</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">액션</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {sortedBookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-white">
                              <td className="px-4 py-2 text-sm">
                                <div>
                                  <p className="font-medium">{booking.date}</p>
                                  <p className="text-gray-500">{formatTime(booking.time)}</p>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {booking.service_type || '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
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
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {booking.current_distance ? `${booking.current_distance}m` : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {booking.age_group || '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {booking.trajectory === 'high' ? '고' :
                                 booking.trajectory === 'mid' ? '중' :
                                 booking.trajectory === 'low' ? '저' : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {booking.shot_shape === 'fade' ? '페이드' :
                                 booking.shot_shape === 'draw' ? '드로우' :
                                 booking.shot_shape === 'straight' ? '스트레이트' :
                                 booking.shot_shape === 'hook' ? '훅' :
                                 booking.shot_shape === 'slice' ? '슬라이스' : '-'}
                              </td>
                              <td className="px-4 py-2">
                                {getStatusBadge(booking.status)}
                              </td>
                              <td className="px-4 py-2">
                                {getAttendanceBadge(booking.attendance_status)}
                              </td>
                              <td className="px-4 py-2">
                                <button
                                  onClick={() => setSelectedBooking(booking)}
                                  className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                  상세
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">검색 결과가 없습니다.</p>
          </div>
        )}
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

