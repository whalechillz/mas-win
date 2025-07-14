# 🚨 멀티채널 생성 에러 해결 가이드

## 문제 진단

에러가 발생하는 원인:
1. SQL 함수 `generate_monthly_content_selective`가 없거나 권한 문제
2. 기존 콘텐츠와 충돌
3. API 에러 처리 미흡

## 즉시 해결 방법

### 방법 1: SQL 함수 생성 확인 (Supabase SQL Editor에서 실행)

```sql
-- 1. 함수 존재 확인
SELECT proname 
FROM pg_proc 
WHERE proname = 'generate_monthly_content_selective';

-- 2. 함수가 없으면 생성
-- /database/generate-monthly-content-selective.sql 내용 전체 실행

-- 3. 권한 부여
GRANT EXECUTE ON FUNCTION generate_monthly_content_selective TO anon;
GRANT EXECUTE ON FUNCTION generate_monthly_content_selective TO authenticated;
```

### 방법 2: 안전한 API 사용 (권장)

1. **기존 API 백업**
```bash
cp pages/api/generate-multichannel-content.ts pages/api/generate-multichannel-content.backup.ts
```

2. **안전한 버전으로 교체**
```bash
cp pages/api/generate-multichannel-content-safe.ts pages/api/generate-multichannel-content.ts
```

3. **서버 재시작**
```bash
npm run dev
```

## 테스트 방법

1. 브라우저 개발자 도구 열기 (F12)
2. Network 탭 선택
3. "멀티채널 생성" 버튼 클릭
4. `generate-multichannel-content` 요청 확인
5. Response 탭에서 에러 메시지 확인

## 기존 콘텐츠 보호

**중요**: 멀티채널 생성 시 기존 콘텐츠가 있는 채널은 건너뜁니다.

```sql
-- 현재 7월 콘텐츠 확인
SELECT platform, COUNT(*) as count, 
       STRING_AGG(title, ', ') as titles
FROM content_ideas
WHERE scheduled_date >= '2025-07-01'
  AND scheduled_date < '2025-08-01'
  AND status != 'deleted'
GROUP BY platform;
```

## 수동 생성 방법

특정 채널만 생성하고 싶다면:

```sql
-- 예: 인스타그램 콘텐츠만 생성
INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
VALUES 
('7월 여름 특집', '시원한 여름 골프를 위한 필수템', 'instagram', 'idea', '스테피', '2025-07-10', '여름,특집');
```

## 디버깅 체크리스트

- [ ] SQL 함수가 존재하는가?
- [ ] 함수 실행 권한이 있는가?
- [ ] content_ideas 테이블 권한이 있는가?
- [ ] 이미 해당 월에 콘텐츠가 있는가?
- [ ] 월별 테마가 설정되어 있는가?

## 문의

추가 문제가 있으면 에러 메시지와 함께 알려주세요!