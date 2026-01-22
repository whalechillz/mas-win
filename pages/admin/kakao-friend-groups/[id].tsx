import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminNav from '@/components/admin/AdminNav';
import dynamic from 'next/dynamic';

const KakaoFriendGroupAddModal = dynamic(
  () => import('@/components/admin/KakaoFriendGroupAddModal'),
  { ssr: false }
);

interface FriendGroup {
  id: number;
  name: string;
  description?: string;
  recipient_uuids: string | string[];
  recipient_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FriendInfo {
  uuid: string;
  phone: string;
  nickname?: string;
  thumbnail_image?: string;
}

export default function KakaoFriendGroupDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [group, setGroup] = useState<FriendGroup | null>(null);
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // 그룹 정보 및 친구 목록 조회
  const fetchGroupDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // 그룹 정보 조회
      const groupResponse = await fetch(`/api/kakao/recipient-groups?id=${id}`);
      const groupData = await groupResponse.json();

      if (!groupData.success || !groupData.data) {
        setError('그룹을 찾을 수 없습니다.');
        return;
      }

      const groupInfo = groupData.data;
      setGroup(groupInfo);
      setNewName(groupInfo.name);
      setNewDescription(groupInfo.description || '');

      // 그룹에 포함된 UUID 목록 추출
      let uuids: string[] = [];
      if (groupInfo.recipient_uuids) {
        if (typeof groupInfo.recipient_uuids === 'string') {
          try {
            uuids = JSON.parse(groupInfo.recipient_uuids);
          } catch {
            uuids = [];
          }
        } else if (Array.isArray(groupInfo.recipient_uuids)) {
          uuids = groupInfo.recipient_uuids;
        }
      }

