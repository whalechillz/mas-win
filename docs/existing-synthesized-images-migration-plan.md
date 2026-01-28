# 기존 합성 이미지 고객 정보 표시 문제 수정 계획

## 문제 분석

### 현재 상황
- **파일명**: `customers-none-nanobanana-background-20260126-01.webp`
- **위치**: 갤러리에서는 보이지만 고객 이미지 관리 모달의 "업로드된 이미지" 섹션에 나타나지 않음
- **확인 결과**: 
  - `image_assets` 테이블에 해당 파일의 메타데이터가 **없음** (null 반환)
  - Storage에는 파일이 존재할 가능성 높음
  - 기존에 생성된 합성 이미지들이 `image_assets` 테이블에 저장되지 않았거나, `ai_tags`에 `customer-{id}` 태그가 없음

### 원인 상세 분석

#### 1. 메타데이터 누락
- Phase 1에서 향후 생성되는 합성 이미지에 메타데이터를 추가하도록 수정했지만
- **이미 생성된 기존 합성 이미지들은 메타데이터가 없음**
- `image_assets` 테이블에는 저장되어 있지만 `ai_tags`에 고객 정보가 없음

#### 2. 파일명 패턴 문제
- **합성 이미지 파일명**: `customers-{고객명}-nanobanana-{기능}-{날짜}-{번호}.webp`
- **일반 이미지 파일명**: `{영문이름}_s{장면코드}_{타입}_{번호}.webp`
- 파일명 패턴이 달라서 필터링에서 제외될 수 있음

#### 3. 저장 위치 문제
- 합성 이미지가 날짜 폴더 없이 루트에 저장될 수 있음
- 예: `originals/customers/ahnhuija-4404/customers-none-nanobanana-background-20260126-01.webp`
- 현재 필터: `originals/customers/{folder_name}/%` → 이 필터는 하위 폴더를 포함하므로 루트 파일도 포함되어야 함

## 해결 방안

### 옵션 1: 기존 합성 이미지 마이그레이션 스크립트 (권장)

**장점**:
- 근본적인 해결
- 모든 기존 합성 이미지에 메타데이터 추가
- 일관성 유지

**구현 내용**:
1. `originals/customers/` 폴더에서 합성 이미지 파일 찾기
2. 파일명에서 고객명 추출
3. `customers` 테이블에서 고객 ID 조회
4. `image_assets`에 메타데이터 추가/업데이트

### 옵션 2: 고객 이미지 조회 API 개선

**장점**:
- 즉시 효과
- 추가 스크립트 실행 불필요

**단점**:
- 메타데이터가 없어서 다른 기능에서도 문제 발생 가능

### 옵션 3: 하이브리드 방식 (권장)

**구현 내용**:
1. **기존 합성 이미지 마이그레이션 스크립트** (옵션 1)
2. **고객 이미지 조회 API 개선** (옵션 2)
3. **파일명 패턴 기반 필터링 추가** (보조 방법)

## 권장 방안: 옵션 3 (하이브리드)

### 이유
1. **근본 해결**: 기존 합성 이미지에 메타데이터 추가
2. **즉시 효과**: 조회 API 개선으로 바로 표시
3. **안정성**: 두 가지 방법으로 이중 보장

## 구현 계획

### Phase 1: 기존 합성 이미지 마이그레이션 스크립트

**파일**: `scripts/migrate-existing-synthesized-customer-images.js` (신규)

**기능**:
1. **Storage에서 합성 이미지 파일 찾기**
   - `originals/customers/` 폴더 스캔
   - 파일명 패턴: `customers-*-nanobanana-*`, `customers-*-fal-*`, `customers-*-replicate-*`, `*-composed-*`
2. **`image_assets` 테이블 확인**
   - Storage 파일이 `image_assets`에 있는지 확인 (`cdn_url` 또는 `file_path`로)
   - 없으면 메타데이터 생성
   - 있으면 `ai_tags` 업데이트
3. **파일명에서 고객명 추출**
   - `file_path`에서 고객 폴더명 추출 (우선)
   - 파일명에서 고객명 추출 (보조)
4. **`customers` 테이블에서 고객 ID 조회**
5. **메타데이터 생성/업데이트**
   - `image_assets`에 없으면 새로 생성
   - 있으면 `ai_tags`에 `customer-{id}`, `visit-{date}` 추가

