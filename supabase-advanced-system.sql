-- 최고의 시스템 4단계를 위한 Supabase 테이블들

-- 1. 학습 피드백 테이블
CREATE TABLE IF NOT EXISTS learning_feedback (
  id TEXT PRIMARY KEY,
  content_title TEXT NOT NULL,
  predicted_category TEXT NOT NULL,
  actual_category TEXT,
  user_feedback TEXT NOT NULL CHECK (user_feedback IN ('correct', 'incorrect', 'partially_correct')),
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  keywords TEXT[] DEFAULT '{}',
  reasoning TEXT,
  user_suggestions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 학습 개선사항 테이블
CREATE TABLE IF NOT EXISTS learning_improvements (
  id TEXT PRIMARY KEY,
  feedback_id TEXT REFERENCES learning_feedback(id),
  category TEXT NOT NULL,
  issue TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  keywords_to_add TEXT[] DEFAULT '{}',
  confidence_threshold DECIMAL(3,2) DEFAULT 0.8,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_at TIMESTAMP WITH TIME ZONE
);

-- 3. 고급 프리셋 테이블
CREATE TABLE IF NOT EXISTS advanced_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night')),
  season TEXT CHECK (season IN ('spring', 'summer', 'autumn', 'winter')),
  mood TEXT CHECK (mood IN ('professional', 'casual', 'elegant', 'cozy', 'energetic')),
  lighting TEXT CHECK (lighting IN ('natural', 'warm', 'cool', 'dramatic', 'soft', 'bright')),
  color_scheme TEXT CHECK (color_scheme IN ('warm', 'cool', 'neutral', 'vibrant')),
  style TEXT CHECK (style IN ('modern', 'classic', 'minimalist', 'luxurious', 'casual', 'professional')),
  brand_strategy JSONB NOT NULL,
  ai_settings JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 배치 작업 테이블
CREATE TABLE IF NOT EXISTS batch_jobs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  urls TEXT[] NOT NULL,
  settings JSONB NOT NULL,
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'processing', 'completed', 'failed', 'cancelled')),
  progress JSONB DEFAULT '{"total": 0, "completed": 0, "failed": 0, "current": null}',
  results JSONB DEFAULT '[]',
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 기본 고급 프리셋 데이터 삽입
INSERT INTO advanced_presets (id, name, description, category, time_of_day, mood, lighting, color_scheme, style, brand_strategy, ai_settings, is_default) VALUES
-- 골프 프리셋들
('golf_morning_energetic', '골프 아침 라운드', '아침 골프 라운드용 에너지 넘치는 프리셋', 'golf', 'morning', 'energetic', 'natural', 'warm', 'professional', 
 '{"customerPersona": "early_bird_golfer", "brandWeight": "medium", "audienceTemperature": "warm"}',
 '{"defaultModel": "fal", "imageCount": 1, "quality": "high"}', true),

('golf_afternoon_professional', '골프 오후 라운드', '오후 골프 라운드용 전문적인 프리셋', 'golf', 'afternoon', 'professional', 'natural', 'neutral', 'classic',
 '{"customerPersona": "competitive_maintainer", "brandWeight": "high", "audienceTemperature": "neutral"}',
 '{"defaultModel": "fal", "imageCount": 1, "quality": "high"}', true),

('golf_evening_elegant', '골프 저녁 라운드', '저녁 골프 라운드용 우아한 프리셋', 'golf', 'evening', 'elegant', 'warm', 'warm', 'luxurious',
 '{"customerPersona": "premium_golfer", "brandWeight": "high", "audienceTemperature": "warm"}',
 '{"defaultModel": "fal", "imageCount": 1, "quality": "high"}', true),

-- 식당 프리셋들
('restaurant_morning_cozy', '아침 식사', '아침 식사용 아늑한 프리셋', 'restaurant', 'morning', 'cozy', 'soft', 'warm', 'casual',
 '{"customerPersona": "food_lover", "brandWeight": "low", "audienceTemperature": "warm"}',
 '{"defaultModel": "fal", "imageCount": 1, "quality": "high"}', true),

('restaurant_afternoon_professional', '점심 식사', '점심 식사용 전문적인 프리셋', 'restaurant', 'afternoon', 'professional', 'natural', 'neutral', 'modern',
 '{"customerPersona": "business_diner", "brandWeight": "medium", "audienceTemperature": "neutral"}',
 '{"defaultModel": "fal", "imageCount": 1, "quality": "high"}', true),

('restaurant_evening_elegant', '저녁 식사', '저녁 식사용 우아한 프리셋', 'restaurant', 'evening', 'elegant', 'dramatic', 'warm', 'luxurious',
 '{"customerPersona": "fine_dining_lover", "brandWeight": "high", "audienceTemperature": "warm"}',
 '{"defaultModel": "fal", "imageCount": 1, "quality": "high"}', true),

-- 여행 프리셋들
('travel_morning_energetic', '아침 여행', '아침 여행용 에너지 넘치는 프리셋', 'travel', 'morning', 'energetic', 'natural', 'vibrant', 'modern',
 '{"customerPersona": "adventure_seeker", "brandWeight": "low", "audienceTemperature": "warm"}',
 '{"defaultModel": "fal", "imageCount": 1, "quality": "high"}', true),

('travel_afternoon_casual', '오후 여행', '오후 여행용 캐주얼 프리셋', 'travel', 'afternoon', 'casual', 'natural', 'neutral', 'casual',
 '{"customerPersona": "leisure_traveler", "brandWeight": "low", "audienceTemperature": "neutral"}',
 '{"defaultModel": "fal", "imageCount": 1, "quality": "high"}', true),

('travel_evening_cozy', '저녁 여행', '저녁 여행용 아늑한 프리셋', 'travel', 'evening', 'cozy', 'warm', 'warm', 'classic',
 '{"customerPersona": "relaxation_seeker", "brandWeight": "low", "audienceTemperature": "warm"}',
 '{"defaultModel": "fal", "imageCount": 1, "quality": "high"}', true);

-- RLS (Row Level Security) 설정
ALTER TABLE learning_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE advanced_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 설정 (관리자 전용이므로)
CREATE POLICY "Enable all access for learning_feedback" ON learning_feedback FOR ALL USING (true);
CREATE POLICY "Enable all access for learning_improvements" ON learning_improvements FOR ALL USING (true);
CREATE POLICY "Enable all access for advanced_presets" ON advanced_presets FOR ALL USING (true);
CREATE POLICY "Enable all access for batch_jobs" ON batch_jobs FOR ALL USING (true);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_learning_feedback_category ON learning_feedback(predicted_category);
CREATE INDEX IF NOT EXISTS idx_learning_feedback_created_at ON learning_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_advanced_presets_category ON advanced_presets(category);
CREATE INDEX IF NOT EXISTS idx_advanced_presets_time_of_day ON advanced_presets(time_of_day);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_created_at ON batch_jobs(created_at);
