# 쿠키 차단 설정 확인 가이드

특정 컴퓨터에서 인증 문제(401 Unauthorized)가 발생할 때, 브라우저의 쿠키 차단 설정을 확인하는 방법입니다.

---

## 1. 쿠키 차단 설정 확인

### Chrome (크롬)

#### 방법 1: 설정 메뉴
1. **설정 열기**
   - 주소창에 `chrome://settings/` 입력 또는
   - 우측 상단 점 3개 (⋮) → **설정**

2. **개인정보 및 보안 섹션**
   - 왼쪽 메뉴에서 **개인정보 및 보안** 클릭
   - 또는 주소창에 `chrome://settings/privacy` 입력

3. **쿠키 및 기타 사이트 데이터**
   - **쿠키 및 기타 사이트 데이터** 클릭
   - 또는 주소창에 `chrome://settings/cookies` 입력

4. **확인할 설정**
   ```
   ✅ "모든 쿠키 허용" (권장)
   ⚠️ "서드파티 쿠키 차단" - 이 옵션이 켜져 있으면 문제 발생 가능
   ❌ "쿠키 차단" - 이 옵션이 켜져 있으면 로그인 불가
   ```

5. **사이트별 설정 확인**
   - **사이트에서 보낸 쿠키 및 사이트 데이터 보기** 클릭
   - `masgolf.co.kr` 검색
   - 쿠키가 차단되어 있는지 확인

#### 방법 2: 개발자 도구
1. **F12** 또는 **Cmd+Option+I** (Mac) / **Ctrl+Shift+I** (Windows)
2. **Application** 탭 클릭
3. 왼쪽 메뉴에서 **Cookies** → `https://www.masgolf.co.kr` 선택
4. 확인할 쿠키:
   - `next-auth.session-token` (개발 환경)
   - `__Secure-next-auth.session-token` (프로덕션)
   - `__Host-next-auth.session-token` (프로덕션)

---

### Edge (엣지)

#### 방법 1: 설정 메뉴
1. **설정 열기**
   - 주소창에 `edge://settings/` 입력 또는
   - 우측 상단 점 3개 (⋯) → **설정**

2. **쿠키 및 사이트 권한**
   - 왼쪽 메뉴에서 **쿠키 및 사이트 권한** 클릭
   - 또는 주소창에 `edge://settings/content/cookies` 입력

3. **확인할 설정**
   ```
   ✅ "차단 안 함" (권장)
   ⚠️ "서드파티 쿠키 차단" - 문제 발생 가능
   ❌ "모든 쿠키 차단" - 로그인 불가
   ```

4. **사이트별 설정**
   - **허용** 또는 **차단** 목록에서 `masgolf.co.kr` 확인

---

### Safari (사파리)

#### 방법 1: 설정 메뉴
1. **Safari** → **환경설정** (또는 **Cmd + ,**)
2. **개인정보 보호** 탭 클릭
3. **쿠키 및 웹사이트 데이터** 섹션 확인
   ```
   ✅ "항상 허용" 또는 "방문한 웹사이트에서만" (권장)
   ⚠️ "항상 차단" - 로그인 불가
   ```

4. **웹사이트 데이터 관리**
   - **웹사이트 데이터 관리...** 클릭
   - `masgolf.co.kr` 검색하여 쿠키 존재 여부 확인

---

### Firefox (파이어폭스)

#### 방법 1: 설정 메뉴
1. **설정 열기**
   - 주소창에 `about:preferences` 입력 또는
   - 메뉴 (☰) → **설정**

2. **개인정보 및 보안**
   - 왼쪽 메뉴에서 **개인정보 및 보안** 클릭
   - 또는 주소창에 `about:preferences#privacy` 입력

3. **쿠키 및 사이트 데이터**
   - **쿠키 및 사이트 데이터** 섹션 확인
   ```
   ✅ "쿠키 및 사이트 데이터 허용" 체크 (권장)
   ⚠️ "서드파티 쿠키 차단" - 문제 발생 가능
   ❌ "모든 쿠키 차단" - 로그인 불가
   ```

4. **예외 관리**
   - **예외...** 버튼 클릭
   - `masgolf.co.kr`이 허용 목록에 있는지 확인

---

## 2. 서드파티 쿠키 차단 여부 확인

### Chrome
1. `chrome://settings/cookies` 접속
2. **서드파티 쿠키 차단** 옵션 확인
   - **켜짐**: 문제 발생 가능 (특히 iframe이나 다른 도메인에서 로그인하는 경우)
   - **꺼짐**: 정상

### Edge
1. `edge://settings/content/cookies` 접속
2. **서드파티 쿠키 차단** 옵션 확인

