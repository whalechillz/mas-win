# AI 이미지 생성 최종 개선 계획

## 현재 상태 확인

✅ **작동 중인 기능:**
- ChatGPT 프롬프트 최적화 (`useChatGPT: true` 시 작동)
- 프리셋 선택 및 자동 설정 (14개 프리셋: 7장면 × 2톤)
- 브랜딩 톤 선택 (시니어/하이테크)
- 제품 합성 기능
- 고급 설정 토글

❌ **개선 필요 사항:**
1. 파일명에 scene 번호 미포함
2. 장소 선택 기능 없음
3. 시니어/하이테크 톤 색감 강화 필요
4. sceneStep이 API에 전달되지 않음

---

## 개선 계획

### 1. 파일명에 scene 번호 추가

**현재 파일명:**
```
ai-generated-senior-emotional-feed-1766523145858-1-1.jpg
```

**개선 후 파일명:**
```
ai-generated-senior-emotional-scene3-feed-1766523145858-1-1.jpg
```

**수정 위치:**
- `pages/admin/ai-image-generator.tsx`: 프리셋 선택 시 `sceneStep`을 `formData`에 저장
- `pages/admin/ai-image-generator.tsx:421`: API 호출 시 `metadata.sceneStep` 전달
- `pages/api/kakao-content/generate-images.js:240`: 파일명에 `scene${sceneStep}` 추가

---

### 2. 장소 선택 기능 추가

**원래 프리셋 2개의 목적:**
- **피팅 이미지 생성**: 골프피터가 스윙스피드 상담하는곳의 장소 배경 (피팅 스튜디오)
- **히어로 섹션 이미지 생성**: 고급스런 피팅 스튜디오 배경 (사람 없이, 가로형 배경)

**장소 옵션 (8개 - 스토리 구조 최적 매칭):**

**스토리 구조별 기본 장소 매칭 전략:**
- **장면1 (행복한 주인공)**: 골프장 코스 또는 티샷 장소 → 성공의 시작, 밝은 분위기
- **장면2 (행복+불안 전조)**: 골프 클럽하우스 라운지 → 동료와 대화, 일상적 분위기
- **장면3 (문제 발생)**: 골프 연습장 그린 → 고민, 집중, 문제 해결 시도
- **장면4 (가이드 만남)**: 피팅 스튜디오 → 전문가 상담, 해결책 제시
- **장면5 (가이드 장소)**: 피팅 스튜디오 (사람 없음) → 해결책의 장소, 배경 이미지
- **장면6 (성공 회복)**: 골프장 코스 또는 티샷 장소 → 성공의 확인, 밝은 분위기
- **장면7 (여운 정적)**: 골프 클럽하우스 라운지 또는 피팅 스튜디오 → 정적 화면, 여운

**장소 옵션 상세:**

1. **피팅 스튜디오** - `premium golf fitting studio with swing analysis equipment` 
   - 기본값: 장면4(가이드 만남), 장면5(가이드 장소), 장면7(여운 정적)
   - 프롬프트: "premium golf fitting studio with swing analysis equipment, professional fitting room, MASSGOO branding visible"
   
2. **골프장 코스** - `golf course fairway with green grass and trees, blue sky, natural outdoor lighting`
   - 기본값: 장면1(행복한 주인공), 장면6(성공 회복)
   - 프롬프트: "golf course fairway with lush green grass, trees in background, blue sky with white clouds, natural outdoor lighting, professional golf course setting"
   
3. **골프장 티샷 장소** - `golf course tee box area with tee markers, professional golf course setting`
   - 기본값: 장면1(행복한 주인공), 장면6(성공 회복)
   - 프롬프트: "golf course tee box area with tee markers, professional golf course setting, tee markers visible, golf course background"
   
4. **골프 클럽하우스 라운지** - `golf clubhouse lounge with elegant interior, trophy displays, comfortable seating`
   - 기본값: 장면2(행복+불안 전조), 장면7(여운 정적)
   - 프롬프트: "golf clubhouse lounge with elegant interior, trophy displays, comfortable seating, sophisticated atmosphere, warm lighting, MASSGOO branding visible"
   
5. **골프 연습장 그린** - `golf practice putting green with flag, professional practice facility`
   - 기본값: 장면3(문제 발생)
   - 프롬프트: "golf practice putting green with flag, professional practice facility, putting green surface, practice area, focused atmosphere"
   
6. **인도어 드라이버 연습장** - `indoor driving range practice facility with hitting bays and targets`
   - 프롬프트: "indoor driving range practice facility with hitting bays and targets, practice range setting, indoor golf practice area"
   
7. **실내 스포츠 센터** - `indoor sports center practice area with modern facilities`
   - 프롬프트: "indoor sports center practice area with modern facilities, contemporary sports facility, clean modern interior"
   
