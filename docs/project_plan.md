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

### GalleryPicker 간소화
- 썸네일 확대: 카드 이미지 높이 32 -> 44 (grid 2/3/4열로 조정)
- 퀵액션 축소: 삽입/대표/확대만 유지(정보·복사·삭제·링크는 갤러리 관리 페이지로 이관)
- 체크박스 UI 시인성 개선(배경+shadow)
- 이유: 편집 중 핵심 액션만 노출, 실수 방지 및 가독성 향상

### 다중 삽입 지원
- `GalleryPicker`: 선택 액션 바에 "➕ 선택 삽입" 추가(선택 순서대로 본문에 삽입, 모달 닫힘)

### 갤러리 관리 페이지 최적화(1차)
- 현재: 메타 조회를 이미지별 요청으로 처리(간헐적 지연). 후속: 배치 API로 통합 요청 계획
- 필터/정렬/검색 클라이언트 최적화 유지, UI 정리(선택 액션 바 상단 고정)

### 갤러리 최적화 2차
- API: `/api/admin/image-metadata-batch` 추가(이름 배열 → 메타 map 반환)
- 페이지: `pages/admin/gallery.tsx`
  - 배치 메타 연동(단건 호출 제거)
  - 무한 스크롤 로딩(하단 400px 근접 시 다음 페이지 자동 로드)
  - 선택 액션: ⬇️ 일괄 다운로드, 📁 카테고리 이동 추가

### 프롬프트 리셋 버튼
- 위치: 블로그 편집 `프롬프트 미리보기` 우측 상단
- 동작: `/api/preview-image-prompt`로 기본 프롬프트 재생성 → `imageGenerationPrompt` 갱신, `editedPrompt`/`generatedImages` 초기화
- 기본 프롬프트 근거: 제목, 요약(또는 본문 일부), contentType, brandStrategy(페르소나/강도/오디언스) 사용
- FAL 프롬프트: `pages/api/generate-blog-image-fal.js#createFALImagePrompt`에서 위 맥락 + 랜덤 요소(시간대/의상/포즈/배경/조명) 조합, 텍스트 비포함 규칙

### 파생 파일 생성(1차)
- API: `/api/admin/image-derivatives` (샘플) — 규칙 기반 파일명 제안, 실제 변환 파이프라인 연동 예정
- UI: 갤러리 선택 액션 “🧩 파생 파일 생성” 추가

### 링크/사용처 검사(1차)
- API: `/api/admin/image-link-check` — HEAD 요청으로 200/404 검사
- UI: 갤러리 선택 액션 “🔗 링크 검사” 추가(깨진 링크 개수 알림)

### SEO/ALT 자동 생성(완료)
- API: `/api/admin/generate-alt-batch` — GPT-4o-mini로 alt/title/description 제안, preview/apply 지원
- UI: “🔎 SEO/ALT 미리보기” → “✅ 적용”

### 카테고리/태그 관리(완료)
- API: `/api/admin/image-categories`, `/api/admin/image-tags`
- UI: 상단 모달에서 CRUD

### 이미지 메타데이터 저장 오류 수정 (완료)
- **문제**: ALT 텍스트 길이 제한으로 인한 500 Internal Server Error
- **원인**: API 레벨에서 500자 제한, SEO 최적화 기준과 불일치
- **해결책**:
  - API 길이 제한을 SEO 최적화 기준으로 수정:
    - ALT 텍스트: 500자 → 125자 (SEO 권장: 50-100자)
    - 제목: 200자 → 60자 (SEO 권장: 50자 이하)
    - 설명: 1000자 → 160자 (SEO 권장: 140자 이하)
  - 카테고리 필수 입력 검증 추가
  - UI에 실시간 글자수 카운터 추가 (색상 코딩: 초록/노랑/빨강)
  - 더 구체적인 오류 메시지 제공
- **변경 파일**:
  - `pages/api/admin/image-metadata.js` - 길이 제한 및 검증 로직 수정
  - `pages/admin/gallery.tsx` - UI 글자수 카운터 및 오류 메시지 개선