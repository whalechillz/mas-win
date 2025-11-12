# AI 이미지 생성 시스템

## 📋 개요

제목과 내용을 바탕으로 AI가 이미지를 생성하는 시스템입니다. 골드톤 시니어 매너와 블랙톤 젊은 매너 두 가지 톤을 지원합니다.

## 📍 위치

- **소스 코드**: 
  - `lib/ai-image-generation.ts` - 공통 이미지 생성 함수
  - `pages/admin/blog.tsx` - 블로그 이미지 생성 (2546-2771번째 줄)
  - `pages/admin/kakao-content.tsx` - 카카오 콘텐츠 이미지 생성
- **API 엔드포인트**:
  - `/api/generate-paragraph-prompts` - 블로그용 프롬프트 생성
  - `/api/generate-paragraph-images-with-prompts` - 이미지 생성 (공통)
  - `/api/kakao-content/generate-prompt-message` - 카카오용 프롬프트/메시지 생성
  - `/api/kakao-content/generate-prompt` - 카카오 전용 프롬프트 생성 (예정)

## 🎯 주요 기능

### 1. 골드톤 시니어 매너 이미지 생성

- **페르소나**: `senior_fitting` (고정)
- **톤앤매너**: 따뜻한 골드 톤, 시니어 골퍼
- **프롬프트 예시**: "Korean senior golfer (50-70 years old, Korean ethnicity, Asian facial features, silver/gray hair), warm golden tone, emotional atmosphere, NO Western/Caucasian people, ONLY Korean/Asian people"
- **카카오 콘텐츠**: 계정 1 (010-6669-9000) 전용

### 2. 블랙톤 젊은 매너 이미지 생성

- **페르소나**: `tech_enthusiast` (고정)
- **톤앤매너**: 차가운 블랙 톤, 젊은 골퍼
- **프롬프트 예시**: "Korean young golfer (30-50 years old, Korean ethnicity, Asian facial features), cool blue-gray tone, innovative atmosphere, NO Western/Caucasian people, ONLY Korean/Asian people"
- **카카오 콘텐츠**: 계정 2 (010-5704-0013) 전용

### 3. 단락별 프롬프트 미리보기

- 본문을 단락별로 분석하여 각 단락에 맞는 이미지 프롬프트 생성
- 프롬프트 수정 후 이미지 생성 가능

### 4. 10월 8일 버전 (안정적 생성)

- 검증된 프롬프트 생성 로직
- 브랜드 전략 기반 자동 프롬프트 생성

## 💻 사용 방법

### 골드톤 이미지 생성

```typescript
// 1. 프롬프트 생성
const generateGoldTonePrompts = async () => {
  const res = await fetch('/api/generate-paragraph-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      content: formData.content,
      title: formData.title,
      excerpt: formData.excerpt,
      contentType: formData.category,
      imageCount: imageGenerationCount,
      brandStrategy: { 
        customerpersona: 'senior_fitting', // 골드톤 고정
        customerChannel: 'local_customers', 
        brandWeight: '높음',
        audienceTemperature: 'warm',
        audienceWeight: '높음'
      }
    })
  });
  
  const data = await res.json();
  const prompts = data.prompts || [];
  return prompts;
};

// 2. 이미지 생성
const handleGenerateGoldToneImages = async (prompts) => {
  const res = await fetch('/api/generate-paragraph-images-with-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      prompts: prompts,
      blogPostId: editingPost?.id || null
    })
  });
  
  const data = await res.json();
  const imageUrls = data.imageUrls || [];
  return imageUrls;
};
```

### 블랙톤 이미지 생성

```typescript
const handleGenerateBlackToneImages = async () => {
  // 1. 프롬프트 생성
  const promptRes = await fetch('/api/generate-paragraph-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      content: formData.content,
      title: formData.title,
      excerpt: formData.excerpt,
      contentType: formData.category,
      imageCount: imageGenerationCount,
      brandStrategy: { 
        customerpersona: 'tech_enthusiast', // 블랙톤 고정
        customerChannel: 'local_customers', 
        brandWeight: getBrandWeight(brandContentType),
        audienceTemperature,
        audienceWeight: getAudienceWeight(audienceTemperature)
      }
    })
  });
  
  const promptData = await promptRes.json();
  const prompts = promptData.prompts || [];
  
  // 2. 이미지 생성
  const res = await fetch('/api/generate-paragraph-images-with-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      prompts: prompts,
      blogPostId: editingPost?.id || null
    })
  });
  
  const data = await res.json();
  const imageUrls = data.imageUrls || [];
  return imageUrls;
};
```

## 🔄 재사용 가능한 함수로 추출 (권장)

### `lib/ai-image-generation.ts` (신규 생성 필요)

