# 스토리 기반 장면(S1-S7) 자동 감지 및 메타데이터 개선 계획

## 📋 개요

고객 이미지를 스토리 기반 장면(S1-S7)으로 자동 분류하고, 파일명과 메타데이터를 정확하게 생성하는 시스템을 구축합니다.

## 🎯 목표

1. **파일명 자동 생성**: `고객명-(S1~S7)-날짜-고유번호.확장자` 형식
2. **장면 자동 감지**: 이미지 내용 분석을 통한 S1-S7 자동 분류
3. **메타데이터 정확도 향상**: AI 프리셋 기반 키워드 및 타입 감지
4. **키워드 자동 수정**: `scene-3, type-sita` → `scene-1, type-happy?` 등 정확한 값으로 업데이트

## 📐 장면 분류 규칙 (S1-S7)

### 장면1 (S1): 행복한 주인공 - 골프장 단독샷
- **특징**: 
  - 고객 단독샷, 골프장 사진
  - 여유롭고 평화로운 골프 순간
  - 고급스러운 골프
  - 웃는 모습 또는 밝은 표정
  - 골프장 배경 (잔디, 코스, 그린)
- **키워드**: `scene-1`, `type-happy`, `golf-course`, `solo-shot`
- **파일명 예시**: `ahnhuija-S1-20260127-01.webp`

### 장면2 (S2): 여러 사람 등장
- **특징**:
  - 골프장에서 여러 사람이 함께 등장
  - 그룹 사진, 친구들과 함께
  - 10-15명 등장 가능
- **키워드**: `scene-2`, `type-group`, `multiple-people`, `golf-course`
- **파일명 예시**: `ahnhuija-S2-20260127-01.webp`

### 장면3 (S3): 문제 발생
- **특징**:
  - 표정이 어둡거나
  - 골프 공이 러프에 빠졌거나
  - 클럽 오류
  - 부상 발생
  - 부정적인 상황
- **키워드**: `scene-3`, `type-problem`, `negative-expression`, `trouble`
- **파일명 예시**: `ahnhuija-S3-20260127-01.webp`

### 장면4 (S4): 가이드 만남
- **특징**:
  - 상담원과 피팅 상담
  - 전화 상담
  - MASGOO 매장
  - 스크린 골프
  - 상담, 피팅, 가이드 관련
- **키워드**: `scene-4`, `type-guide`, `consultation`, `fitting`, `sita`
- **파일명 예시**: `ahnhuija-S4-20260127-01.webp`

### 장면5 (S5): 피팅 매장 / 스크린 골프
- **특징**:
  - 피팅 매장
  - 스크린 골프 연습장
  - 실내 스크린 골프
  - 피팅 프로, MASGOO 로고가 선명하게 보이는 프리미엄 피팅샵
- **키워드**: `scene-5`, `type-sita`, `fitting-shop`, `screen-golf`, `indoor`
- **파일명 예시**: `ahnhuija-S5-20260127-01.webp`

### 장면6 (S6): 골프장 고객 단독사진 (여러명 등장, 웃는 모습)
- **특징**:
  - 골프장 고객 단독사진
  - 코스에서 여러명 등장
  - 웃는 모습
  - 행복한 골프 순간
  - 골프장 배경 + 여러 사람 (배경에)
- **키워드**: `scene-6`, `type-happy`, `golf-course`, `solo-with-others`, `smiling`
- **파일명 예시**: `ahnhuija-S6-20260127-01.webp`

### 장면7 (S7): 제품 클로즈업
- **특징**:
  - 10-15M 이상 제품에 클로즈업
  - 골프장비
  - MASGOO 로고
  - 제품 중심 사진
- **키워드**: `scene-7`, `type-product`, `close-up`, `equipment`, `masgoo-logo`
- **파일명 예시**: `ahnhuija-S7-20260127-01.webp`

## 🔧 구현 계획

### Phase 1: 장면 감지 로직 개선

**파일**: `lib/customer-image-type-detector.ts` (수정)

**현재 문제점**:
- 장면 감지가 부정확함 (골프장 사진이 `scene-3, type-sita`로 잘못 분류됨)
- 프리셋 기반 상세 규칙이 반영되지 않음

**개선 방안**:

