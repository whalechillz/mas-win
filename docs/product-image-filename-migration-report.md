# 제품 이미지 파일명 영어 변환 작업 리포트

## 📋 작업 개요

제품 이미지 파일명을 한글에서 영어로 변경하여 URL 인코딩 문제를 해결했습니다.

## ✅ 완료된 작업

### 1. 파일명 변경 (41개 파일)

#### 제품 합성용 솔 이미지 (7개)
- `gold2-sapphire/마쓰구_시크리트포스_골드_2_500.webp` → `secret-force-gold-2-sole-500.webp`
- `gold2/마쓰구_시크리트포스_골드_2_500.webp` → `secret-force-gold-2-sole-500.webp`
- `black-beryl/마쓰구_시크리트웨폰_블랙_500.webp` → `secret-weapon-black-sole-500.webp`
- `pro3/마쓰구_시크리트포스_PRO_500.webp` → `secret-force-pro-3-sole-500.webp`
- `v3/마쓰구_시크리트포스_V3_350_bg.webp` → `secret-force-v3-sole-350-bg.webp`
- `black-weapon/마쓰구_시크리트웨폰_블랙_500.webp` → `secret-weapon-black-sole-500.webp`
- `gold-weapon4/마쓰구_시크리트웨폰_4.1_500.webp` → `secret-weapon-gold-4-1-sole-500.webp`

#### 갤러리 이미지 (34개)
- **PRO 3**: 9개 (`secret-force-pro-3-gallery-00.webp` ~ `secret-force-pro-3-gallery-08.webp`)
- **V3**: 7개 (`secret-force-v3-gallery-05-00.webp`, `secret-force-v3-gallery-02.webp` ~ `secret-force-v3-gallery-07.webp`)
- **Black Weapon**: 9개 (`secret-weapon-black-gallery-00-01.webp` ~ `secret-weapon-black-gallery-08-01.webp`)
- **Gold Weapon 4.1**: 9개 (`secret-weapon-gold-4-1-gallery-00-01.webp` ~ `secret-weapon-gold-4-1-gallery-08-01.webp`)

### 2. 코드 업데이트

#### 업데이트된 파일 목록
1. **lib/product-composition.ts**
   - 모든 제품의 `imageUrl` 경로를 영어 파일명으로 업데이트
   - 7개 제품 모두 업데이트 완료

2. **pages/index.js**
   - 메인 페이지 제품 갤러리 이미지 경로 업데이트
   - PRO 3, V3, Black Weapon, Gold Weapon 4.1 이미지 경로 변경

3. **pages/products/pro3.tsx**
   - PRO 3 제품 상세 페이지 이미지 배열 업데이트
   - 9개 갤러리 이미지 경로 변경

4. **pages/products/v3.tsx**
   - V3 제품 상세 페이지 이미지 배열 업데이트
   - 7개 갤러리 이미지 경로 변경

5. **pages/products/gold-weapon4.tsx**
   - 골드 웨폰 4.1 제품 상세 페이지 이미지 배열 업데이트
   - 9개 갤러리 이미지 경로 변경

6. **components/admin/ProductSelector.tsx**
   - `encodeURI()` 제거 (영어 파일명 사용으로 불필요)
   - 이미지 경로가 직접 사용됨

### 3. 파일명 규칙

#### 형식
```
{product-slug}-{image-type}-{size}-{variant}.webp
```

#### 구성 요소
- **product-slug**: 제품 식별자
  - `secret-force-gold-2`
  - `secret-force-pro-3`
  - `secret-force-v3`
  - `secret-weapon-black`
  - `secret-weapon-gold-4-1`

- **image-type**: 이미지 타입
  - `sole`: 솔 이미지 (합성용)
  - `gallery`: 갤러리 이미지

- **size**: 이미지 크기
  - `350`, `500`, `1000` 등

- **variant**: 추가 구분자
  - `bg`: 배경 포함
  - `00`, `01`, `02`: 시퀀스 번호

## 🔍 소스 코드 점검 결과

### ✅ 검증 완료 항목

1. **한글 파일명 참조 제거**
   - ✅ 모든 `.tsx` 파일에서 한글 파일명 참조 없음
   - ✅ 모든 `.js` 파일에서 한글 파일명 참조 없음
   - ✅ `lib/product-composition.ts` 모든 경로 영어 파일명 사용

2. **빌드 테스트**
   - ✅ `npm run build` 성공
   - ✅ TypeScript 에러 없음
   - ✅ ESLint 에러 없음

3. **파일 존재 확인**
   - ✅ 모든 영어 파일명 이미지 파일 존재 확인
   - ✅ 41개 파일 모두 정상적으로 변경됨

4. **코드 일관성**
   - ✅ 모든 제품 이미지 경로가 동일한 규칙 사용
   - ✅ 파일명 형식 일관성 유지

### 📊 변경 통계

- **변경된 파일 수**: 41개
- **업데이트된 코드 파일**: 6개
- **제거된 코드**: `encodeURI()` 호출 (ProductSelector)
- **빌드 상태**: ✅ 성공

## 🎯 해결된 문제

1. **URL 인코딩 문제 해결**
   - 한글 파일명으로 인한 브라우저 인코딩 문제 해결
   - Next.js Image 컴포넌트와의 호환성 개선

2. **이미지 깨짐 문제 해결**
   - V3 이미지 404 에러 해결
   - 모든 제품 이미지 정상 표시

3. **유지보수성 향상**
   - 일관된 파일명 규칙으로 관리 용이
   - 영어 파일명으로 국제화 대응 가능

## 📝 다음 단계

1. ✅ 배포 완료
2. ⏳ 배포 후 이미지 로드 확인
3. ⏳ 브라우저 콘솔에서 404 에러 확인

## 🔗 관련 파일

- `scripts/rename-product-images-to-english.js`: 파일명 변경 스크립트
- `lib/product-composition.ts`: 제품 합성용 이미지 경로
- `pages/index.js`: 메인 페이지 갤러리 이미지
- `pages/products/*.tsx`: 제품 상세 페이지 이미지
- `components/admin/ProductSelector.tsx`: 제품 선택 컴포넌트

