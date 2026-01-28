# 이미지 메타데이터 오버레이 표시 기능 구현 계획

## 📋 개요

이미지 클릭 시 해당 이미지의 메타데이터를 이미지 위에 배경처럼 오버레이하여 표시하고, 가독성을 높이기 위한 명암 처리를 적용합니다.

## 🎯 목표

1. **이미지 클릭 시 확대 보기**: 이미지를 클릭하면 전체 화면 또는 모달 형태로 확대 표시
2. **메타데이터 오버레이**: 확대된 이미지 위에 핵심 메타데이터를 자연스럽게 오버레이
3. **가독성 향상**: 텍스트 뒷면에 명암 처리(반투명 배경 + 텍스트 그림자)로 가독성 극대화
4. **심플한 정보**: 핵심 메타데이터만 간결하게 표시

## 📝 구현 계획

### Phase 1: 이미지 확대 모달 수정

**파일**: `pages/admin/customers/index.tsx`

**현재 상태**:
- `selectedImageUrl` 상태로 이미지 확대 표시 중
- 이미지 클릭 시 `setSelectedImageUrl(imageUrl)` 호출
- 전체 화면 모달로 이미지만 표시

**수정 내용**:
1. 이미지 메타데이터를 함께 저장할 상태 추가
   ```tsx
   const [selectedImageMetadata, setSelectedImageMetadata] = useState<any | null>(null);
   ```

2. 이미지 클릭 핸들러 수정
   - 이미지 URL뿐만 아니라 해당 이미지의 메타데이터 객체도 함께 저장
   - `loadCustomerImages`에서 로드된 이미지 배열에서 클릭된 이미지의 메타데이터 찾기

3. 확대 모달에 메타데이터 오버레이 컴포넌트 통합

### Phase 2: ImageMetadataOverlay 컴포넌트 생성

**파일**: `components/admin/ImageMetadataOverlay.tsx` (신규)

**기능**:
- 이미지 위에 절대 위치로 오버레이 표시
- 핵심 메타데이터만 간결하게 표시
- 가독성을 위한 명암 처리

**표시할 메타데이터 (심플한 내용)**:
- **제목** (`title`)
- **ALT 텍스트** (`alt_text`) - 간략화
- **키워드** (`ai_tags`) - 주요 태그만
- **파일명** (`filename` 또는 `original_filename`)
- **방문일자** (`visit_date` 또는 `ai_tags`에서 추출)

**스타일링**:
- 이미지 하단에 배치 (`absolute bottom-0 left-0 right-0`)
- 그라데이션 배경 (`bg-gradient-to-t from-black/80 to-transparent`)
- 각 텍스트 항목에 반투명 배경 (`bg-black/50` 또는 `bg-black/60`)
- 텍스트 그림자 (`drop-shadow-md` 또는 커스텀 `text-shadow`)
- 흰색 텍스트 (`text-white`)

**컴포넌트 구조**:
```tsx
interface ImageMetadataOverlayProps {
  metadata: {
    title?: string;
    alt_text?: string;
    ai_tags?: string[];
    filename?: string;
    original_filename?: string;
    description?: string;
    visit_date?: string;
  };
  show?: boolean; // 오버레이 표시 여부 (토글 가능)
}

const ImageMetadataOverlay: React.FC<ImageMetadataOverlayProps> = ({ metadata, show = true }) => {
  if (!show || !metadata) return null;

  // 키워드 간소화 (주요 태그만 추출)
  const mainTags = metadata.ai_tags?.filter(tag => 
    !tag.startsWith('customer-') && 
    !tag.startsWith('visit-') && 
    !tag.startsWith('scene-') && 
    !tag.startsWith('type-')
  ).slice(0, 5) || [];

  // 방문일자 추출
  const visitDate = metadata.visit_date || 
    metadata.ai_tags?.find(tag => tag.startsWith('visit-'))?.replace('visit-', '') || 
    '';

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 하단 그라데이션 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent h-48" />
      
      {/* 메타데이터 텍스트 */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
        {/* 제목 */}
        {metadata.title && (
          <div className="bg-black/60 backdrop-blur-sm rounded px-3 py-2">
            <h3 className="text-lg font-bold text-white drop-shadow-lg">
              {metadata.title}
            </h3>
          </div>
        )}
        
        {/* ALT 텍스트 (간략화) */}
        {metadata.alt_text && (
          <div className="bg-black/60 backdrop-blur-sm rounded px-3 py-1.5">
            <p className="text-sm text-white/90 drop-shadow-md line-clamp-2">
              {metadata.alt_text.length > 100 
                ? metadata.alt_text.substring(0, 100) + '...' 
                : metadata.alt_text}
            </p>
          </div>
        )}
        
        {/* 키워드 */}
        {mainTags.length > 0 && (
          <div className="bg-black/60 backdrop-blur-sm rounded px-3 py-1.5">
            <p className="text-xs text-white/80 drop-shadow-md">
              <span className="font-semibold">태그:</span> {mainTags.join(', ')}
            </p>
          </div>
        )}
        
        {/* 파일명 및 방문일자 */}
        <div className="bg-black/60 backdrop-blur-sm rounded px-3 py-1.5 flex items-center justify-between">
          <span className="text-xs text-white/70 drop-shadow-md">
            {metadata.filename || metadata.original_filename}
          </span>
          {visitDate && (
            <span className="text-xs text-white/70 drop-shadow-md">
              {visitDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
```

