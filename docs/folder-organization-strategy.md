# 📁 폴더 구조 단순화 전략

## 🚨 현재 문제점

1. **폴더 구조 복잡**: `derived`, `duplicated`, `originals/blog/2025-09` 등 여러 폴더 혼재
2. **관리 어려움**: 블로그별 이미지를 찾기 어려움
3. **중복 폴더**: 의미 없는 `derived`, `duplicated` 폴더 존재

## ✅ 해결 방안

### 방안 1: 블로그 ID 기반 폴더 구조 (추천)

**구조**:
```
originals/blog/{blog-id}/
  ├── featured.jpg      # 대표이미지
  ├── image-1.jpg      # 본문 이미지 1
  ├── image-2.jpg      # 본문 이미지 2
  └── ...
```

**장점**:
- 블로그별로 이미지가 한 곳에 모임
- 폴더 구조 단순화
- 관리 용이

**단점**:
- 같은 이미지를 여러 블로그에서 사용 시 중복 발생 가능
- 날짜별 정렬이 어려움

**구현**:
```javascript
// 블로그 ID 기반 폴더 생성
const postFolderName = `originals/blog/${post.id}`;
```

---

### 방안 2: 날짜별 + 블로그 ID 하이브리드 (현재 + 개선)

**구조**:
```
originals/blog/YYYY-MM/
  ├── {blog-id}-{image-name}.jpg  # 블로그 ID 포함 파일명
  └── ...
```

**장점**:
- 날짜별 정렬 가능
- 파일명으로 블로그 식별 가능
- 현재 구조와 호환

**단점**:
- 파일명이 길어짐
- 여러 블로그에서 같은 이미지 사용 시 중복 발생

**구현**:
```javascript
// 날짜별 폴더 + 블로그 ID 포함 파일명
const dateFolder = `${year}-${month}`;
const postFolderName = `originals/blog/${dateFolder}`;
const fileName = `${post.id}-${originalFileName}`;
```

---

### 방안 3: UUID 기반 + 메타데이터 참조 (고도화)

**구조**:
```
originals/blog/{uuid}-{seo-name}.jpg  # UUID 기반 고유 파일명
```

**참조**:
```json
// image_metadata 테이블
{
  "id": "uuid-123",
  "original_path": "originals/blog/uuid-123-driver.jpg",
  "blog_posts": [309, 310],  // 여러 블로그에서 사용
  "usage_count": 2
}
```

**장점**:
- 중복 이미지 완전 제거
- 여러 블로그에서 재사용 용이
- 메타데이터로 블로그 연결 관리

**단점**:
- 구현 복잡도 증가
- 메타데이터 관리 필요

---

## 🎯 권장 방안: 블로그 ID 기반 구조 (방안 1)

### 이유:
1. **단순성**: 블로그별로 폴더가 명확히 구분됨
2. **관리 용이**: 특정 블로그 이미지만 쉽게 찾을 수 있음
3. **확장성**: 블로그별 메타데이터 관리 용이

### 구현 계획:

#### 1단계: 기존 이미지 정리 (중복 폴더 제거)
```javascript
// derived, duplicated 폴더의 이미지를 originals로 이동
const cleanupOldFolders = async () => {
  // derived 폴더 → originals/blog로 이동
  // duplicated 폴더 → originals/blog로 이동
  // 루트 폴더 이미지 → originals/blog로 이동
};
```

#### 2단계: 블로그 ID 기반 폴더 생성
```javascript
// organize-images-by-blog.js 수정
const postFolderName = `originals/blog/${post.id}`;
```

#### 3단계: 폴더 정리 UI 추가
- 불필요한 폴더 삭제 기능
- 폴더 병합 기능
- 폴더 구조 시각화

---

## 📝 구현 코드 예시

### 블로그 ID 기반 폴더 생성 (organize-images-by-blog.js)

```javascript
// ✅ 블로그 ID 기반 폴더 구조로 변경
const postDate = post.created_at ? new Date(post.created_at) : new Date();
const postFolderName = `originals/blog/${post.id}`; // 날짜 대신 블로그 ID 사용
```

### 폴더 정리 API (새로 생성)

```javascript
// api/admin/cleanup-folders.js
const cleanupOldFolders = async () => {
  const foldersToRemove = ['derived', 'duplicated'];
  // 각 폴더의 이미지를 originals/blog로 이동 후 폴더 삭제
};
```

---

## 🔄 마이그레이션 계획

### 단계별 마이그레이션:

1. **Phase 1**: 기존 `originals/blog/YYYY-MM` 폴더 유지
2. **Phase 2**: 새 블로그부터 블로그 ID 기반 폴더 사용
3. **Phase 3**: 기존 블로그 이미지를 블로그 ID 폴더로 이동 (선택적)

---

## 💡 최종 권장 사항

**현재 상황**: 블로그 ID 309 (2번 블로그)

**즉시 적용 가능한 해결책**:
1. ✅ 블로그 ID 기반 폴더로 변경: `originals/blog/309/`
2. ✅ 기존 날짜별 폴더 유지 (호환성)
3. ✅ 불필요한 `derived`, `duplicated` 폴더 정리

**장기 해결책**:
- 모든 블로그 이미지를 블로그 ID 기반으로 재정리
- 중복 이미지는 메타데이터로 참조 관리

