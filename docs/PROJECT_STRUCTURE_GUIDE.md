# WIN.MASGOLF.CO.KR 프로젝트 구조 가이드라인

## 🚨 필독! 수정 전 반드시 확인하세요

### 1. 프로젝트 구조 이해
```
/pages
  ├── funnel-2025-05.tsx  # 5월 캠페인 (동적)
  ├── funnel-2025-06.tsx  # 6월 캠페인 (동적)
  └── funnel-2025-07.tsx  # 7월 캠페인 (동적) → iframe으로 HTML 로드

/public/versions
  ├── funnel-2025-05-complete.html  # 5월 정적 HTML
  ├── funnel-2025-06-complete.html  # 6월 정적 HTML
  └── funnel-2025-07-complete.html  # 7월 정적 HTML (현재 사용 중)
```

### 2. ⚠️ 중요: 파일 수정 규칙

#### TSX 파일 수정 시
- **위치**: `/pages/funnel-2025-XX.tsx`
- **용도**: iframe 컨테이너, 메타데이터, 동적 기능
- **주의**: HTML 내용은 여기서 수정하지 마세요!

#### HTML 파일 수정 시
- **위치**: `/public/versions/funnel-2025-XX-complete.html`
- **용도**: 실제 랜딩 페이지 내용, 디자인, 텍스트
- **주의**: 이 파일이 실제로 보여지는 내용입니다!

### 3. 🔧 자주 발생하는 수정 사항별 가이드

#### 전화번호 변경
```bash
# HTML 파일에서 수정
/public/versions/funnel-2025-07-complete.html
# "080-028-8888" 검색 후 일괄 변경
```

#### API 엔드포인트 수정
```bash
# 1. API 파일 확인
/pages/api/booking.js  # 예약 API
/pages/api/contact.js  # 문의 API

# 2. HTML 파일의 API 호출 부분
/public/versions/funnel-2025-07-complete.html
# "/api/booking" 검색
```

#### 스타일/디자인 변경
```bash
# HTML 파일의 <style> 태그 내에서 수정
/public/versions/funnel-2025-07-complete.html
```

### 4. 📋 체크리스트: 수정 전 확인사항

- [ ] 어느 월의 캠페인을 수정하는가? (5월/6월/7월)
- [ ] TSX 수정이 필요한가? HTML 수정이 필요한가?
- [ ] API 연동 부분인가? 순수 프론트엔드인가?
- [ ] 백업을 만들었는가?

### 5. 🚫 하지 말아야 할 것들

1. **Repl로 파일 수정 금지** → 반드시 파일시스템 사용
2. **중복 파일 생성 금지** → 기존 파일 수정
3. **TSX와 HTML 동시 수정 금지** → 한 번에 하나씩

### 6. 📱 iframe 관련 수정 시

#### iframe 내부 (HTML) 수정
```javascript
// /public/versions/funnel-2025-07-complete.html
// postMessage로 parent와 통신
window.parent.postMessage({type: 'action', data: value}, '*');
```

#### iframe 외부 (TSX) 수정
```typescript
// /pages/funnel-2025-07.tsx
useEffect(() => {
  window.addEventListener('message', handleMessage);
}, []);
```

### 7. 🔍 디버깅 팁

1. **콘솔 로그 확인**
   - iframe 내부: HTML 파일에 console.log 추가
   - iframe 외부: TSX 파일에 console.log 추가

2. **네트워크 탭 확인**
   - API 호출이 올바른 경로로 가는지 확인
   - 응답 상태 코드 확인

3. **소스 탭 활용**
   - 실제 로드된 파일 확인
   - 중단점 설정으로 코드 흐름 추적

---

## 📌 기억하세요!
**"수정할 내용이 보이는 곳을 수정하세요"**
- 화면에 보이는 텍스트/디자인 → HTML 파일
- 페이지 라우팅/메타데이터 → TSX 파일
- API 처리 → /pages/api 폴더
