# 예약관리 삭제 기능 RLS 정책 수정 가이드

## 문제 상황
예약관리에서 데이터 삭제가 작동하지 않는 이유는 **RLS (Row Level Security) 정책**에서 DELETE 권한이 없기 때문입니다.

## 해결 방법

### 1. Supabase 대시보드 접속
1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. `win.masgolf.co.kr` 프로젝트 선택
3. 왼쪽 메뉴에서 **"SQL Editor"** 클릭

### 2. RLS 정책 수정 SQL 실행
다음 SQL을 복사하여 SQL Editor에 붙여넣고 실행:

```sql
-- 예약관리 삭제 기능을 위한 RLS 정책 수정

-- 1. 기존 정책 삭제 (중복 방지)
DROP POLICY IF EXISTS "allow_anonymous_delete_bookings" ON public.bookings;
DROP POLICY IF EXISTS "allow_anonymous_update_bookings" ON public.bookings;
DROP POLICY IF EXISTS "allow_anonymous_delete_contacts" ON public.contacts;
DROP POLICY IF EXISTS "allow_anonymous_update_contacts" ON public.contacts;

-- 2. bookings 테이블 RLS 정책 추가
-- 모든 사용자가 DELETE 가능 (관리자용)
CREATE POLICY "allow_anonymous_delete_bookings" ON public.bookings
FOR DELETE 
TO anon
USING (true);

-- 모든 사용자가 UPDATE 가능 (관리자용)
CREATE POLICY "allow_anonymous_update_bookings" ON public.bookings
FOR UPDATE 
TO anon
USING (true)
WITH CHECK (true);

-- 3. contacts 테이블 RLS 정책 추가
-- 모든 사용자가 DELETE 가능 (관리자용)
CREATE POLICY "allow_anonymous_delete_contacts" ON public.contacts
FOR DELETE 
TO anon
USING (true);

-- 모든 사용자가 UPDATE 가능 (관리자용)
CREATE POLICY "allow_anonymous_update_contacts" ON public.contacts
FOR UPDATE 
TO anon
USING (true)
WITH CHECK (true);

-- 4. 정책 확인
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('bookings', 'contacts')
ORDER BY tablename, policyname;
```

### 3. 실행 후 확인
- SQL 실행 후 "정책 확인" 쿼리 결과에서 다음 정책들이 보이는지 확인:
  - `allow_anonymous_delete_bookings`
  - `allow_anonymous_update_bookings`
  - `allow_anonymous_delete_contacts`
  - `allow_anonymous_update_contacts`

### 4. 테스트
1. 관리자 페이지 접속: `http://localhost:3000/admin`
2. 예약관리 탭에서 삭제 버튼 클릭
3. 개발자 도구 콘솔에서 상세 로그 확인

## 추가 디버깅
만약 여전히 삭제가 안 된다면:

1. **개발자 도구 콘솔 확인**
   - 삭제 버튼 클릭 시 상세 로그 출력
   - 오류 코드와 메시지 확인

2. **네트워크 탭 확인**
   - DELETE 요청이 실제로 발생하는지 확인
   - 응답 상태 코드 확인

3. **Supabase 로그 확인**
   - Supabase 대시보드 > Logs에서 오류 확인

## 주의사항
- 이 정책은 모든 사용자(anon)에게 DELETE 권한을 부여합니다
- 프로덕션 환경에서는 더 엄격한 권한 관리가 필요할 수 있습니다
- 관리자 인증 시스템 구현을 권장합니다 