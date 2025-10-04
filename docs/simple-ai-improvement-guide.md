# 간단 AI 개선 기능 구현 가이드

## 📋 개요

간단 AI 개선 기능은 사용자가 입력한 개선 요청사항을 바탕으로 OpenAI GPT-4o-mini 모델을 활용하여 블로그 콘텐츠를 자동으로 개선하는 시스템입니다.

## 🏗️ 시스템 아키텍처

```
Frontend (React/Next.js)
    ↓ HTTP POST
API Route (/api/simple-ai-improvement)
    ↓ OpenAI API
OpenAI GPT-4o-mini
    ↓ 응답
개선된 콘텐츠 반환
```

## 🔧 핵심 구현 요소

### 1. 프론트엔드 구현

#### 상태 관리
```typescript
const [simpleAIRequest, setSimpleAIRequest] = useState(''); // 개선 요청사항
```

#### 메인 함수
```typescript
const applySimpleAIImprovement = async () => {
  // 1. 유효성 검사
  if (!formData.title) {
    alert('제목을 먼저 입력해주세요.');
    return;
  }

  if (!formData.content || formData.content.trim().length < 50) {
    alert('개선할 내용이 충분하지 않습니다. 먼저 기본 내용을 작성해주세요.');
    return;
  }

  if (!simpleAIRequest.trim()) {
    alert('개선 요청사항을 입력해주세요.');
    return;
  }

  try {
    console.log('✨ 간단 AI 개선 시작...', simpleAIRequest);
    
    // 2. API 호출
    const response = await fetch('/api/simple-ai-improvement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: formData.title,
        currentContent: formData.content,
        improvementRequest: simpleAIRequest,
        keywords: formData.tags.join(', '),
        category: formData.category
      })
    });

    // 3. 응답 처리
    if (response.ok) {
      const data = await response.json();
      
      if (data.improvedContent) {
        setFormData(prev => ({
          ...prev,
          content: data.improvedContent
        }));
        
        // HTML 변환
        convertMarkdownToHtml(data.improvedContent).then(htmlContent => {
          setHtmlContent(htmlContent);
        }).catch(error => {
          console.error('❌ HTML 변환 실패:', error);
          setHtmlContent(data.improvedContent);
        });
        
        console.log('✅ 간단 AI 개선 완료:', data.originalLength, '→', data.improvedLength, '자');
        alert(`간단 AI 개선이 완료되었습니다!\n\n원본: ${data.originalLength}자 → 개선: ${data.improvedLength}자\n\n요청사항: ${simpleAIRequest}`);
        
        // 요청사항 초기화
        setSimpleAIRequest('');
      } else {
        console.error('간단 AI 개선 실패: 응답 데이터 없음');
        alert('간단 AI 개선에 실패했습니다.');
      }
    } else {
      const error = await response.json();
      console.error('간단 AI 개선 실패:', error);
      alert('간단 AI 개선에 실패했습니다: ' + error.message);
    }
  } catch (error) {
    console.error('간단 AI 개선 에러:', error);
    alert('간단 AI 개선 중 오류가 발생했습니다: ' + error.message);
  }
};
```

#### UI 컴포넌트
```jsx
{/* 간단 AI 개선 기능 */}
<div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <h4 className="font-medium mb-2 text-blue-800">✨ 간단 AI 개선</h4>
  <textarea 
    placeholder="예: 전문성을 높여주세요, CTA 버튼을 추가해주세요, 관련 링크를 넣어주세요, 스토리텔링을 강화해주세요..."
    className="w-full p-3 border border-blue-300 rounded text-sm resize-none"
    rows={3}
    value={simpleAIRequest}
    onChange={(e) => setSimpleAIRequest(e.target.value)}
  />
  <div className="flex gap-2 mt-2">
    <button 
      type="button"
      onClick={() => applySimpleAIImprovement()}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
      disabled={!simpleAIRequest.trim()}
    >
      ✨ AI 개선 적용
    </button>
    <button 
      type="button"
      onClick={() => setSimpleAIRequest('')}
      className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
    >
      🗑️ 지우기
    </button>
  </div>
</div>
```

### 2. 백엔드 API 구현

#### 파일 위치
`pages/api/simple-ai-improvement.js`

