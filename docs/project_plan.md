# 🎯 MASGOLF 통합 콘텐츠 및 자산 마이그레이션 프로젝트

## 📚 관련 문서
- **허브 시스템 아키텍처**: [`docs/hub-system-architecture.md`](./hub-system-architecture.md) - 허브 시스템 구조 및 향후 계획
- **주간 허브 콘텐츠 전략**: [`docs/weekly-hub-content-strategy.md`](./weekly-hub-content-strategy.md) - 주 5일 발행 기준 허브 콘텐츠 전략
- **주간 스케줄**: [`docs/content-calendar/weekly-schedule-2025.md`](./content-calendar/weekly-schedule-2025.md) - 요일별 콘텐츠 스케줄

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

## ✅ 최근 작업: 이미지 갤러리 회전 및 변환 기능 추가 (2025-12-27)

### 완료된 작업
- **이미지 회전 기능** ✅:
  - 90도 단위 회전 (반시계방향, 시계방향)
  - 원본과 같은 폴더에 새 파일로 저장
  - 투명도 자동 감지 및 포맷 선택 (WebP/PNG/JPG)
  - API 엔드포인트: `/api/admin/rotate-image.js`
- **이미지 변환 기능** ✅:
  - WebP 85% 압축 (투명도 지원)
  - JPG 85% 압축 (투명도 제거, 흰색 배경)
  - PNG 무손실 압축 (투명도 지원)
  - 원본과 같은 폴더에 새 파일로 저장
  - API 엔드포인트: `/api/admin/convert-image.js`
- **UI 개선** ✅:
  - 확대 모달에 "회전" 및 "변환" 버튼 추가
  - 드롭다운 메뉴로 옵션 선택
  - 외부 클릭 시 메뉴 자동 닫기
  - 작업 진행 상태 표시

### 변경된 파일
- `pages/api/admin/rotate-image.js` (신규)
- `pages/api/admin/convert-image.js` (신규)
- `pages/admin/gallery.tsx` (회전/변환 UI 추가)

---

## ✅ 최근 작업: products/goods 이미지 제품별 분리 및 연결 (2025-12-27)

### 완료된 작업
- **products/goods 이미지 제품별 분리** ✅:
  - `originals/products/goods` 폴더에 섞여있던 37개 이미지를 제품별로 분리
  - 파일명 패턴 분석으로 자동 제품 분류 (버킷햇, 골프모자, 클러치백, 캡 등)
  - 제품별 폴더 구조로 재구성: `originals/products/goods/{product-slug}/gallery/`
  - 총 8개 제품 분류 완료
- **데이터베이스 제품 이미지 연결** ✅:
  - 각 제품의 `gallery_images` 필드에 이미지 경로 자동 연결
  - 기존 제품 업데이트 및 신규 제품 등록 완료
  - 설문 페이지 이미지 자동 로드 지원
- **마이그레이션 스크립트 작성** ✅:
  - `scripts/organize-goods-images-by-product.js`: 이미지 분리 스크립트
  - `scripts/update-goods-products-with-images.js`: 데이터베이스 연결 스크립트

### 변경된 파일
- `scripts/organize-goods-images-by-product.js` (신규)
- `scripts/update-goods-products-with-images.js` (신규)
- `scripts/goods-images-organization-result.json` (신규)

---

## ✅ 최근 작업: 허브 시스템 순번 구조 및 블로그 다중 연결 지원 (2025-12-16)

### 완료된 작업
- **허브 순번 구조 추가 (hub_order)** ✅:
  - `cc_content_calendar` 테이블에 `hub_order` 컬럼 추가
  - `content_date` 기준으로 초기 순번 자동 할당
  - API에서 `hub_order` 조회 및 정렬 지원
  - UI에서 `hub_order` 우선 표시 (없으면 페이지네이션 순번)
- **블로그 다중 연결 지원** ✅:
  - `channel_status.blog` 구조 확장: `posts` 배열 추가
  - 기존 `post_id`와 호환성 유지 (하위 호환)
  - `primary_post_id` 필드 추가 (대표 블로그)
  - `sync-channel-status` API에서 블로그 추가 시 배열에 자동 추가
- **블로그/SMS 개수 계산 개선** ✅:
  - `getBlogCount()`: blogDataMap, channel_status.posts, blog_post_id 모두 확인
  - `getSMSCount()`: smsDataMap, channel_status 동적 채널, sms_id 모두 확인
  - 동기화 문제 대비 최대값 반환
- **블로그 재연결 스크립트** ✅:
  - 연결이 끊어진 허브/블로그 자동 감지
  - 제목 유사도, 날짜, slug 매칭 알고리즘
  - 양방향 연결 복구 (허브 ↔ 블로그)
- **허브 기준 날짜 동기화** ✅:
  - 허브 `content_date` → 블로그 `published_at` 동기화
  - 15개 블로그 날짜 업데이트 완료
  - 블로그 `created_at`은 원본 보존
- **변경 파일**:
  - `pages/api/admin/content-calendar-hub.js` (hub_order 조회/정렬)
  - `pages/admin/content-calendar-hub.tsx` (hub_order 표시, 개수 계산 개선)
  - `pages/api/admin/sync-channel-status.js` (블로그 다중 연결 지원)
  - `scripts/reconnect-broken-blog-connections.js` (재연결 스크립트)
  - `scripts/sync-blog-dates-from-hub.js` (날짜 동기화 스크립트)

## ✅ 최근 작업: 허브 시스템 연결 안정화 및 순번 표시 추가 (2025-12-16)

### 완료된 작업
- **허브 콘텐츠 테이블에 순번 컬럼 추가** ✅:
  - 테이블 헤더에 "순번" 컬럼 추가
  - 페이지네이션을 고려한 순번 계산: `(page - 1) * limit + index + 1`
  - colSpan 값 5 → 6으로 수정
- **블로그 삭제 API에서 허브 상태 완전 동기화** ✅:
  - 블로그 삭제 시 `blog_post_id`와 `channel_status.blog` 모두 업데이트
  - `sync-channel-status` API 대신 직접 Supabase 업데이트로 변경
  - 다른 채널 상태는 그대로 유지
- **SMS 삭제 API에서 허브 상태 완전 동기화** ✅:
  - SMS 삭제 시 `calendar_id` 확인 후 허브 상태 동기화
  - 동적 채널 키(`sms_1234567890`) 자동 삭제
  - 기본 SMS 채널 삭제 시 다른 SMS가 있으면 첫 번째 SMS로 업데이트
  - 다른 채널 상태는 그대로 유지
- **"천안 직산" 허브 콘텐츠와 블로그 재연결** ✅:
  - 재연결 스크립트 생성 및 실행 완료
  - 허브 ID: `20abf004-daba-479f-84aa-b5644294a640`
  - 블로그 ID: `482`
- **변경 파일**:
  - `pages/admin/content-calendar-hub.tsx` (순번 컬럼 추가)
  - `pages/api/admin/blog/[id].js` (블로그 삭제 시 완전 동기화)
  - `pages/api/channels/sms/delete.js` (SMS 삭제 시 완전 동기화)
  - `scripts/reconnect-cheonan-jiksan-hub.js` (재연결 스크립트)

## ✅ 최근 작업: 진행 상황 표시 개선 (2025-12-16)

### 완료된 작업
- **진행 상황 표시를 전체 기준(타입별)으로 개선** ✅:
  - `totalDates/completedDates` → `totalItems/completedItems`로 변경
  - 날짜 × 계정 × 타입(배경, 프로필, 피드) 기준으로 진행 상황 표시
  - 3일치 생성 시: 0/18 → 1/18 (배경) → 2/18 (프로필) → 3/18 (피드) → ...
  - 현재 생성 중인 타입(배경/프로필/피드) 표시 추가
  - `generateForSingleDate`에 `onProgress` 콜백 추가하여 타입별 진행 상황 추적
- **변경 파일**:
  - `pages/admin/kakao-content.tsx` (진행 상황 표시 로직 개선)

## ✅ 최근 작업: 피드 캡션·이미지 생성 시스템 개선 (2025-12-16)

### 완료된 작업
- **basePrompt 동기화** ✅:
  - `auto-create-account1.js`: 피드 basePrompt 생성 후 `kakao_calendar` 테이블에도 자동 동기화
  - `auto-create-account2.js`: 동일하게 동기화 로직 추가
  - 화면에 "basePrompt 없음" 표시 문제 해결
- **feedData 초기화 로직 추가** ✅:
  - `auto-create-account1.js`: feedData가 없을 때 초기 구조 생성
  - `auto-create-account2.js`: 동일하게 초기화 로직 추가
  - 피드 생성 실패 방지
- **account2 캡션 생성 순서 통일** ✅:
  - `auto-create-account2.js`: 캡션을 이미지 생성 전에 생성하도록 순서 변경 (account1과 동일)
  - 일관성 향상
- **에러 처리 강화** ✅:
  - `auto-create-account1.js`: 이미지 생성 실패 시 명확한 에러 메시지 (크레딧 부족, 서버 오류 등)
  - `auto-create-account2.js`: 동일하게 에러 처리 강화
  - 디버깅 용이성 향상
- **FeedManager UI 개선** ✅:
  - `FeedManager.tsx`: `getBasePrompt()` 함수 개선 (calendarData 우선, 없으면 feedData 조회)
  - 화면 반영 개선
- **변경 파일**:
  - `pages/api/kakao-content/auto-create-account1.js` (basePrompt 동기화, feedData 초기화, 에러 처리 강화)
  - `pages/api/kakao-content/auto-create-account2.js` (basePrompt 동기화, feedData 초기화, 캡션 순서 통일, 에러 처리 강화)
  - `components/admin/kakao/FeedManager.tsx` (getBasePrompt 개선)

## ✅ 최근 작업: 12월 카카오톡 데일리 브랜딩 1주차 캘린더 설계 (2025-12-16)

- **무엇을 했나**:
  - 11월 카카오 캘린더(`docs/content-calendar/2025-11.json`)와 기본 로테이션 정의(`docs/content-calendar/kakao-feed-schedule.json`)를 분석해 구조와 톤을 그대로 유지하면서 12월 첫 주(1~7일)용 캘린더를 신규 생성.
  - `account1`(MAS GOLF ProWhale, 시니어 골드톤) / `account2`(MASGOLF Tech, 쿨 블루톤) 각각에 대해 겨울/연말 테마에 맞춘 `weeklyThemes`와 `dailySchedule`(background/profile basePrompt + message)을 설계.
  - `kakaoFeed.dailySchedule`에 12월 1~7일용 피드 이미지 카테고리·프롬프트·캡션을 추가해, 관리자 페이지 `카톡 콘텐츠` 화면에서 바로 자동 생성 및 배포 흐름을 탈 수 있도록 준비.
- **왜 했나**:
  - 11월 MUZIIK 런칭 캠페인에서 검증된 톤과 구조를 그대로 가져오면서, 12월에는 겨울 라운딩/실내 연습/연말 회고라는 새로운 시즌 메시지를 반영해 운영 부담 없이 고정 퀄리티를 유지하기 위함.
  - 향후 `/api/kakao-content/batch-generate-month` 및 `auto-create-account1/2`를 사용할 때도 12월 데이터가 동일한 구조로 쌓이도록 미리 캘린더 JSON을 준비.
- **변경 파일**:
  - `docs/content-calendar/2025-12.json` (신규) – 12월 1~7일 프로필/피드용 basePrompt, 메시지, 피드 캡션 구조 정의.
- **남은 일**:
  - 관리자 페이지 `카톡 콘텐츠`에서 2025-12-01~07 날짜 선택 후, 계정별 자동 생성 버튼 또는 선택된 날짜 생성 플로우를 사용해 실제 이미지 생성/저장 수행.
  - 필요 시 12월 8일 이후 날짜도 동일 패턴으로 확장하거나, 연말/신년 특화 테마(크리스마스, 새해 인사 등)를 주차별로 추가 설계.

## ✅ 최근 작업: 설문 조사 페이지 고급화 (2025-12-14)

### 설문 알림 및 관리 기능 강화 (2025-12-15)
- 설문 제출 시 슬랙 알림 전송 추가, 제출 시각 포함 (Asia/Seoul)
- 관리자 리스트에 제출 시각(날짜+시간) 표시
- 이름 클릭 시 상세 모달로 전체 응답 확인
- 최근 설문 재전송용 API 추가 (`/api/survey/resend-latest`, 기본 3건)

### `/survey` 페이지 연말연시 분위기 개선
- **목표**: 설문 조사 페이지를 연말연시 선물 분위기로 고급스럽게 개선
- **개선 사항**:
  1. **히어로 섹션 고급화**
     - 다크 배경 (`bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900`)
     - 골드/레드 액센트 장식 요소 추가
     - 그라데이션 텍스트 효과 (골드/레드)
     - 제품 이미지 골드 테두리 및 글로우 효과
  2. **이벤트 박스 강조**
     - 골드/레드 그라데이션 배경
     - 펄스 애니메이션 (`animate-pulse`)
     - 배경 패턴 장식 요소
     - "선착순 20명" 배지 강조
  3. **모자 갤러리 프리미엄화**
     - 호버 시 상승 애니메이션 (`hover:-translate-y-2`)
     - 골드/레드 테두리 (호버 시 강조)
     - 그림자 강화 (`shadow-2xl`)
     - 이미지 줌 효과 (`group-hover:scale-110`)
     - 골드/레드 글로우 효과
  4. **CTA 버튼 개선**
     - 골드/레드 그라데이션 배경
     - 호버 시 스케일 애니메이션 (`hover:scale-105`)
     - 그림자 강화 및 색상 변화
     - 아이콘 애니메이션 추가
  5. **전체 레이아웃 고급화**
     - 섹션 간격 조정 (`py-12 md:py-20`)
     - 반응형 타이포그래피 (`text-3xl sm:text-4xl md:text-5xl lg:text-6xl`)
     - 이벤트 안내 박스 다크 테마 적용
     - 골드/레드 액센트 일관성 유지
- **변경 파일**:
  - `pages/survey/index.tsx` (전면 개선)
- **디자인 원칙 적용**:
  - 메인 페이지 및 `/about` 페이지와 일관된 디자인 언어
  - 고객 페이지 가이드라인 준수 (`docs/customer-page-guidelines.md`)
  - 모바일 퍼스트 반응형 디자인
  - 프리미엄 브랜드 경험 제공

## ✅ 최근 작업: 블로그 이미지 마이그레이션 시작 (2025-01-XX)

### 블로그 이미지 마이그레이션 시스템 구축
- **목표**: 모든 블로그 이미지를 `originals/blog/YYYY-MM/{blog-id}/` 폴더로 정확히 마이그레이션
- **생성된 파일**:
  - `scripts/run-blog-image-migration.js` - 마이그레이션 실행 스크립트
- **Phase 1**: 전체 분석 및 현황 파악 (준비 완료)
- **Phase 2**: 발행일 순서로 글별 마이그레이션 (대기 중)
- **참고 문서**:
  - `docs/blog-image-migration-and-cleanup-plan.md` - 전체 계획
  - `docs/blog-image-migration-implementation-plan.md` - 구현 계획

---

## ✅ 최근 작업: 고객 페이지 디자인 가이드라인 작성 및 모바일 최적화 (2025-01-14)

### 완료된 작업
- **고객 페이지 디자인 가이드라인 작성** ✅:
  - `docs/customer-page-guidelines.md`: 시타 예약 페이지 및 브랜드 스토리 페이지 개선 방향 정리
  - 타이포그래피 가이드 (반응형 폰트 크기 시스템)
  - 컴포넌트 가이드 (히어로, 섹션, 카드, 정보 섹션)
  - 반응형 디자인 가이드 (브레이크포인트, 간격, 그리드)
  - 애니메이션 및 인터랙션 가이드
  - 색상 및 브랜딩 가이드
  - 접근성 가이드 (WCAG AA 기준)
  - 체크리스트 (새 페이지 제작 시 확인 사항)
  - 전체 페이지 개선 및 신규 페이지 제작 참고 자료

- **시타 예약 페이지 모바일 최적화** ✅:
  - 히어로 섹션: 메인 타이틀 행바꿈, 서브타이틀 행바꿈, 그라데이션 효과
  - 서비스 소개 카드: 호버 효과, 이미지 줌, 그림자 강화
  - 매장 정보 섹션: 아이콘 추가, 비거리 상담 전화번호 크기 증가
  - CTA 버튼: 그라데이션 배경 및 호버 애니메이션

- **브랜드 스토리 페이지 모바일 최적화** ✅:
  - 히어로 섹션: 타이포그래피 조정, 행바꿈 개선
  - 섹션 제목: 모바일 폰트 크기 조정 (36px → 24-28px)
  - 구분선: 그라데이션 효과 적용
  - 기술력 카드: 그라데이션 배경, 호버 효과, 그림자 강화
  - 섹션 간격: 모바일 최적화 (py-12 md:py-20)

