# 🎯 MASGOLF 통합 콘텐츠 및 자산 마이그레이션 프로젝트

## 프로젝트 개요
**프로젝트 명**: MASGOLF 통합 콘텐츠 및 자산 마이그레이션 프로젝트

**핵심 기술**:
- **Self-Adaptive Automation (자기 적응형 자동화)**: Playwright 기반 자동화 스크립트가 실행 중 오류 발생 시 스스로 수정하며 진행
- **콘텐츠 성과 통합 관리**: 블로그, 유튜브 등 다중 플랫폼 실적 통합 추적 및 관리

**목적**: 
- 모든 사이트 통합 (masgolf.co.kr, mas9golf.co.kr, MUZIIK)
- 이미지 및 콘텐츠 마이그레이션
- 갤러리 고도화 및 중앙 관리
- 메타데이터 생성 및 관리
- 블로그 글 품질 개선
- 고객 콘텐츠 정리 및 관리
- **콘텐츠 성과 통합 관리 및 분석**

**전체 Phase 구조**:
- **Phase 0**: Self-Adaptive Automation 및 로깅 시스템 구축 (신규)
- **Phase 1-5**: 갤러리 고도화 프로젝트 (완료/부분 완료)
- **Phase 8-11**: 이미지 및 콘텐츠 마이그레이션 프로젝트 (진행 중)
- **Phase 13**: 콘텐츠 허브 시스템 고도화 및 AI 스케줄 생성기 프로젝트 (진행 중)
- **Phase 14**: 카카오톡 콘텐츠 자동화 시스템 ✅ (완료)
- **Phase 15**: 워크플로우 시각화 시스템 (React Flow) ✅ (완료)
- **Phase 6-7**: 사이트 통합 및 마이그레이션 프로젝트 (후속 작업)
- **Phase 12**: 고객 콘텐츠 정리 프로젝트 (후속 작업)

**별도 프로젝트**:
- **마케팅 및 퍼널 관리 프로젝트**: 분석, 구글 광고/애즈 API 연결 등 복잡한 기능 포함 (별도 구성)

---

# 🎯 프로젝트 진행 현황

## ✅ 최근 완료된 작업 (2025-11-16)

### Sharp 모듈 Vercel 호환성 수정 ✅
- **문제**: 이미지 업로드 시 500 Internal Server Error 발생
- **원인**: `sharp` 모듈을 정적 import로 사용하여 Vercel 서버리스 환경에서 바이너리 로드 실패
- **해결**: 모든 API 파일에서 `sharp`를 동적 import로 변경
- **수정된 파일들**:
  - `pages/api/upload-image-supabase.js` - 이미지 업로드 API (가장 중요)
  - `pages/api/admin/compare-images.js` - 이미지 비교 API
  - `pages/api/admin/extract-exif.js` - EXIF 추출 API
  - `pages/api/admin/save-external-image.js` - 외부 이미지 저장 API
  - `pages/api/admin/image-versions.js` - 이미지 버전 생성 API
  - `pages/api/migrate-blog-professional.js` - 블로그 마이그레이션 API
  - `pages/api/migrate-blog-production.js` - 프로덕션 마이그레이션 API
  - `pages/api/migrate-blog-browser-download.js` - 브라우저 다운로드 마이그레이션 API
  - 기타 migrate 관련 파일들
- **참고 문서**: `docs/API_405_ERROR_FIX.md` (166-212번 줄)
- **결과**: Vercel 환경에서 이미지 업로드 및 처리 정상 작동

## ✅ 최근 완료된 작업 (2025-11-25)

### 제품 퍼널: 고객 후기 섹션 재배치 및 확장 ✅
- **요구사항**: CTA 직전에 사회적 증명을 배치해 전환율을 높이고, 블랙 베릴 제품에도 동일한 후기 경험 제공
- **gold2-sapphire**: 후기 슬라이더 섹션을 `월 15개 한정 제작` CTA 바로 위로 이동해 심리 흐름을 `성능 검증 → 후기 → 긴급성 → CTA`로 재구성
- **weapon-beryl**: 블로그 후기 API 연동(useEffect) 및 자동 슬라이더 UI 신설, gold2 페이지와 동일한 카테고리 필터(고객 후기, 리얼 체험·비거리 성공 후기) 적용
- **UI/UX**:
  - 응답 대기/비어있는 상태/슬라이드 네비게이션 일관성 유지
  - 테마 색상만 조정(CTA 링크 색상 녹색)하여 브랜드 정체성 반영
