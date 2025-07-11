# 🔐 로그인 가이드

[← 메인으로 돌아가기](./README.md)

---

## 🎯 로그인 전 확인사항

### 접속 URL
- **웹사이트**: https://win.masgolf.co.kr
- **지원 브라우저**: Chrome, Safari, Edge (최신 버전 권장)

### 계정 종류
MASGOLF 시스템은 **2가지 계정 체계**를 운영합니다:

<table>
  <tr>
    <th width="20%">구분</th>
    <th width="30%">대상</th>
    <th width="25%">접속 URL</th>
    <th width="25%">권한</th>
  </tr>
  <tr>
    <td align="center">
      <img src="https://img.shields.io/badge/관리자-7C3AED?style=flat-square&logo=shield&logoColor=white" alt="Admin">
    </td>
    <td>시스템 관리자</td>
    <td><code>/admin</code></td>
    <td>전체 시스템 관리</td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://img.shields.io/badge/팀_멤버-3B82F6?style=flat-square&logo=users&logoColor=white" alt="Team">
    </td>
    <td>제이, 스테피, 나부장, 허상원</td>
    <td><code>/team-login</code></td>
    <td>콘텐츠 작성/관리</td>
  </tr>
</table>

---

## 🏢 관리자 로그인

### 1️⃣ 접속 방법

1. **브라우저에서 접속**
   ```
   https://win.masgolf.co.kr/admin
   ```

2. **로그인 화면**
   - 자동으로 `/admin-login` 페이지로 이동됩니다
   - 화려한 보라색-파란색 그라데이션 배경의 로그인 화면이 나타납니다

   <div align="center">
     <img src="./images/admin-login-screen.png" alt="관리자 로그인 화면" width="400">
     <p><em>관리자 로그인 화면</em></p>
   </div>

### 2️⃣ 로그인 정보 입력

- **아이디**: 환경 변수에 설정된 관리자 아이디
- **비밀번호**: 환경 변수에 설정된 관리자 비밀번호

> ⚠️ **보안 주의사항**
> - 관리자 계정 정보는 절대 외부에 공개하지 마세요
> - 정기적으로 비밀번호를 변경하세요
> - 공용 컴퓨터에서는 반드시 로그아웃하세요

### 3️⃣ 로그인 후 화면

로그인 성공 시 관리자 대시보드로 이동합니다:
- 실시간 성과 지표
- 캠페인 현황
- 예약 관리
- 상담 현황

---

## 👥 팀 멤버 로그인

### 1️⃣ 접속 방법

1. **브라우저에서 접속**
   ```
   https://win.masgolf.co.kr/team-login
   ```

2. **로그인 화면**
   - 팀 멤버 전용 로그인 화면이 나타납니다
   - 깔끔한 디자인의 로그인 폼이 표시됩니다

### 2️⃣ 초기 로그인

<table>
  <tr>
    <th>팀 멤버</th>
    <th>이메일 주소</th>
    <th>초기 비밀번호</th>
  </tr>
  <tr>
    <td>제이</td>
    <td>mas9golf7@gmail.com</td>
    <td rowspan="4" align="center"><code>1234</code></td>
  </tr>
  <tr>
    <td>스테피</td>
    <td>mas9golf3@gmail.com</td>
  </tr>
  <tr>
    <td>나부장</td>
    <td>singingstour@gmail.com</td>
  </tr>
  <tr>
    <td>허상원</td>
    <td>koolsangwon@gmail.com</td>
  </tr>
</table>

> 🔒 **중요**: 첫 로그인 시 비밀번호를 반드시 변경해주세요!

### 3️⃣ 비밀번호 변경 방법

1. 초기 비밀번호(1234)로 로그인
2. 자동으로 비밀번호 변경 화면으로 이동
3. 새 비밀번호 입력 (8자 이상, 영문+숫자 조합 권장)
4. 비밀번호 확인 입력
5. "변경하기" 버튼 클릭

### 4️⃣ 로그인 후 화면

팀 멤버 대시보드로 이동합니다:
- 개인 성과 현황
- 콘텐츠 작성 메뉴
- 리드 관리
- 할 일 목록

---

## 🚨 로그인 문제 해결

### 로그인이 안 될 때

1. **"아이디 또는 비밀번호가 잘못되었습니다" 오류**
   - 이메일 주소를 정확히 입력했는지 확인
   - 대소문자 구분 확인
   - 초기 비밀번호: 1234

2. **화면이 멈추거나 로딩이 계속될 때**
   - 페이지 새로고침 (F5 또는 Cmd+R)
   - 브라우저 캐시 삭제
   - 다른 브라우저로 시도

3. **"권한이 없습니다" 오류**
   - 올바른 URL로 접속했는지 확인
   - 관리자: `/admin`
   - 팀 멤버: `/team-login`

### 비밀번호를 잊어버렸을 때

- 관리자에게 문의하여 비밀번호 초기화 요청
- 팀 멤버는 초기 비밀번호(1234)로 재설정 가능

---

## 🔒 보안 권장사항

### ✅ 해야 할 일
- 강력한 비밀번호 사용 (8자 이상, 영문+숫자+특수문자)
- 정기적인 비밀번호 변경 (3개월마다)
- 개인 기기에서만 "로그인 유지" 사용
- 작업 완료 후 반드시 로그아웃

### ❌ 하지 말아야 할 일
- 비밀번호를 다른 사람과 공유
- 공용 컴퓨터에서 로그인 정보 저장
- 쉬운 비밀번호 사용 (예: 1234, password, 생일)
- 의심스러운 링크를 통한 로그인

---

## 📱 모바일 로그인

모바일 기기에서도 동일한 방법으로 로그인 가능합니다:
1. 모바일 브라우저에서 URL 접속
2. 반응형 디자인으로 최적화된 화면 제공
3. 터치 친화적인 인터페이스

> 💡 **팁**: 모바일에서는 Safari나 Chrome 사용을 권장합니다

---

<div align="center">
  <a href="./README.md">
    <img src="https://img.shields.io/badge/◀_목차로_돌아가기-gray?style=for-the-badge" alt="Back">
  </a>
  <a href="./03-dashboard-overview.md">
    <img src="https://img.shields.io/badge/다음_▶_대시보드_개요-blue?style=for-the-badge" alt="Next">
  </a>
</div>
