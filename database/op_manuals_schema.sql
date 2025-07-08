-- OP 매뉴얼 테이블 생성
CREATE TABLE op_manuals (
    id SERIAL PRIMARY KEY,
    version VARCHAR(10) NOT NULL UNIQUE,  -- '2025-07' 형식
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',   -- draft, active, archived
    content JSONB NOT NULL,               -- 섹션별 컨텐츠 JSON
    highlights TEXT[],                    -- 주요 변경사항 배열
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- 매뉴얼 조회 로그
CREATE TABLE manual_views (
    id SERIAL PRIMARY KEY,
    manual_id INTEGER REFERENCES op_manuals(id),
    section VARCHAR(100),
    viewer_name VARCHAR(100),
    viewed_at TIMESTAMP DEFAULT NOW()
);

-- 섹션별 템플릿
CREATE TABLE manual_sections (
    id SERIAL PRIMARY KEY,
    section_key VARCHAR(50) UNIQUE,
    section_name VARCHAR(100),
    icon VARCHAR(10),
    template TEXT,
    sort_order INTEGER
);

-- 기본 섹션 삽입
INSERT INTO manual_sections (section_key, section_name, icon, sort_order) VALUES
('overview', '캠페인 개요', '📋', 1),
('gifts', '사은품 정책', '🎁', 2),
('products', '제품 정보', '🏌️', 3),
('scripts', '상담 스크립트', '📞', 4),
('guide', '맞춤 클럽 추천', '💡', 5),
('process', '예약/문의 처리', '📋', 6),
('caution', '주의사항', '⚠️', 7),
('system', '시스템 사용법', '📱', 8),
('emergency', '긴급 대응', '🚨', 9),
('admin', '관리자 페이지', '🖥️', 10),
('checklist', '일일 체크리스트', '📊', 11),
('goals', '판매 목표', '🎯', 12);

-- 뷰 생성: 현재 활성 매뉴얼
CREATE VIEW current_manual AS
SELECT * FROM op_manuals 
WHERE status = 'active' 
ORDER BY created_at DESC 
LIMIT 1;

-- 인덱스 생성
CREATE INDEX idx_manual_version ON op_manuals(version);
CREATE INDEX idx_manual_status ON op_manuals(status);
CREATE INDEX idx_views_manual ON manual_views(manual_id);
CREATE INDEX idx_views_date ON manual_views(viewed_at);