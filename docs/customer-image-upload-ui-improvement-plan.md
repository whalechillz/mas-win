# 고객 이미지 업로드 UI 및 파일명 규칙 개선 계획

## 📋 개요

고객 이미지 관리 UI 개선 및 파일명 자동 감지 규칙 적용

## 🎯 요구사항

### 1. UI 개선
- **"갤러리에서 선택" 옆에 "이미지 업로드" 버튼 추가**
- **하단 드래그앤드롭 영역 유지**
- **하단 버튼 변경**: "닫기" → "취소", "저장"
- **갤러리에서 이미지 선택 모달**: "업로드", "업로드모드" 제거, "선택"과 "삭제"만 유지

### 2. 파일명 자동 감지 규칙

#### 2.1 이미지 타입별 파일명 형식

**골프장 이미지:**
```
{고객명}_s1_{YYYYMMDD}_01.webp
```
- 예: `ahnhuija_s1_20260122_01.webp`
- 감지 기준: 골프장, 골프 코스, 필드, 그린 등 골프장 관련 키워드

**마스골프 이미지 (시타장, 매장, 아트월 등):**
```
{고객명}_s3_{YYYYMMDD}_01.webp
```
- 예: `ahnhuija_s3_20260122_01.webp`
- 감지 기준: 시타장, 매장, 아트월, 피팅, 상담 등 마스골프 매장 관련 키워드

**서류 이미지:**
```
{고객명}_docs_{YYYYMMDD}_01.webp
```
- 예: `ahnhuija_docs_20260122_01.webp`
- 감지 기준: 스캔 문서, 주문서, 설문조사, 동의서 등 문서 관련 키워드

#### 2.2 파일명 규칙

1. **한글 파일명 자동 영문 변환**
   - 한글 파일명은 필수적으로 영문으로 변환
   - `lib/korean-to-english-translator.ts` 사용

2. **중복 파일 처리**
   - 같은 파일명이 존재하면 자동으로 `01`, `02`, `03` 순번 추가
   - 사용자 확인 없이 자동 처리
   - 최대 99까지 지원

3. **업로드 모드 구분 삭제**
   - "파일명 최적화" / "파일명 유지" 옵션 제거
   - 항상 지정된 파일명 규칙으로만 업로드

4. **동영상 파일 처리**
   - 파일명만 최적화 (형식: `{고객명}_s{장면코드}_{YYYYMMDD}_01.{원본확장자}`)
   - 확장자는 원본 유지 (`.mp4`, `.mov`, `.avi`, `.webm` 등)
   - 한글 파일명은 필수적으로 영문으로 변환
   - 순번 자동 추가 (`01`, `02`, `03`)

## 🔍 이미지 타입 자동 감지 로직

### 감지 방식: 이미지 내용 분석 (AI 기반)

**사용 API**: OpenAI Vision API (gpt-4o-mini)
- 현재 프로젝트에서 이미 사용 중 (`/api/admin/image-ai-analyzer.js`)
- 비용: 약 $0.00015 per token (gpt-4o-mini, 매우 저렴)
- 무료 티어: 없음 (유료 API)

**대안 API**:
1. **Google Vision API** (유료, 현재 비활성화됨)
2. **Google AI (Gemini)** (일부 코드에 있음)
3. **Claude Vision API** (Anthropic, 유료)

### 감지 우선순위

1. **서류 이미지 감지** (최우선)
   - **이미지 내용 분석**: 텍스트가 많고, 문서 형태, 표/양식 포함
   - **파일명/경로**: `seukaen`, `scan`, `docs`, `문서`, `주문서`, `설문`, `동의서` 포함
   - **OCR 결과**: 텍스트 추출 결과가 많고 문서 키워드 포함
   - `lib/scanned-document-detector.ts` 활용

2. **골프장 이미지 감지**
   - **이미지 내용 분석**: 골프장 풍경, 그린, 페어웨이, 골프 코스, 야외 골프장
   - **AI 분석 키워드**: `골프장`, `그린`, `페어웨이`, `벙커`, `러프`, `골프 코스`, `야외`, `잔디`, `골프 필드`
   - **파일명/경로**: `golf`, `골프`, `field`, `course`, `green`, `필드`, `코스`, `그린` 포함

