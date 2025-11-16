# 다중 이미지 생성 및 관리 가이드

## 개요

카카오톡 콘텐츠 자동 생성 시, 여러 이미지가 생성될 수 있습니다. 이 문서는 생성된 모든 이미지를 관리하고 선택하는 방법을 설명합니다.

## 문제 상황

이전에는 `imageCount: 1`로 설정되어도 실제로는 여러 이미지가 생성될 수 있었고, 첫 번째 이미지만 데이터베이스에 저장되어 다른 이미지들이 누락되는 문제가 있었습니다.

## 해결 방법

### 1. 자동 생성 API 개선

`auto-create-account1.js`와 `auto-create-account2.js`가 다음과 같이 개선되었습니다:

- **모든 이미지 URL 로깅**: 여러 이미지가 생성되면 콘솔에 모든 URL이 출력됩니다
- **결과에 모든 이미지 포함**: API 응답에 `allImageUrls` 배열과 `totalGenerated` 개수가 포함됩니다
- **첫 번째 이미지를 기본값으로 사용**: 기존 동작 유지 (첫 번째 이미지가 기본값)

### 2. 이미지 저장 위치

생성된 모든 이미지는 다음 위치에 저장됩니다:

1. **Supabase Storage**: `originals/daily-branding/kakao/YYYY-MM-DD/account1|account2/background|profile|feed/`
2. **image_metadata 테이블**: 각 이미지의 메타데이터가 자동으로 저장됩니다

### 3. 생성된 이미지 조회 방법

#### 방법 1: image_metadata 테이블에서 조회

```sql
SELECT 
  image_url,
  title,
  description,
  tags,
  created_at
FROM image_metadata
WHERE 
  tags @> ARRAY['카카오톡', '업무폰', '프로필']
  AND tags @> ARRAY['2025-11-14']
ORDER BY created_at DESC;
```

#### 방법 2: 관리자 페이지에서 갤러리 선택

1. `/admin/kakao-content` 페이지 접속
2. 날짜 선택
3. 해당 이미지 섹션에서 "갤러리에서 선택" 버튼 클릭
4. 생성된 이미지 중 원하는 이미지 선택

#### 방법 3: API 응답에서 확인

자동 생성 API 호출 시 응답에 모든 이미지 URL이 포함됩니다:

```json
{
  "success": true,
  "results": {
    "profile": {
      "success": true,
      "imageUrl": "https://.../image1.png",
      "allImageUrls": [
        "https://.../image1.png",
        "https://.../image2.png"
      ],
      "totalGenerated": 2
    }
  }
}
```

## 로깅 예시

여러 이미지가 생성되면 다음과 같은 로그가 출력됩니다:

```
📸 프로필 이미지 2개 생성됨:
  1. https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/daily-branding/kakao/2025-11-14/account2/profile/kakao-account2-profile-1762948824382-1-1.png
  2. https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/daily-branding/kakao/2025-11-14/account2/profile/kakao-account2-profile-1762948825211-1-2.png
✅ 기본값으로 첫 번째 이미지 사용: https://...
💡 다른 이미지를 선택하려면 image_metadata 테이블에서 조회하거나 관리자 페이지에서 갤러리 선택 기능 사용
```

## 권장 워크플로우

1. **자동 생성 실행**: "오늘 날짜 생성" 또는 "전체 자동 생성" 버튼 클릭
2. **로그 확인**: 서버 로그에서 생성된 모든 이미지 URL 확인
3. **이미지 선택**: 
   - 기본값(첫 번째 이미지)이 만족스러우면 그대로 사용
   - 다른 이미지를 원하면 관리자 페이지에서 갤러리 선택 기능 사용
4. **수동 업데이트**: 필요시 Supabase에서 직접 URL 업데이트

## 주의사항

- 모든 이미지는 Supabase Storage에 저장되므로 스토리지 용량을 고려해야 합니다
- `image_metadata` 테이블에 자동으로 저장되므로, 나중에 조회 및 선택이 가능합니다
- 첫 번째 이미지가 기본값으로 사용되지만, 언제든지 다른 이미지로 변경할 수 있습니다

## 향후 개선 사항

- 관리자 페이지에 "생성된 이미지 목록" 표시 기능 추가
- 이미지 선택 UI 개선
- 자동으로 최적의 이미지를 선택하는 AI 기능 추가

