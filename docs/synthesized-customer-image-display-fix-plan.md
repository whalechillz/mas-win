# 합성 고객 이미지 표시 문제 수정 계획

## 문제 분석

### 현재 상황
- **합성 이미지 생성**: Nanobanana, FAL, Replicate, 제품 합성 등으로 고객 이미지를 합성
- **저장 위치**: `originals/customers/{고객명}/` 또는 `originals/customers/{고객명}/{날짜}/`
- **표시 문제**: 고객 이미지 관리 모달의 "업로드된 이미지" 섹션에 나타나지 않음

### 원인 분석

#### 1. 파일 경로 문제
- **합성 이미지 저장 경로**: 
  - Nanobanana: `originals/customers/{고객명}/customers-{고객명}-nanobanana-{기능}-{날짜}-{번호}.webp`
  - 날짜 폴더 없이 루트에 저장될 수 있음
- **고객 이미지 조회 필터**: 
  - `file_path`로 필터링: `originals/customers/{folder_name}/%`
  - 이 필터는 하위 폴더를 포함하지만, 루트 폴더의 파일도 포함되어야 함
  - **문제**: 날짜 폴더가 없는 경우 필터링 로직이 제대로 작동하지 않을 수 있음

#### 2. 메타데이터 문제
- **`ai_tags` 누락**: 합성 이미지 저장 시 `customer-{id}` 태그가 없을 수 있음
- **`image_assets` 저장**: 합성 이미지가 `image_assets` 테이블에 저장되지 않았을 수 있음
- **고객 정보 연결**: 고객 ID와 연결되지 않았을 수 있음

#### 3. 파일명 패턴 문제
- **합성 이미지 파일명**: `customers-{고객명}-nanobanana-{기능}-{날짜}-{번호}.webp`
- **일반 이미지 파일명**: `{영문이름}_s{장면코드}_{타입}_{번호}.webp`
- 파일명 패턴이 달라서 필터링에서 제외될 수 있음

## 해결 방안

### 옵션 1: 합성 이미지 저장 시 메타데이터 자동 추가 (권장)

**장점**:
- 근본적인 해결
- 모든 합성 이미지가 자동으로 고객 이미지 목록에 포함됨
- 일관성 유지

**구현 내용**:
1. 합성 이미지 저장 시 고객 정보 자동 감지
2. `image_assets` 테이블에 저장 시 `ai_tags`에 `customer-{id}` 추가
3. `file_path`에 날짜 폴더 포함 (가능한 경우)

### 옵션 2: 고객 이미지 조회 API 수정

**장점**:
- 기존 합성 이미지도 즉시 표시됨
- 추가 저장 로직 불필요

**단점**:
- 파일명 패턴 의존
- 향후 합성 이미지도 메타데이터 필요

### 옵션 3: 하이브리드 방식 (권장)

**구현 내용**:
1. **합성 이미지 저장 시 메타데이터 자동 추가** (옵션 1)
2. **고객 이미지 조회 API 개선** (옵션 2)
3. **기존 합성 이미지 마이그레이션 스크립트** (선택)

## 권장 방안: 옵션 3 (하이브리드)

### 이유
1. **근본 해결**: 향후 합성 이미지는 자동으로 포함됨
2. **기존 데이터 처리**: 이미 생성된 합성 이미지도 표시됨
3. **안정성**: 두 가지 방법으로 이중 보장

## 구현 계획

### Phase 1: 합성 이미지 저장 시 메타데이터 자동 추가

#### 1-1. Nanobanana 변형 API 수정

**파일**: `pages/api/vary-nanobanana.js`

**수정 내용**:
1. 고객 폴더 감지 시 고객 정보 조회
2. `image_assets` 저장 시 `ai_tags`에 `customer-{id}` 추가
3. 날짜 폴더가 있으면 `file_path`에 포함

