/**
 * 이경영 글 찾기
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findLeeKyungYoungPost() {
  console.log('🔍 이경영 글 검색 중...\n');
  
  // slug로 검색
  const { data: dataBySlug, error: errorBySlug } = await supabase
    .from('blog_posts')
    .select('id, title, slug')
    .ilike('slug', '%lee-kyung-young%');
  
  if (errorBySlug) {
    console.error('❌ 오류:', errorBySlug);
    return;
  }
  
  if (dataBySlug && dataBySlug.length > 0) {
    console.log('✅ 찾은 글:');
    dataBySlug.forEach(p => {
      console.log(`   ID: ${p.id}`);
      console.log(`   제목: ${p.title}`);
      console.log(`   Slug: ${p.slug}\n`);
    });
    return;
  }
  
  // 제목으로 검색
  const { data: dataByTitle, error: errorByTitle } = await supabase
    .from('blog_posts')
    .select('id, title, slug')
    .or('title.ilike.%이경영%,title.ilike.%이 경영%');
  
  if (errorByTitle) {
    console.error('❌ 오류:', errorByTitle);
    return;
  }
  
  if (dataByTitle && dataByTitle.length > 0) {
    console.log('✅ 찾은 글:');
    dataByTitle.forEach(p => {
      console.log(`   ID: ${p.id}`);
      console.log(`   제목: ${p.title}`);
      console.log(`   Slug: ${p.slug}\n`);
    });
    return;
  }
  
  console.log('❌ 이경영 글을 찾을 수 없습니다.');
}

findLeeKyungYoungPost()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  });

