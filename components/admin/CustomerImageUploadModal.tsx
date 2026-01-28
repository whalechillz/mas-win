/**
 * 고객 이미지 업로드 전 설정 모달
 * 이미지 업로드 전에 메타데이터 생성 방식을 선택하고, 이미지 내용을 분석하여 파일명을 자동 생성
 */

import { useState, useEffect } from 'react';

interface CustomerImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: number;
    name: string;
    name_en?: string;
  };
  visitDate: string; // YYYY-MM-DD 형식
  file: File | null;
  onConfirm: (config: {
    file: File;
    customerId: number;
    customerName: string;
    visitDate: string;
    metadataType: 'golf-ai' | 'general';
  }) => Promise<void>;
}

export default function CustomerImageUploadModal({
  isOpen,
  onClose,
  customer,
  visitDate,
  file,
  onConfirm
}: CustomerImageUploadModalProps) {
  const [metadataType, setMetadataType] = useState<'golf-ai' | 'general'>('golf-ai');
  const [selectedVisitDate, setSelectedVisitDate] = useState(visitDate);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedVisitDate(visitDate);
      setMetadataType('golf-ai');
    }
  }, [isOpen, visitDate]);

  if (!isOpen || !file) return null;

  const handleConfirm = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    try {
      await onConfirm({
        file,
        customerId: customer.id,
        customerName: customer.name,
        visitDate: selectedVisitDate,
        metadataType
      });
      onClose();
    } catch (error: any) {
      console.error('업로드 설정 확인 오류:', error);
      alert('업로드 설정 확인 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* 헤더 */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">이미지 업로드 설정</h2>
        </div>

        {/* 본문 */}
        <div className="p-4 space-y-4">
          {/* 선택된 파일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              선택된 파일
            </label>
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
              {file.name}
              <span className="ml-2 text-gray-400">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          </div>

          {/* 고객명 (자동 설정, 수정 불가) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              고객명
            </label>
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
              {customer.name}
              <span className="ml-2 text-gray-400">(자동 설정)</span>
            </div>
          </div>

          {/* 메타데이터 생성 방식 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메타데이터 생성 방식
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="metadataType"
                  value="golf-ai"
                  checked={metadataType === 'golf-ai'}
                  onChange={(e) => setMetadataType(e.target.value as 'golf-ai')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">골프 AI 생성</span>
                <span className="text-xs text-gray-500">(골프 특화 분석)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="metadataType"
                  value="general"
                  checked={metadataType === 'general'}
                  onChange={(e) => setMetadataType(e.target.value as 'general')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">일반 메타 생성</span>
                <span className="text-xs text-gray-500">(범용 분석)</span>
              </label>
            </div>
          </div>

          {/* 방문일자 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              방문일자
            </label>
            <input
              type="date"
              value={selectedVisitDate}
              onChange={(e) => setSelectedVisitDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin">⏳</span>
                처리 중...
              </>
            ) : (
              '메타데이터 생성 및 업로드'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