8. **실내 스크린 골프장** - `indoor screen golf simulator room with large projection screen and golf course simulation`
   - 프롬프트: "indoor screen golf simulator room with large projection screen displaying golf course simulation, modern simulator technology, immersive golf experience"

**UI 구조:**
```
[프리셋 선택 섹션]
[✓ 프리셋 적용됨 박스]
[장소 선택 섹션] ← 새로 추가
  - 라디오 버튼 또는 카드 형태
  - 기본값: 프리셋의 기본 장소
  - 선택 시 프롬프트에 동적으로 추가
```

**수정 위치:**
- `pages/admin/ai-image-generator.tsx`: 
  - `formData`에 `selectedLocation` 추가
  - 장소 선택 UI 컴포넌트 추가 (프리셋 섹션 아래)
  - `handleGenerate`에서 선택한 장소를 프롬프트에 추가

---

### 3. 시니어/하이테크 톤 색감 강화

**현재 프롬프트:**
- 시니어: `warm gold tones, soft lighting`
- 하이테크: `cool blue-gray tones, modern lighting`

**강화 후 프롬프트:**
- **시니어:**
  ```
  warm golden lighting, gold-tinted atmosphere, warm color palette, 
  soft golden glow, golden hour lighting, warm amber tones, 
  luxurious gold accents, warm and inviting color scheme
  ```

- **하이테크:**
  ```
  cool blue-gray tones, black accents, metallic surfaces, 
  LED lighting, modern tech aesthetic, sleek black finishes, 
  blue neon accents, contemporary industrial design
  ```

**수정 위치:**
- `pages/admin/ai-image-generator.tsx:84-97`: `brandToneGuides`의 `colorScheme` 강화
- `pages/admin/ai-image-generator.tsx:130-175`: `buildUniversalPrompt` 함수에서 색감 지시 강화

---

### 4. sceneStep을 API에 전달

**현재 상태:**
- 프리셋에 `sceneStep`이 정의되어 있음 (line 100-125)
- 하지만 API 호출 시 전달되지 않음 (line 421-430)

**개선:**
1. 프리셋 선택 시 `formData.sceneStep` 저장
2. API 호출 시 `metadata.sceneStep` 전달
3. 파일명 생성 시 `scene${sceneStep}` 포함

---

## 구현 순서 (수정됨)

### Phase 1: 파일명 개선 (즉시 적용)
1. `formData`에 `sceneStep?: number` 추가
2. 프리셋 선택 시 `sceneStep` 저장
3. API 호출 시 `metadata.sceneStep` 전달
4. `generate-images.js`에서 파일명에 `scene${sceneStep}` 추가

### Phase 2: 프리셋 UI 개선 - 시니어/하이테크 카드 분리 (40분)
1. 시니어 톤 카드 컴포넌트 생성 (7개 장면 버튼 포함)
2. 하이테크 톤 카드 컴포넌트 생성 (7개 장면 버튼 포함)
3. 토글 기능 구현 (카드 클릭 시 펼치기/접기)
4. 한 번에 하나의 카드만 펼치기 또는 둘 다 펼치기 옵션
5. 장면 버튼 클릭 시 프리셋 선택 로직 연결

### Phase 3: 장소 선택 기능 (30분)
1. `formData`에 `selectedLocation?: string` 추가
2. 장소 옵션 배열 정의 (8개: 스토리 구조 최적 매칭)
3. UI 컴포넌트 추가 (프리셋 섹션 아래)
4. 프리셋 선택 시 기본 장소 자동 설정 (스토리 구조 기반)
   - 장면1: 골프장 코스 또는 티샷 장소
   - 장면2: 골프 클럽하우스 라운지
   - 장면3: 골프 연습장 그린
   - 장면4: 피팅 스튜디오
   - 장면5: 피팅 스튜디오 (사람 없음)
   - 장면6: 골프장 코스 또는 티샷 장소
   - 장면7: 골프 클럽하우스 라운지 또는 피팅 스튜디오
5. `handleGenerate`에서 장소 프롬프트 추가

### Phase 4: 톤 색감 강화 (20분)
1. `brandToneGuides`의 `colorScheme` 강화
2. `buildUniversalPrompt`에서 색감 지시 추가

### Phase 5: 브랜딩 톤 작동 확인 및 UI 개선 (10분)
1. 프리셋 미선택 시 브랜딩 톤 작동 확인
2. "브랜딩 톤" 섹션에 안내 문구 추가
3. 베이스 이미지 모드 "새 이미지 생성" 시 브랜딩 톤 적용 확인

