import React, { useState, useEffect } from 'react';

interface KakaoRecipientPreviewProps {
  recipientNumbers: string[];
  onRefresh?: () => void;
}

export const KakaoRecipientPreview: React.FC<KakaoRecipientPreviewProps> = ({
  recipientNumbers,
  onRefresh
}) => {
  const [preview, setPreview] = useState<{
    friendCount: number;
    nonFriendCount: number;
    loading: boolean;
  }>({
    friendCount: 0,
    nonFriendCount: 0,
    loading: false
  });

  // 친구/비친구 비율 계산
  useEffect(() => {
    if (recipientNumbers.length === 0) {
      setPreview({ friendCount: 0, nonFriendCount: 0, loading: false });
      return;
    }

    const calculateRatio = async () => {
      setPreview(prev => ({ ...prev, loading: true }));
      try {
        // 전화번호 정규화
        const normalizedPhones = recipientNumbers.map(phone => 
          phone.replace(/[^0-9]/g, '')
        ).filter(phone => phone.length >= 10);

        if (normalizedPhones.length === 0) {
          setPreview({ friendCount: 0, nonFriendCount: 0, loading: false });
          return;
        }

        // 친구 매핑 조회
        const response = await fetch('/api/kakao/friends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phones: normalizedPhones
          })
        });

        const data = await response.json();
        
        if (data.success && data.data) {
          // API 응답 구조: { phone, uuid, found } 배열
          const friendPhones = new Set(
            (data.data || [])
              .filter((m: any) => m.found && m.phone)
              .map((m: any) => m.phone?.replace(/[^0-9]/g, ''))
          );
          
          const friendCount = normalizedPhones.filter(phone => 
            friendPhones.has(phone)
          ).length;
          
          const nonFriendCount = normalizedPhones.length - friendCount;

          setPreview({
            friendCount,
            nonFriendCount,
            loading: false
          });
        } else {
          // 친구 목록이 없거나 오류 발생 시 모두 비친구로 처리
          setPreview({
            friendCount: 0,
            nonFriendCount: normalizedPhones.length,
            loading: false
          });
        }
      } catch (error) {
        console.error('친구/비친구 비율 계산 오류:', error);
        setPreview({
          friendCount: 0,
          nonFriendCount: recipientNumbers.length,
          loading: false
        });
      }
    };

    // 디바운싱 (500ms)
    const timer = setTimeout(calculateRatio, 500);
    return () => clearTimeout(timer);
  }, [recipientNumbers]);

  if (recipientNumbers.length === 0) {
    return null;
  }

  const total = preview.friendCount + preview.nonFriendCount;
  const friendPercent = total > 0 ? Math.round((preview.friendCount / total) * 100) : 0;
  const nonFriendPercent = total > 0 ? Math.round((preview.nonFriendCount / total) * 100) : 0;

  return (
    <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-800">
          카카오톡 발송 예상 비율
        </h4>
        {preview.loading && (
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        )}
      </div>
      
      {!preview.loading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
              <div className="flex h-full">
                {preview.friendCount > 0 && (
                  <div
                    className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${friendPercent}%` }}
                    title={`카카오톡 발송: ${preview.friendCount}명`}
                  >
                    {friendPercent > 10 && `${friendPercent}%`}
                  </div>
                )}
                {preview.nonFriendCount > 0 && (
                  <div
                    className="bg-orange-500 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${nonFriendPercent}%` }}
                    title={`SMS 대체 발송: ${preview.nonFriendCount}명`}
                  >
                    {nonFriendPercent > 10 && `${nonFriendPercent}%`}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-700">
                카카오톡: <strong>{preview.friendCount}명</strong> ({friendPercent}%)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-gray-700">
                SMS 대체: <strong>{preview.nonFriendCount}명</strong> ({nonFriendPercent}%)
              </span>
            </div>
          </div>
          
          {preview.nonFriendCount > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              💡 친구가 아닌 {preview.nonFriendCount}명은 SMS로 대체 발송됩니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