- **변경 파일**:
  - `pages/products/gold2-sapphire.tsx`
  - `pages/products/weapon-beryl.tsx`
- **성과**: 두 제품 상세 페이지 모두 CTA 직전 신뢰 요소 강화, blog CMS 연동 구조 재사용성 확보

## ✅ 최근 완료된 작업 (2025-11-20)

### 카카오 콘텐츠 생성 시스템 Phase 3 구현 완료 ✅
- **Phase 3.3: 베리에이션 테스트**
  - `variation-test.js` (신규): 베리에이션 테스트 API 구현
  - 실제 생성된 이미지의 다양성 검증
  - 날짜별/요일별/계정별 변형 확인
  - 템플릿 로테이션 동작 검증
  - 베리에이션 점수 계산 및 통계 제공
- **베리에이션 테스트 UI**
  - `VariationTestPanel.tsx` (신규): 베리에이션 테스트 실행 및 결과 시각화 컴포넌트
  - 테스트 유형 선택 (전체/주간/날짜 범위/템플릿 로테이션)
  - 계정/타입 선택 가능
  - 테스트 결과 요약, 통계, 상세 결과 표시
- **UI 통합**
  - `kakao-content.tsx`: 베리에이션 테스트 패널 및 미리보기 섹션 추가
  - 접을 수 있는 섹션으로 UI 통합
- **참고**: Phase 3.1 (프롬프트 아이디어 확장), Phase 3.2 (템플릿 다양화)는 이미 Phase 1에서 구현 완료
- **변경 파일**:
  - `pages/api/kakao-content/variation-test.js` (신규)
  - `components/admin/kakao/VariationTestPanel.tsx` (신규)
  - `pages/admin/kakao-content.tsx` (베리에이션 테스트 패널 통합)

### 카카오 콘텐츠 생성 시스템 Phase 4 구현 완료 ✅
- **Phase 4.1: 월별 일괄 생성 개선**
  - `batch-generate-month.js` (신규): 월별 모든 날짜의 basePrompt 자동 생성
  - 요일별 템플릿 자동 선택, 주차별 테마 반영, 베리에이션 자동 적용
  - account1/account2/both 선택 가능, background/profile/feed 타입 선택 가능
  - forceRegenerate 옵션으로 기존 basePrompt 재생성 가능
- **Phase 4.2: 베리에이션 미리보기**
  - `VariationPreview.tsx` (신규): 선택한 날짜의 basePrompt 미리보기 컴포넌트
  - 요일별 템플릿 선택 미리보기, 생성될 이미지 스타일 예상
  - 계절별 분위기, 월 초/중/말 분위기 표시
  - 배경/프로필/피드 basePrompt 실시간 미리보기
- **Phase 4.3: 자동 로테이션 관리**
  - `manage-rotation.js` (신규): 주 단위 템플릿 로테이션 자동 관리
  - 월별 이미지 카테고리 로테이션 체크 및 수정
  - 베리에이션 일관성 체크 및 리포트 생성
  - check/fix/report 액션 지원
- **변경 파일**:
  - `pages/api/kakao-content/batch-generate-month.js` (신규)
  - `components/admin/kakao/VariationPreview.tsx` (신규)
  - `pages/api/kakao-content/manage-rotation.js` (신규)

### 카카오 콘텐츠 생성 시스템 Phase 2 구현 완료 ✅
- **Phase 2.1: 날짜 기반 변형 요소 추가**
  - `generate-prompt.js`: 월 초/중/말 분위기 자동 계산 및 반영
  - 계절별 분위기 자동 계산 및 반영 (봄/여름/가을/겨울)
  - 프롬프트 생성 시 날짜 기반 변형 요소 자동 포함
- **Phase 2.2: 시드값 기반 베리에이션**
  - `generate-images.js`: 날짜별 고정 시드값 생성 로직 추가
  - 계정별, 타입별 시드값 오프셋 적용
  - 같은 날짜면 같은 시드, 다른 날짜면 다른 시드로 일관성 확보
- **Phase 2.3: 이미지 카테고리 로테이션**
  - `auto-create-account1.js`: 피드 이미지 카테고리 주 단위 로테이션 추가
  - `auto-create-account2.js`: 피드 이미지 카테고리 주 단위 로테이션 추가
  - 6개 카테고리 (시니어 골퍼의 스윙, 피팅 상담의 모습, 매장의 모습, 젊은 골퍼의 스윙, 제품 컷, 감성 컷) 주 단위 순환
