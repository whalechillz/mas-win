# 싱싱골프투어 블로그 시스템 데이터베이스 구조

## 📊 주요 테이블 구조

### 1. blog_posts (블로그 게시물)
```sql
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image VARCHAR(500),
  category VARCHAR(100),
  tags TEXT[],
  status VARCHAR(20) DEFAULT 'draft',
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  author VARCHAR(100),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. cc_content_calendar (콘텐츠 캘린더)
```sql
CREATE TABLE cc_content_calendar (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  content_date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  status VARCHAR(20) DEFAULT 'planned',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(year, month, content_date, title)
);
```

### 3. admin_users (관리자 사용자)
```sql
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(11) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'editor',
  password_hash VARCHAR(255) NOT NULL,
  pin VARCHAR(4),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. gallery_images (갤러리 이미지)
```sql
CREATE TABLE gallery_images (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  alt_text TEXT,
  category VARCHAR(100),
  tags TEXT[],
  uploaded_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔗 테이블 관계

- `blog_posts` ↔ `cc_content_calendar`: 제목과 내용으로 연결
- `admin_users` → `blog_posts`: 작성자 정보
- `gallery_images` → `blog_posts`: 대표 이미지 연결

## 📝 인덱스

```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX idx_cc_content_calendar_date ON cc_content_calendar(content_date);
CREATE INDEX idx_gallery_images_category ON gallery_images(category);
```

## 🗄️ Supabase Storage 버킷

- `blog-images`: 블로그 게시물 이미지
- `gallery-images`: 갤러리 이미지
- `scraped-images`: 스크래핑된 이미지
