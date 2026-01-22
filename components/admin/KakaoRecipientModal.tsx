import React, { useState, useEffect, useCallback } from 'react';

interface KakaoFriend {
  uuid: string;
  phone: string;
  nickname: string;
  thumbnail_image?: string;
  synced_at?: string;
}

interface KakaoRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (recipients: string[]) => void; // 전화번호 배열
  initialRecipients?: string[];
  messageType: 'ALIMTALK' | 'FRIENDTALK';
}

export const KakaoRecipientModal: React.FC<KakaoRecipientModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialRecipients = [],
  messageType
}) => {
  const [activeTab, setActiveTab] = useState<'phone' | 'friends'>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [friends, setFriends] = useState<KakaoFriend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ lastSync?: string; friendCount?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 친구 목록 조회
  const fetchFriends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/kakao/friends');
      const data = await response.json();
      
      if (data.success) {
        setFriends(data.data || []);
        setSyncStatus({
          friendCount: data.count || 0,
          lastSync: data.data?.[0]?.synced_at
        });
        
        // 초기 선택된 전화번호와 매칭
        if (initialRecipients.length > 0) {
          const selectedUuids = new Set<string>();
          initialRecipients.forEach(phone => {
            const normalizedPhone = phone.replace(/[^0-9]/g, '');
            const friend = data.data?.find((f: KakaoFriend) => 
              f.phone?.replace(/[^0-9]/g, '') === normalizedPhone
            );
            if (friend) {
              selectedUuids.add(friend.uuid);
            }
          });
          setSelectedFriends(selectedUuids);
        }
      } else {
        setError(data.message || '친구 목록을 불러올 수 없습니다.');
      }
    } catch (err: any) {
      setError(err.message || '친구 목록 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [initialRecipients]);

  // 친구 목록 동기화
  const handleSyncFriends = async () => {
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch('/api/kakao/friends?sync=true');
      const data = await response.json();
      
      if (data.success) {
        alert(`${data.count || 0}명의 친구 목록이 동기화되었습니다.`);
        await fetchFriends(); // 동기화 후 목록 새로고침
      } else {
        setError(data.message || '친구 목록 동기화에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '동기화 중 오류가 발생했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  // 모달 열릴 때 친구 목록 조회
  useEffect(() => {
    if (isOpen && activeTab === 'friends') {
      fetchFriends();
    }
  }, [isOpen, activeTab, fetchFriends]);

  // 전화번호 입력 파싱
  const parsePhoneNumbers = (input: string): string[] => {
    return input
      .split(/[,\n\r]/)
      .map(phone => phone.trim())
      .filter(phone => phone.length > 0)
      .map(phone => phone.replace(/[^0-9]/g, ''))
      .filter(phone => phone.length >= 10);
  };

  // 친구 선택/해제
  const handleToggleFriend = (uuid: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(uuid)) {
      newSelected.delete(uuid);
    } else {
      newSelected.add(uuid);
    }
    setSelectedFriends(newSelected);
  };

  // 전체 선택/해제
  const handleToggleAllFriends = () => {
    if (selectedFriends.size === filteredFriends.length) {
      setSelectedFriends(new Set());
    } else {
      setSelectedFriends(new Set(filteredFriends.map(f => f.uuid)));
    }
  };

  // 필터링된 친구 목록
  const filteredFriends = friends.filter(friend => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      friend.nickname?.toLowerCase().includes(query) ||
      friend.phone?.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, ''))
    );
  });

  // 확인 버튼 클릭
  const handleConfirm = () => {
    let recipients: string[] = [];

    if (activeTab === 'phone') {
      // 전화번호 직접 입력
      recipients = parsePhoneNumbers(phoneInput);
    } else {
      // 친구 목록에서 선택
      const selectedFriendPhones = filteredFriends
        .filter(f => selectedFriends.has(f.uuid))
        .map(f => f.phone)
        .filter((phone): phone is string => !!phone);
      recipients = selectedFriendPhones;
    }

    if (recipients.length === 0) {
      alert('수신자를 선택하거나 입력해주세요.');
      return;
    }

    onConfirm(recipients);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* 배경 오버레이 */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* 모달 */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* 헤더 */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                수신자 선택
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">닫기</span>
                ✕
              </button>
            </div>

            {/* 탭 */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setActiveTab('phone')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'phone'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                전화번호 직접 입력
              </button>
              <button
                onClick={() => setActiveTab('friends')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'friends'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                친구 목록에서 선택
              </button>
            </div>

            {/* 메시지 타입 표시 */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>메시지 타입:</strong> {messageType === 'ALIMTALK' ? '알림톡' : '친구톡'}
              </p>
              {messageType === 'FRIENDTALK' && (
                <p className="text-xs text-blue-600 mt-1">
                  친구톡은 카카오 친구로 등록된 번호만 발송 가능합니다.
                </p>
              )}
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* 전화번호 직접 입력 탭 */}
            {activeTab === 'phone' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호 입력
                </label>
                <textarea
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="전화번호를 쉼표(,) 또는 줄바꿈으로 구분하여 입력하세요&#10;예: 010-1234-5678, 010-9876-5432"
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  입력된 번호: {parsePhoneNumbers(phoneInput).length}개
                </p>
              </div>
            )}

            {/* 친구 목록 선택 탭 */}
            {activeTab === 'friends' && (
              <div>
                {/* 동기화 상태 및 버튼 */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    {syncStatus && (
                      <p className="text-sm text-gray-600">
                        친구 수: {syncStatus.friendCount?.toLocaleString()}명
                        {syncStatus.lastSync && (
                          <span className="ml-2 text-xs text-gray-500">
                            (마지막 동기화: {new Date(syncStatus.lastSync).toLocaleString('ko-KR')})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleSyncFriends}
                    disabled={syncing}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {syncing ? '동기화 중...' : '친구 목록 동기화'}
                  </button>
                </div>

                {/* 검색 */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="이름 또는 전화번호로 검색..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 전체 선택/해제 */}
                {filteredFriends.length > 0 && (
                  <div className="mb-2">
                    <label className="flex items-center text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedFriends.size === filteredFriends.length && filteredFriends.length > 0}
                        onChange={handleToggleAllFriends}
                        className="mr-2"
                      />
                      전체 선택 ({selectedFriends.size} / {filteredFriends.length})
                    </label>
                  </div>
                )}

                {/* 친구 목록 */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-sm text-gray-500">친구 목록을 불러오는 중...</p>
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? '검색 결과가 없습니다.' : '친구 목록이 비어있습니다. 동기화 버튼을 클릭하세요.'}
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                    {filteredFriends.map((friend) => (
                      <div
                        key={friend.uuid}
                        className={`flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                          selectedFriends.has(friend.uuid) ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleToggleFriend(friend.uuid)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFriends.has(friend.uuid)}
                          onChange={() => handleToggleFriend(friend.uuid)}
                          className="mr-3"
                          onClick={(e) => e.stopPropagation()}
                        />
                        {friend.thumbnail_image && (
                          <img
                            src={friend.thumbnail_image}
                            alt={friend.nickname || ''}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {friend.nickname || '이름 없음'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {friend.phone || '전화번호 없음'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleConfirm}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              확인 ({activeTab === 'phone' 
                ? parsePhoneNumbers(phoneInput).length 
                : selectedFriends.size}명)
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
