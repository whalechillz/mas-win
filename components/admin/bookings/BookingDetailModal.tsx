import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Booking {
  id: string | number;
  name: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  status?: string;
  service_type?: string;
  location?: string;
  club?: string;
  current_distance?: number;
  age_group?: string;
  notes?: string;
  attendance_status?: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  customer_grade?: string;
}

interface BookingDetailModalProps {
  booking: Booking;
  customers: Customer[];
  supabase: any;
  onClose: () => void;
  onUpdate: () => void;
  defaultEditing?: boolean;
}

export default function BookingDetailModal({
  booking,
  customers,
  supabase,
  onClose,
  onUpdate,
  defaultEditing = false,
}: BookingDetailModalProps) {
  const [isEditing, setIsEditing] = useState(defaultEditing);
  const [editData, setEditData] = useState(booking);
  const [saving, setSaving] = useState(false);

  const customerInfo = customers.find((c) => c.phone === booking.phone);

  useEffect(() => {
    setEditData(booking);
    setIsEditing(defaultEditing);
  }, [booking, defaultEditing]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const bookingId = typeof booking.id === 'number' ? booking.id : parseInt(String(booking.id));
      const { error } = await supabase
        .from('bookings')
        .update(editData)
        .eq('id', bookingId);

      if (error) throw error;

      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      console.error('예약 수정 오류:', error);
      alert('예약 수정에 실패했습니다: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('이 예약을 삭제하시겠습니까?')) return;

    try {
      const bookingId = typeof booking.id === 'number' ? booking.id : parseInt(String(booking.id));
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('예약 삭제 오류:', error);
      alert('예약 삭제에 실패했습니다: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">예약 상세</h2>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    편집
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                  >
                    삭제
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {customerInfo && (
            <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-900">👤 등록된 고객</p>
                  <p className="text-xs text-purple-700 mt-1">
                    VIP: {customerInfo.customer_grade || 'NONE'}
                  </p>
                </div>
                <Link
                  href={`/admin/customers?phone=${encodeURIComponent(booking.phone)}`}
                  className="text-xs text-purple-600 hover:text-purple-700 hover:underline"
                >
                  고객 정보 보기 →
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">고객명</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-gray-900">{booking.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">전화번호</label>
              <p className="text-gray-900">{booking.phone}</p>
            </div>
            {booking.email && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">이메일</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <p className="text-gray-900">{booking.email}</p>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">예약일시</label>
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={editData.date}
                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="time"
                    value={editData.time}
                    onChange={(e) => setEditData({ ...editData, time: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              ) : (
                <p className="text-gray-900">{booking.date} {booking.time}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">서비스</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.service_type || ''}
                  onChange={(e) => setEditData({ ...editData, service_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-gray-900">{booking.service_type || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">위치</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.location || ''}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-gray-900">{booking.location || 'Massgoo Studio'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">상태</label>
              {isEditing ? (
                <select
                  value={editData.status || 'pending'}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="pending">대기중</option>
                  <option value="confirmed">확정</option>
                  <option value="completed">완료</option>
                  <option value="cancelled">취소</option>
                </select>
              ) : (
                <p className="text-gray-900">{booking.status || '대기중'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">참석 여부</label>
              {isEditing ? (
                <select
                  value={editData.attendance_status || 'pending'}
                  onChange={(e) => setEditData({ ...editData, attendance_status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="pending">대기중</option>
                  <option value="attended">참석</option>
                  <option value="no_show">노쇼</option>
                  <option value="cancelled">취소</option>
                </select>
              ) : (
                <p className="text-gray-900">
                  {booking.attendance_status === 'attended' ? '참석' :
                   booking.attendance_status === 'no_show' ? '노쇼' :
                   booking.attendance_status === 'cancelled' ? '취소' : '대기중'}
                </p>
              )}
            </div>
          </div>

          {booking.notes && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-500 mb-1">메모</label>
              {isEditing ? (
                <textarea
                  value={editData.notes || ''}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{booking.notes}</p>
              )}
            </div>
          )}

          {isEditing && (
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditData(booking);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                disabled={saving}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


