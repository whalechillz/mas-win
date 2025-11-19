# 갤러리 업스케일링 및 이미지 변형 기능 개선 계획

## 📋 개요

갤러리 관리 시스템에 AI 기반 이미지 업스케일링 및 이미지 변형 기능을 추가하여, 사용자가 저해상도 이미지를 고해상도로 변환하거나 이미지를 변형할 수 있도록 합니다.

---

## 🎯 목표

1. **업스케일링 기능**: 저해상도 이미지(300px 이하)를 고해상도(2000px 이상)로 변환
2. **이미지 변형 기능**: 블로그의 "기존 이미지 변형" 기능을 갤러리에 통합
3. **사용자 선택 옵션**: 자동 처리 대신 사용자가 필요에 따라 선택할 수 있도록 버튼 제공
4. **EXIF 데이터 유지**: 업스케일링/변형 과정에서 원본 EXIF 메타데이터 보존
5. **구글 지도 연동**: EXIF GPS 정보를 활용한 촬영 위치 표시

---

## 🔍 추천 업스케일링 모델

### 1. FAL AI 기반 업스케일링 (1순위 추천)

**이유:**
- 현재 블로그에서 성공적으로 사용 중인 FAL AI와 동일한 플랫폼
- API 키 및 인프라 재사용 가능
- 빠른 응답 속도 및 안정성 검증됨

**추천 모델:**
- `fal-ai/imageutils` (이미지 유틸리티, 업스케일링 포함)
- `fal-ai/real-esrgan` (Real-ESRGAN 기반 업스케일링)
- `fal-ai/flux` (현재 사용 중인 모델, 변형 기능에 활용)

**장점:**
- ✅ 기존 FAL AI 인프라 재사용
- ✅ 빠른 응답 속도
- ✅ 안정성 검증됨
- ✅ 비용 효율적

**단점:**
- ⚠️ FAL AI의 업스케일링 모델 정확한 엔드포인트 확인 필요

---

### 2. Replicate 기반 업스케일링 (2순위 추천)

**이유:**
- 현재 블로그에서 사용 중인 Replicate와 동일한 플랫폼
- 다양한 업스케일링 모델 제공

**추천 모델:**
- `nightmareai/real-esrgan` (Real-ESRGAN 기반, 고품질)
- `stability-ai/stable-diffusion-x4-upscaler` (Stable Diffusion 기반)
- `black-forest-labs/flux-dev` (현재 사용 중인 모델, 변형 기능에 활용)

**장점:**
- ✅ 기존 Replicate 인프라 재사용
- ✅ 다양한 모델 선택 가능
- ✅ 고품질 업스케일링

**단점:**
- ⚠️ 응답 속도가 FAL AI보다 느릴 수 있음
- ⚠️ 비용이 FAL AI보다 높을 수 있음

---

### 3. 기타 업스케일링 도구 (참고용)

**웹 검색 결과 기반 추천:**
- **Real-ESRGAN**: 오픈소스, 고품질 업스케일링
- **Waifu2x**: 애니메이션/일러스트 특화
- **Topaz Gigapixel AI**: 상업용, 최대 6배 확대

**단점:**
- ⚠️ API 제공 여부 불확실
- ⚠️ 기존 인프라와 통합 어려움

---

## 📊 최종 추천: FAL AI 기반 업스케일링

**선택 이유:**
1. ✅ 기존 FAL AI 인프라 재사용 가능
2. ✅ 빠른 응답 속도 및 안정성 검증
3. ✅ 비용 효율적
4. ✅ 블로그에서 이미 사용 중인 플랫폼

**구현 방법:**
- FAL AI의 업스케일링 모델 엔드포인트 확인 후 API 통합
- 기존 `vary-existing-image.js`와 유사한 구조로 구현

---

## 🚀 최종 개선 계획

### Phase 1: 업스케일링 API 생성

#### 1-1. `/api/admin/upscale-image.js` (신규)

**목적**: FAL AI 또는 Replicate를 사용한 이미지 업스케일링

