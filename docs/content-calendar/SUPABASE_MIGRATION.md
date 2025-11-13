# Supabase 데이터베이스 전환 가이드

## 개요

카카오톡 콘텐츠 캘린더 시스템을 JSON 파일 기반에서 Supabase 데이터베이스로 전환했습니다. 이로 인해 로컬 개발 환경과 배포 환경(Vercel) 간의 데이터 동기화 문제가 해결되었습니다.

## 주요 변경사항

### 1. 데이터 저장 방식 변경
- **이전**: `docs/content-calendar/YYYY-MM.json` 파일에 직접 저장
- **현재**: Supabase 데이터베이스에 저장 (로컬/배포 동기화)

### 2. 테이블 구조

#### `kakao_profile_content` (프로필 콘텐츠)
- `id`: UUID (Primary Key)
- `date`: DATE (날짜)
- `account`: TEXT ('account1' | 'account2')
- `background_image_url`: TEXT
- `background_prompt`: TEXT
- `background_base_prompt`: TEXT
- `background_image`: TEXT (설명)
- `profile_image_url`: TEXT
- `profile_prompt`: TEXT
- `profile_base_prompt`: TEXT
- `profile_image`: TEXT (설명)
- `message`: TEXT
- `status`: TEXT ('planned' | 'created' | 'published')
- `created`: BOOLEAN
- `published_at`: TIMESTAMPTZ
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

#### `kakao_feed_content` (피드 콘텐츠)
- `id`: UUID (Primary Key)
- `date`: DATE (날짜)
- `account`: TEXT ('account1' | 'account2')
- `image_category`: TEXT
- `image_prompt`: TEXT
- `caption`: TEXT
- `image_url`: TEXT
- `url`: TEXT (피드 URL)
- `status`: TEXT ('planned' | 'created' | 'published')
- `created`: BOOLEAN
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

### 3. API 변경

#### `/api/kakao-content/calendar-load`
- **기능**: Supabase에서 월별 캘린더 데이터 로드
- **파라미터**: `month` (YYYY-MM 형식)
- **응답**: `{ success: true, calendarData: {...} }`

#### `/api/kakao-content/calendar-save`
- **기능**: Supabase에 캘린더 데이터 저장 (upsert)
- **파라미터**: `month`, `calendarData`
- **응답**: `{ success: true, savedCount: number }`

## 마이그레이션 방법

### 1. Supabase 테이블 생성

Supabase 대시보드에서 SQL Editor를 열고 다음 스크립트를 실행:

```sql
-- database/kakao-calendar-schema.sql 파일 내용 실행
```

또는 터미널에서:

```bash
# Supabase CLI 사용 (선택사항)
supabase db push database/kakao-calendar-schema.sql
```

### 2. 기존 JSON 데이터 마이그레이션

기존 JSON 파일의 데이터를 Supabase로 마이그레이션:

```bash
# 환경 변수 설정 확인
# .env.local 또는 Vercel 환경 변수:
# NEXT_PUBLIC_SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY

# 마이그레이션 실행
node scripts/migrate-kakao-calendar-to-supabase.js 2025-11
```

### 3. 환경 변수 설정

`.env.local` (로컬 개발):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Vercel 환경 변수:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 사용 방법

### 프론트엔드

프론트엔드는 자동으로 Supabase에서 데이터를 로드합니다:

1. 페이지 로드 시 `/api/kakao-content/calendar-load` 호출
2. 데이터 변경 시 `/api/kakao-content/calendar-save` 호출
3. 저장 상태가 UI에 표시됨 (저장 중/성공/실패)

### 저장 상태 표시

페이지 상단에 저장 상태가 표시됩니다:
- 🔵 **저장 중**: 파란색 배지
- ✅ **저장 완료**: 초록색 배지 (3초 후 자동 사라짐)
- ❌ **저장 실패**: 빨간색 배지 (5초 후 자동 사라짐)

## 장점

1. **로컬/배포 동기화**: Vercel의 읽기 전용 파일 시스템 제약 해결
2. **실시간 동기화**: 여러 환경에서 동일한 데이터 소스 사용
3. **데이터 영구 보존**: 배포 시 데이터가 사라지지 않음
4. **확장성**: 향후 백업, 복원, 버전 관리 등 기능 추가 용이

## 주의사항

1. **환경 변수 필수**: Supabase 환경 변수가 설정되지 않으면 시스템이 동작하지 않습니다.
2. **마이그레이션 필요**: 기존 JSON 파일의 데이터는 수동으로 마이그레이션해야 합니다.
3. **폴백 지원**: Supabase 로드 실패 시 기존 JSON 파일로 폴백 시도 (선택사항)

## 문제 해결

### 저장이 안 되는 경우
1. Supabase 환경 변수 확인
2. Supabase 테이블 생성 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 데이터가 보이지 않는 경우
1. Supabase 대시보드에서 데이터 확인
2. 마이그레이션 스크립트 실행 여부 확인
3. 날짜 범위 확인 (월별 데이터)

## 참고 파일

- `database/kakao-calendar-schema.sql`: 테이블 스키마
- `scripts/migrate-kakao-calendar-to-supabase.js`: 마이그레이션 스크립트
- `pages/api/kakao-content/calendar-load.js`: 데이터 로드 API
- `pages/api/kakao-content/calendar-save.js`: 데이터 저장 API

