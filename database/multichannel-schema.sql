-- 멀티채널 콘텐츠 관리를 위한 테이블 수정
-- content_ideas 테이블에 플랫폼 필드 추가

-- 플랫폼 필드가 없다면 추가
ALTER TABLE content_ideas ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'blog';

-- 플랫폼별 관리를 위한 enum 타입 생성 (선택사항)
-- CREATE TYPE platform_type AS ENUM ('blog', 'kakao', 'instagram', 'youtube', 'tiktok');

-- 기존 데이터 업데이트 (모두 자사 블로그로 설정)
UPDATE content_ideas SET platform = 'blog' WHERE platform IS NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_content_ideas_platform ON content_ideas(platform);

-- 샘플 데이터 추가
INSERT INTO content_ideas (title, subject, keywords, platform, assignee, status, created_at) VALUES
('여름 골프 필수품 추천', '더위를 이기는 골프 아이템 10선', '여름골프, 골프용품, MASGOLF', 'blog', '제이', 'idea', NOW()),
('MASGOLF 드라이버 언박싱', '신제품 골드3 드라이버 개봉기', '드라이버, 언박싱, MASGOLF', 'youtube', '스테피', 'writing', NOW()),
('시니어 골퍼 이벤트 안내', '7월 특별 할인 이벤트', '이벤트, 할인, 시니어골프', 'kakao', '나과장', 'ready', NOW()),
('드라이버 스윙 꿀팁', '비거리 늘리는 3가지 방법', '스윙팁, 비거리, 골프레슨', 'instagram', '허상원', 'idea', NOW()),
('MASGOLF 챌린지', '비거리 도전 챌린지', '챌린지, 비거리, MASGOLF', 'tiktok', '제이', 'idea', NOW());