- **변경 파일**:
  - `pages/api/kakao-content/generate-prompt.js` (날짜 기반 변형 요소 추가)
  - `pages/api/kakao-content/generate-images.js` (시드값 기반 베리에이션 추가)
  - `pages/api/kakao-content/auto-create-account1.js` (이미지 카테고리 로테이션 추가)
  - `pages/api/kakao-content/auto-create-account2.js` (이미지 카테고리 로테이션 추가)

### 카카오 콘텐츠 생성 시스템 Phase 1.5 구현 완료 ✅
- **자동 생성 API에 basePrompt 자동 생성 통합**
  - `auto-create-account1.js`: basePrompt 없을 때 자동 생성 로직 추가
  - `auto-create-account2.js`: basePrompt 없을 때 자동 생성 로직 추가
  - 배경/프로필/피드 이미지 생성 전 basePrompt 자동 생성
  - "계정 자동생성" / "선택된 날짜 생성" 시 자동으로 요일별 basePrompt 생성
  - basePrompt 생성 실패 시 fallback 값 사용 (기존 동작 유지)
- **변경 파일**:
  - `pages/api/kakao-content/auto-create-account1.js` (basePrompt 자동 생성 추가)
  - `pages/api/kakao-content/auto-create-account2.js` (basePrompt 자동 생성 추가)

### 카카오 콘텐츠 생성 시스템 Phase 1 구현 완료 ✅
- **요일별 템플릿 파일 생성**
  - `lib/kakao-base-prompt-templates.js` (신규) - 126개 템플릿 정의
  - Account1/Account2 × Background/Profile/Feed × 7요일 × 3템플릿
  - 주차별 순환 로직 포함
- **Base Prompt 생성 API 구현**
  - `pages/api/kakao-content/generate-base-prompt.js` (신규)
  - 요일별 템플릿 자동 선택
  - 주차별 테마 반영
- **UI 연동**
  - FeedManager: 이미 구현됨 (handleGenerateBasePrompt)
  - ProfileManager: basePrompt 자동 생성 기능 추가
    * 배경/프로필 이미지 각각 요일별 자동 생성 버튼
    * 편집/저장 기능 포함
- **변경 파일**:
  - `lib/kakao-base-prompt-templates.js` (신규)
  - `pages/api/kakao-content/generate-base-prompt.js` (신규)
  - `components/admin/kakao/ProfileManager.tsx` (basePrompt 자동 생성 기능 추가)

### 카카오 콘텐츠 생성 시스템 고도화 계획 수립 ✅
- **고도화 계획 문서 작성**
  - `docs/KAKAO_CONTENT_ENHANCEMENT_PLAN.md` (신규) - 요일별 템플릿 시스템, 베리에이션 강화, 프롬프트 아이디어
  - 베리에이션 계산: 최대 1,512가지 조합, 월별 180가지, 연간 2,160가지
  - Phase 1-4 구현 계획 수립
- **프롬프트 아이디어 정리**
  - 배경/프로필/피드 이미지별 프롬프트 아이디어
  - Account1 (골드·브라운 톤) / Account2 (블루·그레이 톤) 구분
  - 요일별 7가지 테마, 주차별 3가지 템플릿 순환
- **변경 파일**:
  - `docs/KAKAO_CONTENT_ENHANCEMENT_PLAN.md` (신규)

### 카카오 콘텐츠 생성 시스템 개선 (베리에이션 및 텍스트 방지) ✅
- **텍스트 방지 개선 (적절한 수준)**
  - `generate-prompt.js`: 텍스트 방지 지시 강화 ("ABSOLUTELY NO text, words, or written content")
  - `generate-images.js`: FAL AI 호출 시 `negative_prompt` 추가
  - 오바하지 않음: 과도한 강조 없이 적절한 수준으로만 개선
- **베리에이션 개선**
  - `auto-create-account1.js`: `background_base_prompt`, `profile_base_prompt` 우선 사용
  - `auto-create-account2.js`: `background_base_prompt`, `profile_base_prompt` 우선 사용
  - 피드: `base_prompt` 우선 사용
  - basePrompt가 있으면 날짜별로 다른 이미지 생성 가능
