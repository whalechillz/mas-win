# 간단 AI 이미지 개선 기능 구현 가이드

## 📋 개요

간단 AI 이미지 개선 기능은 사용자가 입력한 개선 요청사항을 바탕으로 ChatGPT와 다양한 AI 이미지 모델(FAL AI, Replicate, Stability AI)을 활용하여 이미지를 자동으로 편집하고 개선하는 시스템입니다.

## 🏗️ 시스템 아키텍처

```
Frontend (React/Next.js)
    ↓ HTTP POST
API Route (/api/simple-ai-image-improvement)
    ↓ ChatGPT API (프롬프트 생성)
OpenAI GPT-4o-mini
    ↓ 편집 프롬프트
AI Image Model (FAL/Replicate/Stability)
    ↓ 편집된 이미지
Supabase Storage
    ↓ 공개 URL
개선된 이미지 반환
```

## 🔧 핵심 구현 요소

### 1. 프론트엔드 구현

#### 상태 관리
```typescript
// 간단 AI 이미지 개선 관련 상태
const [simpleAIImageRequest, setSimpleAIImageRequest] = useState(''); // 개선 요청사항
const [selectedImageForImprovement, setSelectedImageForImprovement] = useState(''); // 개선할 이미지
const [isImprovingImage, setIsImprovingImage] = useState(false); // 이미지 개선 중
```

#### 메인 함수
```typescript
const applySimpleAIImageImprovement = async (model = 'fal') => {
  // 1. 유효성 검사
  if (!selectedImageForImprovement) {
    alert('개선할 이미지를 먼저 선택해주세요.');
    return;
  }

  if (!simpleAIImageRequest.trim()) {
    alert('이미지 개선 요청사항을 입력해주세요.');
    return;
  }

  try {
    console.log('🎨 간단 AI 이미지 개선 시작...', simpleAIImageRequest);
    setIsImprovingImage(true);
    setShowGenerationProcess(true);
    setImageGenerationModel(`${model.toUpperCase()} 이미지 개선`);
    setImageGenerationStep(`1단계: ${model.toUpperCase()} 서버에 이미지 개선 요청 중...`);
    
    // 2. API 호출
    const response = await fetch('/api/simple-ai-image-improvement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageUrl: selectedImageForImprovement,
        improvementRequest: simpleAIImageRequest,
        model: model
      })
    });

    // 3. 응답 처리
    if (response.ok) {
      const data = await response.json();
      
      if (data.improvedImage) {
        setImageGenerationStep(`2단계: ${model.toUpperCase()} 이미지 개선 완료!`);
        
        // 개선된 이미지를 generatedImages에 추가
        const newImage = {
          url: data.improvedImage.publicUrl,
          fileName: data.improvedImage.fileName,
          model: data.model,
          prompt: data.editPrompt,
          originalImage: selectedImageForImprovement,
          improvementRequest: simpleAIImageRequest
        };
        setGeneratedImages(prev => [...prev, newImage]);
        
        console.log('✅ 간단 AI 이미지 개선 완료:', data.model);
        alert(`간단 AI 이미지 개선이 완료되었습니다!\n\n모델: ${data.model}\n요청사항: ${simpleAIImageRequest}`);
        
        // 요청사항 초기화
        setSimpleAIImageRequest('');
        setSelectedImageForImprovement('');
      }
    }
  } catch (error) {
    console.error('간단 AI 이미지 개선 에러:', error);
    alert('간단 AI 이미지 개선 중 오류가 발생했습니다: ' + error.message);
  } finally {
    setIsImprovingImage(false);
    setTimeout(() => {
      setShowGenerationProcess(false);
      setImageGenerationStep('');
    }, 3000);
  }
};
```

