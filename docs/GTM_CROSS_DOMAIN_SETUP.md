# GTM 교차 도메인 설정 단계별 가이드

## 1️⃣ 태그로 이동
좌측 메뉴 → "태그" 클릭

## 2️⃣ GA4 구성 태그 생성/수정

### 새 태그 만들기
1. "새로 만들기" 클릭
2. 태그 이름: "GA4 구성 - MASGOLF 통합"

### 태그 구성
1. **태그 유형**: Google 애널리틱스: GA4 구성
2. **측정 ID**: G-SMJWL2TRM7

### 구성 매개변수 추가 (중요!)
"구성 매개변수" 섹션에서 "+ 행 추가" 클릭:

| 매개변수 이름 | 값 |
|--------------|-----|
| cookie_domain | auto |
| linker | (아래 JSON 입력) |

**linker 값 (복사해서 사용):**
```json
{
  "domains": [
    "win.masgolf.co.kr",
    "www.masgolf.co.kr",
    "masgolf.co.kr"
  ]
}
```

### 트리거 설정
- 트리거: "All Pages - 모든 페이지"

## 3️⃣ 저장 및 제출
1. "저장" 클릭
2. 우측 상단 "제출" 클릭
3. 버전 이름: "교차 도메인 추적 설정"
4. "게시" 클릭

## 4️⃣ 테스트
1. "미리보기" 모드 실행
2. 각 도메인 방문하여 확인
3. URL에 _gl 매개변수 자동 추가 확인