### Phase 6: 통합 테스트
1. 프리셋 UI 토글 작동 확인
2. 각 프리셋으로 이미지 생성 테스트
3. 파일명에 scene 번호 포함 확인
4. 장소 선택 기능 작동 확인 (스토리 구조 기반 기본값 확인)
5. 시니어/하이테크 색감 차이 확인
6. 프리셋 미선택 시 브랜딩 톤 작동 확인

---

## 예상 결과

### 파일명 예시:
```
ai-generated-senior-emotional-scene3-feed-1766523145858-1-1.jpg
ai-generated-high-tech-innovative-scene5-background-1766523145858-1-1.jpg
```

### 프롬프트 예시 (장면3 시니어 + 피팅 스튜디오):
```
골드 톤, 60대 한국인 골퍼가 스윙 데이터/클럽을 보며 깊이 고민하는 클로즈업, 
허리·어깨 통증과 비거리 문제를 암시, MASSGOO 브랜딩은 은은히.
[+ 선택한 장소: premium golf fitting studio with swing analysis equipment]
[+ 색감 강화: warm golden lighting, gold-tinted atmosphere, warm color palette]
```

---

### 5. 프리셋 UI 개선: 시니어/하이테크 카드 분리 + 토글 형식

**현재 구조:**
- 14개 프리셋이 모두 한 리스트에 표시됨
- 시니어/하이테크가 섞여 있어 선택이 불편함

**개선 후 구조:**
```
[스토리 기반 프리셋 (장면 1~7 × 시니어/하이테크)]

[시니어 톤 카드] ← 토글 가능
  └─ [장면1] [장면2] [장면3] [장면4] [장면5] [장면6] [장면7]
  
[하이테크 톤 카드] ← 토글 가능
  └─ [장면1] [장면2] [장면3] [장면4] [장면5] [장면6] [장면7]
```

**UI 디자인:**
- 각 톤별로 큰 카드 형태 (배경색으로 구분: 시니어=골드/옐로우, 하이테크=블랙/블루)
- 카드 헤더:
  - 왼쪽: "시니어 톤" / "하이테크 톤" 텍스트 + 아이콘
  - 오른쪽: 펼치기/접기 아이콘 (▼/▲)
- 카드 클릭 또는 헤더 클릭 시 펼쳐지고 접힘 (토글)
- 펼쳐진 상태에서 7개 장면 버튼이 그리드 형태로 표시
- 장면 버튼 클릭 시 프리셋 선택 및 자동 설정
- 기본 상태: 둘 다 접혀있음 (또는 하나만 펼쳐짐)
- 한 번에 둘 다 펼칠 수 있음 (사용자 선택)

**장점:**
- 시니어/하이테크 구분이 명확함
- 화면이 깔끔해짐 (14개가 모두 보이지 않음)
- 사용자가 원하는 톤만 펼쳐서 선택 가능

---

### 6. 브랜딩 톤 작동 확인 (프리셋 미선택 시)

**현재 상태 확인:**
- ✅ `formData.brandTone`은 기본값으로 'senior_emotional' 설정됨 (line 47)
- ✅ `handleGenerate` 함수에서 `formData.brandTone`을 사용함 (line 344, 349, 371, 406, 424)
- ✅ `buildUniversalPrompt` 함수가 `formData.brandTone`을 받아서 사용함 (line 371)
- ✅ 브랜딩 톤 라디오 버튼으로 사용자가 직접 변경 가능

**확인 사항:**
- 프리셋을 선택하지 않아도 브랜딩 톤은 작동함
- 베이스 이미지 모드 "새 이미지 생성" 시에도 브랜딩 톤이 적용됨
- `buildUniversalPrompt(userPrompt, formData.brandTone)` 호출 시 브랜딩 톤이 반영됨

**개선 필요 사항:**
- 프리셋을 선택하지 않았을 때도 브랜딩 톤이 명확히 적용되는지 UI에서 확인 가능하도록 표시
- "브랜딩 톤" 섹션에 "프리셋 미선택 시에도 적용됩니다" 안내 문구 추가

---

## 참고사항

- ChatGPT 최적화는 이미 작동 중이므로 수정 불필요
- 기존 제품 합성 기능은 그대로 유지
- 프리셋 구조는 변경하지 않음 (14개 유지, UI만 개선)
- 원래 2개 프리셋(피팅 이미지, 히어로 섹션)은 장면4, 장면5에 해당
- 브랜딩 톤은 프리셋 선택 여부와 관계없이 항상 작동함

---

## 손 표현 개선 기능 (2025-01-XX 구현 완료)

### 구현 내용

✅ **"손 표현 개선" 토글 추가**
- 위치: 고급 설정 섹션, "ChatGPT로 프롬프트 최적화" 토글 바로 아래
- 기능명: "손 표현 개선"
- 설명: "손이 어색하게 나올 때만 활성화 (손가락 개수, 비율, 자세 개선)"
- 기본값: 꺼짐 (false)
- localStorage 저장: 사용자 설정 유지

