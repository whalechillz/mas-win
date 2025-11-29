# Phase 6: mas9golf.co.kr 사이트 통합 및 마이그레이션

## 프로젝트 개요
- **목적**: Wix 기반 mas9golf.co.kr 사이트를 Next.js로 마이그레이션
- **기간**: 2-3주
- **우선순위**: 후속 작업 (Phase 8-11 완료 후)
- **상태**: 계획 중

## 주요 작업

### 1. 사이트 분석
- mas9golf.co.kr 사이트 구조 분석
- Wix 기반 기능 파악
- 콘텐츠 및 이미지 마이그레이션 계획

### 2. 사이트 통합 계획
- Next.js 기반 새 구조 설계
- 기존 기능 매핑
- 데이터베이스 스키마 설계

### 3. 콘텐츠 마이그레이션
- 페이지 콘텐츠 이전
- 이미지 및 에셋 마이그레이션
- 메타데이터 동기화

### 4. 사이트 통합 구현
- Next.js 페이지 구현
- API 엔드포인트 개발
- 프론트엔드 UI 구현

---

## 🎯 시타 예약 시스템 마이그레이션 (2025-11-22 추가)

### 개요
Wix 기반 시타 예약 시스템을 Next.js + Supabase로 마이그레이션하여 자체 관리 시스템 구축

### 참조 URL
- **프론트엔드 페이지**:
  - 서비스 소개: https://www.mas9golf.com/try-a-massgoo
  - 예약 캘린더: https://www.mas9golf.com/booking-calendar/try-a-massgoo-details?referral=service_list_widget&skipPreferencesModal=true
  - 예약 양식: https://www.mas9golf.com/booking-form?referral=booking_calendar_widget

- **Wix 관리자 페이지** (참조):
  - 로그인: wix.com (taksoo.kim@gmail.com, 구글 로그인)
  - 예약 캘린더: https://manage.wix.com/dashboard/9fd66b1e-f894-49ab-9e3a-b41aac392bd7/bookings/calendar?referralInfo=sidebar

### 주요 요구사항

#### 1. 고객 DB 연결
- **목적**: 기존 고객 데이터와 예약 시스템 통합
- **작업**:
  - Supabase `customers` 테이블과 예약 시스템 연결
  - 고객 정보 자동 매칭 (전화번호, 이메일 기준)
  - 고객 히스토리 조회 기능
  - 예약 시 기존 고객 정보 자동 입력

#### 2. 프론트엔드 UI 개선
- **기존 Wix 페이지 분석 및 참조**:
  - 서비스 소개 페이지 UI/UX 분석
  - 예약 캘린더 인터페이스 분석
  - 예약 양식 디자인 분석
  
- **개선 사항**:
  - 모던하고 직관적인 UI/UX 설계
  - 반응형 디자인 (모바일 최적화)
  - 로딩 상태 및 에러 처리 개선
  - 사용자 친화적인 예약 프로세스
  - 실시간 예약 가능 시간 표시

#### 3. 관리자 페이지 개발
- **Wix 관리자 페이지 장점 활용**:
  - 주간/월간 캘린더 뷰
  - 예약 필터링 (서비스, 담당자, 위치)
  - 예약 상태 관리 (대기, 확정, 취소)
  - 중복 예약 방지 기능
  - 예약 요청 관리
  - 대기자 명단 관리

- **추가 기능**:
  - 고객 정보 연동 (고객 DB에서 자동 조회)
  - 예약 히스토리 조회
  - 통계 및 분석 대시보드
  - 알림 설정 (SMS, 이메일)

#### 4. 고객 사진 저장
- **기능**:
  - 예약 시 고객 사진 업로드 기능
  - Supabase Storage에 저장 (`originals/customers/{customer_id}/`)
  - 이미지 갤러리 시스템과 연동
  - 고객별 사진 갤러리 조회
  - 사진 메타데이터 관리 (촬영일, 설명 등)

### 데이터베이스 스키마

