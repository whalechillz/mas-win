# 시크리트웨폰 블랙 MUZIIK 제품 페이지 최종 구현 계획서

## 📋 개요

**작업 일자**: 2026-01-27  
**대상 제품**: `secret-weapon-black-muziik`  
**참고 사이트**: `https://www.mas9golf.com/secret-weapon-black-muz`  
**대상 페이지**: `https://www.masgolf.co.kr/products/secret-weapon-black-muziik`

---

## 🔍 문제 분석

### 1. 이미지 정리는 완료되었지만 상세페이지에 적용이 안된 이유

#### 원인 분석

**Hook 섹션이 표시되지 않는 경우:**
- `hookContent.length > 0` 조건을 만족하지 않음
- `hookContent` 배열이 비어있거나, 제목/설명이 모두 비어있을 수 있음
- **해결**: 관리 페이지에서 Hook 탭에서 제목/설명 입력 필요

**Detail 섹션이 표시되지 않는 경우:**
- `detailContent.length > 0` 조건을 만족하지 않음
- `detailContent` 배열이 비어있음
- Detail 이미지는 추가되었지만 `detailContent`에 연결되지 않음
- **해결**: 관리 페이지에서 Detail 탭에서 이미지 추가 후 제목/설명 입력 필요

**Hero 섹션에 이미지가 표시되지 않는 경우:**
- `heroImages`가 비어있고 `productImages`도 비어있음
- 마이그레이션 스크립트가 실행되지 않음
- **해결**: 마이그레이션 스크립트 실행 필요

#### 확인 방법

1. **브라우저 콘솔 확인**:
   ```javascript
   // 제품 페이지에서 확인
   console.log('hookContent:', hookContent);
   console.log('detailContent:', detailContent);
   console.log('heroImages:', heroImages);
   ```

2. **데이터베이스 직접 확인**:
   ```sql
   SELECT 
     hero_images,
     hook_images,
     hook_content,
     detail_images,
     detail_content
   FROM products
   WHERE slug = 'secret-weapon-black-muziik';
   ```

---

## 🎯 CTA 버튼과 CTA 이미지 처리 방안

### 현재 구현 상태

**CTA 버튼 섹션 (2개):**
1. **첫 번째 CTA 섹션** (Hook 섹션 아래)
   - 위치: Hook 섹션 바로 아래
   - 스타일: 그라데이션 배경 (gray-900 → black)
   - 버튼: 전화 상담, 스마트스토어 구매
   - ✅ 구현 완료

2. **두 번째 CTA 섹션** (스펙표 아래)
   - 위치: 스펙표 섹션 바로 아래
   - 스타일: 그린 배경 (green-600 → green-700)
   - 버튼: 전화 상담, 스마트스토어 구매
   - ✅ 구현 완료

### CTA 이미지 처리 방안

**현재 정책**: 텍스트 기반 CTA 버튼 사용 (이미지 기반 CTA는 사용하지 않음)

**이유**:
1. **접근성**: 텍스트 버튼이 스크린 리더에서 더 잘 인식됨
2. **반응형**: 모바일/태블릿/데스크톱에서 일관된 경험
3. **성능**: 이미지 로딩 없이 빠른 렌더링
4. **유지보수**: 텍스트 변경이 이미지 편집보다 쉬움

**mas9golf.com 참고**:
- mas9golf.com도 텍스트 기반 CTA 버튼 사용
- 이미지 기반 CTA는 사용하지 않음

**결론**: 현재 구현 유지 (텍스트 기반 CTA 버튼만 사용)

---

## 📝 작업 체크리스트

### Phase 1: 데이터 확인 및 마이그레이션

- [ ] **데이터베이스 상태 확인**
  ```sql
  SELECT 
    hero_images,
    hook_images,
    hook_content,
    detail_images,
    detail_content
  FROM products
  WHERE slug = 'secret-weapon-black-muziik';
  ```

- [ ] **마이그레이션 스크립트 실행**
  ```bash
  node scripts/migrate-detail-to-hero-secret-weapon-black-muziik.js
  ```

- [ ] **마이그레이션 결과 확인**
  - hero_images에 이미지가 복사되었는지 확인
  - 제품 페이지에서 Hero 섹션 이미지 표시 확인

### Phase 2: Hook 콘텐츠 입력

- [x] Hook 이미지 2개 등록 완료
- [ ] **Hook 콘텐츠 제목/설명 입력**
  1. `/admin/products` 접속
  2. `secret-weapon-black-muziik` 제품 수정
  3. **Hook 탭** 선택
  4. 각 이미지의 제목/설명 입력:
     - 이미지 1:
       - 제목: `티타늄 파이버 샤프트`
       - 설명: `일본 최고급 티타늄 그라파이트가 만들어내는 초고속 반발력의 혁신`
     - 이미지 2:
       - 제목: `FULL 티타늄 설계`
       - 설명: `모든 골퍼의 꿈을 실현하는 초경량 고탄성 샤프트`
  5. **저장** 버튼 클릭

