import React, { useState } from 'react';

interface BlockTimeModalProps {
  date: string;
  time: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BlockTimeModal({
  date,
  time,
  onClose,
  onSuccess,
}: BlockTimeModalProps) {
  const [formData, setFormData] = useState({
    duration: 60,
    location: 'Massgoo Studio',
    reason: '',
    is_virtual: false, // 차단은 항상 false (가상 예약은 별도 옵션)
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 차단은 항상 is_virtual=false로 저장
      const response = await fetch('/api/bookings/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          time,
          ...formData,
          is_virtual: false, // 차단은 항상 false로 강제 설정
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '예약 불가 시간 설정에 실패했습니다.');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {formData.is_virtual ? '가상 예약 설정' : '예약 불가 시간 설정'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>날짜:</strong> {date}<br />
              <strong>시간:</strong> {time}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                지속 시간 (분)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                min="30"
                step="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                위치
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="Massgoo Studio">Massgoo Studio</option>
                <option value="마쓰구골프 [수원 본점]">마쓰구골프 [수원 본점]</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                차단 사유 (선택)
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                placeholder="예: 점검, 휴무 등"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_virtual"
                checked={formData.is_virtual}
                onChange={(e) => setFormData({ ...formData, is_virtual: e.target.checked })}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_virtual" className="text-sm text-gray-700">
                가상 예약 (고객에게는 예약된 것처럼 표시되지만 실제 예약은 가능)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
              >
                {loading ? '저장 중...' : formData.is_virtual ? '가상 예약 추가' : '차단 설정'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