#### UI 컴포넌트
```jsx
{/* 간단 AI 이미지 개선 섹션 */}
<div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
  <h4 className="font-medium mb-3 text-green-800 flex items-center">
    🎨 간단 AI 이미지 개선
    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">NEW</span>
  </h4>
  
  {/* 이미지 선택 */}
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      개선할 이미지 선택:
    </label>
    
    {/* 선택된 이미지 미리보기 */}
    {selectedImageForImprovement && (
      <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
        <p className="text-sm font-medium text-gray-700 mb-2">선택된 이미지:</p>
        <div className="flex items-center space-x-3">
          <img 
            src={selectedImageForImprovement} 
            alt="선택된 개선 이미지"
            className="w-16 h-16 object-cover rounded border"
          />
          <div className="flex-1">
            <p className="text-sm text-gray-600 truncate">
              {selectedImageForImprovement.split('/').pop()}
            </p>
            <button
              onClick={() => setSelectedImageForImprovement('')}
              className="text-xs text-red-600 hover:text-red-800 mt-1"
            >
              선택 해제
            </button>
          </div>
        </div>
      </div>
    )}
    
    {/* 이미지 썸네일 선택 그리드 */}
    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
      {/* AI 생성 이미지와 스크래핑 이미지 표시 */}
    </div>
  </div>

  {/* 개선 요청사항 입력 */}
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      이미지 개선 요청사항:
    </label>
    <textarea 
      placeholder="예: 글자/텍스트를 제거해주세요, 드라이버를 제거해주세요, 배경을 바꿔주세요, 색상을 더 밝게 해주세요..."
      className="w-full p-3 border border-green-300 rounded text-sm resize-none"
      rows={3}
      value={simpleAIImageRequest}
      onChange={(e) => setSimpleAIImageRequest(e.target.value)}
    />
  </div>

  {/* 개선 버튼들 */}
  <div className="flex gap-2">
    <button 
      type="button"
      onClick={() => applySimpleAIImageImprovement('fal')}
      disabled={!selectedImageForImprovement || !simpleAIImageRequest.trim() || isImprovingImage}
      className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm disabled:opacity-50"
    >
      {isImprovingImage ? '🎨 개선 중...' : '🎨 FAL AI 개선'}
    </button>
    <button 
      type="button"
      onClick={() => applySimpleAIImageImprovement('replicate')}
      disabled={!selectedImageForImprovement || !simpleAIImageRequest.trim() || isImprovingImage}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm disabled:opacity-50"
    >
      {isImprovingImage ? '🎨 개선 중...' : '🎨 Replicate 개선'}
    </button>
    <button 
      type="button"
      onClick={() => applySimpleAIImageImprovement('stability')}
      disabled={!selectedImageForImprovement || !simpleAIImageRequest.trim() || isImprovingImage}
      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm disabled:opacity-50"
    >
      {isImprovingImage ? '🎨 개선 중...' : '🎨 Stability 개선'}
    </button>
    <button 
      type="button"
      onClick={() => {
        setSimpleAIImageRequest('');
        setSelectedImageForImprovement('');
      }}
      className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
    >
      🗑️ 지우기
    </button>
  </div>
</div>
```

### 2. 백엔드 API 구현

#### 파일 위치
`pages/api/simple-ai-image-improvement.js`

