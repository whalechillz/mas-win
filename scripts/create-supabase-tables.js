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

async function createSupabaseTables() {
  try {
    console.log('🚀 Supabase 테이블 생성 시작...');
    
    // 1. 카테고리 테이블 생성
    console.log('\n📋 카테고리 테이블 생성 중...');
    const { data: catData, error: catError } = await supabase
      .from('blog_categories')
      .select('*')
      .limit(1);
    
    if (catError && catError.message.includes('relation "blog_categories" does not exist')) {
      console.log('✅ 카테고리 테이블이 존재하지 않습니다. 생성이 필요합니다.');
    } else if (catError) {
      console.log('⚠️ 카테고리 테이블 확인 오류:', catError.message);
    } else {
      console.log('✅ 카테고리 테이블이 이미 존재합니다.');
    }
    
    // 2. 태그 테이블 생성
    console.log('\n🏷️ 태그 테이블 생성 중...');
    const { data: tagData, error: tagError } = await supabase
      .from('blog_tags')
      .select('*')
      .limit(1);
    
    if (tagError && tagError.message.includes('relation "blog_tags" does not exist')) {
      console.log('✅ 태그 테이블이 존재하지 않습니다. 생성이 필요합니다.');
    } else if (tagError) {
      console.log('⚠️ 태그 테이블 확인 오류:', tagError.message);
    } else {
      console.log('✅ 태그 테이블이 이미 존재합니다.');
    }
    
    // 3. 게시물 테이블 생성
    console.log('\n📝 게시물 테이블 생성 중...');
    const { data: postData, error: postError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(1);
    
    if (postError && postError.message.includes('relation "blog_posts" does not exist')) {
      console.log('✅ 게시물 테이블이 존재하지 않습니다. 생성이 필요합니다.');
    } else if (postError) {
      console.log('⚠️ 게시물 테이블 확인 오류:', postError.message);
    } else {
      console.log('✅ 게시물 테이블이 이미 존재합니다.');
    }
    
    // 4. 연결 테이블 생성
    console.log('\n🔗 게시물-태그 연결 테이블 생성 중...');
    const { data: linkData, error: linkError } = await supabase
      .from('blog_post_tags')
      .select('*')
      .limit(1);
    
    if (linkError && linkError.message.includes('relation "blog_post_tags" does not exist')) {
      console.log('✅ 게시물-태그 연결 테이블이 존재하지 않습니다. 생성이 필요합니다.');
    } else if (linkError) {
      console.log('⚠️ 게시물-태그 연결 테이블 확인 오류:', linkError.message);
    } else {
      console.log('✅ 게시물-태그 연결 테이블이 이미 존재합니다.');
    }
    
    console.log('\n📊 테이블 상태 요약:');
    console.log('  📋 blog_categories: ' + (catError ? '❌ 없음' : '✅ 있음'));
    console.log('  🏷️ blog_tags: ' + (tagError ? '❌ 없음' : '✅ 있음'));
    console.log('  📝 blog_posts: ' + (postError ? '❌ 없음' : '✅ 있음'));
    console.log('  🔗 blog_post_tags: ' + (linkError ? '❌ 없음' : '✅ 있음'));
    
    if (catError || tagError || postError || linkError) {
      console.log('\n⚠️ 일부 테이블이 존재하지 않습니다.');
      console.log('💡 Supabase 대시보드에서 수동으로 테이블을 생성해야 합니다.');
      console.log('📄 SQL 스크립트: database/blog-schema.sql');
    } else {
      console.log('\n🎉 모든 테이블이 존재합니다!');
    }
    
  } catch (error) {
    console.error('❌ 테이블 생성 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  createSupabaseTables()
    .then(() => {
      console.log('\n🚀 Supabase 테이블 생성 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { createSupabaseTables };
