# 고객 후기 시스템 자동화 최종 구현 계획

## 📋 프로젝트 개요

고객 후기를 타임라인으로 관리하고, 스토리 보드에서 사진/장면 설명/후기 내용을 통합하여 AI로 블로그 초안을 자동 생성하고, 블로그 관리와 허브 시스템에 자동 연결하는 시스템을 구축합니다.

---

## ✅ Phase 1: 데이터베이스 스키마 확장 (완료)

### 1.1 customer_consultations 테이블 확장

**파일**: `database/extend-customer-consultations-for-reviews.sql`

```sql
-- 후기 관련 필드 추가
ALTER TABLE customer_consultations
ADD COLUMN IF NOT EXISTS review_type VARCHAR(50), -- 'kakao', 'phone', 'visit', 'blog'
ADD COLUMN IF NOT EXISTS review_images INTEGER[], -- image_metadata.id 배열
ADD COLUMN IF NOT EXISTS review_rating INTEGER CHECK (review_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS is_blog_ready BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS generated_blog_id INTEGER REFERENCES blog_posts(id),
ADD COLUMN IF NOT EXISTS generated_hub_id UUID REFERENCES cc_content_calendar(id);

-- 타임라인 뷰 생성
CREATE OR REPLACE VIEW v_customer_review_timeline AS ...
```

**상태**: ✅ 스키마 파일 생성 완료, ✅ Supabase에 적용 완료

---

## ✅ Phase 2: 최석호 후기 파일 저장 (완료)

### 2.1 후기 저장 스크립트

**파일**: `scripts/save-choiseokho-reviews.js`

- 2020.11.18 전화후기 저장 ✅
  - ID: `1d6267c0-6e64-466f-ac36-06e9bb94d68e`
  - 내용: 431자
- 2020.12.10 전화후기 저장 ✅
  - ID: `e04cb4e9-f761-4d34-b442-abaf54008aa5`
  - 내용: 659자
- `customer_consultations` 테이블에 저장
- `review_type: 'phone'`, `topic: '전화후기'`로 구분

**상태**: ✅ 저장 완료

---

## 🚧 Phase 3: 이미지 관리 - 후기 타임라인 탭 (진행 중)

### 3.1 고객 이미지 관리 모달 확장

**파일**: `components/admin/CustomerImageModal.tsx` (기존 확장)

**구현 내용**:
```typescript
<Tabs>
  <Tab label="이미지">...</Tab>
  <Tab label="후기 타임라인"> {/* 새로 추가 */}
    <ReviewTimelineView customerId={customer.id} />
  </Tab>
</Tabs>
```

### 3.2 후기 타임라인 컴포넌트

**파일**: `components/admin/customers/ReviewTimelineView.tsx` (신규 생성)

**기능**:
- 날짜별 후기 그룹화
- 타임라인 형태로 표시
- 후기 추가/수정/삭제
- 후기와 이미지 연결
- 블로그 생성 준비 상태 표시

**구현 우선순위**: 높음

---

## 🚧 Phase 4: 스토리 보드 - 통합 뷰 (진행 중)

### 4.1 스토리 보드 모달 확장

**파일**: `components/admin/CustomerStoryModal.tsx` (기존 확장)

**구현 내용**:
```typescript
<Tabs>
  <Tab label="스토리보드">...</Tab>
  <Tab label="장면별 상세"> {/* 새로 추가 */}
    <SceneDetailView customerId={customer.id} />
  </Tab>
  <Tab label="후기"> {/* 새로 추가 */}
    <ReviewTabView customerId={customer.id} />
  </Tab>
</Tabs>
```

### 4.2 장면별 상세 뷰

**파일**: `components/admin/customers/SceneDetailView.tsx` (신규 생성)

**기능**:
- 왼쪽: 장면 목록 (1-7)
- 오른쪽: 선택된 장면 상세
  - 탭 1: 사진 (이미지 갤러리)
  - 탭 2: 장면 설명 (에디터)
  - 탭 3: 후기 (연결된 후기 목록)

### 4.3 후기 탭 뷰

**파일**: `components/admin/customers/ReviewTabView.tsx` (신규 생성)

**기능**:
- 왼쪽: 후기 목록 (날짜순)
- 오른쪽: 선택된 후기 상세
  - 탭 1: 후기 내용 (에디터)
  - 탭 2: 연결된 이미지 (갤러리)
  - 탭 3: 블로그 생성 (AI 생성 패널)

**구현 우선순위**: 높음

---

## 🚧 Phase 5: AI 블로그 초안 생성 (진행 중)

### 5.1 블로그 생성 API

**파일**: `pages/api/admin/generate-blog-from-review.js` (신규 생성)

**기능**:
1. 고객 정보 조회
2. 후기 내용 수집
3. 장면 설명 수집
4. 연결된 이미지 메타데이터 수집
5. AI 프롬프트 생성 (스토리브랜드 7단계)
6. OpenAI API로 블로그 콘텐츠 생성
7. 블로그 포스트 생성
8. 허브 콘텐츠 생성 및 연결
9. 후기 레코드 업데이트

**AI 프롬프트 구조**:
```
스토리브랜드 7단계:
1. 영웅 (고객) - 평범한 일상
2. 문제 - 비거리 감소, 불만족
3. 가이드 (마쓰구골프) - 전문가의 도움
4. 계획 - 맞춤 피팅, 제품 추천
5. 행동 요청 - 구매 결정
6. 실패 회피 - 우려 해소
7. 성공 - 비거리 향상, 만족
```

**구현 우선순위**: 높음

---

## 🚧 Phase 6: 자동화 워크플로우 (진행 중)

### 6.1 스토리 보드에서 블로그 생성 버튼

**위치**: `ReviewTabView` → 블로그 생성 패널