```typescript
interface ImageGenerationOptions {
  content: string;
  title: string;
  excerpt: string;
  contentType: string;
  imageCount: number;
  brandStrategy: {
    customerpersona: string;
    customerChannel: string;
    brandWeight: string;
    audienceTemperature: string;
    audienceWeight: string;
  };
  tone: 'gold' | 'black';
  blogPostId?: number | null;
}

export async function generateImagePrompts(options: ImageGenerationOptions) {
  const { content, title, excerpt, contentType, imageCount, brandStrategy } = options;
  
  const res = await fetch('/api/generate-paragraph-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      content,
      title,
      excerpt,
      contentType,
      imageCount,
      brandStrategy
    })
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || '프롬프트 생성 실패');
  }
  
  const data = await res.json();
  return data.prompts || [];
}

export async function generateImagesFromPrompts(
  prompts: Array<{ prompt: string; paragraphIndex: number }>,
  blogPostId?: number | null
) {
  const res = await fetch('/api/generate-paragraph-images-with-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      prompts,
      blogPostId
    })
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || '이미지 생성 실패');
  }
  
  const data = await res.json();
  return data.imageUrls || [];
}

export async function generateGoldToneImages(options: ImageGenerationOptions) {
  const prompts = await generateImagePrompts({
    ...options,
    brandStrategy: {
      ...options.brandStrategy,
      customerpersona: 'senior_fitting', // 골드톤 고정
      brandWeight: '높음',
      audienceTemperature: 'warm',
      audienceWeight: '높음'
    }
  });
  
  return await generateImagesFromPrompts(prompts, options.blogPostId);
}

export async function generateBlackToneImages(options: ImageGenerationOptions) {
  const prompts = await generateImagePrompts({
    ...options,
    brandStrategy: {
      ...options.brandStrategy,
      customerpersona: 'tech_enthusiast', // 블랙톤 고정
    }
  });
  
  return await generateImagesFromPrompts(prompts, options.blogPostId);
}
```

## 📝 예시: 카카오톡 콘텐츠에 적용

```typescript
import { generateGoldToneImages, generateBlackToneImages } from '@/lib/ai-image-generation';

export default function KakaoContentPage() {
  const handleGenerateGoldTone = async () => {
    try {
      const imageUrls = await generateGoldToneImages({
        content: formData.content,
        title: formData.title,
        excerpt: formData.excerpt,
        contentType: '골프 정보',
        imageCount: 4,
        brandStrategy: {
          customerpersona: 'senior_fitting',
          customerChannel: 'local_customers',
          brandWeight: '높음',
          audienceTemperature: 'warm',
          audienceWeight: '높음'
        },
        tone: 'gold'
      });
      
      console.log('생성된 이미지:', imageUrls);
      // 갤러리에 추가 또는 카카오톡 프로필/피드에 사용
    } catch (error) {
      console.error('이미지 생성 오류:', error);
    }
  };
  
  return (
    <div>
      <button onClick={handleGenerateGoldTone}>
        🏆 골드톤 시니어 매너 이미지 생성
      </button>
      <button onClick={handleGenerateBlackTone}>
        ⚡ 블랙톤 젊은 매너 이미지 생성
      </button>
    </div>
  );
}
```

## 🔗 관련 파일

- `lib/ai-image-generation.ts` - 공통 이미지 생성 함수
- `pages/admin/blog.tsx` - 블로그 이미지 생성 (2546-2771번째 줄)
- `pages/admin/kakao-content.tsx` - 카카오 콘텐츠 이미지 생성
- `pages/api/generate-paragraph-prompts.js` - 블로그용 프롬프트 생성 API
- `pages/api/generate-paragraph-images-with-prompts.js` - 이미지 생성 API (공통)
- `pages/api/kakao-content/generate-prompt-message.js` - 카카오용 프롬프트/메시지 생성

## 📚 참고 문서

- [프롬프트 설정 관리](./prompt-settings-manager.md) - 프롬프트 저장/불러오기
- [브랜드 전략 시스템](./brand-strategy-system.md) - 브랜드 전략 기반 프롬프트 생성
- [카카오톡 콘텐츠 시스템](../phases/detailed-plans/phase-14-kakao-content-system.md)
- [카카오 콘텐츠 저장 가이드](../KAKAO_CONTENT_STORAGE_GUIDE.md)
- [데일리 브랜딩 가이드](../DAILY_BRANDING_GUIDE.md)

## ⚠️ 중요 사항

### 블로그 vs 카카오 콘텐츠 프롬프트 분리

**현재 상태**: 카카오 콘텐츠가 블로그 API (`/api/generate-paragraph-prompts`)를 재사용 중

**문제점**: 
- 블로그 프롬프트 로직 수정 시 카카오 콘텐츠에 영향
- 카카오 전용 요구사항 (아시아 골퍼 강제 등)이 블로그에 반영될 수 있음

**해결 방안** (후속 작업):
- 카카오 전용 프롬프트 생성 API 생성 (`/api/kakao-content/generate-prompt`)
- 블로그 API와 완전 분리
- 카카오 전용 요구사항만 반영

