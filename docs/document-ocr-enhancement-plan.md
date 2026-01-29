# 문서 OCR 기능 향상 계획

## 📋 현재 상태

### ✅ 구현 완료
- Google Vision API OCR 텍스트 추출
- OCR 텍스트를 `description` 필드에 저장
- 메타데이터 편집 모달에서 텍스트 편집 가능

### ⚠️ 개선 필요 사항
1. **문서 재구성 기능**: 원본 레이아웃 정보 손실
2. **OCR 오류 수정**: 수동 편집만 가능
3. **구조화된 데이터 추출**: 텍스트만 추출, 구조 정보 없음

---

## 🎯 제안 기능

### 1. 문서 재구성 기능

#### 필요성
- ✅ **필요함**: 원본 문서의 레이아웃(표, 목록, 단락)을 보존하여 가독성 향상
- ✅ **사용자 경험**: 텍스트만 보는 것보다 구조화된 형태가 이해하기 쉬움

#### 구현 방법

**옵션 A: Google Vision API의 fullTextAnnotation 활용 (추천)**
```typescript
// Google Vision API는 이미 레이아웃 정보를 제공함
const fullTextAnnotation = data.responses[0]?.fullTextAnnotation;
// blocks, paragraphs, words, symbols 구조 정보 포함
```

**옵션 B: 마크다운 변환**
- OCR 텍스트를 마크다운 형식으로 변환
- 제목, 단락, 목록 자동 감지

**옵션 C: HTML 재구성**
- 원본 레이아웃을 HTML로 재구성
- 표, 목록, 단락 구조 보존

#### UI 제안
```
┌─────────────────────────────────────┐
│ [원본 이미지]  [재구성된 텍스트]    │
│                                     │
│  이미지 미리보기    구조화된 텍스트  │
│                                     │
│  [원본 보기] [재구성 보기] [편집]   │
└─────────────────────────────────────┘
```

---

### 2. OCR 오류 수정 기능

#### 현재 상태
- ✅ **수동 편집 가능**: textarea에서 직접 수정 가능
- ❌ **자동 교정 없음**: OCR 오류를 자동으로 수정하는 기능 없음

#### 제안 기능

**A. AI 기반 자동 교정 (추천)**
- GPT-4 또는 Claude를 사용하여 OCR 텍스트 교정
- 한국어 맞춤법 검사 및 문맥 이해

**B. 수동 하이라이트**
- OCR 신뢰도가 낮은 부분 하이라이트
- 사용자가 쉽게 찾아서 수정 가능

**C. 비교 모드**
- 원본 이미지와 OCR 텍스트를 나란히 표시
- 오류 부분을 시각적으로 확인

---

### 3. 추천 AI 서비스

#### OCR 오류 수정용 AI

**1. OpenAI GPT-4 (추천) ⭐**
- ✅ 한국어 지원 우수
- ✅ 문맥 이해 능력 뛰어남
- ✅ API 안정적
- ✅ 가격: $0.03/1K input tokens, $0.06/1K output tokens
- ❌ 비용이 상대적으로 높음

**2. Anthropic Claude 3.5 Sonnet**
- ✅ 한국어 지원 우수
- ✅ 긴 텍스트 처리 능력 뛰어남
- ✅ 가격: $3/1M input tokens, $15/1M output tokens
- ✅ GPT-4보다 저렴
- ❌ API가 상대적으로 새로움

**3. Google Gemini Pro**
- ✅ Google Vision API와 통합 용이
- ✅ 한국어 지원 우수
- ✅ 가격: 무료 티어 제공
- ❌ API 안정성이 상대적으로 낮음

**4. 네이버 맞춤법 검사기 API**
- ✅ 한국어 전용
- ✅ 무료 또는 저렴한 가격
- ❌ 문맥 이해 능력 제한적
- ❌ 구조화된 데이터 추출 불가

#### 문서 재구성용 AI

**추가 AI 없이 Google Vision API만으로 가능**
- `fullTextAnnotation`에 이미 레이아웃 정보 포함
- blocks, paragraphs 구조 정보 활용

---

## 🚀 구현 우선순위

### Phase 1: 기본 개선 (즉시 구현 가능)
1. ✅ **OCR 텍스트 편집 기능** (이미 구현됨)
2. ✅ **OCR 신뢰도 표시** (이미 데이터에 포함됨)
3. ⏳ **문서 재구성 보기** (fullTextAnnotation 활용)

