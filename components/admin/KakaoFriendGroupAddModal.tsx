import React, { useState } from 'react';

interface KakaoFriendGroupAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  onFriendsAdded: () => void;
}

export const KakaoFriendGroupAddModal: React.FC<KakaoFriendGroupAddModalProps> = ({
  isOpen,
  onClose,
  groupId,
  onFriendsAdded
}) => {
  const [registrationMethod, setRegistrationMethod] = useState<'phone' | 'upload'>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // 전화번호 파싱
  const parsePhoneNumbers = (input: string): string[] => {
    return input
      .split(/[,\n\r]/)
      .map(phone => phone.trim())
      .filter(phone => phone.length > 0)
      .map(phone => phone.replace(/[^0-9]/g, ''))
      .filter(phone => phone.length >= 10);
  };

  // 파일 업로드 처리
  const handleFileUpload = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const phones = parsePhoneNumbers(text);
          resolve(phones);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // 친구 추가 처리
  const handleAddFriends = async () => {
    setError(null);
    setAdding(true);

    try {
      let phones: string[] = [];

      if (registrationMethod === 'phone') {
        if (!phoneInput.trim()) {
          setError('전화번호를 입력해주세요.');
          setAdding(false);
          return;
        }
        phones = parsePhoneNumbers(phoneInput);
        
        if (phones.length === 0) {
          setError('유효한 전화번호를 입력해주세요.');
          setAdding(false);
          return;
        }

        if (phones.length > 10000) {
          setError('최대 10,000개의 전화번호만 추가할 수 있습니다.');
          setAdding(false);
          return;
        }
      } else {
        if (!uploadFile) {
          setError('파일을 선택해주세요.');
          setAdding(false);
          return;
        }
        phones = await handleFileUpload(uploadFile);
        
        if (phones.length === 0) {
          setError('파일에서 유효한 전화번호를 찾을 수 없습니다.');
          setAdding(false);
          return;
        }

        if (phones.length > 10000) {
          setError('최대 10,000개의 전화번호만 추가할 수 있습니다.');
          setAdding(false);
          return;
        }
      }

      // 그룹 정보 조회
      const groupResponse = await fetch(`/api/kakao/recipient-groups?id=${groupId}`);
      const groupData = await groupResponse.json();

      if (!groupData.success || !groupData.data) {
        setError('그룹을 찾을 수 없습니다.');
        setAdding(false);
        return;
      }

      const group = groupData.data;
      
      // 기존 UUID 목록 가져오기
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

      // 전화번호를 UUID로 변환
      const uuidResponse = await fetch('/api/kakao/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phones })
      });

      const uuidData = await uuidResponse.json();

      if (!uuidData.success) {
        setError('전화번호를 UUID로 변환하는 중 오류가 발생했습니다.');
        setAdding(false);
        return;
      }

      // 찾은 UUID만 추출
      const foundUuids = (uuidData.data || [])
        .filter((item: any) => item.found && item.uuid)
        .map((item: any) => item.uuid);

      if (foundUuids.length === 0) {
        setError('입력한 전화번호 중 카카오 친구로 등록된 번호가 없습니다.');
        setAdding(false);
        return;
      }

      // 기존 UUID와 병합 (중복 제거)
      const updatedUuids = Array.from(new Set([...currentUuids, ...foundUuids]));

      // 그룹 업데이트
      const updateResponse = await fetch('/api/kakao/recipient-groups', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: groupId,
          recipientUuids: updatedUuids
        })
      });

      const updateData = await updateResponse.json();

      if (updateData.success) {
        alert(`${foundUuids.length}명의 친구가 그룹에 추가되었습니다.`);
        setPhoneInput('');
        setUploadFile(null);
        onFriendsAdded();
      } else {
        setError(updateData.message || '친구 추가에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '친구 추가 중 오류가 발생했습니다.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">그룹에 친구추가</h2>

        {/* 등록 수단 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            등록 수단
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="phone"
                checked={registrationMethod === 'phone'}
                onChange={(e) => setRegistrationMethod(e.target.value as 'phone' | 'upload')}
                className="mr-2"
              />
              <span>전화번호 직접 입력</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="upload"
                checked={registrationMethod === 'upload'}
                onChange={(e) => setRegistrationMethod(e.target.value as 'phone' | 'upload')}
                className="mr-2"
              />
              <span>전화번호 업로드</span>
            </label>
          </div>
        </div>

        {/* 전화번호 직접 입력 */}
        {registrationMethod === 'phone' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전화번호 입력
            </label>
            <p className="text-xs text-gray-500 mb-2">
              전화번호는 한 줄에 하나씩 추가해주세요. 해외 전화번호인 경우, 국가코드를 반드시 같이 입력해주세요.
            </p>
            <textarea
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="ex) 010-0000-0000&#10;1-000-000-0000"
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <div className="mt-2 text-sm text-gray-500">
              {phoneInput ? parsePhoneNumbers(phoneInput).length : 0} / 10,000개
            </div>
          </div>
        )}

        {/* 전화번호 업로드 */}
        {registrationMethod === 'upload' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              파일 선택
            </label>
            <p className="text-xs text-gray-500 mb-2">
              CSV 또는 TXT 파일을 업로드하세요. 한 줄에 하나씩 전화번호를 입력하세요.
            </p>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setUploadFile(file);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {uploadFile && (
              <div className="mt-2 text-sm text-gray-600">
                선택된 파일: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={adding}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleAddFriends}
            disabled={adding || (registrationMethod === 'phone' && !phoneInput.trim()) || (registrationMethod === 'upload' && !uploadFile)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? '추가 중...' : '그룹등록'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KakaoFriendGroupAddModal;