1. **AI 프리셋 기반 장면 감지 함수 추가**
   ```typescript
   /**
    * AI 프리셋 기반 장면 감지
    * 이미지3의 프리셋 규칙을 참고하여 정확한 장면 분류
    */
   export async function detectStorySceneFromImage(
     imageUrl: string,
     aiAnalysis: string,
     metadataType: 'golf-ai' | 'general'
   ): Promise<{
     scene: 1 | 2 | 3 | 4 | 5 | 6 | 7;
     type: string;
     confidence: number;
     keywords: string[];
   }> {
     const lowerAnalysis = aiAnalysis.toLowerCase();
     
     // 장면1: 행복한 주인공 - 골프장 단독샷
     if (
       (lowerAnalysis.includes('골프장') || lowerAnalysis.includes('golf course')) &&
       (lowerAnalysis.includes('단독') || lowerAnalysis.includes('혼자') || lowerAnalysis.includes('solo')) &&
       (lowerAnalysis.includes('웃') || lowerAnalysis.includes('행복') || lowerAnalysis.includes('밝') || 
        lowerAnalysis.includes('smile') || lowerAnalysis.includes('happy') || lowerAnalysis.includes('bright'))
     ) {
       // 배경에 여러 사람이 있으면 S6, 없으면 S1
       if (lowerAnalysis.includes('여러') || lowerAnalysis.includes('많은 사람') || lowerAnalysis.includes('multiple people')) {
         return {
           scene: 6,
           type: 'happy',
           confidence: 0.9,
           keywords: ['golf-course', 'solo-with-others', 'smiling', 'happy']
         };
       }
       return {
         scene: 1,
         type: 'happy',
         confidence: 0.9,
         keywords: ['golf-course', 'solo-shot', 'happy', 'luxurious-golf']
       };
     }
     
     // 장면2: 여러 사람 등장
     if (
       (lowerAnalysis.includes('여러 사람') || lowerAnalysis.includes('여러명') || 
        lowerAnalysis.includes('그룹') || lowerAnalysis.includes('multiple people') ||
        lowerAnalysis.includes('group')) &&
       (lowerAnalysis.includes('골프장') || lowerAnalysis.includes('golf course'))
     ) {
       return {
         scene: 2,
         type: 'group',
         confidence: 0.85,
         keywords: ['golf-course', 'multiple-people', 'group']
       };
     }
     
     // 장면3: 문제 발생
     if (
       lowerAnalysis.includes('어둡') || lowerAnalysis.includes('부정') || 
       lowerAnalysis.includes('문제') || lowerAnalysis.includes('오류') ||
       lowerAnalysis.includes('부상') || lowerAnalysis.includes('러프') ||
       lowerAnalysis.includes('dark') || lowerAnalysis.includes('problem') ||
       lowerAnalysis.includes('error') || lowerAnalysis.includes('trouble') ||
       lowerAnalysis.includes('negative')
     ) {
       return {
         scene: 3,
         type: 'problem',
         confidence: 0.9,
         keywords: ['problem', 'trouble', 'negative-expression']
       };
     }
     
     // 장면4: 가이드 만남
     if (
       (lowerAnalysis.includes('상담') || lowerAnalysis.includes('피팅') || 
        lowerAnalysis.includes('가이드') || lowerAnalysis.includes('consultation') ||
        lowerAnalysis.includes('fitting') || lowerAnalysis.includes('guide')) &&
       (lowerAnalysis.includes('전화') || lowerAnalysis.includes('매장') ||
        lowerAnalysis.includes('phone') || lowerAnalysis.includes('store'))
     ) {
       return {
         scene: 4,
         type: 'guide',
         confidence: 0.85,
         keywords: ['consultation', 'fitting', 'guide', 'sita']
       };
     }
     
     // 장면5: 피팅 매장 / 스크린 골프
     if (
       (lowerAnalysis.includes('피팅') || lowerAnalysis.includes('스크린 골프') ||
        lowerAnalysis.includes('fitting') || lowerAnalysis.includes('screen golf')) &&
       (lowerAnalysis.includes('매장') || lowerAnalysis.includes('실내') ||
        lowerAnalysis.includes('store') || lowerAnalysis.includes('indoor'))
     ) {
       return {
         scene: 5,
         type: 'sita',
         confidence: 0.85,
         keywords: ['fitting-shop', 'screen-golf', 'indoor', 'sita']
       };
     }
     
     // 장면7: 제품 클로즈업
     if (
       (lowerAnalysis.includes('제품') || lowerAnalysis.includes('장비') ||
        lowerAnalysis.includes('로고') || lowerAnalysis.includes('product') ||
        lowerAnalysis.includes('equipment') || lowerAnalysis.includes('logo')) &&
       (lowerAnalysis.includes('클로즈업') || lowerAnalysis.includes('가까이') ||
        lowerAnalysis.includes('close-up') || lowerAnalysis.includes('close'))
     ) {
       return {
         scene: 7,
         type: 'product',
         confidence: 0.85,
         keywords: ['product', 'close-up', 'equipment', 'masgoo-logo']
       };
     }
     
     // 기본값: 장면1 (골프장 단독샷)
     return {
       scene: 1,
       type: 'happy',
       confidence: 0.6,
       keywords: ['golf-course', 'solo-shot']
     };
   }
   ```

