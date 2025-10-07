# 프로젝트 계획 - 이미지 변형 기능 개선

## 완료된 작업

### 1. 문제 분석 및 진단
- **Replicate 모델 성공 요인 분석**: SDXL 모델 사용, 올바른 파라미터 설정, 완전한 폴링 로직
- **다른 모델들의 문제점 파악**:
  - FAL AI: Text-to-Image 모델 사용으로 이미지 변형 불가
  - Stability AI: 잘못된 API 엔드포인트 및 파라미터 불일치

### 2. FAL AI 이미지 변형 개선
- **파일**: `pages/api/generate-blog-image-fal-variation.js`
- **변경사항**:
  - `fal-ai/flux` → `fal-ai/flux-dev` 모델로 변경 (이미지 변형 지원)
  - `image_url` 파라미터 추가로 원본 이미지 전달
  - `strength` 파라미터 추가로 변형 강도 조절
  - 폴링 로직을 Replicate 스타일로 개선
  - 상태 확인 로직 강화 (`COMPLETED` 상태 확인)

### 3. Stability AI 이미지 변형 개선
- **파일**: `pages/api/generate-blog-image-stability.js`
- **변경사항**:
  - API 파라미터 정확성 개선 (`weight: 1.0`)
  - `seed` 파라미터 추가로 다양성 확보
  - 기존 엔드포인트 유지 (올바른 엔드포인트 확인됨)

### 4. Replicate 모델 업그레이드
- **파일**: `pages/api/generate-blog-image-replicate-flux.js`
- **변경사항**:
  - SDXL → Flux Dev 모델로 업그레이드 (더 나은 품질)
  - `aspect_ratio`, `output_quality` 파라미터 추가
  - `guidance_scale` 최적화 (7.5 → 3.5)

### 5. 프론트엔드 요청 본문 개선
- **파일**: `pages/admin/blog.tsx`
- **변경사항**:
  - API 요청에 필요한 모든 파라미터 추가:
    - `title`, `excerpt`, `contentType`, `brandStrategy`
    - `variationStrength`, `variationCount`
  - `editingPost` 정보 활용으로 정확한 컨텍스트 전달

## 개선된 기능들

### 이미지 변형 모델별 특징
1. **FAL AI**: 고품질 이미지 변형, flux-dev 모델 사용
2. **Replicate Flux**: 빠른 처리, 최신 Flux Dev 모델
3. **Stability AI**: 안정적인 변형, SDXL 기반

### 공통 개선사항
- 모든 모델에서 원본 이미지를 올바르게 활용
- 변형 강도(`strength`) 파라미터 적용
- 완전한 폴링 로직으로 안정성 확보
- ChatGPT를 통한 스마트 프롬프트 생성

## 다음 단계

### 테스트 및 검증
- [ ] 각 모델별 이미지 변형 기능 테스트
- [ ] 변형 강도 조절 기능 검증
- [ ] 에러 처리 및 사용자 피드백 개선

### 추가 개선 가능사항
- [ ] 이미지 변형 결과 품질 비교 분석
- [ ] 사용자 선호도에 따른 모델 추천 시스템
- [ ] 배치 이미지 변형 기능 추가

## 기술적 세부사항

### API 엔드포인트
- `/api/generate-blog-image-fal-variation` - FAL AI 이미지 변형
- `/api/generate-blog-image-replicate-flux` - Replicate Flux 이미지 변형  
- `/api/generate-blog-image-stability` - Stability AI 이미지 변형

### 주요 파라미터
- `baseImageUrl`: 변형할 원본 이미지 URL
- `variationStrength`: 변형 강도 (0.0-1.0)
- `variationCount`: 생성할 변형 이미지 개수
- `title`, `excerpt`: ChatGPT 프롬프트 생성용 컨텍스트

### 폴링 로직
- FAL AI: `IN_QUEUE` → `IN_PROGRESS` → `COMPLETED`
- Replicate: `starting` → `processing` → `succeeded`
- Stability AI: 즉시 응답 (폴링 불필요)

## 대시보드 고도화 (AI 사용량 그래프)

- 무엇을 했나
  - `pages/admin/ai-dashboard.tsx`에 다음 그래프 블록 추가
    - 일별 비용 미니 막대 그래프(최근 7일)
    - 모델별 비용 가로 막대 그래프(최근 7일)
  - 기존 표 위에 배치해 한눈에 트렌드를 먼저 확인하도록 개선
  - 자동 새로고침은 유지하지 않고 수동 새로고침 배지/버튼과 연동

- 왜 했나
  - 비용 트렌드와 모델별 코스트 집중도를 빠르게 파악하기 위함
  - 표만으로는 변화 감지가 어려워 시각적 인지(막대 그래프) 우선 제공

- 변경 파일
  - `pages/admin/ai-dashboard.tsx`

- 남은 작업
  - 모델별 그래프 툴팁/정렬 개선, 기간 토글(1/7/30/90일) 연동
  - 지연시간 p50/p95, 에러율, 예산 소진 예측 그래프 순차 추가

### 추가: 에러율/예산
- API(`pages/api/admin/ai-usage-stats.js`): `errorDailyStats`(errors, errorRate) 계산 추가
- 대시보드(`pages/admin/ai-dashboard.tsx`):
  - 일별 에러율 미니 그래프
  - 월 예산 소진 간이 예측 카드(임시 월 예산 $10 가정)
- 다음: 예산 값을 환경설정/DB에서 읽도록 분리, 기간 토글과 동기화

### 추가: 에러 상세/예산 분리
- 대시보드: 에러율 상세 표(최근 7일)
- 월 예산: `NEXT_PUBLIC_AI_MONTHLY_BUDGET` 환경변수 사용으로 분리 (기본 $10)

### 기간 동기화
- `ai-dashboard.tsx`: 기간 선택값을 집계 API 호출과 모든 그래프/표에 공유(1/7/30/90일)
- helper: `periodFromRange`, `periodLabel`

### 점유율 도넛 & 임계치 경고
- 대시보드: 모델/엔드포인트 비용 점유율 도넛(CSS conic-gradient)
- 대시보드: 예산 카드에 임계치 경고 배지(p95>60s, 에러율>5%, 예산 90%) 표시

### 마감 체크
- 기간 라벨 표기 통일(모든 그래프/표 제목에 선택 기간 반영)

### UX 배지/중복 정리
- 개요: "🤖 AI 사용량 요약"에 `누적(전체)` 배지 추가
- AI 사용량: KPI 카드에 선택 기간 배지 표시(오늘=1일, 나머지=periodLabel)
- 실시간: `RealtimeAIMonitor`에 `showSummaryCards` prop 추가, 대시보드에서는 숨김 처리