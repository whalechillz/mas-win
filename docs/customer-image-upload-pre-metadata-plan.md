# 고객 이미지 관리 - 업로드 전 메타데이터 생성 및 파일명 자동 생성 계획

## 📋 개요

**대상 페이지**: `pages/admin/customers/index.tsx` - 고객 이미지 관리

이미지 업로드 **전에** 메타데이터를 먼저 생성하고, 그 정보를 바탕으로 파일명을 자동 생성하는 방식으로 개선

## 🎯 적용 위치

- **페이지**: 고객 관리 → 고객 이미지 관리
- **파일**: `pages/admin/customers/index.tsx`
- **컴포넌트**: `CustomerImageModal` 내부

## 🎯 요구사항

### 1. 업로드 전 메타데이터 생성 플로우

```
1. 이미지 파일 선택
   ↓
2. 업로드 전 설정 모달 열림
   ↓
3. 고객명 선택/입력
   ↓
4. 메타데이터 생성 방식 선택 (골프 AI 생성 / 일반 메타 생성)
   ↓
5. 이미지 내용 분석 (AI)
   ↓
6. 메타데이터 생성 및 저장
   ↓
7. 파일명 자동 생성 (고객명_s{장면코드}_{타입}_{날짜}_{순번}.webp)
   ↓
8. 파일 업로드
```

### 2. 파일명 구조

**형식:**
```
{고객명}_s{장면코드}_{타입}_{YYYYMMDD}_{순번}.webp
```

**장면 코드 (s1~s7):**
- `s1`: 행복한 주인공 (골프장 이미지)
- `s2`: 행복+불안 전조
- `s3`: 문제 발생 (시타장면, 시타영상)
- `s4`: 가이드 만남 (시타상담, 측정, guide)
- `s5`: 가이드 장소 (아트월, artwall)
- `s6`: 성공 회복 (사인, 스윙장면, 스윙영상)
- `s7`: 여운 정적 (후기캡처)

**타입:**
- `artwall`: 아트월
- `sita`: 시타장
- `guide`: 가이드/상담
- `swing`: 스윙
- `signature`: 사인
- `golf-course`: 골프장
- `docs`: 서류

**예시:**
- `ahnhuija_s1_golf-course_20260127_01.webp` (골프장 이미지)
- `ahnhuija_s3_sita_20260127_01.webp` (시타장 이미지)
- `ahnhuija_s5_artwall_20260127_01.webp` (아트월 이미지)
- `ahnhuija_s4_guide_20260127_01.webp` (가이드/상담 이미지)
- `ahnhuija_docs_20260127_01.webp` (서류 이미지)

## 🔧 구현 계획

### Phase 1: 업로드 전 설정 모달 생성

**파일**: `components/admin/CustomerImageUploadModal.tsx` (신규)
**적용 위치**: `pages/admin/customers/index.tsx` - 고객 이미지 관리 모달 내부

**기능**:
1. 이미지 파일 선택 시 모달 자동 열림
2. **고객명**: 현재 선택된 고객 자동 설정 (수정 불가)
3. 메타데이터 생성 방식 라디오 버튼:
   - "골프 AI 생성" (기본값)
   - "일반 메타 생성"
4. 방문일자 선택 (기존 방문일자 필드와 연동)
5. "메타데이터 생성 및 업로드" 버튼

**UI 구조**:
```
┌─────────────────────────────────────┐
│  이미지 업로드 설정                  │
├─────────────────────────────────────┤
│  선택된 파일: image.jpg              │
│                                     │
│  고객명: 안희자 (자동 설정)           │
│                                     │
│  메타데이터 생성 방식:               │
│  ○ 골프 AI 생성                     │
│  ○ 일반 메타 생성                    │
│                                     │
│  방문일자: [2026. 01. 27.]          │
│                                     │
│  [취소]  [메타데이터 생성 및 업로드] │
└─────────────────────────────────────┘
```

**통합 위치**:
- 기존 "갤러리에서 선택" 버튼 옆에 "이미지 업로드" 버튼 추가
- "이미지 업로드" 버튼 클릭 시 이 모달 열림
- 드래그앤드롭 영역에서 파일 선택 시에도 이 모달 열림