3. **마스골프 이미지 감지** (기본값)
   - **이미지 내용 분석**: 실내 시타장, 매장 내부, 아트월, 피팅 장비, 상담 공간
   - **AI 분석 키워드**: `시타장`, `시뮬레이터`, `매장`, `아트월`, `피팅`, `상담`, `실내`, `스크린`
   - **파일명/경로**: `sita`, `시타`, `simulator`, `시뮬레이터`, `store`, `shop`, `매장`, `artwall`, `아트월`, `fitting`, `피팅`, `consultation`, `상담`

### 감지 실패 시 기본값
- 기본값: `s3` (마스골프 이미지로 간주)

## 📝 파일명 형식 상세

### 형식 구조
```
{영문고객명}_{타입코드}_{YYYYMMDD}_{순번}.{확장자}
```

### 구성 요소

1. **영문 고객명**
   - 한글 이름을 영문으로 변환
   - 하이픈, 공백 제거, 소문자 변환
   - 예: `안희자` → `ahnhuija`

2. **타입 코드**
   - `s1`: 골프장 이미지
   - `s3`: 마스골프 이미지 (기본값)
   - `docs`: 서류 이미지

3. **날짜 (YYYYMMDD)**
   - 방문일자 또는 업로드일자
   - 예: `20260122`

4. **순번 (2자리)**
   - 같은 타입, 같은 날짜의 순서
   - 예: `01`, `02`, `03`

5. **확장자**
   - 이미지: `.webp` (항상 WebP로 변환)
   - 동영상: 원본 확장자 유지 (`.mp4`, `.mov`, `.avi`, `.webm`)

## 🔧 구현 계획

### Phase 1: 이미지 타입 자동 감지 함수 구현

**파일**: `lib/customer-image-type-detector.ts` (신규)

**기능**:
- **이미지 내용 분석** (OpenAI Vision API) + 파일명/경로 분석
- 골프장 이미지 (`s1`), 마스골프 이미지 (`s3`), 서류 이미지 (`docs`) 구분

