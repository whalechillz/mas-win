# 마쓰구(MASGOLF) 데이터베이스 스키마

## 📊 데이터베이스 구조

### 1. 고객 프로필 테이블
```sql
CREATE TABLE customer_profiles (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  
  -- 기본 정보
  age_group VARCHAR(20),           -- 연령대 (40대, 50대, 60대, 70대, 80대+)
  
  -- 현재 상황 (퀴즈 결과)
  current_distance INTEGER,         -- 현재 비거리 (m)
  current_club_brand VARCHAR(100), -- 현재 사용클럽 브랜드
  current_club_spec_raw VARCHAR(20), -- 원본 입력 (10.5R, 9S 등)
  current_shaft_flex VARCHAR(10),    -- 파싱된 샤프트 (R1/R2/R/SR/S)
  current_head_angle INTEGER,        -- 파싱된 각도 (도)
  ball_speed INTEGER,              -- 볼스피드 (m/s)
  
  -- 골프 스타일 (퀴즈 결과)
  swing_style VARCHAR(50),         -- 스윙 스타일
  ball_flight VARCHAR(50),         -- 볼 플라이트
  priority VARCHAR(50),            -- 중요 요소
  
  -- 페이스 타입 선호도 (퀴즈 결과)
  tee_height_preference VARCHAR(20), -- 티 높이 선호 (40mm/45mm/50mm)
  ball_flight_preference VARCHAR(20), -- 볼 플라이트 선호 (고탄도/중탄도/저탄도)
  control_need VARCHAR(50),        -- 컨트롤 요구사항 (구질컨트롤/스핀량컨트롤/방향성컨트롤)
  
  -- 원하는 것 (퀴즈 결과)
  desired_distance INTEGER,        -- 원하는 비거리 (m)
  desired_direction VARCHAR(50),   -- 원하는 방향성
  desired_shaft_flex VARCHAR(10),  -- 원하는 샤프트 (R2/R1/R/SR/S)
  desired_head_angle INTEGER,      -- 원하는 각도 (도)
  desired_spec_adjustment JSONB,   -- 스펙조정 (클럽웨이트, 길이, 그립굵기)
  desired_impact_feel VARCHAR(50), -- 타구감/타구음
  
  -- 추천 정보 (퀴즈 결과)
  recommended_club VARCHAR(100),   -- 추천 클럽
  recommended_flex VARCHAR(10),    -- 추천 플렉스 (R1/R2/R/SR/S)
  recommended_head_angle INTEGER,  -- 추천 각도 (도)
  improvement_potential INTEGER,   -- 개선 가능성 (m)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. 문의하기 테이블
```sql
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  customer_profile_id INTEGER REFERENCES customer_profiles(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  call_times TEXT,                 -- 연락 가능 시간
  inquiry_type VARCHAR(50),        -- 문의 유형
  notes TEXT,                     -- 추가 메모
  status VARCHAR(20) DEFAULT 'new', -- new/contacted/completed
  contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. 시타예약 테이블
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  customer_profile_id INTEGER REFERENCES customer_profiles(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  club VARCHAR(100) NOT NULL,      -- 희망 클럽
  status VARCHAR(20) DEFAULT 'pending', -- pending/confirmed/completed/cancelled
  notes TEXT,                     -- 예약 메모
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔗 관련 링크
- [제품별 특징](./product-features.md)
- [추천 로직](./recommendation-logic.md)
- [퀴즈 질문](./quiz-questions.md)
- [플렉스 매핑](./flex-mapping.md)
- [데모 페이지](../demo/masgolf-demo.html) 