2. **타입 감지 개선**
   - `type-happy`: 웃는 모습, 밝은 표정, 행복한 순간
   - `type-problem`: 어두운 표정, 문제 상황
   - `type-group`: 여러 사람
   - `type-guide`: 상담, 피팅
   - `type-sita`: 시타장, 스크린 골프
   - `type-product`: 제품 클로즈업

### Phase 2: 파일명 생성 로직 수정

**파일**: `lib/customer-image-filename-generator.ts` (수정)

**현재 형식**: `{고객명}_s{장면코드}_{타입}_{YYYYMMDD}_{순번}.webp`
**새 형식**: `{고객명}-S{장면코드}-{YYYYMMDD}-{순번}.webp`

**수정 내용**:
```typescript
export async function generateFinalCustomerImageFileName(
  customer: { 
    name: string; 
    name_en?: string;
    folder_name?: string;
    phone?: string;
  },
  visitDate: string, // YYYY-MM-DD 형식
  typeDetection: {
    scene: number;
    type: string;
  },
  originalFileName: string,
  index: number = 1
): Promise<{ fileName: string; filePath: string; scene: number; type: string }> {
  // 고객 영문 이름
  const customerNameEn = customer.name_en || translateKoreanToEnglish(customer.name);
  const nameEn = customerNameEn.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // 날짜 형식: YYYY-MM-DD → YYYYMMDD
  const dateStr = visitDate.replace(/-/g, '');
  
  // 장면 코드: S1, S2, S3, S4, S5, S6, S7
  const sceneCode = `S${typeDetection.scene}`;
  
  // 순번 생성
  const sequenceStr = String(index).padStart(2, '0');
  
  // 확장자 (동영상은 원본 확장자 유지, 이미지는 webp)
  const isVideo = /\.(mp4|mov|avi|webm|mkv)$/i.test(originalFileName);
  const originalExt = originalFileName.match(/\.[^/.]+$/)?.[0] || '.webp';
  const extension = isVideo ? originalExt : '.webp';
  
  // 파일명 생성: {고객명}-S{장면코드}-{YYYYMMDD}-{순번}.{확장자}
  const fileName = `${nameEn}-${sceneCode}-${dateStr}-${sequenceStr}${extension}`;
  
  // 고객 폴더명 생성
  const { generateCustomerFolderName } = require('./customer-folder-name-generator');
  const customerFolderName = customer.folder_name || generateCustomerFolderName({
    name: customer.name,
    phone: customer.phone || ''
  });
  
  // 파일 경로
  const filePath = `originals/customers/${customerFolderName}/${visitDate}/${fileName}`;
  
  return {
    fileName,
    filePath,
    scene: typeDetection.scene,
    type: typeDetection.type
  };
}
```

### Phase 3: 메타데이터 키워드 자동 수정

**파일**: `pages/api/admin/create-customer-image-metadata.ts` (수정)

**수정 내용**:
1. 장면 감지 결과를 기반으로 키워드 자동 생성
2. `scene-{번호}`, `type-{타입}` 키워드 정확히 설정
3. ALT 텍스트와 설명에서 감정/장소 추출하여 타입 결정