### Phase 2: AI 기능 추가 (1-2주)
1. ⏳ **GPT-4 기반 OCR 교정**
2. ⏳ **구조화된 데이터 추출** (표, 목록 등)
3. ⏳ **자동 요약 및 키워드 추출**

### Phase 3: 고급 기능 (선택사항)
1. ⏳ **원본 이미지와 텍스트 비교 모드**
2. ⏳ **OCR 오류 하이라이트**
3. ⏳ **다중 문서 일괄 처리**

---

## 💡 구체적인 구현 예시

### 1. 문서 재구성 컴포넌트

```typescript
// components/DocumentReconstruction.tsx
interface DocumentReconstructionProps {
  ocrText: string;
  fullTextAnnotation?: any; // Google Vision API 응답
  originalImageUrl: string;
}

export function DocumentReconstruction({
  ocrText,
  fullTextAnnotation,
  originalImageUrl
}: DocumentReconstructionProps) {
  const [viewMode, setViewMode] = useState<'original' | 'reconstructed' | 'edit'>('reconstructed');
  
  // fullTextAnnotation을 마크다운으로 변환
  const reconstructedText = useMemo(() => {
    if (!fullTextAnnotation) return ocrText;
    
    // blocks를 순회하며 구조화
    return fullTextAnnotation.blocks
      .map(block => {
        // 단락, 목록, 표 등으로 변환
        return convertBlockToMarkdown(block);
      })
      .join('\n\n');
  }, [fullTextAnnotation]);
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 원본 이미지 */}
      <div>
        <img src={originalImageUrl} alt="원본 문서" />
      </div>
      
      {/* 재구성된 텍스트 */}
      <div>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setViewMode('original')}>원본 텍스트</button>
          <button onClick={() => setViewMode('reconstructed')}>재구성 보기</button>
          <button onClick={() => setViewMode('edit')}>편집</button>
        </div>
        
        {viewMode === 'reconstructed' && (
          <ReactMarkdown>{reconstructedText}</ReactMarkdown>
        )}
        {viewMode === 'edit' && (
          <textarea value={ocrText} onChange={...} />
        )}
      </div>
    </div>
  );
}
```

### 2. AI 기반 OCR 교정 API

```typescript
// pages/api/admin/correct-ocr-text.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  const { ocrText, documentType } = req.body;
  
  const prompt = `다음은 OCR로 추출된 텍스트입니다. 
오타를 수정하고 문맥에 맞게 교정해주세요.
원본의 의미와 구조는 최대한 보존해주세요.

OCR 텍스트:
${ocrText}

교정된 텍스트:`;
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: '당신은 한국어 문서 교정 전문가입니다.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3 // 일관성 있는 결과를 위해 낮은 temperature
  });
  
  return res.json({
    correctedText: completion.choices[0].message.content,
    confidence: 0.95 // AI 교정 신뢰도
  });
}
```

---

## 📊 비용 분석

### GPT-4 사용 시 (예상)
- 평균 문서 길이: 500자
- 입력 토큰: ~200 tokens
- 출력 토큰: ~200 tokens
- 비용: $0.03/1K * 0.2 + $0.06/1K * 0.2 = **$0.018/문서**

### Claude 3.5 Sonnet 사용 시
- 비용: $3/1M * 0.2 + $15/1M * 0.2 = **$0.0036/문서** (약 5배 저렴)

---

## ✅ 결론 및 추천

### 즉시 구현 추천
1. ✅ **문서 재구성 보기**: Google Vision API의 fullTextAnnotation 활용 (추가 비용 없음)
2. ✅ **OCR 텍스트 편집**: 이미 구현됨

### 단기 구현 추천 (1-2주)
1. ✅ **Claude 3.5 Sonnet 기반 OCR 교정**: 비용 효율적
2. ✅ **구조화된 데이터 추출**: fullTextAnnotation 활용

### 장기 고려 사항
1. ⏳ **GPT-4 기반 교정**: 더 높은 품질이 필요한 경우
2. ⏳ **원본 이미지 비교 모드**: 고급 기능

---

## 🎯 다음 단계

1. **문서 재구성 기능 구현** (fullTextAnnotation 활용)
2. **Claude 3.5 Sonnet API 통합** (OCR 교정)
3. **UI 개선** (재구성 보기, 편집 모드 전환)
