# 수정 로그

## 2025년 1월

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
