import React, { useState, useEffect } from 'react';

interface CustomerSegment {
  id: number;
  name: string;
  description?: string;
  filter_config: any;
  recipient_count: number;
  created_at: string;
  updated_at: string;
}

interface CustomerSegmentManagerProps {
  currentFilter: any;
  onLoadSegment: (filter: any) => void;
}

export const CustomerSegmentManager: React.FC<CustomerSegmentManagerProps> = ({
  currentFilter,
  onLoadSegment
}) => {
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [segmentName, setSegmentName] = useState('');
  const [segmentDescription, setSegmentDescription] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  // 세그먼트 목록 조회
  const fetchSegments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/customer-segments');
      const data = await response.json();
      
      if (data.success) {
        setSegments(data.data || []);
      } else {
        alert('세그먼트 목록을 불러올 수 없습니다: ' + data.message);
      }
    } catch (error: any) {
      console.error('세그먼트 목록 조회 오류:', error);
      alert('세그먼트 목록 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  // 세그먼트 저장
  const handleSaveSegment = async () => {
    if (!segmentName.trim()) {
      alert('세그먼트명을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/customer-segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: segmentName.trim(),
          description: segmentDescription.trim() || null,
          filter_config: currentFilter
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('세그먼트가 저장되었습니다.');
        setShowSaveModal(false);
        setSegmentName('');
        setSegmentDescription('');
        fetchSegments(); // 목록 새로고침
      } else {
        alert('세그먼트 저장에 실패했습니다: ' + data.message);
      }
    } catch (error: any) {
      console.error('세그먼트 저장 오류:', error);
      alert('세그먼트 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 세그먼트 불러오기
  const handleLoadSegment = (segment: CustomerSegment) => {
    if (confirm(`"${segment.name}" 세그먼트를 불러오시겠습니까?`)) {
      onLoadSegment(segment.filter_config);
    }
  };

  // 세그먼트 삭제
  const handleDeleteSegment = async (segmentId: number, segmentName: string) => {
    if (!confirm(`"${segmentName}" 세그먼트를 삭제하시겠습니까?`)) {
      return;
    }

    setDeleting(segmentId);
    try {
      const response = await fetch(`/api/admin/customer-segments?id=${segmentId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        alert('세그먼트가 삭제되었습니다.');
        fetchSegments(); // 목록 새로고침
      } else {
        alert('세그먼트 삭제에 실패했습니다: ' + data.message);
      }
    } catch (error: any) {
      console.error('세그먼트 삭제 오류:', error);
      alert('세그먼트 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">💾 세그먼트 관리</h3>
        <button
          onClick={() => setShowSaveModal(true)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          현재 세그먼트 저장
        </button>
      </div>

      {/* 저장된 세그먼트 목록 */}
      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm text-gray-500">로딩 중...</p>
        </div>
      ) : segments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          저장된 세그먼트가 없습니다.
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {segments.map((segment) => (
            <div
              key={segment.id}
              className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">{segment.name}</span>
                  {segment.recipient_count > 0 && (
                    <span className="text-xs text-gray-500">
                      ({segment.recipient_count.toLocaleString()}명)
                    </span>
                  )}
                </div>
                {segment.description && (
                  <p className="text-xs text-gray-500 mt-1">{segment.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(segment.updated_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleLoadSegment(segment)}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  불러오기
                </button>
                <button
                  onClick={() => handleDeleteSegment(segment.id, segment.name)}
                  disabled={deleting === segment.id}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting === segment.id ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 저장 모달 */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowSaveModal(false)}
            />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  세그먼트 저장
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      세그먼트명 *
                    </label>
                    <input
                      type="text"
                      value={segmentName}
                      onChange={(e) => setSegmentName(e.target.value)}
                      placeholder="예: VIP 고객, 최근 구매자 등"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      설명 (선택사항)
                    </label>
                    <textarea
                      value={segmentDescription}
                      onChange={(e) => setSegmentDescription(e.target.value)}
                      placeholder="세그먼트에 대한 설명을 입력하세요"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-600 mb-2">현재 필터 설정:</p>
                    <div className="text-xs text-gray-700 space-y-1">
                      {currentFilter.purchased && (
                        <p>• 구매 여부: {currentFilter.purchased === 'true' ? '구매자만' : '비구매자만'}</p>
                      )}
                      {currentFilter.purchaseYears && (
                        <p>• 구매 경과: {currentFilter.purchaseYears}</p>
                      )}
                      {currentFilter.contactYears && (
                        <p>• 연락 경과: {currentFilter.contactYears}</p>
                      )}
                      {currentFilter.contactDays && (
                        <p>• 최근 연락: {currentFilter.contactDays}일 이내</p>
                      )}
                      {currentFilter.vipLevel && (
                        <p>• VIP 레벨: {currentFilter.vipLevel}</p>
                      )}
                      {!currentFilter.purchased && !currentFilter.purchaseYears && 
                       !currentFilter.contactYears && !currentFilter.contactDays && 
                       !currentFilter.vipLevel && (
                        <p className="text-gray-500">• 필터 없음 (전체)</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleSaveSegment}
                  disabled={saving || !segmentName.trim()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setSegmentName('');
                    setSegmentDescription('');
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
