# 카카오 콘텐츠 생성 시스템 분석 및 개선

## 📋 현재 상황 분석 (2025-11-16)

### 1. 텍스트 방지 개선 (적절한 수준)

#### 현재 상태
- `generate-prompt.js` 79-80줄: "No text overlays, no watermarks" (약함)
- FAL AI 호출 시 `negative_prompt` 없음
- 생성된 이미지에 한국어 텍스트가 포함되는 문제 발생

#### 적용된 개선
- ✅ 프롬프트 생성 시: "ABSOLUTELY NO text, words, or written content in the image" 추가
- ✅ FAL AI 호출 시: `negative_prompt: "text, words, letters, korean text, chinese text, english text, watermark, caption, subtitle, written content"` 추가
- ⚠️ 오바하지 않음: 과도한 강조 없이 적절한 수준으로만 개선

---

### 2. Base Prompt (요일별 템플릿) 현황

#### 현재 상태
- ❌ `generate-base-prompt.js`: 비어있음 (구현 안됨)
- ❌ `lib/kakao-base-prompt-templates.js`: 비어있음
- ❌ UI에서 항상 "basePrompt 없음" 표시
- ❌ API 호출 시 405 에러 발생

#### 원래 의도된 워크플로우
```
요일별 템플릿 선택
  ↓
basePrompt 생성/선택
  ↓
generate-prompt (상세 프롬프트 생성)
  ↓
generate-images (이미지 생성)
```

#### 현재 실제 워크플로우
```
'절경 골프장 배경' (고정값)
  ↓
generate-prompt (상세 프롬프트 생성)
  ↓
generate-images (이미지 생성)
```

**문제점:**
- basePrompt가 항상 비어있어서 요일별 템플릿 시스템이 작동하지 않음
- 모든 날짜에 같은 기본 프롬프트 사용
- 베리에이션 없음

#### 적용된 개선
- ✅ `auto-create-account1.js`: `background_base_prompt` 우선 사용
- ✅ `auto-create-account2.js`: `background_base_prompt` 우선 사용
- ✅ 프로필/피드도 `base_prompt` 우선 사용
- ⚠️ **고도화는 추후**: 요일별 템플릿 시스템은 나중에 구현

---

### 3. 베리에이션 문제

#### 문제점
- 20일 이후 모두 같은 배경/프로필/피드 생성
- basePrompt가 없어서 날짜별 차이 없음
- `seed: null`로 설정되어 있어서 프롬프트가 같으면 유사한 이미지

#### 원인 분석
1. **basePrompt 미사용**
   - `auto-create-account1.js` 98줄: `'절경 골프장 배경'` 고정값
   - `auto-create-account2.js` 98줄: `'하이테크 매장'` 고정값
   - `background_base_prompt`는 DB에 저장되지만 사용되지 않음

2. **베리에이션 로직 부재**
   - 날짜별로 다른 프롬프트 생성하지 않음
   - 요일별 템플릿 시스템 미구현
   - 주차별 테마만 반영 (weeklyTheme)

#### 적용된 개선
- ✅ basePrompt 우선 사용 로직 추가
  - 배경: `background_base_prompt` → `background_prompt` → `background_image` → 기본값
  - 프로필: `profile_base_prompt` → `profile_prompt` → `profile_image` → 기본값
  - 피드: `base_prompt` → `image_prompt` → `image_category` → 기본값

#### 향후 개선 방안 (고도화)
1. **요일별 템플릿 시스템 구현**
   - `lib/kakao-base-prompt-templates.js`에 요일별 템플릿 정의
   - `generate-base-prompt.js` API 구현
   - 날짜의 요일 자동 계산하여 템플릿 선택

2. **날짜 기반 변형 요소 추가**
   - 날짜별로 다른 시드값 사용
   - 월 초/중/말에 따른 분위기 차이
   - 요일별 테마 차이

3. **베리에이션 강화**
   - 주차별 테마와 요일별 템플릿 조합
   - 계정별 페르소나 반영
   - 이미지 카테고리 로테이션

---

### 4. 현재 워크플로우

#### 이미지 생성 워크플로우
```
1. basePrompt (요일별 템플릿) - 현재 비어있음
   ↓
2. generate-prompt API
   - basePrompt → 상세 프롬프트 생성
   - weeklyTheme 반영
   - accountType, type 반영
   ↓
3. generate-images API
   - 상세 프롬프트 → 이미지 생성
   - negative_prompt로 텍스트 방지
   - Supabase 저장
```

#### 메시지 생성 워크플로우
```
1. generate-prompt-message API
   - 브랜드 전략 기반
   - 계정별 톤 반영
   - 주간 테마 반영
   ↓
2. 프로필 메시지 저장
```

#### 피드 캡션 생성 워크플로우
```
1. generate-feed-caption API
   - 이미지 카테고리 기반
   - 날짜 변형 힌트 (요일별, 월 초/중/말)
   - 최근 캡션 중복 체크
   ↓
2. 피드 캡션 저장
```

---

### 5. 베리에이션이 작동하는 조건

#### 현재 베리에이션 요소
1. ✅ **basePrompt 사용** (수정 완료)
   - DB에 저장된 `background_base_prompt`, `profile_base_prompt`, `base_prompt` 사용
   - basePrompt가 있으면 날짜별로 다른 이미지 생성 가능

2. ✅ **weeklyTheme** (주차별 테마)
   - 주차별로 다른 테마 반영
   - `auto-create-account1.js` 73-93줄에서 자동 감지

3. ✅ **날짜 변형 힌트** (피드 캡션만)
   - `generate-feed-caption.js`의 `getDateVariationHint` 함수
   - 요일별, 월 초/중/말 힌트

#### 베리에이션이 작동하지 않는 이유
- basePrompt가 항상 비어있음
- 모든 날짜에 같은 기본 프롬프트 사용
- 결과: 20일 이후 모두 같은 이미지

#### 해결 방법
1. **즉시 해결** (적용 완료)
   - basePrompt 우선 사용 로직 추가
   - basePrompt가 있으면 사용, 없으면 기존 로직

2. **향후 고도화**
   - 요일별 템플릿 시스템 구현
   - 날짜별 자동 basePrompt 생성
   - 베리에이션 강화

---

### 6. 확인 사항

#### Base Prompt가 비어있는 이유
- `generate-base-prompt.js` API가 구현되지 않음
- 요일별 템플릿 파일이 비어있음
- UI에서 "요일별 자동 생성" 버튼 클릭 시 405 에러

#### Base Prompt를 수동으로 설정하면?
- ✅ 베리에이션 작동 (수정 완료)
- basePrompt가 있으면 날짜별로 다른 이미지 생성 가능
- 하지만 수동 설정이 필요함

#### 자동 베리에이션을 위해서는?
- 요일별 템플릿 시스템 구현 필요
- `generate-base-prompt.js` API 구현 필요
- `kakao-base-prompt-templates.js`에 템플릿 정의 필요

---

## 📝 요약

### 완료된 개선
1. ✅ 텍스트 방지: negative_prompt 추가 (적절한 수준)
2. ✅ 베리에이션: basePrompt 우선 사용 로직 추가
3. ✅ 프롬프트 생성: 텍스트 방지 지시 강화

### 현재 상태
- Base Prompt 시스템: 미구현 (고도화 추후)
- 베리에이션: basePrompt가 있으면 작동, 없으면 기본값 사용
- 텍스트 방지: negative_prompt로 개선

### 향후 개선 필요
- 요일별 템플릿 시스템 구현
- 자동 basePrompt 생성
- 베리에이션 강화







