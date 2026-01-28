# 서류 파일명 규칙 및 OCR 처리 현황

## 1. 서류 파일명 규칙

### 1.1 파일명 생성 방식

서류가 감지되면 두 가지 파일명 형식이 사용됩니다:

#### 방식 1: 기존 방식 (하위 호환성)
**함수**: `generateCustomerImageFileName`
**형식**: `{영문이름}_s0_docs-{날짜}-{번호}_{순번}.{확장자}`

**예시:**
- `ahnhuija_s0_docs-20260126-2_01.webp`
- `choitaeseom_s0_docs-20260128-1_01.webp`

**구성 요소:**
- `{영문이름}`: 고객 영문 이름 (소문자, 특수문자 제거)
- `s0`: 서류는 항상 장면 코드 0
- `docs`: 문서 타입 표시
- `{날짜}`: YYYYMMDD 형식 (예: 20260126)
- `{번호}`: 문서 번호 (1, 2, 3...)
- `{순번}`: 같은 문서의 순번 (01, 02, 03...)
- `{확장자}`: 원본 확장자 또는 .webp

#### 방식 2: 최종 파일명 (새로운 업로드 플로우)
**함수**: `generateFinalCustomerImageFileName`
**형식**: `{고객명}-S0-{YYYYMMDD}-{순번}.{확장자}`

**예시:**
- `ahnhuija-S0-20260127-01.webp`
- `choitaeseom-S0-20260128-01.webp`

**구성 요소:**
- `{고객명}`: 고객 영문 이름 (소문자, 특수문자 제거)
- `S0`: 서류는 항상 장면 코드 S0
- `{YYYYMMDD}`: 방문일자 (하이픈 제거)
- `{순번}`: 2자리 순번 (01, 02, 03...)
- `{확장자}`: .webp (이미지) 또는 원본 확장자 (동영상)

### 1.2 서류 감지 방법

**함수**: `detectScannedDocument` (`lib/scanned-document-detector.ts`)

**감지 기준:**
1. 파일명 또는 경로에 다음 키워드 포함:
   - `seukaen`
   - `scan`
   - `s0_docs`

2. 문서 타입 자동 분류:
   - **주문사양서** (`order_spec`): "주문사양서", "order spec", "사양서", "피팅", "주문서"
   - **설문조사** (`survey`): "설문조사", "survey", "조사", "질문"
   - **동의서** (`consent`): "동의", "consent", "agree", "승인"
   - **기타** (`other`): 위 패턴에 매칭되지 않지만 `seukaen`이 포함된 경우

### 1.3 저장 경로

서류도 일반 이미지와 동일한 경로에 저장됩니다:
```
originals/customers/{고객폴더명}/{방문일자}/{파일명}
```

**예시:**
- `originals/customers/ahnhuija-3665/2026-01-26/ahnhuija_s0_docs-20260126-2_01.webp`
- `originals/customers/choitaeseom-8081/2026-01-28/choitaeseom-S0-20260128-01.webp`

## 2. OCR 처리 현황

### 2.1 현재 상태: ❌ OCR 미구현

**현재는 OCR 처리가 구현되지 않았습니다.**

### 2.2 계획

OCR 처리는 **2차 개발 계획**으로 분리되어 있습니다:

#### 1차 계획 (현재 완료): 문서 분류 및 관리
- ✅ 스캔 서류 자동 감지
- ✅ 문서 타입 자동 분류
- ✅ 일반 이미지와 구분 관리
- ✅ UI 필터링 기능
- ❌ OCR 텍스트 추출 (제외)

#### 2차 계획 (미구현): OCR 처리 및 데이터 활용
- ⏳ Google Cloud Vision API 연동
- ⏳ OCR 텍스트 추출
- ⏳ 문서 타입별 파싱 (주문사양서, 설문조사 등)
- ⏳ 구조화된 데이터 저장
- ⏳ 후기 타임라인 자동 연동
- ⏳ 텍스트 기반 검색

### 2.3 OCR 구현 시 예상 기능

**계획된 API:**
- `POST /api/admin/process-scanned-document`: OCR 처리 요청
- `GET /api/admin/scanned-documents`: OCR 처리된 문서 목록 조회

**예상 데이터 구조:**
```typescript
interface OCRResult {
  text: string;              // 추출된 전체 텍스트
  confidence: number;        // OCR 신뢰도 (0-1)
  blocks: Array<{            // 텍스트 블록
    text: string;
    boundingBox: any;
  }>;
}
```

**예상 활용:**
- 주문사양서에서 제품 정보 자동 추출
- 설문조사에서 답변 자동 추출
- 후기 타임라인에 자동 반영
- 텍스트 기반 검색

## 3. 요약

### 파일명 규칙
- **기존 방식**: `{영문이름}_s0_docs-{날짜}-{번호}_{순번}.{확장자}`
- **새 방식**: `{고객명}-S0-{YYYYMMDD}-{순번}.{확장자}`
- **저장 경로**: `originals/customers/{고객폴더명}/{방문일자}/`

### OCR 처리
- **현재**: ❌ 미구현
- **계획**: 2차 개발 계획으로 분리
- **예상 API**: Google Cloud Vision API
- **예상 기능**: 텍스트 추출, 문서 파싱, 자동 연동