- **Base Prompt 현황 분석**
  - `generate-base-prompt.js`: 비어있음 (구현 안됨)
  - `kakao-base-prompt-templates.js`: 비어있음
  - 요일별 템플릿 시스템은 고도화 추후 구현 예정
- **문서화**
  - `docs/KAKAO_CONTENT_VARIATION_ANALYSIS.md` (신규) - 베리에이션 문제 분석 및 해결 방안
- **변경 파일**:
  - `pages/api/kakao-content/generate-prompt.js` (텍스트 방지 지시 강화)
  - `pages/api/kakao-content/generate-images.js` (negative_prompt 추가)
  - `pages/api/kakao-content/auto-create-account1.js` (basePrompt 우선 사용)
  - `pages/api/kakao-content/auto-create-account2.js` (basePrompt 우선 사용)
  - `docs/KAKAO_CONTENT_VARIATION_ANALYSIS.md` (신규)

## ✅ 최근 완료된 작업 (2025-11-20)

### Phase 15: 워크플로우 시각화 시스템 (React Flow) ✅
- **React Flow 설치 및 설정**
  - `reactflow` 패키지 설치
  - 워크플로우 시각화 컴포넌트 생성
- **워크플로우 노드 정의**
  - 시작 → BasePrompt 생성 → 프롬프트 생성 → 이미지 생성 → 피드 생성 → 배포 → 완료
  - 계정별 병렬 처리 시각화 (Account1, Account2)
  - 각 단계별 상태 표시 (완료/진행 중/대기 중)
- **실시간 상태 반영**
  - 선택된 날짜의 실제 데이터 기반 상태 표시
  - 완료된 단계는 애니메이션으로 강조
  - 미완료 단계는 회색으로 표시
- **UI 개선**
  - 미니맵 및 컨트롤 추가
  - 커스텀 노드 디자인 (아이콘, 상태 배지)
  - 반응형 레이아웃
- **변경 파일**:
  - `components/admin/kakao/WorkflowVisualization.tsx` (신규)
  - `pages/admin/kakao-content.tsx` (워크플로우 시각화 통합)
  - `package.json` (reactflow 의존성 추가)

### BasePrompt 관리 시스템 개선 ✅
- **피드 BasePrompt 관리 추가**
  - FeedManager에 basePrompt 관리 UI 추가
  - 요일별 자동 생성 버튼 추가
  - 프롬프트 재생성 기능 추가
- **계절/트랜드/이벤트 반영**
  - 계절별 템플릿 수정자 추가 (봄/여름/가을/겨울)
  - 이벤트별 템플릿 수정자 추가 (크리스마스, 새해 등)
  - 주차별 테마 반영 기능
- **변경 파일**:
  - `lib/kakao-base-prompt-templates.js` (계절/이벤트 로직 추가)
  - `components/admin/kakao/FeedManager.tsx` (basePrompt 관리 UI 추가)
  - `pages/api/kakao-content/calendar-save.js` (피드 basePrompt 저장 추가)

### 목록보기 UI 고도화 ✅
- **향상된 필터링 및 검색**
  - 계정별, 타입별, 상태별 필터링
  - 실시간 검색 기능
  - 정렬 옵션 (날짜/상태, 오름차순/내림차순)
- **개선된 테이블 UI**
  - 그라데이션 헤더 디자인
  - 행 확장 기능 (이미지 미리보기)
  - 상태 배지 개선 (색상 및 아이콘)
  - 호버 효과 및 클릭 가능한 행
- **통계 및 요약**
  - 총 날짜 수, 생성됨, 배포됨 통계
  - 실시간 필터링 결과 반영
- **변경 파일**:
  - `components/admin/kakao/MessageListView.tsx` (전면 개편)

## ✅ 이전 완료된 작업 (2025-11-16)

### BasePrompt 관리 시스템 ✅
- **요일별 BasePrompt 템플릿 정의**
  - `lib/kakao-base-prompt-templates.js` - 요일별 템플릿 정의
  - Account1 (시니어): 골드톤, 따뜻한 감성 (요일별 3개씩 템플릿)
  - Account2 (테크): 블랙톤, 혁신적 분위기 (요일별 3개씩 템플릿)
  - 주차별 테마와 요일별 basePrompt 매핑 명확화
- **요일별 BasePrompt 자동 생성 API**
  - `/api/kakao-content/generate-base-prompt.js` - 요일별 템플릿 기반 자동 생성
  - 날짜의 요일 자동 계산
  - 주차별 테마 반영 기능
  - 템플릿 인덱스 지정 가능 (랜덤 또는 특정 인덱스)
