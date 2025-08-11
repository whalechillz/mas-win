# 네이버 블로그 데이터 임포트 가이드

## 1. 엑셀 데이터 준비
엑셀에서 다음 순서로 데이터를 정리하세요:
- A열: 계정명 (mas9golf, massgoogolf, massgoogolfkorea)
- B열: 작성자 (J, 미, 싸)
- C열: 게시일 (2025-07-10 형식)
- D열: 제목
- E열: 글감/주제
- F열: 네이버 URL
- G열: 조회수

## 2. CSV로 저장
- 파일 > 다른 이름으로 저장 > CSV (쉼표로 분리) 선택

## 3. Supabase에서 직접 임포트
1. Supabase 대시보드 접속
2. Table Editor > blog_contents 선택
3. Insert > Import data from CSV
4. 파일 선택 후 매핑:
   - title → D열 (제목)
   - content → E열 (글감)
   - naver_url → F열 (URL)
   - last_view_count → G열 (조회수)
   - author_name → B열 (작성자)
   - scheduled_date → C열 (게시일)
   - content_type → 'blog' (고정값)
   - status → 'published' (고정값)

## 4. 플랫폼 매핑
계정명에 따라 platform_id 설정:
- mas9golf → '네이버 블로그 - 조'의 ID
- massgoogolf → '네이버 블로그 - 미'의 ID  
- massgoogolfkorea → '네이버 블로그 - 싸'의 ID

## 5. SQL로 일괄 업데이트 (선택사항)
```sql
-- 플랫폼 ID 업데이트
UPDATE blog_contents bc
SET platform_id = bp.id
FROM blog_platforms bp
WHERE 
  (bc.content LIKE '%mas9golf%' AND bp.name = '네이버 블로그 - 조') OR
  (bc.content LIKE '%massgoogolf%' AND bp.name = '네이버 블로그 - 미') OR
  (bc.content LIKE '%massgoogolfkorea%' AND bp.name = '네이버 블로그 - 싸');
```