### Phase 3: CustomerImageModal 통합

**파일**: `pages/admin/customers/index.tsx`

**수정 내용**:

1. **상태 추가**:
   ```tsx
   const [selectedImageMetadata, setSelectedImageMetadata] = useState<any | null>(null);
   ```

2. **이미지 클릭 핸들러 수정**:
   ```tsx
   const handleImageClick = (imageUrl: string, imageMetadata?: any) => {
     setSelectedImageUrl(imageUrl);
     setSelectedImageFileName(imageMetadata?.filename || imageMetadata?.original_filename || null);
     setSelectedImageMetadata(imageMetadata || null);
   };
   ```

3. **이미지 렌더링 부분 수정**:
   - `MediaRenderer` 또는 이미지 썸네일 클릭 시 `handleImageClick` 호출
   - 이미지 메타데이터 객체 전달

4. **확대 모달에 오버레이 통합**:
   ```tsx
   {selectedImageUrl && (
     <div 
       className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center p-4"
       onClick={() => {
         setSelectedImageUrl(null);
         setSelectedImageFileName(null);
         setSelectedImageMetadata(null);
       }}
     >
       <div className="relative max-w-6xl w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
         <img
           src={selectedImageUrl}
           alt={selectedImageFileName || '확대 이미지'}
           className="max-w-full max-h-full object-contain"
         />
         
         {/* 메타데이터 오버레이 */}
         {selectedImageMetadata && (
           <ImageMetadataOverlay metadata={selectedImageMetadata} />
         )}
         
         {/* 닫기 버튼 */}
         <button
           onClick={() => {
             setSelectedImageUrl(null);
             setSelectedImageFileName(null);
             setSelectedImageMetadata(null);
           }}
           className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10 bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
         >
           ×
         </button>
       </div>
     </div>
   )}
   ```

### Phase 4: 이미지 클릭 이벤트 연결

**수정 위치**: `pages/admin/customers/index.tsx` - 이미지 그리드 렌더링 부분

**수정 내용**:
- `MediaRenderer` 또는 이미지 썸네일의 `onClick` 이벤트에 `handleImageClick` 연결
- 이미지 메타데이터 객체를 함께 전달

**예시**:
```tsx
<MediaRenderer
  url={image.image_url || image.cdn_url}
  alt={image.filename || image.original_filename}
  className="w-full h-full object-cover cursor-pointer"
  onClick={() => handleImageClick(
    image.image_url || image.cdn_url,
    image // 전체 이미지 메타데이터 객체 전달
  )}
  showControls={false}
/>
```

## 🎨 스타일 가이드라인

### 명암 처리 방법

1. **배경 그라데이션**: 
   - `bg-gradient-to-t from-black/80 via-black/50 to-transparent`
   - 이미지 하단에서 위로 갈수록 투명해지는 그라데이션

2. **텍스트 배경 박스**:
   - 각 메타데이터 항목마다 `bg-black/60 backdrop-blur-sm` 적용
   - 반투명 검은색 배경 + 블러 효과로 가독성 향상

3. **텍스트 그림자**:
   - `drop-shadow-lg`, `drop-shadow-md` 사용
   - 또는 커스텀 CSS: `text-shadow: 0 2px 4px rgba(0,0,0,0.8)`

4. **텍스트 색상**:
   - 주 텍스트: `text-white`
   - 보조 텍스트: `text-white/90`, `text-white/80`, `text-white/70`

### 레이아웃

- **위치**: 이미지 하단 (`absolute bottom-0`)
- **패딩**: `p-4` (16px)
- **간격**: `space-y-2` (항목 간 8px)
- **최대 높이**: 오버레이 영역 `h-48` (192px)로 제한하여 이미지 가림 최소화

## 📁 변경 파일 목록

1. **신규 파일**:
   - `components/admin/ImageMetadataOverlay.tsx`

2. **수정 파일**:
   - `pages/admin/customers/index.tsx`
     - `selectedImageMetadata` 상태 추가
     - `handleImageClick` 함수 수정
     - 이미지 클릭 이벤트 연결
     - 확대 모달에 `ImageMetadataOverlay` 통합

3. **문서 업데이트**:
   - `docs/project_plan.md`

## ✅ 구현 체크리스트

- [ ] `ImageMetadataOverlay` 컴포넌트 생성
- [ ] 메타데이터 필터링 로직 (핵심 정보만 추출)
- [ ] 명암 처리 스타일링 적용
- [ ] `CustomerImageModal`에 상태 추가
- [ ] 이미지 클릭 핸들러 수정
- [ ] 확대 모달에 오버레이 통합
- [ ] 이미지 그리드에서 클릭 이벤트 연결
- [ ] 반응형 디자인 검토
- [ ] 키보드 접근성 (ESC 키로 닫기)
- [ ] 테스트 및 개선

## 🔍 추가 고려사항

1. **오버레이 토글**: 사용자가 오버레이를 숨기고 보이게 할 수 있는 옵션 추가 가능
2. **애니메이션**: 오버레이가 나타날 때 페이드인 효과 추가
3. **반응형**: 모바일에서도 가독성 유지
4. **접근성**: 스크린 리더 지원 (`aria-label` 등)