- **Playwright 모바일 분석 스크립트** ✅:
  - `scripts/test-try-a-massgoo-mobile.js`: 시타 예약 페이지 모바일 분석
  - `scripts/test-about-page-mobile.js`: 브랜드 스토리 페이지 모바일 분석
  - 텍스트 크기, 레이아웃, 가독성 자동 분석

## ✅ 최근 작업: 예약 로고 발송을 MMS 시스템과 동일한 로직으로 통합 (2025-12-13)

### 완료된 작업
- **예약 로고 발송 로직 개선** ✅:
  - `pages/api/bookings/notify-customer.ts`: 예약 로고 발송 시 MMS 시스템과 동일한 `/api/solapi/reupload-image` API 사용
  - 별도의 `/api/logo/get-for-mms` API 호출 제거 (405 에러 해결)
  - 로고 메타데이터에서 `image_url`을 가져와서 MMS 시스템과 동일하게 처리
  - 기존 MMS 시스템 로직 재사용으로 일관성 확보 및 유지보수성 향상

## ✅ 최근 작업: 예약 저장 후 모달 유지 및 메시지 보내기 버튼 위치 개선 (2025-12-13)

### 완료된 작업
- **예약 저장 후 모달 유지** ✅:
  - `components/admin/bookings/BookingDetailModal.tsx`: 저장 후 `onUpdate()` 호출 제거하여 모달이 자동으로 닫히지 않도록 수정
  - 저장 후 `editData`를 최신 데이터로 업데이트하여 모달 내 정보 갱신
  - X 버튼을 눌러야만 모달이 닫히도록 변경

- **메시지 보내기 버튼 위치 개선** ✅:
  - `components/admin/bookings/BookingDetailModal.tsx`: 저장 버튼 옆에 메시지 보내기 버튼 추가
  - 편집 모드에서도 메시지를 보낼 수 있도록 개선
  - 저장 중일 때는 메시지 보내기 버튼 숨김 처리

## ✅ 최근 작업: 예약 저장 시 자동 메시지 발송 제거 및 메시지 보내기 버튼 추가 (2025-12-13)

### 완료된 작업
- **예약 저장 시 자동 메시지 발송 제거** ✅:
  - `pages/api/bookings/[id].ts`: 예약 저장 시 자동으로 메시지를 보내는 로직 제거
  - 저장은 저장만 수행하고, 메시지 발송은 별도 버튼으로만 가능하도록 변경
  - `components/admin/bookings/BookingDetailModal.tsx`: 저장 시 메시지 발송 관련 피드백 제거

- **메시지 보내기 버튼 추가** ✅:
  - `components/admin/bookings/BookingDetailModal.tsx`: 모든 예약 상태에서 메시지를 보낼 수 있는 버튼 추가
  - `pending` 상태: "예약 접수 메시지 보내기" 버튼 표시 → `booking_received` 타입 발송
  - `confirmed` 상태: "확정 메시지 보내기" 버튼 표시 → `booking_confirmed` 타입 발송
  - `handleSendReceivedMessage` 함수 추가: 예약 접수 메시지 발송 처리
  - `handleSendConfirmationMessage` 함수 수정: 확정 메시지 발송 처리

## ✅ 최근 작업: 예약 폼 개인화 및 SMS 발송 개선 (2025-12-13)

### 완료된 작업
- **예약 폼 개인화 입력 개선** ✅:
  - `pages/booking/form.tsx`: Step 2에서 Step 3로 넘어갈 때 개인화 입력이 건너뛰어지는 문제 해결
  - Step 3에서 Enter 키로 form 제출 방지 (textarea 내에서는 줄바꿈만 허용)
  - form 제출은 "예약 완료" 버튼으로만 가능하도록 수정
  - `handleFormSubmit` 함수 추가: Step 3가 아닐 때는 다음 단계로 이동
  - `handleTextareaKeyDown` 함수 추가: textarea에서 Enter 키 처리 (Shift+Enter는 줄바꿈, Enter만 누르면 제출 방지)

- **예약 생성 시 SMS 즉시 발송 개선** ✅:
  - `pages/api/bookings.ts`: 예약 생성 시 SMS가 바로 발송되지 않던 문제 해결
  - `baseUrl`을 더 안정적으로 설정 (`req.headers.host` 사용)
  - `Promise.all`로 병렬 처리하되 `await`하여 실제 발송 확인
  - `bookingData`를 직접 전달하여 최신 예약 정보 사용
  - Slack API 경로를 `/api/slack/booking-notify`로 수정
  - 5초 타임아웃 설정으로 알림 발송 완료 대기
  - 상세 로깅 추가로 디버깅 용이성 향상

## ✅ 최근 작업: 누락된 메시지 복구 시스템 (2025-12-13)

### 완료된 작업
- **누락된 메시지 복구 스크립트** ✅:
  - `scripts/recover-missing-message-2025-12-13.js`: 솔라피에서 누락된 메시지 복구 스크립트 생성
  - 솔라피 API를 통해 그룹 ID로 메시지 정보 조회 및 DB 저장
  - 자동 그룹 검색 및 수동 그룹 ID 입력 지원
  - 메시지 ID 196 복구 완료 (G4V20251213171841HWTS1FRPYJYHAKI)
  - 솔라피 API 응답 구조 처리 (messageList 객체 형태 지원)
  - Signature 재사용 방지 로직 추가

## ✅ 최근 작업: 로고 관리 시스템 개발 (2025-01-XX)

### 완료된 작업
- **로고 파일 정리 및 통합** ✅:
  - `scripts/create-logos-with-background.js`: 배경이 있는 로고 이미지 생성 스크립트 작성
  - `scripts/upload-logos-to-supabase.js`: 배경 포함 로고 추가 (massgoo_logo_black_with_bg.png, massgoo_logo_white_with_bg.png)
  - 모든 로고를 `originals/logos/` 폴더에 통합 관리
- **로고 크기 옵션 확장** ✅:
  - `pages/api/logo/get-for-mms.ts`: `small-landscape` (600x200px) 가로형 크기 추가
  - 예약 문자용 작은 가로형 로고 지원
- **예약 문자용 로고 설정** ✅:
  - `booking_settings` 테이블에 `booking_logo_id`, `booking_logo_size` 컬럼 추가
  - `pages/api/bookings/notify-customer.ts`: 예약 확정 메시지에 작은 가로형 로고 첨부
  - `components/admin/bookings/BookingSettings.tsx`: 예약 문자용 로고 설정 UI 추가
- **갤러리 관리에 로고 필터 추가** ✅:
  - `pages/admin/gallery.tsx`: "로고만 보기" 필터 추가 (`filterType: 'logos'`)
  - `is_logo = true` 또는 `folder_path`가 `originals/logos`로 시작하는 이미지 필터링
- **API 업데이트** ✅:
  - `pages/api/bookings/settings.ts`: `booking_logo_id`, `booking_logo_size` 저장/조회 지원

### 다음 단계
- **로고 합성 시스템 개발** (Phase 4):
  - `/api/logo/compose`: 로고 합성 API 개발
  - `/admin/logo-composer`: 로고 합성 페이지 개발
  - 9방향 배치, 크기/투명도/여백 조정 기능

---

## ✅ 이전 작업: 예약 메시지 시스템 개선 및 당일 예약 리마인드 기능 구현 (2025-01-XX)

### 완료된 작업
- **예약 메시지 템플릿 개선** ✅:
  - 예약 대기 메시지: 홈페이지 링크 추가, 매력적인 문구 개선
  - 예약 확정 메시지: 약도 링크 명시, 로고 포함, 매력적인 문구 개선
  - 당일 예약 리마인드 메시지: 예약 시간 2시간 전 자동 발송, 약도 링크 포함
- **BookingDetailModal 개선** ✅:
  - 예약 수정 시 API 호출로 변경 (확정 문자 자동 발송)
  - 당일 예약 메시지 UI 추가 (체크박스, 발송 시간 설정)
  - 예약 시간 2시간 전 자동 계산 및 표시
- **예약 리마인드 API 구현** ✅:
  - `/api/bookings/[id]/schedule-reminder.ts`: 예약 메시지 생성/수정/삭제/조회
  - `channel_sms` 테이블에 `draft` 상태로 저장
  - 기존 cron job(`send-scheduled-sms.js`)과 연동
- **변경 파일**:
  - `pages/api/bookings/notify-customer.ts` (메시지 템플릿 개선)
  - `components/admin/bookings/BookingDetailModal.tsx` (당일 예약 메시지 UI 추가, API 호출로 변경)
  - `pages/api/bookings/[id]/schedule-reminder.ts` (신규 생성)

## ✅ 최근 작업: 제품 합성 이미지 경로 보강 (2025-12-11)
- **무엇을 했나**: 제품 합성용 이미지가 `.png` 경로를 참조해 404가 발생하는 문제를 방어적으로 해결했습니다.
- **왜 했나**: Supabase `product_composition`에 남아 있는 `.png` 경로 때문에 모자 썸네일이 깨지는 현상이 발생했습니다.
- **변경 파일**:
  - `components/admin/ProductSelector.tsx`: 이미지 로드 실패 시 플레이스홀더로 대체하는 `onError` 핸들러 추가.
  - `lib/product-composition.ts`: Supabase 응답의 `image_url`, `color_variants`, `reference_images`에 남은 `.png`를 런타임에서 `.webp`로 변환.
  - `pages/api/compose-product-image.js`: 서버 사이드에서도 `.png` → `.webp` 변환 적용.
  - `database/update-product-composition-png-to-webp.sql`: Supabase `product_composition` 테이블의 `.png` 경로를 일괄 `.webp`로 교체하는 SQL 스크립트 추가.
- **남은 일**: Supabase SQL Editor에서 `database/update-product-composition-png-to-webp.sql`을 실행해 DB의 `.png` 경로를 `.webp`로 업데이트하면 썸네일 404가 사라집니다.

## ✅ 최근 완료된 작업

### MASSGOO X MUZIIK 설문 조사 랜딩 페이지 개발 완료 ✅ (2025-01-XX)
- **데이터베이스 설정**: ✅ 완료 (Supabase에서 `surveys` 테이블 생성 및 RLS 정책 설정)
- **설문 폼 3단계 재구성**: ✅ 완료 (7단계 → 3단계, 시타 예약 스타일 진행률 인디케이터)
- **랜딩 페이지 개선**: ✅ 완료
  - PRO3 MUZIIK 히어로 이미지 추가
  - 이벤트 문구 변경 ("설문 조사만 해도")
  - 모자 이미지 롤링 갤러리 2개 영역 분리 (버킷햇/골프모자)
  - CTA 버튼 재구성 (메인/보조)
- **PRO3 MUZIIK 제품 페이지**: ✅ 완료 (샤프트 이미지 3장 추가: 베릴 1장, 사파이어 2장)
- **목적**: 시타 참여자 전화만 해도 MASSGOO X MUZIIK 콜라보 모자 30명에게 증정 이벤트 및 마쓰구 신모델 샤프트 선호도 조사
- **완료된 작업**:
  1. **데이터베이스 스키마 생성** ✅:
     - `surveys` 테이블 생성 (`database/create-surveys-table.sql`)
     - 고객 정보, 설문 응답, 고객 연결 필드 포함
     - 인덱스 및 RLS 정책 설정
  2. **API 엔드포인트 구현** ✅:
     - `/api/survey/submit`: 설문 제출 API (고객 동기화 포함)
     - `/api/survey/list`: 설문 목록 조회 API (필터링, 검색, 정렬)
     - `/api/survey/stats`: 설문 통계 API (모델별, 연령대별, 중요 요소별)
  3. **프론트엔드 페이지 생성** ✅:
     - `/survey/index.tsx`: 설문 랜딩 페이지 (히어로 섹션, 모자 갤러리 6개, CTA 버튼)
     - `/survey/form.tsx`: 설문 폼 페이지 (7단계 진행, 단계별 검증)
     - `/survey/success.tsx`: 설문 완료 페이지
  4. **관리자 페이지 생성** ✅:
     - `/admin/surveys/index.tsx`: 설문 결과 목록 페이지 (필터링, 검색, 통계 대시보드)
     - AdminNav에 "📋 설문 관리" 메뉴 추가
  5. **제품 페이지 생성** ✅:
     - `/products/pro3-muziik.tsx`: 시크리트포스 PRO3 MUZIIK 제품 페이지 (가격: 1,700,000원)
- **주요 기능**:
  - 설문 7단계: 성함, 연락처, 연령대, 모델 선택, 중요 요소, 추가 의견, 주소
  - 고객 DB 자동 동기화 (전화번호 기준)
  - 모자 이미지 6개 (버킷햇 2개, 골프모자 4개)
  - 관리자 통계 대시보드
- **변경된 파일**:
  - `database/create-surveys-table.sql` (신규)
  - `pages/api/survey/submit.ts` (신규)
  - `pages/api/survey/list.ts` (신규)
  - `pages/api/survey/stats.ts` (신규)
  - `pages/survey/index.tsx` (신규)
  - `pages/survey/form.tsx` (신규)
  - `pages/survey/success.tsx` (신규)
  - `pages/admin/surveys/index.tsx` (신규)
  - `pages/products/pro3-muziik.tsx` (신규)
  - `components/admin/AdminNav.tsx` (설문 관리 메뉴 추가)
  - `docs/muziik-survey-landing-plan.md` (신규, 개발 계획서)

### AI 이미지 생성: 다양한 각도 참조 이미지 및 로고 자동 교체 기능 추가 ✅ (2025-12-03)
- **목적**: 제품 합성 정교도 향상 및 로고 자동 교체 기능 추가
- **완료된 작업**:
  1. **다양한 각도 참조 이미지 지원** ✅:
     - `lib/product-composition.ts`: `referenceImages` 배열 추가
     - 각 제품별로 gallery 이미지들 추가 (뱃지/문구 없는 순수 헤드 이미지)
     - `pages/api/compose-product-image.js`: 참조 이미지들을 나노바나나 API에 전달
     - 프롬프트에 참조 이미지 활용 지시 포함
  2. **로고 자동 교체 기능** ✅:
     - `lib/product-composition.ts`: `generateLogoReplacementPrompt()` 함수 추가
     - `pages/api/compose-product-image.js`: `replaceLogo` 옵션 추가 및 프롬프트에 통합
     - `pages/admin/ai-image-generator.tsx`: 로고 교체 토글 UI 추가
  3. **제품별 참조 이미지 구성** ✅:
     - gold2-sapphire: 5개 참조 이미지
     - black-beryl: 6개 참조 이미지
     - gold2: 7개 참조 이미지
     - pro3: 7개 참조 이미지
     - v3: 6개 참조 이미지
     - weapon-black: 7개 참조 이미지
     - weapon-gold-4-1: 7개 참조 이미지
- **사용 방법**:
  1. AI 이미지 생성 페이지에서 제품 합성 활성화
  2. 제품 선택
  3. "로고 자동 교체" 토글 활성화 (선택사항)
  4. 이미지 생성 또는 갤러리에서 베이스 이미지 선택 후 합성
  5. 나노바나나가 여러 각도 참조 이미지를 활용하여 정교하게 합성
  6. 로고 교체 활성화 시 모자/옷의 로고를 MASSGOO로 자동 변경
- **변경된 파일**:
  - `lib/product-composition.ts` (referenceImages 추가, 로고 교체 프롬프트)
  - `pages/api/compose-product-image.js` (참조 이미지 처리, 로고 교체 옵션)
  - `pages/admin/ai-image-generator.tsx` (로고 교체 UI)

### AI 이미지 생성: 베이스 이미지 갤러리 선택 기능 추가 ✅ (2025-12-03)
- **목적**: 이미 생성된 이미지에 제품 합성 기능 확장 (갤러리에서 베이스 이미지 선택)
- **완료된 작업**:
  1. **베이스 이미지 선택 모드 추가** ✅:
     - `pages/admin/ai-image-generator.tsx`: 베이스 이미지 모드 선택 UI 추가
     - "새 이미지 생성" / "갤러리에서 선택" 라디오 버튼
     - GalleryPicker 모달 통합
  2. **워크플로우 수정** ✅:
     - 갤러리 모드 선택 시: AI 생성 스킵하고 바로 제품 합성
     - 새 이미지 생성 모드: 기존 플로우 유지 (AI 생성 → 제품 합성)
  3. **프롬프트 최적화** ✅:
     - `lib/product-composition.ts`: 드라이버 헤드만 교체하도록 프롬프트 구체화
     - 손 위치, 그립, 각도 유지하도록 명시
  4. **UI 개선** ✅:
     - 갤러리 모드 선택 시 제품 합성 자동 활성화
     - 선택된 베이스 이미지 미리보기
     - 생성 버튼 텍스트 동적 변경 ("이미지 생성하기" / "제품 합성하기")
