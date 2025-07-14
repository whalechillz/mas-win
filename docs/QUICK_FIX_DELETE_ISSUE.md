# 🚨 멀티채널 삭제 문제 - 빠른 해결 가이드

## 문제: "409 Conflict" 에러 발생 시

### 원인
```
foreign key constraint "naver_publishing_content_idea_id_fkey"
```

### 즉시 해결법
```sql
-- 삭제하려는 데이터를 'deleted' 상태로 변경
UPDATE content_ideas 
SET status = 'deleted'
WHERE title = '삭제하려는 제목';
```

### 컴포넌트 확인사항
✅ `loadContents()` 함수에 `.neq('status', 'deleted')` 포함  
✅ `deleteContent()` 함수가 `update({ status: 'deleted' })` 사용  
✅ `getStatusColor()` 함수에 `case 'deleted'` 추가  

### 파일 위치
📁 `/components/admin/marketing/MultiChannelManager.tsx`

---
💡 **TIP**: 실제 DELETE가 필요하면 먼저 `naver_publishing` 테이블에서 참조 삭제!