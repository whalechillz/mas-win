# 갤러리 이미지 자산 관리 시스템

## 📋 개요

모든 이미지 자산을 체계적으로 관리하는 시스템입니다. 원본 보존, 참조 기반 재사용, 채널별 베리에이션 생성 원칙을 따릅니다.

## 📍 위치

- **페이지**: `pages/admin/gallery.tsx`
- **문서**: `docs/gallery-complete-system-guide.md`
- **스키마**: `database/gallery-storage-schema.sql`

## 🎯 핵심 원칙

1. **원본 보존 원칙 (Single Source of Truth)**
   - 모든 이미지는 `originals/` 폴더에 한 곳에만 물리적으로 존재
   - 중복 제거, 일관성 유지, 저장 공간 절약

2. **참조 기반 재사용 원칙**
   - 여러 곳에서 사용해도 원본은 복사하지 않고 메타데이터로 참조
   - 파일 복사 없음, 일관성 유지, 업데이트 용이

3. **채널별 베리에이션 생성 원칙**
   - 원본은 절대 이동/삭제하지 않음
   - 베리에이션만 `variants/` 폴더에 생성
   - 메타데이터에 원본 경로 항상 저장

## 📁 Storage 구조

```
masgolf-images/
├── originals/                    # 원본 이미지 (물리적 파일)
│   ├── blog/                     # 블로그 이미지
│   │   ├── 2025-01/               # 날짜별 폴더
│   │   └── 2025-02/
│   ├── products/                 # 제품 이미지
│   ├── locations/                # 매장 이미지
│   ├── customers/                # 고객 콘텐츠
│   └── kakao/                    # 카카오톡 이미지 (신규)
│       ├── profile/              # 프로필 이미지
│       │   ├── account1/          # 대표폰 (골드톤)
│       │   └── account2/          # 업무폰 (블랙톤)
│       └── feed/                 # 피드 이미지
│           ├── account1/
│           └── account2/
├── variants/                     # 채널별 최적화 버전
│   └── {image-uuid}/
│       ├── webp/                 # WebP 변환
│       └── jpg/                   # JPG 변환
└── references/                   # 참조 메타데이터
    └── blog/
```

## 💻 사용 방법

### 이미지 업로드

```typescript
// pages/admin/gallery.tsx 참조
const handleImageUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'kakao/profile/account1'); // 카카오톡용 폴더
  
  const res = await fetch('/api/admin/upload-image', {
    method: 'POST',
    body: formData
  });
  
  const data = await res.json();
  return data.imageUrl;
};
```

### 이미지 선택 (갤러리에서)

```typescript
// 갤러리 컴포넌트 사용
import GalleryAdmin from '@/pages/admin/gallery';

// 또는 이미지 선택 모달만 사용
const ImageSelector = ({ onSelect }) => {
  const [images, setImages] = useState([]);
  
  useEffect(() => {
    fetch('/api/admin/all-images?folder=kakao/profile/account1')
      .then(res => res.json())
      .then(data => setImages(data.images));
  }, []);
  
  return (
    <div className="grid grid-cols-4 gap-4">
      {images.map(img => (
        <img
          key={img.id}
          src={img.url}
          onClick={() => onSelect(img)}
          className="cursor-pointer"
        />
      ))}
    </div>
  );
};
```

### 이미지 메타데이터 관리

```typescript
// 이미지 메타데이터 조회
const getImageMetadata = async (imageId: string) => {
  const res = await fetch(`/api/admin/image-metadata/${imageId}`);
  const data = await res.json();
  return data;
};

// 사용 위치 추적
const getImageUsage = async (imageId: string) => {
  const res = await fetch(`/api/admin/image-usage-tracker?imageId=${imageId}`);
  const data = await res.json();
  return data.usage; // 사용된 위치 목록
};
```

## 🔄 카카오톡 콘텐츠에 적용

### 프로필 이미지 관리

```typescript
// 카카오톡 프로필 이미지 업로드
const uploadProfileImage = async (file: File, account: 'account1' | 'account2') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', `kakao/profile/${account}`);
  formData.append('metadata', JSON.stringify({
    account: account === 'account1' ? '010-6669-9000' : '010-5704-0013',
    type: 'profile',
    tone: account === 'account1' ? 'gold' : 'black'
  }));
  
  const res = await fetch('/api/admin/upload-image', {
    method: 'POST',
    body: formData
  });
  
  return await res.json();
};
```

### 피드 이미지 관리

```typescript
// 카카오톡 피드 이미지 업로드
const uploadFeedImage = async (file: File, account: 'account1' | 'account2', category: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', `kakao/feed/${account}`);
  formData.append('metadata', JSON.stringify({
    account: account === 'account1' ? '010-6669-9000' : '010-5704-0013',
    type: 'feed',
    category: category, // '젊은 골퍼의 스윙', '매장의 모습' 등
    tone: account === 'account1' ? 'gold' : 'black'
  }));
  
  const res = await fetch('/api/admin/upload-image', {
    method: 'POST',
    body: formData
  });
  
  return await res.json();
};
```

### 이미지 선택 컴포넌트

```typescript
// components/admin/kakao/ImageSelector.tsx
import { useState, useEffect } from 'react';

interface ImageSelectorProps {
  account: 'account1' | 'account2';
  type: 'profile' | 'feed';
  category?: string;
  onSelect: (image: any) => void;
}

export default function ImageSelector({ account, type, category, onSelect }: ImageSelectorProps) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const folder = `kakao/${type}/${account}${category ? `/${category}` : ''}`;
    
    fetch(`/api/admin/all-images?folder=${folder}`)
      .then(res => res.json())
      .then(data => {
        setImages(data.images || []);
        setLoading(false);
      });
  }, [account, type, category]);
  
  if (loading) return <div>로딩 중...</div>;
  
  return (
    <div className="grid grid-cols-4 gap-4">
      {images.map(img => (
        <div
          key={img.id}
          onClick={() => onSelect(img)}
          className="cursor-pointer border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-500"
        >
          <img src={img.url} alt={img.alt_text || img.filename} />
        </div>
      ))}
    </div>
  );
}
```

## 🔗 관련 파일

- `pages/admin/gallery.tsx` - 갤러리 관리 페이지
- `docs/gallery-complete-system-guide.md` - 완전 가이드
- `docs/gallery-architecture-principles.md` - 아키텍처 원칙
- `database/gallery-storage-schema.sql` - 데이터베이스 스키마

## 📚 참고 문서

- [갤러리 관리 시스템 완전 가이드](../gallery-complete-system-guide.md)
- [갤러리 아키텍처 원칙](../gallery-architecture-principles.md)
- [카카오톡 콘텐츠 시스템](../phases/detailed-plans/phase-14-kakao-content-system.md)