#### 전체 코드
```javascript
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      imageUrl,
      improvementRequest,
      model = 'fal' // 'fal', 'replicate', 'stability'
    } = req.body;

    if (!imageUrl || !improvementRequest) {
      return res.status(400).json({ 
        error: '이미지 URL과 개선 요청사항이 모두 필요합니다.' 
      });
    }

    // ChatGPT로 이미지 개선 프롬프트 생성
    const promptResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 이미지 편집 및 개선 전문가입니다. 사용자의 요청사항을 바탕으로 구체적이고 실행 가능한 이미지 편집 지시사항을 영어로 작성합니다.

다음과 같은 요청 유형들을 처리할 수 있습니다:
- 텍스트/글자 제거: "Remove text, letters, or writing from the image"
- 특정 객체 제거: "Remove [specific object] from the image"
- 스타일 변경: "Change the style to [desired style]"
- 색상 조정: "Adjust colors to [desired colors]"
- 품질 개선: "Improve image quality and sharpness"
- 배경 변경: "Change background to [desired background]"

항상 구체적이고 명확한 영어 프롬프트를 작성하세요.`
        },
        {
          role: "user",
          content: `다음 이미지를 개선해주세요.

개선 요청사항: ${improvementRequest}
이미지 URL: ${imageUrl}

위 요청사항을 바탕으로 이미지 편집을 위한 구체적인 영어 프롬프트를 작성해주세요.`
        }
      ],
      max_tokens: 200,
      temperature: 0.3
    });

    const editPrompt = promptResponse.choices[0].message.content;

    // 선택된 모델에 따라 이미지 편집 API 호출
    let result;
    switch (model) {
      case 'fal':
        result = await editImageWithFAL(imageUrl, editPrompt);
        break;
      case 'replicate':
        result = await editImageWithReplicate(imageUrl, editPrompt);
        break;
      case 'stability':
        result = await editImageWithStability(imageUrl, editPrompt);
        break;
      default:
        throw new Error('지원하지 않는 모델입니다.');
    }

    // 편집된 이미지를 Supabase에 저장
    const savedImage = await saveImageToSupabase(result.imageUrl, 'simple-ai-improvement');

    res.status(200).json({
      success: true,
      improvedImage: savedImage,
      originalImage: imageUrl,
      improvementRequest,
      editPrompt,
      model: model.toUpperCase()
    });

  } catch (error) {
    console.error('❌ 간단 AI 이미지 개선 오류:', error);
    res.status(500).json({ 
      error: '간단 AI 이미지 개선 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

// FAL AI를 사용한 이미지 편집
async function editImageWithFAL(imageUrl, editPrompt) {
  if (!process.env.FAL_KEY && !process.env.FAL_API_KEY) {
    throw new Error('FAL AI API 키가 설정되지 않았습니다.');
  }

  const falResponse = await fetch('https://queue.fal.run/fal-ai/flux', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${process.env.FAL_KEY || process.env.FAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: editPrompt,
      num_inference_steps: 4,
      guidance_scale: 1,
      num_images: 1,
      enable_safety_checker: true
    })
  });

  if (!falResponse.ok) {
    const errorText = await falResponse.text();
    throw new Error(`FAL AI API 오류: ${falResponse.status} - ${errorText}`);
  }

  const falResult = await falResponse.json();
  
  // 폴링 로직
  let finalResult = falResult;
  if (falResult.status === 'IN_QUEUE') {
    let attempts = 0;
    const maxAttempts = 30;
    
    while (finalResult.status === 'IN_QUEUE' || finalResult.status === 'IN_PROGRESS') {
      if (attempts >= maxAttempts) {
        throw new Error('FAL AI 이미지 편집 시간 초과');
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const statusResponse = await fetch(finalResult.status_url, {
        headers: {
          'Authorization': `Key ${process.env.FAL_KEY || process.env.FAL_API_KEY}`,
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`FAL AI 상태 확인 실패: ${statusResponse.status}`);
      }
      
      finalResult = await statusResponse.json();
      attempts++;
    }
  }

  if (!finalResult.images || finalResult.images.length === 0) {
    throw new Error('FAL AI에서 이미지를 편집하지 못했습니다');
  }

  return {
    imageUrl: finalResult.images[0].url,
    model: 'FAL AI'
  };
}

// Replicate를 사용한 이미지 편집
async function editImageWithReplicate(imageUrl, editPrompt) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('Replicate API 토큰이 설정되지 않았습니다.');
  }

  const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: "flux-dev",
      input: {
        prompt: editPrompt,
        num_inference_steps: 4,
        guidance_scale: 1,
        num_outputs: 1
      }
    })
  });

  if (!replicateResponse.ok) {
    const errorText = await replicateResponse.text();
    throw new Error(`Replicate API 오류: ${replicateResponse.status} - ${errorText}`);
  }

  const replicateResult = await replicateResponse.json();
  
  // 폴링 로직
  let finalResult = replicateResult;
  while (finalResult.status === 'starting' || finalResult.status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${finalResult.id}`, {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      }
    });
    
    if (!statusResponse.ok) {
      throw new Error(`Replicate 상태 확인 실패: ${statusResponse.status}`);
    }
    
    finalResult = await statusResponse.json();
  }

  if (finalResult.status !== 'succeeded' || !finalResult.output || finalResult.output.length === 0) {
    throw new Error('Replicate에서 이미지를 편집하지 못했습니다');
  }

  return {
    imageUrl: finalResult.output[0],
    model: 'Replicate Flux'
  };
}

// Stability AI를 사용한 이미지 편집
async function editImageWithStability(imageUrl, editPrompt) {
  if (!process.env.STABILITY_API_KEY) {
    throw new Error('Stability AI API 키가 설정되지 않았습니다.');
  }

  const stabilityResponse = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text_prompts: [
        {
          text: editPrompt,
          weight: 1
        }
      ],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      samples: 1,
      steps: 30
    })
  });

  if (!stabilityResponse.ok) {
    const errorText = await stabilityResponse.text();
    throw new Error(`Stability AI API 오류: ${stabilityResponse.status} - ${errorText}`);
  }

  const stabilityResult = await stabilityResponse.json();

  if (!stabilityResult.artifacts || stabilityResult.artifacts.length === 0) {
    throw new Error('Stability AI에서 이미지를 편집하지 못했습니다');
  }

  // Base64 이미지를 URL로 변환
  const base64Image = stabilityResult.artifacts[0].base64;
  const imageBuffer = Buffer.from(base64Image, 'base64');
  
  // Supabase에 저장하여 URL 생성
  const fileName = `stability-edit-${Date.now()}.png`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(fileName, imageBuffer, {
      contentType: 'image/png',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Stability AI 이미지 저장 실패: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('blog-images')
    .getPublicUrl(fileName);

  return {
    imageUrl: publicUrl,
    model: 'Stability AI'
  };
}

// 이미지를 Supabase에 저장하는 헬퍼 함수
async function saveImageToSupabase(imageUrl, prefix) {
  try {
    // 이미지 다운로드
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const fileName = `${prefix}-${Date.now()}.png`;
    
    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Supabase 업로드 실패: ${uploadError.message}`);
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    return {
      fileName: fileName,
      publicUrl: publicUrl,
      originalUrl: imageUrl
    };
  } catch (error) {
    console.error('이미지 저장 실패:', error);
    throw error;
  }
}
```

## 🚀 다른 프로그램에 적용하는 방법

### 1. 필요한 의존성 설치

```bash
npm install openai @supabase/supabase-js
# 또는
yarn add openai @supabase/supabase-js
```

### 2. 환경 변수 설정

`.env.local` 파일에 필요한 API 키들 추가:
```env
OPENAI_API_KEY=your_openai_api_key_here
FAL_KEY=your_fal_api_key_here
REPLICATE_API_TOKEN=your_replicate_token_here
STABILITY_API_KEY=your_stability_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

