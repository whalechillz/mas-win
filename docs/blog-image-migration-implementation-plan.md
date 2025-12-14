# 블로그 이미지 마이그레이션 구현 계획

> "골프 가이드" 메뉴 통합 및 블로그 이미지 마이그레이션 검증 작업

## 목차

1. [상단 네비게이션 계획](#상단-네비게이션-계획)
2. [블로그 이미지 마이그레이션 검증 계획](#블로그-이미지-마이그레이션-검증-계획)
3. [구현 단계](#구현-단계)
4. [검증 프로세스](#검증-프로세스)

---

## 상단 네비게이션 계획

### 현재 네비게이션 구조

```tsx
<nav className="hidden md:flex space-x-8 items-center">
  <a href="https://www.masgolf.co.kr/">드라이버</a>
  <Link href="/#technology">기술력</Link>
  <Link href="/#reviews">고객후기</Link>
  <Link href="/about">브랜드 스토리</Link>
  <Link href="/contact">시타매장</Link>
  <Link href="/try-a-massgoo" className="bg-red-600 text-white px-4 py-2 rounded-lg">
    무료 시타
  </Link>
</nav>
```

### 개선된 네비게이션 구조

```tsx
<nav className="hidden md:flex space-x-8 items-center">
  <a href="https://www.masgolf.co.kr/">드라이버</a>
  <Link href="/#technology">기술력</Link>
  <Link href="/#reviews">고객후기</Link>
  <Link href="/about">브랜드 스토리</Link>
  <Link href="/blog">골프 가이드</Link> {/* ⭐ 신규 추가 */}
  <Link href="/contact">시타매장</Link>
  <Link href="/try-a-massgoo" className="bg-red-600 text-white px-4 py-2 rounded-lg">
    무료 시타
  </Link>
</nav>
```

### 적용 대상 페이지

다음 페이지들의 네비게이션에 "골프 가이드" 메뉴 추가:
1. ✅ 메인 페이지 (`pages/index.js`)
2. ✅ 브랜드 스토리 (`pages/about.tsx`)
3. ✅ 시타 매장 (`pages/contact.tsx`)
4. ✅ 시타 예약 (`pages/try-a-massgoo.tsx`)
5. ✅ 예약 페이지 (`pages/booking.tsx`)
6. ✅ 블로그 페이지 (`pages/blog/index.js`)

### 모바일 메뉴

모바일 메뉴에도 동일하게 추가:
```tsx
{/* 모바일 메뉴 */}
<div className="md:hidden">
  <Link href="/blog" className="block py-2 text-gray-700">
    골프 가이드
  </Link>
</div>
```

---

## 블로그 이미지 마이그레이션 검증 계획

### 목표

1. 모든 블로그 이미지를 `originals/blog/YYYY-MM/{blog-id}/` 폴더로 정확히 마이그레이션
2. 블로그 글이 깨지지 않도록 검증
3. 이미지 URL이 정상적으로 업데이트되었는지 확인
4. 메타데이터 생성 및 검증

### 폴더 구조

```
originals/blog/
├── 2015-08/
│   ├── 121/          # 블로그 ID별 폴더
│   │   ├── featured.jpg
│   │   ├── image-1.jpg
│   │   └── image-2.jpg
│   └── 122/
├── 2015-09/
│   └── 123/
└── 2025-11/
    └── 482/
```

---

## 구현 단계

### Phase 1: 전체 분석 및 현황 파악 ⚡ (우선 실행)

#### 목표
- 모든 블로그 글의 이미지 현황 파악
- 중복 이미지 그룹 식별
- 외부 URL 및 깨진 링크 확인
- 갤러리 루트 폴더의 블로그 이미지 현황 파악

#### 실행 방법
```bash
# API 호출
POST /api/admin/analyze-all-blog-images
{
  "dryRun": true
}
```

#### 결과 확인 항목
- [ ] 총 블로그 글 수
- [ ] 총 이미지 URL 수 (고유)
- [ ] Storage에서 찾은 이미지 수
- [ ] Storage에서 못 찾은 이미지 수
- [ ] 외부 URL 이미지 수
- [ ] 중복 이미지 그룹 수 및 리스트
- [ ] 연결되지 않은 이미지 수

#### 결과 저장
- 분석 결과 JSON 저장: `backup/blog-image-analysis-YYYYMMDD.json`
- 중복 그룹 리스트: `backup/blog-duplicate-groups-YYYYMMDD.json`

---

### Phase 2: 글별 이미지 마이그레이션 및 검증

#### 목표
- 발행일이 빠른 글부터 하나씩 정리
- 이미지를 `originals/blog/YYYY-MM/{blog-id}/` 폴더로 이동
- 블로그 본문의 이미지 URL 업데이트
- 메타데이터 생성
- 검증: 블로그 글이 깨지지 않았는지 확인

#### 실행 순서

1. **발행일 순서로 블로그 글 목록 조회**
   ```sql
   SELECT id, title, slug, published_at, created_at
   FROM blog_posts
   WHERE status = 'published'
   ORDER BY published_at ASC, created_at ASC
   ```

2. **글별로 순차 처리**
   ```bash
   # 예: 블로그 글 ID 121 처리
   POST /api/admin/organize-images-by-blog
   {
     "blogPostId": 121
   }
   ```

3. **각 글 처리 후 검증**
   - [ ] 갤러리에서 이미지 확인 (`/admin/gallery` → `originals/blog/YYYY-MM/{blog-id}/`)
   - [ ] 블로그 본문에서 이미지 정상 표시 확인
   - [ ] 이미지 URL이 새 경로로 업데이트되었는지 확인
   - [ ] 메타데이터 생성 확인 (Alt Text, Title, Keywords)

#### ⚠️ 중요 주의사항

1. **이미지 이동 후 대기 시간 필수**
   - 이미지를 Storage에서 이동한 후, 메타데이터 생성 전에 **최소 10초 대기** 필요
   - Storage 파일 이동이 완전히 완료되기 전에 메타데이터 생성 API를 호출하면 "Object not found" 오류 발생 가능

2. **블로그 본문 URL 업데이트**
   - 이미지 이동 후 블로그 본문(`content`)의 이미지 URL도 업데이트 필요
   - `organize-images-by-blog.js`에서 URL 매핑을 통해 자동 업데이트

3. **검증 프로세스**
   - 각 글 처리 후 반드시 블로그 페이지에서 이미지가 정상 표시되는지 확인
   - 깨진 이미지가 있으면 즉시 롤백

---

### Phase 3: 검증 자동화 스크립트

#### 목표
- 블로그 글의 이미지가 정상적으로 표시되는지 자동 검증
- 깨진 이미지 자동 감지
- 검증 결과 리포트 생성

#### 검증 항목

1. **이미지 존재 확인**
   - Storage에 이미지 파일이 실제로 존재하는지 확인
   - `image_metadata` 테이블에 메타데이터가 있는지 확인

2. **URL 접근성 확인**
   - 블로그 본문의 이미지 URL이 접근 가능한지 확인
   - Public URL이 정상적으로 생성되었는지 확인

3. **블로그 본문 파싱 검증**
   - HTML에서 이미지 태그가 정상적으로 파싱되는지 확인
   - 이미지 URL이 올바르게 업데이트되었는지 확인

#### 검증 스크립트 구조

```javascript
// pages/api/admin/verify-blog-images.js
const verifyBlogImages = async (blogPostId = null) => {
  // 1. 블로그 글 조회
  // 2. 본문에서 이미지 URL 추출
  // 3. 각 이미지 URL 검증
  //    - Storage 존재 확인
  //    - Public URL 접근 확인
  //    - 메타데이터 존재 확인
  // 4. 결과 리포트 생성
};
```

---

## 검증 프로세스

### 1. 사전 검증 (마이그레이션 전)

```bash
# 전체 블로그 이미지 분석
POST /api/admin/analyze-all-blog-images
{
  "dryRun": true
}

# 결과 확인:
# - 총 블로그 글 수
# - 총 이미지 수
# - Storage에서 찾은 이미지 수
# - Storage에서 못 찾은 이미지 수
```

### 2. 마이그레이션 실행

```bash
# 특정 블로그 글 마이그레이션
POST /api/admin/organize-images-by-blog
{
  "blogPostId": 121
}

# 또는 배치 처리
POST /api/admin/organize-images-by-blog
{
  "blogPostId": null  # 전체 처리
}
```

### 3. 사후 검증 (마이그레이션 후)

```bash
# 블로그 이미지 검증
POST /api/admin/verify-blog-images
{
  "blogPostId": 121
}

# 검증 결과:
# - 이미지 파일 존재 여부
# - URL 접근 가능 여부
# - 메타데이터 존재 여부
# - 블로그 본문 파싱 결과
```

### 4. 수동 검증

1. **갤러리에서 확인**
   - `/admin/gallery` → `originals/blog/YYYY-MM/{blog-id}/` 폴더 확인
   - 이미지가 올바른 폴더에 있는지 확인

2. **블로그 페이지에서 확인**
   - `/blog/{slug}` 페이지 접속
   - 이미지가 정상적으로 표시되는지 확인
   - 이미지 클릭 시 상세 보기 링크가 정상 작동하는지 확인

3. **메타데이터 확인**
   - 갤러리에서 이미지 선택
   - Alt Text, Title, Keywords가 생성되었는지 확인

---

## 검증 자동화 스크립트 구현

### API 엔드포인트: `/api/admin/verify-blog-images`

#### 기능
1. 블로그 글의 모든 이미지 URL 추출
2. 각 이미지의 Storage 존재 확인
3. Public URL 접근성 확인
4. 메타데이터 존재 확인
5. 블로그 본문 파싱 검증
6. 검증 결과 리포트 생성

#### 요청 형식
```json
{
  "blogPostId": 121,  // null이면 전체 검증
  "checkStorage": true,
  "checkPublicUrl": true,
  "checkMetadata": true,
  "checkContentParsing": true
}
```

#### 응답 형식
```json
{
  "success": true,
  "blogPostId": 121,
  "title": "블로그 글 제목",
  "totalImages": 5,
  "verifiedImages": 5,
  "brokenImages": 0,
  "results": [
    {
      "url": "https://...",
      "storageExists": true,
      "publicUrlAccessible": true,
      "metadataExists": true,
      "contentParsed": true,
      "status": "ok"
    }
  ],
  "report": {
    "total": 5,
    "ok": 5,
    "broken": 0,
    "missingStorage": 0,
    "missingMetadata": 0
  }
}
```

---

## 실행 계획

### Step 1: 상단 네비게이션 업데이트 (30분)

1. 모든 페이지의 네비게이션에 "골프 가이드" 메뉴 추가
2. 모바일 메뉴에도 추가
3. 테스트: 각 페이지에서 메뉴 클릭 시 `/blog`로 이동 확인

### Step 2: Phase 1 실행 - 전체 분석 (1시간)

1. `POST /api/admin/analyze-all-blog-images` 실행
2. 결과 확인 및 저장
3. 현황 파악 및 우선순위 결정

### Step 3: 검증 스크립트 구현 (2시간)

1. `pages/api/admin/verify-blog-images.js` 생성
2. 검증 로직 구현
3. 리포트 생성 기능 구현

### Step 4: Phase 2 실행 - 글별 마이그레이션 (3-5일)

1. 발행일 순서로 블로그 글 목록 조회
2. 각 글별로 순차 처리:
   - 이미지 마이그레이션
   - URL 업데이트
   - 메타데이터 생성
   - 검증 실행
3. 검증 실패 시 롤백 및 재시도

### Step 5: 최종 검증 (1일)

1. 전체 블로그 글 검증
2. 깨진 이미지 0개 확인
3. 문서화

---

## 체크리스트

### 상단 네비게이션
- [ ] 메인 페이지 네비게이션 업데이트
- [ ] 브랜드 스토리 페이지 네비게이션 업데이트
- [ ] 시타 매장 페이지 네비게이션 업데이트
- [ ] 시타 예약 페이지 네비게이션 업데이트
- [ ] 예약 페이지 네비게이션 업데이트
- [ ] 블로그 페이지 네비게이션 업데이트
- [ ] 모바일 메뉴 업데이트
- [ ] 각 페이지에서 메뉴 클릭 테스트

### 블로그 이미지 마이그레이션
- [ ] Phase 1: 전체 분석 실행
- [ ] 검증 스크립트 구현
- [ ] Phase 2: 첫 번째 글 마이그레이션 및 검증
- [ ] 검증 프로세스 확인
- [ ] 나머지 글들 순차 처리
- [ ] 최종 검증 실행
- [ ] 문서화

---

**작성일**: 2025-01-14  
**버전**: 1.0  
**상태**: 구현 준비

