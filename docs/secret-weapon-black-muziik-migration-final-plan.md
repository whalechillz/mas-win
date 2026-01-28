# 시크리트웨폰 블랙 MUZIIK 제품 페이지 마이그레이션 최종 계획서

## 📋 개요

**작업 일자**: 2026-01-27  
**대상 제품**: `secret-weapon-black-muziik`  
**참고 사이트**: `https://www.mas9golf.com/secret-weapon-black-muz`  
**대상 페이지**: `https://www.masgolf.co.kr/products/secret-weapon-black-muziik`

---

## ✅ 완료된 작업

### 1. 데이터베이스 스키마 확장 ✅
- ✅ `hero_images`, `hook_images`, `hook_content`, `detail_content` 필드 추가
- ✅ SQL 쿼리 실행 완료

### 2. Hook 이미지 등록 ✅
- ✅ Hook 이미지 2개 등록 완료
- ✅ Hook 콘텐츠 (제목/설명) 입력 완료

### 3. 코드 구현 완료 ✅
- ✅ 제품 페이지 구조 개선 (Hook 섹션, CTA 섹션, Detail 섹션 추가)
- ✅ 관리 페이지 탭 UI 추가 (Detail, Hero, Hook, Performance)
- ✅ Hero/Hook 업로드 버튼 추가
- ✅ 텍스트 편집 기능 구현

---

## 🔄 진행 중: Detail → Hero 마이그레이션

### 목표
현재 `detail_images`에 있는 이미지들을 `hero_images`로 이동하여 제품 히어로 섹션에서 사용할 수 있도록 합니다.

### 마이그레이션 스크립트
**파일**: `scripts/migrate-detail-to-hero-secret-weapon-black-muziik.js`

**실행 방법**:
```bash
node scripts/migrate-detail-to-hero-secret-weapon-black-muziik.js
```

**스크립트 동작**:
1. `secret-weapon-black-muziik` 제품 조회
2. 현재 `detail_images` 확인
3. `detail_images`를 `hero_images`로 복사 (기존 hero_images와 병합)
4. 데이터베이스 업데이트

**주의사항**:
- `detail_images`는 그대로 유지됩니다 (기존 호환성)
- 제품 페이지는 `hero_images`를 우선 사용합니다
- `detail_images`는 `detail_content`와 함께 사용됩니다

---

## 📊 현재 페이지 구조

### 구현된 구조
```
1. 헤더
2. ✅ 2컷 후킹 이미지 섹션 (Hook)
   - 티타늄 파이버 샤프트
   - FULL 티타늄 설계
3. ✅ 첫 번째 CTA 버튼 섹션
4. ✅ 제품 히어로 섹션
   - 메인 이미지 슬라이더 (heroImages 사용)
   - 제품 정보
   - CTA 버튼
5. ✅ 8컷 상세 이미지 섹션 (Detail)
6. 혁신적인 테크놀로지 섹션 (기존 유지)
7. 프리미엄 디자인 섹션 (기존 유지)
8. 스펙표 (기존 유지)
9. ✅ 두 번째 CTA 버튼 섹션
10. 다른 브랜드와의 비교 (기존 유지)
11. 실제 성능 데이터 (기존 유지)
12. 실제 고객 후기 (기존 유지)
13. 리미티드 에디션 (기존 유지)
14. 최종 CTA 섹션 (기존 유지)
```

---

## 🎯 mas9golf.com 참고 사항

### 레이아웃 비교

**mas9golf.com 구조**:
1. 헤더
2. 2컷 후킹 이미지 (티타늄 파이버 샤프트, FULL 티타늄 설계)
3. 첫 번째 CTA
4. 제품 히어로 섹션 (이미지 슬라이더)
5. 8컷 상세 이미지
6. 스펙표
7. 두 번째 CTA
8. 기타 섹션들

**현재 masgolf.co.kr 구조**: ✅ 동일하게 구현됨

### 스타일 참고 사항

1. **Hook 섹션**:
   - ✅ 검은 배경 (`bg-black`)
   - ✅ 이미지와 텍스트 교차 배치
   - ✅ 큰 제목 (text-3xl)
   - ✅ 설명 텍스트 (text-lg)

2. **CTA 섹션**:
   - ✅ 그라데이션 배경 (`bg-gradient-to-br from-gray-900 via-black to-gray-900`)
   - ✅ 중앙 정렬
   - ✅ 두 개의 CTA 버튼 (전화, 스마트스토어)

3. **Hero 섹션**:
   - ✅ 이미지 슬라이더
   - ✅ 썸네일 갤러리
   - ✅ 제품 정보 (제목, 가격, 특징)
   - ✅ CTA 버튼

4. **Detail 섹션**:
   - ✅ 검은 배경
   - ✅ 이미지와 텍스트 교차 배치
   - ✅ 각 기술 특징 설명

---

## 📝 작업 체크리스트