- **사용 방법**:
  1. AI 이미지 생성 페이지 접속
  2. "갤러리에서 선택" 모드 선택
  3. 갤러리에서 베이스 이미지 선택 (예: `kakao-account2-profile-1764661408817-1-1.png`)
  4. 제품 선택 (시크리트웨폰 등)
  5. "제품 합성하기" 버튼 클릭
  6. 나노 바나나로 드라이버 헤드만 교체된 이미지 생성
- **변경된 파일**:
  - `pages/admin/ai-image-generator.tsx` (베이스 이미지 선택 모드 추가)
  - `lib/product-composition.ts` (프롬프트 최적화)

### 갤러리 이미지 편집 기능: Photopea → cleanup.pictures 변경 ✅ (2025-12-03)
- **목적**: Photopea에서 이미지 로딩 실패 문제 해결 및 cleanup.pictures로 전환
- **완료된 작업**:
  1. **수정 버튼 핸들러 변경** ✅:
     - `components/admin/GalleryPicker.tsx`: Photopea → cleanup.pictures로 변경
     - 이미지 다운로드 기능 추가
     - cleanup.pictures 자동 열기 기능 구현
  2. **기능 구현** ✅:
     - 이미지를 blob으로 다운로드
     - 다운로드 폴더에 자동 저장 (사용자가 cleanup.pictures에 드래그 앤 드롭 가능)
     - cleanup.pictures 새 창으로 자동 열기
     - 사용자 안내 메시지 표시
  3. **빌드 테스트** ✅:
     - Next.js 빌드 성공 확인
     - 린터 오류 없음 확인
- **해결된 문제**:
  - Photopea에서 이미지 로딩 실패 문제 해결
  - cleanup.pictures로 원활한 편집 워크플로우 제공
- **변경된 파일**:
  - `components/admin/GalleryPicker.tsx` (수정 버튼 핸들러)

### 제품 이미지 파일명 영어 변환 작업 ✅ (2025-11-30)
- **목적**: 한글 파일명으로 인한 URL 인코딩 문제 해결 및 이미지 깨짐 문제 해결
- **완료된 작업**:
  1. **파일명 변경** ✅:
     - 제품 합성용 솔 이미지 7개: `secret-force-*-sole-*.webp` 형식
     - 갤러리 이미지 34개: `secret-force-*-gallery-*.webp` 형식
     - 총 41개 파일명 변경 완료
  2. **코드 업데이트** ✅:
     - `lib/product-composition.ts`: 모든 제품 이미지 경로 업데이트
     - `pages/index.js`: 메인 페이지 갤러리 이미지 경로 업데이트
     - `pages/products/pro3.tsx`, `v3.tsx`, `gold-weapon4.tsx`: 제품 상세 페이지 이미지 경로 업데이트
     - `components/admin/ProductSelector.tsx`: `encodeURI()` 제거 (영어 파일명 사용)
  3. **소스 코드 점검** ✅:
     - 모든 한글 파일명 참조 제거 확인
     - 빌드 테스트 성공
     - 파일 존재 확인 완료
- **해결된 문제**:
  - V3 이미지 404 에러 해결
  - 한글 파일명 인코딩 문제 해결
  - Next.js Image 컴포넌트 호환성 개선
- **관련 문서**: `docs/product-image-filename-migration-report.md`

### 프리미엄 드라이버 컬렉션 페이지: 제품 클릭 링크 개선 및 모달 이미지 갤러리 추가 ✅ (2025-01-XX)
- **목적**: 프리미엄 드라이버 컬렉션에서 제품 이미지 클릭 시 적절한 페이지로 연결하고, 모달에서 여러 이미지 표시
- **완료된 작업**:
  1. **제품 클릭 링크 분기 처리** ✅:
     - 1번 제품 (시크리트포스 골드 2 MUZIIK): `/products/gold2-sapphire` 페이지로 이동
     - 2번 제품 (시크리트웨폰 블랙 MUZIIK): `/products/weapon-beryl` 페이지로 이동
     - 3번 제품 (시크리트포스 골드 2): 모달 표시 (제품 페이지 없음)
     - 4번 제품 (시크리트포스 PRO 3): 모달 표시 (9장 이미지)
     - 5번 제품 (시크리트포스 V3): 모달 표시 (8장 이미지)
     - 6번 제품 (시크리트웨폰 블랙): 모달 표시 (10장 이미지)
     - 7번 제품 (시크리트웨폰 골드 4.1): 모달 표시 (10장 이미지)
  2. **모달 이미지 갤러리 업데이트** ✅:
     - PRO 3: 9장 이미지 추가 (메인 + 공홈 8장)
     - V3: 8장 이미지 추가 (메인 + 공홈 7장)
     - 웨폰 블랙: 10장 이미지 추가 (메인 + 공홈 9장)
     - 골드 웨폰 4.1: 10장 이미지 추가 (메인 + 공홈 9장)
     - 모달에서 썸네일 갤러리로 여러 이미지 선택 및 표시 가능
- **변경 파일**:
  - `pages/index.js` (`handleProductClick` 함수 수정, products 배열의 images 업데이트)
- **결과**: 제품 페이지가 있는 제품은 해당 페이지로 이동하고, 모달로 표시되는 제품들도 여러 장의 이미지를 갤러리 형태로 확인할 수 있음

### AI 이미지 제품 합성 시스템: 제품 이미지 경로 업데이트 및 제품 페이지 생성 ✅ (2025-01-XX)
- **목적**: 제품 합성에 사용되는 이미지를 솔 이미지로 업데이트하고, PRO 3, V3, 골드 웨폰 4.1 제품 페이지 생성
- **완료된 작업**:
  1. **제품 이미지 URL 업데이트** ✅:
     - 골드2 뮤직 (gold2-sapphire): `마쓰구_시크리트포스_골드_2_500.png`
     - 골드2 (gold2): `마쓰구_시크리트포스_골드_2_500.png`
     - 웨폰 블랙 뮤직 (black-beryl): `마쓰구_시크리트웨폰_블랙_500.png`
     - 웨폰 블랙 (weapon-black): `마쓰구_시크리트웨폰_블랙_500.png`
     - 골드 웨폰 4.1 (weapon-gold-4-1): `마쓰구_시크리트웨폰_4.1_500.png`
     - PRO 3 (pro3): `마쓰구_시크리트포스_PRO_500.png`
     - V3 (v3): `마쓰구_시크리트포스_V3_05_00.jpg` (솔 이미지로 업데이트)
  2. **PRO 3 제품 페이지 생성** ✅:
     - `pages/products/pro3.tsx` 생성
     - 9장의 제품 이미지 설정 (메인 이미지 + 공홈 이미지 8장)
     - 가격: 1,150,000원
     - 제품 상세 정보, 고객 후기 섹션 포함
  3. **V3 제품 페이지 생성** ✅:
     - `pages/products/v3.tsx` 생성
     - 8장의 제품 이미지 설정 (메인 이미지 + 공홈 이미지 7장)
     - 가격: 950,000원
     - 제품 상세 정보, 고객 후기 섹션 포함
  4. **시크리트웨폰 골드 4.1 제품 페이지 생성** ✅:
     - `pages/products/gold-weapon4.tsx` 생성
     - 10장의 제품 이미지 설정 (메인 이미지 + 공홈 이미지 9장)
     - 가격: 1,700,000원
     - 제품 상세 정보, 고객 후기 섹션 포함
     - 골드 톤에 맞는 배경색 적용 (from-yellow-50 via-white to-yellow-100)
- **변경 파일**:
  - `lib/product-composition.ts` (제품 이미지 URL 업데이트, V3 이미지 경로 수정)
  - `pages/products/pro3.tsx` (신규 생성)
  - `pages/products/v3.tsx` (신규 생성)
  - `pages/products/gold-weapon4.tsx` (신규 생성)
- **결과**: 제품 합성 시 솔 이미지가 사용되며, PRO 3, V3, 골드 웨폰 4.1 제품 페이지가 생성되어 제품 상세 정보를 확인할 수 있음

### 블로그 글 302 (Mas9Popup) AI 이미지 생성 및 추가 완료 ✅ (2025-11-29)
- **목적**: 마쓰구 이미지 생성기 API를 사용하여 AI 이미지 생성 및 블로그 콘텐츠에 추가
- **완료된 작업**:
  1. **기존 DALL-E 3 이미지 제거** ✅:
     - 이전에 생성된 DALL-E 3 이미지 2장 제거 (품질 문제)
  2. **마쓰구 이미지 생성기 API로 재생성** ✅:
     - `/api/kakao-content/generate-images` API 사용 (FAL AI hidream-i1-dev)
     - "비공인 드라이버의 필요성" 이미지 1장 생성
     - "고반발 골프 드라이버" 이미지 1장 생성
     - 한국 골퍼 스펙 자동 적용 (50-70세, 한국인 외모)
     - 시니어 감성형 브랜딩 톤 적용
     - 총 2장 생성 완료
  3. **이미지 업로드 및 추가** ✅:
     - 생성된 이미지를 Supabase Storage에 업로드 (`originals/blog/2017-03/302/`)
     - 첫 번째 이미지를 본문 시작 부분에 추가
     - 두 번째 이미지를 본문 중간에 추가
  4. **메타데이터 생성** ✅:
     - 생성된 이미지 2장에 메타데이터 생성 완료 (일반 메타 생성 사용)
- **변경 파일**:
  - `scripts/generate-masgolf-images-for-blog-302.js` (신규, 마쓰구 이미지 생성기 API 사용)
  - `scripts/generate-and-add-images-to-blog-302.js` (기존, DALL-E 3 사용 - 더 이상 사용 안 함)
- **최종 상태**:
  - 블로그 글 이미지: 3개 (대표 이미지 1개 + AI 생성 이미지 2개)
  - 갤러리 이미지: 2개 (AI 생성 이미지)
  - 메타데이터: 2개 생성 완료
- **결과**: AI 이미지 생성 및 추가 완료, 메타데이터 생성 완료

### 블로그 글 302 (Mas9Popup) 최적화 완료 ✅ (2025-11-29)
- **목적**: 제목 표현 개선, 중복 제목 제거, 관련 포스트 제거, 문서 업데이트
- **완료된 작업**:
  1. **제목 표현 개선** ✅:
     - "Mas9Popup:" → "Mas9Popup -" (콜론을 하이픈으로 변경)
  2. **콘텐츠 정제** ✅:
     - 과도한 키워드 반복 제거 (4개 수정)
     - 플레이스홀더 이미지 제거
  3. **하드코딩된 관련 포스트 제거** ✅:
     - "관련 포스트" 섹션 제거 (동적 "관련 게시물"로 대체)
  4. **태그 섹션 제거** ✅:
     - "### 태그" 섹션 제거
  5. **문서 업데이트** ✅:
     - `docs/blog-post-optimization-guide.md`에 제목 표현 개선 가이드 추가
     - AI 이미지 생성 및 추가 가이드 추가
     - 관련 포스트 → 관련 게시물 용어 통일 명시
- **결과**: 블로그 글 302 최적화 완료, 문서 업데이트 완료

### 블로그 글 303 (스타와 함께 마쓰구와 함께) 슬러그 변경 및 콘텐츠 수정 완료 ✅ (2025-11-29)
- **목적**: 슬러그 변경, 콘텐츠 정리, YouTube 영상 추가
- **완료된 작업**:
  1. **슬러그 변경** ✅:
     - `massgoo` → `golf-event-with-stars-and-massgoo`
     - 새 URL: `/blog/golf-event-with-stars-and-massgoo`
  2. **콘텐츠 정리** ✅:
     - 링크 제거: `[[Mas9Golf] 충북경제단체 골프친선대회 협찬행사^^](/blog/mas9golf friendly-tournament-sponsorship)`
     - 이미지 제거: `complete migration 1757772544303 1` 이미지
  3. **YouTube 영상 추가** ✅:
     - YouTube iframe 추가: `https://www.youtube.com/embed/pdXs9OgRbFU?start=18`
     - 18초부터 재생되도록 설정
- **결과**: 슬러그 변경 및 콘텐츠 수정 완료, YouTube 영상 추가 완료

### 블로그 글 303 (스타와 함께 마쓰구와 함께) 슬러그 변경 및 이미지 복구 완료 ✅ (2025-11-29)
- **목적**: 슬러그 변경 및 깨진 이미지 복구
- **완료된 작업**:
  1. **슬러그 변경** ✅:
     - `golf-event-with-stars-and-matsugu` → `massgoo`
  2. **이미지 복구** ✅:
     - 루트 폴더에서 massgoo 관련 이미지 3개 발견 및 복구
     - 이미지를 `originals/blog/2017-03/303/` 폴더로 이동
     - 콘텐츠에 이미지 추가 및 URL 업데이트
  3. **메타데이터 생성** ✅:
     - 복구된 이미지 3개에 메타데이터 생성 완료 (일반 메타 생성 사용)
- **최종 상태**:
  - 블로그 글 이미지: 4개 (YouTube 썸네일 1개 + 복구된 이미지 3개)
  - 갤러리 이미지: 3개 (복구된 이미지)
  - 슬러그: `massgoo`
- **결과**: 슬러그 변경 및 이미지 복구 완료, 모든 이미지 메타데이터 생성 완료

### 블로그 글 303 (스타와 함께 마쓰구와 함께) 마이그레이션 완료 ✅ (2025-11-29)
- **목적**: 5번째 블로그 글 마이그레이션 및 최적화
- **완료된 작업**:
  1. **콘텐츠 최적화** ✅:
     - 하드코딩된 관련 포스트 섹션 제거
     - 태그 섹션 제거
     - 플레이스홀더 이미지 1개 제거 ("이미지URL")
     - 중복 이미지 1개 제거
     - 과도한 키워드 패턴 정제 (2개 수정)
     - 텍스트 단락 개선 (3개 단락 추가)
  2. **이미지 관리** ✅:
     - YouTube 썸네일 이미지 1개 확인 (대표 이미지로 사용 중)
     - 플레이스홀더 이미지 제거로 콘텐츠 정리
  3. **메타데이터** ⚠️:
     - YouTube 썸네일은 외부 URL이므로 메타데이터 생성 불필요
- **결과**: 블로그 글 303 마이그레이션 완료, 플레이스홀더 이미지 제거로 콘텐츠 정리 완료

### 블로그 글 304 (마쓰구 탄생 스토리) 마이그레이션 완료 ✅ (2025-11-29)
- **목적**: 4번째 블로그 글 마이그레이션 및 최적화
- **완료된 작업**:
  1. **콘텐츠 최적화** ✅:
     - 하드코딩된 관련 포스트 섹션 제거
     - 태그 섹션 제거
     - 플레이스홀더 이미지 2개 제거 ("드라이버이미지URL", "마쓰구이미지URL")
     - 텍스트 단락 개선 (11개 단락 추가)
  2. **이미지 관리** ✅:
     - 대표 이미지 1개 확인 (originals/blog/2017-03/304/)
     - 플레이스홀더 이미지 제거로 콘텐츠 정리
  3. **메타데이터 생성** ✅:
     - 대표 이미지 1개에 메타데이터 생성 완료 (일반 메타 생성 사용)
- **결과**: 블로그 글 304 마이그레이션 완료, 플레이스홀더 이미지 제거로 콘텐츠 정리 완료

### 블로그 이미지 마이그레이션 프로세스 개선 및 이경영 글 최적화 완료 ✅ (2025-11-29)
- **목적**: 블로그 이미지 마이그레이션 프로세스 개선 및 문서화
- **완료된 작업**:
  1. **문서 업데이트** ✅:
     - `docs/blog-image-migration-and-cleanup-plan.md`: 이미지 이동 후 대기 시간 및 메타데이터 생성 방법 설명 추가
     - `docs/blog-post-optimization-guide.md`: 메타데이터 생성 방법 및 대기 시간 가이드 추가
  2. **스크립트 개선** ✅:
     - `scripts/optimize-blog-post-complete.js`: 이미지 이동 후 10초 대기 시간 자동 추가 (Storage 안정화)
  3. **이경영 글(ID: 305) 최적화 완료** ✅:
     - 루트 폴더에 있던 이미지 2개를 갤러리 폴더로 이동 완료
     - 깨진 이미지 2개 제거 완료
     - 주황색 옷 이미지 복구 완료 (Storage 루트에서 찾아서 이동)
     - 모든 이미지(3개)에 메타데이터 생성 완료 (일반 메타 생성 사용)
  4. **메타데이터 생성 방법 명확화** ✅:
     - 블로그 이미지는 "일반 메타 생성" 사용 (골프 AI 생성 아님)
     - 이유: 연령대 분석이나 골프 카테고리 자동 결정 같은 특화 기능이 필요 없음
     - ALT, Title, Description, Keywords만 있으면 충분