**구현 예시**:
```typescript
export interface ImageTypeDetectionResult {
  type: 'golf-course' | 'masgolf' | 'document';
  typeCode: 's1' | 's3' | 'docs';
  confidence: number;
  detectionMethod: 'ai-analysis' | 'filename' | 'default';
}

/**
 * 이미지 타입 자동 감지 (이미지 내용 분석 + 파일명 분석)
 */
export async function detectCustomerImageType(
  imageUrl: string,
  fileName: string,
  filePath?: string
): Promise<ImageTypeDetectionResult> {
  // 1. 파일명/경로 기반 빠른 감지 (비용 절약)
  const filenameDetection = detectFromFilename(fileName, filePath);
  if (filenameDetection.confidence >= 0.9) {
    return filenameDetection;
  }
  
  // 2. 이미지 내용 분석 (OpenAI Vision API)
  try {
    const aiAnalysis = await analyzeImageContent(imageUrl);
    const aiDetection = detectFromAIAnalysis(aiAnalysis);
    
    // AI 분석 결과가 높은 신뢰도면 사용
    if (aiDetection.confidence >= 0.8) {
      return {
        ...aiDetection,
        detectionMethod: 'ai-analysis'
      };
    }
    
    // 파일명 감지와 AI 분석 결과 결합
    if (filenameDetection.confidence >= 0.7) {
      return filenameDetection;
    }
    
    return aiDetection;
  } catch (error) {
    console.error('이미지 분석 실패, 파일명 기반 감지 사용:', error);
    return filenameDetection;
  }
}

/**
 * 파일명/경로 기반 감지
 */
function detectFromFilename(fileName: string, filePath?: string): ImageTypeDetectionResult {
  const lowerFileName = fileName.toLowerCase();
  const lowerFilePath = filePath?.toLowerCase() || '';
  
  // 서류 이미지 감지
  if (detectScannedDocument(fileName, filePath).isDocument) {
    return {
      type: 'document',
      typeCode: 'docs',
      confidence: 0.9,
      detectionMethod: 'filename'
    };
  }
  
  // 골프장 이미지 감지
  const golfKeywords = ['golf', '골프', 'field', 'course', 'green', '필드', '코스', '그린'];
  if (golfKeywords.some(keyword => 
    lowerFileName.includes(keyword) || lowerFilePath.includes(keyword)
  )) {
    return {
      type: 'golf-course',
      typeCode: 's1',
      confidence: 0.8,
      detectionMethod: 'filename'
    };
  }
  
  // 마스골프 이미지 감지
  const masgolfKeywords = ['sita', '시타', 'simulator', '시뮬레이터', 'store', 'shop', '매장', 'artwall', '아트월', 'fitting', '피팅', 'consultation', '상담'];
  if (masgolfKeywords.some(keyword => 
    lowerFileName.includes(keyword) || lowerFilePath.includes(keyword)
  )) {
    return {
      type: 'masgolf',
      typeCode: 's3',
      confidence: 0.8,
      detectionMethod: 'filename'
    };
  }
  
  // 기본값
  return {
    type: 'masgolf',
    typeCode: 's3',
    confidence: 0.5,
    detectionMethod: 'default'
  };
}

/**
 * OpenAI Vision API로 이미지 내용 분석
 */
async function analyzeImageContent(imageUrl: string): Promise<string> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/image-ai-analyzer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl })
  });
  
  if (!response.ok) {
    throw new Error('이미지 분석 API 호출 실패');
  }
  
  const result = await response.json();
  // AI 분석 결과에서 키워드 추출
  const keywords = result.analysis?.tags?.map((tag: any) => tag.name).join(' ') || '';
  return keywords;
}

/**
 * AI 분석 결과 기반 타입 감지
 */
function detectFromAIAnalysis(aiKeywords: string): ImageTypeDetectionResult {
  const lowerKeywords = aiKeywords.toLowerCase();
  
  // 서류 이미지 키워드
  const documentKeywords = ['문서', '주문서', '설문', '동의서', '양식', '표', '서류', 'scan', 'document', 'form'];
  if (documentKeywords.some(keyword => lowerKeywords.includes(keyword))) {
    return {
      type: 'document',
      typeCode: 'docs',
      confidence: 0.9,
      detectionMethod: 'ai-analysis'
    };
  }
  
  // 골프장 이미지 키워드
  const golfKeywords = ['골프장', '그린', '페어웨이', '벙커', '러프', '골프 코스', '야외', '잔디', '골프 필드', 'golf course', 'green', 'fairway'];
  if (golfKeywords.some(keyword => lowerKeywords.includes(keyword))) {
    return {
      type: 'golf-course',
      typeCode: 's1',
      confidence: 0.85,
      detectionMethod: 'ai-analysis'
    };
  }
  
  // 마스골프 이미지 키워드
  const masgolfKeywords = ['시타장', '시뮬레이터', '매장', '아트월', '피팅', '상담', '실내', '스크린', 'simulator', 'store', 'artwall', 'fitting'];
  if (masgolfKeywords.some(keyword => lowerKeywords.includes(keyword))) {
    return {
      type: 'masgolf',
      typeCode: 's3',
      confidence: 0.85,
      detectionMethod: 'ai-analysis'
    };
  }
  
  // 기본값
  return {
    type: 'masgolf',
    typeCode: 's3',
    confidence: 0.6,
    detectionMethod: 'ai-analysis'
  };
}
```

### Phase 2: 파일명 생성 함수 수정

**파일**: `lib/customer-image-filename-generator.ts`

**수정 내용**:
1. **이미지 내용 분석 통합** (OpenAI Vision API)
2. 날짜 형식 변경: `YYYYMMDD` 형식으로 통일
3. 타입 코드 변경: `s1`, `s3`, `docs` 사용
4. 동영상 확장자 유지 로직 추가

