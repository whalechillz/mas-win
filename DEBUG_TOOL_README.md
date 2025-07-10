# Supabase 406 에러 디버그 툴 사용 가이드

## 🚨 문제 상황
- Supabase API 호출 시 406 Not Acceptable 에러 발생
- RLS (Row Level Security) 또는 권한 문제로 인한 접근 거부

## 🛠️ 디버그 툴 사용법

### 1. 디버그 툴 실행
```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 접속
http://localhost:3000/debug-tool
```

### 2. Service Role Key 설정
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택 → Settings → API
3. `service_role` 키 복사 (⚠️ 절대 공개하지 마세요!)
4. 디버그 툴의 "Service Role Key" 입력란에 붙여넣기
5. "Use Service Role Key" 체크박스 선택

### 3. 테스트 실행
- "Run Debug Tests" 버튼 클릭
- 각 테스트 결과 확인:
  - ✅ PASSED: 정상 작동
  - ❌ FAILED: 문제 발생 (에러 메시지 확인)

### 4. Quick Fixes 사용
- **Disable All RLS**: 모든 테이블의 RLS 비활성화
- **Grant Public Permissions**: anon 사용자에게 전체 권한 부여

## 📝 코드 수정 방법

### Admin.tsx 수정
```typescript
// pages/admin.tsx

// 기존 코드 (anon key 사용)
const supabaseKey = 'eyJhbGc...'; 

// 수정된 코드 (service role key 사용)
const supabaseKey = 'YOUR-SERVICE-ROLE-KEY-HERE';
```

### 환경 변수 설정 (.env.local)
```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://yyytjudftvpmcnppaymw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY-HERE
```

## 🔍 주요 테스트 항목

1. **Basic Connection Test**: Supabase 연결 확인
2. **RLS Check**: 각 테이블의 RLS 상태 확인
3. **Auth Status Check**: 인증 상태 확인
4. **Database Permissions**: 데이터베이스 권한 확인
5. **Insert Permission Test**: 쓰기 권한 테스트
6. **API Endpoint Test**: API 헬스 체크

## ⚡ 빠른 해결책

### 옵션 1: Service Role Key 사용 (권장)
- 가장 빠르고 확실한 해결 방법
- 모든 권한을 가진 키 사용
- ⚠️ 프로덕션에서는 보안 주의 필요

### 옵션 2: RLS 비활성화
```sql
ALTER TABLE blog_platforms DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_contents DISABLE ROW LEVEL SECURITY;
-- 모든 테이블에 대해 반복
```

### 옵션 3: 권한 부여
```sql
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;
```

## 🔐 보안 주의사항

1. **Service Role Key는 절대 클라이언트 사이드에 노출하지 마세요**
2. 프로덕션에서는 적절한 RLS 정책 설정 필수
3. 개발 환경에서만 RLS 비활성화 사용
4. API Routes를 통해 서버 사이드에서 Service Role Key 사용

## 📞 추가 지원

문제가 지속되면:
1. Supabase Dashboard의 Logs 확인
2. Network 탭에서 실제 API 응답 확인
3. 디버그 툴의 상세 에러 메시지 분석