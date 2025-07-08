# 수정 로그

## 2025년 1월

### 2025-01-XX (오늘) - 프로젝트 구조 정리
- **작업**: 프로젝트 전체 구조 정리
- **이유**: 7월 퍼널 완성 후 개발 중 생성된 임시 파일들 정리
- **변경 사항**:
  - 91개의 개발 스크립트 백업 및 제거
  - 문서 파일 체계적 정리 (docs/setup, docs/troubleshooting)
  - 테스트 파일 tests/ 폴더로 이동
  - 루트 디렉토리 36개 파일 → 20개로 감소
- **생성 문서**:
  - `/docs/SITE_STRUCTURE.md` - URL 및 페이지 구조
  - `/docs/CLEANUP_COMPLETE_REPORT.md` - 정리 완료 보고서

### 2025-01-XX (오늘) - iframe 전화번호 문제 해결
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