- **BasePrompt 수정/업데이트 UI**
  - ProfileManager에 basePrompt 편집 섹션 추가
  - "✏️ 편집" 버튼: basePrompt 수정 모드
  - "🔄 요일별 자동 생성" 버튼: 요일별 템플릿 자동 생성
  - "💾 저장" / "❌ 취소" 버튼: 편집 완료/취소
  - 현재 basePrompt 표시 (회색 배경)
- **BasePrompt 저장 로직**
  - `onBasePromptUpdate` prop 추가 (KakaoAccountEditor → ProfileManager)
  - pages/admin/kakao-content.tsx에서 basePrompt 저장 처리
  - Supabase에 `background_base_prompt`, `profile_base_prompt` 저장
- **문서 개선**
  - `docs/content-calendar/BASE_PROMPT_MANAGEMENT.md` (신규) - 요일별 로테이션 가이드
  - `docs/content-calendar/MONTHLY_BATCH_GENERATION.md` (신규) - 월별 일괄 생성 가이드
  - `docs/content-calendar/PROFILE_OPERATION_GUIDE.md` (업데이트) - basePrompt 관리 섹션 추가
- **변경 파일**:
  - `lib/kakao-base-prompt-templates.js` (신규)
  - `pages/api/kakao-content/generate-base-prompt.js` (신규)
  - `components/admin/kakao/ProfileManager.tsx` (basePrompt 편집 UI 추가)
  - `components/admin/kakao/KakaoAccountEditor.tsx` (onBasePromptUpdate prop 추가)
  - `pages/admin/kakao-content.tsx` (basePrompt 저장 로직 추가)
  - `docs/content-calendar/BASE_PROMPT_MANAGEMENT.md` (신규)
  - `docs/content-calendar/MONTHLY_BATCH_GENERATION.md` (신규)
  - `docs/content-calendar/PROFILE_OPERATION_GUIDE.md` (업데이트)

### 카카오톡 다중 날짜 순차 생성 시스템 ✅
- **날짜 선택 UI**
  - 이번 주/이번 달 보기 모드에서 체크박스로 여러 날짜 선택 가능
  - "전체 선택" / "선택 해제" 버튼 추가
  - 선택된 날짜 수 표시
- **순차 생성 로직**
  - 선택된 날짜들을 하나씩 순차적으로 생성 (API 부하 방지)
  - 최대 생성 개수 제한: 7일 (사용자 확인 후)
  - 날짜별로 account1 → account2 순서로 생성
  - 각 생성 사이 1초 대기 (API 부하 방지)
- **진행 상황 표시**
  - 실시간 진행 상황 표시 (진행 바, 완료/전체 개수)
  - 현재 처리 중인 날짜 및 계정 표시
  - 예상 남은 시간 표시 (1일치당 1분 기준)
- **생성 버튼 개선**
  - "오늘 날짜 생성": 현재 선택된 날짜만 생성
  - "선택된 날짜 생성": 체크박스로 선택한 날짜들 생성
  - "이번 주 생성": 이번 주 보기 모드에서만 표시, 이번 주 전체 생성
- **변경 파일**:
  - `pages/admin/kakao-content.tsx` (날짜 선택 UI, 순차 생성 로직, 진행 상황 표시)

### 카카오톡 피드 캡션 및 URL 자동 생성 시스템 ✅
- **피드 캡션 자동 생성 API**
  - `/api/kakao-content/generate-feed-caption.js` - AI 기반 피드 캡션 생성
  - 이미지 카테고리, 계정 타입, 주별 테마 기반 캡션 생성
  - 계정별 톤앤매너 반영 (account1: 따뜻하고 감성적, account2: 혁신적이고 기술적)
  - 길이 제한: 10-25자 이내
- **URL 자동 선택 로직**
  - `lib/kakao-feed-url-selector.js` - 이미지 카테고리 및 날짜 기반 URL 선택
  - 카테고리별 URL 매핑:
    - 시니어 골퍼의 스윙: account1 → 시타 예약, account2 → 홈페이지
    - 젊은 골퍼의 스윙: account1 → 홈페이지, account2 → MUZIIK
    - 매장의 모습: 양쪽 모두 → 매장 안내
    - 피팅 상담의 모습: 양쪽 모두 → 시타 예약
  - 요일별 기본 URL (카테고리 매핑이 없을 때)
