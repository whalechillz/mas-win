# AI 자동 문서 업데이트 명령어

## 🤖 AI가 사용할 수 있는 명령어들

### 1. 문제 해결 시 자동 실행
```bash
# 문제가 해결되었을 때 실행
./scripts/update-docs.sh [문제명] resolved

# 예시: SMS 문제 해결됨
./scripts/update-docs.sh sms-troubleshooting resolved
```

### 2. 새로운 문제 발생 시
```bash
# 새로운 문제가 발생했을 때 실행
./scripts/update-docs.sh [문제명] new

# 예시: 새로운 이미지 문제
./scripts/update-docs.sh image-upload-issue new
```

### 3. 문서 상태 확인
```bash
# 현재 활성 문제 확인
ls docs/active/

# 해결된 문제 확인
ls docs/resolved/

# 전체 문서 구조 확인
tree docs/
```

## 📋 AI 업데이트 체크리스트

### 문제 해결 시:
- [ ] `./scripts/update-docs.sh [문제명] resolved` 실행
- [ ] 해결된 코드를 `docs/resolved/` 파일에 추가
- [ ] `docs/common-issues.md`에 해결 방법 요약 추가
- [ ] `docs/README.md`의 상태 대시보드 업데이트

### 새로운 문제 발생 시:
- [ ] `./scripts/update-docs.sh [문제명] new` 실행
- [ ] `docs/active/[문제명].md` 파일에 상세 정보 입력
- [ ] 관련 태그 추가
- [ ] 우선순위 설정

### 정기적 유지보수:
- [ ] 월별로 `docs/resolved/` 폴더 정리
- [ ] 오래된 해결된 문제들을 별도 아카이브로 이동
- [ ] `docs/common-issues.md` 업데이트

## 🏷️ 태그 시스템

### 문제 유형별 태그:
- `#sms` - SMS 관련
- `#scraping` - 스크래핑 관련
- `#image` - 이미지 관련
- `#api` - API 관련
- `#ui` - 사용자 인터페이스 관련
- `#performance` - 성능 관련
- `#security` - 보안 관련

### 기술 스택별 태그:
- `#nextjs` - Next.js 관련
- `#react` - React 관련
- `#solapi` - Solapi 관련
- `#naver` - 네이버 관련
- `#puppeteer` - Puppeteer 관련
- `#vercel` - Vercel 관련

### 우선순위별 태그:
- `#high` - 높음
- `#medium` - 중간
- `#low` - 낮음

## 📊 문서 상태 모니터링

### 현재 활성 문제 수:
```bash
# .gitkeep 파일 제외하고 실제 문제 파일만 카운트
ls docs/active/ | grep -v ".gitkeep" | wc -l
```

### 이번 달 해결된 문제 수:
```bash
ls docs/resolved/ | grep $(date +%Y-%m) | wc -l
```

### 가장 자주 발생하는 문제 유형:
```bash
grep -r "#" docs/active/ | cut -d' ' -f2 | sort | uniq -c | sort -nr
```

## 🔍 검색 명령어

### 특정 문제 검색:
```bash
grep -r "문제명" docs/
```

### 해결된 문제 검색:
```bash
grep -r "해결됨" docs/resolved/
```

### 특정 태그로 검색:
```bash
grep -r "#sms" docs/
```

## 📝 AI 사용 예시

### 문제 해결 완료 시:
```bash
# 1. 문제 해결됨을 아카이브로 이동
./scripts/update-docs.sh naver-blog-scraping resolved

# 2. 해결된 코드를 아카이브 파일에 추가
echo "## 📝 해결된 코드" >> docs/resolved/2025-10-29-naver-blog-scraping.md
echo '```javascript' >> docs/resolved/2025-10-29-naver-blog-scraping.md
echo '// 해결된 코드' >> docs/resolved/2025-10-29-naver-blog-scraping.md
echo '```' >> docs/resolved/2025-10-29-naver-blog-scraping.md

# 3. 상태 업데이트
sed -i 's/🔥진행중/✅해결됨/g' docs/resolved/2025-10-29-naver-blog-scraping.md
```

### 새로운 문제 발생 시:
```bash
# 1. 새 문제 문서 생성
./scripts/update-docs.sh database-connection-issue new

# 2. 상세 정보 입력
# (AI가 직접 파일을 편집하여 상세 정보 추가)
```

---
**생성일**: 2025-10-29  
**버전**: 1.0  
**담당자**: AI Assistant