### Safari
1. Safari 환경설정 → 개인정보 보호
2. **서드파티 및 추적기 차단** 옵션 확인
   - **켜짐**: 문제 발생 가능
   - **꺼짐**: 정상

### Firefox
1. `about:preferences#privacy` 접속
2. **추적 방지** 섹션에서 **서드파티 쿠키 차단** 확인

---

## 3. 시크릿 모드 사용 여부 확인

### 확인 방법
1. 브라우저 주소창 확인
   - Chrome/Edge: 주소창 왼쪽에 **시크릿 모드 아이콘** (👤 또는 🕶️) 표시
   - Safari: 주소창이 **어두운 색상**으로 표시
   - Firefox: 주소창 왼쪽에 **보라색 마스크 아이콘** 표시

2. **시크릿 모드의 특징**
   - 쿠키가 **세션 종료 시 자동 삭제**됨
   - 브라우저를 닫으면 로그인 상태가 사라짐
   - 일부 확장 프로그램이 비활성화될 수 있음

3. **해결 방법**
   - 일반 모드로 전환 (Cmd+Shift+N / Ctrl+Shift+N 해제)
   - 또는 시크릿 모드에서도 쿠키가 저장되도록 설정 확인

---

## 4. 브라우저 확장 프로그램 확인

### 쿠키 차단 확장 프로그램 예시
- **Privacy Badger**
- **Ghostery**
- **uBlock Origin** (일부 설정에서 쿠키 차단)
- **Cookie AutoDelete**
- **I Don't Care About Cookies**

### 확인 방법

#### Chrome/Edge
1. 주소창에 `chrome://extensions/` 또는 `edge://extensions/` 입력
2. 설치된 확장 프로그램 목록 확인
3. 쿠키 관련 확장 프로그램 찾기
4. **일시적으로 비활성화**하여 테스트

#### Safari
1. Safari → 환경설정 → 확장 프로그램
2. 설치된 확장 프로그램 확인
3. 쿠키 관련 확장 프로그램 비활성화

#### Firefox
1. 주소창에 `about:addons` 입력
2. **확장 기능** 탭 클릭
3. 쿠키 관련 확장 프로그램 확인 및 비활성화

### 테스트 방법
1. 모든 확장 프로그램 비활성화
2. 브라우저 재시작
3. 로그인 시도
4. 문제가 해결되면 → 확장 프로그램을 하나씩 활성화하며 원인 찾기

---

## 5. 빠른 진단 스크립트

브라우저 콘솔에서 실행하여 쿠키 상태를 확인:

```javascript
// 브라우저 콘솔에서 실행 (F12 → Console 탭)
(async () => {
  console.log('=== 쿠키 상태 진단 ===\n');
  
  // 1. 쿠키 확인
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = value;
    return acc;
  }, {});
  
  console.log('📋 모든 쿠키:', cookies);
  console.log('\n🔑 세션 쿠키 상태:');
  console.log('  - next-auth.session-token:', 
    cookies['next-auth.session-token'] ? '✅ 있음' : '❌ 없음');
  console.log('  - __Secure-next-auth.session-token:', 
    cookies['__Secure-next-auth.session-token'] ? '✅ 있음' : '❌ 없음');
  console.log('  - __Host-next-auth.session-token:', 
    cookies['__Host-next-auth.session-token'] ? '✅ 있음' : '❌ 없음');
  
  // 2. 세션 확인
  try {
    const sessionRes = await fetch('/api/auth/session');
    const session = await sessionRes.json();
    console.log('\n👤 세션 정보:', session);
    console.log('  - 인증 상태:', session?.user ? '✅ 로그인됨' : '❌ 로그인 안 됨');
    if (session?.user) {
      console.log('  - 사용자:', session.user.name);
      console.log('  - 역할:', session.user.role);
    }
  } catch (error) {
    console.error('\n❌ 세션 확인 실패:', error);
  }
  
  // 3. API 테스트
  try {
    const apiRes = await fetch('/api/admin/all-images?limit=1');
    console.log('\n📡 API 응답 상태:', apiRes.status);
    if (apiRes.status === 401) {
      const error = await apiRes.json();
      console.error('  ❌ API 인증 실패:', error);
      console.log('\n💡 해결 방법:');
      console.log('  1. 브라우저 설정에서 쿠키 허용 확인');
      console.log('  2. 시크릿 모드가 아닌지 확인');
      console.log('  3. 쿠키 차단 확장 프로그램 비활성화');
      console.log('  4. 로그아웃 후 재로그인');
    } else if (apiRes.status === 200) {
      console.log('  ✅ API 인증 성공');
    } else {
      console.log('  ⚠️ 예상치 못한 상태:', apiRes.status);
    }
  } catch (error) {
    console.error('\n❌ API 요청 실패:', error);
  }
  
  // 4. 브라우저 정보
  console.log('\n🌐 브라우저 정보:');
  console.log('  - User-Agent:', navigator.userAgent);
  console.log('  - 시크릿 모드:', 
    navigator.cookieEnabled ? '❌ 아니오 (쿠키 활성화됨)' : '✅ 예 (쿠키 비활성화됨)');
  
  console.log('\n=== 진단 완료 ===');
})();
```

