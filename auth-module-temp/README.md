# 로그인/로그아웃 모듈 - 재사용 가이드

이 모듈은 MASLABS 프로젝트에서 사용된 로그인/로그아웃 기능을 다른 프로젝트에서 재사용할 수 있도록 패키징한 것입니다.

## 📦 포함된 파일

```
auth-module-export/
├── src/
│   ├── lib/
│   │   └── supabase.ts          # 인증 핵심 로직
│   ├── app/
│   │   └── login/
│   │       └── page.tsx          # 로그인 페이지 컴포넌트
│   └── utils/
│       └── phoneUtils.ts         # 전화번호 유틸리티 함수
├── database/
│   └── schema.sql                # 데이터베이스 스키마
├── docs/
│   ├── SETUP.md                  # 설치 및 설정 가이드
│   └── DEPLOYMENT.md             # 배포 가이드 (GitHub, Vercel)
└── README.md                      # 이 파일
```

## 🚀 빠른 시작

### 1. 파일 복사

프로젝트 루트에 다음 구조로 파일을 복사하세요:

```bash
# Next.js 프로젝트 구조에 맞춰 복사
cp -r src/lib/supabase.ts YOUR_PROJECT/src/lib/
cp -r src/app/login/page.tsx YOUR_PROJECT/src/app/login/
cp -r src/utils/phoneUtils.ts YOUR_PROJECT/src/utils/
```

### 2. 의존성 설치

```bash
npm install @supabase/supabase-js next react react-dom
npm install -D typescript @types/react @types/node
npm install lucide-react  # 아이콘 라이브러리
```

### 3. 환경 변수 설정

`.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 데이터베이스 설정

`database/schema.sql` 파일을 Supabase에서 실행하여 `employees` 테이블을 생성하세요.

## 📚 주요 기능

### 인증 메서드

- `auth.signInWithPhone(phone, password)` - 전화번호로 로그인
- `auth.signInWithEmployeeId(employeeId, password)` - 사번으로 로그인
- `auth.signInWithPin(userIdentifier, pinCode)` - 핀번호로 로그인
- `auth.signOut()` - 로그아웃
- `auth.getCurrentUser()` - 현재 사용자 정보 가져오기
- `auth.updatePassword(newPassword)` - 비밀번호 변경
- `auth.updateProfile(updates)` - 프로필 업데이트

### 사용 예시

```typescript
import { auth } from '@/lib/supabase';

// 로그인
try {
  await auth.signInWithPhone('010-1234-5678', 'password123');
  router.push('/dashboard');
} catch (error) {
  console.error('로그인 실패:', error);
}

// 현재 사용자 확인
const user = await auth.getCurrentUser();
if (user) {
  console.log('로그인된 사용자:', user.name);
}

// 로그아웃
await auth.signOut();
router.push('/login');
```

## 🔧 커스터마이징

### 로그인 성공 후 리다이렉트 경로 변경

`src/app/login/page.tsx` 파일에서:

```typescript
// 64번째 줄 근처
router.push('/dashboard'); // 원하는 경로로 변경
```

### 브랜딩 변경

`src/app/login/page.tsx` 파일에서:

```typescript
// 82-87번째 줄 근처
<h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
  YOUR_APP_NAME  // 앱 이름 변경
</h2>
<p className="mt-2 text-center text-lg text-gray-600">
  YOUR_SUBTITLE  // 부제목 변경
</p>
```

### localStorage 키 변경

`src/lib/supabase.ts` 파일에서:

```typescript
// 14번째 줄
storageKey: 'your-app-auth', // 프로젝트별로 변경
```

## 📖 상세 문서

- [설치 및 설정 가이드](./docs/SETUP.md)
- [배포 가이드 (GitHub, Vercel)](./docs/DEPLOYMENT.md)

## ⚠️ 주의사항

1. **보안**: 현재 비밀번호는 평문으로 비교됩니다. 프로덕션 환경에서는 반드시 해싱(bcrypt 등)을 사용하세요.

2. **환경 변수**: `.env.local` 파일은 절대 Git에 커밋하지 마세요.

3. **데이터베이스**: `employees` 테이블의 스키마를 프로젝트에 맞게 수정하세요.

## 📝 라이선스

MASLABS 내부 사용 전용

## 🤝 지원

문제가 발생하면 다음을 확인하세요:

1. 환경 변수가 올바르게 설정되었는지
2. 데이터베이스 스키마가 올바르게 생성되었는지
3. 의존성이 모두 설치되었는지

