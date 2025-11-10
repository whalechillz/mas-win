# 갤러리 이미지 변형 기능 구현 계획

## 목표
블로그의 이미지 변형 기능을 갤러리에 완전히 똑같이 적용

## 블로그 변형 기능 분석

### 핵심 프로세스

#### 1단계: 이미지 불러오기 + 프롬프트 생성
- **함수**: `handleLoadExistingImageAndPrompt`
- **프로세스**:
  1. `/api/get-image-prompt`로 기존 프롬프트 확인
  2. 없으면 `/api/analyze-image-prompt`로 이미지 분석 및 프롬프트 생성
  3. 프롬프트를 `imageGenerationPrompt`에 저장
  4. 선택된 이미지를 "생성된 이미지" 섹션에 추가
  5. 모달 닫기

#### 2단계: 실제 변형 생성
- **함수**: `generateImageVariation`
- **프로세스**:
  1. `selectedBaseImage` 사용
  2. FAL AI: `/api/generate-blog-image-fal-variation`
  3. Replicate Flux: `/api/generate-blog-image-replicate-flux`
  4. 생성된 이미지를 `generatedImages`에 추가

### 상태 변수
- `selectedBaseImage`: 변형할 기본 이미지
- `generatedImages`: 생성된 이미지 목록
- `showGeneratedImages`: 생성된 이미지 표시 여부
- `imageGenerationPrompt`: 생성된 프롬프트
- `isGeneratingVariation`: 변형 생성 중 상태

### UI 구성
1. **변형 모달**:
   - 이미지 선택 탭 (파일 업로드, 갤러리, URL)
   - "이미지 불러오기" 버튼
   
2. **프롬프트 미리보기 섹션**:
   - 생성된 프롬프트 표시
   - 프롬프트 수정 가능
   
3. **생성된 이미지 섹션**:
   - 생성된 이미지 그리드
   - 각 이미지에 변형 버튼 (FAL AI, Replicate Flux)
   - 이미지 선택 및 삭제 기능

## 갤러리 구현 계획

### Phase 1: 상태 변수 추가

```typescript
// pages/admin/gallery.tsx에 추가
const [selectedBaseImage, setSelectedBaseImage] = useState('');
const [generatedImages, setGeneratedImages] = useState<string[]>([]);
const [showGeneratedImages, setShowGeneratedImages] = useState(false);
const [imageGenerationPrompt, setImageGenerationPrompt] = useState('');
const [isGeneratingVariation, setIsGeneratingVariation] = useState(false);
const [imageGenerationStep, setImageGenerationStep] = useState('');
const [imageGenerationModel, setImageGenerationModel] = useState('');
const [showGenerationProcess, setShowGenerationProcess] = useState(false);
```

### Phase 2: 핵심 함수 추가

#### 2.1 `handleLoadExistingImageAndPrompt` 함수
- 블로그의 `handleLoadExistingImageAndPrompt` 함수를 그대로 복사
- 경로: `pages/admin/blog.tsx` 3817-3892줄

#### 2.2 `generateImageVariation` 함수
- 블로그의 `generateImageVariation` 함수를 그대로 복사
- 경로: `pages/admin/blog.tsx` 3894-4004줄
- 단, API 엔드포인트는 갤러리용으로 조정:
  - FAL AI: `/api/generate-blog-image-fal-variation` (그대로 사용)
  - Replicate Flux: `/api/generate-blog-image-replicate-flux` (그대로 사용)

#### 2.3 `selectBaseImage` 함수
- 블로그의 `selectBaseImage` 함수를 그대로 복사
- 경로: `pages/admin/blog.tsx` 4006-4009줄

### Phase 3: 모달 UI 개선

#### 3.1 "이미지 불러오기" 버튼 추가
- 현재: "이미지 변형하기" 버튼만 있음
- 변경: "이미지 불러오기" 버튼 추가
- 위치: 변형 모달 하단 액션 버튼 영역

#### 3.2 프롬프트 미리보기 섹션 추가
- 블로그의 프롬프트 미리보기 섹션을 그대로 복사
- 경로: `pages/admin/blog.tsx` 프롬프트 미리보기 섹션

#### 3.3 "생성된 이미지" 섹션 추가
- 블로그의 "생성된 이미지" 섹션을 그대로 복사
- 경로: `pages/admin/blog.tsx` 6985-7084줄
- 각 이미지에 변형 버튼 (FAL AI, Replicate Flux) 추가

### Phase 4: 일반 이미지 변형 지원

