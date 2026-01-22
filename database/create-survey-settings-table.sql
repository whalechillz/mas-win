-- 설문 캠페인별 설정 테이블 생성
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS survey_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_source VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true, -- 설문 활성화 여부
  winners_page_enabled BOOLEAN DEFAULT true, -- 당첨자 페이지 활성화 여부
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_survey_settings_campaign_source ON survey_settings(campaign_source);

-- 기본 데이터 삽입 (muziik-survey-2025)
INSERT INTO survey_settings (campaign_source, is_active, winners_page_enabled)
VALUES ('muziik-survey-2025', true, true)
ON CONFLICT (campaign_source) DO NOTHING;

-- RLS 정책 설정
ALTER TABLE survey_settings ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자만 조회/수정 가능
CREATE POLICY "Enable select for authenticated users" ON survey_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON survey_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON survey_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_survey_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_survey_settings_updated_at
    BEFORE UPDATE ON survey_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_survey_settings_updated_at();
