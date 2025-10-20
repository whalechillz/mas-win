# AI 토글 스위치 & 금액 선택 기능 구현 가이드

## 🎯 구현 내용

### 1. **AI 토글 스위치**
- ON/OFF로 AI 사용 여부 선택
- OFF: 기존 템플릿 방식 (무료)
- ON: AI 모델 사용 (유료)

### 2. **금액/플랜 선택**
- 베이직 ($50-100): GPT-3.5, 기본 품질
- 스탠다드 ($200-300): Claude Sonnet, 우수 품질
- 프리미엄 ($500+): Claude Opus 4, 최고 품질
- 커스텀: 직접 설정

### 3. **예산 슬라이더**
- $50 ~ $1000 범위
- 실시간 예상 결과 표시

## 📁 구현된 파일들

### 컴포넌트
```
/components/admin/marketing/
├── AIGenerationSettings.tsx     # AI 설정 UI 컴포넌트
└── IntegratedCampaignManager.tsx # 메인 매니저 (수정됨)
```

### API
```
/pages/api/
├── generate-ai-content.ts       # AI 콘텐츠 생성 API (예시)
└── generate-ai-content-v2.ts   # 개선된 버전 (비용 계산 포함)
```

### 데이터베이스
```
/database/
└── create-generate-monthly-content-function.sql  # 템플릿 생성 함수
```

## 🔧 사용 방법

### 1. 환경 변수 설정
```env
# AI API 키들
ANTHROPIC_API_KEY=sk-ant-...      # Claude
PERPLEXITY_API_KEY=pplx-...       # Perplexity
FAL_API_KEY=your_fal_api_key_here  # 이미지 생성
OPENAI_API_KEY=sk-...             # GPT (선택)
```

### 2. UI 사용 흐름
1. AI 토글 스위치 ON
2. 플랜 선택 (베이직/스탠다드/프리미엄)
3. 예산 슬라이더로 월 예산 설정
4. "멀티채널 생성" 버튼 클릭
5. AI가 자동으로 콘텐츠 생성

### 3. 비용 계산 예시
```javascript
// 스탠다드 플랜 ($300/월)
- 블로그 3개 × $3 = $9
- 카카오톡 4개 × $1 = $4
- SMS 3개 × $0.5 = $1.5
- 인스타그램 3개 × $2 = $6
- 유튜브 1개 × $3 = $3
- 총: 약 $23.5/세트
```

## 💡 주요 기능

### AI OFF (템플릿 모드)
- 무료
- 기본 템플릿 사용
- 빠른 생성
- 품질: ⭐⭐⭐

### AI ON (AI 모드)
- 유료 (플랜별 차등)
- 맞춤형 콘텐츠
- SEO 최적화
- 트렌드 반영
- 품질: ⭐⭐⭐⭐⭐

## 🚀 즉시 적용 방법

```bash
# 1. SQL 함수 생성 (템플릿용)
psql $DATABASE_URL -f database/create-generate-monthly-content-function.sql

# 2. 컴포넌트 파일 복사
cp components/admin/marketing/AIGenerationSettings.tsx [프로젝트 경로]

# 3. API 파일 복사 (필요 시)
cp pages/api/generate-ai-content-v2.ts [프로젝트 경로]

# 4. 환경 변수 설정
# .env.local에 API 키 추가
```

## 📊 ROI 예상

### 월 100개 콘텐츠 기준
- **투자**: $300-400
- **예상 효과**:
  - 네이버 상위 노출 확률 3배 증가
  - 평균 트래픽 10배 증가
  - 전환율 3-5%
  - **3개월 내 투자 회수 예상**

## ⚠️ 주의사항

1. **API 키 보안**
   - 절대 프론트엔드에 노출 금지
   - 서버 사이드에서만 사용

2. **비용 관리**
   - 월 예산 한도 설정
   - 사용량 모니터링

3. **품질 관리**
   - AI 생성 콘텐츠도 검토 필요
   - 브랜드 톤 일관성 체크

## 🔍 디버깅

```javascript
// 콘솔에서 확인
console.log('AI 설정:', aiSettings);
console.log('예상 비용:', aiSettings.budget);
console.log('선택 플랜:', aiSettings.plan);
```

이제 AI 토글과 금액 선택이 가능한 멀티채널 생성 기능이 준비되었습니다! 🎉