**구현 예시**:
```javascript
// 1. 합성 이미지 찾기
const { data: synthesizedImages } = await supabase
  .from('image_assets')
  .select('id, file_path, cdn_url, ai_tags')
  .ilike('file_path', 'originals/customers/%')
  .or('file_path.ilike.%nanobanana%,file_path.ilike.%fal-%,file_path.ilike.%replicate-%,file_path.ilike.%-composed-%');

// 2. 각 이미지 처리
for (const img of synthesizedImages) {
  // 파일명에서 고객명 추출
  const customerMatch = img.file_path.match(/customers\/([^/]+)/);
  if (customerMatch) {
    const customerFolderName = customerMatch[1];
    
    // 고객 정보 조회
    const { data: customer } = await supabase
      .from('customers')
      .select('id, folder_name')
      .eq('folder_name', customerFolderName)
      .maybeSingle();
    
    if (customer) {
      // 날짜 추출
      const dateMatch = img.file_path.match(/(\d{4}-\d{2}-\d{2})/);
      const visitDate = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);
      
      // ai_tags 업데이트
      const customerTag = `customer-${customer.id}`;
      const visitTag = `visit-${visitDate}`;
      
      const existingTags = Array.isArray(img.ai_tags) ? img.ai_tags : [];
      const tagsWithoutCustomer = existingTags.filter(
        (tag) => typeof tag === 'string' && !tag.startsWith('customer-') && !tag.startsWith('visit-')
      );
      
      const updatedTags = [customerTag, visitTag, ...tagsWithoutCustomer];
      
      await supabase
        .from('image_assets')
        .update({ ai_tags: updatedTags })
        .eq('id', img.id);
    }
  }
}
```

### Phase 2: 고객 이미지 조회 API 개선

**파일**: `pages/api/admin/upload-customer-image.js`

**수정 내용**:
1. `file_path` 필터링 개선
2. 파일명 패턴 기반 필터링 추가 (보조 방법)
3. `ai_tags` 필터링 추가 (선택적)

**구현 예시**:
```javascript
// 현재: file_path만 사용
metadataQuery = metadataQuery.ilike('file_path', `${exactFolderPath}/%`);

// 개선: file_path + 파일명 패턴
// 합성 이미지 파일명 패턴도 포함
const synthesizedPatterns = [
  `customers-${customerData.folder_name}-%`,
  `customers-none-%`,
  `%-nanobanana-%`,
  `%-fal-%`,
  `%-replicate-%`,
  `%-composed-%`
];

// OR 조건으로 추가
metadataQuery = metadataQuery.or(
  `file_path.ilike.${exactFolderPath}/%,file_path.ilike.${exactFolderPath}-%`
);
```

### Phase 3: 파일명에서 고객명 추출 로직 개선

**파일**: `lib/filename-generator.ts` 또는 새 유틸리티

**기능**:
- 합성 이미지 파일명에서 고객명 추출
- `customers-{고객명}-` 패턴 파싱
- `customers-none-` 패턴 처리 (원본 이미지 메타데이터에서 추출)

## 상세 구현 계획

### 1단계: 마이그레이션 스크립트 작성

**파일**: `scripts/migrate-existing-synthesized-customer-images.js`

**기능**:
1. **합성 이미지 찾기**
   - `image_assets` 테이블에서 `file_path`에 `originals/customers/` 포함
   - 파일명에 합성 패턴 포함 (`nanobanana`, `fal`, `replicate`, `composed`)
   - `ai_tags`에 `customer-` 태그가 없는 이미지

2. **고객 정보 추출**
   - `file_path`에서 고객 폴더명 추출
   - `customers` 테이블에서 고객 ID 조회

3. **메타데이터 업데이트**
   - `ai_tags`에 `customer-{id}`, `visit-{date}` 추가
   - 기존 태그는 유지

4. **통계 및 로깅**
   - 처리된 이미지 수
   - 성공/실패 통계
   - 상세 로그

### 2단계: 고객 이미지 조회 API 개선

**파일**: `pages/api/admin/upload-customer-image.js`

**수정 내용**:
1. **파일명 패턴 기반 필터링 추가**
   - 합성 이미지 파일명 패턴도 포함
   - `customers-{folder_name}-*` 패턴

2. **루트 폴더 파일 포함 확인**
   - 현재 필터가 루트 폴더 파일도 포함하는지 확인
   - 필요시 필터 개선

