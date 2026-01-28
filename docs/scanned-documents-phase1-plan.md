# 스캔 서류 분류 시스템 1차 개발 계획서 (OCR 제외)

## 📋 개요

**목표**: 이미지만으로 스캔 서류를 자동 감지하고 분류하여 일반 이미지와 구분 관리  
**기간**: 약 2주  
**범위**: OCR 처리 제외, 문서 분류 및 관리만 구현

---

## 1. 현재 상태

### 1.1 문제점
- 스캔 서류가 일반 이미지와 함께 저장되어 구분이 어려움
- 파일명에 `seukaen`이 포함되어 있지만 자동 분류되지 않음
- 문서 타입별 관리 불가능
- 검색 및 필터링 어려움

### 1.2 스캔 서류 파일명 패턴
- `ahnhuija_s1_seukaen-20260126-2_01.webp` (주문사양서)
- `ahnhuija_sl_seukaen-20260126-3.01.webp` (설문조사)
- 패턴: `{고객명}_s{장면번호}_seukaen-{날짜}-{번호}.{확장자}`

---

## 2. 1차 개발 목표

### 2.1 핵심 기능
1. **자동 문서 감지**: 파일명 패턴으로 스캔 서류 자동 감지
2. **문서 타입 분류**: 주문사양서, 설문조사, 동의서 등 자동 분류
3. **데이터베이스 분리**: 일반 이미지와 스캔 서류 구분 저장
4. **UI 필터링**: 고객 이미지 모달에서 스캔 서류만 필터링 가능
5. **기존 데이터 분류**: 기존 이미지 중 스캔 서류 자동 분류

### 2.2 제외 사항 (2차로 미룸)
- ❌ OCR 텍스트 추출
- ❌ 구조화된 데이터 파싱
- ❌ 후기 타임라인 자동 연동
- ❌ 텍스트 기반 검색

---

## 3. 데이터베이스 설계

### 3.1 `image_assets` 테이블 확장

```sql
-- image_assets 테이블에 필드 추가
ALTER TABLE image_assets 
ADD COLUMN IF NOT EXISTS is_scanned_document BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_image_assets_is_scanned_document 
  ON image_assets(is_scanned_document);
CREATE INDEX IF NOT EXISTS idx_image_assets_document_type 
  ON image_assets(document_type);
```

### 3.2 `scanned_documents` 테이블 (기본 구조만)

```sql
-- 스캔 서류 기본 정보만 저장 (OCR 필드 제외)
CREATE TABLE IF NOT EXISTS scanned_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  image_asset_id UUID REFERENCES image_assets(id) ON DELETE CASCADE,
  
  -- 문서 정보
  document_type VARCHAR(50) NOT NULL, -- 'order_spec', 'survey', 'consent', 'other'
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  original_url TEXT,
  
  -- OCR 관련 필드는 2차에서 추가
  -- ocr_text TEXT,
  -- ocr_json JSONB,
  -- ocr_confidence DECIMAL(5,2),
  -- ocr_status VARCHAR(20) DEFAULT 'pending',
  
  -- 메타데이터
  visit_date DATE,
  detected_at TIMESTAMP DEFAULT NOW(), -- 분류된 시각
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_scanned_documents_customer_id 
  ON scanned_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_document_type 
  ON scanned_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_visit_date 
  ON scanned_documents(visit_date);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_image_asset_id 
  ON scanned_documents(image_asset_id);
```

---

## 4. 구현 계획

### Phase 1-1: 문서 감지 및 분류 시스템 (1주)

