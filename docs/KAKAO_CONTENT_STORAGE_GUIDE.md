# 카카오 콘텐츠 저장 가이드

## 📊 저장 구조 개요

### 1. 데일리 브랜딩 JSON 파일 (플랜 + 생성된 콘텐츠)

**위치**: `docs/content-calendar/YYYY-MM.json`

**역할**: 
- ✅ **플랜 파일**: 월별/주별/일별 계획 저장
- ✅ **생성된 콘텐츠 저장**: 이미지 URL, 메시지, 캡션 등 실제 생성된 콘텐츠 저장

**저장 내용**:
```json
{
  "profileContent": {
    "account1": {
      "dailySchedule": [
        {
          "date": "2025-11-12",
          "background": {
            "image": "해안 코스",           // 플랜: 계획된 이미지 설명
            "prompt": "해안 골프 코스...",  // 플랜: 이미지 프롬프트
            "imageUrl": "https://...",      // 생성된 콘텐츠: 실제 이미지 URL
            "status": "planned"             // 상태: planned → created
          },
          "profile": {
            "image": "시니어 골퍼",         // 플랜
            "prompt": "시니어 골퍼...",     // 플랜
            "imageUrl": "https://...",      // 생성된 콘텐츠
            "status": "planned"
          },
          "message": "스윙보다 마음이 먼저다.", // 생성된 콘텐츠
          "created": true,                 // 생성 완료 표시
          "createdAt": "2025-11-12T09:00:00.000Z" // 생성 시간
        }
      ]
    }
  },
  "kakaoFeed": {
    "dailySchedule": [
      {
        "date": "2025-11-12",
        "account1": {
          "imageCategory": "시니어 골퍼의 스윙", // 플랜
          "imagePrompt": "시니어 골퍼...",      // 플랜
          "caption": "오늘도 멋진 스윙으로...",  // 생성된 콘텐츠
          "imageUrl": "https://...",            // 생성된 콘텐츠
          "created": true,
          "createdAt": "2025-11-12T09:00:00.000Z"
        }
      }
    ]
  }
}
```

**특징**:
- 플랜(계획)과 생성된 콘텐츠를 함께 저장
- `created: true`로 생성 완료 여부 표시
- `imageUrl`이 있으면 실제 생성된 이미지

### 2. 데이터베이스 저장 (최종 배포용)

**API**: `/api/kakao-content/save`

**테이블**:
- `kakao_profile_content` (프로필 콘텐츠)
- `kakao_feed_content` (피드 콘텐츠)

**현재 상태**: 
- ⚠️ **자동 호출 미구현**: DB 저장 API는 준비되어 있지만 자동으로 호출되지 않음
- ✅ **수동 호출 가능**: 필요 시 API 직접 호출 가능

**저장 시점**:
- 현재: JSON 파일에만 저장
- 권장: 이미지 생성 완료 후 DB에도 자동 저장

## 🔄 현재 저장 흐름

### 현재 (JSON 파일만 저장)

```
1. 이미지 생성
   ↓
2. JSON 파일에 imageUrl 저장
   ↓
3. created: true 표시
   ↓
4. ❌ DB 저장 안 됨
```

### 권장 (JSON + DB 저장)

```
1. 이미지 생성
   ↓
2. JSON 파일에 imageUrl 저장
   ↓
3. DB에 최종 배포용 콘텐츠 저장
   ↓
4. created: true, published: false 표시
```

## 💾 최종 배포용 저장 구현

### 옵션 1: 자동 DB 저장 (권장)

이미지 생성 완료 시 자동으로 DB에도 저장:

```typescript
// pages/admin/kakao-content.tsx
const handleAccount1AutoCreate = async () => {
  // ... 이미지 생성 ...
  
  // JSON 파일 저장
  await fetch('/api/kakao-content/calendar-save', { ... });
  
  // DB 저장 (최종 배포용)
  await fetch('/api/kakao-content/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: todayStr,
      account: '010-6669-9000',
      type: 'profile',
      data: {
        background_image_url: todayData.account1Profile.background.imageUrl,
        profile_image_url: todayData.account1Profile.profile.imageUrl,
        message: todayData.account1Profile.message,
        status: 'created', // created → published
        created_at: new Date().toISOString()
      }
    })
  });
  
  // 피드도 저장
  await fetch('/api/kakao-content/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: todayStr,
      account: '010-6669-9000',
      type: 'feed',
      data: {
        image_url: todayData.todayFeed.account1.imageUrl,
        caption: todayData.todayFeed.account1.caption,
        status: 'created',
        created_at: new Date().toISOString()
      }
    })
  });
};
```

### 옵션 2: 배포 버튼 추가

"배포" 버튼을 추가하여 수동으로 DB 저장:

```typescript
const handlePublish = async (account: 'account1' | 'account2') => {
  // JSON에서 데이터 가져오기
  const profileData = todayData[`${account}Profile`];
  const feedData = todayData.todayFeed[account];
  
  // DB 저장
  await fetch('/api/kakao-content/save', { ... });
  
  // 상태 업데이트: published: true
};
```

## 📋 JSON 파일 vs DB 저장 비교

| 구분 | JSON 파일 | DB 저장 |
|------|----------|---------|
| **목적** | 플랜 + 생성된 콘텐츠 | 최종 배포용 콘텐츠 |
| **저장 위치** | `docs/content-calendar/YYYY-MM.json` | Supabase DB |
| **저장 시점** | 이미지 생성 시 자동 | ⚠️ 현재 미구현 |
| **용도** | 계획 수립, 생성 추적 | 실제 배포, 통계, 관리 |
| **조회** | 파일 읽기 | SQL 쿼리 |
| **상태** | `created: true` | `status: 'created'` → `'published'` |

## 🎯 권장 구조

### JSON 파일 (플랜 + 생성 추적)
- 월별/주별/일별 계획
- 생성된 이미지 URL
- 생성 상태 추적 (`created: true`)
- 메시지/캡션

### DB 저장 (최종 배포용)
- 실제 배포할 콘텐츠
- 배포 상태 (`created` → `published`)
- 배포 시간 기록
- 통계 및 분석용

## ✅ 구현 제안

1. **자동 DB 저장 추가**: 이미지 생성 완료 시 DB에도 자동 저장
2. **배포 상태 관리**: `created` → `published` 상태 전환
3. **배포 버튼 추가**: 수동 배포 기능 (Playwright 자동화 연동)


