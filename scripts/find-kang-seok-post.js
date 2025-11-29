require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findKangSeokPost() {
  // 강석 관련 글 찾기
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, published_at')
    .or('title.ilike.%강석%,title.ilike.%Kang Seok%')
    .order('published_at', { ascending: true })
    .limit(10);
  
  if (error) {
    console.error('❌ 오류:', error);
    return;
  }
  
  console.log('강석 관련 글 목록:\n');
  posts.forEach(p => {
    console.log(`ID: ${p.id}`);
    console.log(`제목: ${p.title}`);
    console.log(`발행일: ${p.published_at}`);
    console.log('---');
  });
  
  // 발행일이 가장 빠른 글 찾기
  const { data: firstPost, error: firstError } = await supabase
    .from('blog_posts')
    .select('id, title, published_at')
    .order('published_at', { ascending: true, nullsFirst: false })
    .limit(1)
    .single();
  
  if (!firstError && firstPost) {
    console.log('\n첫 번째 발행 글:');
    console.log(`ID: ${firstPost.id}`);
    console.log(`제목: ${firstPost.title}`);
    console.log(`발행일: ${firstPost.published_at}`);
  }
}

findKangSeokPost().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });

