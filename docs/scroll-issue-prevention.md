# 스크롤 문제 재발 방지 가이드

## 문제 발생 원인

### 1. 모달이 body 스크롤을 막고 복구하지 않음

**원인:**
- 모달이 열릴 때 `document.body.style.overflow = 'hidden'` 설정
- 모달이 닫힐 때 `originalOverflow`로 복구하는데, 빈 문자열이면 스크롤이 복구되지 않음
- 인라인 스타일(`document.body.style.overflow`)이 CSS(`overflow-y: auto`)보다 우선순위가 높아 덮어씌워짐

**영향받는 컴포넌트:**
- `components/admin/GalleryPicker.tsx`
- `components/admin/kakao/ImageSelectionModal.tsx`
- 기타 모달 컴포넌트들

### 2. CSS 우선순위 문제

**원인:**
- CSS에서 `overflow-y: auto`를 설정했지만
- JavaScript로 설정한 인라인 스타일이 CSS보다 우선
- 모달이 닫힌 후에도 인라인 스타일이 남아있으면 스크롤 불가

**영향받는 파일:**
- `styles/globals.css`

## 해결 방법

### 1. 모달 스크롤 관리 패턴 (필수)

**올바른 패턴:**
```typescript
useEffect(() => {
  if (isOpen) {
    const originalOverflow = document.body.style.overflow || '';
    document.body.style.overflow = 'hidden';
    
    return () => {
      // ✅ 빈 문자열이면 'auto'로 복구
      document.body.style.overflow = originalOverflow || 'auto';
    };
  }
}, [isOpen]);
```

**잘못된 패턴 (재발 방지):**
```typescript
// ❌ 빈 문자열 체크 없음
const originalOverflow = document.body.style.overflow;
document.body.style.overflow = 'hidden';
return () => {
  document.body.style.overflow = originalOverflow; // 빈 문자열이면 복구 안됨
};
```

### 2. CSS 우선순위 강화 (필수)

**올바른 패턴:**
```css
html, body {
  overflow-y: auto !important; /* 인라인 스타일보다 우선 */
  -webkit-overflow-scrolling: touch !important;
  touch-action: pan-y !important;
}
```

**잘못된 패턴 (재발 방지):**
```css
/* ❌ !important 없으면 인라인 스타일이 덮어씀 */
html, body {
  overflow-y: auto;
}
```

## 새 모달 추가 시 체크리스트

새로운 모달 컴포넌트를 만들 때 다음을 확인하세요:

- [ ] 모달이 열릴 때 body 스크롤 차단
- [ ] 모달이 닫힐 때 스크롤 복구 (`originalOverflow || 'auto'`)
- [ ] `useEffect` cleanup 함수에서 확실히 복구
- [ ] 빈 문자열 체크 포함

## 테스트 방법

1. 모달 열기 → body 스크롤 차단 확인
2. 모달 닫기 → body 스크롤 복구 확인
3. 개발자 도구에서 `document.body.style.overflow` 확인 (빈 문자열이어야 함)
4. 페이지 스크롤 동작 확인

## 관련 파일

- `components/admin/GalleryPicker.tsx` - 올바른 패턴 예시
- `components/admin/kakao/ImageSelectionModal.tsx` - 올바른 패턴 예시
- `styles/globals.css` - CSS 우선순위 강화 예시