**기능:**
- 원본 이미지 URL 입력
- AI 업스케일링 모델 호출
- 업스케일된 이미지를 Supabase에 저장
- EXIF 메타데이터 보존

**API 구조:**
```javascript
POST /api/admin/upscale-image
{
  "imageUrl": "https://...",
  "model": "fal" | "replicate", // 기본값: "fal"
  "scale": 2 | 4, // 업스케일 배율 (기본값: 2)
  "preserveExif": true // EXIF 보존 여부 (기본값: true)
}
```

**응답:**
```javascript
{
  "success": true,
  "imageUrl": "https://...", // 업스케일된 이미지 URL
  "originalUrl": "https://...", // 원본 이미지 URL
  "scale": 2,
  "width": 4000,
  "height": 3000,
  "metadata": {
    "preserved": true,
    "gps": { "lat": 37.2808, "lng": 127.0498 }
  }
}
```

---

### Phase 2: 갤러리 이미지 상세 모달에 버튼 추가

#### 2-1. `pages/admin/gallery.tsx` 수정

**추가할 버튼:**
1. **"🔄 기존 이미지 변형"** 버튼
   - 블로그의 "기존 이미지 변형" 기능 재사용
   - `/api/vary-existing-image` 호출
   - 기존 이미지 변형 모달 열기

2. **"⬆️ 업스케일"** 버튼
   - `/api/admin/upscale-image` 호출
   - 업스케일링 진행 상태 표시
   - 완료 후 업스케일된 이미지로 교체

**위치:**
- 갤러리 이미지 상세 모달 헤더의 액션 버튼 영역
- 기존 "📝 편집", "🔗 복사", "⬇️ 저장", "🗑️ 삭제" 버튼 옆에 추가

**UI 구조:**
```typescript
<div className="flex items-center gap-2">
  {/* 기존 버튼들 */}
  <button onClick={handleEdit}>📝 편집</button>
  <button onClick={handleCopy}>🔗 복사</button>
  <button onClick={handleDownload}>⬇️ 저장</button>
  <button onClick={handleDelete}>🗑️ 삭제</button>
  
  {/* 새로 추가할 버튼들 */}
  <button onClick={handleVaryImage}>🔄 기존 이미지 변형</button>
  <button onClick={handleUpscaleImage}>⬆️ 업스케일</button>
  
  <button onClick={handleClose}>✕</button>
</div>
```

---

### Phase 3: 기존 이미지 변형 모달 통합

#### 3-1. 블로그의 "기존 이미지 변형" 모달 재사용

**기존 코드:**
- `pages/admin/blog.tsx`의 "기존 이미지 변형" 모달
- `/api/vary-existing-image` API 사용

**갤러리에 통합:**
- 동일한 모달 컴포넌트를 갤러리 페이지에 추가
- 이미지 선택 로직을 갤러리 이미지 목록에 맞게 수정

**기능:**
- 파일 업로드
- 갤러리에서 이미지 선택
- URL 입력
- 프롬프트 입력
- 프리셋 선택 (ultra_precise, precise, creative 등)

---

### Phase 4: EXIF 데이터 처리

#### 4-1. 업스케일링/변형 시 EXIF 보존

**구현 방법:**
1. 원본 이미지에서 EXIF 추출 (`/api/admin/extract-exif`)
2. 업스케일링/변형된 이미지에 EXIF 재주입
3. Supabase에 메타데이터 저장 (`/api/admin/upsert-image-metadata`)

**EXIF 보존 항목:**
- GPS 좌표 (lat, lng)
- 촬영 날짜/시간
- 카메라 정보
- 촬영 설정 (ISO, 셔터 속도, 조리개 등)

---

### Phase 5: 구글 지도 연동

#### 5-1. 이미지 상세 모달에 구글 지도 표시

**조건:**
- EXIF 데이터에 GPS 정보가 있는 경우에만 표시

**구현 방법:**
- `pages/contact.tsx`의 구글 지도 구현 참고
- Google Maps Embed API 사용
- GPS 좌표를 기반으로 지도 표시