**구현 예시**:
```typescript
export async function generateCustomerImageFileName(
  customer: { name: string; initials?: string; name_en?: string },
  originalFileName: string,
  visitDate: string, // YYYY-MM-DD 형식
  imageUrl?: string, // 업로드된 이미지 URL (이미지 분석용)
  filePath?: string, // 파일 경로
  index?: number
): Promise<{ fileName: string; scene: number; type: string }> {
  // 고객 영문 이름
  const { translateKoreanToEnglish } = require('./korean-to-english-translator');
  const customerNameEn = customer.name_en || translateKoreanToEnglish(customer.name);
  const nameEn = customerNameEn.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // 날짜 형식 변환: YYYY-MM-DD → YYYYMMDD
  const dateStr = visitDate.replace(/-/g, '');
  
  // 이미지 타입 감지 (이미지 내용 분석 + 파일명 분석)
  let detection;
  if (imageUrl) {
    // 이미지 URL이 있으면 이미지 내용 분석
    detection = await detectCustomerImageType(imageUrl, originalFileName, filePath);
  } else {
    // 이미지 URL이 없으면 파일명만으로 감지
    detection = detectFromFilename(originalFileName, filePath);
  }
  const typeCode = detection.typeCode;
  
  // 동영상 여부 확인
  const isVideo = /\.(mp4|mov|avi|webm|mkv)$/i.test(originalFileName);
  const extension = isVideo 
    ? originalFileName.match(/\.[^/.]+$/)?.[0] || '.webp'
    : '.webp';
  
  // 순번 생성
  const sequence = String(index !== undefined ? index : 1).padStart(2, '0');
  
  // 파일명 생성
  const fileName = `${nameEn}_${typeCode}_${dateStr}_${sequence}${extension}`;
  
  // 장면 번호 매핑
  const sceneMap: Record<string, number> = {
    's1': 1,
    's3': 3,
    'docs': 0
  };
  
  return {
    fileName,
    scene: sceneMap[typeCode] || 3,
    type: detection.type
  };
}
```

### Phase 3: UI 개선

#### 3.1 고객 이미지 관리 메인 페이지

**파일**: `pages/admin/customers/index.tsx`

**수정 내용**:
1. "갤러리에서 선택" 옆에 "이미지 업로드" 버튼 추가
2. 하단 드래그앤드롭 영역 유지
3. "업로드 모드" 섹션 제거
4. 하단 버튼: "닫기" → "취소", "저장"

**UI 구조**:
```
[갤러리에서 선택] [이미지 업로드]
[드래그앤드롭 영역]
[취소] [저장]
```

#### 3.2 갤러리에서 이미지 선택 모달

**파일**: `components/admin/FolderImagePicker.tsx`

**수정 내용**:
1. "업로드" 버튼 제거
2. "업로드 모드" 섹션 제거
3. "선택"과 "삭제" 기능만 유지

**UI 구조**:
```
[갤러리에서 이미지 선택]
[이미지 그리드]
[선택] [삭제]
```

### Phase 4: 업로드 로직 수정

**파일**: `pages/admin/customers/index.tsx`

**수정 내용**:
1. 업로드 모드 파라미터 제거
2. **이미지 업로드 후 이미지 내용 분석하여 타입 감지**
3. 항상 자동 감지된 파일명 규칙 사용
4. 중복 파일 자동 순번 추가

**구현 예시**:
```typescript
const handleImageUpload = async (file: File) => {
  // 1. 먼저 임시 파일명으로 업로드 (이미지 URL 확보)
  const tempFileName = `${Date.now()}_${file.name}`;
  const uploadResult = await uploadImageToSupabase(file, {
    targetFolder: `${getCustomerFolderPath()}/${visitDate}`,
    customFileName: tempFileName,
    uploadMode: 'preserve-filename'
  });
  
  // 2. 업로드된 이미지 URL로 이미지 내용 분석 및 타입 감지
  const detection = await detectCustomerImageType(
    uploadResult.url,
    file.name,
    `${getCustomerFolderPath()}/${visitDate}`
  );
  
  // 3. 감지된 타입으로 최종 파일명 생성
  let finalFileName;
  let sequence = 1;
  
  while (true) {
    const fileNameInfo = await generateCustomerImageFileName(
      customer,
      file.name,
      visitDate,
      uploadResult.url, // 이미지 URL 전달
      `${getCustomerFolderPath()}/${visitDate}`,
      sequence
    );
    
    finalFileName = fileNameInfo.fileName;
    
    // 중복 파일 확인
    if (!(await checkFileExists(finalFileName))) {
      break; // 사용 가능한 파일명 찾음
    }
    
    sequence++;
    if (sequence > 99) {
      throw new Error('파일명 순번이 최대치에 도달했습니다.');
    }
  }
  
  // 4. 임시 파일을 최종 파일명으로 이동/이름 변경
  if (tempFileName !== finalFileName) {
    await renameFileInStorage(
      `${getCustomerFolderPath()}/${visitDate}/${tempFileName}`,
      `${getCustomerFolderPath()}/${visitDate}/${finalFileName}`
    );
  }
  
  // 5. 메타데이터 저장
  // ...
};
```

