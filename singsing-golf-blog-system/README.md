# 🏌️ 싱싱골프투어 블로그 시스템

프리미엄 골프 투어 전문 블로그 관리 시스템입니다.

## ✨ 주요 기능

### 📝 블로그 관리
- 게시물 작성/편집/삭제
- 카테고리 및 태그 관리
- SEO 최적화
- 이미지 업로드 및 관리

### 🖼️ 갤러리 관리
- 이미지 업로드 및 분류
- 카테고리별 관리
- 태그 시스템
- Supabase Storage 연동

### 📅 콘텐츠 캘린더
- 일정별 콘텐츠 계획
- 멀티채널 콘텐츠 생성
- AI 기반 콘텐츠 개선

### 🔄 네이버 블로그 마이그레이션
- 네이버 블로그 스크래핑
- 자동 콘텐츠 이전
- 이미지 다운로드 및 저장

### 🤖 AI 기능
- AI 콘텐츠 생성
- AI 이미지 생성
- 단락별 이미지 일괄생성
- 스마트 프롬프트 생성

## 🚀 빠른 시작

### 1. 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env.local
# .env.local 파일을 편집하여 필요한 환경 변수 설정
```

### 3. 개발 서버 실행
```bash
npm run dev
```

## 📁 프로젝트 구조

```
singsing-golf-blog-system/
├── src/
│   ├── pages/
│   │   ├── api/           # API 라우트
│   │   └── admin/         # 관리자 페이지
│   ├── lib/               # 유틸리티 함수
│   └── styles/            # 스타일 파일
├── docs/                  # 문서
├── database/              # 데이터베이스 스키마
├── config/                # 설정 파일
└── assets/                # 정적 자산
```

## 🔧 기술 스택

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: NextAuth.js
- **AI**: OpenAI GPT-4o-mini, DALL-E 3
- **Deployment**: Vercel

## 📚 문서

- [설치 가이드](docs/installation-guide.md)
- [브랜드 커스터마이징](docs/brand-customization.md)
- [데이터베이스 구조](database/database-schema.md)

## 🎯 싱싱골프투어 특화 기능

### 브랜드 전략
- 리무진 버스 골프 투어 테마
- 프리미엄 서비스 강조
- 2박3일 패키지 마케팅

### 콘텐츠 최적화
- 골프 투어 관련 키워드
- 지역별 골프장 정보
- 투어 일정 및 요금 정보

### 이미지 생성
- 골프장 전경
- 리무진 버스
- 투어 그룹 장면
- 프리미엄 서비스 분위기

## 🔒 보안

- 환경 변수를 통한 API 키 관리
- NextAuth.js를 통한 인증
- Supabase RLS (Row Level Security)
- CORS 설정

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 환경 변수 설정
2. 데이터베이스 연결
3. API 키 유효성
4. 브라우저 콘솔 오류

## 📄 라이선스

이 프로젝트는 싱싱골프투어 전용으로 개발되었습니다.

---

**싱싱골프투어** - 편안한 리무진 골프투어 🏌️‍♂️