**UI 위치:**
- 이미지 상세 모달 하단
- EXIF 정보 섹션 옆에 지도 표시

**구조:**
```typescript
{selectedImageForZoom?.gps_lat && selectedImageForZoom?.gps_lng && (
  <div className="mt-4">
    <h4 className="text-sm font-medium text-gray-700 mb-2">📍 촬영 위치</h4>
    <iframe
      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${selectedImageForZoom.gps_lat},${selectedImageForZoom.gps_lng}&zoom=17`}
      width="100%"
      height="300"
      style={{ border: 0 }}
      allowFullScreen
      loading="lazy"
    />
  </div>
)}
```

---

## 📝 변경 파일 목록

### 신규 파일
- `pages/api/admin/upscale-image.js` - 업스케일링 API
- `docs/gallery-upscale-improvement-plan.md` - 이 문서

### 수정 파일
- `pages/admin/gallery.tsx` - 이미지 상세 모달에 버튼 추가, 기존 이미지 변형 모달 통합, 구글 지도 표시
- `pages/api/admin/upsert-image-metadata.js` - EXIF 보존 로직 추가 (필요 시)
- `docs/project_plan.md` - 갤러리 업스케일링 기능 추가 내역 업데이트

---

## ⚠️ 주의 사항

1. **EXIF 데이터 보존**
   - 업스케일링/변형 과정에서 EXIF 데이터가 손실될 수 있음
   - 원본 이미지에서 EXIF를 추출하여 새 이미지에 재주입 필요

2. **API 비용**
   - FAL AI와 Replicate의 업스케일링 API 비용 확인 필요
   - 사용량 모니터링 및 제한 설정 고려

3. **이미지 품질**
   - 업스케일링 모델에 따라 품질 차이 발생 가능
   - 사용자에게 모델 선택 옵션 제공 고려

4. **처리 시간**
   - 업스케일링/변형은 시간이 걸릴 수 있음
   - 진행 상태 표시 및 비동기 처리 필요

---

## 🧪 테스트 계획

### 1. 업스케일링 API 테스트
- [ ] FAL AI 업스케일링 모델 엔드포인트 확인
- [ ] Replicate 업스케일링 모델 엔드포인트 확인
- [ ] API 호출 및 응답 테스트
- [ ] EXIF 데이터 보존 테스트

### 2. UI 테스트
- [ ] 갤러리 이미지 상세 모달 버튼 추가 확인
- [ ] "기존 이미지 변형" 모달 통합 확인
- [ ] 업스케일링 진행 상태 표시 확인
- [ ] 구글 지도 표시 확인

### 3. 통합 테스트
- [ ] 업스케일링 → EXIF 보존 → 구글 지도 표시 전체 플로우 테스트
- [ ] 이미지 변형 → EXIF 보존 → 구글 지도 표시 전체 플로우 테스트
- [ ] 에러 처리 테스트

---

## 🚀 다음 단계

1. ✅ 문서 작성 완료 (이 문서)
2. ⏳ FAL AI/Replicate 업스케일링 모델 엔드포인트 확인
3. ⏳ 업스케일링 API 생성 (`/api/admin/upscale-image.js`)
4. ⏳ 갤러리 이미지 상세 모달에 버튼 추가
5. ⏳ 기존 이미지 변형 모달 통합
6. ⏳ EXIF 데이터 보존 로직 구현
7. ⏳ 구글 지도 연동 구현
8. ⏳ 테스트 및 검증

---

## 📚 참고 문서

- `docs/project_plan.md` - 전체 프로젝트 계획
- `pages/api/vary-existing-image.js` - 기존 이미지 변형 API (참고)
- `pages/admin/blog.tsx` - 블로그의 "기존 이미지 변형" 모달 (참고)
- `pages/api/admin/extract-exif.js` - EXIF 추출 API (참고)
- `pages/contact.tsx` - 구글 지도 구현 예시 (참고)























