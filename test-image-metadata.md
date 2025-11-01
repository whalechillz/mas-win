# 이미지 메타데이터 편집 기능 테스트 가이드

## ✅ 완료된 수정 사항

1. **저장 실패 원인 수정**: rename-image API 응답 형식 불일치 해결
2. **카테고리 다중 선택**: 드롭다운 → 체크박스로 변경
3. **AI 카테고리 자동 조정**: 다중 선택 지원
4. **API 다중 카테고리 지원**: categories 배열 처리 추가

## 📋 테스트 체크리스트

### 1. 카테고리 체크박스 UI 테스트
- [ ] 갤러리 페이지 접속: `https://www.masgolf.co.kr/admin/gallery`
- [ ] 이미지 클릭하여 편집 모달 열기
- [ ] 카테고리 필드가 체크박스 형태로 표시되는지 확인
- [ ] 다음 카테고리들이 모두 표시되는지 확인:
  - 골프코스
  - 젊은 골퍼
  - 시니어 골퍼
  - 스윙
  - 장비
  - 드라이버
  - 드라이버샷
- [ ] 여러 카테고리를 선택할 수 있는지 확인
- [ ] 선택된 카테고리가 하단에 표시되는지 확인 ("선택됨: ...")

### 2. AI 카테고리 자동 선택 테스트
- [ ] 이미지 편집 모달에서 "한글 AI 생성" 버튼 클릭
- [ ] AI가 생성한 메타데이터 확인
- [ ] 카테고리가 자동으로 선택되었는지 확인
- [ ] 여러 카테고리가 선택될 수 있는지 확인 (예: "드라이버" + "스윙")

### 3. 저장 기능 테스트
- [ ] 카테고리 여러 개 선택 (예: "드라이버", "스윙", "장비")
- [ ] 다른 메타데이터 입력 (제목, 설명 등)
- [ ] "저장" 버튼 클릭
- [ ] 저장 성공 메시지 확인
- [ ] 저장 후 다시 같은 이미지 열기
- [ ] 선택했던 카테고리가 유지되는지 확인

### 4. 파일명 변경 저장 테스트
- [ ] 이미지 편집 모달 열기
- [ ] 파일명 변경 (예: "golf-driver-test")
- [ ] 카테고리 선택
- [ ] "저장" 버튼 클릭
- [ ] 저장 성공 확인 (이전에는 404 오류 발생)

### 5. API 테스트

#### 테스트 1: 카테고리 배열 전송
```bash
curl -X POST https://www.masgolf.co.kr/api/admin/image-metadata \
  -H "Content-Type: application/json" \
  -d '{
    "imageName": "test-image.jpg",
    "imageUrl": "https://test.com/image.jpg",
    "alt_text": "테스트 이미지",
    "keywords": ["골프", "드라이버"],
    "title": "테스트 제목",
    "description": "테스트 설명",
    "category": "드라이버,스윙",
    "categories": ["드라이버", "스윙", "장비"]
  }'
```

#### 테스트 2: 단일 카테고리 (하위 호환성)
```bash
curl -X POST https://www.masgolf.co.kr/api/admin/image-metadata \
  -H "Content-Type: application/json" \
  -d '{
    "imageName": "test-image2.jpg",
    "imageUrl": "https://test.com/image2.jpg",
    "alt_text": "테스트 이미지 2",
    "keywords": ["골프"],
    "title": "테스트 제목 2",
    "description": "테스트 설명 2",
    "category": "골프코스"
  }'
```

#### 테스트 3: rename-image API 응답 형식
```bash
curl -X POST https://www.masgolf.co.kr/api/admin/rename-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageId": "test-id",
    "newFileName": "new-filename",
    "currentFileName": "old-filename"
  }'
```

응답 형식 확인:
- ✅ `data.newFileName`, `data.newUrl` (새 형식)
- ✅ `newName`, `newUrl` (하위 호환성)

## 🔍 확인 사항

### 코드 검증 완료
- ✅ FieldGroup 컴포넌트에 체크박스 렌더링 로직 구현됨
- ✅ AI 생성 시 determineCategory 함수가 배열 반환
- ✅ API에서 categories 배열 처리 로직 구현됨
- ✅ rename-image API 응답 형식 수정됨

### 예상 결과
1. 카테고리 체크박스: 7개 옵션이 2열 그리드로 표시
2. AI 자동 선택: 이미지 내용에 따라 여러 카테고리 자동 선택
3. 저장 성공: 카테고리 배열이 올바르게 저장됨
4. 파일명 변경: 404 오류 없이 정상 저장됨

## 🐛 발견된 이슈 (빌드)

- `blog2` 페이지의 localStorage SSR 문제 (현재 작업과 무관)
- 이미지 메타데이터 기능은 정상 컴파일됨

## 📝 다음 단계

1. 로컬 환경에서 수동 테스트 진행
2. 테스트 결과에 따라 추가 수정
3. 배포 준비