### 제목 중복 제거 기능 개선 및 김구식 글 최적화 완료 ✅ (2025-11-29)
- **목적**: 제목과 내용 상단 타이틀의 중복 제거로 가독성 및 SEO 최적화
- **완료된 작업**:
  1. **`refine-blog-content.js` 개선** ✅:
     - 한글 조사(을/를, 이/가, 은/는 등) 처리 추가로 유사도 계산 정확도 향상
     - 마크다운 제목(# ## ###)과 원본 제목의 중복 제거 (유사도 40% 이상)
     - 내용 상단 타이틀과 원본 제목의 중복 제거 (유사도 40% 이상, 핵심 키워드 3개 이상 매칭)
     - 예: 제목 "마쓰구골프 드라이버를 사용하는 세계적인 골프지도자 김구식 선생님을 소개합니다."와 내용 상단 "세계적인 골프지도자 김구식 선생님 소개 - 고반발드라이버 비거리향상 추천" 중복 제거
  2. **문서 업데이트** ✅:
     - `docs/blog-post-optimization-guide.md`에 제목 중복 제거 가이드 추가
     - Phase 3 콘텐츠 정제 섹션에 상세 설명 추가
  3. **김구식 글(ID: 122) 최적화 완료** ✅:
     - 중복 마크다운 제목 제거 완료 (유사도 62.5%)
     - 전체 최적화 스크립트 실행 완료 (11/11 단계 성공)
     - 이미지 배치 최적화 완료
     - 가독성 및 SEO 개선 완료

### 블로그 포스트 최적화 가이드 작성 및 강석 글 최적화 완료 ✅ (2025-11-29)
- **목적**: 블로그 포스트의 이미지 중복 제거, 콘텐츠 정제, 이미지 배치 최적화
- **완료된 작업**:
  1. **최적화 가이드 문서 작성** ✅:
     - `docs/blog-post-optimization-guide.md` 생성
     - `docs/blog-paragraph-splitting-and-image-placement-guide.md` 생성 (단락 분할 및 이미지 배치 가이드)
     - 6단계 작업 체크리스트 (현황 분석 → 중복 제거 → 콘텐츠 정제 → 이미지 배치 → 메타데이터 → 검증)
     - 9개의 실행 스크립트 작성 및 문서화
  2. **실행 스크립트 작성** ✅:
     - `scripts/analyze-blog-gallery-images.js`: 블로그와 갤러리 이미지 비교 분석
     - `scripts/remove-duplicate-blog-images.js`: 블로그 글 내 중복 이미지 제거
     - `scripts/refine-blog-content.js`: 과도한 키워드 제거, 자연스러운 문장으로 수정
     - `scripts/remove-hardcoded-related-posts.js`: 하드코딩된 관련 포스트 섹션 제거
     - `scripts/remove-tags-section-from-content.js`: content 내 태그 섹션 제거
     - `scripts/restore-missing-images-to-content.js`: 갤러리에 있지만 content에 없는 이미지 복구
     - `scripts/improve-paragraph-splitting.js`: 텍스트 단락을 문장 단위로 분리
     - `scripts/optimize-image-placement.js`: 이미지를 글 중간중간에 적절히 배치
     - `scripts/optimize-blog-post-complete.js`: 모든 최적화 단계를 자동으로 실행하는 통합 스크립트
  3. **강석 글(ID 123) 최적화 완료** ✅:
     - **현황 분석**: 블로그 글 13개 이미지 → 고유 7개, 중복 6개 확인
     - **중복 제거**: 6개 중복 이미지 제거 완료 (13개 → 7개)
     - **콘텐츠 정제**: 과도한 키워드 반복 4개 수정 ("고반발드라이버 추천 - 드라이버추천 추천 - 골프드라이버 추천 - 비거리향상 추천" → "고반발드라이버 비거리향상 추천")
     - **하드코딩된 관련 포스트 제거**: content 내 관련 포스트 섹션 제거 완료
     - **태그 섹션 제거**: content 내 태그 섹션 제거 완료
     - **누락된 이미지 복구**: 갤러리에 있지만 content에 없는 3개 이미지 복구 완료
     - **텍스트 단락 개선**: 텍스트 단락을 문장 단위로 분리 (4개 → 11개)
     - **이미지 배치 최적화**: 7개 이미지를 글 중간중간에 적절히 배치 완료
     - **최종 결과**: 
       - 블로그 글 이미지 7개 = 갤러리 이미지 7개, 중복 0개
       - 이미지/텍스트 비율: 0.64 (적절)
       - 총 단락: 18개 (제목 3개 + 텍스트 11개 + 이미지 7개)
  4. **다음 블로그 글 마이그레이션 준비** ✅:
     - 통합 스크립트 생성: `scripts/optimize-blog-post-complete.js`
     - 모든 최적화 단계를 자동으로 실행하는 원클릭 솔루션 제공
- **참고 문서**: 
  - `docs/blog-post-optimization-guide.md`
  - `docs/blog-paragraph-splitting-and-image-placement-guide.md`

### 블로그 이미지 마이그레이션 및 정리 계획 수립 및 Phase 1 완료 ✅ (2025-11-29)
- **목적**: Wix에서 마이그레이션된 블로그 이미지들을 체계적으로 정리하고 최적화
- **완료된 작업**:
  1. **계획 문서 작성** ✅:
     - `docs/blog-image-migration-and-cleanup-plan.md` 생성
     - 5단계 실행 계획 수립 (분석 → 정리 → 중복 제거 → 메타데이터 → 검증)
  2. **Phase 1: 전체 분석 완료** ✅:
     - 전체 블로그 이미지 현황 파악 (164개 글, 524개 고유 이미지)
     - 중복 이미지 그룹 식별 (2개 그룹, 4개 이미지)
     - Storage에서 못 찾은 이미지 확인 (93개)
     - 외부 URL 확인 (7개)
     - 분석 결과 저장: `backup/blog-image-analysis-2025-11-29T00-19-21.json`
     - 중복 그룹 저장: `backup/blog-duplicate-groups-2025-11-29T00-19-21.json`
  3. **Phase 1 스크립트 생성** ✅:
     - `scripts/phase1-analyze-all-blog-images.js` 생성
- **분석 결과 요약**:
  - 총 블로그 글: 164개
  - 고유 이미지 URL: 524개
  - Storage에서 찾음: 424개 (80.9%)
  - Storage에서 못 찾음: 93개 (17.8%) ⚠️
  - 외부 URL: 7개 (1.3%) ⚠️
  - 중복 이미지 그룹: 2개 (4개 이미지)
- **다음 단계**: Phase 2 (발행일 순서로 글별 정리) - 강석 글부터 시작
- **변경 파일**:
  - `docs/blog-image-migration-and-cleanup-plan.md` (신규)
  - `scripts/phase1-analyze-all-blog-images.js` (신규)
  - `backup/blog-image-analysis-2025-11-29T00-19-21.json` (분석 결과)
  - `backup/blog-duplicate-groups-2025-11-29T00-19-21.json` (중복 그룹)

### 80번 메시지 이미지 복구 완료 ✅ (2025-11-28)
- **목적**: 솔라피 콘솔에서 수동으로 다운로드한 이미지를 Supabase Storage에 업로드하여 80번 메시지의 이미지 복구
- **완료된 작업**:
  1. **로컬 파일 기반 이미지 복구 스크립트 생성** ✅:
     - `scripts/recover-message-80-image-from-file.js` 생성
     - 로컬 파일 경로를 받아서 Supabase Storage에 업로드
     - `image_metadata` 테이블에 메타데이터 저장
     - `channel_sms.image_url` 업데이트
  2. **이미지 복구 실행** ✅:
     - 다운로드 폴더의 이미지 파일(`나노레벨_40g_티타늄샤프트 (1).jpg`, 210.37KB) 사용
     - Supabase Storage 경로: `originals/mms/2025-11-18/80/mms-80-1764338795245-1.jpg`
     - 공개 URL 생성 및 DB 업데이트 완료
     - 메타데이터 ID: 56563
- **변경 파일**:
  - `scripts/recover-message-80-image-from-file.js` (신규)
- **결과**: SMS 편집 페이지(`/admin/sms?id=80`)에서 이미지가 정상적으로 표시됨

### 고객 메시지 이력 한글화 및 상태 노출 개선 ✅ (2025-11-28)
- **목적**: 고객 메시지 이력 모달에서 영어 상태값(Sent/Partial 등) 대신 직관적인 한글 라벨을 제공해 운영자가 메시지 상태를 빠르게 파악할 수 있도록 개선
- **완료된 작업**:
  1. 발송 상태(`sendStatus`) 한글화: `sent → 발송 완료`, `partial → 일부 발송`, `failed → 발송 실패`, `scheduled → 예약 발송`
  2. 메시지 상태(`messageStatus`) 한글화: `sent → 메시지 완료`, `partial → 메시지 부분 발송`, `draft → 초안`, `scheduled → 예약됨` 등
  3. 메시지 타입(SMS/LMS/MMS)은 기존값을 유지하고 나머지 배지 문구만 한글로 변환
- **변경 파일**:
  - `components/admin/CustomerMessageHistoryModal.tsx`

### 알리고 템플릿 내용 확인 및 마이그레이션 계획서 업데이트 ✅ (2025-11-27)
- **목적**: 알리고 템플릿 내용 확인 후 솔라피 마이그레이션 계획서 업데이트
- **완료된 작업**:
  1. **템플릿 내용 확인** ✅:
     - 기본안내 (TI_8967): 고반발 드라이버 상세정보 안내 템플릿 내용 확인
     - 시타사이트&약도안내 최신 (TV_5953): 시타 예약 안내 템플릿 내용 확인
     - 당일시타예약최신: 당일 시타 예약 리마인더 템플릿 내용 확인
  2. **마이그레이션 계획서 업데이트** ✅:
     - 각 템플릿의 상세 내용, 버튼 설정, 변수 정보 추가
     - 솔라피 등록용 템플릿 가이드 작성
     - 우선순위 업데이트 (3개 템플릿 모두 우선 등록 필요로 표시)
  3. **템플릿 상세 정보**:
     - **기본안내 (TI_8967)**: 제품 상세정보 안내, 버튼: 마쓰구 공식 홈페이지
     - **시타사이트&약도안내 (TV_5953)**: 시타 예약 안내, 버튼 2개 (시타 예약하기, 약도 안내)
     - **당일시타예약최신**: 당일 시타 예약 리마인더, 버튼: 약도 안내
- **변경 파일**:
  - `docs/aligo-to-solapi-migration-plan.md`: 3개 템플릿 상세 내용 추가, 우선순위 업데이트
- **다음 단계**:
  - 솔라피 대시보드에서 3개 템플릿 등록
  - 템플릿 검수 완료 대기
  - 코드에 템플릿 코드 반영

### 예약 관리 고객 동기화 기능 추가 ✅ (2025-11-26)
- **목적**: 예약 관리에서 고객 연결 상태 확인 및 동기화 기능 추가
- **완료된 작업**:
  1. **고객 연결 상태 표시** ✅:
     - ✅ 연결됨: 초록색 체크 아이콘 표시
     - 🔗 연결 필요: 주황색 링크 아이콘 표시 (고객 정보는 있지만 customer_profile_id가 없음)
     - ⚠️ 고객 정보 없음: 회색 경고 아이콘 표시
  2. **개별 동기화 기능** ✅:
     - 각 예약 행에 동기화 버튼(🔄) 추가 (연결이 필요한 경우에만 표시)
     - 동기화 모달에서 선택 가능한 항목:
       - 이름 동기화 (예약 이름 → 고객 이름)
       - 전화번호 동기화
       - 이메일 동기화 (예약 이메일 ↔ 고객 이메일)
       - 고객 연결 (customer_profile_id 설정) - 필수 권장
  3. **일괄 동기화 기능** ✅:
     - 체크박스 컬럼 추가 (전체 선택/해제 지원)
     - 선택된 예약들을 한 번에 동기화
     - 동기화 옵션 선택 가능 (이름, 전화번호, 이메일, 고객 연결)
     - 동기화 가능한 예약만 필터링 (고객 정보가 있는 예약만)
  4. **동기화 모달** ✅:
     - 예약 정보와 고객 정보 비교 표시
     - 변경될 내용 미리보기
     - 체크박스로 동기화할 항목 선택
     - 고객 연결 상태 표시
- **파일 수정**:
  - `components/admin/bookings/BookingListView.tsx`: 고객 연결 상태 확인, 개별/일괄 동기화 기능, 동기화 모달 추가
  - `pages/admin/booking/index.tsx`: 고객 데이터 1,000건 제한 문제 해결을 위해 페이지네이션 로드 적용 (누락 고객도 동기화 가능)
  - `pages/admin/customers/index.tsx`: URL 파라미터 기반 자동 검색/편집 지원 (`?phone=...&autoEdit=true`)
  - `components/admin/bookings/QuickAddBookingModal.tsx`: 고객 검색 자동완성(이름/전화) 및 기본 서비스 “마쓰구 드라이버 시타서비스” 적용
  - `pages/api/bookings/next-available.ts`: ‘다음 예약 가능일’ 문자열이 실제 날짜와 일치하도록 KST 기준 포맷 로직 수정
  - `pages/booking.tsx`: 사용자가 선택한 예약 정보에 요일 표기를 추가해 가독성 향상
  - `pages/booking/form.tsx`: 기본 정보 입력 UX 개선 (전화번호 자동 포맷·숫자 키패드, 이메일 토글, 고객 안내 단순화)
  - `pages/booking/form.tsx`: 골프 정보 단계의 탄도/구질 선택 UI를 시각 아이콘(**▽30°/△45°/▲60°**, 방향 화살표)으로 개선하고 구질 복수 선택을 지원
  - `pages/booking/form.tsx`: 연령대 선택을 골프 정보 단계로 이동하고, 연령대에 따라 클럽/비거리 placeholder·추천값이 자동 변경되도록 개선

### 프로덕션 빌드 테스트 및 배포 완료 ✅ (2025-11-23)
- **목적**: 빌드 테스트 후 프로덕션 배포
- **완료된 작업**:
  1. **빌드 테스트 실행** ✅:
     - `npm run predeploy` 실행
     - `.next` 폴더 삭제 및 빌드 캐시 정리
     - Next.js 프로덕션 빌드 성공 (190개 페이지 생성)
     - Sitemap 생성 완료
  2. **Vercel 프로덕션 배포** ✅:
     - Vercel CLI를 통한 프로덕션 배포 실행
     - 배포 URL: `https://mas-936rt7ypd-taksoo-kims-projects.vercel.app`
     - 배포 상태: Ready (완료)
     - 빌드 시간: 약 2분
- **배포 정보**:
  - 배포 시간: 2025-11-23
  - 배포 환경: Production
  - 빌드 상태: 성공
  - 배포 상태: Ready

### AI 이미지 생성 고도화: No Makeup 및 ChatGPT 프롬프트 최적화 ✅ (2025-11-23)
- **목적**: AI 이미지 생성 메뉴에 자연스러운 인물 사진 옵션(No Makeup) 및 ChatGPT 프롬프트 최적화 기능 추가
- **완료된 작업**:
  1. **No Makeup 옵션 추가** ✅:
     - 자연스러운 인물 사진 생성 옵션 추가
     - 기본값: true (활성화)
     - 프롬프트에 'no makeup, natural skin, authentic appearance, realistic skin texture' 자동 추가
     - 토글 스위치 UI 추가 (파란색 스타일)
  2. **ChatGPT 프롬프트 최적화 옵션 추가** ✅:
     - ChatGPT를 사용하여 프롬프트를 영어로 최적화하는 옵션 추가
     - 기본값: false (선택사항)
     - `/api/kakao-content/generate-prompt` API 연동
     - 추가 시간 소요 안내 포함
  3. **프롬프트 개선** ✅:
     - `buildUniversalPrompt` 함수에 자연스러운 스타일 스펙 추가
     - 한국인 외모 강화 지시 유지
     - 자연스러운 피부 질감, 현실적인 인물 특징 강조
  4. **피팅 이미지 업데이트** ✅:
     - 새로 생성된 No Makeup 적용 이미지로 `try-a-massgoo.tsx` 업데이트
     - URL: `https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/ai-generated/2025-11-23/ai-generated-senior-emotional-feed-1763898284516-1-1.jpg`
- **파일 수정**:
  - `pages/admin/ai-image-generator.tsx`: No Makeup 옵션, ChatGPT 최적화 옵션 추가, 프롬프트 로직 개선
  - `pages/try-a-massgoo.tsx`: 새로 생성된 피팅 이미지 URL 업데이트

### 피팅 이미지 생성 및 예약 프론트 페이지 개선 ✅ (2025-11-23)
- **목적**: AI 이미지 생성 메뉴에 피팅 이미지 프리셋 추가 및 예약 프론트 페이지를 브랜드 색상(블랙/골드/블루)에 맞게 개선
- **완료된 작업**:
  1. **AI 이미지 생성 페이지에 피팅 이미지 프리셋 추가** ✅:
     - "🎯 피팅 이미지 생성" 프리셋 버튼 추가
     - 클릭 시 자동으로 프롬프트, 브랜딩 톤(시니어 중심 감성형), 이미지 타입(피드), 브랜딩 옵션(전체 브랜딩) 설정
     - 전문 피터 작업 장면 프롬프트 자동 입력
     - No Makeup 옵션 기본값 true로 설정
  2. **try-a-massgoo.tsx 히어로 섹션 개선** ✅:
     - 블랙 배경 + 매장 실제 사진 (`massgoo_studio_test_3.png`) 배경 적용
     - 골드 그라데이션 타이틀 (KGFA 1급 시타 체험하기)
     - 골드 액센트 배지 (KGFA 1급 전문 피터)
     - 블루 CTA 버튼 (신뢰감 강조)
  3. **try-a-massgoo.tsx 서비스 소개에 실제 이미지 추가** ✅:
     - KGFA 1급 전문 피터: 시타 상담 장면 (`IMG_2630.jpeg`)
     - 정밀 스윙 분석: 시타 체험 장면 (`massgoo_studio_test_3.png`)
     - 맞춤형 추천: 전문 피터 작업 이미지 (AI 생성 가능 안내)
  4. **모든 예약 페이지 색상 통일** ✅:
     - `booking.tsx`: 진행 단계, 입력 필드, CTA 버튼 (빨간색 → 블루)
     - `booking/form.tsx`: 모든 입력 필드 포커스, 필수 표시, 에러 메시지, CTA 버튼 (빨간색 → 블루)
     - `booking/success.tsx`: 진행 단계, CTA 버튼 (빨간색 → 블루)
     - `booking/check-distance.tsx`: 에러 메시지 (빨간색 → 블루)
     - `try-a-massgoo.tsx`: 네비게이션 버튼, 링크, 진행 단계 (빨간색 → 블루)
  5. **골드 액센트 추가** ✅:
     - 히어로 섹션 타이틀: 골드 그라데이션 텍스트
     - 배지: 골드 배경 (KGFA 1급 전문 피터)
- **파일 수정**:
  - `pages/admin/ai-image-generator.tsx`: 피팅 이미지 프리셋 버튼 추가
  - `pages/try-a-massgoo.tsx`: 히어로 섹션, 서비스 소개, 색상 통일
  - `pages/booking.tsx`: 색상 통일 (빨간색 → 블루)
  - `pages/booking/form.tsx`: 색상 통일 (빨간색 → 블루)
  - `pages/booking/success.tsx`: 색상 통일 (빨간색 → 블루)
  - `pages/booking/check-distance.tsx`: 색상 통일 (빨간색 → 블루)

### AI 이미지 생성 메뉴 추가 ✅ (2025-11-23)
- **목적**: 빠르고 간편하게 MASSGOO 브랜딩이 적용된 고품질 이미지를 생성할 수 있는 전용 메뉴 구축
- **완료된 작업**:
  1. **관리자 네비게이션 메뉴 추가** ✅:
     - 멀티채널 대시보드와 AI 관리 사이에 "🎨 AI 이미지 생성" 메뉴 추가
     - `/admin/ai-image-generator` 경로로 접근
  2. **AI 이미지 생성 페이지 생성** ✅:
     - 브랜딩 톤 선택: 시니어 중심 감성적 브랜딩 (골드 톤), 하이테크 중심 혁신형 브랜딩 (블랙 톤)
     - 이미지 타입 선택: 배경 이미지 (가로형), 프로필 이미지 (정사각형), 피드 이미지 (정사각형)
     - 브랜딩 옵션: 전체 브랜딩 (강조), 로고 포함, 브랜딩 없음
     - 생성 개수: 1개, 2개, 4개 선택 가능
  3. **한국 골퍼 스펙 자동 적용** ✅:
     - 시니어 중심: 50-70세 한국인 골퍼
     - 하이테크 중심: 40-60세 한국인 골퍼
     - 한국인 외모, 한국인 피부톤, 현실적인 한국인 얼굴 특징 자동 적용
  4. **365일 24시간 적용 가능한 프롬프트 시스템** ✅:
     - 계절/요일에 구애받지 않는 범용 이미지 생성
     - 시즌별 요소 제거, 중립적 구성
     - 핵심 메시지와 브랜드 정체성에 집중
     - 어떤 요일, 어떤 월, 어떤 계절에도 사용 가능
  5. **기존 카카오톡 콘텐츠 생성 API 활용** ✅:
     - `/api/kakao-content/generate-images` API 통합
     - MASSGOO 브랜딩 자동 적용
     - Supabase 자동 저장
     - 사용량 로깅
- **파일 생성**:
  - `pages/admin/ai-image-generator.tsx` - AI 이미지 생성 메인 페이지
- **파일 수정**:
  - `components/admin/AdminNav.tsx` - AI 이미지 생성 메뉴 추가
- **주요 기능**:
  - 간편한 UI로 빠른 이미지 생성
  - 브랜딩 톤별 자동 색상 및 분위기 적용
  - 한국 골퍼 스펙 자동 적용
  - 계절/요일 무관 범용 이미지 생성
  - 생성된 이미지 즉시 확인 및 다운로드

## ✅ 최근 완료된 작업 (2025-11-26)

### 동반 방문자 패턴 처리 완료 ✅ (2025-11-26)
- **목적**: 이름에 "(여자)", "(여자손님 모시고 옴)" 등 동반 방문자 정보가 포함된 예약을 정규화하고 방문 횟수 업데이트
- **완료된 작업**:
  1. **동반 방문자 패턴 처리 스크립트 작성** ✅:
     - `scripts/fix-companion-visitors.js` 생성
     - 이름에서 괄호 부분 제거하여 기본 이름으로 정규화
     - notes 필드에 동반 방문자 정보 추가
     - 같은 전화번호를 가진 고객의 visit_count 업데이트
  2. **처리 결과** ✅:
     - 총 21건 처리 완료
     - 주요 처리 사례:
       - "도규환(여자)" → "도규환" (방문 2회, notes에 "여자 동반 방문" 추가)
       - "박춘은(여자손님 모시고 옴)" → "박춘은" (방문 4회, notes에 "여자 동반 방문" 추가)
       - "(AS)", "(보상매입)", "(그립교체)" 등 서비스 유형 정보도 notes에 추가
  3. **데이터 정규화** ✅:
     - 모든 동반 방문자 패턴 이름 정규화
     - 고객 테이블의 visit_count 자동 업데이트
     - 고객 이름도 정규화된 이름으로 업데이트
- **파일 생성**:
  - `scripts/fix-companion-visitors.js`: 동반 방문자 패턴 처리 스크립트
- **처리 통계**:
  - 처리 완료: 21건
  - 오류: 0건
  - 주요 패턴: (여자), (여자손님 모시고 옴), (AS), (보상매입), (그립교체), (2인) 등

### Low Confidence 매칭 마이그레이션 완료 ✅ (2025-11-26)
- **목적**: Low Confidence 매칭 19건을 처리하여 bookings 테이블에 추가
- **완료된 작업**:
  1. **마이그레이션 스크립트 작성** ✅:
     - `scripts/migrate-low-confidence-matches.js` 생성
     - AS 분리 로직 구현
     - 이름 정제 로직 구현
     - 복수명 처리 로직 구현
  2. **데이터 처리** ✅:
     - 처리 완료: 16건
     - 삭제 대상: 1건 (시타 - 이름만 있어 유효하지 않음)
  3. **주요 처리 내용**:
     - AS 분리: 진지화AS, 최원구AS, 김춘택AS, 윤의권AS, 김명배AS, 김태정AS
     - 이름 정제: 김대진(2인) → 김대진, 장철 → 박장철, 김석현점검 → 김석현
     - 재방문 추가: 모든 매칭을 기존 고객에 재방문으로 추가
     - 복수명 처리: 송영의,이관욱 AS → 이관욱만 처리 (송영의 전화번호 없음)
  4. **데이터 수정** ✅:
     - `scripts/fix-low-confidence-bookings.js` 생성
     - 최동우고객 → 최동우로 이름 수정
     - 이동열, 오세집 AS 방문 플래그 수정
- **파일 생성**:
  - `scripts/migrate-low-confidence-matches.js`: Low Confidence 매칭 마이그레이션 스크립트
  - `scripts/fix-low-confidence-bookings.js`: 생성된 예약 데이터 수정 스크립트
  - `backup/low-confidence-migration-*.json`: 마이그레이션 결과 보고서

### High/Medium Confidence 매칭 마이그레이션 완료 ✅ (2025-11-26)
- **목적**: High/Medium Confidence 매칭 73건을 처리하여 bookings 테이블에 추가
- **완료된 작업**:
  1. **마이그레이션 스크립트 작성** ✅:
     - `scripts/migrate-high-medium-matches.js` 생성
     - High Confidence 18건 자동 처리
     - Medium Confidence 55건 자동 처리
     - 재방문으로 처리 (기존 고객에 추가)
  2. **스크립트 실행** ✅:
     - High Confidence 18건 처리 완료
     - Medium Confidence 55건 처리 완료
     - 총 73건 추가
  3. **최종 결과**:
     - 총 처리: 89건 (High 18 + Medium 55 + Low 16)
     - 예상 총 예약 수: 1,073건 (기존 1,000건 + 추가 73건)
- **파일 생성**:
  - `scripts/migrate-high-medium-matches.js`: High/Medium Confidence 매칭 마이그레이션 스크립트
  - `backup/high-medium-migration-*.json`: 마이그레이션 결과 보고서

### 전화번호 매칭 기능 구현 완료 ✅ (2025-11-26)
- **목적**: 전화번호 없는 302건의 예약 데이터를 자동으로 매칭하여 전화번호 찾기
- **완료된 작업**:
  1. **자동 매칭 스크립트 작성** ✅:
     - `scripts/match-missing-phones.js` 생성
     - 이름, 날짜, 이메일 기준 매칭
     - 신뢰도별 분류 (High/Medium/Low)
  2. **매칭 결과 적용 스크립트 작성** ✅:
     - `scripts/apply-phone-matches.js` 생성
     - High confidence 매칭 자동 적용 옵션
     - 원본 CSV 백업 및 업데이트된 CSV 생성
  3. **매칭 결과**:
     - 매칭 성공: 92건 (High: 18건, Medium: 55건, Low: 19건)
     - 매칭 실패: 210건 (수동 입력 필요)
  4. **문서화** ✅:
     - `docs/phases/detailed-plans/phase-6-phone-matching-guide.md` 작성
- **파일 생성**:
  - `scripts/match-missing-phones.js`: 자동 매칭 스크립트
  - `scripts/apply-phone-matches.js`: 매칭 결과 적용 스크립트
  - `docs/phases/detailed-plans/phase-6-phone-matching-guide.md`: 사용 가이드
- **보고서 생성**:
  - `backup/phone-matching-report-*.json`: 상세 매칭 보고서
  - `backup/phone-updates-*.csv`: CSV 업데이트 가이드

### 관리자 페이지 개선: Phase 3, 4 완료 ✅ (2025-11-26)
- **목적**: 고객별 그룹화 뷰 추가 및 데이터 차이 분석 완료
- **완료된 작업**:
  1. **고객별 그룹화 뷰 구현** ✅:
     - `CustomerGroupedView.tsx` 컴포넌트 생성
     - 고객별 예약 이력 아코디언 형태로 표시
     - 고객 검색 및 정렬 기능 (방문 횟수, 고객명, 마지막 방문일)
     - 고객별 통계 표시 (방문 횟수, 노쇼 횟수, 참석 횟수, 첫/마지막 방문일)
     - 관리자 페이지에 "고객별" 탭 추가
  2. **데이터 차이 분석 완료** ✅:
     - `analyze-migration-difference.js` 스크립트 작성
     - CSV 1,247건 → DB 945건 차이 원인 분석
     - 제외된 데이터: 전화번호 없음 302건, 중복 예약 47건
     - 분석 보고서 생성 (`backup/migration-difference-analysis-*.json`)
  3. **마이그레이션 스크립트 개선** ✅:
     - `--use-registration-date` 옵션 추가 (예약 날짜/시간 없을 때 등록일 사용)
     - `--verbose` 옵션 추가 (상세 로그 출력)
     - 처리 통계 출력 개선
- **파일 생성**:
  - `components/admin/bookings/CustomerGroupedView.tsx`: 고객별 그룹화 뷰 컴포넌트
  - `scripts/analyze-migration-difference.js`: 데이터 차이 분석 스크립트
- **파일 수정**:
  - `pages/admin/booking/index.tsx`: 고객별 탭 추가
  - `scripts/migrate-wix-bookings.js`: 옵션 추가 및 통계 개선
  - `docs/phases/detailed-plans/phase-6-admin-improvement-plan.md`: Phase 3, 4 완료 표시

### 관리자 페이지 개선: 통계 데이터 및 필터 기능 강화 ✅ (2025-11-26)
- **목적**: 의미있는 통계 데이터 표시 및 노쇼/취소 필터 기능 추가
- **완료된 작업**:
  1. **통계 데이터 추가** ✅:
     - 최다 방문 고객 TOP 10 표시 (방문 횟수, 노쇼 횟수, 첫/마지막 방문일)
     - 노쇼율 통계 (전체 노쇼율, 노쇼 건수)
     - 재방문율 통계 (재방문 고객 수, 재방문율)
     - 평균 방문 횟수 통계
     - 참석 상태 통계 (참석, 노쇼, 취소, 대기중)
  2. **필터 기능 강화** ✅:
     - 참석 상태 필터 추가 (전체, 참석, 노쇼, 취소, 대기중)
     - 예약 상태 필터와 참석 상태 필터 복합 사용 가능
  3. **UI 개선** ✅:
     - 통계 카드 시각화 개선 (색상 코딩, 아이콘 추가)
     - 최다 방문 고객 목록 스크롤 가능한 섹션 추가
- **파일 수정**:
  - `components/admin/bookings/BookingDashboard.tsx`: 통계 데이터 계산 및 표시 로직 추가
  - `components/admin/bookings/BookingListView.tsx`: 참석 상태 필터 추가
  - `docs/phases/detailed-plans/phase-6-admin-improvement-plan.md`: 개선 계획 문서 작성

### Wix 예약 데이터 대규모 마이그레이션 구현 및 실행 완료 ✅ (2025-11-26)
- **목적**: Wix 900건 예약 데이터를 기존 683건 대체 및 전화번호 파싱 규칙 정의
- **완료된 작업**:
  1. **전화번호 파싱 및 정규화 함수 구현** ✅:
     - `normalizePhone()` 함수 개선 (82 분리, 01→010 변환)
     - `formatPhoneNumber()` 함수 개선 (하이픈 추가)
     - `lib/formatters.js`에 함수 추가
  2. **마이그레이션 스크립트 개선** ✅:
     - 동적 양식 필드 파싱 함수 구현 (`parseFormFields()`)
     - 클럽 정보 구조화 파싱 함수 구현 (`parseClubInfo()`)
     - 비거리 정규화 함수 구현 (`normalizeDistance()`)
     - 탄도, 구질 파싱 함수 구현 (`parseTrajectory()`, `parseShotShape()`)
     - 기존 데이터 백업 및 삭제 로직 추가
     - `club` 필드 NOT NULL 제약조건 처리 (null → 빈 문자열)
  3. **마이그레이션 실행 완료** ✅:
     - CSV 파일: 1251줄 (약 1250건)
     - 마이그레이션 결과: 고객 681명, 예약 945건
     - 오류: 0건
     - 기존 데이터 백업 완료
  4. **문서 업데이트** ✅:
     - 전화번호 파싱 규칙 문서화
     - 마이그레이션 가이드 업데이트
- **파일 수정**:
  - `scripts/migrate-wix-bookings.js`: 전화번호 정규화, 동적 필드 파싱, 클럽 정보 구조화 구현
  - `lib/formatters.js`: `normalizePhone()` 함수 추가
  - `docs/phases/detailed-plans/phase-6-booking-system-final-plan.md`: 구현 완료 내용 추가
  - `/Users/m2/Desktop/phase-6-booking-system-final-plan.md`: 전화번호 파싱 규칙 추가
  - `/Users/m2/Desktop/phase-6-시타예약-마이그레이션.md`: 전화번호 정규화 규칙 추가

## ✅ 최근 완료된 작업 (2025-11-23)

### 시타 예약 시스템 Wix 수준 개선 - Phase 1 완료 ✅ (2025-11-23)
- **목적**: Wix 관리자 수준의 시타 예약 관리 시스템 구축
- **완료된 작업**:
  1. **데이터베이스 스키마 확장** ✅:
     - `customers` 테이블: email, wix_registered_at, visit_count, no_show_count, last_visit_date 필드 추가
     - `bookings` 테이블: attendance_status 필드 추가
     - `booking_blocks` 테이블 생성 (예약 불가 시간대 관리)
     - `customer_booking_stats` 뷰 생성
     - **Supabase에서 모든 쿼리 실행 완료**
  2. **Wix 데이터 마이그레이션 스크립트**:
     - `scripts/migrate-wix-bookings.js` 작성
     - CSV 파일 파싱 및 데이터 정제
     - 등록일 vs 최초 문의일 비교 로직
     - 이메일 필터링 로직 (@aa.aa, massgoogolf@gmail.com 제외)
     - 방문 횟수 및 노쇼 횟수 계산
  3. **캘린더 페이지 기능**:
     - 빠른 예약 추가 모달 (`QuickAddBookingModal.tsx`)
     - 예약 불가 시간 설정 모달 (`BlockTimeModal.tsx`)
     - 시간대 클릭/더블클릭 이벤트 처리
     - 예약 불가 시간대 회색 블록 표시
  4. **대시보드 상세 모달**:
     - 공통 모달 컴포넌트 (`BookingDetailModal.tsx`)
     - 대시보드에서 이름 클릭 시 모달 표시
     - 모달에서 예약 수정/삭제 기능
  5. **API 엔드포인트**:
     - `/api/bookings/blocks` - 예약 불가 시간대 CRUD
     - `/api/bookings/quick-add` - 빠른 예약 추가
     - `/api/bookings/available` - 예약 가능 시간 조회 (블록 제외)
- **파일 생성**:
  - `docs/phases/detailed-plans/phase-6-migration-schema.sql`
  - `scripts/migrate-wix-bookings.js`
  - `components/admin/bookings/BookingDetailModal.tsx`
  - `components/admin/bookings/QuickAddBookingModal.tsx`
  - `components/admin/bookings/BlockTimeModal.tsx`
  - `pages/api/bookings/blocks.ts`
  - `pages/api/bookings/quick-add.ts`
- **파일 수정**:
  - `components/admin/bookings/BookingCalendarView.tsx` - 빠른 예약 추가 및 예약 불가 시간 기능 통합
  - `components/admin/bookings/BookingDashboard.tsx` - 이름 클릭 시 모달 표시
  - `pages/api/bookings/available.ts` - 예약 불가 시간대 제외 로직 추가
  - `pages/admin/booking/index.tsx` - supabase prop 전달

### 시타 예약 관리자 페이지 Wix 수준 재구성 ✅ (2025-11-21)
- **목적**: 기존 예약 관리 페이지를 Wix 관리자 수준으로 재구성
- **작업 내용**:
  - 기존 파일 삭제: `pages/admin/booking.tsx`, `components/admin/bookings/BookingManagement.tsx`
  - 새로운 구조 생성:
    - `/pages/admin/booking/index.tsx`: 메인 페이지 (대시보드/캘린더/목록 뷰 전환)
    - `/components/admin/bookings/BookingDashboard.tsx`: 통계 및 대시보드 뷰
    - `/components/admin/bookings/BookingCalendarView.tsx`: 주간/월간 캘린더 뷰 (Wix 스타일)
    - `/components/admin/bookings/BookingListView.tsx`: 예약 목록 뷰 (필터링, 검색, 편집)
  - 주요 기능:
    - 대시보드: 통계 카드, 상태별 통계, 다가오는 예약 목록
    - 캘린더 뷰: 주간/월간 전환, 시간대별 예약 표시, 예약 상세 모달
    - 목록 뷰: 고급 필터링 (날짜, 상태, 서비스), 검색, 인라인 편집, 고객 정보 연동
  - 의존성 추가: `date-fns` (날짜 처리)
- **파일 변경**:
  - 삭제: `pages/admin/booking.tsx`, `components/admin/bookings/BookingManagement.tsx`
  - 생성: `pages/admin/booking/index.tsx`, `components/admin/bookings/BookingDashboard.tsx`, `components/admin/bookings/BookingCalendarView.tsx`, `components/admin/bookings/BookingListView.tsx`

## ✅ 최근 완료된 작업 (2025-11-21)

### 카카오 콘텐츠 캘린더 로딩 속도 최적화 ✅ (2025-11-21)
- **문제**: 캘린더 데이터 로딩이 매우 느림 (90초 이상). "캘린더 데이터 로딩 중..." 메시지가 오래 표시됨.
- **원인**: 
  - 각 이미지 존재 여부 확인이 순차적으로 실행됨 (180개 요청 × 평균 500ms = 약 90초)
  - 타임아웃이 5초로 길게 설정됨
- **조치**:
  - `pages/api/kakao-content/calendar-load.js`: 
    - 타임아웃 5초 → 2초로 단축
    - 순차 처리 → 병렬 처리로 변경 (`Promise.all` 사용)
    - 프로필 이미지와 피드 이미지 확인을 각각 병렬로 실행
    - Map을 사용한 빠른 결과 조회
    - 불필요한 로그 제거로 성능 향상
- **효과**: 
  - 로딩 시간이 약 90초에서 2-3초로 단축 (약 30-45배 향상)
  - 사용자 경험 크게 개선

### 카카오 콘텐츠 삭제된 이미지 표시 문제 해결 ✅ (2025-11-21)
- **문제**: 배포 버전에서 삭제된 이미지가 계속 표시됨. 로컬에서는 X로 표기되지만 배포에서는 지워진 이미지가 보임. 수정 후 이미지가 전혀 표시되지 않는 문제 발생.
- **원인**: 
  - DB에 `image_url`이 남아있지만 실제 파일은 삭제됨
  - Supabase Storage CDN 캐시
  - 브라우저 캐시
  - Storage API 경로 파싱 로직 오류로 인해 모든 이미지가 존재하지 않는 것으로 잘못 판단됨
- **조치**:
  - `pages/api/kakao-content/calendar-load.js`: 
    - 초기: Storage API를 사용한 복잡한 경로 파싱 로직 (오류 발생)
    - 수정: HTTP HEAD 요청만 사용하는 간단하고 확실한 방법으로 변경
    - 프로필/피드 데이터 변환 시 실제 파일 존재 여부 확인 후 존재하지 않으면 `imageUrl`을 `undefined`로 설정
  - `components/admin/kakao/ProfileManager.tsx`, `FeedManager.tsx`: 이미지 로드 실패 시 즉시 `imageUrl`을 `undefined`로 설정하여 캐시된 이미지 표시 방지
- **효과**: 
  - 배포 버전에서도 삭제된 이미지가 표시되지 않고, 이미지가 없을 때 X로 표기됨
  - 갤러리에서도 "이미지가 없습니다" 메시지가 정확히 표시됨
  - HTTP HEAD 요청만 사용하여 간단하고 정확한 이미지 존재 여부 확인

### 예약 SMS 발송 로직 개선 ✅ (2025-11-21)
- **문제**: 116번 메시지가 예약 시간이 지났는데도 자동 발송되지 않음. 예약 시간 저장 및 비교 로직에 문제가 있었음.
- **조치**:
  - `pages/api/admin/send-scheduled-sms.js`: 예약 시간 비교 로직에 디버깅 로그 추가, UTC 시간 비교 명확화
  - `pages/api/admin/sms.js`: 예약 시간 저장 시 UTC 변환 검증 추가, ISO 형식 명시적 변환으로 저장
- **효과**: 예약 시간이 올바르게 UTC로 저장되고, Cron Job이 정확하게 예약 메시지를 찾아 발송할 수 있도록 개선.

### SMS 호칭 버튼 사용 안내 추가 ✅ (2025-11-21)
- **배경**: `{name}` 변수와 호칭 버튼을 혼용할 때 사용자 혼동이 발생해 호칭이 중복되는 사례가 보고됨.
- **조치**: `pages/admin/sms.tsx`의 메시지 입력 섹션에 안내 문구 추가 → “호칭은 버튼에서 선택하고 메시지에는 `{name}`만 입력해주세요. 예: `{name}`, 안녕하세요!”
- **효과**: 에디터 내에서 즉시 가이드를 제공해 `{name}` 변수 사용법을 명확히 하고, 잘못된 메시지 구성으로 인한 발송 오류를 예방.

### 스탭진 테스트 UX 조정 ✅ (2025-11-21)
- **요청**: 스탭진 번호 추가 버튼과 분할 기본값이 혼동을 준다는 피드백.
- **조치**:
  - 수신자 섹션의 버튼 라벨을 “🧪 스탭진 추가”로 변경하여 역할을 명확히 함.
  - 수동/자동 분할의 기본 크기를 100명으로 조정하고 자동 분할 옵션에 100명 선택지를 추가.
- **효과**: 테스트 번호 추가와 실제 발송 버튼을 명확히 구분하고, 자주 사용하는 100명 단위 분할 작업을 더 빠르게 수행 가능.

### SMS 호칭 저장 및 Solapi 동기화 상태 자동화 ✅ (2025-11-21)
- **호칭 저장**: `channel_sms` 테이블에 `honorific` 컬럼을 추가하고 기본값을 `'고객님'`으로 설정. `pages/admin/sms.tsx`, `pages/api/admin/sms.js`, `pages/api/channels/sms/send.js`에서 저장/로드/발송 로직을 모두 반영해 메시지를 다시 열어도 선택한 호칭이 유지되도록 개선.
- **상태 자동 업데이트**: `pages/api/admin/sync-solapi-status.js`에서 그룹별 동기화 결과를 누적 집계해 전체 성공/실패 건수에 따라 `status`, `success_count`, `fail_count`, `sent_count`를 자동으로 업데이트. 여러 그룹으로 나뉜 발송의 동기화 버튼을 누르면 상태가 즉시 `발송됨/부분 발송/실패`로 재평가됨.

## ✅ 최근 완료된 작업 (2025-11-19)

### SMS 예약 발송 UX 개선 및 상태 표기 통일 ✅ (2025-11-19)
- **SMS 리스트 상태 표기 한글 통일** (`pages/admin/sms-list.tsx`)
  - `getStatusBadge` 함수에 `partial` 케이스 추가: "부분 발송" (노란색 배지)
  - 모든 상태를 한글로 통일: "초안" (draft), "발송됨" (sent), "부분 발송" (partial), "실패" (failed)
- **발송 결과 표기 개선** (`pages/admin/sms-list.tsx`)
  - 이모지 제거 (✅, ❌, 📊) → 텍스트로 변경: "성공", "실패", "총 N건"
  - 가독성 향상 및 일관성 확보
- **예약 발송 검증 강화** (`pages/admin/sms.tsx`)
  - 과거 시간 저장 불가: 현재 시간보다 미래인지 검증
  - 최소 예약 시간 검증: 5분 미만 시 경고 후 확인 요청
  - 보낸 메시지(`status: 'sent'`)는 예약 발송 섹션 비활성화
- **저장 후 ID 업데이트** (`pages/admin/sms.tsx`)
  - `savedSmsId` 상태 추가하여 저장된 메시지 ID 추적
  - `currentSmsNumericId` 계산 시 `savedSmsId`도 고려하여 저장 직후 예약 발송 버튼 활성화
  - 새 메시지 저장 시 URL 자동 업데이트 (`router.replace` with `shallow: true`)
- **"새로 저장" 기능 추가** (`pages/admin/sms.tsx`)
  - 이미 보낸 메시지(`status: 'sent'`)에서만 표시되는 버튼
  - 현재 메시지 내용을 복사하여 새 메시지(draft)로 생성
  - 예약 시간, 수신자 번호, 메모 등 모든 정보 복사
  - 생성된 새 메시지 페이지로 자동 이동
- **"목록으로" 버튼 추가** (`pages/admin/sms.tsx`)
  - 상단 헤더에 "목록으로" 버튼 추가 (저장 버튼 왼쪽)
  - 저장된 메시지면 바로 목록으로 이동
  - 새 메시지이고 내용이 있으면 확인 후 이동
  - 블로그 관리의 "닫기" 기능과 동일한 UX 제공
- **저장 버튼 텍스트 동적 변경** (`pages/admin/sms.tsx`)
  - 보낸 메시지: "수정 저장"
  - 기존 메시지: "저장"
  - 새 메시지: "저장"
- **변경 파일**:
  - `pages/admin/sms-list.tsx` (상태 표기, 발송 결과 개선)
  - `pages/admin/sms.tsx` (예약 발송 검증, 저장 후 ID 업데이트, 새로 저장, 목록으로 버튼)
- **빌드 테스트**: ✅ 성공

### SMS 예약 발송 UX/데이터 연동 및 E2E 검증 ✅ (2025-11-19)
- **에디터 기능 구현** (`pages/admin/sms.tsx`)
  - 예약 발송 토글·`datetime-local` 입력·저장/취소 버튼을 우측 패널에 추가하고, 타임존 변환 헬퍼(`convertUTCToLocalInput`, `convertLocalInputToUTC`)로 로컬↔UTC를 안전하게 동기화
  - 예약 상태(`isScheduled`, `scheduledAt`, `hasScheduledTime`)를 메시지 로드/저장 시 자동 반영하고, 저장 API payload를 빌드하는 `buildSmsPayload` 헬퍼를 도입해 `scheduled_at`, `note`, 수신자, 이미지 등의 필드를 일관되게 전송
  - 예약 전용 PUT 호출(`handleSaveScheduledTime`, `handleCancelScheduled`)을 추가해 이미 저장된 메시지도 UI에서 바로 수정/취소 가능하도록 구현
- **리스트 UI 개선** (`pages/admin/sms-list.tsx`)
  - `scheduled_at` 컬럼을 인터페이스/테이블에 추가하고 `formatScheduledDate`, `getRelativeScheduleLabel` 헬퍼로 Solapi 스타일(`MM/DD HH:MM:SS`) + 상대 시간(`n시간 후/전`)을 동시에 표기, 미래 예약은 파란색으로 강조
  - 예약 정렬/툴팁 확인을 위한 `data-testid="scheduled-time"` 속성을 부여해 테스트 및 운영 점검을 용이하게 함
- **Playwright E2E 스크립트 작성** (`e2e-test/check-scheduled-time-consistency.js`)
  - 관리자 로그인 → `admin/sms-list` 이동 → “예약일” 헤더와 첫 번째 셀 텍스트를 검사하고, 결과를 스크린샷(`scheduled-time-check.png`)과 로그(`scheduled-time-check.log`)로 남기는 시나리오 추가
  - 실행 중 dev 서버 캐시 이슈를 해결하기 위해 서버를 재기동한 뒤 `PLAYWRIGHT_HEADLESS=true` 모드로 성공적으로 통과
- **빌드/QA**
  - `npm run build` 재실행으로 예약 관련 구문 오류를 정정한 후 전체 빌드 성공을 확인
  - 로컬 서버 재시작 → E2E 테스트 순서를 문서화된 운영 규칙과 동일하게 수행

### SMS/고객 API 빌드 복구 및 정리 ✅ (2025-11-19)
- **현상**: `npm run build` 시 `pages/api/admin/customers/[phone]/messages.js`, `pages/api/channels/sms/send.js`, `pages/api/solapi/upload-image.js`에서 중복 선언 및 중괄호 누락으로 컴파일 실패
- **조치**:
  - 고객 메시지 API의 중복된 `supabase`, `normalizePhone`, `formatPhone`, `handler` 선언 제거 후 단일 핸들러 유지
  - SMS 발송 API의 `export default handler` 범위 재구성, 누락된 닫는 중괄호 추가로 모든 `return`이 함수 내부에서 실행되도록 복원
  - Solapi 이미지 업로드 API 말미에 잘못 남아 있던 중복 응답 블록 제거
  - 전체 수정 후 `npm run build` 재실행으로 정상 완료 확인
- **변경 파일**:
  - `pages/api/admin/customers/[phone]/messages.js`
  - `pages/api/channels/sms/send.js`
  - `pages/api/solapi/upload-image.js`
- **결과**: 빌드 성공, 고객 메시지/발송 API 안정화, Solapi 이미지 업로드도 정상 동작

### 고객 메시지 이력 모달 구현 ✅ (2025-11-19)
- **요구사항**: 고객 관리 페이지에서 각 고객이 받은 SMS/MMS 이력을 확인하고 바로 Solapi 또는 SMS 편집 페이지로 이동할 수 있어야 함
- **구현 내용**:
  - `components/admin/CustomerMessageHistoryModal.tsx`: API 연동, 로딩/에러 처리, 상태 배지, Solapi/SMS 상세 보기 버튼이 포함된 모달을 신규 구현
  - 고객 정보와 메시지 50건까지를 불러와 시간 순서대로 표시하고, 메모·성공/실패 건수·이미지 여부 등을 한 카드에서 확인 가능
  - 메시지 ID가 DB에서 삭제된 경우 Solapi 그룹 ID를 이용해 `/api/admin/sync-solapi-status`로 자동 동기화를 시도하여 상세 정보를 복구하고, 그래도 실패하면 안내 메시지를 띄우도록 개선
- **결과**: 고객 관리 화면의 “📱 메시지” 버튼 클릭 시 더 이상 컴포넌트 오류가 발생하지 않으며, 운영자가 고객별 메시지 히스토리를 즉시 확인 가능

### SMS 소프트 삭제 복구 및 재동기화 계획 수립 ✅ (2025-11-19)
- **내용**:
  - `channel_sms` 테이블에서 `deleted_at`가 설정된 레코드(IDs 80, 72, 69, 66, 64)를 복구하여 목록에 다시 노출
  - `/docs/solapi-recovery-plan.md` 문서를 신설해 Solapi API 기반 재동기화/복구 전략을 체계화
    - 단계별(소프트 삭제 복구 → Solapi API 동기화 → 완전 삭제 데이터 재생성) 시나리오 명시
    - `sync-solapi-status`와 Playwright 기반 스크립트 활용 방안 포함
- **결과**: 숨김 처리된 메시지 복구가 완료되었고, 향후 Solapi 서버에서 데이터를 다시 불러와 재생성하는 절차가 정리됨

## ✅ 최근 완료된 작업 (2025-11-16)

### SMS/MMS 에디터 상태 보존 및 리스트 UI 복구 ✅ (2025-11-19)
- **현상**: 발송 완료된 메시지(#94)를 편집 화면에서 메모만 수정해도 상태가 `draft`로 바뀌어 리스트에서 발송 결과/동기화 버튼이 사라짐
- **원인**: `pages/admin/sms.tsx`가 로드 시 `status`를 `formData`에 넣지 않고, 저장/PUT 요청에 항상 `'draft'`를 전송
- **조치**:
  - SMS 로딩 시 `status`까지 `formData`에 포함
  - 초안 저장 및 메모 동기화 시 기존 상태를 그대로 서버에 전달
  - 이미 잘못 저장된 `channel_sms` ID 94의 `status`를 Supabase에서 `sent`로 복구
- **결과**: 메모 수정 후에도 발송 결과/동기화 버튼이 유지되고, 리스트에 성공/실패 카운트가 다시 표시됨
- **변경/수정 항목**:
  - `pages/admin/sms.tsx`
    * SMS 로드 시 상태 반영
    * 상단 안내 및 버튼 텍스트를 “저장”으로 변경
  - `lib/hooks/useChannelEditor.ts` (채널 포스트 로드 시 기존 상태와 병합하도록 수정)
  - Supabase `channel_sms` 데이터 수동 복구 (#94, #92, #93)

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
- **추가 최적화 (2025-11-25)**:
  - 모바일 후기 이미지 비율을 4:3으로 확장해 주요 썸네일이 잘리는 현상 해소
  - 공통 스펙(탄성 그립, 헤드 라이각 등)을 모델 열 전체에 한 번만 노출하도록 재구성해 모바일 가독성 향상
  - 후기 섹션 타이포그래피를 다른 메인 섹션과 동일한 사이즈/여백 체계로 통일

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

### 예약 알림/메시징 아키텍처 정리 ✅
- **문서 위치**: `docs/booking-communication-plan.md`
- **주요 내용**:
  - Solapi SMS/카카오톡/Slack을 활용한 예약 알림 플로우 정의 (예약 신청/확정/완료)
  - 기존 SMS 발송 API (`pages/api/channels/sms/send.js`, `pages/api/admin/send-scheduled-sms.js`, `pages/api/admin/sms.js`) 재사용 계획
  - 카카오 콘텐츠용 Slack 모듈 (`lib/slack-notification.js`, `pages/api/kakao-content/slack-*.js`)을 활용한 예약 알림 Slack API 설계
  - 예약 전용 알림 API 초안 정의:
    - `/api/bookings/notify-customer` (고객 카카오톡/문자 알림)
    - `/api/slack/booking-notify` (관리자 Slack 알림)
  - “예약 알림 센터” UI 방향: 예약별 알림 이력·재발송·실패 사유 확인 기능을 한 곳에서 관리
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

## 2025-01-XX: 예약 폼 골프 정보 섹션 개선 (2차)

### 완료된 작업
- **샤프트 강도 옵션 확장**: R2, R1을 L과 R 사이에 추가 (총 7개 옵션: L, R2, R1, R, SR, S, X)
- **탄도 표기 개선**: 각도 표시(30°, 45°, 60°) 제거, 한글 표기로 변경 (저탄도, 중탄도, 고탄도)
- **레이블 정리**: 탄도와 구질 라벨에서 "(선택)" 제거
- **레이아웃 조정**: 샤프트 강도 그리드를 `grid-cols-5`에서 `grid-cols-7`로 변경
- **변경 파일**:
  - `pages/booking/form.tsx` (샤프트 강도 옵션 추가, 탄도 한글 표기, 레이블 정리)

## 2025-01-XX: 예약 폼 골프 정보 섹션 개선 (3차)

### 완료된 작업
- **샤프트 강도/로프트 각도 버튼 개선**: "잘 모르겠어요" 버튼을 그리드 밖으로 분리하고 "선택 안 함"으로 문구 변경
- **탄도 다중 선택 기능**: 최대 2개까지 선택 가능, 조합 표기 (중저탄도, 중고탄도, 저고탄도)
- **구질 한글 표기 개선**: 영어 표기(Straight, Hook, Draw, Fade, Slice)를 한글(스트레이트, 훅, 드로우, 페이드, 슬라이스)로 변경
- **구질 다중 선택 제한**: 최대 2개까지 선택 가능, 하단에 선택된 구질 표시
- **연령대 입력 방식 개선**: 드롭다운 선택식에서 숫자 입력 필드로 변경, 실제 나이 입력 후 자동으로 연령대 그룹화
- **변경 파일**:
  - `pages/booking/form.tsx` (탄도/구질 다중 선택, 한글 표기, 연령대 숫자 입력, 버튼 레이아웃 개선)

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

## 2025-01-XX: 예약 폼 골프 정보 섹션 개선 (2차)

### 완료된 작업
- **샤프트 강도 옵션 확장**: R2, R1을 L과 R 사이에 추가 (총 7개 옵션: L, R2, R1, R, SR, S, X)
- **탄도 표기 개선**: 각도 표시(30°, 45°, 60°) 제거, 한글 표기로 변경 (저탄도, 중탄도, 고탄도)
- **레이블 정리**: 탄도와 구질 라벨에서 "(선택)" 제거
- **레이아웃 조정**: 샤프트 강도 그리드를 `grid-cols-5`에서 `grid-cols-7`로 변경
- **변경 파일**:
  - `pages/booking/form.tsx` (샤프트 강도 옵션 추가, 탄도 한글 표기, 레이블 정리)

## 2025-01-XX: 예약 폼 골프 정보 섹션 개선 (3차)

### 완료된 작업
- **샤프트 강도/로프트 각도 버튼 개선**: "잘 모르겠어요" 버튼을 그리드 밖으로 분리하고 "선택 안 함"으로 문구 변경
- **탄도 다중 선택 기능**: 최대 2개까지 선택 가능, 조합 표기 (중저탄도, 중고탄도, 저고탄도)
- **구질 한글 표기 개선**: 영어 표기(Straight, Hook, Draw, Fade, Slice)를 한글(스트레이트, 훅, 드로우, 페이드, 슬라이스)로 변경
- **구질 다중 선택 제한**: 최대 2개까지 선택 가능, 하단에 선택된 구질 표시
- **연령대 입력 방식 개선**: 드롭다운 선택식에서 숫자 입력 필드로 변경, 실제 나이 입력 후 자동으로 연령대 그룹화
- **변경 파일**:
  - `pages/booking/form.tsx` (탄도/구질 다중 선택, 한글 표기, 연령대 숫자 입력, 버튼 레이아웃 개선)

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

## 2025-01-XX: 예약 폼 골프 정보 섹션 개선 (2차)

### 완료된 작업
- **샤프트 강도 옵션 확장**: R2, R1을 L과 R 사이에 추가 (총 7개 옵션: L, R2, R1, R, SR, S, X)
- **탄도 표기 개선**: 각도 표시(30°, 45°, 60°) 제거, 한글 표기로 변경 (저탄도, 중탄도, 고탄도)
- **레이블 정리**: 탄도와 구질 라벨에서 "(선택)" 제거
- **레이아웃 조정**: 샤프트 강도 그리드를 `grid-cols-5`에서 `grid-cols-7`로 변경
- **변경 파일**:
  - `pages/booking/form.tsx` (샤프트 강도 옵션 추가, 탄도 한글 표기, 레이블 정리)

## 2025-01-XX: 예약 폼 골프 정보 섹션 개선 (3차)

### 완료된 작업
- **샤프트 강도/로프트 각도 버튼 개선**: "잘 모르겠어요" 버튼을 그리드 밖으로 분리하고 "선택 안 함"으로 문구 변경
- **탄도 다중 선택 기능**: 최대 2개까지 선택 가능, 조합 표기 (중저탄도, 중고탄도, 저고탄도)
- **구질 한글 표기 개선**: 영어 표기(Straight, Hook, Draw, Fade, Slice)를 한글(스트레이트, 훅, 드로우, 페이드, 슬라이스)로 변경
- **구질 다중 선택 제한**: 최대 2개까지 선택 가능, 하단에 선택된 구질 표시
- **연령대 입력 방식 개선**: 드롭다운 선택식에서 숫자 입력 필드로 변경, 실제 나이 입력 후 자동으로 연령대 그룹화
- **변경 파일**:
  - `pages/booking/form.tsx` (탄도/구질 다중 선택, 한글 표기, 연령대 숫자 입력, 버튼 레이아웃 개선)


## 2025-01-XX: 예약 알림/커뮤니케이션 시스템 구현 ✅

### 완료된 작업
- **예약 고객 알림 API 생성** ✅:
  - 파일: `pages/api/bookings/notify-customer.ts`
  - 기능: 예약 ID와 알림 타입을 받아서 고객에게 카카오톡 알림톡 발송, 실패 시 SMS로 자동 대체
  - 지원 알림 타입: `booking_received`, `booking_confirmed`, `booking_completed`
  - 메시지 템플릿: 각 타입별 카카오톡/SMS 템플릿 포함
  - 날짜/시간 포맷팅: 한글 형식으로 자동 변환 (예: 2025년 11월 27일, 오후 2시)

- **Slack 예약 알림 API 생성** ✅:
  - 파일: `pages/api/slack/booking-notify.js`
  - 기능: 예약 생성/확정/완료 이벤트를 Slack으로 전송
  - 메시지 포맷: Block Kit 형식으로 예약 정보 상세 표시
  - 지원 이벤트: `booking_created`, `booking_confirmed`, `booking_completed`

- **예약 생성 시 자동 알림 연동** ✅:
  - 파일: `pages/api/bookings.ts` (POST 핸들러)
  - 예약 생성 성공 후 자동으로:
    - 고객에게 `booking_received` 알림 발송 (카카오톡 → SMS 대체)
    - 관리자에게 Slack 알림 전송
  - 알림 실패해도 예약은 성공 처리 (에러 무시)

- **예약 확정 시 자동 알림 연동** ✅:
  - 파일: `components/admin/bookings/BookingListView.tsx` (`updateBookingStatus` 함수)
  - 예약 상태가 `pending` → `confirmed`로 변경될 때:
    - 고객에게 `booking_confirmed` 알림 발송
    - 관리자에게 Slack 알림 전송
  - 예약 상태가 `confirmed` → `completed`로 변경될 때:
    - 고객에게 `booking_completed` 감사 메시지 발송 (선택사항)
    - 관리자에게 Slack 알림 전송

- **변경 파일**:
  - `pages/api/bookings/notify-customer.ts` (신규 생성)
  - `pages/api/slack/booking-notify.js` (신규 생성)
  - `pages/api/bookings.ts` (예약 생성 시 알림 연동)
  - `components/admin/bookings/BookingListView.tsx` (예약 상태 변경 시 알림 연동)

### 향후 작업 (선택사항)
- 관리자 UI에 알림 발송 버튼 및 이력 표시
- 알림 발송 로그 저장 (Supabase 테이블)
- 예약 리마인더 (예약 전날/당일 자동 발송)

---

## 2025-01-XX: 예약 메시지 템플릿 개선 ✅

### 완료된 작업
- **예약 메시지 템플릿 개선** ✅:
  - 파일: `pages/api/bookings/notify-customer.ts`, `pages/api/bookings/[id]/schedule-reminder.ts`
  - 날짜 포맷팅 개선: 요일 추가 (예: 2025년 12월 23일(화))
  - 메시지 형식 개선:
    - 인사말 형식 변경: "[마쓰구골프] {고객명}님" → "친애하는 {고객명} 고객님, 안녕하세요! 마쓰구골프입니다."
    - 전통적인 기호 사용: ▶, ⊙, ☎ (이모티콘 대체)
    - 상세 정보 추가: 주소, 운영시간, 무료 상담 번호 포함
  - 템플릿 업데이트:
    - `booking_received`: 예약 접수 확인 메시지 개선
    - `booking_confirmed`: 예약 확정 메시지 개선 (시타 서비스 혜택, 방문 시 참고사항 추가)
    - `booking_reminder_2h`: 예약 당일 알림 메시지 개선 ("고반발" → "최대 비거리"로 변경)
  - 예약 당일 알림 메시지 생성 로직 업데이트: `schedule-reminder.ts`에서 동일한 형식으로 메시지 생성

- **변경 파일**:
  - `pages/api/bookings/notify-customer.ts` (날짜 포맷팅 함수 개선, SMS 템플릿 업데이트)
  - `pages/api/bookings/[id]/schedule-reminder.ts` (예약 당일 알림 메시지 템플릿 업데이트)

---

## 🔮 옵션 기능 / 향후 구현 예정

### MMS 이미지 중복 통합 및 최적화 (옵션)

**목적**: 기존 중복 이미지 통합 및 향후 중복 방지 시스템 구축

**구현 시점**: 
- 추후 최종 정리 단계에서 구현
- 또는 중복 데이터가 문제가 되었을 때 구현

**구현 계획**:

#### 1단계: 기존 중복 이미지 통합 (1회성 작업)
- 중복 이미지 그룹 찾기 (`hash_md5` 기준)
- 각 그룹에서 메인 이미지 선택 (우선순위: 사용 중인 것 > 최신 것)
- 나머지 이미지들의 경로를 `references`에 저장
- `channel_sms` 테이블의 `image_url`을 메인 이미지로 업데이트
- 중복 이미지 파일 삭제 (또는 보관)

**예시**:
- `originals/mms/2025-11-28/98/mms-98-xxx.jpg` (메인, 유지)
- `originals/mms/2025-11-28/113/mms-113-xxx.jpg` (중복, 삭제)
- `originals/mms/2025-11-28/113/mms-113-yyy.jpg` (중복, 삭제)

→ 메인 이미지의 `references`에 저장:
```json
{
  "references": [
    {
      "type": "mms",
      "message_id": 98,
      "date_folder": "2025-11-28",
      "original_path": "originals/mms/2025-11-28/98/mms-98-xxx.jpg"
    },
    {
      "type": "mms",
      "message_id": 113,
      "date_folder": "2025-11-28",
      "original_path": "originals/mms/2025-11-28/113/mms-113-xxx.jpg",
      "merged_from": true
    }
  ]
}
```

#### 2단계: 신규 업로드 시 중복 방지 (개선 제안 2)
- 업로드 전 `hash_md5` 체크
- 중복이면 `references` 업데이트 후 기존 URL 반환
- 신규면 저장 후 `references` 생성

**구현 예시**:
```javascript
// 업로드 전 중복 체크
const hash = await calculateMD5(imageBuffer);
const existing = await findImageByHash(hash);

if (existing) {
  // 기존 이미지의 references에 새 메시지 정보 추가
  await updateImageReferences(existing.id, {
    type: 'mms',
    message_id: newMessageId,
    date_folder: sentDate,
    used_at: new Date().toISOString()
  });
  return existing.image_url; // 새로 저장 안 함
} else {
  // 신규 이미지 저장 (기존 로직)
}
```

#### 3단계: 갤러리 날짜별 필터링 (가상 심볼릭 링크)
- 날짜별로 보이도록 쿼리
- `date_folder` 또는 `references`에서 날짜별 조회

**쿼리 예시**:
```javascript
// 날짜별로 보이도록 쿼리
SELECT * FROM image_metadata
WHERE 
  date_folder = '2025-11-28'  -- 직접 저장된 경우
  OR "references" @> '[{"date_folder": "2025-11-28"}]'  -- 참조된 경우
```

**장점**:
- ✅ 저장 공간 절약 (중복 이미지 제거)
- ✅ 날짜별 접근 가능 (`references`로 날짜별 조회)
- ✅ 사용 이력 추적 (모든 사용 기록 보존)
- ✅ 기존 데이터 복구 (통합 스크립트로 기존 중복 정리)
- ✅ 향후 중복 방지 (업로드 시 자동 중복 체크)

**필요 파일**:
- `scripts/merge-duplicate-mms-images.js` (중복 통합 스크립트)
- `pages/api/solapi/upload-image.js` 수정 (신규 중복 방지)
- `pages/api/admin/mms-images.js` 수정 (날짜별 필터링)

**참고**: 
- Supabase Storage는 객체 스토리지이므로 전통적인 파일 시스템 심볼릭 링크는 불가능하지만, 메타데이터 참조 방식으로 동일한 효과를 구현할 수 있습니다.
- `image_metadata` 테이블에 이미 `references` JSONB 컬럼과 `usage_count`, `hash_md5` 등이 준비되어 있어 추가 스키마 변경이 필요 없습니다.

---

## 11. 굿즈 / 사은품 관리 및 고객 선물 히스토리

- **왜 하는가**
  - MASSGOO × MUZIIK 콜라보 모자, 버킷햇, 티셔츠 등 굿즈/사은품 지급 내역을 체계적으로 관리
  - 고객별로 어떤 선물을 언제, 어떤 방식(직접수령/택배 등)으로 지급했는지 추적
  - 향후 굿즈 판매/재고 시스템과 자연스럽게 연동될 수 있는 기반 데이터 모델 구축

- **DB 스키마**
  - `products` (기존/신규 통합 마스터)
    - 주요 컬럼: `id, name, sku, category, color, size, legacy_name, is_gift, is_sellable, is_active, normal_price, sale_price`
    - `is_gift`: 사은품 여부 플래그
    - `is_sellable`: 판매 가능 상품 여부
  - `customer_gifts` (신규)
    - 컬럼: `id, customer_id (bigint, customers.id FK), survey_id (uuid, surveys.id FK), product_id (bigint, products.id FK), gift_text, quantity, delivery_type (in_person|courier|etc), delivery_status (pending|sent|canceled), delivery_date, note, created_at, updated_at`
    - 인덱스: `customer_id`, `product_id`

- **API 구현**
  - `GET /api/admin/products`
    - 파라미터: `isGift`, `includeInactive`, `q`, `category`
    - 용도: 굿즈 관리 페이지 및 설문/선물 선택용 드롭다운에 사용
  - `POST /api/admin/products`
    - 상품 생성 (굿즈/사은품 포함)
  - `PUT /api/admin/products`
    - 상품 수정 (플래그/가격/색상/사이즈 등)
  - `DELETE /api/admin/products`
    - 실제 삭제 대신 `is_active=false` 로 소프트 삭제
  - `GET /api/admin/customer-gifts?customerId=...`
    - 특정 고객의 선물 히스토리 조회 (상품 조인 포함)
  - `POST /api/admin/customer-gifts`
    - 새 선물 지급 기록 추가
  - `PUT /api/admin/customer-gifts`
    - 지급 상태/수량/메모 수정 (필요 시 확장)
  - `DELETE /api/admin/customer-gifts`
    - 잘못 입력된 선물 기록 삭제

- **관리자 UI 구현**
  - `/admin/products`
    - 기능:
      - 굿즈/사은품 상품 목록 조회 (검색, 사은품만 필터, 비활성 포함 여부)
      - 상품 생성/수정 모달 (이름, SKU, 카테고리, 색상, 사이즈, 정상가/할인가, 플래그 설정)
      - 상품 비활성화(소프트 삭제)
    - 구현 파일:
      - `pages/admin/products.tsx`
      - `pages/api/admin/products.ts`
      - `components/admin/AdminNav.tsx` 에 메뉴 `🎁 굿즈 / 사은품` 추가
  - 고객 상세 선물 히스토리 모달
    - 위치: `고객 관리` 페이지 (`/admin/customers`) 각 행의 `🎁 선물` 버튼
    - 기능:
      - 상단: 기존 선물 지급 이력 테이블 (날짜, 사은품명, 수량, 전달 방식/상태, 메모)
      - 하단: 새 선물 기록 추가 폼
        - 사은품 선택 (상품 드롭다운, `/api/admin/products?isGift=true`)
        - 기타 메모 (원래 제품명, 색/사이즈, 특이사항 등)
        - 수량, 전달 방식(직접수령/택배/기타), 상태(대기/완료/취소), 지급일, 비고
    - 구현 파일:
      - `pages/admin/customers/index.tsx`
        - 새로운 모달 컴포넌트 `CustomerGiftsModal` 추가
        - 고객 행에 `🎁 선물` 버튼 추가
      - `pages/api/admin/customer-gifts.ts`

- **향후 확장 포인트**
  - 설문 편집 모달에서 선택한 사은품을 `customer_gifts` 와 자동 연결 (`survey_id` 활용)
  - 굿즈 재고/판매 대시보드와 연동 (상품별 지급 수량 집계)
  - 특정 굿즈를 여러 번 받은 VIP 고객 타깃 마케팅 (예: 모자/공 재구매 유도 캠페인)

---

## ✅ 최근 작업: 제품 관리 시스템 통합 및 이미지 타입별 분리 (2025-12-27)

### 완료된 작업
- **제품 합성 관리 페이지 수정** ✅:
  - `pages/admin/product-composition.tsx`: 이미지 업로드 시 `imageType='composition'` 파라미터 추가
  - 합성용 이미지가 `originals/products/{product-slug}/composition/` 폴더에 저장되도록 수정
  - 메인 이미지와 참조 이미지 모두 합성용 폴더에 저장
- **데이터베이스 스키마 확장 준비** ✅:
  - `database/extend-products-table-for-drivers.sql`: 드라이버 제품 필드 추가 SQL 작성
  - 이미지 타입별 배열 필드 (`detail_images`, `composition_images`, `gallery_images`) 추가
  - PG 연동 및 재고 관리 확장 필드 추가
- **드라이버 제품 마이그레이션 스크립트** ✅:
  - `scripts/migrate-driver-products-to-db.js`: 하드코딩된 8개 드라이버 제품을 데이터베이스로 마이그레이션
  - 이미지 경로를 새 구조(`originals/products/{slug}/{type}/`)로 업데이트
- **이미지 URL 헬퍼 함수 개선** ✅:
  - `lib/product-image-url.ts`: `getSupabasePublicUrl` 함수 추가
  - Supabase Storage 경로를 공개 URL로 변환하는 통합 함수 제공
- **최종 계획 문서 작성** ✅:
  - `docs/final-product-management-plan.md`: 통합 제품 관리 시스템 최종 계획 문서 작성
  - `docs/implementation-checklist.md`: 구현 체크리스트 작성

### 제품 이미지 Storage 구조
- **드라이버 제품**: `originals/products/{product-slug}/{type}/`
  - `detail/`: 상세페이지용 이미지
  - `composition/`: 합성용 참조 이미지
  - `gallery/`: AI 합성 결과 이미지
- **굿즈 제품**: `originals/products/goods/{product-slug}/{type}/`
  - 동일한 구조로 관리

### 관리 페이지 역할 분담
- `/admin/products`: 상세페이지 이미지 (`detail`) 관리
- `/admin/product-composition`: 합성용 이미지 (`composition`) 관리 ✅ 수정 완료
- `/admin/ai-image-generator`: 갤러리 이미지 (`gallery`) 자동 저장

### 남은 작업
- [ ] 데이터베이스 스키마 확장 실행 (Supabase 대시보드에서 SQL 실행)
- [ ] 드라이버 제품 마이그레이션 실행 (`node scripts/migrate-driver-products-to-db.js`)
- [ ] 통합 제품 관리 페이지 개선 (드라이버 제품 관리 기능 추가)
- [ ] 메인 페이지 연동 (하드코딩 제거, 데이터베이스에서 로드)

### 관련 파일
- `pages/admin/product-composition.tsx` (수정)
- `pages/api/admin/upload-product-image.js` (확인 완료)
- `database/extend-products-table-for-drivers.sql` (신규)
- `scripts/migrate-driver-products-to-db.js` (신규)
- `lib/product-image-url.ts` (개선)
- `docs/final-product-management-plan.md` (신규)
- `docs/implementation-checklist.md` (신규)

---

## 2025-01-XX: black-beryl 제품 이미지 재정비 ✅

### 작업 내용
- **문제**: `black-beryl` 제품의 3개 이미지(`massgoo_sw_black_muz_12.webp`, `13.webp`, `15.webp`)가 `composition` 폴더에 있었지만, 실제로는 상세페이지용(`detail`) 이미지였음
- **해결**: 
  1. Storage에서 3개 파일을 `composition` → `detail` 폴더로 이동
  2. `product_composition` 테이블의 `reference_images`를 빈 배열로 업데이트
  3. `product_composition.image_url`은 `secret-weapon-black-sole-500.webp`만 유지

### 변경된 파일
- `scripts/reorganize-black-beryl-images.js` (신규): 이미지 재정비 스크립트
- `scripts/black-beryl-reorganization-result.json` (신규): 재정비 결과 로그

### 최종 상태
- ✅ Storage: 3개 파일이 `detail` 폴더로 이동 완료
- ✅ `product_composition.reference_images`: 빈 배열 `[]`
- ✅ `product_composition.image_url`: `secret-weapon-black-sole-500.webp`만 유지
- ✅ `products.detail_images`: 9개 모두 정상 (12, 13, 15 포함)

---

## 2025-01-XX: black-beryl 루트 폴더 정리 완료 ✅

### 작업 내용
- **문제**: `black-beryl` 루트 폴더에 13개 파일이 남아있어 정리가 필요했음
- **해결**: 
  1. 루트 폴더의 모든 파일을 하위 폴더(`detail/`, `composition/`)로 이동 또는 삭제
  2. `composition` 폴더는 `secret-weapon-black-sole-500.webp`만 유지 (500 관련 다른 파일 삭제)
  3. 데이터베이스의 `detail_images`와 `composition_images` 업데이트
  4. 루트 폴더 완전히 정리

### 변경된 파일
- `scripts/clean-black-beryl-root-files.js` (신규): 루트 폴더 정리 스크립트
- `scripts/remove-unnecessary-500-files.js` (신규): 불필요한 500 관련 파일 삭제 스크립트
- `scripts/black-beryl-root-cleanup-result.json` (신규): 정리 결과 로그
- `scripts/remove-500-files-result.json` (신규): 삭제 결과 로그

### 최종 상태
- ✅ 루트 폴더: 완전히 비어있음 (0개 파일)
- ✅ `detail/` 폴더: 10개 파일 (상세페이지용 이미지)
- ✅ `composition/` 폴더: 1개 파일 (`secret-weapon-black-sole-500.webp`만 유지)
- ✅ `products.detail_images`: 10개 이미지 (500 관련 파일 제거됨)
- ✅ `products.composition_images`: 1개 이미지 (`secret-weapon-black-sole-500.webp`)

---

## 2025-01-XX: 모든 드라이버 제품 루트 폴더 정리 완료 ✅

### 작업 내용
- **문제**: 7개 드라이버 제품의 루트 폴더에 총 117개 파일이 남아있어 정리가 필요했음
- **해결**: 
  1. 모든 제품의 루트 폴더 파일을 하위 폴더(`detail/`, `composition/`, `gallery/`)로 이동 또는 삭제
  2. 각 제품의 `composition` 폴더는 500 사이즈 파일 1개만 유지 (나머지 500 관련 파일 삭제)
  3. 데이터베이스의 `detail_images`, `composition_images`, `gallery_images` 업데이트
  4. 모든 제품의 루트 폴더 완전히 정리

### 정리된 제품 목록
1. ✅ **black-weapon**: 21개 파일 처리 (7개 이동, 16개 삭제)
2. ✅ **gold-weapon4**: 20개 파일 처리 (10개 이동, 11개 삭제)
3. ✅ **gold2**: 13개 파일 처리 (12개 이동, 2개 삭제)
4. ✅ **gold2-sapphire**: 14개 파일 처리 (3개 이동, 12개 삭제)
5. ✅ **pro3**: 22개 파일 처리 (12개 이동, 11개 삭제)
6. ✅ **pro3-muziik**: 8개 파일 처리 (0개 이동, 8개 삭제)
7. ✅ **v3**: 19개 파일 처리 (11개 이동, 8개 삭제)

### 변경된 파일
- `scripts/check-all-driver-products-status.js` (신규): 모든 드라이버 제품 상태 확인 스크립트
- `scripts/clean-all-driver-products-root-files.js` (신규): 모든 드라이버 제품 루트 폴더 정리 스크립트
- `scripts/all-driver-products-status.json` (신규): 상태 확인 결과
- `scripts/all-driver-products-cleanup-result.json` (신규): 정리 결과 로그

### 최종 상태
- ✅ **모든 제품의 루트 폴더**: 완전히 비어있음 (0개 파일)
- ✅ **총 처리 파일**: 123개 (55개 이동, 68개 삭제)
- ✅ **각 제품의 `composition/` 폴더**: 500 사이즈 파일 1개만 유지
- ✅ **데이터베이스**: 모든 제품의 `detail_images`, `composition_images`, `gallery_images` 업데이트 완료

### 정리 통계
- **총 이동**: 55개 파일
- **총 삭제**: 68개 파일 (중복 파일 및 불필요한 500 파일)
- **오류**: 0개

---

## 2025-01-XX: detail 폴더 정리 및 pro3 gallery 이미지 대체 완료 ✅

### 작업 내용
- **문제**: 
  1. 여러 제품의 detail 폴더에 불필요한 파일들(`_-_-_-_`로 시작), 중복 파일, composition 파일들이 섞여있었음
  2. pro3 제품의 detail 이미지를 gallery 이미지로 대체 필요
- **해결**: 
  1. 모든 드라이버 제품의 detail 폴더에서 불필요한 파일 삭제 (89개)
  2. pro3 제품의 detail 폴더를 gallery 이미지로 완전 대체

### 정리된 제품 (detail 폴더 정리)
1. ✅ **black-weapon**: 13개 삭제
2. ✅ **gold-weapon4**: 10개 삭제
3. ✅ **gold2**: 17개 삭제
4. ✅ **gold2-sapphire**: 2개 삭제
5. ✅ **pro3**: 24개 삭제 (이후 gallery 이미지로 대체)
6. ✅ **v3**: 23개 삭제

### pro3, gold-weapon4, black-weapon gallery 이미지 대체
- **pro3**:
  - **삭제**: detail 폴더의 기존 파일 9개
  - **복사**: gallery 폴더의 9개 파일을 detail 폴더로 복사
  - **데이터베이스**: `detail_images`를 gallery 이미지 경로로 업데이트
- **gold-weapon4**:
  - **삭제**: detail 폴더의 기존 파일 9개
  - **복사**: gallery 폴더의 9개 파일을 detail 폴더로 복사
  - **데이터베이스**: `detail_images`를 gallery 이미지 경로로 업데이트
- **black-weapon**:
  - **삭제**: detail 폴더의 기존 파일 9개
  - **복사**: gallery 폴더의 9개 파일을 detail 폴더로 복사
  - **데이터베이스**: `detail_images`를 gallery 이미지 경로로 업데이트

### 변경된 파일
- `scripts/check-unnecessary-files-in-detail.js` (신규): detail 폴더 불필요한 파일 확인 스크립트
- `scripts/clean-detail-folders.js` (신규): detail 폴더 정리 스크립트
- `scripts/replace-pro3-detail-with-gallery.js` (신규): pro3 gallery 이미지 대체 스크립트
- `scripts/replace-gold-weapon4-detail-with-gallery.js` (신규): gold-weapon4 gallery 이미지 대체 스크립트
- `scripts/replace-black-weapon-detail-with-gallery.js` (신규): black-weapon gallery 이미지 대체 스크립트
- `scripts/unnecessary-files-in-detail.json` (신규): 불필요한 파일 확인 결과
- `scripts/detail-folders-cleanup-result.json` (신규): detail 폴더 정리 결과
- `scripts/pro3-detail-to-gallery-replacement-result.json` (신규): pro3 대체 결과
- `scripts/gold-weapon4-detail-to-gallery-replacement-result.json` (신규): gold-weapon4 대체 결과
- `scripts/black-weapon-detail-to-gallery-replacement-result.json` (신규): black-weapon 대체 결과
- `scripts/delete-gallery-files-for-weapons.js` (신규): black-weapon, gold-weapon4 gallery 파일 삭제 스크립트
- `scripts/gallery-files-deletion-result.json` (신규): gallery 파일 삭제 결과

### 최종 상태
- ✅ **모든 제품의 detail 폴더**: 불필요한 파일 제거 완료
- ✅ **pro3 detail 폴더**: gallery 이미지로 완전 대체 (9개 파일)
- ✅ **pro3 gallery 폴더**: 원본 유지 (9개 파일)
- ✅ **gold-weapon4 detail 폴더**: gallery 이미지로 완전 대체 (9개 파일)
- ✅ **gold-weapon4 gallery 폴더**: 삭제 완료 (0개 파일)
- ✅ **black-weapon detail 폴더**: gallery 이미지로 완전 대체 (9개 파일)
- ✅ **black-weapon gallery 폴더**: 삭제 완료 (0개 파일)
- ✅ **gold-weapon4 gallery 폴더**: 삭제 완료 (0개 파일)
- ✅ **데이터베이스**: 모든 제품의 `detail_images`, `gallery_images` 업데이트 완료

### 삭제된 파일 유형
1. **불필요한 파일**: `_-_-_-_`로 시작하는 파일 (46개)
2. **Composition 파일**: detail에 있던 500/350 관련 파일 (14개)
3. **중복 파일**: 같은 번호의 중복 파일 (29개)

