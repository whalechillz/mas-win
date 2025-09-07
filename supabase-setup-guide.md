# Supabase 설정 가이드

## 📋 현재 상황
- **프로젝트명**: masgolf-hub
- **상태**: 일시정지 (Paused)
- **복구 가능 기간**: 81일 남음 (2025년 11월 27일까지)
- **데이터 상태**: 모든 데이터 보존됨

## 🔧 해결 방법

### 방법 1: 기존 프로젝트 복구 (권장)
1. Supabase 대시보드에서 "Restore project" 버튼 클릭
2. 복구 완료 후 기존 데이터 확인
3. 블로그 스키마 적용

### 방법 2: 새 프로젝트 생성
1. 새 Supabase 프로젝트 생성
2. 기존 데이터 백업 및 마이그레이션
3. 환경 변수 업데이트

## 📊 블로그 데이터베이스 스키마

### 테이블 구조
```sql
-- 블로그 게시물 테이블
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image VARCHAR(500),
  meta_title VARCHAR(255),
  meta_description TEXT,
  keywords TEXT[],
  category VARCHAR(100),
  tags TEXT[],
  author VARCHAR(100) DEFAULT '마쓰구골프',
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'published'
);
```

### 기본 데이터
- **카테고리**: 고반발 드라이버, 시니어 드라이버, 고객 후기, 이벤트, 골프 피팅, 기술 정보
- **태그**: 고반발 드라이버, 시니어 드라이버, 골프 드라이버, 남성 드라이버, 골프 피팅, 비거리 향상, 마쓰구골프, 고객 후기, 이벤트, 할인, 특가, 프리미엄, 맞춤 제작, 전문 피팅

## 🔑 환경 변수 설정

### .env.local 파일에 추가
```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📝 다음 단계
1. Supabase 프로젝트 복구/생성
2. 블로그 스키마 적용
3. 환경 변수 설정
4. 기존 162개 게시물 데이터 마이그레이션
5. 블로그 페이지 연결
6. 테스트 및 배포