### 3. 기본 구현 템플릿

#### React 컴포넌트 예시
```jsx
import React, { useState } from 'react';

const SimpleAIImageImprovement = ({ images, onImageUpdate }) => {
  const [selectedImage, setSelectedImage] = useState('');
  const [improvementRequest, setImprovementRequest] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImprovement = async (model) => {
    if (!selectedImage || !improvementRequest.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/improve-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedImage,
          improvementRequest,
          model
        })
      });
      
      const data = await response.json();
      if (data.success) {
        onImageUpdate(data.improvedImage);
        setImprovementRequest('');
        setSelectedImage('');
      }
    } catch (error) {
      console.error('이미지 개선 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="image-improvement-panel">
      <div className="image-selection">
        <h3>개선할 이미지 선택</h3>
        <div className="image-grid">
          {images.map((img, index) => (
            <img
              key={index}
              src={img.url}
              alt={`이미지 ${index + 1}`}
              className={`thumbnail ${selectedImage === img.url ? 'selected' : ''}`}
              onClick={() => setSelectedImage(img.url)}
            />
          ))}
        </div>
      </div>
      
      <div className="improvement-request">
        <h3>개선 요청사항</h3>
        <textarea
          value={improvementRequest}
          onChange={(e) => setImprovementRequest(e.target.value)}
          placeholder="예: 글자를 제거해주세요, 드라이버를 제거해주세요..."
          rows={3}
        />
      </div>
      
      <div className="action-buttons">
        <button 
          onClick={() => handleImprovement('fal')}
          disabled={!selectedImage || !improvementRequest.trim() || isLoading}
        >
          FAL AI 개선
        </button>
        <button 
          onClick={() => handleImprovement('replicate')}
          disabled={!selectedImage || !improvementRequest.trim() || isLoading}
        >
          Replicate 개선
        </button>
        <button 
          onClick={() => handleImprovement('stability')}
          disabled={!selectedImage || !improvementRequest.trim() || isLoading}
        >
          Stability 개선
        </button>
      </div>
    </div>
  );
};
```