**구현 예시**:
```javascript
// 고객 폴더인 경우 고객 정보 조회
if (location === 'customers' && productName !== 'none') {
  const { data: customer } = await supabase
    .from('customers')
    .select('id, folder_name')
    .eq('folder_name', productName)
    .maybeSingle();
  
  if (customer) {
    // ai_tags에 customer-{id} 추가
    const customerTag = `customer-${customer.id}`;
    // 날짜 추출 (file_path에서 또는 현재 날짜)
    const visitDate = extractDateFromPath(objectPath) || new Date().toISOString().slice(0, 10);
    const visitTag = `visit-${visitDate}`;
    
    // image_assets 저장 시 ai_tags 포함
    metadata.ai_tags = [customerTag, visitTag, ...(metadata.ai_tags || [])];
  }
}
```

#### 1-2. FAL 변형 API 수정

**파일**: `pages/api/vary-existing-image.js`

**수정 내용**: Nanobanana와 동일한 로직 적용

#### 1-3. Replicate 변형 API 수정

**파일**: `pages/api/generate-blog-image-replicate-flux.js`

**수정 내용**: Nanobanana와 동일한 로직 적용

#### 1-4. 제품 합성 API 수정

**파일**: `pages/api/compose-product-image.js`

**수정 내용**: 
- 고객 이미지에서 합성한 경우 고객 정보 감지
- `image_assets` 저장 시 고객 태그 추가

### Phase 2: 고객 이미지 조회 API 개선

**파일**: `pages/api/admin/upload-customer-image.js`

**수정 내용**:
1. 날짜 폴더가 없는 파일도 포함하도록 필터 개선
2. 파일명 패턴으로 합성 이미지 감지 (보조 방법)

**구현 예시**:
```javascript
// file_path 필터링 개선
// originals/customers/{folder_name}/ 로 시작하는 모든 파일 포함
// 날짜 폴더 유무와 관계없이 포함
metadataQuery = metadataQuery.ilike('file_path', `${exactFolderPath}/%`)
  .or(`file_path.ilike.${exactFolderPath}/%,file_path.eq.${exactFolderPath}/%`);

// 또는 더 간단하게:
metadataQuery = metadataQuery.or(`file_path.ilike.${exactFolderPath}/%,file_path.ilike.${exactFolderPath}-%`);
```

### Phase 3: 기존 합성 이미지 마이그레이션 (선택)

**파일**: `scripts/migrate-synthesized-customer-images.js` (신규)

**기능**:
1. `originals/customers/` 폴더에서 합성 이미지 파일 찾기
2. 파일명에서 고객명 추출
3. `customers` 테이블에서 고객 ID 조회
4. `image_assets`에 메타데이터 추가/업데이트

## 상세 구현 계획

### 1단계: 합성 이미지 저장 로직 수정

#### Nanobanana API 수정

**위치**: `pages/api/vary-nanobanana.js`

**변경 사항**:
1. `saveImageToSupabase` 함수에서 고객 정보 감지
2. 고객 폴더인 경우 `customers` 테이블 조회
3. `image_assets` 저장 시 `ai_tags`에 고객 정보 추가

**코드 위치**: 
- `saveImageToSupabase` 함수 내부
- `image_assets` upsert 전에 고객 정보 추가

#### FAL/Replicate API 수정

**위치**: 
- `pages/api/vary-existing-image.js`
- `pages/api/generate-blog-image-replicate-flux.js`

**변경 사항**: Nanobanana와 동일한 로직 적용

#### 제품 합성 API 수정

**위치**: `pages/api/compose-product-image.js`

**변경 사항**:
- 원본 이미지가 고객 이미지인 경우 감지
- 합성 이미지도 고객 정보 포함하여 저장

### 2단계: 고객 이미지 조회 API 개선

**위치**: `pages/api/admin/upload-customer-image.js`

**변경 사항**:
1. `file_path` 필터링 로직 개선
2. 날짜 폴더 유무와 관계없이 모든 하위 파일 포함
3. 루트 폴더의 파일도 포함

**현재 코드**:
```javascript
metadataQuery = metadataQuery.ilike('file_path', `${exactFolderPath}/%`);
```