### Phase 2: 이미지 내용 분석 및 타입 감지

**파일**: `lib/customer-image-type-detector.ts` (신규/수정)

**기능**:
1. 이미지 파일을 Base64로 변환
2. OpenAI Vision API로 이미지 내용 분석
3. 장면 코드 감지 (s1~s7)
4. 타입 감지 (artwall, sita, guide, swing, signature, golf-course, docs)

**구현 예시**:
```typescript
export interface ImageTypeDetectionResult {
  scene: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 0; // 0은 서류
  type: 'artwall' | 'sita' | 'guide' | 'swing' | 'signature' | 'golf-course' | 'docs';
  confidence: number;
  keywords: string[];
}

export async function detectImageTypeFromFile(
  file: File,
  metadataType: 'golf-ai' | 'general'
): Promise<ImageTypeDetectionResult> {
  // 1. 파일을 Base64로 변환
  const base64 = await fileToBase64(file);
  
  // 2. OpenAI Vision API로 이미지 분석
  const analysis = await analyzeImageWithOpenAI(base64, metadataType);
  
  // 3. 장면 코드 및 타입 감지
  const detection = detectSceneAndType(analysis);
  
  return detection;
}

async function analyzeImageWithOpenAI(
  base64: string,
  metadataType: 'golf-ai' | 'general'
): Promise<string> {
  const endpoint = metadataType === 'golf-ai' 
    ? '/api/analyze-image-prompt'
    : '/api/analyze-image-general';
  
  // 임시 업로드하여 URL 확보 (또는 Base64 직접 전송)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: base64,
      analyzeType: 'scene-detection'
    })
  });
  
  const result = await response.json();
  return result.keywords || result.description || '';
}

function detectSceneAndType(analysis: string): ImageTypeDetectionResult {
  const lowerAnalysis = analysis.toLowerCase();
  
  // 서류 감지 (최우선)
  if (lowerAnalysis.includes('문서') || lowerAnalysis.includes('주문서') || 
      lowerAnalysis.includes('설문') || lowerAnalysis.includes('동의서')) {
    return {
      scene: 0,
      type: 'docs',
      confidence: 0.9,
      keywords: ['문서', '서류']
    };
  }
  
  // 아트월 감지 (s5)
  if (lowerAnalysis.includes('아트월') || lowerAnalysis.includes('artwall') ||
      lowerAnalysis.includes('벽면') || lowerAnalysis.includes('디스플레이')) {
    return {
      scene: 5,
      type: 'artwall',
      confidence: 0.85,
      keywords: ['아트월', 'artwall']
    };
  }
  
  // 시타장 감지 (s3)
  if (lowerAnalysis.includes('시타') || lowerAnalysis.includes('시뮬레이터') ||
      lowerAnalysis.includes('simulator') || lowerAnalysis.includes('sita')) {
    return {
      scene: 3,
      type: 'sita',
      confidence: 0.85,
      keywords: ['시타장', '시뮬레이터']
    };
  }
  
  // 가이드/상담 감지 (s4)
  if (lowerAnalysis.includes('상담') || lowerAnalysis.includes('가이드') ||
      lowerAnalysis.includes('피팅') || lowerAnalysis.includes('측정') ||
      lowerAnalysis.includes('guide') || lowerAnalysis.includes('consultation')) {
    return {
      scene: 4,
      type: 'guide',
      confidence: 0.85,
      keywords: ['가이드', '상담', '피팅']
    };
  }
  
  // 골프장 감지 (s1)
  if (lowerAnalysis.includes('골프장') || lowerAnalysis.includes('그린') ||
      lowerAnalysis.includes('페어웨이') || lowerAnalysis.includes('golf course')) {
    return {
      scene: 1,
      type: 'golf-course',
      confidence: 0.85,
      keywords: ['골프장', '그린']
    };
  }
  
  // 스윙 감지 (s6)
  if (lowerAnalysis.includes('스윙') || lowerAnalysis.includes('swing')) {
    return {
      scene: 6,
      type: 'swing',
      confidence: 0.8,
      keywords: ['스윙', 'swing']
    };
  }
  
  // 사인 감지 (s6)
  if (lowerAnalysis.includes('사인') || lowerAnalysis.includes('signature')) {
    return {
      scene: 6,
      type: 'signature',
      confidence: 0.8,
      keywords: ['사인', 'signature']
    };
  }
  
  // 기본값: 마스골프 매장 (s3)
  return {
    scene: 3,
    type: 'sita',
    confidence: 0.6,
    keywords: ['매장', 'store']
  };
}
```

### Phase 3: 메타데이터 생성 및 저장

**파일**: `pages/api/admin/create-customer-image-metadata.ts` (신규)

**기능**:
1. 이미지 파일을 임시로 업로드하여 URL 확보
2. 선택된 방식으로 메타데이터 생성 (골프 AI / 일반 메타)
3. 이미지 타입 감지
4. 메타데이터를 `image_assets` 테이블에 저장
5. 생성된 메타데이터 ID 반환

**구현 예시**:
```typescript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { 
    file, // FormData에서 파일
    customerId,
    customerName,
    visitDate,
    metadataType // 'golf-ai' | 'general'
  } = req.body;
  
  try {
    // 1. 임시 파일 업로드 (URL 확보)
    const tempFileName = `temp_${Date.now()}_${file.name}`;
    const tempUploadResult = await uploadImageToSupabase(file, {
      targetFolder: `temp/${customerId}`,
      customFileName: tempFileName
    });
    
    // 2. 이미지 타입 감지
    const typeDetection = await detectImageTypeFromFile(file, metadataType);
    
    // 3. 메타데이터 생성
    const metadataEndpoint = metadataType === 'golf-ai'
      ? '/api/analyze-image-prompt'
      : '/api/analyze-image-general';
    
    const metadataResponse = await fetch(metadataEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: tempUploadResult.url,
        title: `${customerName} - ${visitDate}`,
        excerpt: ''
      })
    });
    
    const metadata = await metadataResponse.json();
    
    // 4. 메타데이터 저장 (image_assets 테이블)
    const { data: savedMetadata, error } = await supabase
      .from('image_assets')
      .insert({
        filename: tempFileName, // 임시 파일명
        original_filename: file.name,
        file_path: `temp/${customerId}/${tempFileName}`,
        cdn_url: tempUploadResult.url,
        title: metadata.title,
        alt_text: metadata.alt_text,
        description: metadata.description,
        ai_tags: [
          `customer-${customerId}`,
          `visit-${visitDate}`,
          `scene-${typeDetection.scene}`,
          `type-${typeDetection.type}`,
          ...typeDetection.keywords
        ],
        file_size: file.size,
        mime_type: file.type,
        format: file.name.split('.').pop() || 'webp',
        // 타입 감지 결과 저장
        story_scene: typeDetection.scene,
        // 임시 파일임을 표시
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return res.status(200).json({
      success: true,
      metadataId: savedMetadata.id,
      typeDetection,
      metadata
    });
    
  } catch (error) {
    console.error('메타데이터 생성 실패:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

### Phase 4: 파일명 생성 및 최종 업로드

**파일**: `lib/customer-image-filename-generator.ts` (수정)

**기능**:
1. 메타데이터에서 타입 정보 추출
2. 파일명 생성: `{고객명}_s{장면코드}_{타입}_{YYYYMMDD}_{순번}.webp`
3. 중복 파일 확인 및 순번 조정
4. 임시 파일을 최종 파일명으로 이동/이름 변경

**구현 예시**:
```typescript
export async function generateFinalFileName(
  customer: { name: string; name_en?: string },
  metadataId: string,
  visitDate: string,
  typeDetection: ImageTypeDetectionResult
): Promise<{ fileName: string; filePath: string }> {
  // 고객 영문 이름
  const { translateKoreanToEnglish } = require('./korean-to-english-translator');
  const customerNameEn = customer.name_en || translateKoreanToEnglish(customer.name);
  const nameEn = customerNameEn.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // 날짜 형식: YYYYMMDD
  const dateStr = visitDate.replace(/-/g, '');
  
  // 장면 코드
  const sceneCode = typeDetection.scene > 0 ? `s${typeDetection.scene}` : 'docs';
  
  // 타입 코드
  const typeCode = typeDetection.type;
  
  // 순번 생성 (중복 확인)
  let sequence = 1;
  let finalFileName: string;
  
  while (true) {
    const sequenceStr = String(sequence).padStart(2, '0');
    finalFileName = `${nameEn}_${sceneCode}_${typeCode}_${dateStr}_${sequenceStr}.webp`;
    
    // 중복 확인
    const filePath = `originals/customers/${customerNameEn}/${visitDate}/${finalFileName}`;
    const exists = await checkFileExists(filePath);
    
    if (!exists) {
      break;
    }
    
    sequence++;
    if (sequence > 99) {
      throw new Error('파일명 순번이 최대치에 도달했습니다.');
    }
  }
  
  return {
    fileName: finalFileName,
    filePath: `originals/customers/${customerNameEn}/${visitDate}/${finalFileName}`
  };
}

