# 싱싱골프투어 블로그 시스템 설치 가이드

## 🚀 빠른 시작

### 1. 필수 요구사항
- Node.js 18.x 이상
- npm 또는 yarn
- Supabase 계정
- OpenAI API 키

### 2. 프로젝트 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
```

### 3. 환경 변수 설정 (.env.local)

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI 설정
OPENAI_API_KEY=your_openai_api_key

# NextAuth 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# 이메일 설정 (선택사항)
GMAIL_APP_PASSWORD=your_gmail_app_password

# Slack 설정 (선택사항)
SLACK_WEBHOOK_URL_01_MA_OP=your_slack_webhook_url
```

### 4. 데이터베이스 설정

1. Supabase 프로젝트 생성
2. `database/database-schema.md`의 SQL 스크립트 실행
3. Storage 버킷 생성:
   - `blog-images`
   - `gallery-images`
   - `scraped-images`

### 5. 개발 서버 실행

```bash
npm run dev
```

## 🔧 주요 기능

### 블로그 관리
- 게시물 작성/편집/삭제
- 카테고리 및 태그 관리
- SEO 최적화
- 이미지 업로드

### 갤러리 관리
- 이미지 업로드 및 관리
- 카테고리별 분류
- 태그 시스템

### 콘텐츠 캘린더
- 일정별 콘텐츠 계획
- 멀티채널 콘텐츠 생성
- AI 기반 콘텐츠 개선

### 네이버 블로그 마이그레이션
- 네이버 블로그 스크래핑
- 자동 콘텐츠 이전
- 이미지 다운로드

## 🎨 브랜드 커스터마이징

### 싱싱골프투어 브랜드 설정

1. `src/lib/singsing-brand-data.js` 생성
2. 브랜드 색상, 로고, 메시지 설정
3. AI 이미지 생성 프롬프트 수정

### 색상 테마 변경
```css
/* tailwind.config.js에서 색상 커스터마이징 */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#your-brand-color',
        secondary: '#your-secondary-color'
      }
    }
  }
}
```

## 📱 배포

### Vercel 배포 (권장)
1. GitHub에 코드 푸시
2. Vercel에서 프로젝트 연결
3. 환경 변수 설정
4. 자동 배포 완료

### 기타 플랫폼
- Netlify
- AWS Amplify
- Railway

## 🔒 보안 설정

1. 환경 변수 보안 관리
2. API 키 로테이션
3. CORS 설정
4. Rate Limiting 적용

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 환경 변수 설정
2. 데이터베이스 연결
3. API 키 유효성
4. 브라우저 콘솔 오류