## 📊 주요 특징

### 장점
- **직관적인 사용법**: 텍스트 입력만으로 복잡한 이미지 편집 가능
- **다양한 AI 모델**: FAL AI, Replicate, Stability AI 중 선택 가능
- **스마트 프롬프트 생성**: ChatGPT가 사용자 요청을 구체적인 편집 지시사항으로 변환
- **자동 저장**: 편집된 이미지가 자동으로 클라우드에 저장됨

### 지원하는 편집 유형
- **텍스트/글자 제거**: "글자를 제거해주세요"
- **객체 제거**: "드라이버를 제거해주세요"
- **스타일 변경**: "스타일을 더 현대적으로 바꿔주세요"
- **색상 조정**: "색상을 더 밝게 해주세요"
- **품질 개선**: "이미지 품질을 개선해주세요"
- **배경 변경**: "배경을 바꿔주세요"

### 제한사항
- **API 의존성**: 각 AI 모델의 API 키 필요
- **인터넷 연결**: 온라인 환경에서만 작동
- **처리 시간**: 모델에 따라 10초~2분 소요
- **비용**: AI 모델 사용량에 따른 비용 발생

## 🔧 커스터마이징 옵션

### 1. 프롬프트 개선
```javascript
const customSystemPrompt = `
당신은 ${domain} 전문 이미지 편집가입니다.
사용자의 요청사항을 바탕으로 구체적이고 실행 가능한 이미지 편집 지시사항을 영어로 작성합니다.

다음과 같은 요청 유형들을 처리할 수 있습니다:
- 텍스트/글자 제거: "Remove text, letters, or writing from the image"
- 특정 객체 제거: "Remove [specific object] from the image"
- 스타일 변경: "Change the style to [desired style]"
- 색상 조정: "Adjust colors to [desired colors]"
- 품질 개선: "Improve image quality and sharpness"
- 배경 변경: "Change background to [desired background]"

브랜드 가이드라인: ${brandGuidelines}
타겟 오디언스: ${targetAudience}

항상 구체적이고 명확한 영어 프롬프트를 작성하세요.`;
```

### 2. 모델 설정 조정
```javascript
const modelConfigs = {
  fal: {
    num_inference_steps: 4,
    guidance_scale: 1,
    num_images: 1,
    enable_safety_checker: true
  },
  replicate: {
    num_inference_steps: 4,
    guidance_scale: 1,
    num_outputs: 1
  },
  stability: {
    cfg_scale: 7,
    height: 1024,
    width: 1024,
    samples: 1,
    steps: 30
  }
};
```

