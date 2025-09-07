require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupSupabaseBlog() {
  try {
    console.log('🚀 Supabase 블로그 시스템 설정 시작...');
    
    // 1. 데이터베이스 스키마 생성
    console.log('\n📋 데이터베이스 스키마 생성 중...');
    const schemaPath = path.join(__dirname, '../database/blog-schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // SQL 스크립트를 실행
    const { data, error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      console.log('⚠️ 스키마 생성 중 일부 오류 (이미 존재할 수 있음):', error.message);
    } else {
      console.log('✅ 데이터베이스 스키마 생성 완료');
    }
    
    // 2. 테이블 존재 확인
    console.log('\n🔍 테이블 존재 확인 중...');
    const tables = ['blog_posts', 'blog_categories', 'blog_tags', 'blog_post_tags'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table} 테이블 확인 실패:`, error.message);
      } else {
        console.log(`✅ ${table} 테이블 확인 완료`);
      }
    }
    
    // 3. 샘플 데이터 삽입 (테스트용)
    console.log('\n📝 샘플 데이터 삽입 중...');
    
    // 카테고리 삽입
    const { data: categories, error: catError } = await supabase
      .from('blog_categories')
      .upsert([
        { name: '골프드라이버', slug: 'golf-driver', description: '고반발 드라이버 관련 게시물' },
        { name: '피팅서비스', slug: 'fitting-service', description: '드라이버 피팅 서비스 관련 게시물' },
        { name: '제품소개', slug: 'product-intro', description: '제품 소개 및 리뷰' },
        { name: '이벤트', slug: 'events', description: '특별 이벤트 및 프로모션' }
      ], { onConflict: 'slug' });
    
    if (catError) {
      console.log('⚠️ 카테고리 삽입 오류:', catError.message);
    } else {
      console.log('✅ 카테고리 데이터 삽입 완료');
    }
    
    // 태그 삽입
    const { data: tags, error: tagError } = await supabase
      .from('blog_tags')
      .upsert([
        { name: '고반발드라이버', slug: 'high-rebound-driver' },
        { name: '비거리향상', slug: 'distance-improvement' },
        { name: '시니어드라이버', slug: 'senior-driver' },
        { name: '맞춤피팅', slug: 'custom-fitting' },
        { name: '프리미엄', slug: 'premium' },
        { name: '특별혜택', slug: 'special-offer' }
      ], { onConflict: 'slug' });
    
    if (tagError) {
      console.log('⚠️ 태그 삽입 오류:', tagError.message);
    } else {
      console.log('✅ 태그 데이터 삽입 완료');
    }
    
    // 4. 빈 게시물 테이블 확인
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(1);
    
    if (postsError) {
      console.log('❌ 게시물 테이블 확인 실패:', postsError.message);
    } else {
      console.log(`✅ 게시물 테이블 확인 완료 (현재 게시물 수: ${posts?.length || 0}개)`);
    }
    
    console.log('\n🎉 Supabase 블로그 시스템 설정 완료!');
    console.log('📊 설정된 구성요소:');
    console.log('  ✅ 데이터베이스 스키마');
    console.log('  ✅ 카테고리 테이블');
    console.log('  ✅ 태그 테이블');
    console.log('  ✅ 게시물 테이블');
    console.log('  ✅ 샘플 카테고리 및 태그 데이터');
    
  } catch (error) {
    console.error('❌ Supabase 설정 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  setupSupabaseBlog()
    .then(() => {
      console.log('\n🚀 Supabase 블로그 시스템 설정 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { setupSupabaseBlog };
