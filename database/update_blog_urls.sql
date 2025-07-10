-- 네이버 블로그 URL 수정
UPDATE blog_platforms 
SET url = CASE name
    WHEN '네이버 블로그 1' THEN 'https://blog.naver.com/massgoogolf'
    WHEN '네이버 블로그 2' THEN 'https://blog.naver.com/mas9golf'
    WHEN '네이버 블로그 3' THEN 'https://blog.naver.com/massgoogolfkorea'
    ELSE url
END
WHERE type = 'naver';

-- 플랫폼 이름도 더 명확하게 수정 (선택사항)
UPDATE blog_platforms
SET name = CASE url
    WHEN 'https://blog.naver.com/massgoogolf' THEN '네이버 블로그 - 메인'
    WHEN 'https://blog.naver.com/mas9golf' THEN '네이버 블로그 - 서브'
    WHEN 'https://blog.naver.com/massgoogolfkorea' THEN '네이버 블로그 - 코리아'
    ELSE name
END
WHERE type = 'naver';

-- 수정된 내용 확인
SELECT * FROM blog_platforms WHERE type = 'naver';
