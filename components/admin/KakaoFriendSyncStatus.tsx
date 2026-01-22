import React, { useState, useEffect } from 'react';

interface KakaoFriendSyncStatusProps {
  onSync?: () => void;
}

export const KakaoFriendSyncStatus: React.FC<KakaoFriendSyncStatusProps> = ({
  onSync
}) => {
  const [syncStatus, setSyncStatus] = useState<{
    friendCount?: number;
    lastSync?: string;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 친구 목록 상태 조회
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/kakao/friends');
      const data = await response.json();
      
      if (data.success) {
        const friends = data.data || [];
        const lastSync = friends.length > 0 
          ? friends[0]?.synced_at 
          : null;
        
        setSyncStatus({
          friendCount: data.count || friends.length,
          lastSync: lastSync || undefined
        });
      }
    } catch (error) {
      console.error('친구 목록 상태 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // 친구 목록 동기화
  const handleSync = async () => {
    // OAuth 2.0 Access Token이 필요한 API이므로 안내 메시지 표시
    const shouldProceed = confirm(
      '⚠️ 친구 목록 자동 동기화는 OAuth 2.0 Access Token이 필요합니다.\n\n' +
      '현재 Admin Key만으로는 친구 목록을 조회할 수 없습니다.\n\n' +
      '대안:\n' +
      '1. 카카오 비즈니스 파트너센터에서 친구 목록을 확인하고 수동으로 등록\n' +
      '2. 전화번호를 입력하면 발송 시 자동으로 친구 여부 확인\n\n' +
      '그래도 시도하시겠습니까?'
    );
    
    if (!shouldProceed) {
      return;
    }
    
    setSyncing(true);
    try {
      const response = await fetch('/api/kakao/friends?sync=true');
      const data = await response.json();
      
      if (data.success) {
        alert(`${data.count || 0}명의 친구 목록이 동기화되었습니다.`);
        await fetchStatus(); // 상태 새로고침
        if (onSync) {
          onSync();
        }
      } else {
        alert('친구 목록 동기화에 실패했습니다: ' + data.message);
      }
    } catch (error: any) {
      alert('동기화 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span>로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-blue-900">
            카카오 친구 목록
          </p>
          <div className="mt-1 text-xs text-blue-700">
            {syncStatus?.friendCount !== undefined ? (
              <>
                친구 수: <strong>{syncStatus.friendCount.toLocaleString()}명</strong>
                {syncStatus.lastSync && (
                  <span className="ml-2">
                    (마지막 동기화: {new Date(syncStatus.lastSync).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })})
                  </span>
                )}
              </>
            ) : (
              <span>친구 목록이 없습니다.</span>
            )}
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {syncing ? '동기화 중...' : '동기화'}
        </button>
      </div>
      
      {/* OAuth 2.0 Access Token 필요 안내 */}
      <div className="mt-2 pt-2 border-t border-blue-200">
        <p className="text-xs text-blue-600">
          ⚠️ 자동 동기화는 OAuth 2.0 Access Token이 필요합니다. 
          현재는 <strong>수동 친구 등록</strong> 또는 <strong>전화번호로 친구 여부 확인</strong> 방식을 사용하세요.
        </p>
      </div>
    </div>
  );
};