---

## 6. 체크리스트

특정 컴퓨터에서 인증 문제가 발생할 때 확인할 항목:

### 브라우저 설정
- [ ] 쿠키 차단 설정 확인 (설정 → 개인정보 보호 → 쿠키)
  - [ ] "모든 쿠키 허용" 또는 "차단 안 함" 설정 확인
  - [ ] `masgolf.co.kr`이 허용 목록에 있는지 확인
- [ ] 서드파티 쿠키 차단 여부 확인
  - [ ] 서드파티 쿠키 차단이 켜져 있으면 일시적으로 끄기
- [ ] 시크릿 모드 사용 여부 확인
  - [ ] 시크릿 모드면 일반 모드로 전환
- [ ] 브라우저 확장 프로그램 확인
  - [ ] 쿠키 차단 확장 프로그램 비활성화
  - [ ] Privacy Badger, Ghostery, uBlock Origin 등 확인

### 네트워크
- [ ] VPN 사용 여부 확인
  - [ ] VPN이 쿠키 전송을 방해할 수 있음
- [ ] 프록시 설정 확인
  - [ ] 프록시가 쿠키를 차단할 수 있음
- [ ] 방화벽 설정 확인
  - [ ] 회사 방화벽이 쿠키를 차단할 수 있음

### 세션
- [ ] 로그인 상태 확인
  - [ ] `/api/auth/session` 호출하여 세션 확인
- [ ] 세션 만료 확인
  - [ ] 로그아웃 후 재로그인 시도
- [ ] 쿠키 만료 시간 확인
  - [ ] 개발자 도구 → Application → Cookies에서 확인

---

## 7. 문제 해결 단계

### Step 1: 빠른 확인
1. 브라우저 콘솔에서 진단 스크립트 실행
2. 쿠키 존재 여부 확인
3. 세션 상태 확인

### Step 2: 브라우저 설정 확인
1. 쿠키 차단 설정 확인
2. 서드파티 쿠키 차단 해제
3. 시크릿 모드 해제

### Step 3: 확장 프로그램 확인
1. 모든 확장 프로그램 비활성화
2. 브라우저 재시작
3. 로그인 시도

### Step 4: 재로그인
1. 로그아웃
2. 브라우저 쿠키 삭제 (선택사항)
3. 재로그인

### Step 5: 다른 브라우저 테스트
1. 다른 브라우저에서 로그인 시도
2. 문제가 동일하면 → 네트워크/서버 문제 가능성
3. 문제가 해결되면 → 브라우저 설정 문제

---

## 8. 자주 묻는 질문 (FAQ)

### Q1: 쿠키는 있는데 401 오류가 발생해요
**A:** 쿠키가 있더라도 만료되었거나 서버에서 인식하지 못할 수 있습니다.
- 로그아웃 후 재로그인
- 브라우저 쿠키 삭제 후 재로그인
- 서버 로그 확인 (Vercel Dashboard)

### Q2: 다른 컴퓨터에서는 정상인데 특정 컴퓨터에서만 문제가 발생해요
**A:** 해당 컴퓨터의 브라우저 설정이나 확장 프로그램 문제일 가능성이 높습니다.
- 브라우저 설정 확인 (위 가이드 참고)
- 확장 프로그램 비활성화
- 다른 브라우저로 테스트

### Q3: 시크릿 모드에서 로그인이 안 돼요
**A:** 시크릿 모드는 세션 종료 시 쿠키를 삭제하므로, 일반 모드를 사용하세요.

### Q4: 회사 컴퓨터에서만 문제가 발생해요
**A:** 회사 방화벽이나 프록시가 쿠키를 차단할 수 있습니다.
- IT 부서에 문의
- VPN 사용 여부 확인
- 프록시 설정 확인

---

## 9. 추가 리소스

- [Chrome 쿠키 설정](https://support.google.com/chrome/answer/95647)
- [Edge 쿠키 설정](https://support.microsoft.com/edge/edge%EC%97%90%EC%84%9C-%EC%BF%A0%ED%82%A4-%EA%B4%80%EB%A6%AC-59747dcf-107c-47a8-895b-ca872bdd6054)
- [Safari 쿠키 설정](https://support.apple.com/ko-kr/guide/safari/sfri11471/mac)
- [Firefox 쿠키 설정](https://support.mozilla.org/ko/kb/cookies-information-websites-store-on-your-computer)

---

**마지막 업데이트:** 2026-01-15
