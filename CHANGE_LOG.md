# 수정 로그

## 2025년 7월 (실제 날짜: 2025년 1월)

### 2025-07-14 (월) - 간편 블로그 관리 시스템 추가
- **작업**: 네이버 블로그 중복 콘텐츠 문제 해결을 위한 간편 관리 시스템 개발
- **수정 사항**:
  - SimpleBlogManager 컴포넌트 생성 (1개 주제 → 3개 다른 앵글)
  - simple_blog_posts 테이블 스키마 설계
  - 네이버 SEO 정책 준수 가이드 작성
  - 주제별 그룹 표시 및 계정별 색상 구분
- **수정 파일**:
  - `/components/admin/marketing/SimpleBlogManager.tsx` (새로 생성)
  - `/components/admin/marketing/MarketingDashboard.tsx` (수정)
  - `/database/simple-blog-schema.sql` (새로 생성)
- **작성 문서**:
  - `/docs/EMPLOYEE_BLOG_GUIDE.md` (직원용 사용 가이드)
  - `/docs/SIMPLE_BLOG_SETUP.md` (설치 가이드)

### 2025-07-14 (월) - 캠페인 데이터 업데이트 및 버그 수정 (추가)
- **작업**: OP 매뉴얼 접근 권한 문제 해결 및 캠페인 관리 시스템 개선
- **수정 사항**:
  - OP 매뉴얼 API 인증 쿠키 이름 수정 (adminAuth → admin_auth)
  - 5월/6월 캠페인 OP 매뉴얼/구글 애즈 제거
  - Campaign 타입에 optional 필드 추가
  - ROI 계산 확인: +424% (정확한 계산)
- **수정 파일**:
  - `/pages/api/admin/op-manual/[campaign].js`
  - `/pages/admin.tsx`
  - `/lib/campaign-data.ts`
  - `/components/admin/campaigns/UnifiedCampaignManager.tsx`
- **작성 문서**:
  - `/CAMPAIGN_SYSTEM_UPDATE_20250714.md`

### 2025-07-14 (월) - 캠페인 데이터 업데이트 및 버그 수정
- **작업**: 5월/6월 캠페인 데이터 초기화 및 7월 캠페인 현황 업데이트
- **이유**: 5월/6월 캠페인은 예약, 문의, 조회수, 전환율을 체크하지 않음
- **변경 사항**:
  - 5월, 6월 캠페인 모든 데이터 '-' 표시
  - 7월 캠페인 남은 인원: 11명 (7월 14일 기준)
  - 예상 매출 계산 오류 수정 (87억 → 0.87억)
  - ROI 계산 현실화 (+1900% → +256%)
  - AI 인사이트 현실화
  - CPA 표시 수정 (65만원 → 5만원)
- **수정 파일**:
  - `/lib/campaign-data.ts`
  - `/components/admin/dashboard/CampaignPerformanceDashboard.tsx`
  - `/components/admin/campaigns/UnifiedCampaignManager.tsx`
  - `/components/admin/dashboard/InsightGenerator.tsx`
- **작성 문서**:
  - `/CAMPAIGN_STATUS_UPDATE_20250714.md`
  - `/CAMPAIGN_DATA_FIX_REPORT_20250714.md`

### 2025-01-13 (월) - OP 매뉴얼 보안 개선 및 프로젝트 정리
- **문제**: OP 매뉴얼이 public 폴더에 있어 보안 취약
- **해결**: 
  - `/pages/api/admin/op-manual/[campaign].js` API 생성
  - 관리자 인증 확인 후에만 접근 가능
  - 관리자 페이지 하단에 OP 매뉴얼 버튼 추가
- **정리 작업**:
  - 40개의 불필요한 파일들을 `backup-2025-07` 폴더로 이동
  - 개발/테스트 파일, 중복 파일, 오래된 문서 정리
  - 프로젝트 구조 간소화
- **수정 파일**:
  - `/pages/admin.tsx` - OP 매뉴얼 버튼 추가
  - `/pages/api/admin/op-manual/[campaign].js` - 생성
- **작성 문서**:
  - `/CLEANUP_REPORT_20250113.md` - 정리 작업 보고서

## 2025년 7월

### 2025-07-08 (화) - 관리자 페이지 통합 기능 추가
- **작업**: 관리자 페이지에 모든 관리 기능 통합
- **추가된 탭**:
  - 버전 관리: 모든 페이지 버전 목록 및 상태 확인
  - 쳪페인 관리: 월별 쳪페인 현황 및 관리
  - 디버그: 시스템 상태 모니터링 및 디버그 도구
- **이점**:
  - 한 곳에서 모든 관리 기능 사용 가능
  - 로그인 인증으로 보안 강화
  - 통합된 UI/UX
- **향후 계획**:
  - 외부 페이지(`/versions`, `/debug-test.html`) 접근 제한 고려

### 2025-07-08 (화) - 버전 관리 및 쿠폰 정책 페이지 추가
- **작업**: 버전 페이지 정리 및 쿠폰 정책 페이지 생성
- **변경 사항**:
  - `2025년 6월 프라임타임` 페이지 삭제 (종료된 쳪페인)
  - `2025년 6월 프라임타임 (테이블)` → `쿠폰 및 할인 정책`으로 변경
  - 전사적으로 사용 가능한 공통 정책 페이지로 전환
- **삭제 파일**:
  - `/public/versions/funnel-2025-06-prime-time.html`
  - `/public/versions/funnel-2025-06-prime-time-tables.html`
- **생성 파일**:
  - `/public/versions/coupon-policy.html`

### 2025-07-08 (화) - 프로젝트 구조 정리
- **작업**: 프로젝트 전체 구조 정리
- **이유**: 7월 퍼널 완성 후 개발 중 생성된 임시 파일들 정리
- **변경 사항**:
  - 91개의 개발 스크립트 백업 및 제거
  - 문서 파일 체계적 정리 (docs/setup, docs/troubleshooting)
  - 테스트 파일 tests/ 폴더로 이동
  - 루트 디렉토리 36개 파일 → 20개로 감소
  - 백업 폴더 통합 (backup-2025-07)
- **생성 문서**:
  - `/docs/SITE_STRUCTURE.md` - URL 및 페이지 구조
  - `/docs/CLEANUP_COMPLETE_REPORT.md` - 정리 완료 보고서

### 2025-07-08 (화) - iframe 전화번호 문제 해결
- **문제**: iframe 내 전화번호 클릭 시 iOS에서 작동 안 함, 취소 시 검은 창 남음
- **해결**: 
  - HTML: postMessage로 parent 통신 구현
  - TSX: 메시지 리스너 추가
  - window.open() 제거, window.location.href 사용
- **수정 파일**:
  - `/public/versions/funnel-2025-07-complete.html`
  - `/pages/funnel-2025-07.tsx`
- **작성 문서**:
  - `/MAIN_GUIDE.md` - 메인 가이드
  - `/docs/PROJECT_STRUCTURE_GUIDE.md` - 프로젝트 구조 가이드
  - `/docs/PHONE_CLICK_FIX_GUIDE.md` - 전화번호 문제 해결

---

## 템플릿 (복사해서 사용)

### YYYY-MM-DD
- **문제**: 
- **해결**: 
- **수정 파일**:
  - 
- **메모**: 
