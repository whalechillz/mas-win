## 7월 퍼널 이미지 경로 수정 작업 (2025-08-01)

### 변경 사항
1. 이미지 경로 변경: /temp/ → /gifts/
2. 파일명 변경:
   - 쿨링타올.jpeg → cooling-towel.jpeg
   - 쿨토시.jpg → cooling-sleeve.jpg
   - SALUTE21-01.jpg (유지)
   - SALUTE21-02.png (유지)

### 수정된 파일
- /public/versions/funnel-2025-07-complete.html

### 변경된 이미지 경로
```html
<!-- 변경 전 -->
<img src="/temp/쿨링타올.jpeg" alt="프리미엄 쿨링타올">
<img src="/temp/쿨토시.jpg" alt="스포츠 쿨토시">
<img src="/temp/SALUTE21-01.jpg" alt="고급 위스키">
<img src="/temp/SALUTE21-02.png" alt="고급 위스키">

<!-- 변경 후 -->
<img src="/gifts/cooling-towel.jpeg" alt="프리미엄 쿨링타올">
<img src="/gifts/cooling-sleeve.jpg" alt="스포츠 쿨토시">
<img src="/gifts/SALUTE21-01.jpg" alt="고급 위스키">
<img src="/gifts/SALUTE21-02.png" alt="고급 위스키">
```

### 주의사항
- 실제 이미지 파일들을 /public/gifts/ 폴더로 업로드해야 함
- 파일명 변경 시 확장자 주의 (.jpeg vs .jpg)
