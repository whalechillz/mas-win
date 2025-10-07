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