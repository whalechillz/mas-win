# MCP Playwright 브라우저 이슈 분석

## 📊 테스트 결과 (일반 Playwright 스크립트)

### ✅ 정상 작동하는 페이지
1. **고객 관리** (`/admin/customers`)
   - API 요청: ✅ 정상 (200 OK)
   - 페이지 로드: ✅ 성공
   - 세션 쿠키: ✅ 정상 설정

2. **블로그 관리** (`/admin/blog`)
   - API 요청: ✅ 정상 (200 OK)
   - 페이지 로드: ✅ 성공

3. **허브 시스템** (`/admin/content-calendar-hub`)
   - API 요청: ✅ 정상 (200 OK)
   - 페이지 로드: ✅ 성공

### ⚠️ 문제가 있는 페이지
1. **갤러리 관리** (`/admin/gallery`)
   - 타임아웃 발생: `page.goto: Timeout 15000ms exceeded`
   - `networkidle` 대기 중 타임아웃
   - 원인: 페이지가 계속 네트워크 요청을 보내고 있어 `networkidle` 상태에 도달하지 못함

### 📈 네트워크 요청 통계
- `/api/auth/session`: ✅ 200 OK (정상)
- `/api/admin/*`: ✅ 대부분 200 OK
- 세션 쿠키: ✅ 정상 설정 (`next-auth.session-token`)

## 🔍 원인 분석

### 1. 일반 Playwright vs MCP Playwright

**일반 Playwright 스크립트**:
- ✅ 쿠키 정상 전송
- ✅ 세션 유지 정상
- ✅ 대부분의 페이지 정상 작동

**MCP Playwright 브라우저**:
- ❌ 쿠키 전송 실패 (401 Unauthorized)
- ❌ `/api/auth/session` 리다이렉트 루프 (308)
- ❌ 데이터 로딩 실패

### 2. MCP Playwright 브라우저의 특성

MCP Playwright는 Cursor IDE의 MCP 서버를 통해 자동으로 열리는 브라우저입니다:
- **자동 관리**: 사용자가 직접 열 수 없음 (MCP 서버가 관리)
- **별도 컨텍스트**: 일반 Playwright와 다른 브라우저 컨텍스트 사용
- **쿠키 저장소**: 일반 브라우저와 다른 쿠키 저장소 사용 가능

### 3. 문제의 핵심

1. **Trailing Slash 리다이렉트 루프**
   - `/api/auth/session` ↔ `/api/auth/session/` 간 308 리다이렉트
   - NextAuth와 미들웨어 간 충돌 가능성

2. **쿠키 전송 실패**
   - MCP Playwright 브라우저에서 쿠키가 요청 헤더에 포함되지 않음
   - `credentials: 'include'` 설정에도 불구하고 쿠키 미전송

## 🛠️ 적용된 수정 사항

### 1. 미들웨어 개선
- ✅ MCP Playwright 브라우저 감지 로직 추가
- ✅ 상세한 디버깅 로그 추가
- ✅ 쿠키 전송 실패 시 상세 정보 출력

### 2. API 호출 개선
- ✅ 모든 관리자 페이지에 `credentials: 'include'` 추가
- ✅ `canRender` 패턴 적용 (세션 로딩 중 화면 깜빡임 방지)

### 3. NextAuth 설정
- ✅ 쿠키 도메인 설정 개선 (localhost 호환)
- ✅ `sameSite: 'lax'` 설정 (Playwright 호환)

## 📚 참고 자료

### GitHub 이슈
- **NextAuth.js**: https://github.com/nextauthjs/next-auth/issues
  - 검색 키워드: "308 redirect loop", "trailing slash", "Playwright cookies"
- **Next.js**: https://github.com/vercel/next.js/issues
  - 검색 키워드: "middleware cookies not sent", "Edge Runtime cookies"
- **Playwright**: https://github.com/microsoft/playwright/issues
  - 검색 키워드: "cookies not sent", "credentials include", "MCP"

### 커뮤니티 포럼
- **Stack Overflow**: https://stackoverflow.com/questions/tagged/playwright
- **Vercel Community**: https://community.vercel.com/
- **Next.js Discussions**: https://github.com/vercel/next.js/discussions

## 🔧 추가 해결 방안

### 1. MCP Playwright 브라우저 초기화
```bash
# MCP Playwright 브라우저는 Cursor IDE가 자동으로 관리하므로
# 사용자가 직접 닫고 다시 열 수 없음
# 대신 Cursor IDE를 재시작하거나 MCP 서버를 재시작해야 함
```

### 2. 미들웨어에서 쿠키 확인 로직 강화
- 현재: 쿠키가 없으면 401 반환
- 개선: MCP Playwright 감지 시 더 자세한 로그 출력

### 3. NextAuth 설정 추가 조정
- `sameSite` 설정을 `'none'`으로 변경 (테스트용)
- `secure` 설정을 `false`로 변경 (localhost 개발 환경)

## 📝 결론

1. **일반 Playwright 스크립트**: ✅ 대부분 정상 작동
2. **MCP Playwright 브라우저**: ❌ 여전히 문제 발생
3. **원인**: MCP Playwright 브라우저의 쿠키 전송 문제 및 trailing slash 리다이렉트 루프
4. **해결 상태**: 부분적 개선 (일반 Playwright는 정상, MCP Playwright는 여전히 문제)

## 🎯 다음 단계

1. MCP Playwright 브라우저의 쿠키 전송 문제 해결
2. `/api/auth/session` trailing slash 리다이렉트 루프 해결
3. 갤러리 관리 페이지 타임아웃 문제 해결