### 3. 배치 처리 추가
```javascript
const batchImageImprovement = async (images, requests, model) => {
  const promises = images.map((image, index) => 
    improveImage(image.url, requests[index], model)
  );
  return Promise.all(promises);
};
```

## 📈 성능 최적화

### 1. 이미지 캐싱
```javascript
const imageCache = new Map();

const getCachedImage = (imageUrl, request) => {
  const key = `${imageUrl}-${request}`;
  return imageCache.get(key);
};

const setCachedImage = (imageUrl, request, result) => {
  const key = `${imageUrl}-${request}`;
  imageCache.set(key, result);
};
```

### 2. 요청 제한
```javascript
const rateLimiter = {
  requests: 0,
  lastReset: Date.now(),
  
  canMakeRequest() {
    const now = Date.now();
    if (now - this.lastReset > 60000) { // 1분마다 리셋
      this.requests = 0;
      this.lastReset = now;
    }
    return this.requests < 5; // 분당 5회 제한
  }
};
```

### 3. 이미지 압축
```javascript
const compressImage = async (imageBuffer, quality = 0.8) => {
  // 이미지 압축 로직
  return compressedBuffer;
};
```

## 🛠️ 트러블슈팅

### 일반적인 문제들

1. **API 키 오류**
   ```
   Error: Invalid API key
   ```
   - 환경 변수 확인
   - API 키 유효성 검증

2. **이미지 다운로드 실패**
   ```
   Error: 이미지 다운로드 실패: 404
   ```
   - 이미지 URL 유효성 확인
   - CORS 설정 확인

3. **처리 시간 초과**
   ```
   Error: 이미지 편집 시간 초과
   ```
   - 폴링 간격 조정
   - 타임아웃 시간 증가

4. **저장 공간 부족**
   ```
   Error: Supabase 업로드 실패
   ```
   - 저장소 용량 확인
   - 이미지 압축 적용

## 📝 라이선스 및 비용

### API 비용 (2024년 기준)
- **OpenAI GPT-4o-mini**: $0.00015/1K 토큰 (입력), $0.0006/1K 토큰 (출력)
- **FAL AI**: $0.02/이미지
- **Replicate**: $0.01-0.05/이미지 (모델에 따라)
- **Stability AI**: $0.004/이미지

### 월 사용량 추적
```javascript
const trackUsage = async (action, model, cost) => {
  await fetch('/api/ai-stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      model,
      cost,
      timestamp: new Date().toISOString()
    })
  });
};
```

## 🔗 관련 리소스

- [OpenAI API 문서](https://platform.openai.com/docs)
- [FAL AI API 문서](https://fal.ai/docs)
- [Replicate API 문서](https://replicate.com/docs)
- [Stability AI API 문서](https://platform.stability.ai/docs)
- [Supabase Storage 문서](https://supabase.com/docs/guides/storage)

## 🎯 사용 예시

### 1. 텍스트 제거
```
요청: "이미지에서 글자를 제거해주세요"
결과: "Remove all text and writing from the image while keeping the main subject intact."
```

### 2. 객체 제거
```
요청: "골퍼의 드라이버를 제거해주세요"
결과: "Remove the golf driver from the golfer's hands while maintaining the natural pose."
```

### 3. 스타일 변경
```
요청: "이미지를 더 현대적인 스타일로 바꿔주세요"
결과: "Transform the image to a modern, minimalist style with clean lines and contemporary aesthetics."
```

### 4. 색상 조정
```
요청: "색상을 더 밝고 생생하게 해주세요"
결과: "Enhance the image with brighter, more vibrant colors and improved saturation."
```

---

*이 문서는 마쓰구 골프 블로그 관리 시스템의 간단 AI 이미지 개선 기능을 기반으로 작성되었습니다.*
