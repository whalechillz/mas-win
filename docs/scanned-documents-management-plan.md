# 스캔 서류 관리 및 OCR 활용 개발 계획서

## 📋 목차
1. [현재 상태 분석](#현재-상태-분석)
2. [문제점 및 개선 필요성](#문제점-및-개선-필요성)
3. [목표 및 요구사항](#목표-및-요구사항)
4. [기술 스택 및 솔루션](#기술-스택-및-솔루션)
5. [시스템 설계](#시스템-설계)
6. [구현 계획](#구현-계획)
7. [단계별 작업 계획](#단계별-작업-계획)
8. [예상 효과](#예상-효과)

---

## 1. 현재 상태 분석

### 1.1 현재 관리 방식
- **저장 위치**: `originals/customers/{고객폴더명}/{날짜}/` 폴더에 일반 이미지와 함께 저장
- **파일명 형식**: `{고객명}_s{장면번호}_seukaen-{날짜}-{번호}.webp`
  - 예: `ahnhuija_s1_seukaen-20260126-2_01.webp`
  - 예: `ahnhuija_sl_seukaen-20260126-3.01.webp`
- **파일 타입**: 일반 이미지 파일 (WEBP, JPG 등)
- **메타데이터**: `image_assets` 테이블에 일반 이미지와 동일하게 저장
- **구분**: 현재는 일반 이미지와 구분되지 않음

### 1.2 스캔 서류 종류
1. **주문사양서 (Order Specification)**
   - VIP 클럽 분석 및 주문 사양서
   - 고객 기본 정보, 신체 정보, 피팅 정보 등 포함
   - 손으로 작성된 텍스트 다수

2. **설문조사 (Survey)**
   - 고객 만족도 조사
   - 제품 사용 경험 질문
   - 손으로 작성된 답변

3. **기타 서류**
   - 인터뷰 동의서
   - 기타 고객 관련 문서

### 1.3 현재 문제점
- ✅ **검색 불가능**: 텍스트 내용으로 검색 불가
- ✅ **데이터 활용 불가**: 후기 타임라인 등에 자동 반영 불가
- ✅ **구분 어려움**: 일반 이미지와 구분이 어려움
- ✅ **메타데이터 부족**: 문서 타입, 내용 등 구조화된 정보 없음

---

## 2. 문제점 및 개선 필요성

### 2.1 비즈니스 문제
1. **데이터 활용 제한**
   - 설문조사 답변을 후기 타임라인에 자동 반영 불가
   - 주문사양서 정보를 고객 프로필에 자동 연동 불가
   - 검색 및 필터링 기능 부재

2. **업무 효율성 저하**
   - 수동으로 정보 입력 필요
   - 문서 찾기 어려움
   - 데이터 중복 입력

3. **고객 경험 개선 기회 상실**
   - 개인화된 후기 타임라인 제공 불가
   - 고객별 맞춤 정보 제공 어려움

### 2.2 기술적 문제
1. **데이터 구조 부재**
   - 스캔 서류 전용 테이블/필드 없음
   - OCR 결과 저장 공간 없음
   - 문서 타입 구분 메커니즘 없음

2. **통합 관리 어려움**
   - 일반 이미지와 혼재
   - 문서별 특화 기능 제공 불가

---

## 3. 목표 및 요구사항

### 3.1 목표
1. **스캔 서류 자동 인식 및 분리**
   - 파일명 패턴으로 자동 감지
   - 문서 타입 자동 분류
   - 일반 이미지와 자동 구분

2. **OCR을 통한 텍스트 추출**
   - 한글 손글씨 인식
   - 구조화된 데이터 추출
   - 메타데이터 자동 생성

3. **데이터 활용 자동화**
   - 후기 타임라인 자동 반영
   - 고객 프로필 자동 업데이트
   - 검색 및 필터링 기능 제공

### 3.2 요구사항

#### 기능 요구사항
- ✅ 스캔 서류 자동 감지 및 분류
- ✅ OCR 텍스트 추출 및 저장
- ✅ 문서 타입별 구조화된 데이터 추출
- ✅ 후기 타임라인 자동 연동
- ✅ 고객 프로필 자동 업데이트
- ✅ 검색 및 필터링 기능
- ✅ 문서 전용 관리 UI

#### 비기능 요구사항
- ✅ OCR 정확도: 한글 손글씨 80% 이상
- ✅ 처리 속도: 이미지당 5초 이내
- ✅ 비용 효율성: API 호출 최소화
- ✅ 확장성: 다양한 문서 타입 지원

---

## 4. 기술 스택 및 솔루션

### 4.1 OCR 솔루션 비교

| 솔루션 | 장점 | 단점 | 비용 | 추천도 |
|--------|------|------|------|--------|
| **Google Cloud Vision API** | 높은 정확도, 한글 지원 우수 | 비용 높음 | $1.50/1000회 | ⭐⭐⭐⭐ |
| **AWS Textract** | 구조화된 데이터 추출 우수 | 한글 지원 제한적 | $1.50/1000회 | ⭐⭐⭐ |
| **Azure Computer Vision** | 한글 지원 우수 | 비용 중간 | $1.00/1000회 | ⭐⭐⭐⭐ |
| **Tesseract OCR** | 무료, 오픈소스 | 정확도 낮음, 설정 복잡 | 무료 | ⭐⭐ |
| **Naver Clova OCR** | 한글 특화, 국내 서비스 | API 문서 제한적 | 유료 | ⭐⭐⭐⭐ |

**추천**: **Google Cloud Vision API** 또는 **Azure Computer Vision**
- 한글 손글씨 인식 정확도 높음
- 구조화된 데이터 추출 가능
- 안정적인 API 제공

### 4.2 데이터베이스 설계

#### 새 테이블: `scanned_documents`
```sql
CREATE TABLE scanned_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id INTEGER REFERENCES customers(id),
  image_asset_id UUID REFERENCES image_assets(id),
  
  -- 문서 정보
  document_type VARCHAR(50) NOT NULL, -- 'order_spec', 'survey', 'consent', 'other'
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  original_url TEXT,
  
  -- OCR 결과
  ocr_text TEXT, -- 전체 추출 텍스트
  ocr_json JSONB, -- 구조화된 OCR 결과 (필드별)
  ocr_confidence DECIMAL(5,2), -- OCR 신뢰도 (0-100)
  ocr_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  ocr_processed_at TIMESTAMP,
  
  -- 추출된 데이터 (문서 타입별)
  extracted_data JSONB, -- 구조화된 데이터
  
  -- 메타데이터
  visit_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_scanned_documents_customer_id ON scanned_documents(customer_id);
CREATE INDEX idx_scanned_documents_document_type ON scanned_documents(document_type);
CREATE INDEX idx_scanned_documents_visit_date ON scanned_documents(visit_date);
CREATE INDEX idx_scanned_documents_ocr_status ON scanned_documents(ocr_status);
CREATE INDEX idx_scanned_documents_ocr_text_gin ON scanned_documents USING gin(to_tsvector('korean', ocr_text));
```

#### `image_assets` 테이블 확장
```sql
ALTER TABLE image_assets 
ADD COLUMN IF NOT EXISTS is_scanned_document BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);
```

### 4.3 API 설계

#### 4.3.1 OCR 처리 API
```
POST /api/admin/process-scanned-document
Body: {
  imageAssetId: string,
  documentType?: string, // 자동 감지 또는 수동 지정
  forceReprocess?: boolean
}

Response: {
  success: boolean,
  documentId: string,
  ocrStatus: string,
  extractedData?: object
}
```

#### 4.3.2 스캔 서류 조회 API
```
GET /api/admin/scanned-documents
Query: {
  customerId?: number,
  documentType?: string,
  visitDate?: string,
  search?: string, // OCR 텍스트 검색
  page?: number,
  pageSize?: number
}
```

#### 4.3.3 후기 타임라인 연동 API
```
GET /api/admin/customer-timeline/:customerId
Response: {
  timeline: [
    {
      date: string,
      type: 'survey' | 'order_spec' | 'visit',
      data: object,
      documentId?: string
    }
  ]
}
```

---

## 5. 시스템 설계

### 5.1 아키텍처

```
┌─────────────────┐
│  Image Upload   │
│  (기존 시스템)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Document       │
│  Detection      │ ◄── 파일명 패턴 분석
│  (자동 감지)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OCR Processing │ ◄── Google Cloud Vision API
│  (비동기 처리)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Data Extraction│ ◄── 문서 타입별 파싱
│  (구조화)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database       │
│  Storage        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Timeline       │
│  Integration    │ ◄── 후기 타임라인 자동 반영
└─────────────────┘
```

### 5.2 문서 감지 로직

```javascript
// 파일명 패턴으로 스캔 서류 감지
function detectScannedDocument(fileName, filePath) {
  const patterns = {
    order_spec: /seukaen.*주문|order.*spec|사양서/i,
    survey: /seukaen.*설문|survey|조사/i,
    consent: /seukaen.*동의|consent/i
  };
  
  // 파일명에서 'seukaen' 포함 여부 확인
  if (fileName.includes('seukaen') || fileName.includes('scan')) {
    // 문서 타입 자동 감지
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(fileName) || pattern.test(filePath)) {
        return { isDocument: true, documentType: type };
      }
    }
    return { isDocument: true, documentType: 'other' };
  }
  
  return { isDocument: false };
}
```

### 5.3 OCR 처리 플로우

```javascript
async function processScannedDocument(imageAssetId) {
  // 1. 이미지 메타데이터 조회
  const imageAsset = await getImageAsset(imageAssetId);
  
  // 2. Google Cloud Vision API 호출
  const ocrResult = await callGoogleVisionAPI(imageAsset.cdn_url);
  
  // 3. 텍스트 추출
  const extractedText = extractText(ocrResult);
  
  // 4. 문서 타입별 구조화
  const structuredData = parseDocumentByType(
    imageAsset.document_type,
    extractedText
  );
  
  // 5. 데이터베이스 저장
  await saveScannedDocument({
    imageAssetId,
    ocrText: extractedText,
    extractedData: structuredData,
    ocrConfidence: ocrResult.confidence
  });
  
  // 6. 후기 타임라인 업데이트 (비동기)
  await updateCustomerTimeline(imageAsset.customer_id, structuredData);
}
```

### 5.4 문서 타입별 파싱 로직

#### 주문사양서 (Order Specification)
```javascript
function parseOrderSpecification(ocrText) {
  return {
    customerInfo: {
      name: extractField(ocrText, /성함[:\s]*([^\n]+)/),
      phone: extractField(ocrText, /전화[:\s]*([^\n]+)/),
      address: extractField(ocrText, /주소[:\s]*([^\n]+)/),
      date: extractField(ocrText, /날짜[:\s]*([^\n]+)/)
    },
    physicalInfo: {
      rhLh: extractField(ocrText, /RH\/LH[:\s]*([^\n]+)/),
      weight: extractField(ocrText, /체중[:\s]*([^\n]+)/),
      height: extractField(ocrText, /신장[:\s]*([^\n]+)/)
    },
    fittingInfo: {
      // 피팅 정보 추출
    },
    notes: extractNotes(ocrText)
  };
}
```

#### 설문조사 (Survey)
```javascript
function parseSurvey(ocrText) {
  return {
    customerName: extractField(ocrText, /성함[:\s]*([^\n]+)/),
    age: extractField(ocrText, /나이[:\s]*([^\n]+)/),
    answers: {
      q1: extractField(ocrText, /질문1[:\s]*([^\n]+)/),
      q2: extractField(ocrText, /질문2[:\s]*([^\n]+)/),
      // ...
    },
    consent: extractField(ocrText, /동의[:\s]*(예|아니오|✓|×)/)
  };
}
```

---

## 6. 구현 계획 (수정)

### 📌 1차 계획: 문서 분류 및 관리 시스템 구축 (OCR 제외)

**목표**: 이미지만으로 스캔 서류를 자동 감지하고 분류하여 일반 이미지와 구분 관리

#### 6.1 Phase 1-1: 문서 감지 및 분류 시스템 (1주)
- [ ] 데이터베이스 테이블 생성 (`scanned_documents` 기본 구조)
- [ ] 문서 감지 로직 구현 (파일명 패턴 기반)
- [ ] 문서 타입 자동 분류 (주문사양서, 설문조사, 동의서 등)
- [ ] `image_assets` 테이블에 `is_scanned_document`, `document_type` 필드 추가
- [ ] 문서 분류 API 구현 (`POST /api/admin/classify-document`)

#### 6.1 Phase 1-2: 문서 관리 UI (1주)
- [ ] 고객 이미지 모달에 "스캔 서류" 필터 추가
- [ ] 문서 타입별 필터링 기능
- [ ] 문서 전용 관리 페이지 (선택사항)
- [ ] 문서 목록 조회 API (`GET /api/admin/scanned-documents`)

#### 6.1 Phase 1-3: 기존 데이터 분류 (3일)
- [ ] 기존 이미지 중 스캔 서류 자동 감지 스크립트
- [ ] 일괄 분류 처리
- [ ] 분류 결과 검증 및 수정 도구

**1차 완료 기준**:
- ✅ 스캔 서류가 자동으로 감지되고 분류됨
- ✅ 일반 이미지와 스캔 서류를 구분하여 관리 가능
- ✅ 문서 타입별 필터링 및 조회 가능
- ✅ 기존 데이터 분류 완료

---

### 📌 2차 계획: OCR 처리 및 데이터 활용 (1차 완료 후)

**목표**: OCR을 통한 텍스트 추출 및 구조화된 데이터 활용

#### 6.2 Phase 2-1: OCR API 연동 (1주)
- [ ] Google Cloud Vision API 계정 설정
- [ ] OCR 처리 API 구현 (`POST /api/admin/process-scanned-document`)
- [ ] 비동기 OCR 처리 시스템 구축
- [ ] 에러 처리 및 재시도 로직

#### 6.2 Phase 2-2: 문서 파싱 및 데이터 추출 (1주)
- [ ] 문서 타입별 파싱 로직 구현
- [ ] 구조화된 데이터 추출
- [ ] OCR 결과 저장 및 관리
- [ ] 신뢰도 점수 계산 및 표시

#### 6.2 Phase 2-3: 데이터 활용 (1주)
- [ ] 후기 타임라인 자동 연동
- [ ] 고객 프로필 자동 업데이트
- [ ] OCR 텍스트 기반 검색 기능
- [ ] 문서 내용 편집 및 수정 기능

#### 6.2 Phase 2-4: 기존 문서 OCR 처리 (1주)
- [ ] 기존 분류된 문서 일괄 OCR 처리
- [ ] 데이터 검증 및 수정
- [ ] 사용자 교육 및 문서화

**2차 완료 기준**:
- ✅ OCR 텍스트 추출 및 저장 완료
- ✅ 구조화된 데이터 추출 및 활용
- ✅ 후기 타임라인 자동 연동
- ✅ 텍스트 기반 검색 기능 제공

---

## 7. 단계별 작업 계획

### Phase 1: 기반 구축

#### 1.1 데이터베이스 스키마 생성
**파일**: `database/create-scanned-documents-table.sql`

```sql
-- scanned_documents 테이블 생성
CREATE TABLE IF NOT EXISTS scanned_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  image_asset_id UUID REFERENCES image_assets(id) ON DELETE CASCADE,
  
  document_type VARCHAR(50) NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  original_url TEXT,
  
  ocr_text TEXT,
  ocr_json JSONB,
  ocr_confidence DECIMAL(5,2),
  ocr_status VARCHAR(20) DEFAULT 'pending',
  ocr_processed_at TIMESTAMP,
  
  extracted_data JSONB,
  visit_date DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_scanned_documents_customer_id 
  ON scanned_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_document_type 
  ON scanned_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_visit_date 
  ON scanned_documents(visit_date);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_ocr_status 
  ON scanned_documents(ocr_status);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_ocr_text_gin 
  ON scanned_documents USING gin(to_tsvector('korean', ocr_text));

-- image_assets 테이블 확장
ALTER TABLE image_assets 
ADD COLUMN IF NOT EXISTS is_scanned_document BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);
```

#### 1.2 문서 감지 유틸리티
**파일**: `lib/scanned-document-detector.ts`

```typescript
export interface DocumentDetectionResult {
  isDocument: boolean;
  documentType?: 'order_spec' | 'survey' | 'consent' | 'other';
  confidence: number;
}

export function detectScannedDocument(
  fileName: string,
  filePath?: string
): DocumentDetectionResult {
  const lowerFileName = fileName.toLowerCase();
  const lowerFilePath = filePath?.toLowerCase() || '';
  
  // 'seukaen' 또는 'scan' 포함 여부 확인
  const hasScanKeyword = 
    lowerFileName.includes('seukaen') || 
    lowerFileName.includes('scan') ||
    lowerFilePath.includes('seukaen') ||
    lowerFilePath.includes('scan');
  
  if (!hasScanKeyword) {
    return { isDocument: false, confidence: 0 };
  }
  
  // 문서 타입 패턴 매칭
  const patterns = {
    order_spec: [
      /주문.*사양서/i,
      /order.*spec/i,
      /사양서/i,
      /피팅/i
    ],
    survey: [
      /설문.*조사/i,
      /survey/i,
      /조사/i
    ],
    consent: [
      /동의/i,
      /consent/i,
      /agree/i
    ]
  };
  
  for (const [type, typePatterns] of Object.entries(patterns)) {
    for (const pattern of typePatterns) {
      if (pattern.test(lowerFileName) || pattern.test(lowerFilePath)) {
        return {
          isDocument: true,
          documentType: type as any,
          confidence: 0.9
        };
      }
    }
  }
  
  // 패턴 매칭 실패 시 'other'로 분류
  return {
    isDocument: true,
    documentType: 'other',
    confidence: 0.7
  };
}
```

#### 1.3 OCR API 연동
**파일**: `lib/ocr-processor.ts`

```typescript
import { ImageAnnotatorClient } from '@google-cloud/vision';

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: Array<{
    text: string;
    boundingBox: any;
  }>;
}

export async function processOCR(imageUrl: string): Promise<OCRResult> {
  const client = new ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
  });
  
  // 이미지 다운로드
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  
  // OCR 요청
  const [result] = await client.textDetection({
    image: { content: Buffer.from(imageBuffer) }
  });
  
  const detections = result.textAnnotations || [];
  const fullText = detections[0]?.description || '';
  
  // 블록 추출
  const blocks = detections.slice(1).map(detection => ({
    text: detection.description || '',
    boundingBox: detection.boundingPoly
  }));
  
  // 평균 신뢰도 계산
  const confidence = calculateConfidence(detections);
  
  return {
    text: fullText,
    confidence,
    blocks
  };
}

function calculateConfidence(detections: any[]): number {
  // 신뢰도 계산 로직
  return 0.85; // 임시값
}
```

#### 1.4 OCR 처리 API
**파일**: `pages/api/admin/process-scanned-document.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { detectScannedDocument } from '../../../lib/scanned-document-detector';
import { processOCR } from '../../../lib/ocr-processor';
import { parseDocumentByType } from '../../../lib/document-parser';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { imageAssetId, documentType, forceReprocess } = req.body;
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 이미지 메타데이터 조회
    const { data: imageAsset, error: assetError } = await supabase
      .from('image_assets')
      .select('*')
      .eq('id', imageAssetId)
      .single();
    
    if (assetError || !imageAsset) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // 문서 감지 (수동 지정이 없으면 자동 감지)
    let detectedType = documentType;
    if (!detectedType) {
      const detection = detectScannedDocument(
        imageAsset.filename || '',
        imageAsset.file_path || ''
      );
      if (!detection.isDocument) {
        return res.status(400).json({ 
          error: 'Not a scanned document' 
        });
      }
      detectedType = detection.documentType;
    }
    
    // 기존 문서 레코드 확인
    const { data: existingDoc } = await supabase
      .from('scanned_documents')
      .select('*')
      .eq('image_asset_id', imageAssetId)
      .maybeSingle();
    
    if (existingDoc && !forceReprocess) {
      return res.status(200).json({
        success: true,
        documentId: existingDoc.id,
        ocrStatus: existingDoc.ocr_status
      });
    }
    
    // OCR 처리
    const ocrResult = await processOCR(imageAsset.cdn_url);
    
    // 문서 타입별 파싱
    const extractedData = parseDocumentByType(
      detectedType,
      ocrResult.text
    );
    
    // 고객 ID 추출 (file_path에서)
    const customerId = extractCustomerIdFromPath(imageAsset.file_path);
    
    // 날짜 추출
    const visitDate = extractDateFromPath(imageAsset.file_path);
    
    // 문서 레코드 저장/업데이트
    const documentData = {
      customer_id: customerId,
      image_asset_id: imageAssetId,
      document_type: detectedType,
      file_path: imageAsset.file_path,
      file_name: imageAsset.filename,
      original_url: imageAsset.cdn_url,
      ocr_text: ocrResult.text,
      ocr_json: ocrResult.blocks,
      ocr_confidence: ocrResult.confidence,
      ocr_status: 'completed',
      ocr_processed_at: new Date().toISOString(),
      extracted_data: extractedData,
      visit_date: visitDate
    };
    
    let documentId;
    if (existingDoc) {
      const { data: updated } = await supabase
        .from('scanned_documents')
        .update(documentData)
        .eq('id', existingDoc.id)
        .select('id')
        .single();
      documentId = updated?.id;
    } else {
      const { data: inserted } = await supabase
        .from('scanned_documents')
        .insert(documentData)
        .select('id')
        .single();
      documentId = inserted?.id;
    }
    
    // image_assets 업데이트
    await supabase
      .from('image_assets')
      .update({
        is_scanned_document: true,
        document_type: detectedType
      })
      .eq('id', imageAssetId);
    
    return res.status(200).json({
      success: true,
      documentId,
      ocrStatus: 'completed',
      extractedData
    });
    
  } catch (error: any) {
    console.error('OCR 처리 오류:', error);
    return res.status(500).json({ 
      error: error.message || 'OCR processing failed' 
    });
  }
}
```

### Phase 2: OCR 처리

#### 2.1 문서 파서 구현
**파일**: `lib/document-parser.ts`

```typescript
export interface ParsedOrderSpec {
  customerInfo: {
    name?: string;
    phone?: string;
    address?: string;
    date?: string;
  };
  physicalInfo: {
    rhLh?: string;
    weight?: string;
    height?: string;
    waist?: string;
    gloveSize?: string;
  };
  fittingInfo: any;
  notes?: string[];
}

export interface ParsedSurvey {
  customerName?: string;
  age?: string;
  answers: Record<string, string>;
  consent?: boolean;
}

export function parseDocumentByType(
  documentType: string,
  ocrText: string
): ParsedOrderSpec | ParsedSurvey | any {
  switch (documentType) {
    case 'order_spec':
      return parseOrderSpecification(ocrText);
    case 'survey':
      return parseSurvey(ocrText);
    default:
      return { rawText: ocrText };
  }
}

function parseOrderSpecification(text: string): ParsedOrderSpec {
  return {
    customerInfo: {
      name: extractField(text, /성함[:\s]*([^\n]+)/i),
      phone: extractField(text, /전화[:\s]*([^\n]+)/i),
      address: extractField(text, /주소[:\s]*([^\n]+)/i),
      date: extractField(text, /날짜[:\s]*([^\n]+)/i)
    },
    physicalInfo: {
      rhLh: extractField(text, /RH\/LH[:\s]*([^\n]+)/i),
      weight: extractField(text, /체중[:\s]*([^\n]+)/i),
      height: extractField(text, /신장[:\s]*([^\n]+)/i),
      waist: extractField(text, /허리[:\s]*([^\n]+)/i),
      gloveSize: extractField(text, /장갑[:\s]*([^\n]+)/i)
    },
    notes: extractNotes(text)
  };
}

function parseSurvey(text: string): ParsedSurvey {
  return {
    customerName: extractField(text, /성함[:\s]*([^\n]+)/i),
    age: extractField(text, /나이[:\s]*([^\n]+)/i),
    answers: {
      q1: extractField(text, /질문\s*1[:\s]*([^\n]+)/i),
      q2: extractField(text, /질문\s*2[:\s]*([^\n]+)/i),
      q3: extractField(text, /질문\s*3[:\s]*([^\n]+)/i)
    },
    consent: /동의.*[✓√체크]/i.test(text)
  };
}

function extractField(text: string, pattern: RegExp): string | undefined {
  const match = text.match(pattern);
  return match ? match[1].trim() : undefined;
}

function extractNotes(text: string): string[] {
  const notesSection = text.match(/비고[:\s]*([\s\S]+)/i);
  if (!notesSection) return [];
  
  return notesSection[1]
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}
```

#### 2.2 비동기 처리 큐
**파일**: `pages/api/admin/queue-ocr-processing.ts`

```typescript
// 대량 OCR 처리를 위한 큐 시스템
export default async function handler(req, res) {
  // 이미지 목록 조회
  // OCR 처리 큐에 추가
  // 배치 처리
}
```

### Phase 3: 데이터 활용

#### 3.1 후기 타임라인 연동
**파일**: `pages/api/admin/customer-timeline.ts`

```typescript
export default async function handler(req, res) {
  const { customerId } = req.query;
  
  // 스캔 서류 조회
  const { data: documents } = await supabase
    .from('scanned_documents')
    .select('*')
    .eq('customer_id', customerId)
    .order('visit_date', { ascending: false });
  
  // 타임라인 구성
  const timeline = documents.map(doc => ({
    date: doc.visit_date,
    type: doc.document_type,
    data: doc.extracted_data,
    documentId: doc.id
  }));
  
  return res.json({ timeline });
}
```

#### 3.2 검색 API
**파일**: `pages/api/admin/search-scanned-documents.ts`

```typescript
export default async function handler(req, res) {
  const { q, customerId, documentType } = req.query;
  
  let query = supabase
    .from('scanned_documents')
    .select('*');
  
  if (customerId) {
    query = query.eq('customer_id', customerId);
  }
  
  if (documentType) {
    query = query.eq('document_type', documentType);
  }
  
  if (q) {
    // Full-text search
    query = query.textSearch('ocr_text', q);
  }
  
  const { data } = await query;
  
  return res.json({ documents: data });
}
```

### Phase 4: UI 구현

#### 4.1 스캔 서류 관리 컴포넌트
**파일**: `components/admin/ScannedDocumentsManager.tsx`

```typescript
export function ScannedDocumentsManager({ customerId }) {
  // 스캔 서류 목록 조회
  // OCR 처리 버튼
  // 검색 및 필터링
  // 문서 상세 보기
}
```

---

## 8. 예상 효과

### 8.1 비즈니스 효과
- ✅ **데이터 활용도 향상**: 설문조사 답변 자동 반영으로 후기 타임라인 풍부화
- ✅ **업무 효율성 향상**: 수동 입력 작업 80% 감소
- ✅ **검색 기능 강화**: 텍스트 기반 검색으로 문서 찾기 시간 90% 단축
- ✅ **고객 경험 개선**: 개인화된 정보 제공 가능

### 8.2 기술적 효과
- ✅ **데이터 구조화**: 비정형 데이터를 구조화된 데이터로 변환
- ✅ **확장성**: 새로운 문서 타입 추가 용이
- ✅ **통합 관리**: 일반 이미지와 스캔 서류 통합 관리

### 8.3 비용 예상
- **Google Cloud Vision API**: 이미지당 $0.0015
- **월 예상 비용**: 1,000개 이미지 처리 시 $1.50
- **초기 개발 비용**: 약 4주 (개발자 1명)

---

## 9. 다음 단계

1. **승인 및 리소스 할당**
2. **Google Cloud Vision API 계정 설정**
3. **Phase 1 시작**: 데이터베이스 스키마 생성
4. **단계별 구현 및 테스트**
5. **기존 데이터 마이그레이션**
6. **사용자 교육 및 문서화**

---

## 10. 참고 사항

### 10.1 OCR 정확도 개선
- 이미지 전처리 (명도, 대비 조정)
- 여러 OCR 엔진 조합 사용
- 수동 검증 및 보정 기능

### 10.2 보안 및 개인정보
- OCR 텍스트 암호화 저장
- 접근 권한 관리
- 개인정보 마스킹

### 10.3 확장 가능성
- 다른 문서 타입 추가 (계약서, 영수증 등)
- 다국어 지원
- 자동 분류 AI 모델 적용

---

**작성일**: 2026-01-27  
**작성자**: AI Assistant  
**버전**: 1.0