- **자동 생성 API 개선**
  - `auto-create-account1.js`: 피드 캡션 자동 생성 및 URL 자동 선택 추가
  - `auto-create-account2.js`: 피드 캡션 자동 생성 및 URL 자동 선택 추가
  - 기존 캡션이 없을 때만 새로 생성 (재사용 가능)
- **변경 파일**:
  - `pages/api/kakao-content/generate-feed-caption.js` (신규)
  - `lib/kakao-feed-url-selector.js` (신규)
  - `pages/api/kakao-content/auto-create-account1.js` (피드 캡션/URL 자동 생성 추가)
  - `pages/api/kakao-content/auto-create-account2.js` (피드 캡션/URL 자동 생성 추가)

## ✅ 최근 완료된 작업 (2025-11-12)

### 카카오 콘텐츠 시스템 고도화 ✅
- **DB 테이블 생성 완료**
  - `kakao_profile_content` - 프로필 콘텐츠 저장 (데일리 브랜딩)
  - `kakao_feed_content` - 피드 콘텐츠 저장 (데일리 브랜딩)
  - 기존 `channel_kakao`와 목적 분리 (허브 시스템 vs 데일리 브랜딩)
- **이미지 메타데이터 분류 저장**
  - 계정 정보 (account1/account2) 저장
  - 용도 정보 (background/profile/feed) 저장
  - 톤 정보 (골드톤/블랙톤) 저장
  - 갤러리에서 필터링 가능하도록 태그 추가
- **아시아 시니어 골퍼 명시 강화**
  - 프롬프트에 "Korean senior golfer (50-70 years old, Korean ethnicity, Asian facial features)" 명시
  - "NO Western/Caucasian people, ONLY Korean/Asian people" 금지 명시
  - 계정별 차별화된 프롬프트 (골드톤: 시니어, 블랙톤: 젊은 골퍼)
- **캘린더 데이터 로드 개선**
  - `created: true`인 데이터도 표시하도록 수정
  - 오늘 날짜 데이터가 없을 때 오류 메시지 개선
- **저장 구조 개선**
  - JSON 파일 저장 (플랜 + 생성된 콘텐츠)
  - DB 저장 (최종 배포용) 자동화
  - `created` → `published` 상태 관리
- **문서화**
  - `docs/KAKAO_CONTENT_STORAGE_GUIDE.md` - 저장 구조 가이드
  - `docs/DAILY_BRANDING_GUIDE.md` - 데일리 브랜딩 가이드
- **변경 파일**:
  - `pages/admin/kakao-content.tsx` (캘린더 로드 로직 수정, DB 저장 추가)
  - `pages/api/generate-paragraph-images-with-prompts.js` (메타데이터 저장 추가)
  - `pages/api/kakao-content/generate-prompt-message.js` (아시아 골퍼 명시 강화)
  - `database/kakao-content-schema.sql` (신규, DB 스키마)

### 허브 시스템 통합 완료 ✅
- **메뉴 정리**
  - "📅 콘텐츠 캘린더" 메뉴 삭제
  - "🆕 새 캘린더" 메뉴 삭제
  - "🎯 허브 시스템" 메뉴로 통합
- **허브 시스템 페이지 개선**
  - 탭 구조 추가 (콘텐츠 허브 / 데일리 브랜딩)
  - 리스트 뷰 / 달력 뷰 토글 추가
  - 데일리 브랜딩 탭 추가 (카카오톡 링크 포함)
- **변경 파일**:
  - `components/admin/AdminNav.tsx` (메뉴 정리)
  - `pages/admin/content-calendar-hub.tsx` (탭 및 뷰 모드 추가)
  - `docs/CONTENT_SYSTEM_ARCHITECTURE.md` (구조 업데이트)

## ✅ 최근 완료된 작업 (2025-11-12)

### Phase 14 카카오톡 콘텐츠 자동화 시스템 - 완료 ✅
- **공통 시스템 모듈 추출 완료**
  - `lib/ai-image-generation.ts` - 골드톤/블랙톤 이미지 생성 함수 (오류 처리 개선)
  - `lib/prompt-config-manager.ts` - 프롬프트 설정 관리
  - `lib/self-adaptive-automation.ts` - Self-Adaptive Automation
