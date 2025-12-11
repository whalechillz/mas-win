# MASSGOO X MUZIIK 설문 조사 랜딩 페이지 개발 계획서

## 📋 프로젝트 개요

**프로젝트 명**: MASSGOO X MUZIIK 콜라보 모자 증정 이벤트 설문 조사 랜딩 페이지

**목적**: 
- 시타 참여자 전화만 해도 MASSGOO X MUZIIK 콜라보 모자 30명에게 증정 이벤트
- 마쓰구 신모델에 장착할 샤프트 선호도 조사
- 수집된 데이터를 고객 DB에 저장하여 향후 마케팅 활용

**이벤트 상품**: 
- 버킷햇 (화이트, 블랙) - 2개
- 골프모자 (화이트, 베이지, 네이비, 블랙) - 4개
- **총 6개 이미지 활용**

**기간**: 설문은 계속 진행될 예정이므로 재사용 가능한 구조로 개발

---

## 🎯 주요 기능 요구사항

### 1. 랜딩 페이지
- **히어로 섹션**: 이벤트 소개 및 모자 이미지 갤러리 (6개 이미지)
- **CTA 버튼**: 
  - 시타 예약하기 (`/booking`)
  - 전화하기 (`tel:031-215-0013`)
- **설문 진행 표시**: 단계별 진행 상황 표시 (1/7, 2/7, ...)

### 2. 설문 항목 (7단계)
1. **성함** (필수)
2. **연락처** (필수, 전화번호 형식 검증)
3. **연령대** (시타 예약과 동일한 형식: 숫자 입력 후 자동 그룹화)
4. **마쓰구 신모델 선택** (4가지 옵션 중 1개 선택)
   - 풀티타늄 베릴 47g(240cpm) S 대응
   - 풀티타늄 베릴 42g(230cpm) SR 대응
   - 원플렉스 사파이어 53g (215cpm: 오토 R~S 대응)
   - 원플렉스 사파이어 44g (200cpm: 오토 R2~R 대응)
5. **클럽 구매 시 중요 요소** (다중 선택 가능: 비거리, 방향성, 타구감)
6. **고반발 드라이버 마쓰구에 원하시는 점** (자유 입력)
7. **주소** (모자 배송용, 필수)

### 3. 데이터 저장
- 설문 응답 데이터를 `surveys` 테이블에 저장
- 고객 정보(이름, 전화번호, 연령대, 주소)는 `customers` 테이블에 자동 동기화
- 전화번호 기준으로 기존 고객이면 업데이트, 신규면 생성

### 4. 관리자 페이지
- 설문 결과 조회 및 관리 (`/admin/surveys`)
- 설문 응답 목록 (필터링, 검색, 정렬)
- 개별 응답 상세 보기
- CSV 내보내기 기능
- 통계 대시보드 (모델별 선호도, 중요 요소 분포 등)

### 5. 제품 페이지
- **시크리트포스 PRO3 MUZIIK** 제품 페이지 제작 (`/products/pro3-muziik`)
- 가격: 1,700,000원
- 기존 PRO3 이미지 활용 + 샤프트만 뮤직 사파이어, 베릴 추가 이미지

---

## 🗄️ 데이터베이스 스키마

### surveys 테이블 (신규 생성)
```sql
CREATE TABLE surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 고객 정보
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  age INTEGER,
  age_group VARCHAR(20), -- 20대, 30대, 40대, 50대, 60대, 70대, 80대 이상
  address TEXT NOT NULL,
  
  -- 설문 응답
  selected_model VARCHAR(100) NOT NULL, -- 선택한 모델
  important_factors TEXT[], -- 중요 요소 배열 (비거리, 방향성, 타구감)
  additional_feedback TEXT, -- 추가 의견
  
  -- 고객 연결
  customer_id INTEGER REFERENCES customers(id),
  
  -- 메타데이터
  campaign_source VARCHAR(100) DEFAULT 'muziik-survey-2025',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_surveys_phone ON surveys(phone);
CREATE INDEX idx_surveys_customer_id ON surveys(customer_id);
CREATE INDEX idx_surveys_created_at ON surveys(created_at);
CREATE INDEX idx_surveys_selected_model ON surveys(selected_model);

-- RLS 정책
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for all users" ON surveys
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" ON surveys
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## 🎁 이벤트 상품 이미지 (6개)

### 이미지 경로
```
/public/survey/gifts/
  - bucket-hat-white.webp      # 버킷햇 화이트
  - bucket-hat-black.webp      # 버킷햇 블랙
  - golf-cap-white.webp         # 골프모자 화이트
  - golf-cap-beige.webp         # 골프모자 베이지
  - golf-cap-navy.webp          # 골프모자 네이비
  - golf-cap-black.webp         # 골프모자 블랙
```

---

## 📝 구현 단계

### Phase 1: 데이터베이스 및 API ✅
- [x] `surveys` 테이블 생성
- [x] 설문 제출 API 구현 (`/api/survey/submit`)
- [x] 고객 동기화 로직 구현
- [x] 설문 목록 조회 API (`/api/survey/list`)
- [x] 설문 통계 API (`/api/survey/stats`)

### Phase 2: 프론트엔드 설문 페이지 ✅
- [x] 랜딩 페이지 (`/survey/index.tsx`)
- [x] 설문 폼 페이지 (`/survey/form.tsx`) - 7단계
- [x] 설문 완료 페이지 (`/survey/success.tsx`)

### Phase 3: 관리자 페이지 ✅
- [x] 설문 결과 목록 페이지 (`/admin/surveys/index.tsx`)
- [x] 통계 대시보드
- [x] 필터링 및 검색 기능
- [ ] 개별 설문 상세 페이지 (선택사항)

### Phase 4: 제품 페이지 ✅
- [x] 시크리트포스 PRO3 MUZIIK 제품 페이지 (`/products/pro3-muziik.tsx`)

---

## 📅 진행 상황

- **2025-01-XX**: 개발 시작
- **2025-01-XX**: 모든 Phase 완료 ✅

## ✅ 완료된 작업 요약

1. **데이터베이스**: `surveys` 테이블 생성 완료
2. **API**: 설문 제출, 목록 조회, 통계 API 구현 완료
3. **프론트엔드**: 랜딩, 폼, 완료 페이지 구현 완료
4. **관리자**: 설문 결과 관리 페이지 구현 완료
5. **제품 페이지**: PRO3 MUZIIK 페이지 구현 완료

## 📌 다음 단계

### ✅ 완료된 작업
1. ✅ Supabase에서 `surveys` 테이블 생성 완료
2. ✅ RLS 정책 설정 완료

### 🔄 진행 중/대기 중인 작업
1. **모자 이미지 6개 준비**:
   - `/public/survey/gifts/` 경로에 배치 필요
   - 버킷햇: 화이트, 블랙 (2개)
   - 골프모자: 화이트, 베이지, 네이비, 블랙 (4개)

2. **PRO3 MUZIIK 샤프트 이미지 추가** (선택사항):
   - `/main/products/pro3-muziik/` 경로에 샤프트 이미지 추가
   - 사파이어, 베릴 샤프트 이미지

3. **RLS 활성화 확인**:
   - Supabase 대시보드에서 "Enable RLS" 버튼 클릭하여 활성화
   - 현재 "surveys RLS DISABLED" 상태로 보임

4. **테스트 및 배포**:
   - `/survey` 페이지 접속하여 설문 플로우 테스트
   - `/admin/surveys` 페이지에서 결과 확인
   - 프로덕션 배포