#### 4.1 문서 감지 유틸리티
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
      /피팅/i,
      /specification/i
    ],
    survey: [
      /설문.*조사/i,
      /survey/i,
      /조사/i,
      /질문/i
    ],
    consent: [
      /동의/i,
      /consent/i,
      /agree/i,
      /승인/i
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

#### 4.2 문서 분류 API
**파일**: `pages/api/admin/classify-document.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { detectScannedDocument } from '../../../lib/scanned-document-detector';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { imageAssetId, documentType } = req.body;
  
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
          error: 'Not a scanned document',
          detection
        });
      }
      detectedType = detection.documentType;
    }
    
    // 고객 ID 추출 (file_path에서)
    const customerId = extractCustomerIdFromPath(imageAsset.file_path);
    
    // 날짜 추출
    const visitDate = extractDateFromPath(imageAsset.file_path);
    
    // image_assets 업데이트
    const { error: updateError } = await supabase
      .from('image_assets')
      .update({
        is_scanned_document: true,
        document_type: detectedType
      })
      .eq('id', imageAssetId);
    
    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }
    
    // scanned_documents 레코드 생성/업데이트
    const documentData = {
      customer_id: customerId,
      image_asset_id: imageAssetId,
      document_type: detectedType,
      file_path: imageAsset.file_path,
      file_name: imageAsset.filename,
      original_url: imageAsset.cdn_url,
      visit_date: visitDate,
      detected_at: new Date().toISOString()
    };
    
    // 기존 레코드 확인
    const { data: existingDoc } = await supabase
      .from('scanned_documents')
      .select('id')
      .eq('image_asset_id', imageAssetId)
      .maybeSingle();
    
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
    
    return res.status(200).json({
      success: true,
      documentId,
      documentType: detectedType,
      isScannedDocument: true
    });
    
  } catch (error: any) {
    console.error('문서 분류 오류:', error);
    return res.status(500).json({ 
      error: error.message || 'Document classification failed' 
    });
  }
}

function extractCustomerIdFromPath(filePath: string): number | null {
  // originals/customers/{folder_name}/... 패턴에서 고객 ID 추출
  const match = filePath.match(/originals\/customers\/([^\/]+)/);
  if (!match) return null;
  
  // folder_name으로 고객 찾기 (별도 함수 필요)
  // 임시로 null 반환
  return null;
}

function extractDateFromPath(filePath: string): string | null {
  const match = filePath.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}
```

#### 4.3 문서 목록 조회 API
**파일**: `pages/api/admin/scanned-documents.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { customerId, documentType, visitDate, page = '1', pageSize = '50' } = req.query;
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    let query = supabase
      .from('scanned_documents')
      .select(`
        *,
        image_assets (
          id,
          cdn_url,
          file_path,
          filename
        )
      `)
      .order('visit_date', { ascending: false });
    
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    
    if (documentType) {
      query = query.eq('document_type', documentType);
    }
    
    if (visitDate) {
      query = query.eq('visit_date', visitDate);
    }
    
    // 페이지네이션
    const pageNum = parseInt(page as string, 10);
    const sizeNum = parseInt(pageSize as string, 10);
    const from = (pageNum - 1) * sizeNum;
    const to = from + sizeNum - 1;
    
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      documents: data || [],
      count: count || 0,
      page: pageNum,
      pageSize: sizeNum
    });
    
  } catch (error: any) {
    console.error('문서 조회 오류:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch documents' 
    });
  }
}
```

---

### Phase 1-2: 문서 관리 UI (1주)

#### 4.4 고객 이미지 모달에 필터 추가
**파일**: `pages/admin/customers/index.tsx`

```typescript
// CustomerImageModal 컴포넌트에 추가

const [showScannedDocumentsOnly, setShowScannedDocumentsOnly] = useState(false);
const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');

// 필터링된 이미지
const filteredImages = useMemo(() => {
  let filtered = uploadedImages;
  
  // 스캔 서류 필터
  if (showScannedDocumentsOnly) {
    filtered = filtered.filter(img => img.is_scanned_document === true);
  }
  
  // 문서 타입 필터
  if (documentTypeFilter !== 'all') {
    filtered = filtered.filter(img => img.document_type === documentTypeFilter);
  }
  
  // 날짜 필터
  if (selectedDateFilter) {
    filtered = filtered.filter(img => img.date_folder === selectedDateFilter);
  }
  
  return filtered;
}, [uploadedImages, showScannedDocumentsOnly, documentTypeFilter, selectedDateFilter]);

// UI에 추가
<div className="flex gap-2 mb-4">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={showScannedDocumentsOnly}
      onChange={(e) => setShowScannedDocumentsOnly(e.target.checked)}
    />
    스캔 서류만
  </label>
  
  {showScannedDocumentsOnly && (
    <select
      value={documentTypeFilter}
      onChange={(e) => setDocumentTypeFilter(e.target.value)}
      className="px-2 py-1 border rounded"
    >
      <option value="all">전체</option>
      <option value="order_spec">주문사양서</option>
      <option value="survey">설문조사</option>
      <option value="consent">동의서</option>
      <option value="other">기타</option>
    </select>
  )}
</div>
```

#### 4.5 이미지 카드에 문서 타입 표시
```typescript
// 이미지 카드에 문서 타입 배지 추가
{img.is_scanned_document && (
  <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
    {img.document_type === 'order_spec' && '주문사양서'}
    {img.document_type === 'survey' && '설문조사'}
    {img.document_type === 'consent' && '동의서'}
    {img.document_type === 'other' && '기타'}
  </div>
)}
```

---

### Phase 1-3: 기존 데이터 분류 (3일)

#### 4.6 기존 데이터 분류 스크립트
**파일**: `scripts/classify-existing-scanned-documents.js`

```javascript
/**
 * 기존 이미지 중 스캔 서류 자동 분류
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { detectScannedDocument } = require('../lib/scanned-document-detector');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function classifyExistingDocuments() {
  console.log('🚀 기존 스캔 서류 분류 시작...\n');
  
  // 고객 이미지만 조회
  const { data: images, error } = await supabase
    .from('image_assets')
    .select('id, filename, file_path, cdn_url, ai_tags')
    .ilike('file_path', 'originals/customers/%')
    .limit(10000);
  
  if (error) {
    console.error('❌ 이미지 조회 오류:', error);
    return;
  }
  
  console.log(`✅ ${images.length}개 이미지 조회 완료\n`);
  
  let classified = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const image of images) {
    // 이미 분류된 이미지는 건너뛰기
    if (image.is_scanned_document) {
      skipped++;
      continue;
    }
    
    // 문서 감지
    const detection = detectScannedDocument(
      image.filename || '',
      image.file_path || ''
    );
    
    if (!detection.isDocument) {
      continue;
    }
    
    // 고객 ID 추출 (ai_tags에서)
    let customerId = null;
    if (image.ai_tags && Array.isArray(image.ai_tags)) {
      for (const tag of image.ai_tags) {
        if (typeof tag === 'string' && tag.startsWith('customer-')) {
          customerId = parseInt(tag.replace('customer-', ''), 10);
          break;
        }
      }
    }
    
    // 날짜 추출
    const visitDate = extractDateFromPath(image.file_path);
    
    try {
      // image_assets 업데이트
      await supabase
        .from('image_assets')
        .update({
          is_scanned_document: true,
          document_type: detection.documentType
        })
        .eq('id', image.id);
      
      // scanned_documents 레코드 생성
      await supabase
        .from('scanned_documents')
        .insert({
          customer_id: customerId,
          image_asset_id: image.id,
          document_type: detection.documentType,
          file_path: image.file_path,
          file_name: image.filename,
          original_url: image.cdn_url,
          visit_date: visitDate,
          detected_at: new Date().toISOString()
        });
      
      classified++;
      console.log(`✅ 분류 완료: ${image.filename} (${detection.documentType})`);
      
    } catch (error) {
      errors++;
      console.error(`❌ 분류 실패: ${image.filename}`, error);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 최종 통계:');
  console.log('='.repeat(80));
  console.log(`   총 이미지: ${images.length}개`);
  console.log(`   ✅ 분류 완료: ${classified}개`);
  console.log(`   ⏭️  건너뜀: ${skipped}개`);
  console.log(`   ❌ 오류: ${errors}개`);
  console.log('='.repeat(80));
}

function extractDateFromPath(filePath) {
  const match = filePath.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

classifyExistingDocuments().catch(console.error);
```

---

## 5. 작업 일정

### Week 1: 문서 감지 및 분류 시스템
- **Day 1-2**: 데이터베이스 스키마 생성 및 문서 감지 유틸리티 구현
- **Day 3-4**: 문서 분류 API 구현
- **Day 5**: 문서 목록 조회 API 구현 및 테스트

### Week 2: UI 및 기존 데이터 분류
- **Day 1-3**: 고객 이미지 모달에 필터 추가
- **Day 4-5**: 기존 데이터 분류 스크립트 작성 및 실행

---

## 6. 완료 기준

### ✅ 1차 완료 기준
- [ ] 스캔 서류가 자동으로 감지되고 분류됨
- [ ] `image_assets` 테이블에 `is_scanned_document`, `document_type` 필드 추가됨
- [ ] `scanned_documents` 테이블에 기본 정보 저장됨
- [ ] 고객 이미지 모달에서 스캔 서류 필터링 가능
- [ ] 문서 타입별 필터링 가능
- [ ] 기존 데이터 분류 완료 (80% 이상)

---

## 7. 2차 계획으로 미루는 항목

- ❌ OCR 텍스트 추출
- ❌ 구조화된 데이터 파싱
- ❌ 후기 타임라인 자동 연동
- ❌ 텍스트 기반 검색
- ❌ OCR 신뢰도 점수
- ❌ OCR 결과 편집 기능

---

**작성일**: 2026-01-27  
**버전**: 1.0 (1차 계획)
