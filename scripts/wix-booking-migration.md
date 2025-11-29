# Wix 예약 데이터 마이그레이션 가이드

## 개요
Wix에서 수집한 예약 데이터를 Supabase로 마이그레이션하는 스크립트입니다.

## 데이터 소스
- **파일**: `예약 목록-2025. 11. 23..csv`
- **형식**: CSV (UTF-8)

## 마이그레이션 규칙

### 1. 날짜 처리
- Wix 등록일과 시스템 첫 문의일 중 **더 오래된 날짜** 사용
- 형식: `YYYY-MM-DD`

### 2. 이메일 필터링
다음 이메일은 제외:
- `@aa.aa` 도메인
- `massgoogolf@gmail.com`
- `massgoogolf@naver.com`
- 유효한 이메일 형식만 마이그레이션

### 3. 고객 정보 계산
- **방문 횟수**: 동일 전화번호의 예약 건수
- **방문 날짜**: 각 예약의 날짜를 배열로 저장
- **No Show 횟수**: `attendance_status`가 'no_show'인 경우 카운트

### 4. 고객 이미지
- Wix에 고객 이미지가 없으므로 마이그레이션 불필요

## 스키마 매핑

### Wix CSV → Supabase `customers` 테이블
| CSV 컬럼 | Supabase 컬럼 | 변환 규칙 |
|---------|--------------|----------|
| 이름 | `name` | 직접 매핑 |
| 전화번호 | `phone` | 정규화 (공백, 하이픈 제거) |
| 이메일 | `email` | 필터링 후 매핑 |
| 등록일 | `first_inquiry_date` | Wix 등록일과 시스템 첫 문의일 중 더 오래된 날짜 |
| - | `visit_count` | 동일 전화번호의 예약 건수 계산 |
| - | `visit_dates` | 각 예약 날짜 배열 |
| - | `no_show_count` | No Show 건수 계산 |

### Wix CSV → Supabase `bookings` 테이블
| CSV 컬럼 | Supabase 컬럼 | 변환 규칙 |
|---------|--------------|----------|
| 예약 날짜 | `date` | 직접 매핑 |
| 예약 시간 | `time` | 직접 매핑 |
| 이름 | `name` | 직접 매핑 |
| 전화번호 | `phone` | 정규화 |
| 이메일 | `email` | 필터링 후 매핑 |
| 서비스 타입 | `service_type` | 직접 매핑 |
| 상태 | `status` | Wix 상태 → Supabase 상태 매핑 |
| 출석 상태 | `attendance_status` | Wix 출석 상태 → Supabase 출석 상태 매핑 |
| 메모 | `notes` | 직접 매핑 |

## 실행 방법

### 1. CSV 파일 준비
```bash
# CSV 파일을 scripts 폴더에 배치
cp "예약 목록-2025. 11. 23..csv" scripts/wix-bookings.csv
```

### 2. 마이그레이션 스크립트 실행
```bash
# Node.js 스크립트 실행
node scripts/migrate-wix-bookings.js
```

또는

```bash
# TypeScript 스크립트 실행 (ts-node 필요)
npx ts-node scripts/migrate-wix-bookings.ts
```

### 3. 결과 확인
- 마이그레이션된 고객 수
- 마이그레이션된 예약 수
- 제외된 레코드 수 및 이유
- 에러 로그

## 주의사항
1. **중복 방지**: 동일 전화번호의 고객은 하나로 통합
2. **데이터 검증**: 필수 필드(이름, 전화번호) 누락 시 제외
3. **트랜잭션**: 고객 생성 → 예약 생성 순서로 진행
4. **롤백**: 실패 시 롤백 가능하도록 트랜잭션 처리

## 다음 단계
마이그레이션 완료 후:
1. 데이터 검증 쿼리 실행
2. 고객 프로필 자동 생성 확인
3. 예약 데이터 정합성 확인


