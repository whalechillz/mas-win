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
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderScheduledAt, setReminderScheduledAt] = useState('');
  const [reminderSaving, setReminderSaving] = useState(false);
  const [existingReminder, setExistingReminder] = useState<any>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  const customerInfo = customers.find((c) => c.phone === booking.phone);

  // 로컬 시간대를 유지하면서 datetime-local 형식으로 변환
  const formatLocalDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    setEditData(booking);
    setIsEditing(defaultEditing);
  }, [booking, defaultEditing]);

  // 예약 시간 2시간 전 계산
  useEffect(() => {
    if (booking.date && booking.time) {
      const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
      const reminderDateTime = new Date(bookingDateTime.getTime() - 2 * 60 * 60 * 1000); // 2시간 전
      const formattedDateTime = formatLocalDateTime(reminderDateTime);
      setReminderScheduledAt(formattedDateTime);
    }
  }, [booking.date, booking.time]);

  // 기존 예약 메시지 확인
  useEffect(() => {
    const checkExistingReminder = async () => {
      try {
        const bookingId = typeof booking.id === 'number' ? booking.id : parseInt(String(booking.id));
        const response = await fetch(`/api/bookings/${bookingId}/schedule-reminder`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.reminder) {
            setExistingReminder(data.reminder);
            setReminderEnabled(true);
            if (data.reminder.scheduled_at) {
              const scheduledDate = new Date(data.reminder.scheduled_at);
              setReminderScheduledAt(formatLocalDateTime(scheduledDate));
            }
          }
        }
      } catch (error) {
        console.error('예약 메시지 확인 오류:', error);
      }
    };
    checkExistingReminder();
  }, [booking.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const bookingId = typeof booking.id === 'number' ? booking.id : parseInt(String(booking.id));
      
      // API를 통해 업데이트 (상태 변경 감지 및 확정 문자 발송)
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '예약 수정에 실패했습니다.');
      }

      const result = await response.json();
      
      // ⭐ 수정: 메시지 발송 관련 피드백 제거 (저장은 저장만 수행)
      alert('✅ 예약이 저장되었습니다.');

      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      console.error('예약 수정 오류:', error);
      alert('예약 수정에 실패했습니다: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // ⭐ 추가: 예약 접수 메시지 보내기 (pending 상태일 때)
  const handleSendReceivedMessage = async () => {
    if (!confirm('고객에게 예약 접수 메시지를 보내시겠습니까?')) return;
    
    setSendingMessage(true);
    try {
      const bookingId = typeof booking.id === 'number' ? booking.id : parseInt(String(booking.id));
      
      const response = await fetch(`/api/bookings/notify-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingId,
          notificationType: 'booking_received',
          bookingData: editData,
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert('✅ 고객에게 예약 접수 메시지가 발송되었습니다.');
      } else {
        alert(`❌ 메시지 발송에 실패했습니다:\n${result.error || result.message || '알 수 없는 오류'}`);
      }
    } catch (error: any) {
      console.error('예약 접수 메시지 발송 오류:', error);
      alert('메시지 발송 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  // ⭐ 확정 메시지 보내기 (confirmed 상태일 때)
  const handleSendConfirmationMessage = async () => {
    if (!confirm('고객에게 확정 메시지를 보내시겠습니까?')) return;
    
    setSendingMessage(true);
    try {
      const bookingId = typeof booking.id === 'number' ? booking.id : parseInt(String(booking.id));
      
      const response = await fetch(`/api/bookings/notify-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingId,
          notificationType: 'booking_confirmed',
          bookingData: editData,
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert('✅ 고객에게 확정 메시지가 발송되었습니다.');
      } else {
        alert(`❌ 메시지 발송에 실패했습니다:\n${result.error || result.message || '알 수 없는 오류'}`);
      }
    } catch (error: any) {
      console.error('확정 메시지 발송 오류:', error);
      alert('메시지 발송 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSaveReminder = async () => {
    if (!reminderEnabled) {
      // 체크 해제 시 예약 메시지 삭제
      if (existingReminder) {
        setReminderSaving(true);
        try {
          const bookingId = typeof booking.id === 'number' ? booking.id : parseInt(String(booking.id));
          const response = await fetch(`/api/bookings/${bookingId}/schedule-reminder`, {
            method: 'DELETE',
          });
          if (response.ok) {
            setExistingReminder(null);
            alert('당일 예약 메시지가 취소되었습니다.');
          }
        } catch (error: any) {
          console.error('예약 메시지 삭제 오류:', error);
          alert('예약 메시지 취소에 실패했습니다.');
        } finally {
          setReminderSaving(false);
        }
      }
      return;
    }

    // 예약 메시지 생성/수정
    setReminderSaving(true);
    try {
      const bookingId = typeof booking.id === 'number' ? booking.id : parseInt(String(booking.id));
      const response = await fetch(`/api/bookings/${bookingId}/schedule-reminder`, {
        method: existingReminder ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_at: reminderScheduledAt,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setExistingReminder(result.data);
          alert('당일 예약 메시지가 설정되었습니다.');
        }
      } else {
        throw new Error('예약 메시지 설정에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('예약 메시지 저장 오류:', error);
      alert('예약 메시지 설정에 실패했습니다: ' + error.message);
    } finally {
      setReminderSaving(false);
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

          {/* 당일 예약 메시지 섹션 */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="reminder-enabled"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="mt-1"
                disabled={reminderSaving}
              />
              <div className="flex-1">
                <label htmlFor="reminder-enabled" className="font-medium text-gray-900 cursor-pointer">
                  당일 예약 메시지 발송 <span className="text-blue-600 text-xs font-normal">(추천)</span>
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  예약 시간 2시간 전에 고객에게 리마인드 메시지를 발송합니다.
                </p>
                {reminderEnabled && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      발송 시간
                    </label>
                    <input
                      type="datetime-local"
                      value={reminderScheduledAt}
                      onChange={(e) => setReminderScheduledAt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      disabled={reminderSaving}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      기본값: 예약 시간 2시간 전 ({booking.date && booking.time ? (() => {
                        const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
                        const reminderDateTime = new Date(bookingDateTime.getTime() - 2 * 60 * 60 * 1000);
                        return reminderDateTime.toLocaleString('ko-KR', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit',
                          timeZone: 'Asia/Seoul'
                        });
                      })() : ''})
                    </p>
                    <button
                      onClick={handleSaveReminder}
                      disabled={reminderSaving}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                    >
                      {reminderSaving ? '저장 중...' : existingReminder ? '수정' : '설정'}
                    </button>
                  </div>
                )}
                {existingReminder && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ 예약 메시지가 설정되어 있습니다.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ⭐ 메시지 보내기 버튼 (모든 상태에서 표시) */}
          {!isEditing && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  {booking.status === 'confirmed' || editData.status === 'confirmed' ? (
                    <>
                      <p className="text-sm font-medium text-blue-900">📱 확정 메시지 보내기</p>
                      <p className="text-xs text-blue-700 mt-1">
                        고객에게 예약 확정 메시지를 보낼 수 있습니다.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-blue-900">📱 예약 접수 메시지 보내기</p>
                      <p className="text-xs text-blue-700 mt-1">
                        고객에게 예약 접수 확인 메시지를 보낼 수 있습니다.
                      </p>
                    </>
                  )}
                </div>
                <button
                  onClick={
                    booking.status === 'confirmed' || editData.status === 'confirmed'
                      ? handleSendConfirmationMessage
                      : handleSendReceivedMessage
                  }
                  disabled={sendingMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  {sendingMessage 
                    ? '발송 중...' 
                    : (booking.status === 'confirmed' || editData.status === 'confirmed'
                        ? '확정 메시지 보내기'
                        : '예약 접수 메시지 보내기')
                  }
                </button>
              </div>
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


