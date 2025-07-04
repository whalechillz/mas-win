# Vercel 환경 변수 설정 가이드

## 1. Vercel 대시보드에서 환경 변수 추가

Vercel 프로젝트 설정에서 다음 환경 변수를 추가해야 합니다:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 2. 설정 방법

1. https://vercel.com/dashboard 접속
2. win.masgolf.co.kr 프로젝트 선택
3. Settings 탭 클릭
4. Environment Variables 섹션
5. 위 변수들 추가
6. 모든 환경(Production, Preview, Development)에 적용

## 3. config.js 파일 수정 (선택사항)

환경 변수를 사용하도록 config.js를 수정할 수 있습니다:

```javascript
// Supabase 설정
const SUPABASE_CONFIG = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://YOUR_PROJECT_REF.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'
};
```

## 4. 테스트 순서

1. 배포 완료 확인
2. https://win.masgolf.co.kr/debug-test.html 접속
3. "데이터베이스 연결 테스트" 버튼 클릭
4. 연결 성공 확인
5. 실제 페이지에서 폼 제출 테스트

## 5. 문제 해결

만약 연결이 실패하면:
- 브라우저 콘솔(F12) 확인
- 네트워크 탭에서 API 호출 확인
- Supabase 대시보드에서 API 설정 확인
