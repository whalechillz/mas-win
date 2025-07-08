# MAS Golf 정적 파일 캐싱 문제 해결 가이드

## 현재 상황
- Next.js TSX 파일이 정적 HTML을 iframe으로 로드
- 브라우저가 정적 HTML을 강하게 캐싱하여 수정사항이 반영되지 않음
- 슬랙 알림에서 "중요요소"가 "안정형"으로 잘못 표시

## 즉시 해결 방법

### 1. 슬랙 알림 수정 적용
```bash
cd /Users/m2/MASLABS/win.masgolf.co.kr
chmod +x apply-slack-fix-now.sh
./apply-slack-fix-now.sh
```

### 2. TSX 파일에 캐시 방지 적용
```bash
# 기존 파일 백업
cp pages/funnel-2025-07.tsx pages/funnel-2025-07.tsx.backup

# 캐시 방지 버전 적용
cp pages/funnel-2025-07-cache-fix.tsx pages/funnel-2025-07.tsx
```

### 3. 배포
```bash
vercel --prod
```

### 4. 브라우저 캐시 완전 삭제
- Chrome: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
- 또는 개발자 도구 > Network > Disable cache 체크

## 장기적 해결 방안

### 옵션 1: 정적 파일 버전 관리
```javascript
// pages/funnel-2025-07.tsx
const VERSION = '20250107-fix-slack';
return (
  <iframe src={`/versions/funnel-2025-07-complete.html?v=${VERSION}`} />
);
```

### 옵션 2: Next.js 컴포넌트로 완전 마이그레이션
- 정적 HTML을 React 컴포넌트로 변환
- API 통합 및 상태 관리 개선
- 빌드 시 자동 캐시 무효화

### 옵션 3: 정적 파일 이름 변경
```bash
# 새 버전 파일 생성
cp public/versions/funnel-2025-07-complete.html public/versions/funnel-2025-07-v2.html

# TSX에서 새 파일 참조
# src="/versions/funnel-2025-07-v2.html"
```

## 디버깅 팁
1. Network 탭에서 HTML 파일이 304 (Not Modified)인지 확인
2. Response Headers의 Cache-Control 확인
3. 시크릿 모드에서 테스트

## 주의사항
- 정적 파일 수정 시 항상 백업 생성
- 배포 후 모든 브라우저에서 캐시 삭제 필요
- 슬랙 웹훅 URL 환경변수 확인 (SLACK_WEBHOOK_URL)