**플로우**:
1. 사용자가 후기 선택
2. "블로그 생성" 탭 클릭
3. 준비 상태 확인 (후기 내용, 이미지, 장면 설명)
4. "🚀 블로그 초안 생성" 버튼 클릭
5. AI 생성 진행 (로딩 표시)
6. 생성 완료 알림
7. 블로그 관리 페이지로 이동 옵션 제공

### 6.2 배치 처리 스크립트

**파일**: `scripts/auto-generate-blogs-from-reviews.js` (신규 생성)

**기능**:
- `is_blog_ready = true`이고 `generated_blog_id IS NULL`인 후기 자동 처리
- 네이버 블로그 스크래핑처럼 자동화
- 배치 처리로 여러 후기 일괄 생성

**구현 우선순위**: 중간

---

## 📊 구현 우선순위 및 일정

### 즉시 구현 (1주)

1. ✅ 데이터베이스 스키마 확장
2. ✅ 최석호 후기 파일 저장
3. 🚧 후기 타임라인 뷰 컴포넌트
4. 🚧 AI 블로그 생성 API

### 단기 구현 (2주)

5. 🚧 스토리 보드 확장 (장면별 상세, 후기 탭)
6. 🚧 블로그 생성 버튼 및 UI
7. 🚧 허브 시스템 자동 연결

### 중기 구현 (3주)

8. 🚧 배치 처리 스크립트
9. 🚧 자동화 스케줄러 (선택)
10. 🚧 통계 및 대시보드

---

## 🎯 최종 사용자 플로우

### 시나리오 1: 후기 추가 및 블로그 생성

1. **고객 관리** → 고객 선택 → **이미지** 버튼 클릭
2. **후기 타임라인** 탭 → **+ 후기 추가** 버튼
3. 후기 내용 입력 (또는 .txt 파일 업로드)
4. 연결된 이미지 선택
5. **고객 스토리** 버튼 클릭
6. **후기** 탭 → 후기 선택
7. **블로그 생성** 탭 → **🚀 블로그 초안 생성** 버튼
8. AI 생성 완료 → 블로그 관리 페이지로 이동
9. 최종 편집 및 발행

### 시나리오 2: 기존 후기로 블로그 생성

1. **고객 관리** → 고객 선택 → **고객 스토리** 버튼
2. **후기** 탭 → 후기 선택
3. **블로그 생성** 탭 → **🚀 블로그 초안 생성** 버튼
4. AI 생성 완료 → 허브 시스템에 자동 연결

---

## 🔗 시스템 통합

### 블로그 관리 시스템 연동

- 생성된 블로그는 `blog_posts` 테이블에 저장
- `category: '고객 후기'`로 자동 설정
- 고객 정보와 후기 정보가 메타데이터에 포함

### 허브 시스템 연동

- `cc_content_calendar` 테이블에 허브 콘텐츠 생성
- `blog_post_id`로 블로그와 연결
- `channel_status`에 블로그 채널 자동 연결
- SMS, 네이버 블로그, 카카오톡 채널은 "미발행" 상태로 초기화

### 네이버 블로그 스크래핑 스타일 자동화

- 배치 처리 스크립트로 준비된 후기 일괄 처리
- 실패 시 재시도 로직
- 진행 상황 로깅

---

## 📝 최석호 후기 저장 현황

### 저장된 후기

1. **2020-11-18 전화후기** ✅
   - 파일: `2020.11.18.최석호.전화후기.txt`
   - DB ID: `1d6267c0-6e64-466f-ac36-06e9bb94d68e`
   - 내용: 431자 (비거리 향상, 10년 이상 사용, 270m 이상 달성 등)
   - 상태: ✅ 저장 완료

2. **2020-12-10 전화후기** ✅
   - 파일: `2020.12.10.최석호.전화후기.txt`
   - DB ID: `e04cb4e9-f761-4d34-b442-abaf54008aa5`
   - 내용: 659자 (추가 후기 내용)
   - 상태: ✅ 저장 완료

### 다음 단계

1. ✅ 데이터베이스 스키마 확장 완료
2. ✅ 최석호 후기 2개 저장 완료
3. 🚧 후기 타임라인 뷰 컴포넌트 개발
4. 🚧 스토리 보드에서 후기와 이미지 연결
5. 🚧 AI 블로그 생성 API 개발
6. 🚧 블로그 생성 테스트

---

## 🚀 다음 작업

1. ✅ **데이터베이스 스키마 적용** - 완료
   ```bash
   # Supabase SQL Editor에서 실행 완료
   # database/extend-customer-consultations-for-reviews.sql
   ```

2. ✅ **후기 저장 스크립트 실행** - 완료
   ```bash
   node scripts/save-choiseokho-reviews.js
   # 최석호 후기 2개 저장 완료
   ```

3. 🚧 **후기 타임라인 컴포넌트 개발** - 다음 단계
   - `components/admin/customers/ReviewTimelineView.tsx` 생성
   - 날짜별 후기 그룹화
   - 타임라인 형태로 표시
   - 후기 추가/수정/삭제 기능

4. 🚧 **AI 블로그 생성 API 개발** - 다음 단계
   - `pages/api/admin/generate-blog-from-review.js` 생성
   - 스토리브랜드 7단계 구조 적용
   - 블로그 포스트 자동 생성
   - 허브 시스템 자동 연결

---

## 📚 참고 문서

- [고객 스토리보드 계획](./customer-storyboard-plan.md)
- [허브 시스템 아키텍처](../hub-system-architecture.md)
- [블로그 관리 시스템](./blog-management-system.md)

---

**최종 업데이트**: 2025-01-17
**담당자**: AI Assistant
**상태**: Phase 1-2 완료, Phase 3-6 진행 중
