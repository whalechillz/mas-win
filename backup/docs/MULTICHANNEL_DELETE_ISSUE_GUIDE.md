# 🔴 멀티채널 관리 시스템 - 삭제 문제 해결 가이드

## 문제 상황
**날짜**: 2025년 1월 14일  
**증상**: content_ideas 테이블에서 데이터 삭제 시 409 Conflict 에러 발생

### 에러 메시지
```
update or delete on table "content_ideas" violates foreign key constraint "naver_publishing_content_idea_id_fkey" on table "naver_publishing"
```

## 🔍 원인 분석

### 1. 외래 키 제약조건
- `naver_publishing` 테이블이 `content_ideas.id`를 참조
- PostgreSQL의 `RI_ConstraintTrigger` 시스템 트리거가 자동으로 외래 키 무결성 검사
- Supabase에서는 시스템 트리거를 직접 비활성화할 수 없음

### 2. 권한 문제
- RLS(Row Level Security) 정책과는 무관
- DELETE 권한은 있지만 외래 키 제약으로 인해 실행 불가

## ✅ 해결 방법: 소프트 삭제(Soft Delete)

### 1. 컴포넌트 수정 (MultiChannelManager.tsx)

```javascript
// 1. loadContents 함수 - deleted 상태 제외
const loadContents = async () => {
  let query = supabase
    .from('content_ideas')
    .select('*')
    .neq('status', 'deleted')  // 'deleted' 상태 제외
    .order('created_at', { ascending: false });
  // ...
};

// 2. deleteContent 함수 - 실제 삭제 대신 상태 변경
const deleteContent = async (content) => {
  const { error } = await supabase
    .from('content_ideas')
    .update({ status: 'deleted' })  // DELETE 대신 UPDATE
    .eq('id', content.id);
  // ...
};

// 3. getStatusColor 함수 - deleted 상태 색상 추가
case 'deleted': return 'bg-red-100 text-red-700';
```

### 2. 데이터베이스 처리

```sql
-- 불필요한 데이터를 deleted 상태로 변경
UPDATE content_ideas 
SET status = 'deleted'
WHERE title IN ('삭제하려는 제목들');

-- deleted 상태를 제외하고 조회
SELECT * FROM content_ideas 
WHERE status != 'deleted';
```

## 💡 장점

1. **외래 키 제약 회피**: 참조 관계를 유지하면서 논리적 삭제
2. **복구 가능**: 실수로 삭제해도 상태만 변경하면 복구 가능
3. **이력 추적**: 삭제된 데이터도 DB에 보관되어 감사(audit) 가능
4. **성능**: DELETE보다 UPDATE가 일반적으로 더 빠름

## ⚠️ 주의사항

### 만약 실제 삭제가 필요한 경우:
1. 먼저 참조하는 테이블에서 데이터 삭제
   ```sql
   DELETE FROM naver_publishing WHERE content_idea_id = '삭제할ID';
   DELETE FROM content_ideas WHERE id = '삭제할ID';
   ```

2. 또는 CASCADE 옵션 사용 (주의! 관련 데이터 모두 삭제)
   ```sql
   DELETE FROM content_ideas WHERE id = '삭제할ID' CASCADE;
   ```

## 📋 체크리스트

- [ ] MultiChannelManager.tsx에 소프트 삭제 구현
- [ ] loadContents에서 deleted 상태 제외
- [ ] status 드롭다운에 'deleted' 옵션 추가 (선택사항)
- [ ] 정기적으로 오래된 deleted 데이터 정리 (선택사항)

## 🔗 관련 파일

- `/components/admin/marketing/MultiChannelManager.tsx`
- `/database/content-ideas-table.sql`
- `/database/soft-delete-solution.sql`

---
작성일: 2025-01-14  
작성자: AI Assistant  
최종 수정: 소프트 삭제 구현 완료