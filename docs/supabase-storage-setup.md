# Supabase Storage 설정 가이드

## 1. Supabase 대시보드에서 Storage 버킷 생성

### 단계 1: Storage 섹션으로 이동
1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Storage** 클릭

### 단계 2: 새 버킷 생성
1. **"New bucket"** 버튼 클릭
2. 버킷 설정:
   - **Name**: `blog-images`
   - **Public bucket**: ✅ 체크 (공개 버킷으로 설정)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: `image/*`

### 단계 3: RLS 정책 설정
버킷 생성 후 **Policies** 탭에서 다음 정책들을 추가:

#### 정책 1: 읽기 권한 (모든 사용자)
```sql
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'blog-images');
```

#### 정책 2: 업로드 권한 (인증된 사용자)
```sql
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
);
```

#### 정책 3: 업데이트 권한 (인증된 사용자)
```sql
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
);
```

#### 정책 4: 삭제 권한 (인증된 사용자)
```sql
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
);
```

## 2. 환경 변수 확인

`.env.local` 파일에 다음 변수들이 설정되어 있는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 3. 테스트 방법

1. 개발 서버 실행: `npm run dev`
2. 관리자 페이지 접속: `http://localhost:3000/admin/blog`
3. 이미지 업로드 테스트
4. Supabase Storage에서 업로드된 파일 확인

## 4. 문제 해결

### 일반적인 오류들:

1. **"Bucket not found"**
   - 버킷 이름이 정확히 `blog-images`인지 확인
   - Supabase 프로젝트가 올바른지 확인

2. **"Permission denied"**
   - RLS 정책이 올바르게 설정되었는지 확인
   - Service Role Key가 올바른지 확인

3. **"File too large"**
   - 파일 크기가 10MB 이하인지 확인
   - 버킷의 파일 크기 제한 확인

## 5. 이미지 최적화 기능

업로드된 이미지는 자동으로 최적화됩니다:
- 최대 크기: 1200x800px
- 품질: 85%
- 포맷: JPEG
- Progressive JPEG 적용
