# 🚨 디버그 페이지 오류 해결 가이드

## 문제 해결 단계

### 1. 환경 변수 확인
`.env.local` 파일에 다음 변수들이 제대로 설정되어 있는지 확인하세요:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://yyytjudftvpmcnppaymw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE
SUPABASE_SERVICE_ROLE_KEY=[서비스 롤 키가 여기 있어야 함]
```

### 2. Supabase 테이블 생성
Supabase 대시보드의 SQL Editor에서 다음 파일들을 실행하세요:

1. **테이블 생성**: `database/campaign-tracking-schema.sql`
2. **RLS 정책 수정**: `database/fix-rls-permissions.sql`

### 3. 서버 재시작
```bash
# 개발 서버 재시작
npm run dev
```

### 4. 테스트 순서
1. `/debug-tracking` 페이지 접속
2. 환경 설정 섹션에서 모든 환경변수가 "✅ 설정됨"으로 표시되는지 확인
3. "테스트 조회수 추가" 버튼 클릭
4. 데이터가 표시되는지 확인

## 🔧 추가 디버깅 팁

### API 직접 테스트
```javascript
// 브라우저 콘솔에서 실행
fetch('/api/track-view', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaign_id: '2025-07',
    page: '/test-page'
  })
}).then(res => res.json()).then(console.log)
```

### Supabase 연결 테스트
```javascript
// 브라우저 콘솔에서 실행
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://yyytjudftvpmcnppaymw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE'
)

// 테스트 쿼리
supabase.from('page_views').select('count', { count: 'exact', head: true })
  .then(({ data, error }) => console.log('Test result:', { data, error }))
```

## ⚠️ 자주 발생하는 문제

1. **CORS 오류**: Supabase 대시보드에서 API 설정 확인
2. **RLS 정책 오류**: anon 사용자에게 읽기 권한이 있는지 확인
3. **환경변수 누락**: `.env.local` 파일이 프로젝트 루트에 있는지 확인
4. **테이블 없음**: SQL 스키마가 제대로 실행되었는지 확인

## 📞 추가 지원이 필요하면
- Supabase 대시보드에서 로그 확인
- 브라우저 개발자 도구의 네트워크 탭 확인
- `/api/track-view` 응답 확인