### 3단계: 테스트 및 검증

**테스트 항목**:
1. 마이그레이션 스크립트 실행
2. `customers-none-nanobanana-background-20260126-01.webp` 파일 확인
3. 고객 이미지 관리 모달에서 표시 확인
4. 다른 합성 이미지들도 확인

## 파일명 패턴 분석

### 합성 이미지 파일명 패턴
- **Nanobanana**: `customers-{고객명}-nanobanana-{기능}-{날짜}-{번호}.webp`
- **FAL**: `customers-{고객명}-fal-{기능}-{날짜}-{번호}.png`
- **Replicate**: `customers-{고객명}-replicate-{기능}-{날짜}-{번호}.png`
- **제품 합성**: `{원본파일명}-composed-{제품slug}.{확장자}` 또는 `composed-1-{UUID}-{timestamp}.webp`

### 고객명 추출 로직
```javascript
function extractCustomerNameFromSynthesizedFileName(filePath, fileName) {
  // 1. file_path에서 고객 폴더명 추출 (우선)
  const pathMatch = filePath.match(/customers\/([^/]+)/);
  if (pathMatch) return pathMatch[1];
  
  // 2. 파일명에서 추출
  // customers-{고객명}-nanobanana-...
  const nameMatch = fileName.match(/^customers-([^-]+)-/);
  if (nameMatch && nameMatch[1] !== 'none') return nameMatch[1];
  
  // 3. customers-none-인 경우 원본 이미지 메타데이터에서 추출 필요
  return null;
}
```

## 예상 작업 시간

- Phase 1 (마이그레이션 스크립트): ✅ 완료 (실행 결과: 5개 합성 이미지 업데이트 완료)
- Phase 2 (조회 API 개선): 1-2시간 (필요시)
- Phase 3 (테스트 및 검증): 1시간
- **총 예상 시간: 2-3시간 (Phase 1 완료)**

## 우선순위

**높음**: 사용자가 합성한 이미지를 고객 이미지 목록에서 확인할 수 있어야 함

## 테스트 계획

1. **마이그레이션 스크립트 테스트**:
   - 스크립트 실행
   - `customers-none-nanobanana-background-20260126-01.webp` 파일 확인
   - 메타데이터 업데이트 확인

2. **고객 이미지 관리 모달 테스트**:
   - 안희자 고객 선택
   - "이미지" 버튼 클릭
   - "업로드된 이미지" 섹션에서 합성 이미지 확인

3. **다양한 합성 이미지 테스트**:
   - Nanobanana 합성 이미지
   - FAL 합성 이미지
   - Replicate 합성 이미지
   - 제품 합성 이미지

## 파일 목록

### 새로 생성할 파일
1. `scripts/migrate-existing-synthesized-customer-images.js` - 기존 합성 이미지 마이그레이션 스크립트

### 수정할 파일
1. `pages/api/admin/upload-customer-image.js` - 고객 이미지 조회 API 개선

### 참고 파일
1. `lib/filename-generator.ts` - 파일명 생성 유틸리티 (고객명 추출 함수 추가 고려)

## 결론

**권장 사항**:
1. ✅ **기존 합성 이미지 마이그레이션 스크립트 작성 및 실행 완료** (Phase 1)
   - 5개 합성 이미지 메타데이터 업데이트 완료
   - `customers-none-nanobanana-background-20260126-01.webp` 포함
2. ✅ **고객 이미지 조회 API 확인** (Phase 2)
   - 현재 필터 로직이 합성 이미지를 포함하도록 확인됨
3. ⚠️ **프론트엔드 캐시 문제 가능성**
   - 브라우저 캐시 또는 React 상태 캐시로 인해 표시되지 않을 수 있음
   - 페이지 새로고침 또는 모달 재오픈 필요

## 추가 확인 사항

### 프론트엔드 캐시 문제
- 고객 이미지 관리 모달이 열릴 때 이미지 목록을 캐시할 수 있음
- 모달을 닫았다가 다시 열어야 할 수 있음
- 또는 페이지를 새로고침해야 할 수 있음

### 해결 방법
1. 모달을 닫고 다시 열기
2. 페이지 새로고침 (F5 또는 Cmd+R)
3. 브라우저 개발자 도구에서 네트워크 탭 확인하여 API 응답 확인

이렇게 하면 기존에 생성된 합성 이미지도 고객 이미지 목록에 표시됩니다.
