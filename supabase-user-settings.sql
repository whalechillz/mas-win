-- 사용자 설정 테이블
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  autoDetectContentType BOOLEAN DEFAULT true,
  defaultContentType TEXT DEFAULT 'golf',
  brandStrategy JSONB DEFAULT '{
    "customerPersona": "competitive_maintainer",
    "customerChannel": "local_customers", 
    "brandWeight": "medium",
    "audienceTemperature": "warm"
  }',
  aiSettings JSONB DEFAULT '{
    "defaultModel": "fal",
    "imageCount": 1,
    "quality": "high"
  }',
  contentTypeOverrides JSONB DEFAULT '{
    "restaurant": {
      "customerPersona": "food_lover",
      "brandWeight": "low",
      "audienceTemperature": "neutral"
    },
    "travel": {
      "customerPersona": "leisure_seeker", 
      "brandWeight": "low",
      "audienceTemperature": "warm"
    },
    "shopping": {
      "customerPersona": "value_seeker",
      "brandWeight": "high", 
      "audienceTemperature": "neutral"
    }
  }',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 프리셋 테이블
CREATE TABLE IF NOT EXISTS user_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  contentType TEXT NOT NULL,
  brandStrategy JSONB NOT NULL,
  aiSettings JSONB NOT NULL,
  isDefault BOOLEAN DEFAULT false,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 프리셋 데이터 삽입
INSERT INTO user_presets (id, name, description, contentType, brandStrategy, aiSettings, isDefault) VALUES
('golf_default', '골프 기본', '골프 관련 콘텐츠용 기본 설정', 'golf', 
 '{"customerPersona": "competitive_maintainer", "customerChannel": "local_customers", "brandWeight": "medium", "audienceTemperature": "warm"}',
 '{"defaultModel": "fal", "imageCount": 1, "quality": "high"}', true),

('restaurant_default', '식당 기본', '식당/음식 관련 콘텐츠용 기본 설정', 'restaurant',
 '{"customerPersona": "food_lover", "customerChannel": "local_customers", "brandWeight": "low", "audienceTemperature": "neutral"}', 
 '{"defaultModel": "fal", "imageCount": 1, "quality": "high"}', true),

('travel_default', '여행 기본', '여행/휴양 관련 콘텐츠용 기본 설정', 'travel',
 '{"customerPersona": "leisure_seeker", "customerChannel": "local_customers", "brandWeight": "low", "audienceTemperature": "warm"}',
 '{"defaultModel": "fal", "imageCount": 1, "quality": "high"}', true),

('shopping_default', '쇼핑 기본', '제품/쇼핑 관련 콘텐츠용 기본 설정', 'shopping',
 '{"customerPersona": "value_seeker", "customerChannel": "online_customers", "brandWeight": "high", "audienceTemperature": "neutral"}',
 '{"defaultModel": "fal", "imageCount": 1, "quality": "high"}', true);

-- RLS (Row Level Security) 설정
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presets ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 설정 (관리자 전용이므로)
CREATE POLICY "Enable all access for user_settings" ON user_settings FOR ALL USING (true);
CREATE POLICY "Enable all access for user_presets" ON user_presets FOR ALL USING (true);
