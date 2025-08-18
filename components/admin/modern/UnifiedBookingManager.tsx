import React, { useState, useEffect } from 'react';

interface UnifiedBookingManagerProps {
  theme: string;
  notifications: any[];
  setNotifications: (notifications: any[]) => void;
  setLoading: (loading: boolean) => void;
}

const UnifiedBookingManager: React.FC<UnifiedBookingManagerProps> = ({
  theme,
  notifications,
  setNotifications,
  setLoading
}) => {
  const [bookings, setBookings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 실제 API 호출로 대체
      const mockBookings = [
        { id: 1, name: '김탁수', phone: '010-6669-9000', date: '2025-08-17 16:00', status: 'confirmed' },
        { id: 2, name: '테스트', phone: '010-1234-5678', date: '2025-08-18 14:00', status: 'pending' }
      ];
      const mockContacts = [
        { id: 1, name: '김탁수', phone: '010-6669-9000', message: '가격이 궁금합니다', status: 'pending' },
        { id: 2, name: '테스트', phone: '010-1234-5678', message: 'API 테스트', status: 'contacted' }
      ];
      setBookings(mockBookings);
      setContacts(mockContacts);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            통합 예약 관리
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            예약 및 고객 관리 시스템
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {bookings.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">총 예약</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {bookings.filter(b => b.status === 'confirmed').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">확정 예약</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {contacts.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">총 문의</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {contacts.filter(c => c.status === 'contacted').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">연락 완료</div>
        </div>
      </div>

      {/* 예약 및 문의 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 예약 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            예약 목록
          </h3>
          <div className="space-y-3">
            {bookings.map((booking: any) => (
              <div
                key={booking.id}
                className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => setSelectedItem({ type: 'booking', data: booking })}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {booking.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {booking.phone} • {booking.date}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {booking.status === 'confirmed' ? '확정' : '대기'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 문의 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            문의 목록
          </h3>
          <div className="space-y-3">
            {contacts.map((contact: any) => (
              <div
                key={contact.id}
                className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => setSelectedItem({ type: 'contact', data: contact })}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {contact.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {contact.phone} • {contact.message}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    contact.status === 'contacted' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {contact.status === 'contacted' ? '연락완료' : '대기'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 선택된 항목 상세 정보 */}
      {selectedItem && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {selectedItem.type === 'booking' ? '예약' : '문의'} 상세 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">기본 정보</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">이름:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedItem.data.name}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">연락처:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedItem.data.phone}</p>
                </div>
                {selectedItem.type === 'booking' && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">예약일시:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedItem.data.date}</p>
                  </div>
                )}
                {selectedItem.type === 'contact' && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">문의내용:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedItem.data.message}</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">상태 관리</h4>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  {selectedItem.type === 'booking' ? '예약 확정' : '연락 완료'}
                </button>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  전화하기
                </button>
                <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  메모 추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedBookingManager;
