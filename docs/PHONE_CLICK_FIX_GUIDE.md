# 전화번호 클릭 문제 해결 가이드

## 문제 상황
- iframe 내에서 전화번호(`tel:`) 링크가 iOS Safari에서 작동하지 않음
- 취소 버튼 클릭 시 빈 검은 창이 남는 문제

## 해결 방법

### 1. HTML 파일 수정 (이미 완료)
`/public/versions/funnel-2025-07-complete.html`에 다음 스크립트 추가됨:

```javascript
// iframe 내부에서 parent로 메시지 전송
window.parent.postMessage({
    type: 'tel-link',
    phoneNumber: phoneNumber
}, '*');
```

### 2. TSX 파일 수정 (이미 완료)
`/pages/funnel-2025-07.tsx`에 메시지 리스너 추가됨:

```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'tel-link') {
      window.location.href = `tel:${event.data.phoneNumber}`;
    }
  };
  
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

## 주의사항

### window.open() 사용하지 않기
- `window.open()`은 새 창/탭을 생성하여 검은 화면 문제 발생
- 대신 `window.location.href` 사용

### iframe sandbox 속성
iframe에 적절한 권한이 있는지 확인:
```html
<iframe sandbox="allow-same-origin allow-scripts allow-top-navigation">
```

## 테스트 방법

1. iPhone Safari에서 페이지 열기
2. 전화번호 클릭
3. 통화/취소 다이얼로그 확인
4. 취소 클릭 시 원래 페이지로 복귀 확인

## 디버깅

콘솔에서 다음 메시지 확인:
- "iframe에서 전화 걸기: 080-028-8888"
- "전화번호 메시지 수신: 080-028-8888"
