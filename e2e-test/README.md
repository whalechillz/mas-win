# E2E 테스트 가이드

## 브라우저 버전 요구사항

### 알려진 문제 버전
- **Chrome 143.0.7499.147**: 로그인 기능에서 `CLIENT_FETCH_ERROR` 발생
  - 증상: `/api/auth/session` 요청 실패, "Failed to fetch" 오류
  - 해결 방법: Chrome을 다운그레이드하거나 다른 브라우저 사용
  - 테스트 실행 시 자동으로 감지되어 스킵됩니다

### 권장 버전
- Chrome 143.0.7499.109 이상 (147 제외)
- 또는 최신 안정 버전

## 테스트 실행

### 로그인 테스트
```bash
# 로그인 테스트 실행
node e2e-test/playwright-test-login.js

# 문제 버전 감지 시 자동으로 테스트 스킵
```

### 환경 변수 설정
```bash
# 관리자 로그인 정보 (선택사항)
export ADMIN_LOGIN="010-6669-9000"
export ADMIN_PASSWORD="your-password"
```

## 버전 체크 유틸리티

`e2e-test/utils/browser-version-check.js` 파일에서 브라우저 버전 체크 로직을 관리합니다.

### 사용 방법
```javascript
const { checkBrowserVersion } = require('./utils/browser-version-check');

// 페이지 로드 후 버전 체크
const versionCheck = await checkBrowserVersion(page, { skipTest: true });

if (versionCheck.shouldSkip) {
  console.log('테스트를 스킵합니다.');
  return;
}
```

### 새로운 문제 버전 추가
`PROBLEMATIC_VERSIONS` 배열에 버전 문자열을 추가하세요:
```javascript
const PROBLEMATIC_VERSIONS = [
  '143.0.7499.147', // 기존 문제 버전
  '144.0.7500.100', // 새로운 문제 버전 추가
];
```

## 테스트 파일 목록

- `playwright-test-login.js` - 로그인 기능 테스트 (버전 체크 포함)
- `playwright-test-booking-confirmation-flow.js` - 예약 확인 플로우 테스트
- `playwright-test-product-composition.js` - 제품 합성 기능 테스트
- 기타 테스트 파일들...

## 문제 해결

### Chrome 버전 확인 방법
1. Chrome에서 `chrome://settings/help` 접속
2. 버전 정보 확인
3. 문제 버전이면 다운그레이드 또는 업데이트

### 테스트가 자동으로 스킵되는 경우
- 현재 Chrome 버전이 알려진 문제 버전입니다
- Chrome을 업데이트하거나 다운그레이드하세요
- 또는 다른 브라우저(Chromium, Firefox 등)를 사용하세요

