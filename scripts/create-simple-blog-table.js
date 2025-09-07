const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSimpleBlogTable() {
  try {
    console.log('🚀 간단한 블로그 테이블을 생성합니다...');
    
    // 먼저 연결 테스트
    console.log('🔗 Supabase 연결을 테스트합니다...');
    const { data: testData, error: testError } = await supabase
      .from('_test_connection')
      .select('*')
      .limit(1);
    
    if (testError && testError.code !== 'PGRST116') {
      console.log('✅ Supabase 연결 성공');
    }
    
    // 간단한 블로그 포스트 테이블 생성 시도
    console.log('📊 blog_posts 테이블을 생성합니다...');
    
    // 테이블이 이미 존재하는지 확인
    const { data: existingPosts, error: checkError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST116') {
      console.log('❌ blog_posts 테이블이 존재하지 않습니다.');
      console.log('📝 Supabase 대시보드에서 다음 SQL을 실행해주세요:');
      console.log(`
-- blog_posts 테이블 생성
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image VARCHAR(500),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  category VARCHAR(100) DEFAULT '골프',
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'published',
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE
);

-- 인덱스 생성
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);

-- RLS 활성화
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
CREATE POLICY "Public can view published blog posts" ON blog_posts
  FOR SELECT USING (status = 'published');

-- 관리자 정책 (임시로 모든 사용자 허용)
CREATE POLICY "Admin can manage blog posts" ON blog_posts
  FOR ALL USING (true);
      `);
    } else if (checkError) {
      console.log('❌ 테이블 확인 중 오류:', checkError.message);
    } else {
      console.log('✅ blog_posts 테이블이 이미 존재합니다.');
      console.log('📊 현재 포스트 수:', existingPosts?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ 테이블 생성 중 오류:', error);
  }
}

// 실행
createSimpleBlogTable();