## 📂 파일 구조

### 수정할 파일

1. **`lib/customer-image-type-detector.ts`** (신규)
   - 이미지 타입 자동 감지 함수

2. **`lib/customer-image-filename-generator.ts`** (수정)
   - 파일명 생성 로직 수정
   - 날짜 형식 변경
   - 타입 코드 변경

3. **`pages/admin/customers/index.tsx`** (수정)
   - UI 개선 (버튼 추가, 업로드 모드 제거)
   - 업로드 로직 수정

4. **`components/admin/FolderImagePicker.tsx`** (수정)
   - 갤러리 모달에서 업로드 관련 UI 제거

### 참고 파일

- `lib/scanned-document-detector.ts` - 서류 감지 로직
- `lib/korean-to-english-translator.ts` - 한글 영문 변환
- `lib/image-upload-utils.ts` - 업로드 유틸리티

## ✅ 체크리스트

### Phase 1: 이미지 타입 감지
- [ ] `lib/customer-image-type-detector.ts` 생성
- [ ] OpenAI Vision API 통합 (이미지 내용 분석)
- [ ] 파일명/경로 기반 빠른 감지 로직 구현
- [ ] AI 분석 결과 기반 타입 감지 로직 구현
- [ ] 골프장 이미지 감지 로직 구현
- [ ] 마스골프 이미지 감지 로직 구현
- [ ] 서류 이미지 감지 로직 통합

### Phase 2: 파일명 생성
- [ ] `generateCustomerImageFileName` 함수 수정
- [ ] 날짜 형식 `YYYYMMDD`로 변경
- [ ] 타입 코드 `s1`, `s3`, `docs` 적용
- [ ] 동영상 확장자 유지 로직 추가
- [ ] 중복 파일 순번 자동 증가 로직 추가

### Phase 3: UI 개선
- [ ] "이미지 업로드" 버튼 추가
- [ ] "업로드 모드" 섹션 제거
- [ ] 하단 버튼 "취소", "저장"으로 변경
- [ ] 갤러리 모달에서 업로드 관련 UI 제거

### Phase 4: 업로드 로직
- [ ] 업로드 모드 파라미터 제거
- [ ] 자동 감지 파일명 규칙 적용
- [ ] 중복 파일 자동 순번 추가
- [ ] 한글 파일명 자동 영문 변환

## 🔄 변경 이력

### 2026-01-27: 최종 계획 업데이트
- **이미지 내용 분석 추가**: OpenAI Vision API를 사용한 이미지 타입 자동 감지
- 파일명 기반 감지와 이미지 내용 분석 결합
- 업로드 후 이미지 분석 → 타입 감지 → 파일명 생성 플로우로 변경

### 2026-01-27: 초안 작성
- 이미지 타입 자동 감지 규칙 정의
- 파일명 형식 변경 (`s1`, `s3`, `docs`)
- 날짜 형식 통일 (`YYYYMMDD`)
- UI 개선 사항 정의

## 💰 비용 정보

### OpenAI Vision API (gpt-4o-mini)
- **입력 비용**: $0.15 per 1M tokens
- **출력 비용**: $0.60 per 1M tokens
- **예상 비용**: 이미지당 약 $0.0001 ~ $0.0003 (매우 저렴)
- **무료 티어**: 없음 (유료 API)

### 대안 API 옵션
1. **Google Vision API** (유료, 현재 비활성화됨)
2. **Google AI (Gemini)** (유료, 일부 코드에 있음)
3. **Claude Vision API** (Anthropic, 유료)

**권장**: OpenAI Vision API (gpt-4o-mini) - 현재 프로젝트에서 이미 사용 중이고 비용이 저렴함
