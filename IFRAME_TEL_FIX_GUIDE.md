// iframe 전화번호 문제 해결 가이드

## 문제
- iOS Safari는 iframe 내부의 tel: 링크를 보안상 차단합니다.
- 특히 cross-origin iframe의 경우 더욱 제한적입니다.

## 해결 방법

### 방법 1: 이미 적용된 postMessage 방식
HTML 파일에는 이미 postMessage를 보내는 코드가 추가되었습니다.
이제 parent 페이지(TSX)에서 메시지를 받아 처리해야 합니다.

```tsx
// parent 페이지에 추가
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

### 방법 2: 전화번호를 버튼으로 표시하고 parent에서 처리
만약 위 방법이 작동하지 않으면, 전화번호를 버튼으로 만들고 
parent window의 함수를 직접 호출하는 방법도 있습니다.

```javascript
// HTML 파일에 추가
function callPhone(phoneNumber) {
  if (window.parent && window.parent.callPhone) {
    window.parent.callPhone(phoneNumber);
  } else {
    window.location.href = 'tel:' + phoneNumber;
  }
}
```

### 방법 3: 플로팅 버튼을 parent 페이지로 이동
가장 확실한 방법은 플로팅 버튼을 iframe 밖(parent 페이지)에 직접 구현하는 것입니다.

```tsx
// Parent 페이지에 플로팅 버튼 추가
const FloatingPhoneButton = () => {
  return (
    <a 
      href="tel:080-028-8888" 
      className="fixed right-5 bottom-5 bg-red-600 text-white px-6 py-4 rounded-full shadow-lg z-50"
      style={{ zIndex: 9999 }}
    >
      <div className="flex items-center gap-3">
        <span>080-028-8888</span>
        <span className="text-sm">무료 상담</span>
      </div>
    </a>
  );
};
```

## 테스트 방법
1. iPhone Safari에서 페이지 열기
2. 개발자 도구 콘솔 확인 (Mac Safari에서 연결)
3. 콘솔에 다음 메시지가 표시되는지 확인:
   - "iframe 내부에서 실행 중"
   - "전화번호 링크 개수: X"
   - "전화번호 클릭: 080-028-8888"

## 추가 확인사항
1. iframe sandbox 속성에 제한이 없는지 확인
2. Content Security Policy (CSP) 설정 확인
3. parent와 iframe이 같은 도메인인지 확인