export async function moveTempFileToFinal(
  metadataId: string,
  finalFileName: string,
  finalFilePath: string
): Promise<void> {
  // 1. 메타데이터에서 임시 파일 정보 가져오기
  const { data: metadata } = await supabase
    .from('image_assets')
    .select('cdn_url, file_path')
    .eq('id', metadataId)
    .single();
  
  if (!metadata) {
    throw new Error('메타데이터를 찾을 수 없습니다.');
  }
  
  // 2. 임시 파일을 최종 경로로 이동
  await moveFileInStorage(metadata.file_path, finalFilePath);
  
  // 3. 메타데이터 업데이트
  const newUrl = generatePublicUrl(finalFilePath);
  await supabase
    .from('image_assets')
    .update({
      filename: finalFileName,
      file_path: finalFilePath,
      cdn_url: newUrl,
      status: 'active'
    })
    .eq('id', metadataId);
}
```

### Phase 5: UI 통합 (고객 이미지 관리 페이지)

**파일**: `pages/admin/customers/index.tsx` (수정)
**컴포넌트**: `CustomerImageModal` 내부

**수정 내용**:
1. **"갤러리에서 선택" 옆에 "이미지 업로드" 버튼 추가**
2. **드래그앤드롭 영역에서 파일 선택 시 `CustomerImageUploadModal` 열기**
3. 이미지 업로드 버튼 클릭 시 `CustomerImageUploadModal` 열기
4. 모달에서 설정 완료 후 업로드 플로우 실행
5. 업로드 진행률 표시
6. **하단 버튼 변경**: "닫기" → "취소", "저장"
7. **업로드 모드 섹션 제거**: "파일명 최적화" / "파일명 유지" 라디오 버튼 삭제

**구현 예시**:
```typescript
const handleImageUploadClick = () => {
  setShowUploadModal(true);
};

