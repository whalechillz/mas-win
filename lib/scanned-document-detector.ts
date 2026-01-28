/**
 * 스캔 서류 감지 유틸리티
 * 파일명 패턴으로 스캔 서류를 자동 감지하고 타입을 분류
 */

export interface DocumentDetectionResult {
  isDocument: boolean;
  documentType?: 'order_spec' | 'survey' | 'consent' | 'other';
  confidence: number;
}

/**
 * 파일명과 경로를 기반으로 스캔 서류인지 감지하고 타입을 분류
 * 
 * @param fileName 파일명 (예: 'ahnhuija_s1_seukaen-20260126-2_01.webp')
 * @param filePath 파일 경로 (예: 'originals/customers/ahnhuija-3665/2026-01-26/...')
 * @returns 문서 감지 결과
 */
export function detectScannedDocument(
  fileName: string,
  filePath?: string
): DocumentDetectionResult {
  if (!fileName) {
    return { isDocument: false, confidence: 0 };
  }

  const lowerFileName = fileName.toLowerCase();
  const lowerFilePath = filePath?.toLowerCase() || '';
  
  // 'seukaen', 'scan', 또는 's0_docs' 패턴 포함 여부 확인
  const hasScanKeyword = 
    lowerFileName.includes('seukaen') || 
    lowerFileName.includes('scan') ||
    lowerFileName.includes('s0_docs') ||
    lowerFilePath.includes('seukaen') ||
    lowerFilePath.includes('scan') ||
    lowerFilePath.includes('s0_docs');
  
  if (!hasScanKeyword) {
    return { isDocument: false, confidence: 0 };
  }
  
  // 문서 타입 패턴 매칭
  const patterns = {
    order_spec: [
      /주문.*사양서/i,
      /order.*spec/i,
      /사양서/i,
      /피팅/i,
      /specification/i,
      /주문서/i
    ],
    survey: [
      /설문.*조사/i,
      /survey/i,
      /조사/i,
      /질문/i,
      /questionnaire/i
    ],
    consent: [
      /동의/i,
      /consent/i,
      /agree/i,
      /승인/i,
      /approval/i
    ]
  };
  
  // 각 문서 타입별 패턴 매칭 시도
  for (const [type, typePatterns] of Object.entries(patterns)) {
    for (const pattern of typePatterns) {
      if (pattern.test(lowerFileName) || pattern.test(lowerFilePath)) {
        return {
          isDocument: true,
          documentType: type as 'order_spec' | 'survey' | 'consent',
          confidence: 0.9
        };
      }
    }
  }
  
  // 패턴 매칭 실패 시 'other'로 분류 (seukaen이 포함되어 있으므로 문서로 간주)
  return {
    isDocument: true,
    documentType: 'other',
    confidence: 0.7
  };
}

/**
 * 문서 타입을 한글로 변환
 */
export function getDocumentTypeLabel(documentType: string): string {
  const labels: Record<string, string> = {
    'order_spec': '주문사양서',
    'survey': '설문조사',
    'consent': '동의서',
    'other': '기타'
  };
  return labels[documentType] || documentType;
}
