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
    metadataType: 'golf-ai' | 'general' | 'ocr';
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
  const [metadataType, setMetadataType] = useState<'golf-ai' | 'general' | 'ocr'>('golf-ai');
  
  // 문서 감지 (파일명 기반)
  const isDocument = file ? (() => {
    const originalFileName = file.name;
    const fileName = originalFileName.toLowerCase();
    
    // 각 키워드별 검사 결과
    const checks = {
      hasDoc: fileName.includes('doc'),
      has사양서: fileName.includes('사양서'),
      has문서: fileName.includes('문서'),
      hasScan: fileName.includes('scan'),
      hasSeukaen: fileName.includes('seukaen'),
      has주문: fileName.includes('주문'),
      hasOrder: fileName.includes('order'),
      hasSpec: fileName.includes('spec'),
      hasSpecification: fileName.includes('specification')
    };
    
    // 각 키워드별 상세 검사 (문자열 위치까지 확인)
    const detailedChecks: any = {};
    Object.keys(checks).forEach(key => {
      const keyword = key.replace('has', '').toLowerCase();
      const searchTerms: { [key: string]: string } = {
        'doc': 'doc',
        '사양서': '사양서',
        '문서': '문서',
        'scan': 'scan',
        'seukaen': 'seukaen',
        '주문': '주문',
        'order': 'order',
        'spec': 'spec',
        'specification': 'specification'
      };
      
      const term = searchTerms[keyword] || keyword;
      const index = fileName.indexOf(term);
      detailedChecks[key] = {
        found: checks[key as keyof typeof checks],
        index: index >= 0 ? index : -1,
        term: term
      };
    });
    
    const detected = 
      checks.hasDoc ||
      checks.has사양서 ||
      checks.has문서 ||
      checks.hasScan ||
      checks.hasSeukaen ||
      checks.has주문 ||
      checks.hasOrder ||
      checks.hasSpec ||
      checks.hasSpecification;
    
    // 상세 디버깅 로그
    console.log('📄 [isDocument 계산] 상세 분석:', {
      '원본 파일명': originalFileName,
      '원본 파일명 길이': originalFileName.length,
      '원본 파일명 문자 코드': Array.from(originalFileName).map(c => `${c}(${c.charCodeAt(0)})`).join(', '),
      '소문자 변환 후': fileName,
      '소문자 변환 후 길이': fileName.length,
      '소문자 변환 후 문자 코드': Array.from(fileName).map(c => `${c}(${c.charCodeAt(0)})`).join(', '),
      '최종 감지 결과': detected,
      '키워드 검사 상세': detailedChecks,
      '검사 요약': checks
    });
    
    return detected;
  })() : false;
  const [selectedVisitDate, setSelectedVisitDate] = useState(visitDate);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && file) {
      setSelectedVisitDate(visitDate);
      // 문서인 경우 OCR을 기본값으로 설정 (isDocument와 동일한 로직 사용)
      const originalFileName = file.name;
      const fileName = originalFileName.toLowerCase();
      
      // 각 키워드별 검사
      const checks = {
        hasDoc: fileName.includes('doc'),
        has사양서: fileName.includes('사양서'),
        has문서: fileName.includes('문서'),
        hasScan: fileName.includes('scan'),
        hasSeukaen: fileName.includes('seukaen'),
        has주문: fileName.includes('주문'),
        hasOrder: fileName.includes('order'),
        hasSpec: fileName.includes('spec'),
        hasSpecification: fileName.includes('specification')
      };
      
      const isDoc = 
        checks.hasDoc ||
        checks.has사양서 ||
        checks.has문서 ||
        checks.hasScan ||
        checks.hasSeukaen ||
        checks.has주문 ||
        checks.hasOrder ||
        checks.hasSpec ||
        checks.hasSpecification;
      
      // 각 키워드별 상세 검사
      const detailedChecks: any = {};
      ['doc', '사양서', '문서', 'scan', 'seukaen', '주문', 'order', 'spec', 'specification'].forEach(term => {
        const index = fileName.indexOf(term);
        detailedChecks[term] = {
          found: index >= 0,
          index: index >= 0 ? index : -1,
          substring: index >= 0 ? fileName.substring(Math.max(0, index - 5), index + term.length + 5) : null
        };
      });
      
      console.log('🔍 [useEffect] 문서 감지 상세:', {
        '원본 파일명': originalFileName,
        '소문자 변환 후': fileName,
        '최종 감지 결과': isDoc,
        '설정될 metadataType': isDoc ? 'ocr' : 'golf-ai',
        '키워드 검사 상세': detailedChecks,
        '검사 요약': checks,
        '파일명 유니코드': Array.from(originalFileName).map((c, i) => ({
          char: c,
          code: c.charCodeAt(0),
          hex: c.charCodeAt(0).toString(16),
          position: i
        }))
      });
      
      setMetadataType(isDoc ? 'ocr' : 'golf-ai');
    }
  }, [isOpen, visitDate, file]);

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
              {/* 문서인 경우 OCR 옵션 표시 */}
              {isDocument ? (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="metadataType"
                    value="ocr"
                    checked={metadataType === 'ocr'}
                    onChange={(e) => setMetadataType(e.target.value as 'ocr')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">OCR (구글 비전)</span>
                  <span className="text-xs text-gray-500">(텍스트 추출)</span>
                </label>
              ) : (
                // 디버깅: 문서가 감지되지 않은 경우
                console.log('⚠️ [OCR 옵션] 문서 미감지:', {
                  fileName: file?.name,
                  isDocument,
                  metadataType
                }) || null
              )}
            </div>
            {isDocument && metadataType === 'ocr' && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                📄 문서에서 텍스트를 추출하여 메타데이터에 포함합니다.
              </div>
            )}
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