const handleUploadWithMetadata = async (uploadConfig: {
  file: File;
  customerId: number;
  customerName: string;
  visitDate: string;
  metadataType: 'golf-ai' | 'general';
}) => {
  try {
    setUploading(true);
    setUploadProgress(0);
    
    // 1. 메타데이터 생성 및 저장
    const formData = new FormData();
    formData.append('file', uploadConfig.file);
    formData.append('customerId', uploadConfig.customerId.toString());
    formData.append('customerName', uploadConfig.customerName);
    formData.append('visitDate', uploadConfig.visitDate);
    formData.append('metadataType', uploadConfig.metadataType);
    
    const metadataResponse = await fetch('/api/admin/create-customer-image-metadata', {
      method: 'POST',
      body: formData
    });
    
    const metadataResult = await metadataResponse.json();
    
    if (!metadataResult.success) {
      throw new Error(metadataResult.error);
    }
    
    setUploadProgress(30);
    
    // 2. 파일명 생성
    const fileNameResult = await generateFinalFileName(
      customer,
      metadataResult.metadataId,
      uploadConfig.visitDate,
      metadataResult.typeDetection
    );
    
    setUploadProgress(50);
    
    // 3. 임시 파일을 최종 파일명으로 이동
    await moveTempFileToFinal(
      metadataResult.metadataId,
      fileNameResult.fileName,
      fileNameResult.filePath
    );
    
    setUploadProgress(100);
    
    // 4. 이미지 목록 새로고침
    await loadCustomerImages(selectedDateFilter);
    
    alert('이미지 업로드가 완료되었습니다.');
    setShowUploadModal(false);
    
  } catch (error) {
    console.error('업로드 실패:', error);
    alert('이미지 업로드에 실패했습니다: ' + error.message);
  } finally {
    setUploading(false);
  }
};
```

## 📂 파일 구조

### 신규 파일
1. `components/admin/CustomerImageUploadModal.tsx` - 업로드 전 설정 모달
2. `lib/customer-image-type-detector.ts` - 이미지 타입 감지 (수정)
3. `pages/api/admin/create-customer-image-metadata.ts` - 메타데이터 생성 API

### 수정 파일
1. `lib/customer-image-filename-generator.ts` - 파일명 생성 로직 수정
2. `pages/admin/customers/index.tsx` - UI 통합

## ✅ 체크리스트

### Phase 1: 업로드 전 설정 모달
- [ ] `CustomerImageUploadModal` 컴포넌트 생성
- [ ] 고객명 자동 설정 (현재 선택된 고객)
- [ ] 메타데이터 생성 방식 라디오 버튼 (골프 AI 생성 / 일반 메타 생성)
- [ ] 방문일자 선택 (기존 방문일자 필드와 연동)

### Phase 2: 이미지 타입 감지
- [ ] 파일을 Base64로 변환 함수
- [ ] OpenAI Vision API 통합
- [ ] 장면 코드 감지 (s1~s7)
- [ ] 타입 감지 (artwall, sita, guide, swing, signature, golf-course, docs)

### Phase 3: 메타데이터 생성 및 저장
- [ ] 임시 파일 업로드
- [ ] 골프 AI / 일반 메타 생성 선택
- [ ] 메타데이터 API 호출 (`/api/analyze-image-prompt` 또는 `/api/analyze-image-general`)
- [ ] `image_assets` 테이블에 저장 (임시 파일명으로)

### Phase 4: 파일명 생성 및 최종 업로드
- [ ] 파일명 생성 로직 (s1~s7, artwall, sita, guide 포함)
- [ ] 중복 파일 확인 및 순번 조정 (01, 02, 03...)
- [ ] 임시 파일을 최종 파일명으로 이동
- [ ] 메타데이터 업데이트 (최종 파일명, 경로, URL)

### Phase 5: UI 통합 (고객 이미지 관리 페이지)
- [ ] "갤러리에서 선택" 옆에 "이미지 업로드" 버튼 추가
- [ ] 드래그앤드롭 영역에서 파일 선택 시 모달 열기
- [ ] 업로드 버튼 클릭 시 모달 열기
- [ ] 업로드 플로우 통합
- [ ] 진행률 표시
- [ ] 하단 버튼 변경: "닫기" → "취소", "저장"
- [ ] 업로드 모드 섹션 제거 ("파일명 최적화" / "파일명 유지" 삭제)

## 🔄 변경 이력

### 2026-01-27: 최종 계획 업데이트
- **적용 위치 명확화**: 고객 이미지 관리 페이지 (`pages/admin/customers/index.tsx`)
- **UI 통합 사항 추가**: "갤러리에서 선택" 옆에 "이미지 업로드" 버튼 추가
- **업로드 모드 섹션 제거**: "파일명 최적화" / "파일명 유지" 삭제
- **하단 버튼 변경**: "닫기" → "취소", "저장"
- 고객명 자동 설정 (현재 선택된 고객 사용)

### 2026-01-27: 최종 계획 작성
- 업로드 전 메타데이터 생성 플로우 정의
- 파일명에 s1~s7, artwall, sita, guide 포함
- 골프 AI 생성 / 일반 메타 생성 선택 기능
