# 한글 데이터 저장 문제 해결 가이드

## 문제 원인
퀴즈에서 사용자가 선택한 답변이 영어로 저장되고 있었습니다:
- swing_style: 'stability' → '안정형'으로 저장되어야 함
- priority: 'distance' → '비거리'로 저장되어야 함

## 수정 내용

### 1. HTML 파일 수정 완료
`/public/versions/funnel-2025-07-complete.html` 파일에서:

#### bookings 테이블 저장 부분:
```javascript
// 수정 전
swing_style: quizData.style || null,
priority: quizData.priorityText || quizData.priority || null,

// 수정 후
swing_style: quizData.styleText || null,  // 스윙 스타일 (한글)
priority: quizData.priorityText || null,  // Q2 답변 저장 (한글)
```

#### contacts 테이블 저장 부분도 동일하게 수정

### 2. 기존 데이터 변환

Supabase SQL Editor에서 다음 쿼리 실행:

```sql
-- bookings 테이블
UPDATE bookings
SET priority = CASE 
    WHEN priority = 'distance' THEN '비거리'
    WHEN priority = 'direction' THEN '방향성'
    WHEN priority = 'comfort' THEN '편안함'
    ELSE priority
END
WHERE priority IN ('distance', 'direction', 'comfort');

UPDATE bookings
SET swing_style = CASE 
    WHEN swing_style = 'stability' THEN '안정형'
    WHEN swing_style = 'power' THEN '파워형'
    WHEN swing_style = 'hybrid' THEN '복합형'
    ELSE swing_style
END
WHERE swing_style IN ('stability', 'power', 'hybrid');

-- contacts 테이블도 동일하게 실행
```

## 다음 단계

1. **캐시 삭제**
   - 브라우저 캐시 완전 삭제 (Ctrl+Shift+R 또는 Cmd+Shift+R)

2. **Supabase에서 기존 데이터 변환**
   - Supabase Dashboard > SQL Editor
   - `convert-to-korean.sql` 파일 내용 실행

3. **테스트**
   - 새로운 예약/문의 생성
   - 관리자 페이지에서 한글 표시 확인

## 예상 결과
관리자 페이지에서:
- 스윙타입: stability → 안정형
- 중요요소: distance → 비거리

이렇게 한글로 표시됩니다.
