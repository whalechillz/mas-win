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
- **Phase 15**: 워크플로우 시각화 시스템 (React Flow) (신규)
- **Phase 6-7**: 사이트 통합 및 마이그레이션 프로젝트 (후속 작업)
- **Phase 12**: 고객 콘텐츠 정리 프로젝트 (후속 작업)

**별도 프로젝트**:
- **마케팅 및 퍼널 관리 프로젝트**: 분석, 구글 광고/애즈 API 연결 등 복잡한 기능 포함 (별도 구성)

---

# 🎯 프로젝트 진행 현황

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
