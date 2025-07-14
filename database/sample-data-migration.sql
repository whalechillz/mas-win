-- 샘플 데이터 마이그레이션
-- 기존 엑셀 데이터를 simple_blog_posts로 이전

-- 예시 데이터 삽입
INSERT INTO simple_blog_posts (topic, angle, title, account, assignee, publish_time, status, naver_url, view_count, published_at) VALUES
-- 5월 30일 발행된 글들
('평택 중급 골퍼의 MASGOLF 체험', 'review', '[사용자 리뷰] "드라이버는 진화한다" – 평택 중급 골퍼의 MASGOLF 골드2 시타 체험기', 'mas9golf', 'J', '09:00', 'published', 'https://blog.naver.com/mas9golf/223883189153', 9, '2025-05-30 09:00:00'),
('평택 중급 골퍼의 MASGOLF 체험', 'tip', '비거리 극대화 시니어 골퍼 고반발 드라이버 재구매 후기', 'massgoogolf', 'S', '14:00', 'published', 'https://blog.naver.com/massgoogolf/223883090973', 26, '2025-05-30 14:00:00'),
('평택 중급 골퍼의 MASGOLF 체험', 'comparison', '[고객 스토리] MASGOLF 시타존에서 만난 평택 고객님의 특별한 드라이버 비교 체험기', 'massgoogolfkorea', 'J', '19:00', 'published', 'https://blog.naver.com/massgoogolfkorea/223883142657', 3, '2025-05-30 19:00:00'),

-- 작성 중인 글들
('시니어 골퍼를 위한 드라이버 선택 가이드', 'review', '[실제 후기] 시니어 골퍼를 위한 드라이버 선택 가이드', 'mas9golf', '조', '09:00', 'writing', NULL, 0, NULL),
('시니어 골퍼를 위한 드라이버 선택 가이드', 'tip', '[전문가 팁] 시니어 골퍼를 위한 드라이버 선택 가이드', 'massgoogolf', '조', '14:00', 'idea', NULL, 0, NULL),
('시니어 골퍼를 위한 드라이버 선택 가이드', 'comparison', '[비교 분석] 시니어 골퍼를 위한 드라이버 선택 가이드', 'massgoogolfkorea', '조', '19:00', 'idea', NULL, 0, NULL);