      // UUID로 친구 정보 조회
      if (uuids.length > 0) {
        const friendsResponse = await fetch('/api/kakao/friends');
        const friendsData = await friendsResponse.json();

        if (friendsData.success) {
          const allFriends = friendsData.data || [];
          const groupFriends = allFriends.filter((f: FriendInfo) => 
            uuids.includes(f.uuid)
          );
          setFriends(groupFriends);
        }
      } else {
        setFriends([]);
      }
    } catch (err: any) {
      setError(err.message || '그룹 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchGroupDetail();
    }
  }, [id]);

  // 그룹명 수정
  const handleSaveName = async () => {
    if (!group || !newName.trim()) return;

    setSaving(true);
    try {
      const response = await fetch('/api/kakao/recipient-groups', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: group.id,
          name: newName.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        setEditingName(false);
        fetchGroupDetail();
      } else {
        alert(data.message || '그룹명 수정에 실패했습니다.');
      }
    } catch (err: any) {
      alert('그룹명 수정 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 그룹 설명 수정
  const handleSaveDescription = async () => {
    if (!group) return;

    setSaving(true);
    try {
      const response = await fetch('/api/kakao/recipient-groups', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: group.id,
          description: newDescription.trim() || null
        })
      });

      const data = await response.json();
      if (data.success) {
        setEditingDescription(false);
        fetchGroupDetail();
      } else {
        alert(data.message || '그룹 설명 수정에 실패했습니다.');
      }
    } catch (err: any) {
      alert('그룹 설명 수정 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 선택한 친구 삭제
  const handleDeleteSelected = async () => {
    if (!group || selectedFriends.size === 0) return;

    if (!confirm(`선택한 ${selectedFriends.size}명의 친구를 그룹에서 제거하시겠습니까?`)) {
      return;
    }

    setSaving(true);
    try {
      // 현재 UUID 목록에서 선택한 친구 제거
      let currentUuids: string[] = [];
      if (group.recipient_uuids) {
        if (typeof group.recipient_uuids === 'string') {
          try {
            currentUuids = JSON.parse(group.recipient_uuids);
          } catch {
            currentUuids = [];
          }
        } else if (Array.isArray(group.recipient_uuids)) {
          currentUuids = group.recipient_uuids;
        }
      }

      const updatedUuids = currentUuids.filter(uuid => !selectedFriends.has(uuid));

      const response = await fetch('/api/kakao/recipient-groups', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: group.id,
          recipientUuids: updatedUuids
        })
      });

      const data = await response.json();
      if (data.success) {
        setSelectedFriends(new Set());
        fetchGroupDetail();
        alert('친구가 그룹에서 제거되었습니다.');
      } else {
        alert(data.message || '친구 제거에 실패했습니다.');
      }
    } catch (err: any) {
      alert('친구 제거 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 친구 추가 완료 후 콜백
  const handleFriendsAdded = () => {
    setShowAddModal(false);
    fetchGroupDetail();
  };

  // 전화번호 마스킹
  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 4) return phone;
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length <= 4) return cleaned;
    return cleaned.slice(0, 4) + '****' + cleaned.slice(-4);
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>친구 그룹 상세 - 카카오 채널</title>
        </Head>
        <AdminNav />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !group) {
    return (
      <>
        <Head>
          <title>친구 그룹 상세 - 카카오 채널</title>
        </Head>
        <AdminNav />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error || '그룹을 찾을 수 없습니다.'}</p>
              <button
                onClick={() => router.push('/admin/kakao-friend-groups')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{group.name} - 친구 그룹 상세</title>
      </Head>

      <AdminNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/admin/kakao-friend-groups')}
              className="text-blue-600 hover:text-blue-800 mb-2"
            >
              ← 목록
            </button>
            <h1 className="text-2xl font-bold text-gray-900">친구그룹 상세</h1>
          </div>

          {/* 기본정보 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">기본정보</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  그룹명
                </label>
                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={saving || !newName.trim()}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setEditingName(false);
                        setNewName(group.name);
                      }}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900">{group.name}</span>
                    <button
                      onClick={() => setEditingName(true)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  그룹 설명
                </label>
                {editingDescription ? (
                  <div className="flex gap-2">
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleSaveDescription}
                        disabled={saving}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => {
                          setEditingDescription(false);
                          setNewDescription(group.description || '');
                        }}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900">{group.description || '-'}</span>
                    <button
                      onClick={() => setEditingDescription(true)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  등록 수단
                </label>
                <span className="text-gray-900">전화번호로 추가</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  등록수
                </label>
                <span className="text-gray-900">{group.recipient_count}명</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  친구수
                </label>
                <span className="text-gray-900">{friends.length}명</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  group.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {group.is_active ? '생성 완료' : '비활성'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  생성일시
                </label>
                <span className="text-gray-900">
                  {new Date(group.created_at).toLocaleString('ko-KR')}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  업데이트일시
                </label>
                <span className="text-gray-900">
                  {new Date(group.updated_at).toLocaleString('ko-KR')}
                </span>
              </div>
            </div>
          </div>

          {/* 친구 목록 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">친구 목록</h2>
              <div className="flex gap-2">
                {selectedFriends.size > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    선택삭제 ({selectedFriends.size})
                  </button>
                )}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + 그룹에 친구 추가
                </button>
                <button
                  onClick={() => router.push('/admin/kakao-friend-groups')}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  목록
                </button>
              </div>
            </div>

            {friends.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                그룹에 등록된 친구가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedFriends.size === friends.length && friends.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFriends(new Set(friends.map(f => f.uuid)));
                            } else {
                              setSelectedFriends(new Set());
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        전화번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        프로필명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        친구 추가 방법
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        그룹에 등록한 시간
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {friends.map((friend) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {maskPhone(friend.phone)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {friend.nickname || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          전화번호로 추가
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {group.created_at ? new Date(group.created_at).toLocaleString('ko-KR') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 친구 추가 모달 */}
      {showAddModal && group && (
        <KakaoFriendGroupAddModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          groupId={group.id}
          onFriendsAdded={handleFriendsAdded}
        />
      )}
    </>
  );
}
