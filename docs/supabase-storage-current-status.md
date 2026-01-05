# Supabase Storage 현재 설정 상태

## 📋 현재 설정 확인 (2025-01-29)

### 1. 버킷 설정 (`blog-images`)
- **이름**: `blog-images`
- **공개 버킷**: ✅ PUBLIC
- **파일 크기 제한**: `50 MB` ✅
- **허용된 MIME 타입**: `image/*,video/*` ✅
- **Policies**: ❌ 설정되지 않음

### 2. Global File Size Limit
- **Free Plan**: `50 MB` (고정, 변경 불가)
- **Pro Plan**: `500 GB` (설정 가능)

### 3. 코드 설정
- **`pages/api/upload-image-supabase.js`**: `50 MB` ✅ (버킷 제한에 맞춤)
- **동영상 파일 지원**: ✅ (mp4, avi, mov, webm, mkv, flv, m4v, 3gp, wmv)

### 4. Policies 상태
현재 Supabase 대시보드에서 확인한 결과:
- **Buckets Policies**: "No policies created yet"
- **Schema Policies**: 
  - `storage.objects`: "No policies created yet"
  - `storage.buckets`: "No policies created yet"

⚠️ **주의**: Policies가 설정되지 않아서 업로드/다운로드가 Service Role Key를 통해서만 가능합니다.

## 🔧 권장 조치 사항

### 1. Policies 설정 (선택사항)
Service Role Key를 사용하는 경우 Policies가 없어도 작동하지만, 보안을 위해 설정하는 것을 권장합니다:

```sql
-- 읽기 권한 (모든 사용자)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'blog-images');

-- 업로드 권한 (인증된 사용자 또는 Service Role)
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'blog-images' 
  AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- 업데이트 권한
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'blog-images' 
  AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- 삭제 권한
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'blog-images' 
  AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);
```

### 2. 파일 크기 제한 고려사항
- **현재**: 50MB (버킷 제한) ✅
- **동영상 파일**: 50MB 제한으로 대부분의 동영상 파일 업로드 가능
- **참고**: 
  - 이미지: 50MB 충분
  - 동영상: 50MB는 Free Plan 최대값 (더 큰 파일은 Pro Plan 필요)

### 3. Allowed MIME Types
- **현재**: `image/*,video/*` ✅ (이미지 및 동영상 파일 모두 지원)

## ✅ 확인 완료 사항
- [x] 코드의 파일 크기 제한을 버킷 제한(50MB)에 맞춤
- [x] 동영상 파일 지원 확인
- [x] 버킷 MIME 타입 설정 확인 (`image/*,video/*`)
- [x] Policies 상태 확인
- [x] 버킷 설정 확인

