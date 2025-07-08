# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub으로 로그인
4. "New project" 클릭
5. 프로젝트 정보 입력:
   - Name: masgolf-win
   - Database Password: 안전한 비밀번호 생성
   - Region: Northeast Asia (Singapore)
6. "Create new project" 클릭

## 2. 데이터베이스 테이블 생성

프로젝트가 생성되면 SQL Editor에서 다음 쿼리 실행:

```sql
-- 시타 예약 테이블
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time VARCHAR(50) NOT NULL,
    club_interest VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 문의 테이블
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    call_time VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security 활성화
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 누구나 추가할 수 있도록 정책 생성
CREATE POLICY "Enable insert for all users" ON bookings
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Enable insert for all users" ON contacts
    FOR INSERT TO anon WITH CHECK (true);

-- 읽기는 인증된 사용자만 (관리자용)
CREATE POLICY "Enable read for authenticated users only" ON bookings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read for authenticated users only" ON contacts
    FOR SELECT TO authenticated USING (true);
```

## 3. API 키 확인

1. 프로젝트 대시보드에서 "Settings" 클릭
2. 왼쪽 메뉴에서 "API" 클릭
3. 다음 정보 복사:
   - Project URL: `https://xxxxx.supabase.co`
   - anon public: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 4. config.js 수정

복사한 정보로 config.js 파일 수정:

```javascript
const SUPABASE_CONFIG = {
    url: '여기에 Project URL 붙여넣기',
    anonKey: '여기에 anon public 키 붙여넣기'
};
```

## 5. 테스트

1. 파일 저장
2. Git commit & push
3. Vercel 재배포 대기
4. https://win.masgolf.co.kr/debug-test.html 에서 테스트
