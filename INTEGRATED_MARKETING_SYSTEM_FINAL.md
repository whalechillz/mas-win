# 마케팅 통합 관리 시스템 기획서 (최종본)

## 🎯 프로젝트 개요

### 목표
기존 어드민 시스템의 모든 기능을 유지하면서, 새로운 "통합 마케팅 관리" 탭을 추가하여 1년치 캠페인과 테마를 체계적으로 관리하는 시스템 구축

### 핵심 특징
- **역할 기반 워크플로우**: 개발자(MCP 작업) vs 관리자/직원(UI 작업)
- **초안 재활용 시스템**: 퍼널 페이지와 광고 소재를 기반으로 멀티채널 콘텐츠 자동 생성
- **통합 파일 관리**: 모든 마케팅 자료가 프로젝트 내에서 체계적으로 관리

## 📂 최종 파일 구조

```
/win.masgolf.co.kr/
├── components/admin/marketing/
│   ├── MarketingDashboard.tsx (기존 유지)
│   └── integrated/
│       ├── IntegratedMarketingHub.tsx    # 메인 컴포넌트
│       ├── FunnelPlanManager.tsx         # 1. 월별 퍼널 관리
│       ├── FunnelPageBuilder.tsx         # 2. 퍼널페이지 구성 (MCP)
│       ├── GoogleAdsManager.tsx          # 3. 구글애드 관리 (MCP)
│       ├── ContentGenerator.tsx          # 4. AI 콘텐츠 생성
│       ├── ContentValidator.tsx          # 5. AI 콘텐츠 검증
│       └── KPIManager.tsx               # 6. KPI/효율 관리
├── pages/
│   ├── api/
│   │   └── integrated/                   # 통합 마케팅 API
│   │       ├── funnel-plans.ts
│   │       ├── funnel-pages.ts
│   │       ├── google-ads-utm.ts
│   │       ├── contents.ts
│   │       ├── validate-content.ts
│   │       └── kpi.ts
│   └── funnel/
│       └── [slug].tsx                    # 퍼널 페이지 동적 라우팅
└── public/
    ├── campaigns/                        # 광고 캠페인 자료
    │   ├── 2025-05-가정의달/
    │   └── 2025-06-프라임타임/
    └── funnel-pages/                     # 퍼널 페이지 HTML
        ├── funnel-2025-05.html
        └── funnel-2025-07.html
```

## 🛠️ 구현 완료 현황

### ✅ 대화창 1: 데이터베이스 스키마 및 API 구축
- [x] 데이터베이스 테이블 생성
  - `monthly_funnel_plans`
  - `funnel_pages`
  - `generated_contents`
  - `monthly_kpis`
- [x] API 엔드포인트 구현
  - 퍼널 관리 API
  - 콘텐츠 생성/검증 API
  - KPI 관리 API

### ✅ 대화창 2: KPIManager 컴포넌트 구현
- [x] KPIManager.tsx 컴포넌트 생성
- [x] 채널별 KPI 대시보드
- [x] 직원별 블로그 할당량 관리
- [x] 효율성 분석 및 리포트
- [x] 실시간 데이터 시각화 (Recharts)

### ✅ 대화창 3: MCP 연동 기능 구현
- [x] FunnelPageBuilder - 퍼널 페이지 HTML 생성
  - 캠페인 이미지 갤러리
  - MCP로 HTML 파일 생성
  - 실제 접근 가능한 URL 생성
- [x] GoogleAdsManager - 광고 소재 CSV 생성
  - UTM 태그 자동 생성
  - Google Ads 업로드 형식 CSV
  - 캠페인 이미지 참조
- [x] ContentGenerator - 멀티채널 콘텐츠 생성
  - 퍼널 페이지 초안 활용
  - 채널별 최적화 콘텐츠
  - MCP로 파일 생성

## 🚀 시스템 워크플로우