- **카카오톡 콘텐츠 페이지 생성**
  - `pages/admin/kakao-content.tsx` - 메인 페이지 (브랜드 전략, 프롬프트 설정 통합)
  - `components/admin/kakao/ProfileManager.tsx` - 프로필 관리
  - `components/admin/kakao/FeedManager.tsx` - 피드 관리
  - `components/admin/kakao/KakaoAccountEditor.tsx` - 계정별 편집기
- **API 엔드포인트 생성**
  - `pages/api/content-calendar/load.js` - 캘린더 데이터 로드
  - `pages/api/kakao-content/calendar-save.js` - 캘린더 데이터 저장
  - `pages/api/kakao-content/save.js` - DB 저장 (준비 완료)
- **오류 수정**
  - `generate-paragraph-prompts` 400 오류 수정 (content 없을 때 기본 프롬프트 반환)
  - `/api/admin/blog?calendar_id=...` 500 오류 수정 (유효성 검사 추가)
- **통합 캘린더 구조 설계**
  - 콘텐츠 허브 (`hubContents`) + 데일리 브랜딩 (`dailyBranding`) 통합 구조
  - 문서: `docs/CONTENT_SYSTEM_ARCHITECTURE.md`
- **AdminNav 메뉴 추가**
  - "📱 카톡 콘텐츠" 메뉴 추가
- **UI/UX 개선**
  - 중복 아이콘 제거 (Calendar 아이콘 + 📅 이모지)
  - 일관성 있는 아이콘 사용 (Lucide React)
  - 로딩 상태 개선
- **변경 파일**:
  - `lib/ai-image-generation.ts` (신규, 오류 처리 개선)
  - `lib/prompt-config-manager.ts` (신규)
  - `lib/self-adaptive-automation.ts` (신규)
  - `pages/admin/kakao-content.tsx` (신규)
  - `components/admin/kakao/ProfileManager.tsx` (신규)
  - `components/admin/kakao/FeedManager.tsx` (신규)
  - `components/admin/kakao/KakaoAccountEditor.tsx` (신규)
  - `pages/api/content-calendar/load.js` (신규)
  - `pages/api/kakao-content/calendar-save.js` (신규)
  - `pages/api/kakao-content/save.js` (신규)
  - `pages/api/admin/blog.js` (오류 수정)
- `components/admin/AdminNav.tsx` (업데이트)
  - `docs/CONTENT_SYSTEM_ARCHITECTURE.md` (신규)
  - `docs/CONTENT_STRUCTURE_ANALYSIS.md` (신규)
- **후속 작업 완료 ✅**
  - 카카오 전용 프롬프트 생성 API (`/api/kakao-content/generate-prompt.js`) 생성 완료
  - 블로그 프롬프트와 완전 분리하여 카카오 전용 요구사항만 반영
  - `lib/ai-image-generation.ts`에 `generateKakaoImagePrompts` 함수 추가
  - `pages/admin/kakao-content.tsx`에서 카카오 전용 API 사용으로 변경
  - 캘린더 데이터 로드 수정 (`!p.created` 조건 제거)

### 공통 시스템 문서화 ✅
- **재사용 가능한 공통 시스템 문서 작성 완료**
- **문서 위치**: `docs/shared-systems/`
- **작성된 문서**:
  1. 브랜드 전략 시스템 (`brand-strategy-system.md`)
  2. AI 이미지 생성 시스템 (`ai-image-generation-system.md`)
  3. 프롬프트 설정 관리 (`prompt-settings-manager.md`) - 슬롯 기반 API 연결 계획 추가
  4. Self-Adaptive Automation (`self-adaptive-automation.md`)
  5. 갤러리 이미지 자산 관리 (`gallery-asset-management.md`)
- **README 작성**: `docs/shared-systems/README.md`

### 카카오톡 프로필 업데이트 자동화 완료 ✅ (2025-11-12)
- **Playwright 기반 자동화 스크립트 생성**
  - `scripts/update-kakao-profile.js` - 카카오톡 프로필 업데이트 자동화
  - Self-Adaptive Automation 적용 (다중 선택자, 자동 재시도)
  - 카카오톡 PC 버전 로그인 자동화
  - 배경 이미지/프로필 이미지 자동 업로드
  - 브랜드 표기 자동 설정 ("MASSGOO" - 고정)
  - 상태 메시지 자동 입력 (매일 변경)
- **프로필 구조 최종 확정**
  - 첫 번째 필드 (7/20): "MASSGOO" - 브랜드 표기 (고정)
  - 두 번째 필드 (13/60): 상태 메시지 - 매일 변경 (예: "스윙보다 마음이 먼저다.")