#### 예약 테이블 (`bookings`)
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  
  -- 예약 정보
  service_type VARCHAR(100) NOT NULL, -- 'KGFA 1급 시타 체험하기', '드라이버 렌탈' 등
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration INTEGER DEFAULT 60, -- 분 단위
  
  -- 고객 정보 (예약 시 입력)
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  current_club TEXT, -- 현재 클럽 정보
  current_distance INTEGER, -- 현재 비거리
  age_group VARCHAR(20), -- 연령대
  
  -- 상태 관리
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  notes TEXT,
  
  -- 관리 정보
  assigned_to UUID, -- 담당자
  location VARCHAR(100) DEFAULT 'Massgoo Studio',
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_phone ON bookings(phone);
```

#### 예약 사진 테이블 (`booking_photos`)
```sql
CREATE TABLE booking_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  
  -- 이미지 정보
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  
  -- 메타데이터
  description TEXT,
  taken_at TIMESTAMPTZ,
  photo_type VARCHAR(50), -- 'before', 'after', 'fitting', 'general'
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_booking_photos_booking ON booking_photos(booking_id);
CREATE INDEX idx_booking_photos_customer ON booking_photos(customer_id);
```

### API 엔드포인트

#### 예약 관련
- `GET /api/bookings` - 예약 목록 조회
- `GET /api/bookings/[id]` - 예약 상세 조회
- `POST /api/bookings` - 예약 생성
- `PUT /api/bookings/[id]` - 예약 수정
- `DELETE /api/bookings/[id]` - 예약 취소
- `GET /api/bookings/available` - 예약 가능한 시간 조회
- `GET /api/bookings/calendar` - 캘린더 데이터 조회

#### 고객 연동
- `GET /api/bookings/customer/[phone]` - 전화번호로 고객 예약 조회
- `POST /api/bookings/[id]/link-customer` - 예약과 고객 연결

#### 사진 관리
- `POST /api/bookings/[id]/photos` - 예약 사진 업로드
- `GET /api/bookings/[id]/photos` - 예약 사진 목록
- `DELETE /api/bookings/photos/[id]` - 사진 삭제

### 페이지 구조

#### 프론트엔드
- `/try-a-massgoo` - 서비스 소개 페이지
- `/booking` - 예약 캘린더 페이지
- `/booking/form` - 예약 양식 페이지
- `/booking/success` - 예약 완료 페이지

#### 관리자
- `/admin/booking` - 예약 관리 대시보드
- `/admin/booking/calendar` - 예약 캘린더 뷰
- `/admin/booking/[id]` - 예약 상세 페이지
- `/admin/booking/customers` - 고객별 예약 조회

### 구현 단계

#### Phase 6-1: 데이터베이스 및 API 구축 (1주)
- [ ] 데이터베이스 스키마 생성
- [ ] 기본 CRUD API 개발
- [ ] 고객 DB 연동 API 개발
- [ ] 예약 가능 시간 조회 API 개발

#### Phase 6-2: 프론트엔드 개발 (1주)
- [ ] 서비스 소개 페이지 구현
- [ ] 예약 캘린더 페이지 구현
- [ ] 예약 양식 페이지 구현
- [ ] 예약 완료 페이지 구현
- [ ] UI/UX 개선 및 반응형 디자인

#### Phase 6-3: 관리자 페이지 개발 (1주)
- [ ] 예약 관리 대시보드 구현
- [ ] 캘린더 뷰 구현 (주간/월간)
- [ ] 예약 필터링 및 검색 기능
- [ ] 예약 상태 관리 기능
- [ ] 고객 정보 연동 기능

#### Phase 6-4: 고객 사진 기능 (3일)
- [ ] 사진 업로드 기능 구현
- [ ] Supabase Storage 연동
- [ ] 이미지 갤러리 연동
- [ ] 고객별 사진 갤러리 조회

#### Phase 6-5: 통합 및 테스트 (2일)
- [ ] 전체 시스템 통합 테스트
- [ ] Wix 데이터 마이그레이션 (필요시)
- [ ] 성능 최적화
- [ ] 배포 및 모니터링

### 체크리스트

#### 데이터베이스
- [ ] `bookings` 테이블 생성
- [ ] `booking_photos` 테이블 생성
- [ ] 인덱스 생성
- [ ] RLS 정책 설정
- [ ] 고객 테이블과 외래키 연결

#### API
- [ ] 예약 CRUD API 구현
- [ ] 예약 가능 시간 조회 API
- [ ] 고객 연동 API
- [ ] 사진 업로드 API
- [ ] 에러 처리 및 검증

#### 프론트엔드
- [ ] 서비스 소개 페이지
- [ ] 예약 캘린더 (날짜/시간 선택)
- [ ] 예약 양식 (고객 정보 입력)
- [ ] 예약 완료 페이지
- [ ] 반응형 디자인

#### 관리자
- [ ] 예약 목록 대시보드
- [ ] 캘린더 뷰 (주간/월간)
- [ ] 예약 상세 페이지
- [ ] 예약 상태 관리
- [ ] 고객 정보 연동
- [ ] 필터링 및 검색

#### 사진 관리
- [ ] 사진 업로드 기능
- [ ] Supabase Storage 저장
- [ ] 이미지 갤러리 연동
- [ ] 고객별 사진 조회

### 리스크 및 대응 방안

#### 리스크
1. **Wix 데이터 마이그레이션 복잡도**
   - 대응: 단계적 마이그레이션, 수동 검증

2. **기존 예약 데이터 손실**
   - 대응: 백업 후 마이그레이션, 이중 기록 기간 운영

3. **고객 DB 연동 오류**
   - 대응: 전화번호 정규화, 중복 체크 로직

4. **예약 충돌 처리**
   - 대응: 실시간 예약 가능 시간 체크, 트랜잭션 처리

### 참고 자료
- 기존 예약 API: `pages/api/bookings.ts`
- 고객 관리 시스템: `pages/admin/customers/`
- 이미지 갤러리 시스템: `pages/admin/gallery`

