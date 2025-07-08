# 수정 로그

## 2025년 1월

### 2025-01-XX (오늘)
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