```typescript
// 장면 감지 후 키워드 생성
const aiTags = [
  `customer-${customerId}`,
  `visit-${visitDate}`,
  `scene-${typeDetection.scene}`, // 정확한 장면 번호
  `type-${typeDetection.type}`, // 정확한 타입 (happy, problem, group 등)
  ...typeDetection.keywords
];

// ALT 텍스트에서 감정/장소 추출
const emotionKeywords = extractEmotionFromText(metadata.alt_text || metadata.description || '');
if (emotionKeywords.includes('웃') || emotionKeywords.includes('행복') || emotionKeywords.includes('밝')) {
  // type을 happy로 확정
  typeDetection.type = 'happy';
}
```

### Phase 4: AI 분석 프롬프트 개선

**파일**: `pages/api/analyze-image-prompt.js` 또는 `pages/api/analyze-image-general.js` (수정)

**프리셋 기반 프롬프트 추가**:
```javascript
const sceneDetectionPrompt = `
이 이미지를 다음 스토리 장면 중 하나로 분류해주세요:

장면1 (S1): 행복한 주인공 - 골프장 단독샷
- 고객 단독샷, 골프장 사진
- 여유롭고 평화로운 골프 순간, 고급스러운 골프
- 웃는 모습 또는 밝은 표정

장면2 (S2): 여러 사람 등장
- 골프장에서 여러 사람이 함께 등장
- 그룹 사진, 친구들과 함께

장면3 (S3): 문제 발생
- 표정이 어둡거나
- 골프 공이 러프에 빠졌거나
- 클럽 오류, 부상 발생

장면4 (S4): 가이드 만남
- 상담원과 피팅 상담, 전화 상담
- MASGOO 매장, 스크린 골프

장면5 (S5): 피팅 매장 / 스크린 골프
- 피팅 매장, 스크린 골프 연습장
- 실내 스크린 골프

장면6 (S6): 골프장 고객 단독사진 (여러명 등장, 웃는 모습)
- 골프장 고객 단독사진
- 코스에서 여러명 등장
- 웃는 모습

장면7 (S7): 제품 클로즈업
- 10-15M 이상 제품에 클로즈업
- 골프장비, MASGOO 로고

분류 결과를 다음 형식으로 제공해주세요:
- 장면 번호: S1, S2, S3, S4, S5, S6, S7 중 하나
- 타입: happy, problem, group, guide, sita, product 중 하나
- 주요 키워드: 3-5개
- 감정/표정: 웃는 모습, 어두운 표정 등
- 장소: 골프장, 매장, 실내 등
`;
```

### Phase 5: 기존 이미지 메타데이터 수정 API

**파일**: `pages/api/admin/update-image-scene-metadata.ts` (신규)

**기능**:
- 기존 이미지의 장면 번호를 재분석하여 수정
- `scene-3, type-sita` → `scene-1, type-happy` 자동 수정
- 파일명도 함께 업데이트 (선택적)

## 📁 변경 파일 목록

1. **수정 파일**:
   - `lib/customer-image-type-detector.ts` (장면 감지 로직 개선)
   - `lib/customer-image-filename-generator.ts` (파일명 형식 변경)
   - `pages/api/admin/create-customer-image-metadata.ts` (키워드 자동 수정)
   - `pages/api/analyze-image-prompt.js` (프리셋 기반 프롬프트 추가)

2. **신규 파일**:
   - `pages/api/admin/update-image-scene-metadata.ts` (기존 이미지 재분석)

3. **문서 업데이트**:
   - `docs/project_plan.md`

## ✅ 구현 체크리스트

- [ ] 장면 감지 로직 개선 (프리셋 기반)
- [ ] 파일명 형식 변경 (`-S1-` 형식)
- [ ] 타입 감지 개선 (happy, problem, group 등)
- [ ] AI 분석 프롬프트에 프리셋 규칙 추가
- [ ] 메타데이터 키워드 자동 수정 로직
- [ ] 기존 이미지 재분석 API (선택적)
- [ ] 테스트 및 검증

## 🔍 추가 고려사항

1. **이미지 1,2 분석**: 골프장 사진이므로 S1 또는 S6로 정확히 분류
2. **표정 감지**: AI Vision API로 표정 분석 (웃는 모습 vs 어두운 표정)
3. **사람 수 감지**: 단독샷 vs 여러 사람 등장 구분
4. **장소 감지**: 골프장 vs 매장 vs 실내 구분
5. **기존 이미지 마이그레이션**: 잘못 분류된 이미지 재분석 및 수정
