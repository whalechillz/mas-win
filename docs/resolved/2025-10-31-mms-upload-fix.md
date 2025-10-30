# MMS 이미지 업로드 에러 핸들링 강화

## 🚨 문제

MMS 이미지 업로드 시 500 Internal Server Error 발생:
```
POST /api/solapi/upload-image/
500 (Internal Server Error)
```

## 🔍 원인

1. **formidable Promise 호환성 문제**: 버전에 따라 Promise를 반환하지 않을 수 있음
2. **JPG 파일 검증 부족**: Solapi MMS는 JPG 파일만 허용하는데 검증이 약함
3. **에러 메시지 불충분**: 어떤 파일 형식이 문제인지 명확하지 않음

## ✅ 해결 방법

### 변경 파일

**pages/api/solapi/upload-image.js**

#### 1. Promise 래퍼로 변환 (formidable 호환성)
```javascript
// 변경 전
const [fields, files] = await form.parse(req);

// 변경 후
const [fields, files] = await new Promise((resolve, reject) => {
  form.parse(req, (err, fields, files) => {
    if (err) reject(err);
    else resolve([fields, files]);
  });
});
```

#### 2. JPG 파일 검증 강화
```javascript
// JPG 파일만 허용 (Solapi MMS 요구사항)
if (!file.mimetype || !['image/jpeg', 'image/jpg'].includes(file.mimetype.toLowerCase())) {
  if (file.filepath) {
    try { fs.unlinkSync(file.filepath); } catch (e) {}
  }
  return res.status(400).json({ 
    success: false, 
    message: 'JPG 형식의 파일만 사용가능합니다.' 
  });
}
```

#### 3. 파일 타입 체크 강화
```javascript
filter: ({ mimetype }) => {
  if (!mimetype) return false;
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  return allowedTypes.includes(mimetype.toLowerCase());
}
```

## 📋 체크리스트

- [x] formidable Promise 래퍼 추가
- [x] JPG 파일 검증 강화
- [x] 에러 메시지 개선
- [x] 임시 파일 정리 로직 추가
- [x] 배포 완료

## 🧪 테스트 방법

1. `/admin/sms` 접속
2. 메시지 타입을 "MMS"로 선택
3. 이미지 업로드 시도:
   - ✅ JPG 파일: 정상 업로드
   - ❌ PNG/GIF 파일: "JPG 형식의 파일만 사용가능합니다." 에러
4. 콘솔에서 에러 메시지 확인

## 📅 적용 일자

2025-10-31

## 📝 참고

- Solapi MMS는 JPG 파일만 지원
- formidable 버전 호환성을 위해 Promise 래퍼 사용
- 에러 발생 시 임시 파일 자동 정리

