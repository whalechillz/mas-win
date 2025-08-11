# 채널 선택 기능 구현 가이드

## 🎯 개선된 기능

### 기존 문제점
- 무조건 17개 콘텐츠 생성 (모든 채널)
- 불필요한 채널도 포함
- 채널별 개수 조절 불가

### 새로운 기능
- ✅ 채널 선택 가능
- ✅ 선택한 채널만 콘텐츠 생성
- ✅ 채널별 생성 개수 표시
- ✅ 실시간 예상 개수 계산

## 📊 채널별 콘텐츠 개수

### 템플릿 모드 (무료)
| 채널 | 개수 | 담당자 |
|------|------|--------|
| 네이버 블로그 | 3개 | 제이 |
| 카카오톡 | 4개 | 스테피/나과장 |
| SMS/LMS | 2개 | 허상원 |
| 인스타그램 | 3개 | 스테피/제이 |
| 유튜브 | 1개 | 허상원 |
| **총합** | **13개** | - |

### AI 모드 (유료)
| 플랜 | 블로그 | 카카오톡 | SMS | 인스타 | 유튜브 |
|------|--------|----------|-----|--------|--------|
| 베이직 | 2개 | 3개 | 2개 | 2개 | 1개 |
| 스탠다드 | 3개 | 4개 | 3개 | 3개 | 1개 |
| 프리미엄 | 5개 | 6개 | 4개 | 5개 | 2개 |

## 🔧 사용 방법

### 1. SQL 함수 업데이트
```bash
# 선택적 생성 함수 추가
psql $DATABASE_URL -f database/generate-monthly-content-selective.sql
```

### 2. UI 컴포넌트 추가
```javascript
// IntegratedCampaignManager.tsx에 추가
import { ChannelSelectionSettings } from './ChannelSelectionSettings';

// 상태 추가
const [selectedChannels, setSelectedChannels] = useState({
  blog: true,
  kakao: true,
  sms: false,
  instagram: false,
  youtube: false
});

// UI에 추가
<ChannelSelectionSettings 
  onChannelChange={setSelectedChannels}
/>
```

### 3. API 호출 수정
```javascript
// 멀티채널 생성 시
const response = await fetch('/api/generate-multichannel-content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    year: selectedYear,
    month: selectedMonth,
    theme: currentTheme,
    aiSettings: aiSettings,
    selectedChannels: selectedChannels // 추가
  })
});
```

## 💡 사용 시나리오

### 시나리오 1: 블로그와 카카오톡만 필요
```javascript
선택: {
  blog: true,      // 3개
  kakao: true,     // 4개
  sms: false,
  instagram: false,
  youtube: false
}
결과: 7개 콘텐츠만 생성
```

### 시나리오 2: SNS 중심 마케팅
```javascript
선택: {
  blog: false,
  kakao: true,     // 4개
  sms: false,
  instagram: true, // 3개
  youtube: true    // 1개
}
결과: 8개 콘텐츠 생성
```

### 시나리오 3: 풀 패키지
```javascript
선택: 모든 채널 선택
결과: 13개 콘텐츠 생성 (템플릿)
     22개 콘텐츠 생성 (AI 프리미엄)
```

## 🎨 UI 미리보기

```
┌─────────────────────────────────────┐
│ 📢 채널 선택 (3개 선택됨)           │
├─────────────────────────────────────┤
│ ☑️ 네이버 블로그    ☑️ 카카오톡    │
│    SEO 긴 글           마케팅 메시지 │
│    3개                 4개           │
│                                     │
│ ☐ SMS/LMS          ☐ 인스타그램   │
│    문자 메시지         이미지 포스트 │
│    2개                 3개           │
│                                     │
│ ☐ 유튜브                           │
│    영상 기획안                      │
│    1개                              │
├─────────────────────────────────────┤
│ 예상 생성: 템플릿 7개 / AI ~10개    │
└─────────────────────────────────────┘
```

## ✅ 장점

1. **효율성**: 필요한 채널만 선택
2. **비용 절감**: AI 모드에서 불필요한 생성 방지
3. **유연성**: 캠페인별로 다른 채널 조합 가능
4. **투명성**: 생성될 개수 미리 확인

## 📝 추가 개선 아이디어

1. **채널별 우선순위 설정**
   - 중요도에 따라 생성 개수 조절

2. **템플릿 커스터마이징**
   - 채널별 템플릿 수정 가능

3. **일정 분산**
   - 채널별로 다른 일정 설정

4. **성과 기반 추천**
   - 과거 성과 기반 채널 추천

이제 필요한 채널만 선택해서 효율적으로 콘텐츠를 생성할 수 있습니다! 🚀
