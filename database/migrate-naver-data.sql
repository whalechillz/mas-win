-- 기존 엑셀 데이터를 새 구조로 임포트하는 예시

-- 1. 마스터 콘텐츠 추가
INSERT INTO naver_content_master (title, topic, created_by) VALUES
('[사용자 리뷰] "드라이버는 진화한다" – 평택 중급 골퍼의 MASGOLF 골드2 시타 체험기', '박영구 후기', 'J'),
('비거리 극대화 시니어 골퍼 고반발 드라이버 재구매 후기', '박영구 후기', 'S'),
('[고객 스토리] MASGOLF 시타존에서 만난 평택 고객님의 특별한 드라이버 비교 체험기', '박영구 후기', 'J');

-- 2. 각 계정별 발행 기록 추가
-- 첫 번째 글감에 대한 3개 계정 발행
INSERT INTO naver_posts (master_id, account, title, publish_date, naver_url, view_count, status) VALUES
(1, 'mas9golf', '[사용자 리뷰] "드라이버는 진화한다" – 평택 중급 골퍼의 MASGOLF 골드2 시타 체험기', '2025-05-30 09:00:00', 'https://blog.naver.com/mas9golf/223883189153', 9, 'published'),
(1, 'massgoogolf', '드라이버는 진화한다! 평택 골퍼의 MASGOLF 골드2 체험기', '2025-05-30 11:00:00', NULL, 0, 'planned'),
(1, 'massgoogolfkorea', 'MASGOLF 골드2 드라이버 체험기 - 평택 중급 골퍼의 솔직 리뷰', '2025-05-30 13:00:00', NULL, 0, 'planned');