### Phase 1: 마이그레이션 실행
- [ ] `scripts/migrate-detail-to-hero-secret-weapon-black-muziik.js` 실행
- [ ] 마이그레이션 결과 확인
- [ ] 제품 페이지에서 heroImages 정상 표시 확인

### Phase 2: 콘텐츠 입력
- [x] Hook 이미지 2개 등록 완료
- [ ] Hook 콘텐츠 제목/설명 입력 (관리 페이지에서)
- [ ] Detail 이미지 8개 등록
- [ ] Detail 콘텐츠 제목/설명 입력 (관리 페이지에서)

### Phase 3: 페이지 검증
- [ ] Hook 섹션 정상 표시 확인
- [ ] 첫 번째 CTA 섹션 정상 표시 확인
- [ ] Hero 섹션 정상 표시 확인 (heroImages 사용)
- [ ] Detail 섹션 정상 표시 확인
- [ ] 두 번째 CTA 섹션 정상 표시 확인
- [ ] 반응형 디자인 확인 (모바일/태블릿/데스크톱)
- [ ] 이미지 로딩 성능 확인

### Phase 4: 최적화
- [ ] 이미지 최적화 (WebP 변환, 압축)
- [ ] 로딩 속도 개선
- [ ] SEO 메타 태그 확인
- [ ] 접근성 검증

---

## 🔧 기술 스택

### 데이터베이스
- **테이블**: `products`
- **필드**: 
  - `hero_images` JSONB
  - `hook_images` JSONB
  - `hook_content` JSONB
  - `detail_content` JSONB

### 프론트엔드
- **프레임워크**: Next.js
- **스타일링**: TailwindCSS
- **이미지**: Next.js Image 컴포넌트
- **데이터 로딩**: `useProductData` 훅

### 관리 페이지
- **경로**: `/admin/products`
- **기능**: 
  - 탭 UI (Detail, Hero, Hook, Performance)
  - 이미지 업로드/삭제/순서 변경
  - 텍스트 콘텐츠 편집

---

## 📂 파일 구조

### 수정된 파일
```
pages/products/secret-weapon-black-muziik.tsx  # 제품 페이지
pages/admin/products.tsx                       # 관리 페이지
lib/use-product-data.ts                        # 데이터 로딩 훅
pages/api/admin/products.ts                    # API
database/extend-products-table-for-page-content.sql  # DB 스키마
```

### 신규 생성 파일
```
scripts/migrate-detail-to-hero-secret-weapon-black-muziik.js  # 마이그레이션 스크립트
docs/secret-weapon-black-muziik-migration-final-plan.md      # 이 문서
```

---

## 🚀 실행 순서

### 1단계: 마이그레이션 실행
```bash
# 마이그레이션 스크립트 실행
node scripts/migrate-detail-to-hero-secret-weapon-black-muziik.js
```

### 2단계: 콘텐츠 입력
1. `/admin/products` 접속
2. `secret-weapon-black-muziik` 제품 수정
3. Hook 탭에서 제목/설명 입력
4. Detail 탭에서 이미지 추가 및 제목/설명 입력

### 3단계: 검증
1. `/products/secret-weapon-black-muziik` 페이지 확인
2. 각 섹션이 정상 표시되는지 확인
3. 반응형 디자인 확인

---

## 📊 예상 결과

### 마이그레이션 전
- `detail_images`: 9개 이미지
- `hero_images`: 0개 이미지

### 마이그레이션 후
- `detail_images`: 9개 이미지 (유지)
- `hero_images`: 9개 이미지 (복사됨)

### 제품 페이지 동작
- Hero 섹션: `hero_images` 사용 (9개 이미지 슬라이더)
- Detail 섹션: `detail_content` 사용 (8개 상세 이미지)

---

## ⚠️ 주의사항

1. **기존 호환성 유지**:
   - `detail_images`는 그대로 유지됩니다
   - 기존 코드와의 호환성을 위해 `productImages`도 계속 지원합니다

2. **이미지 중복**:
   - `hero_images`와 `detail_images`에 같은 이미지가 있을 수 있습니다
   - 이는 정상이며, 각각 다른 용도로 사용됩니다

3. **마이그레이션 후 확인**:
   - 마이그레이션 후 제품 페이지를 새로고침하여 확인하세요
   - 브라우저 캐시를 지우고 확인하는 것을 권장합니다

---

## 📞 문의 및 지원

문제가 발생하거나 질문이 있으시면:
1. 마이그레이션 로그 확인
2. 브라우저 콘솔 확인
3. 데이터베이스 직접 확인

---

## ✅ 완료 체크리스트

- [x] 데이터베이스 스키마 확장
- [x] Hook 이미지 2개 등록
- [x] 코드 구현 완료
- [ ] Detail → Hero 마이그레이션 실행
- [ ] Hook 콘텐츠 입력
- [ ] Detail 콘텐츠 입력
- [ ] 페이지 검증
- [ ] 최적화

---

**작성일**: 2026-01-27  
**최종 수정일**: 2026-01-27
