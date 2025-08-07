# 마쓰구(MASGOLF) 프로젝트 계획

## 📋 최근 작업 내역

### 2025-01-XX: 데이터베이스 고도화 및 8월 퍼널 기능 추가

#### 🔧 **데이터베이스 고도화**
- **작업 내용**: 기존 2개 테이블 삭제 후 새로운 3개 테이블로 고도화
- **변경 사항**:
  - 기존: `contacts`, `bookings` 테이블
  - 새로운: `customer_profiles`, `contacts`, `bookings` 테이블
- **파일 변경**:
  - `database/upgrade-to-new-schema.sql` (새로 생성)
  - `scripts/upgrade-database.sh` (새로 생성)
  - `pages/api/contact.js` (업데이트)
  - `pages/api/booking.js` (업데이트)
- **완료 상태**: ✅ 완료

#### 🎯 **8월 퍼널 기능 추가**
- **작업 내용**: 8월 퍼널에 시타 예약하기, 문의하기 기능 추가
- **변경 사항**:
  - 기존 버튼을 모달 기반 기능으로 변경
  - 시타 예약 모달 및 문의하기 모달 추가
  - JavaScript 함수 및 이벤트 핸들러 추가
- **파일 변경**:
  - `public/versions/funnel-2025-08-vacation-final.html` (업데이트)
- **완료 상태**: ✅ 완료

#### 🎨 **8월 퍼널 UI 개선**
- **작업 내용**: 메인 타이틀 텍스트 크기 및 줄 간격 조정
- **변경 사항**:
  - 텍스트 크기: `2.3rem` → `2.2rem`
  - 줄 간격: `1.8` → `1.3`
  - CSS 우선순위 문제 해결 (`!important` 추가)
- **파일 변경**:
  - `public/versions/funnel-2025-08-vacation-final.html` (업데이트)
- **완료 상태**: ✅ 완료

## 🚀 **다음 단계**

### 1. 데이터베이스 업그레이드 실행
```bash
# Supabase 대시보드에서 수동으로 실행
# 또는 Supabase CLI 사용
./scripts/upgrade-database.sh
```

### 2. API 테스트
- 8월 퍼널에서 시타 예약 기능 테스트
- 8월 퍼널에서 문의하기 기능 테스트
- 데이터베이스 저장 확인

### 3. 기존 데이터 마이그레이션 (필요시)
- 기존 `contacts`, `bookings` 데이터를 새 스키마로 이전
- `customer_profiles` 테이블에 고객 정보 통합

## 📊 **새로운 데이터베이스 구조**

### `customer_profiles` 테이블
- 고객 기본 정보 (이름, 전화번호)
- 골프 관련 상세 정보 (스윙 스타일, 비거리, 선호도 등)
- 퀴즈 결과 및 추천 정보

### `contacts` 테이블
- 문의하기 데이터
- 고객 프로필과 연결
- 문의 상태 관리

### `bookings` 테이블
- 시타 예약 데이터
- 고객 프로필과 연결
- 예약 상태 관리

## 🔗 **관련 문서**
- [데이터베이스 스키마](./database-schema.md)
- [제품별 특징](./product-features.md)
- [추천 로직](./recommendation-logic.md)
- [퀴즈 질문](./quiz-questions.md)
- [플렉스 매핑](./flex-mapping.md) 