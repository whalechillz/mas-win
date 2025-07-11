# 📋 매뉴얼 구조 및 업데이트 가이드

## 📁 폴더 구조

```
/docs/manual/
├── README.md                 # 메인 목차 및 빠른 시작
├── 01-introduction.md        # 시스템 소개
├── 02-login-guide.md        # 로그인 가이드
├── 03-dashboard-overview.md # 대시보드 개요
├── 04-campaign-management.md # 캠페인 관리
├── 05-booking-management.md  # 예약 관리
├── 06-contact-management.md  # 상담 관리
├── 07-marketing-analytics.md # 마케팅 분석
├── 08-team-dashboard.md     # 팀 멤버 대시보드
├── 09-content-creation.md   # 콘텐츠 작성
├── 10-lead-management.md    # 리드 관리
├── 11-realtime-analytics.md # 실시간 분석
├── 12-report-generation.md  # 보고서 생성
├── 13-system-settings.md    # 시스템 설정
├── 14-mobile-guide.md       # 모바일 가이드
├── 15-faq.md               # 자주 묻는 질문
├── 16-troubleshooting.md   # 문제 해결
├── UPDATE_GUIDE.md          # 이 파일 (업데이트 가이드)
└── images/                  # 스크린샷 및 이미지
    ├── admin-login-screen.png
    ├── team-login-screen.png
    └── dashboard-overview.png
```

## 🔄 업데이트 방법

### 1. 새로운 기능 추가 시
1. 해당 섹션의 `.md` 파일 수정
2. 스크린샷 추가 (필요시)
3. README.md의 업데이트 내역 수정

### 2. 버전 관리
```markdown
### 2025.07 - 버전 1.0
- ✅ 초기 매뉴얼 작성

### 2025.08 - 버전 1.1 (예시)
- ✅ 새로운 기능 추가
- ✅ UI 개선 사항 반영
```

### 3. 스크린샷 추가
1. `/docs/manual/images/` 폴더에 저장
2. 파일명: `기능명-설명.png` 형식
3. 마크다운에서 참조: `![설명](./images/파일명.png)`

## 📝 작성 가이드라인

### 1. 일관된 스타일
- 제목: 이모티콘 + 한글 제목
- 코드: 백틱 3개로 감싸기
- 중요 사항: `> ⚠️ **주의**` 형식

### 2. 네비게이션
각 페이지 하단에 추가:
```markdown
<div align="center">
  <a href="./이전페이지.md">
    <img src="https://img.shields.io/badge/◀_이전_제목-gray?style=for-the-badge" alt="Back">
  </a>
  <a href="./다음페이지.md">
    <img src="https://img.shields.io/badge/다음_▶_제목-blue?style=for-the-badge" alt="Next">
  </a>
</div>
```

### 3. 테이블 활용
```markdown
| 구분 | 설명 | 비고 |
|------|------|------|
| 항목1 | 설명1 | 비고1 |
```

## 🎨 디자인 요소

### 배지 (Badges)
```markdown
![Version](https://img.shields.io/badge/Version-1.0-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
```

### 알림 박스
```markdown
> ℹ️ **정보**: 일반 정보
> ⚠️ **주의**: 주의 사항
> ✅ **팁**: 유용한 팁
> ❌ **경고**: 위험 사항
```

## 🚀 다음 업데이트 예정

- [ ] 동영상 튜토리얼 링크 추가
- [ ] 더 많은 스크린샷 추가
- [ ] 영문 버전 제작
- [ ] PDF 버전 생성

---

매뉴얼 업데이트 시 이 가이드를 참고하세요!
