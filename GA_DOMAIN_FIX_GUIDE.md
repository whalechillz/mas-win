# 🚨 Google Analytics 긴급 수정 가이드

## 문제 요약
1. **GA가 잘못된 도메인 추적**: `www.mas9golf.com` (이전 도메인)
2. **올바른 도메인**: `win.masgolf.co.kr` (현재 도메인)
3. **서비스 계정**: `masgolf-ga4-reader` (정상 설정됨)

## 📌 즉시 수정 방법

### Step 1: Google Analytics 4에서 도메인 변경

1. **GA4 접속**: https://analytics.google.com
2. **관리** (좌측 하단 톱니바퀴)
3. **속성** > **데이터 스트림**
4. 웹 스트림 클릭 (현재 `www.mas9golf.com`으로 표시됨)
5. **스트림 URL** 편집:
   ```
   변경 전: https://www.mas9golf.com
   변경 후: https://win.masgolf.co.kr
   ```
6. **저장**

### Step 2: Google Tag Manager에서 확인

1. **GTM 접속**: https://tagmanager.google.com
2. **컨테이너 선택**: GTM-WPBX97JG
3. **작업공간** > **태그**
4. **GA4 구성** 태그 찾기
5. 태그 설정에서 도메인 관련 설정 확인:
   - Configuration Parameter에 hostname 설정이 있다면 제거
   - 또는 win.masgolf.co.kr로 변경

### Step 3: GTM 트리거 확인

1. GTM에서 **트리거** 메뉴
2. 각 트리거 확인
3. 도메인 필터가 `mas9golf`로 설정된 것이 있다면:
   - `win.masgolf`로 변경
   - 또는 도메인 필터 제거

### Step 4: 실시간 확인

1. **GA4 실시간** 보고서 열기
2. 새 탭에서 `https://win.masgolf.co.kr` 접속
3. 실시간 데이터에 올바른 도메인이 표시되는지 확인

## 🔍 퍼널 페이지 확인

`/versions/funnel-2025-07-complete.html`은 올바른 퍼널 페이지입니다.
- 위치: `/public/versions/funnel-2025-07-complete.html`
- 이 페이지는 7월 캠페인용 특별 랜딩 페이지입니다.

## ⚠️ 주의사항

1. **데이터 지연**: 도메인 변경 후 최대 24시간까지 데이터 수집이 지연될 수 있습니다.
2. **이전 데이터**: mas9golf.com의 데이터는 별도로 보관됩니다.
3. **필터 재설정**: 도메인 변경 후 GA4의 필터나 세그먼트 재확인 필요

## 📊 변경 후 테스트

```bash
# 1. GTM 미리보기 모드
- GTM에서 '미리보기' 버튼 클릭
- URL: https://win.masgolf.co.kr 입력
- 태그 실행 확인

# 2. GA4 DebugView
- GA4 > 관리 > DebugView
- 실시간으로 이벤트 확인

# 3. 실시간 보고서
- GA4 > 보고서 > 실시간
- 올바른 도메인과 페이지 경로 확인
```

## 🚀 추가 권장사항

1. **Google Search Console**도 도메인 변경 필요
2. **Google Ads** 연결된 경우 도메인 업데이트
3. **UTM 파라미터** 사용 시 도메인 확인

---

이 가이드를 따라 수정하면 GA4가 올바른 도메인을 추적하게 됩니다!