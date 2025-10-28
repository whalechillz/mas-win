# 문서화 시스템 가이드

## 📁 문서 구조

```
docs/
├── README.md                    # 이 파일 - 문서화 시스템 가이드
├── active/                      # 🔥 현재 활성화된 문제들
│   ├── sms-troubleshooting.md  # SMS 관련 문제 (해결됨)
│   ├── naver-blog-scraping.md  # 네이버 블로그 스크래핑 문제
│   └── gallery-images.md       # 갤러리 이미지 관련 문제
├── resolved/                    # ✅ 해결된 문제들 (아카이브)
│   ├── 2025-10-29-sms-auth-header-fix.md
│   └── 2025-10-29-solapi-v4-migration.md
├── templates/                   # 📝 문서 템플릿
│   ├── problem-template.md
│   └── solution-template.md
└── common-issues.md            # 🚨 자주 발생하는 일반적인 문제들
```

## 🔄 자동 업데이트 규칙

### 문제 해결 시 자동 처리:
1. **해결된 문제**는 `active/` → `resolved/`로 이동
2. **날짜별 아카이브** 생성 (YYYY-MM-DD-문제명.md)
3. **해결 방법**을 `common-issues.md`에 추가
4. **README.md** 업데이트

### 새로운 문제 발생 시:
1. `active/` 폴더에 새 문서 생성
2. `templates/problem-template.md` 사용
3. 문제 해결 과정 기록
4. 해결 시 `resolved/`로 이동

## 📋 문서 작성 규칙

### 문제 문서 형식:
```markdown
# [문제명] - [상태: 🔥진행중/✅해결됨]

## 🚨 문제 설명
- 발생 시점: YYYY-MM-DD
- 영향 범위: 
- 우선순위: 높음/중간/낮음

## 🔍 원인 분석
- 기술적 원인
- 환경적 원인

## 🔧 해결 과정
1. 시도 1: [실패/성공]
2. 시도 2: [실패/성공]
3. 최종 해결책

## 📝 해결된 코드
```javascript
// 해결된 코드 예시
```

## 🧪 테스트 방법
- 로컬 테스트
- 배포 테스트

## 📚 관련 문서
- 링크들
```

## 🤖 AI 자동 업데이트 명령어

### 문제 해결 시 실행할 명령어:
```bash
# 1. 해결된 문제를 아카이브로 이동
mv docs/active/problem-name.md docs/resolved/$(date +%Y-%m-%d)-problem-name.md

# 2. common-issues.md에 해결 방법 추가
echo "## 해결된 문제: problem-name" >> docs/common-issues.md

# 3. README.md 업데이트
# (자동으로 해결된 문제 수 업데이트)
```

## 📊 문서 상태 대시보드

### 현재 활성 문제: 2개
- [ ] 네이버 블로그 스크래핑
- [ ] 갤러리 이미지 관련

### 이번 달 해결된 문제: 1개
- [x] SMS 발송 문제 (2025-10-29)

## 🔍 검색 방법

### 문제별 검색:
```bash
# 특정 문제 검색
grep -r "네이버 블로그" docs/

# 해결된 문제 검색
grep -r "해결됨" docs/resolved/
```

### 코드별 검색:
```bash
# 특정 코드 패턴 검색
grep -r "createSolapiSignature" docs/
```