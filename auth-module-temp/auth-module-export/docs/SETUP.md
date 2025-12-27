# 설치 및 설정 가이드

## 1. 프로젝트 준비

### Next.js 프로젝트 생성 (없는 경우)

```bash
npx create-next-app@latest your-project-name
cd your-project-name
```

### 기존 프로젝트에 통합

기존 Next.js 프로젝트가 있다면 바로 다음 단계로 진행하세요.

## 2. 파일 복사

### 방법 1: 수동 복사

```bash
# 프로젝트 루트에서
mkdir -p src/lib src/app/login src/utils

# 파일 복사
cp auth-module-export/src/lib/supabase.ts src/lib/
cp auth-module-export/src/app/login/page.tsx src/app/login/
cp auth-module-export/src/utils/phoneUtils.ts src/utils/
```

### 방법 2: Git Submodule (선택사항)

```bash
git submodule add https://github.com/your-org/auth-module.git auth-module
```

## 3. 의존성 설치

```bash
# 필수 패키지
npm install @supabase/supabase-js

# UI 라이브러리 (로그인 페이지에서 사용)
npm install lucide-react

# TypeScript 타입 (개발 의존성)
npm install -D @types/node @types/react
```

## 4. 환경 변수 설정

### .env.local 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# 선택사항: 애플리케이션 설정
NEXT_PUBLIC_APP_NAME=YourAppName
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입/로그인
2. 새 프로젝트 생성
3. Settings → API에서 URL과 anon key 복사

## 5. 데이터베이스 설정

### Supabase SQL Editor에서 실행

1. Supabase 대시보드 → SQL Editor
2. `database/schema.sql` 파일 내용 복사
3. 실행하여 `employees` 테이블 생성

### 샘플 데이터 추가 (선택사항)

```sql
INSERT INTO employees (employee_id, name, phone, email, password_hash, status)
VALUES 
  ('EMP-001', '홍길동', '010-1234-5678', 'hong@example.com', '12345678', 'active'),
  ('EMP-002', '김철수', '010-2345-6789', 'kim@example.com', '23456789', 'active');
```

## 6. 타입 정의 커스터마이징

`src/lib/supabase.ts` 파일의 `Employee` 인터페이스를 프로젝트에 맞게 수정:

```typescript
export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  phone: string;
  // 프로젝트별 필드 추가
  department?: string;
  role?: string;
  // ...
}
```

## 7. 로그인 페이지 커스터마이징

### 리다이렉트 경로 변경

`src/app/login/page.tsx` 파일에서:

```typescript
// 로그인 성공 후 이동할 경로
router.push('/dashboard'); // 또는 '/home', '/tasks' 등
```

### 브랜딩 변경

```typescript
// 앱 이름 및 부제목 변경
<h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
  YOUR_APP_NAME
</h2>
<p className="mt-2 text-center text-lg text-gray-600">
  YOUR_SUBTITLE
</p>
```

### 로고 변경

```typescript
// 로고 아이콘 또는 이미지 변경
<div className="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl">
  {/* 커스텀 로고 */}
</div>
```

## 8. 테스트

### 개발 서버 실행

```bash
npm run dev
```

### 브라우저에서 확인

1. http://localhost:3000/login 접속
2. 샘플 데이터로 로그인 테스트
   - 전화번호: `010-1234-5678`
   - 비밀번호: `12345678` (또는 전화번호 뒷 8자리)

## 9. 문제 해결

### 문제: "전화번호를 찾을 수 없습니다"

**해결**: 
- 데이터베이스에 해당 전화번호로 직원 데이터가 있는지 확인
- `status`가 'active'인지 확인

### 문제: 환경 변수를 찾을 수 없음

**해결**:
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- `NEXT_PUBLIC_` 접두사가 있는지 확인
- 개발 서버 재시작

### 문제: TypeScript 타입 오류

**해결**:
- `@types/node`, `@types/react` 설치 확인
- `tsconfig.json` 설정 확인

## 10. 다음 단계

- [배포 가이드](./DEPLOYMENT.md) 참고하여 GitHub/Vercel에 배포
- 보안 강화: 비밀번호 해싱 구현
- 추가 기능: 비밀번호 재설정, 이메일 인증 등