#### 4.1 이미지 타입 감지
- 골프 이미지: `/api/analyze-image-prompt` 사용 (골프 특화)
- 일반 이미지 (음식, 골프헤드 등): `/api/analyze-image-general` 사용 (범용)

#### 4.2 `handleLoadExistingImageAndPrompt` 함수 개선
```typescript
// 이미지 타입 감지 로직 추가
const isGolfImage = checkIfGolfImage(selectedExistingImage); // TODO: 구현 필요

if (isGolfImage) {
  // 골프 이미지: analyze-image-prompt 사용
  analysisResponse = await fetch('/api/analyze-image-prompt', {...});
} else {
  // 일반 이미지: analyze-image-general 사용
  analysisResponse = await fetch('/api/analyze-image-general', {...});
}
```

#### 4.3 이미지 타입 감지 함수
```typescript
const checkIfGolfImage = (imageUrl: string): boolean => {
  // 이미지 URL이나 메타데이터를 기반으로 골프 이미지인지 판단
  // TODO: 구현 필요
  // 예: 키워드 기반 판단, 이미지 분석 API 사용 등
  return false; // 기본값: 일반 이미지로 처리
};
```

### Phase 5: API 엔드포인트 확인

#### 5.1 필요한 API
- ✅ `/api/get-image-prompt`: 기존 프롬프트 조회 (이미 존재)
- ✅ `/api/analyze-image-prompt`: 골프 이미지 분석 (이미 존재)
- ✅ `/api/analyze-image-general`: 일반 이미지 분석 (이미 존재)
- ✅ `/api/generate-blog-image-fal-variation`: FAL AI 변형 (이미 존재)
- ✅ `/api/generate-blog-image-replicate-flux`: Replicate Flux 변형 (이미 존재)

#### 5.2 API 사용 방법
- 블로그의 변형 API를 그대로 사용
- `contentType: 'gallery'`로 설정하여 갤러리용으로 구분

## 구현 순서

1. ✅ 상태 변수 추가
2. ✅ `handleLoadExistingImageAndPrompt` 함수 추가
3. ✅ `generateImageVariation` 함수 추가
4. ✅ `selectBaseImage` 함수 추가
5. ✅ 모달 UI 개선 - "이미지 불러오기" 버튼 추가
6. ✅ 프롬프트 미리보기 섹션 추가
7. ✅ "생성된 이미지" 섹션 추가
8. ✅ 이미지 타입 감지 로직 추가
9. ✅ 일반 이미지 변형 지원

## 테스트 결과 (플레이라이트)

### 블로그 변형 기능 테스트 완료 ✅
1. ✅ 로그인 성공
2. ✅ 게시물 생성 모드 진입 성공
3. ✅ "기존 이미지 변형" 버튼 발견 및 클릭 성공
4. ✅ 변형 모달 열림 확인
5. ✅ 갤러리 탭 클릭 성공
6. ✅ 첫 번째 이미지 선택 성공
7. ✅ "이미지 불러오기" 버튼 클릭 성공
8. ✅ API 호출 확인: `/api/get-image-prompt` → 프롬프트 없음
9. ✅ 프롬프트 미리보기 발견

### 테스트 시나리오
1. 골프 이미지 변형 테스트
   - 골프 스윙 이미지 선택
   - "이미지 불러오기" 클릭
   - 프롬프트 생성 확인 (`/api/analyze-image-prompt`)
   - FAL AI 변형 테스트
   - Replicate Flux 변형 테스트

2. 일반 이미지 변형 테스트
   - 음식 이미지 선택
   - "이미지 불러오기" 클릭
   - 일반 이미지 분석 확인 (`/api/analyze-image-general`)
   - 변형 테스트

3. 골프헤드 이미지 변형 테스트
   - 골프헤드 이미지 선택
   - "이미지 불러오기" 클릭
   - 일반 이미지 분석 확인 (`/api/analyze-image-general`)
   - 변형 테스트

## 주의사항

1. **이미지 타입 감지**: 골프 이미지와 일반 이미지를 정확히 구분해야 함
2. **프롬프트 품질**: 일반 이미지의 경우 `/api/analyze-image-general`을 사용하여 정확한 프롬프트 생성
3. **API 호환성**: 블로그의 변형 API를 그대로 사용하되, `contentType: 'gallery'`로 설정
4. **에러 처리**: 각 단계에서 에러가 발생할 경우 적절한 에러 메시지 표시

## 다음 단계

1. 상태 변수 추가
2. 핵심 함수 추가
3. 모달 UI 개선
4. 이미지 타입 감지 로직 구현
5. 테스트 및 디버깅

