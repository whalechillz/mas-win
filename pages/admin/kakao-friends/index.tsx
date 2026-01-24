import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminNav from '@/components/admin/AdminNav';

interface Friend {
  uuid: string;
  phone: string | null;
  nickname: string | null;
  thumbnail_image: string | null;
  synced_at: string;
}

export default function KakaoFriendsPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchPhone, setSearchPhone] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFriend, setNewFriend] = useState({
    uuid: '',
    phone: '',
    nickname: '',
    thumbnail_image: ''
  });
  const [adding, setAdding] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // 친구 목록 조회
  const fetchFriends = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/kakao/friends');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          success: false, 
          message: '친구 목록을 불러올 수 없습니다.' 
        }));
        setError(errorData.message || '친구 목록을 불러올 수 없습니다.');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setFriends(data.data || []);
      } else {
        setError(data.message || '친구 목록을 불러올 수 없습니다.');
      }
    } catch (err: any) {
      console.error('친구 목록 조회 오류:', err);
      setError(err.message || '친구 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  // 전화번호로 UUID 조회
  const handleSearchPhone = async () => {
    if (!searchPhone.trim()) {
      alert('전화번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const normalizedPhone = searchPhone.replace(/[^0-9]/g, '');
      const response = await fetch(`/api/kakao/friends?phone=${normalizedPhone}`);
      
      if (!response.ok) {
        // 404 등 에러 응답 처리
        const errorData = await response.json().catch(() => ({ 
          success: false, 
          message: '친구를 찾을 수 없습니다.' 
        }));
        alert(errorData.message || '친구를 찾을 수 없습니다.');
        return;
      }

      const data = await response.json();

      if (data.success) {
        alert(`UUID: ${data.data.uuid}\n전화번호: ${data.data.phone}\n닉네임: ${data.data.nickname || '-'}`);
        // 검색 후 목록 새로고침
        fetchFriends();
      } else {
        alert(data.message || '친구를 찾을 수 없습니다.');
      }
    } catch (err: any) {
      console.error('친구 검색 오류:', err);
      alert('조회 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 친구 추가
  const handleAddFriend = async () => {
    if (!newFriend.uuid.trim()) {
      alert('UUID는 필수입니다.');
      return;
    }

    setAdding(true);
    try {
      const response = await fetch('/api/kakao/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          friends: [{
            uuid: newFriend.uuid.trim(),
            phone: newFriend.phone.trim() || null,
            nickname: newFriend.nickname.trim() || null,
            thumbnail_image: newFriend.thumbnail_image.trim() || null
          }]
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('친구가 등록되었습니다.');
        setShowAddModal(false);
        setNewFriend({ uuid: '', phone: '', nickname: '', thumbnail_image: '' });
        fetchFriends();
      } else {
        alert(data.message || '친구 등록에 실패했습니다.');
      }
    } catch (err: any) {
      alert('친구 등록 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  // 선택된 친구 삭제
  const handleDeleteSelected = async () => {
    if (selectedFriends.size === 0) {
      alert('삭제할 친구를 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedFriends.size}명의 친구를 삭제하시겠습니까?`)) {
      return;
    }

    setDeleting(true);
    try {
      const deletePromises = Array.from(selectedFriends).map(uuid =>
        fetch(`/api/kakao/friends?uuid=${uuid}`, { method: 'DELETE' })
      );

      const results = await Promise.all(deletePromises);
      const allSuccess = results.every(async (res) => {
        const data = await res.json();
        return data.success;
      });

      if (allSuccess) {
        alert('선택한 친구가 삭제되었습니다.');
        setSelectedFriends(new Set());
        fetchFriends();
      } else {
        alert('일부 친구 삭제에 실패했습니다.');
      }
    } catch (err: any) {
      alert('친구 삭제 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // 전화번호 마스킹
  const maskPhone = (phone: string | null) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length <= 4) return cleaned;
    return cleaned.slice(0, 4) + '****' + cleaned.slice(-4);
  };

  // UUID 복사
  const copyUuid = (uuid: string) => {
    navigator.clipboard.writeText(uuid);
    alert('UUID가 클립보드에 복사되었습니다.');
  };

  // 필터링된 친구 목록
  const filteredFriends = friends.filter(friend => {
    if (!searchPhone.trim()) return true;
    const search = searchPhone.replace(/[^0-9]/g, '');
    return friend.phone?.includes(search) || friend.uuid.includes(search);
  });

  return (
    <>
      <Head>
        <title>친구 관리 - 카카오 채널</title>
      </Head>

      <AdminNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">카카오 친구 관리</h1>
            <p className="mt-1 text-sm text-gray-500">
              카카오 친구의 UUID와 전화번호 매핑을 관리하고 조회하세요.
            </p>
          </div>

          {/* 액션 버튼 및 검색 */}
          <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2 flex-1 min-w-[300px]">
              <input
                type="text"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="전화번호 또는 UUID로 검색..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearchPhone()}
              />
              <button
                onClick={handleSearchPhone}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                검색
              </button>
            </div>
            <div className="flex gap-2">
              {selectedFriends.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  선택 삭제 ({selectedFriends.size})
                </button>
              )}
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + 친구 등록
              </button>
              <button
                onClick={fetchFriends}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                🔄 새로고침
              </button>
            </div>
          </div>

          {/* 통계 */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-500">전체 친구 수</div>
              <div className="text-2xl font-bold text-gray-900">{friends.length}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-500">전화번호 등록</div>
              <div className="text-2xl font-bold text-gray-900">
                {friends.filter(f => f.phone).length}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-500">검색 결과</div>
              <div className="text-2xl font-bold text-gray-900">{filteredFriends.length}</div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* 친구 목록 테이블 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">
                {searchPhone ? '검색 결과가 없습니다.' : '등록된 친구가 없습니다.'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                친구 등록하기
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedFriends.size === filteredFriends.length && filteredFriends.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFriends(new Set(filteredFriends.map(f => f.uuid)));
                            } else {
                              setSelectedFriends(new Set());
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        UUID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        전화번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        닉네임
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        등록일
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFriends.map((friend) => (
                      <tr key={friend.uuid} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedFriends.has(friend.uuid)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedFriends);
                              if (e.target.checked) {
                                newSelected.add(friend.uuid);
                              } else {
                                newSelected.delete(friend.uuid);
                              }
                              setSelectedFriends(newSelected);
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                              {friend.uuid}
                            </code>
                            <button
                              onClick={() => copyUuid(friend.uuid)}
                              className="text-gray-400 hover:text-gray-600"
                              title="UUID 복사"
                            >
                              📋
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {maskPhone(friend.phone)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {friend.nickname || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {friend.synced_at
                            ? new Date(friend.synced_at).toLocaleString('ko-KR')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={async () => {
                              if (confirm('이 친구를 삭제하시겠습니까?')) {
                                try {
                                  const response = await fetch(`/api/kakao/friends?uuid=${friend.uuid}`, {
                                    method: 'DELETE'
                                  });
                                  const data = await response.json();
                                  if (data.success) {
                                    alert('친구가 삭제되었습니다.');
                                    fetchFriends();
                                  } else {
                                    alert(data.message || '삭제에 실패했습니다.');
                                  }
                                } catch (err: any) {
                                  alert('삭제 중 오류가 발생했습니다: ' + err.message);
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            삭제
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
      </div>

      {/* 친구 등록 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">친구 등록</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UUID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newFriend.uuid}
                onChange={(e) => setNewFriend({ ...newFriend, uuid: e.target.value })}
                placeholder="카카오 친구 UUID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">
                카카오 개발자 콘솔 또는 API에서 확인한 UUID를 입력하세요.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                전화번호
              </label>
              <input
                type="text"
                value={newFriend.phone}
                onChange={(e) => setNewFriend({ ...newFriend, phone: e.target.value })}
                placeholder="01012345678"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                닉네임
              </label>
              <input
                type="text"
                value={newFriend.nickname}
                onChange={(e) => setNewFriend({ ...newFriend, nickname: e.target.value })}
                placeholder="친구 닉네임"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                프로필 이미지 URL
              </label>
              <input
                type="text"
                value={newFriend.thumbnail_image}
                onChange={(e) => setNewFriend({ ...newFriend, thumbnail_image: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewFriend({ uuid: '', phone: '', nickname: '', thumbnail_image: '' });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={adding}
              >
                취소
              </button>
              <button
                onClick={handleAddFriend}
                disabled={adding || !newFriend.uuid.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
