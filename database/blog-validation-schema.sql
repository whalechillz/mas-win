-- 블로그 검증 시스템 추가 테이블

-- 블로그 포스트 정보
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES generated_contents(id),
  blog_url TEXT NOT NULL,
  title TEXT,
  author VARCHAR(255),
  published_at TIMESTAMP,
  last_checked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blog_url)
);

-- 블로그 검증 규칙 설정
CREATE TABLE blog_validation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'keyword', 'length', 'media', 'location', 'negative_words'
  config JSONB NOT NULL,
  weight INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 블로그 검증 결과 상세
CREATE TABLE blog_validation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_post_id UUID REFERENCES blog_posts(id),
  validation_date TIMESTAMP DEFAULT NOW(),
  total_score INTEGER,
  grade VARCHAR(10), -- 'A', 'B', 'C', 'D'
  seo_score INTEGER,
  readability_score INTEGER,
  brand_consistency_score INTEGER,
  channel_optimization_score INTEGER,
  details JSONB,
  suggestions TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- 키워드 사전 (캠페인별 필수 키워드)
CREATE TABLE campaign_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID,
  keyword VARCHAR(100) NOT NULL,
  keyword_type VARCHAR(50), -- 'primary', 'secondary', 'lsi'
  min_frequency INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 금지어/부정어 사전
CREATE TABLE prohibited_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word VARCHAR(100) NOT NULL,
  word_type VARCHAR(50), -- 'negative', 'competitor', 'prohibited'
  severity VARCHAR(20), -- 'critical', 'warning', 'info'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(word)
);

-- 직원 블로그 성과 추적
CREATE TABLE employee_blog_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(255) NOT NULL,
  employee_name VARCHAR(255),
  blog_post_id UUID REFERENCES blog_posts(id),
  validation_score INTEGER,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 기본 검증 규칙 삽입
INSERT INTO blog_validation_rules (rule_name, rule_type, config, weight) VALUES
('제목 키워드 포함', 'keyword', '{"location": "title", "min_count": 1}', 10),
('본문 키워드 빈도', 'keyword', '{"location": "content", "min_count": 3}', 10),
('최소 글자수', 'length', '{"min_chars": 1000}', 15),
('이미지 개수', 'media', '{"type": "image", "min_count": 15}', 15),
('동영상 포함', 'media', '{"type": "video", "min_count": 1, "min_duration": 15}', 10),
('매장 정보', 'location', '{"required": ["map", "address", "phone"]}', 15),
('부정어 사용', 'negative_words', '{"severity": "critical"}', 10),
('SEO 최적화', 'seo', '{"check_meta": true, "check_alt": true}', 15);

-- 샘플 금지어 추가
INSERT INTO prohibited_words (word, word_type, severity) VALUES
('별로', 'negative', 'warning'),
('실망', 'negative', 'critical'),
('나쁘다', 'negative', 'critical'),
('불만', 'negative', 'critical'),
('싫다', 'negative', 'warning');