### 1단계: 월별 계획 수립 (관리자)
```
FunnelPlanManager → 월별 테마, 타겟, 전략 설정
```

### 2단계: 초안 제작 (개발자 - MCP)
```
FunnelPageBuilder → 퍼널 페이지 초안 (/funnel-2025-07)
GoogleAdsManager → 광고 소재 초안 (CSV, 이미지)
```

### 3단계: 콘텐츠 생성 (관리자/직원)
```
ContentGenerator → 초안 기반 멀티채널 콘텐츠 자동 생성
- 블로그 (.md)
- 이메일 (.html)
- 카카오/SMS (.txt)
- 인스타그램 (.json)
```

### 4단계: 검증 및 최적화 (자동)
```
ContentValidator → SEO, 가독성, 브랜드 일관성 검증
```

### 5단계: 성과 관리 (관리자)
```
KPIManager → 실시간 성과 추적, 직원 관리
```

## 💡 핵심 혁신 포인트

### 1. 역할 기반 접근
- **개발자**: MCP를 통한 창의적 초안 작업 (2, 3번)
- **관리자/직원**: UI를 통한 효율적 관리 (1, 4, 5, 6번)

### 2. 초안 재활용 시스템
- 퍼널 페이지의 헤드라인, CTA, 혜택 → 모든 채널 콘텐츠에 자동 반영
- 캠페인 이미지 → 모든 채널에서 재사용

### 3. 통합 파일 관리
- `/public/campaigns/`: 모든 캠페인 자료 중앙 관리
- `/public/funnel-pages/`: 실제 서비스되는 퍼널 페이지
- `/contents/`: 채널별 콘텐츠 파일

## 🗄️ 데이터베이스 스키마 (구현 완료)

```sql
-- 월별 퍼널 계획
CREATE TABLE monthly_funnel_plans (
  id UUID PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  theme VARCHAR(255),
  funnel_data JSONB,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 퍼널 페이지
CREATE TABLE funnel_pages (
  id UUID PRIMARY KEY,
  funnel_plan_id UUID REFERENCES monthly_funnel_plans(id),
  page_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 생성된 콘텐츠
CREATE TABLE generated_contents (
  id UUID PRIMARY KEY,
  funnel_plan_id UUID REFERENCES monthly_funnel_plans(id),
  channel VARCHAR(50),
  content TEXT,
  validation_score JSONB,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 월별 KPI
CREATE TABLE monthly_kpis (
  id UUID PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  kpi_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 직원 블로그 할당
CREATE TABLE employee_blog_quotas (
  id UUID PRIMARY KEY,
  employee_id VARCHAR(255),
  employee_name VARCHAR(255),
  year INTEGER,
  month INTEGER,
  blog_quota INTEGER DEFAULT 0,
  blogs_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📊 예상 효과

1. **효율성 향상**: 월별 마케팅 전략 수립 시간 70% 단축
2. **일관성 유지**: 모든 채널에서 통일된 메시지 전달
3. **성과 측정**: 실시간 KPI 추적으로 즉각적인 개선
4. **자동화**: AI 활용으로 콘텐츠 생성 시간 80% 절감
5. **협업 강화**: 직원별 할당량 관리로 팀 효율성 증대

## 🔄 시스템 통합 포인트

1. **기존 시스템과의 연동**
   - MarketingDashboard 컴포넌트 유지
   - 기존 API 구조 활용
   - 기존 인증 시스템 사용

2. **MCP 활용 전략**
   - 창의적 작업은 MCP로 직접 처리
   - 반복적 작업은 UI/API로 자동화
   - 파일 시스템 직접 접근으로 빠른 배포

3. **확장 가능성**
   - 네이버 광고, 페이스북 광고 등 추가 채널 확장 가능
   - AI 모델 업그레이드 시 즉시 적용 가능
   - 다국어 지원 확장 가능

---

**작성일**: 2025년 1월 20일  
**버전**: 1.0 (최종)  
**상태**: 대화창 1-3 구현 완료
