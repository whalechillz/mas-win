# Supabase SQL 실행 가이드

## 데이터베이스 스키마 확장 실행

Supabase는 보안상의 이유로 직접 SQL 실행을 제한하므로, Supabase 대시보드에서 수동으로 실행해야 합니다.

### 실행 방법

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭
   - "New query" 클릭

3. **SQL 파일 내용 복사**
   - `database/extend-products-table-for-drivers.sql` 파일 열기
   - 전체 내용 복사

4. **SQL 실행**
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭 (또는 Cmd/Ctrl + Enter)

5. **결과 확인**
   - "Success. No rows returned" 메시지 확인
   - 또는 각 ALTER TABLE 문이 성공적으로 실행되었는지 확인

### 실행할 SQL 파일

```
database/extend-products-table-for-drivers.sql
```

### 실행 후 확인

스키마 확장이 완료되었는지 확인:

```bash
node scripts/check-products-table-schema.js
```

모든 컬럼이 추가되었으면 드라이버 제품 마이그레이션을 진행할 수 있습니다:

```bash
node scripts/migrate-driver-products-to-db.js
```

