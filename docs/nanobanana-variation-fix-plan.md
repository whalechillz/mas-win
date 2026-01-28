# 나노바나나 변형 기능 개선 계획

## 요청 사항

1. **배경 변형 시 현재 위치(고객 일자)에 생성**
2. **경로 없음/0바이트 문제 진단**
3. **파일명 최적화**

## 수정 내용

### 1. 배경 변형 시 현재 위치에 생성 ✅

**문제:**
- 배경 변형(`background-only`) 모드일 때 변형된 이미지가 현재 이미지의 고객 폴더와 날짜 폴더에 생성되지 않음

**해결:**
- 원본 이미지의 메타데이터를 조회하여 `file_path` 추출
- `file_path`에 `originals/customers/`가 포함된 경우, 같은 폴더 경로 사용
- 배경 변형 모드일 때도 명시적으로 현재 위치 사용 확인 로그 추가
- `cdn_url`로 찾지 못한 경우 `file_path`로도 조회 시도

**수정 파일:**
- `pages/api/vary-nanobanana.js` (253-279줄)

### 2. 경로 없음/0바이트 문제 진단

**문제:**
- 갤러리에서 "경로 없음" 또는 "0바이트"로 표시되는 이미지 존재
- DB에는 메타데이터가 있지만 Storage 파일이 없거나, `file_path`가 null인 경우

**원인 분석:**
1. **경로 없음 (`folder_path`가 null 또는 빈 문자열)**
   - `all-images.js` API에서 `folder_path: file.folderPath || ''`로 설정
   - Storage 파일의 `folderPath`가 없거나, DB의 `file_path`가 null인 경우
   - 해결: DB와 Storage 동기화 필요

2. **0바이트 (`size`가 0)**
   - `all-images.js` API에서 `size: file.metadata?.size || 0`로 설정
   - Storage 파일의 메타데이터에 `size`가 없거나, 실제 파일 크기가 0인 경우
   - 해결: Storage 파일 존재 여부 확인 및 크기 동기화 필요

**진단 방법:**
- `image_assets` 테이블에서 `file_path`가 null인 레코드 확인
- Storage에서 실제 파일 존재 여부 확인
- 파일 크기 불일치 확인

### 3. 파일명 최적화

**현재 파일명 형식:**
```
{location}-{productName}-{compositionProgram}-{compositionFunction}-{dateStr}-{uniqueNumber}.{extension}
```

**예시:**
- `customers-choitaeseom-8081-nanobanana-background-20260128-01.webp`

**최적화 방안:**
1. **고객 이미지의 경우 날짜 정보 포함 확인**
   - 현재: `dateStr`이 포함되어 있음 (YYYYMMDD 형식)
   - 개선: 원본 이미지의 방문일자(`visit-YYYY-MM-DD`)를 ai_tags에서 추출하여 사용

2. **파일명 길이 최적화**
   - 현재 형식이 너무 길 수 있음
   - 고객 이미지의 경우: `{customerName}-{dateStr}-{compositionFunction}-{uniqueNumber}.{extension}`
   - 예: `choitaeseom-8081-20260128-background-01.webp`

3. **일관성 유지**
   - 모든 변형 모드에서 동일한 파일명 규칙 적용
   - 원본 이미지의 파일명 규칙과 일관성 유지

## 다음 단계

1. ✅ 배경 변형 시 현재 위치에 생성 (완료)
2. ⏳ 경로 없음/0바이트 문제 진단 스크립트 작성
3. ⏳ 파일명 최적화 적용
