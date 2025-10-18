# 허브 중심 콘텐츠 캘린더 재설계 계획

## 🎯 목표
- `cc_content_calendar`를 진짜 허브로 만들기
- 각 채널의 콘텐츠는 개별 테이블에서 관리
- 허브에서 채널별 상태 추적

## 📊 현재 구조 분석

### 현재 문제점
1. 모든 채널의 글이 `cc_content_calendar`에 개별 저장
2. 허브 역할을 하지 못하고 단순 통합 목록
3. 중복 데이터와 복잡한 구조

### 현재 데이터 확인 필요
- `cc_content_calendar`에 몇 개의 레코드가 있는지
- 각 레코드의 `content_type` 분포
- 채널별 연결 상태

## 🔧 재설계 방안

### 1단계: 현재 데이터 분석
```sql
-- 현재 데이터 구조 파악
SELECT 
  content_type,
  COUNT(*) as count,
  COUNT(blog_post_id) as blog_connected,
  COUNT(sms_id) as sms_connected,
  COUNT(naver_blog_id) as naver_connected
FROM cc_content_calendar 
GROUP BY content_type;
```

### 2단계: 허브 중심 구조로 변경

#### A. 테이블 구조 수정
```sql
-- 불필요한 컬럼 제거
ALTER TABLE cc_content_calendar DROP COLUMN IF EXISTS content_type;

-- 채널별 연결 ID 추가 (없는 경우)
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS sms_id uuid;
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS naver_blog_id uuid;
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS kakao_id uuid;

-- 채널별 상태 JSONB 추가
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS channel_status jsonb DEFAULT '{}';
```

#### B. 데이터 마이그레이션
1. **허브 콘텐츠 식별**: `content_type = 'hub'` 또는 허브 역할하는 콘텐츠
2. **채널별 콘텐츠 분리**: 각 채널의 콘텐츠를 해당 테이블로 이동
3. **연결 관계 설정**: 허브에서 채널별 ID 연결

### 3단계: 새로운 허브 구조

#### 허브 테이블 (cc_content_calendar)
```sql
CREATE TABLE cc_content_calendar_hub (
  id uuid PRIMARY KEY,
  title varchar NOT NULL,
  summary text,
  content_body text,
  content_date date NOT NULL,
  
  -- 채널별 연결
  blog_post_id integer,
  sms_id uuid,
  naver_blog_id uuid,
  kakao_id uuid,
  
  -- 채널별 상태 (JSONB)
  channel_status jsonb DEFAULT '{}',
  
  -- 허브 메타데이터
  is_hub_content boolean DEFAULT true,
  hub_priority integer DEFAULT 1,
  auto_derive_channels jsonb DEFAULT '["blog", "sms", "naver_blog", "kakao"]',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 채널별 상태 JSONB 구조
```json
{
  "blog": {
    "status": "연결됨",
    "post_id": 123,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "sms": {
    "status": "미발행",
    "post_id": null,
    "created_at": null
  },
  "naver_blog": {
    "status": "미발행",
    "post_id": null,
    "created_at": null
  },
  "kakao": {
    "status": "미발행",
    "post_id": null,
    "created_at": null
  }
}
```

## 🚀 구현 단계

### 1단계: 데이터 백업
```sql
-- 현재 데이터 백업
CREATE TABLE cc_content_calendar_backup AS 
SELECT * FROM cc_content_calendar;
```

### 2단계: 허브 콘텐츠 식별 및 분리
```sql
-- 허브 콘텐츠만 남기기
DELETE FROM cc_content_calendar 
WHERE content_type != 'hub' 
AND content_type != 'root';
```

### 3단계: 채널별 상태 초기화
```sql
-- channel_status 초기화
UPDATE cc_content_calendar 
SET channel_status = '{
  "blog": {"status": "미연결", "post_id": null, "created_at": null},
  "sms": {"status": "미발행", "post_id": null, "created_at": null},
  "naver_blog": {"status": "미발행", "post_id": null, "created_at": null},
  "kakao": {"status": "미발행", "post_id": null, "created_at": null}
}'::jsonb;
```

### 4단계: API 수정
- 허브 중심 CRUD 작업
- 채널별 상태 업데이트 로직
- 트리 구조 표현

## ⚠️ 주의사항

1. **데이터 손실 위험**: 백업 필수
2. **기존 연결 관계**: blog_post_id 등 기존 연결 유지
3. **점진적 마이그레이션**: 단계별 진행
4. **테스트 환경**: 프로덕션 전 테스트 필수

## 🎯 최종 목표

- 허브: `cc_content_calendar` (루트 콘텐츠만)
- 채널: 각각의 테이블에서 관리
- 상태: JSONB로 유연한 추적
- UI: 트리 구조로 표현