**개선 코드**:
```javascript
// 날짜 폴더가 있는 경우와 없는 경우 모두 포함
// originals/customers/{folder_name}/ 로 시작하는 모든 파일
metadataQuery = metadataQuery.or(
  `file_path.ilike.${exactFolderPath}/%,file_path.ilike.${exactFolderPath}-%`
);
```

### 3단계: 기존 합성 이미지 마이그레이션 스크립트 (선택)

**파일**: `scripts/migrate-synthesized-customer-images.js` (신규)

**기능**:
1. Storage에서 `originals/customers/` 폴더 스캔
2. 합성 이미지 파일명 패턴 감지:
   - `customers-*-nanobanana-*`
   - `customers-*-fal-*`
   - `customers-*-replicate-*`
   - `*-composed-*` (제품 합성)
3. 파일명에서 고객명 추출
4. `customers` 테이블에서 고객 ID 조회
5. `image_assets`에 메타데이터 추가/업데이트

## 파일명 패턴 분석

### 합성 이미지 파일명 패턴
- **Nanobanana**: `customers-{고객명}-nanobanana-{기능}-{날짜}-{번호}.webp`
- **FAL**: `customers-{고객명}-fal-{기능}-{날짜}-{번호}.png`
- **Replicate**: `customers-{고객명}-replicate-{기능}-{날짜}-{번호}.png`
- **제품 합성**: `{원본파일명}-composed-{제품slug}.{확장자}` 또는 `composed-1-{UUID}-{timestamp}.webp`

### 고객명 추출 로직
```javascript
function extractCustomerNameFromSynthesizedFileName(fileName) {
  // Nanobanana/FAL/Replicate 패턴
  const match1 = fileName.match(/^customers-([^-]+)-/);
  if (match1) return match1[1];
  
  // 제품 합성 패턴 (원본 파일명에서 추출)
  // 원본이 고객 이미지인 경우 file_path에서 추출
  return null;
}
```

## 예상 작업 시간

- Phase 1 (합성 이미지 저장 로직 수정): 2-3시간
  - Nanobanana API: 30분
  - FAL API: 30분
  - Replicate API: 30분
  - 제품 합성 API: 1시간
- Phase 2 (조회 API 개선): 1시간
- Phase 3 (마이그레이션 스크립트): 1-2시간
- **총 예상 시간: 4-6시간**

## 우선순위

**높음**: 사용자가 합성한 이미지를 고객 이미지 목록에서 확인할 수 있어야 함

## 테스트 계획

1. **합성 이미지 생성 테스트**:
   - Nanobanana로 고객 이미지 변형
   - 고객 이미지 관리 모달에서 확인
   - "업로드된 이미지" 섹션에 표시되는지 확인

2. **기존 합성 이미지 테스트**:
   - 이미 생성된 합성 이미지가 표시되는지 확인
   - 마이그레이션 스크립트 실행 후 확인

3. **다양한 합성 방식 테스트**:
   - Nanobanana (톤, 배경, 오브젝트)
   - FAL 변형
   - Replicate 변형
   - 제품 합성

## 파일 목록

### 수정할 파일
1. `pages/api/vary-nanobanana.js` - Nanobanana 변형 API
2. `pages/api/vary-existing-image.js` - FAL 변형 API
3. `pages/api/generate-blog-image-replicate-flux.js` - Replicate 변형 API
4. `pages/api/compose-product-image.js` - 제품 합성 API
5. `pages/api/admin/upload-customer-image.js` - 고객 이미지 조회 API

### 새로 생성할 파일 (선택)
1. `scripts/migrate-synthesized-customer-images.js` - 기존 합성 이미지 마이그레이션

## 결론

**권장 사항**:
1. ✅ **합성 이미지 저장 시 메타데이터 자동 추가** (Phase 1)
2. ✅ **고객 이미지 조회 API 개선** (Phase 2)
3. ⚠️ **기존 합성 이미지 마이그레이션** (Phase 3, 선택)

이렇게 하면 향후 생성되는 합성 이미지는 자동으로 표시되고, 기존 합성 이미지도 조회 API 개선으로 표시됩니다.