- **API 엔드포인트 생성**
  - `pages/api/kakao-content/update-profile.js` - 프로필 업데이트 API
  - 백그라운드에서 Playwright 스크립트 실행
- **UI 통합**
  - `components/admin/kakao/KakaoAccountEditor.tsx` - "카카오톡 업로드" 버튼 추가
  - 업로드 전 유효성 검사 (이미지, 메시지 확인)
  - 업로드 완료 시 배포 상태 자동 변경
- **문서화**
  - `docs/content-calendar/PROFILE_OPERATION_GUIDE.md` - 자동화 섹션 업데이트
  - 환경 변수 설정 가이드 추가
  - 프로필 구조 최종 확정 문서화
- **변경 파일**:
  - `scripts/update-kakao-profile.js` (신규, 브랜드 표기/상태 메시지 분리)
  - `pages/api/kakao-content/update-profile.js` (신규)
  - `components/admin/kakao/KakaoAccountEditor.tsx` (업로드 버튼 추가)
  - `pages/admin/kakao-content.tsx` (selectedDate, accountKey props 추가)
  - `docs/content-calendar/PROFILE_OPERATION_GUIDE.md` (자동화 섹션 업데이트, 프로필 구조 확정)

### 프롬프트 설정 관리 현황 분석 및 문서 업데이트 ✅
- **현황 분석 완료**
  - 마쓰구 브랜드 전략: 사용 중 ✅ (저장 기능 없음)
  - 프롬프트 설정 관리: 블로그 페이지 완료 ✅, 카카오 페이지 부분 구현 ⚠️
  - API 분리: 블로그 전용 API ✅, 카카오 전용 API ✅
- **개선 방안 문서화**
  - 슬롯 기반 API 연결 계획 (Phase 15 통합)
  - 스케줄별 변형 관리 계획
  - 버전 관리 및 롤백 기능 계획
- **문서 업데이트 완료**
  - `docs/shared-systems/prompt-settings-manager.md` - 슬롯 기반 API 연결 섹션 추가
  - `docs/phases/detailed-plans/phase-15-workflow-visualization.md` - 프롬프트 슬롯 통합 계획 추가
  - `docs/PHASE_14_COMPLETION_REPORT.md` - 현재 사용 현황 및 개선 방안 추가

### 카카오톡 콘텐츠 시스템 UI/UX 개선 ✅ (2025-11-12)
- **배포 상태 UI 개선**
  - 배포 상태를 별도 줄로 분리하여 레이아웃 개선
  - 체크박스 → 배지 버튼 스타일로 변경
  - 텍스트 잘림 문제 해결 (whitespace-nowrap 적용)
  - 날짜 표시 형식 개선 (월/일/시간/분)
- **이미지 생성 옵션 개선**
  - "생성 범위" 제거 및 보기 모드와 통합
  - "다시 만들기 허용" 제거 (X 버튼으로 이미 가능)
  - "생성 옵션 설정" 및 "전체 자동 생성" 버튼 상단 이동
  - 생성 옵션 모달 간소화 (이미지 생성 개수만 남김)
- **이미지 2개/4개 생성 시 선택 기능**
  - `ImageSelectionModal` 컴포넌트 생성
  - AI 자동 선택 기능 추가 (이미지 품질 평가 API)
  - 이미지 생성 개수 옵션 적용
- **피드 이미지 최적화**
  - Sharp 라이브러리로 카카오톡 피드 최적 사이즈 (1080x1080) 자동 크롭
  - AI 기반 중요 영역 크롭 (`position: 'entropy'`)
  - 피드 이미지는 JPEG 형식으로 저장 (품질 90%)
  - 베리에이션 시스템은 나중에 구현 (복잡도 고려)
- **변경 파일**:
  - `components/admin/kakao/KakaoAccountEditor.tsx` (배포 상태 별도 줄 분리, 버튼 비활성화 로직)
  - `components/admin/kakao/ImageSelectionModal.tsx` (신규, 이미지 선택 모달)
  - `pages/admin/kakao-content.tsx` (이미지 생성 개수 옵션 적용, 선택 모달 통합)
  - `pages/api/generate-paragraph-images-with-prompts.js` (피드 이미지 Sharp 최적화)
  - `pages/api/kakao-content/evaluate-images.js` (신규, 이미지 품질 평가 API)