### Phase 3: Detail 콘텐츠 입력

- [ ] **Detail 이미지 추가**
  1. `/admin/products` 접속
  2. `secret-weapon-black-muziik` 제품 수정
  3. **Detail 탭** 선택
  4. 이미지 8개 추가 (갤러리에서 선택 또는 업로드)

- [ ] **Detail 콘텐츠 제목/설명 입력**
  1. "Detail 이미지 텍스트 편집" 섹션에서
  2. 각 이미지마다 제목/설명 입력:
     - 이미지 1: `임팩트시 역토크 방지` / `헤드의 직진성과 방향성을 향상`
     - 이미지 2: `티타늄 그라파이트 설계` / `65t 카본 티타늄 시트 전장 사용`
     - 이미지 3: `혁신적인 디자인` / `세련된 라인과 우아한 엔지니어링`
     - 이미지 4: `풀 티타늄 섬유` / `경량이면서도 초고탄성을 실현. 휨 복원과 임팩트시 안정감`
     - 이미지 5: `2.2mm 고반발 헤드` / `최상의 반발력, 정확한 티샷`
     - 이미지 6: `나노레벨 수지 채택` / `카본 밀도 향상으로 폭발적인 반발성`
     - 이미지 7: `짜릿한 손맛` / `탄성 그립으로 전달되는 환상적인 타구음`
     - 이미지 8: `2년 헤드보증` / `마쓰구의 기술력을 오래 사용하세요`
  3. **저장** 버튼 클릭

### Phase 4: 페이지 검증

- [ ] **Hook 섹션 확인**
  - `/products/secret-weapon-black-muziik` 접속
  - Hook 섹션이 표시되는지 확인
  - 이미지 2개와 제목/설명이 표시되는지 확인

- [ ] **첫 번째 CTA 섹션 확인**
  - Hook 섹션 아래에 CTA 버튼 2개 표시 확인
  - 버튼 클릭 동작 확인

- [ ] **Hero 섹션 확인**
  - Hero 섹션에 이미지 슬라이더 표시 확인
  - 썸네일 갤러리 표시 확인
  - 제품 정보 표시 확인

- [ ] **Detail 섹션 확인**
  - Hero 섹션 아래에 Detail 섹션 표시 확인
  - 이미지 8개와 제목/설명이 표시되는지 확인
  - 이미지와 텍스트 교차 배치 확인

- [ ] **두 번째 CTA 섹션 확인**
  - 스펙표 아래에 CTA 버튼 2개 표시 확인
  - 버튼 클릭 동작 확인

- [ ] **반응형 디자인 확인**
  - 모바일 (375px): 모든 섹션이 1열로 표시되는지 확인
  - 태블릿 (768px): 2열 그리드가 적절히 표시되는지 확인
  - 데스크톱 (1024px+): 전체 레이아웃이 적절히 표시되는지 확인

### Phase 5: 최적화

- [ ] **이미지 최적화**
  - WebP 형식 확인
  - 이미지 크기 최적화
  - 로딩 속도 확인

- [ ] **성능 최적화**
  - Lighthouse 점수 확인
  - 이미지 lazy loading 확인
  - 코드 스플리팅 확인

---

## 🔧 문제 해결 가이드

### 문제 1: Hook 섹션이 표시되지 않음

**증상**: Hook 섹션이 제품 페이지에 나타나지 않음

**원인**:
- `hookContent` 배열이 비어있음
- `hookContent`의 모든 항목에 제목/설명이 비어있음

**해결 방법**:
1. 관리 페이지에서 Hook 탭 확인
2. 각 Hook 이미지의 제목/설명 입력
3. 저장 후 제품 페이지 새로고침

**확인 방법**:
```javascript
// 브라우저 콘솔에서
console.log('hookContent:', hookContent);
// 배열이 비어있지 않고, 각 항목에 title과 description이 있어야 함
```

### 문제 2: Detail 섹션이 표시되지 않음

**증상**: Detail 섹션이 제품 페이지에 나타나지 않음

**원인**:
- `detailContent` 배열이 비어있음
- Detail 이미지는 추가되었지만 `detailContent`에 연결되지 않음

**해결 방법**:
1. 관리 페이지에서 Detail 탭 확인
2. 이미지 추가 (갤러리에서 선택 또는 업로드)
3. "Detail 이미지 텍스트 편집" 섹션에서 제목/설명 입력
4. 저장 후 제품 페이지 새로고침

**확인 방법**:
```javascript
// 브라우저 콘솔에서
console.log('detailContent:', detailContent);
// 배열이 비어있지 않고, 각 항목에 title과 description이 있어야 함
```

### 문제 3: Hero 섹션에 이미지가 표시되지 않음

**증상**: Hero 섹션에 이미지가 없거나 기본 이미지만 표시됨

**원인**:
- `heroImages`가 비어있음
- 마이그레이션 스크립트가 실행되지 않음