#### 전체 코드
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      title,
      currentContent,
      improvementRequest,
      keywords,
      category
    } = req.body;

    console.log('✨ 간단 AI 개선 요청:', { 
      title, 
      improvementRequest,
      currentContentLength: currentContent?.length || 0,
      category
    });

    if (!title || !currentContent || !improvementRequest) {
      return res.status(400).json({ 
        error: '제목, 현재 내용, 개선 요청사항이 모두 필요합니다.' 
      });
    }

    // 간단하고 직관적인 프롬프트
    const prompt = `당신은 전문적인 블로그 콘텐츠 개선 전문가입니다.

**원본 제목:** ${title}
**원본 내용:** ${currentContent}
**개선 요청사항:** ${improvementRequest}
**카테고리:** ${category}
**키워드:** ${keywords || '없음'}

**작업 지침:**
1. 사용자의 개선 요청사항을 정확히 반영하세요
2. 원본 내용의 핵심 메시지는 유지하세요
3. 자연스럽고 읽기 쉬운 문체로 작성하세요
4. 마크다운 형식을 사용하세요
5. 필요시 제목, 소제목, 단락을 적절히 구성하세요

**개선된 콘텐츠를 마크다운 형식으로 작성해주세요:**`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 전문적인 블로그 콘텐츠 개선 전문가입니다. 사용자의 요청사항을 정확히 반영하여 콘텐츠를 개선합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const improvedContent = response.choices[0].message.content;
    const originalLength = currentContent.length;
    const improvedLength = improvedContent.length;

    console.log('✅ 간단 AI 개선 완료:', originalLength, '→', improvedLength, '자');

    res.status(200).json({
      success: true,
      improvedContent,
      originalLength,
      improvedLength,
      improvementRequest,
      usageInfo: {
        model: response.model,
        tokens: response.usage?.total_tokens || 0,
        cost: response.usage?.total_tokens ? (response.usage.total_tokens * 0.00015 / 1000).toFixed(4) : '0.0000'
      }
    });

  } catch (error) {
    console.error('❌ 간단 AI 개선 오류:', error);
    res.status(500).json({ 
      error: '간단 AI 개선 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}
```

## 🚀 다른 프로그램에 적용하는 방법

### 1. 필요한 의존성 설치

```bash
npm install openai
# 또는
yarn add openai
```

### 2. 환경 변수 설정

`.env.local` 파일에 OpenAI API 키 추가:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. 기본 구현 템플릿

#### React 컴포넌트 예시
```jsx
import React, { useState } from 'react';

const SimpleAIImprovement = ({ content, onContentUpdate }) => {
  const [improvementRequest, setImprovementRequest] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImprovement = async () => {
    if (!improvementRequest.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/improve-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          improvementRequest
        })
      });
      
      const data = await response.json();
      if (data.success) {
        onContentUpdate(data.improvedContent);
        setImprovementRequest('');
      }
    } catch (error) {
      console.error('개선 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="improvement-panel">
      <textarea
        value={improvementRequest}
        onChange={(e) => setImprovementRequest(e.target.value)}
        placeholder="개선 요청사항을 입력하세요..."
        rows={3}
      />
      <button 
        onClick={handleImprovement}
        disabled={!improvementRequest.trim() || isLoading}
      >
        {isLoading ? '개선 중...' : 'AI 개선 적용'}
      </button>
    </div>
  );
};
```

#### Express.js API 예시
```javascript
const express = require('express');
const OpenAI = require('openai');

const app = express();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/improve-content', async (req, res) => {
  try {
    const { content, improvementRequest } = req.body;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 콘텐츠 개선 전문가입니다."
        },
        {
          role: "user",
          content: `원본 내용: ${content}\n개선 요청: ${improvementRequest}\n개선된 내용을 작성해주세요.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    res.json({
      success: true,
      improvedContent: response.choices[0].message.content
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 📊 주요 특징

### 장점
- **간단한 사용법**: 텍스트 입력만으로 즉시 개선 가능
- **유연한 요청**: 다양한 개선 요청사항 지원
- **비용 효율적**: GPT-4o-mini 모델 사용으로 저렴한 비용
- **빠른 응답**: 최적화된 프롬프트로 효율적인 처리

### 제한사항
- **토큰 제한**: max_tokens 2000으로 제한
- **API 의존성**: OpenAI API 키 필요
- **인터넷 연결**: 온라인 환경에서만 작동

## 🔧 커스터마이징 옵션

### 1. 프롬프트 개선
```javascript
const customPrompt = `
당신은 ${domain} 전문가입니다.
원본 내용: ${content}
개선 요청: ${request}
브랜드 톤앤매너: ${tone}
타겟 오디언스: ${audience}

다음 지침을 따라 개선해주세요:
1. ${guideline1}
2. ${guideline2}
3. ${guideline3}
`;
```

### 2. 모델 설정 조정
```javascript
const modelConfig = {
  model: "gpt-4o-mini", // 또는 "gpt-4", "gpt-3.5-turbo"
  max_tokens: 3000,     // 토큰 수 조정
  temperature: 0.5,     // 창의성 조정 (0.0-1.0)
  top_p: 0.9,          // 다양성 조정
};
```

### 3. 배치 처리 추가
```javascript
const batchImprove = async (contents, requests) => {
  const promises = contents.map((content, index) => 
    improveContent(content, requests[index])
  );
  return Promise.all(promises);
};
```

## 📈 성능 최적화

### 1. 캐싱 전략
```javascript
const cache = new Map();

const getCachedImprovement = (content, request) => {
  const key = `${content}-${request}`;
  return cache.get(key);
};

const setCachedImprovement = (content, request, result) => {
  const key = `${content}-${request}`;
  cache.set(key, result);
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
    return this.requests < 10; // 분당 10회 제한
  }
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

2. **토큰 제한 초과**
   ```
   Error: Maximum context length exceeded
   ```
   - max_tokens 값 조정
   - 입력 콘텐츠 길이 제한

3. **응답 지연**
   - 모델 변경 (gpt-3.5-turbo 사용)
   - 프롬프트 최적화
   - 캐싱 구현

## 📝 라이선스 및 비용

- **OpenAI API**: 사용량 기반 과금
- **GPT-4o-mini**: $0.00015/1K 토큰 (입력), $0.0006/1K 토큰 (출력)
- **월 사용량 추적**: API 대시보드에서 모니터링 가능

## 🔗 관련 리소스

- [OpenAI API 문서](https://platform.openai.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [React Hooks 가이드](https://reactjs.org/docs/hooks-intro.html)

---

*이 문서는 마쓰구 골프 블로그 관리 시스템의 간단 AI 개선 기능을 기반으로 작성되었습니다.*
