# MAS Golf 웹사이트

공식 MAS Golf 웹사이트 및 캠페인 페이지

## 🏌️ 프로젝트 구조

```
win.masgolf.co.kr/
├── pages/
│   ├── admin.js                    # 관리자 대시보드
│   ├── campaign/
│   │   ├── 2025-07.js             # 7월 캠페인 라우트
│   │   └── july-2025.js           # 7월 캠페인 (환경변수 연동)
│   └── api/
│       └── slack-notify.js         # Slack 알림 API
├── public/
│   ├── assets/
│   │   └── campaigns/
│   │       └── 2025-07/           # 7월 캠페인 이미지
│   └── versions/
│       └── funnel-2025-07-complete.html  # 7월 캠페인 페이지
├── scripts/
│   └── supabase-schema.sql        # 데이터베이스 스키마
└── docs/
    └── campaign-2025-07-setup.md  # 설정 가이드

```

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
# 또는
yarn install
```

### 2. 환경 변수 설정
`.env.local` 파일 생성:
```bash
cp .env.example .env.local
```

필수 값 입력:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SLACK_WEBHOOK_URL` (선택사항)

### 3. 개발 서버 실행
```bash
npm run dev
# 또는
yarn dev
```

### 4. 빌드
```bash
npm run build
# 또는
yarn build
```

## 📱 주요 페이지

### 사용자 페이지
- **7월 캠페인**: `/campaign/2025-07` 또는 `/campaign/july-2025`
- **정적 HTML**: `/versions/funnel-2025-07-complete.html`

### 관리자 페이지
- **대시보드**: `/admin`
- Supabase 인증 필요

## 🛠 기술 스택

- **프레임워크**: Next.js
- **스타일링**: Tailwind CSS
- **데이터베이스**: Supabase
- **알림**: Slack Webhooks
- **배포**: Vercel

## 📊 캠페인 기능

### 7월 썸머 스페셜
1. **비거리 비교 애니메이션**
   - 현재 비거리 입력
   - MAS 클럽 사용 시 예상 비거리 시각화
   
2. **맞춤 클럽 추천 퀴즈**
   - 스윙 스타일 분석
   - 중요 요소 파악
   - 개인화된 제품 추천

3. **예약 및 문의**
   - 시타 예약 시스템
   - 전화 상담 연결
   - 문의 접수 폼

4. **관리자 기능**
   - 실시간 예약/문의 확인
   - 상태 관리
   - Slack 알림

## 🔐 보안

- Supabase Row Level Security 적용
- 환경 변수로 민감한 정보 관리
- 서버사이드 API로 Slack 통신

## 📞 지원

- **전화**: 080-028-8888
- **이메일**: support@masgolf.com
- **문서**: `/docs/campaign-2025-07-setup.md`

## 📝 라이선스

© 2025 MAS Golf. All rights reserved.