**해결 방법**:
1. 마이그레이션 스크립트 실행:
   ```bash
   node scripts/migrate-detail-to-hero-secret-weapon-black-muziik.js
   ```
2. 데이터베이스 확인:
   ```sql
   SELECT hero_images FROM products WHERE slug = 'secret-weapon-black-muziik';
   ```
3. 제품 페이지 새로고침

---

## 📊 현재 구현 상태

### ✅ 완료된 항목

1. **데이터베이스 스키마 확장**
   - ✅ `hero_images`, `hook_images`, `hook_content`, `detail_content` 필드 추가
   - ✅ SQL 쿼리 실행 완료

2. **코드 구현**
   - ✅ Hook 섹션 컴포넌트
   - ✅ 첫 번째 CTA 섹션
   - ✅ Hero 섹션 (heroImages 사용)
   - ✅ Detail 섹션 컴포넌트
   - ✅ 두 번째 CTA 섹션
   - ✅ 관리 페이지 탭 UI
   - ✅ 텍스트 편집 기능

3. **Hook 이미지 등록**
   - ✅ Hook 이미지 2개 등록 완료

### 🔄 진행 중인 항목

1. **콘텐츠 입력**
   - [ ] Hook 콘텐츠 제목/설명 입력
   - [ ] Detail 이미지 추가
   - [ ] Detail 콘텐츠 제목/설명 입력

2. **마이그레이션**
   - [ ] Detail → Hero 마이그레이션 실행

### ⏳ 대기 중인 항목

1. **검증 및 최적화**
   - [ ] 페이지 검증
   - [ ] 반응형 디자인 확인
   - [ ] 성능 최적화

---

## 🎨 CTA 섹션 상세 스펙

### 첫 번째 CTA 섹션

**위치**: Hook 섹션 바로 아래  
**배경**: 그라데이션 (gray-900 → black)  
**제목**: "프리미엄 마쓰구 드라이버"  
**설명**: "지금 상담 받고 특별 혜택을 경험하세요!"  
**버튼**:
- 전화 상담: `tel:080-028-8888` (녹색 배경)
- 스마트스토어 구매: 네이버 스마트스토어 링크 (파란색 배경)

### 두 번째 CTA 섹션

**위치**: 스펙표 섹션 바로 아래  
**배경**: 그라데이션 (green-600 → green-700)  
**제목**: "지금 바로 구매하고 특별 혜택을 받으세요!"  
**설명**: "장비 전문가가 직접 상담해드립니다"  
**버튼**:
- 전화 상담: `tel:080-028-8888` (흰색 배경, 녹색 텍스트)
- 스마트스토어 구매: 네이버 스마트스토어 링크 (파란색 배경)

**CTA 이미지**: 사용하지 않음 (텍스트 기반 버튼만 사용)

---

## 📂 관련 파일

### 수정된 파일
- `pages/products/secret-weapon-black-muziik.tsx` - 제품 페이지
- `pages/admin/products.tsx` - 관리 페이지
- `lib/use-product-data.ts` - 데이터 로딩 훅
- `pages/api/admin/products.ts` - API

### 신규 생성 파일
- `scripts/migrate-detail-to-hero-secret-weapon-black-muziik.js` - 마이그레이션 스크립트
- `database/extend-products-table-for-page-content.sql` - DB 스키마
- `docs/secret-weapon-black-muziik-final-implementation-plan.md` - 이 문서

---

## 🚀 실행 순서 (우선순위)

### 1단계: 즉시 실행 (필수)
1. **마이그레이션 스크립트 실행**
   ```bash
   node scripts/migrate-detail-to-hero-secret-weapon-black-muziik.js
   ```

2. **Hook 콘텐츠 입력**
   - 관리 페이지에서 Hook 탭
   - 각 이미지의 제목/설명 입력
   - 저장

### 2단계: 콘텐츠 입력 (필수)
1. **Detail 이미지 추가**
   - 관리 페이지에서 Detail 탭
   - 이미지 8개 추가

2. **Detail 콘텐츠 입력**
   - "Detail 이미지 텍스트 편집" 섹션
   - 각 이미지의 제목/설명 입력
   - 저장

### 3단계: 검증 (권장)
1. 제품 페이지 확인
2. 각 섹션이 정상 표시되는지 확인
3. 반응형 디자인 확인

---

## ⚠️ 중요 사항

1. **데이터 입력 필수**: 
   - Hook 섹션은 `hookContent`에 제목/설명이 있어야 표시됨
   - Detail 섹션은 `detailContent`에 제목/설명이 있어야 표시됨

2. **마이그레이션 실행 필수**:
   - Hero 섹션에 이미지를 표시하려면 마이그레이션 스크립트 실행 필요

3. **저장 필수**:
   - 관리 페이지에서 콘텐츠 입력 후 반드시 **저장** 버튼 클릭

4. **브라우저 캐시**:
   - 변경사항이 반영되지 않으면 브라우저 캐시 삭제 후 새로고침

---

**작성일**: 2026-01-27  
**최종 수정일**: 2026-01-27
