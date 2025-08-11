# Google Tag Manager 설정 가이드 - win.masgolf.co.kr

## 📊 계정 정보
- GTM Container ID: GTM-WPBX97JG
- GA4 Measurement ID: G-SMJWL2TRM7
- Google Ads ID: 확인 필요 (AW-XXXXXXXXX 형식이어야 함)

## 🎯 7월 퍼널 전환 추적 설정

### 1. GA4 기본 설정

#### 태그 1: GA4 구성
- **태그 유형**: Google Analytics: GA4 구성
- **측정 ID**: G-SMJWL2TRM7
- **태그 이름**: GA4 - Configuration
- **트리거**: All Pages

### 2. 전환 이벤트 설정

#### 태그 2: 전화번호 클릭
- **태그 유형**: Google Analytics: GA4 이벤트
- **구성 태그**: GA4 - Configuration
- **이벤트 이름**: phone_click
- **이벤트 매개변수**:
  - phone_number: {{dataLayer.phone_number}}
  - campaign_id: {{dataLayer.campaign_id}}
- **트리거**: 맞춤 이벤트 - phone_click

#### 태그 3: 퀴즈 완료
- **태그 유형**: Google Analytics: GA4 이벤트
- **구성 태그**: GA4 - Configuration
- **이벤트 이름**: quiz_complete
- **이벤트 매개변수**:
  - swing_style: {{dataLayer.swing_style}}
  - priority: {{dataLayer.priority}}
  - current_distance: {{dataLayer.current_distance}}
  - recommended_flex: {{dataLayer.recommended_flex}}
- **트리거**: 맞춤 이벤트 - quiz_complete

#### 태그 4: 시타 예약
- **태그 유형**: Google Analytics: GA4 이벤트
- **구성 태그**: GA4 - Configuration
- **이벤트 이름**: booking_submit
- **이벤트 매개변수**:
  - club_interest: {{dataLayer.club_interest}}
  - booking_date: {{dataLayer.booking_date}}
  - swing_style: {{dataLayer.swing_style}}
- **트리거**: 맞춤 이벤트 - booking_submit

#### 태그 5: 문의 접수
- **태그 유형**: Google Analytics: GA4 이벤트
- **구성 태그**: GA4 - Configuration
- **이벤트 이름**: contact_submit
- **이벤트 매개변수**:
  - call_times: {{dataLayer.call_times}}
  - swing_style: {{dataLayer.swing_style}}
- **트리거**: 맞춤 이벤트 - contact_submit

### 3. 참여도 추적

#### 태그 6: 스크롤 깊이
- **태그 유형**: Google Analytics: GA4 이벤트
- **구성 태그**: GA4 - Configuration
- **이벤트 이름**: scroll
- **이벤트 매개변수**:
  - percent_scrolled: {{dataLayer.scroll_percentage}}
- **트리거**: 맞춤 이벤트 - scroll_depth

#### 태그 7: 비거리 비교
- **태그 유형**: Google Analytics: GA4 이벤트
- **구성 태그**: GA4 - Configuration
- **이벤트 이름**: distance_comparison
- **이벤트 매개변수**:
  - user_distance: {{dataLayer.user_distance}}
  - mas_distance: {{dataLayer.mas_distance}}
  - distance_increase: {{dataLayer.distance_increase}}
- **트리거**: 맞춤 이벤트 - distance_comparison

### 4. 변수 설정

GTM에서 다음 데이터 영역 변수를 생성하세요:

1. **dataLayer.phone_number**
2. **dataLayer.campaign_id**
3. **dataLayer.swing_style**
4. **dataLayer.priority**
5. **dataLayer.current_distance**
6. **dataLayer.recommended_flex**
7. **dataLayer.club_interest**
8. **dataLayer.booking_date**
9. **dataLayer.call_times**
10. **dataLayer.scroll_percentage**
11. **dataLayer.user_distance**
12. **dataLayer.mas_distance**
13. **dataLayer.distance_increase**

### 5. 트리거 생성

각 이벤트에 대한 맞춤 이벤트 트리거 생성:

1. **phone_click** - 이벤트 이름이 phone_click과 같음
2. **quiz_complete** - 이벤트 이름이 quiz_complete와 같음
3. **booking_submit** - 이벤트 이름이 booking_submit과 같음
4. **contact_submit** - 이벤트 이름이 contact_submit과 같음
5. **scroll_depth** - 이벤트 이름이 scroll_depth와 같음
6. **distance_comparison** - 이벤트 이름이 distance_comparison과 같음

### 6. Google Ads 전환 추적 (선택사항)

Google Ads ID를 확인한 후 설정하세요:

#### 태그: Google Ads 전환 추적
- **태그 유형**: Google Ads 전환 추적
- **전환 ID**: AW-XXXXXXXXX (실제 ID로 변경)
- **전환 라벨**: 각 전환 액션별로 Google Ads에서 생성한 라벨
- **전환 가치**: 전환별 설정 (예: 전화상담 1.0, 시타예약 0.9)
- **트리거**: 해당 전환 이벤트

### 7. 테스트 및 검증

1. GTM 미리보기 모드 활성화
2. win.masgolf.co.kr/funnel-2025-07 페이지 방문
3. 각 액션 수행하며 dataLayer 이벤트 확인:
   - 전화번호 클릭
   - 퀴즈 완료
   - 시타 예약 폼 제출
   - 문의 폼 제출
   - 페이지 스크롤
4. GA4 실시간 보고서에서 이벤트 확인

### 8. GA4에서 전환 설정

GA4 관리 > 이벤트 > 전환으로 표시:
- phone_click
- booking_submit
- contact_submit
- quiz_complete

### 9. 맞춤 측정기준 생성 (선택사항)

GA4 관리 > 맞춤 정의 > 맞춤 측정기준:
- swing_style (텍스트)
- current_distance (숫자)
- recommended_flex (텍스트)
- club_interest (텍스트)

## 📈 성과 측정

### 주요 KPI
1. **전환율**: 방문자 대비 전화/예약/문의 비율
2. **퀴즈 완료율**: 퀴즈 시작 대비 완료 비율
3. **평균 스크롤 깊이**: 페이지 참여도 측정
4. **비거리 비교 참여율**: 기능 활용도 측정

### 보고서 설정
1. GA4 탐색 보고서에서 퍼널 분석 생성
2. 전환 경로: 페이지뷰 → 퀴즈 시작 → 퀴즈 완료 → 전환
3. 세그먼트: 스윙 스타일별, 비거리별 분석

## 🚀 배포 체크리스트

- [ ] .env.local에 GTM, GA4 ID 설정
- [ ] add-gtm-tracking.sh 실행
- [ ] GTM에서 모든 태그, 트리거, 변수 생성
- [ ] 미리보기 모드에서 테스트
- [ ] GA4 실시간 보고서 확인
- [ ] GTM 버전 게시
- [ ] 프로덕션 배포: `vercel --prod`

## ⚠️ 주의사항

1. **개인정보 보호**: 전화번호는 해시 처리하거나 마지막 4자리만 전송
2. **중복 추적 방지**: prevent-duplicate.js가 정상 작동하는지 확인
3. **성능 최적화**: GTM 태그는 비동기로 로드되므로 페이지 속도에 영향 최소화

## 📞 문의

설정 중 문제 발생 시:
- GTM 설정: Google 지원팀
- 사이트 문제: MASLABS 개발팀