### 기술적 구현

1. **TypeScript 인터페이스**
   - `ImageGenerationRequest`에 `improveHandQuality?: boolean` 추가

2. **프롬프트 개선**
   - `buildUniversalPrompt` 함수에 `improveHandQuality` 파라미터 추가
   - 활성화 시 다음 스펙 자동 추가:
     - 5개 손가락, 올바른 비율, 자연스러운 손 구조
     - 손이 완전히 보이도록 (잘리지 않음)
     - 자연스러운 손 제스처
     - 물건을 잡을 때 자연스러운 그립

3. **Negative Prompt 개선**
   - `generate-images.js` API에서 `improveHandQuality` 확인
   - 활성화 시 다음 항목을 negative prompt에 추가:
     - deformed hands, malformed hands, extra fingers, missing fingers
     - too many fingers, too few fingers, fused fingers
     - wrong number of fingers, distorted hands, unnatural hands
     - bad hands, ugly hands, poorly drawn hands, mutated hands
     - extra limbs, missing limbs, bad anatomy, malformed anatomy, distorted anatomy

### 사용 방법

1. 고급 설정 토글 열기
2. "손 표현 개선" 토글 활성화
3. 이미지 생성 시 손 관련 문제가 있는 경우에만 사용
4. 설정은 localStorage에 자동 저장되어 다음에도 유지됨

### 참고사항

- **Quality Boost, Detail Enhancement**: 이미 8K 해상도와 photorealistic 설정 사용 중이므로 불필요
- **Anatomy Fix**: "손 표현 개선" 기능과 동일한 목적 (해부학적 문제 수정)
- 손이 정상적으로 나오는 경우에는 토글을 끄는 것이 권장됨 (불필요한 제약 방지)

---

## 7. PNG → WebP 변환 및 제품 합성 DB 입력 계획

### 7.1 현재 진행 상황

✅ **완료:**
- 마쓰구 화이트캡 DB 입력 완료

⏳ **진행 중:**
- 나머지 제품 DB 입력 (SQL 파일 준비 완료)

### 7.2 나머지 제품 입력 방법

**SQL 파일 위치:** `database/insert-goods-products.sql`

**입력할 제품 목록:**
1. ✅ 마쓰구 화이트캡 (이미 입력됨)
2. ⏳ 마쓰구 블랙캡
3. ⏳ MAS 한정판 모자(그레이)
4. ⏳ MAS 한정판 모자(블랙)
5. ⏳ MASSGOO × MUZIIK 프리미엄 클러치백 (베이지)
6. ⏳ MASSGOO × MUZIIK 프리미엄 클러치백 (그레이)
7. ⏳ 마쓰구 갈색 쇼핑백 (이미지 준비 후)

**실행 방법:**
1. Supabase Dashboard > SQL Editor 열기
2. `database/insert-goods-products.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기
4. "Run" 버튼 클릭
5. "Success" 메시지 확인

**주의사항:**
- `ON CONFLICT (slug) DO UPDATE` 구문으로 중복 입력 방지
- 이미 입력된 제품은 자동으로 업데이트됨
- 마쓰구 갈색 쇼핑백은 이미지 파일 준비 후 주석 해제하여 실행

### 7.3 이미지 파일 확인

**필요한 이미지 파일 (WebP 형식):**
- ✅ `massgoo-white-cap-front.webp` (있음)
- ✅ `massgoo-white-cap-side.webp` (있음)
- ⏳ `massgoo-black-cap-front.webp` (PNG → WebP 변환 필요)
- ⏳ `massgoo-black-cap-side.webp` (PNG → WebP 변환 필요)
- ⏳ `mas-limited-cap-gray-front.webp` (PNG → WebP 변환 필요)
- ⏳ `mas-limited-cap-gray-side.webp` (PNG → WebP 변환 필요)
- ⏳ `mas-limited-cap-black-front.webp` (PNG → WebP 변환 필요)
- ⏳ `mas-limited-cap-black-side.webp` (PNG → WebP 변환 필요)
- ⏳ `massgoo-muziik-clutch-beige-front.webp` (PNG → WebP 변환 필요)
- ⏳ `massgoo-muziik-clutch-beige-back.webp` (PNG → WebP 변환 필요)
- ⏳ `massgoo-muziik-clutch-gray-front.webp` (PNG → WebP 변환 필요)
- ⏳ `massgoo-muziik-clutch-gray-back.webp` (PNG → WebP 변환 필요)

**PNG → WebP 변환 스크립트:**
- 스크립트 위치: `scripts/convert-png-to-webp.js` (작성 필요)
- 실행 명령: `node scripts/convert-png-to-webp.js`

