-- bookings 테이블에 퀴즈 관련 컬럼 추가
ALTER TABLE public.bookings 
ADD COLUMN swing_style VARCHAR,
ADD COLUMN priority VARCHAR,
ADD COLUMN current_distance INT,
ADD COLUMN recommended_flex VARCHAR,
ADD COLUMN expected_distance INT;

-- contacts 테이블에 퀴즈 관련 컬럼 추가
ALTER TABLE public.contacts 
ADD COLUMN swing_style VARCHAR,
ADD COLUMN priority VARCHAR,
ADD COLUMN current_distance INT,
ADD COLUMN recommended_flex VARCHAR,
ADD COLUMN expected_distance INT;