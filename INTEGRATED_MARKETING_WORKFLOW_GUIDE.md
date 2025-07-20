# 통합 마케팅 관리 시스템 워크플로우 가이드

## 🎯 시스템 개요

### 역할 분담
1. **개발자 (MCP 사용)**: 2번, 3번 컴포넌트로 초안 제작
2. **관리자/직원**: 1번, 4번, 5번, 6번 컴포넌트로 AI 활용 콘텐츠 생성

### 폴더 구조
```
/win.masgolf.co.kr/
├── public/
│   ├── campaigns/           # 광고 캠페인 자료 (이미지, 소재 등)
│   │   ├── 2025-05-가정의달/
│   │   └── 2025-06-프라임타임/
│   └── funnel-pages/       # 실제 퍼널 페이지들
│       ├── funnel-2025-05.html
│       └── funnel-2025-07.html
```

## 📋 전체 워크플로우

### 1단계: 월별 퍼널 계획 수립 (FunnelPlanManager)
- 관리자가 월별 테마와 퍼널 전략 설정
- 타겟 고객, 목표, 채널별 전략 정의

### 2단계: 퍼널 페이지 초안 제작 (FunnelPageBuilder) - MCP 작업
1. **개발자가 직접 작업**
   - 히어로 이미지 업로드 또는 캠페인 폴더에서 선택
   - 헤드라인, 서브 헤드라인, CTA 작성
   - 주요 혜택 입력
   
2. **MCP로 HTML 생성**
   - "MCP로 HTML 생성" 버튼 클릭
   - 생성된 HTML 경로 복사
   - Claude MCP로 실제 파일 생성: `/public/funnel-pages/funnel-2025-07.html`
   
3. **접근 URL**
   - `https://win.masgolf.co.kr/funnel-2025-07`

### 3단계: 광고 소재 초안 제작 (GoogleAdsManager) - MCP 작업
1. **캠페인 생성**
   - 캠페인 이름, UTM 태그 설정
   
2. **광고 카피 생성**
   - AI 광고 카피 생성 버튼으로 자동 생성
   - 필요시 수정
   
3. **CSV 파일 생성**
   - "MCP로 CSV 생성" 버튼 클릭
   - Google Ads 업로드용 CSV 생성
   - 이미지 경로: `/campaigns/2025-07-[이미지명]`

### 4단계: 멀티채널 콘텐츠 생성 (ContentGenerator)
1. **초안 활용**
   - 2단계에서 만든 퍼널 페이지 데이터 자동 로드
   - 3단계의 캠페인 이미지 선택 가능
   
2. **채널별 콘텐츠 생성**
   - 블로그, 카카오톡, SMS, 이메일, 인스타그램
   - 각 채널별 최적화된 콘텐츠 생성
   
3. **파일 생성**
   - "MCP로 파일 생성" 버튼으로 각 채널별 파일 생성
   - 파일 경로 목록 복사

### 5단계: 콘텐츠 검증 (ContentValidator)
- SEO 점수, 가독성, 브랜드 일관성 검증
- AI 피드백 기반 개선

### 6단계: KPI 관리 (KPIManager)
- 채널별 성과 추적
- 직원별 할당량 관리
- 월별 보고서 생성

## 🚀 MCP 활용 예시

### 퍼널 페이지 생성
```bash
# FunnelPageBuilder에서 생성된 HTML 내용을 복사 후
# Claude MCP로 파일 생성
/public/funnel-pages/funnel-2025-07.html

# Git 커밋
git add public/funnel-pages/funnel-2025-07.html
git commit -m "Add July 2025 funnel page"
git push

# Vercel 자동 배포
```

### 광고 소재 CSV
```bash
# GoogleAdsManager에서 생성된 CSV 내용을 복사 후
# Claude MCP로 파일 생성
/public/google-ads/google-ads-creatives-2025-07.csv
```

### 멀티채널 콘텐츠
```bash
# ContentGenerator에서 생성된 파일들
/contents/blog/blog-2025-07-*.md
/contents/email/email-2025-07-*.html
/contents/kakao/kakao-2025-07-*.txt
/contents/sms/sms-2025-07-*.txt
/contents/social/instagram-2025-07-*.json
```

## 💡 핵심 포인트

1. **2번, 3번은 초안 제작 도구**
   - 시스템화하기 어려운 창의적 작업
   - MCP로 직접 파일 생성

2. **4번은 초안 활용 도구**
   - 2번, 3번에서 만든 내용 기반
   - 채널별 자동 최적화

3. **폴더 정리**
   - `/public/campaigns/`: 광고 캠페인 자료
   - `/public/funnel-pages/`: 실제 퍼널 페이지
   - `/contents/`: 각 채널별 콘텐츠

4. **URL 구조**
   - 퍼널 페이지: `/funnel-2025-07`
   - 관리자 페이지: `/admin`
