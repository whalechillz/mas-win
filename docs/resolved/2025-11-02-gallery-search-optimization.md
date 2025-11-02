# 이미지 갤러리 검색 최적화 - ✅ 해결됨

## 🚨 문제 설명
- 발생 시점: 2025-11-02
- 영향 범위: 이미지 갤러리 관리 페이지 검색 기능
- 우선순위: 중간

### 문제 증상
1. **검색 시 여러 번 로딩**: "마쓰구" 검색 시 한 글자 입력할 때마다 API 호출 발생 (3회)
2. **검색어 입력 표시 문제**: 검색어가 입력 필드에 표시되지 않음
3. **성능 저하**: 불필요한 API 호출로 인한 성능 저하

## 🔍 원인 분석
1. **디바운싱 부재**: 검색어 변경 시 즉시 API 호출 (`onChange`에서 직접 `fetchImages` 호출)
2. **상태 업데이트 타이밍**: `fetchImages`에서 `reset=true`일 때 `searchQuery`를 초기화하는 로직
3. **중복 API 호출**: 폴더 필터 변경 시 `useEffect`와 `onChange` 핸들러 모두에서 API 호출

## 🔧 해결 과정

### 1. 디바운싱 추가
- `useDebounce` 훅을 `components/admin/marketing/PerformanceUtils.tsx`에서 가져와 사용
- 검색어 변경 시 500ms 지연 후 검색 실행

### 2. 검색 로직 개선
- `onChange`에서는 검색어 상태만 업데이트
- `useEffect`에서 디바운스된 검색어가 변경될 때만 API 호출
- Enter 키 입력 시 즉시 검색 (디바운싱 우회)

### 3. 초기 로드 관리
- `initialLoadRef`를 사용하여 초기 마운트 시 한 번만 이미지 로드
- 검색어가 있을 때만 검색 API 호출

## 📝 해결된 코드

### 검색어 디바운싱 추가
```typescript
// pages/admin/gallery.tsx
import { useDebounce } from '../../components/admin/marketing/PerformanceUtils';

// 검색어 디바운싱 (500ms 지연)
const debouncedSearchQuery = useDebounce(searchQuery, 500);

// 디바운스된 검색어가 변경될 때만 검색 실행
useEffect(() => {
  if (initialLoadRef.current) {
    if (debouncedSearchQuery.trim() === '') {
      return; // 초기 로드는 다른 곳에서 처리
    }
  }
  // 디바운스된 검색어가 변경되었을 때만 검색 실행
  fetchImages(1, true, folderFilter, includeChildren, debouncedSearchQuery);
}, [debouncedSearchQuery]);
```

### 검색 입력 필드 개선
```typescript
// pages/admin/gallery.tsx
<input
  type="text"
  value={searchQuery}
  onChange={(e) => {
    const newSearchQuery = e.target.value;
    setSearchQuery(newSearchQuery);
    setCurrentPage(1);
    // 검색어 변경은 디바운싱으로 처리 (onChange에서는 상태만 업데이트)
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      // Enter 키 입력 시 즉시 검색 실행 (디바운싱 우회)
      fetchImages(1, true, folderFilter, includeChildren, searchQuery);
    }
  }}
  placeholder="파일명, ALT 텍스트, 키워드로 검색..."
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>
```

### 초기 로드 관리
```typescript
// pages/admin/gallery.tsx
// 초기 로드 추적을 위한 ref
const initialLoadRef = useRef(true);

// 초기 로드 및 currentPage 변경 시 이미지 로드
useEffect(() => {
  if (initialLoadRef.current) {
    initialLoadRef.current = false;
    // 초기 로드: 검색어 없이 전체 이미지 로드
    fetchImages(1, true);
  } else if (currentPage > 1) {
    // 페이지 변경 시 추가 로드
    fetchImages(currentPage);
  }
}, [currentPage]);
```

## 🧪 테스트 방법

### Playwright 테스트
```bash
node test-search-loading-behavior.js
```

### 테스트 결과
- ✅ API 호출 횟수 감소: 3회 → 1회 (디바운싱 적용)
- ✅ 검색어 입력 필드에 정상 표시
- ✅ Enter 키 입력 시 즉시 검색
- ✅ 검색 결과 정상 표시

## 📊 성능 개선 결과
- **API 호출 횟수**: 3회 → 1회 (66% 감소)
- **검색 반응 시간**: 즉시 → 500ms 지연 (사용자 경험 개선)
- **서버 부하**: 66% 감소

## 📚 관련 문서
- [이미지 갤러리 아키텍처 가이드](./gallery-architecture-principles.md)
- [TSVECTOR 검색 구현](./database/add-tsvector-search.sql)

## ✅ 해결 완료
- 검색 디바운싱 적용
- 검색어 입력 표시 문제 해결
- 초기 로드 관리 개선
- 성능 최적화 완료

---

**해결 날짜**: 2025-11-02  
**해결 담당**: AI Assistant  
**테스트 상태**: ✅ 완료

