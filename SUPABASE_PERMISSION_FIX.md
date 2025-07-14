# 🔐 Supabase 권한 문제 해결 가이드

## 문제 원인

1. **환경 변수 이름 불일치** ✅ (해결됨)
   - `.env.local`: `SUPABASE_SERVICE_KEY`
   - API 코드: `SUPABASE_SERVICE_ROLE_KEY`

2. **RLS (Row Level Security) 활성화**
   - Supabase 테이블에 RLS가 켜져 있으면 anon 키로는 INSERT 불가

3. **Vercel 환경 변수 누락**
   - 배포 환경에 SERVICE KEY가 없을 수 있음

## 해결 방법

### 1. 로컬 테스트 (먼저 시도)

```bash
cd /Users/m2/MASLABS/win.masgolf.co.kr
npm run dev
```

http://localhost:3000/debug 접속 후:
1. "🔓 권한 테스트 (INSERT)" 버튼 클릭
2. 성공하면 → 권한 문제 없음
3. 실패하면 → 아래 단계 진행

### 2. Supabase에서 RLS 확인/해결

[Supabase 대시보드](https://supabase.com) → SQL Editor에서:

```sql
-- RLS 상태 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'content_ideas';

-- RLS 비활성화 (임시)
ALTER TABLE content_ideas DISABLE ROW LEVEL SECURITY;

-- 또는 정책 추가 (권장)
CREATE POLICY "Allow all for service role" ON content_ideas
FOR ALL 
USING (true)
WITH CHECK (true);
```

### 3. Vercel 환경 변수 설정

1. [Vercel 대시보드](https://vercel.com) 접속
2. win.masgolf.co.kr 프로젝트 선택
3. Settings → Environment Variables
4. 다음 변수 추가/확인:

```
SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **중요**: Service Role Key를 사용해야 합니다 (anon key 아님)

### 4. 코드 배포

```bash
git add .
git commit -m "fix: use correct env variable name for supabase"
git push
```

### 5. 디버그 페이지에서 확인

https://win.masgolf.co.kr/debug

1. "🔓 권한 테스트" 클릭 → INSERT 성공 확인
2. "📮 API 테스트" 클릭 → 콘텐츠 생성 확인

## 권한 문제 징후

- **42501**: 권한 부족
- **42P01**: 테이블/관계 없음
- **23505**: 중복 키
- **PGRST301**: JWT 역할이 스키마에 없음

## 빠른 해결책

Supabase Dashboard → Authentication → Policies에서:
1. content_ideas 테이블 선택
2. "Disable RLS" 토글 (임시)
3. 또는 "New Policy" → "Enable insert for all"

## 확인 사항

- [ ] `.env.local`에 SUPABASE_SERVICE_KEY 있음
- [ ] Vercel에 환경 변수 설정됨
- [ ] RLS 비활성화 또는 정책 추가됨
- [ ] 디버그 페이지에서 INSERT 테스트 성공

이제 디버그 페이지에서 "🔓 권한 테스트" 버튼으로 직접 확인해보세요!