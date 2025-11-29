/**
 * 블로그 글의 카테고리를 확인하고 설정
 * 같은 카테고리의 관련 포스트 확인
 * 사용법: node scripts/check-and-set-blog-category.js <blogPostId> [category]
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

async function checkAndSetCategory(blogPostId, newCategory) {
  console.log(`🔧 블로그 글(ID: ${blogPostId}) 카테고리 확인 및 설정 시작...\n`);
  console.log('='.repeat(80));
  
  // 1. 현재 블로그 글 정보 확인
  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title, category, status, published_at')
    .eq('id', blogPostId)
    .single();
  
  if (postError || !post) {
    console.error('❌ 블로그 글을 찾을 수 없습니다:', postError);
    return;
  }
  
  console.log(`📝 블로그 글: ${post.title}\n`);
  console.log(`현재 카테고리: ${post.category || '없음'}`);
  console.log(`상태: ${post.status}`);
  console.log(`발행일: ${post.published_at || '없음'}\n`);
  
  // 2. 카테고리 설정 (필요한 경우)
  let finalCategory = post.category;
  
  if (newCategory) {
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ 
        category: newCategory,
        updated_at: new Date().toISOString()
      })
      .eq('id', blogPostId);
    
    if (updateError) {
      console.error('❌ 카테고리 업데이트 실패:', updateError);
      return;
    }
    
    finalCategory = newCategory;
    console.log(`✅ 카테고리를 "${newCategory}"로 설정했습니다.\n`);
  } else if (!post.category) {
    // 카테고리가 없으면 기본값 설정
    const defaultCategory = '마쓰구골프';
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ 
        category: defaultCategory,
        updated_at: new Date().toISOString()
      })
      .eq('id', blogPostId);
    
    if (updateError) {
      console.error('❌ 카테고리 업데이트 실패:', updateError);
      return;
    }
    
    finalCategory = defaultCategory;
    console.log(`✅ 카테고리가 없어서 "${defaultCategory}"로 설정했습니다.\n`);
  }
  
  // 3. 같은 카테고리의 다른 발행된 글 확인
  const { data: relatedPosts, error: relatedError } = await supabase
    .from('blog_posts')
    .select('id, title, slug, published_at, status')
    .eq('category', finalCategory)
    .neq('id', blogPostId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10);
  
  if (relatedError) {
    console.error('❌ 관련 포스트 조회 실패:', relatedError);
    return;
  }
  
  console.log('='.repeat(80));
  console.log(`📊 관련 포스트 확인 (카테고리: "${finalCategory}")`);
  console.log('='.repeat(80));
  console.log(`총 ${relatedPosts.length}개의 관련 포스트가 있습니다.\n`);
  
  if (relatedPosts.length > 0) {
    console.log('관련 포스트 목록:');
    relatedPosts.forEach((related, idx) => {
      console.log(`  ${idx + 1}. ID: ${related.id} | ${related.title}`);
      console.log(`     Slug: ${related.slug}`);
      console.log(`     발행일: ${related.published_at || '없음'}\n`);
    });
    
    // API에서 가져올 수 있는 관련 포스트 (최대 3개)
    const apiRelatedPosts = relatedPosts.slice(0, 3);
    console.log(`\n✅ API에서 표시될 관련 포스트 (최대 3개):`);
    apiRelatedPosts.forEach((related, idx) => {
      console.log(`  ${idx + 1}. ${related.title}`);
    });
  } else {
    console.log('⚠️ 같은 카테고리의 다른 발행된 글이 없습니다.');
    console.log('   관련 포스트 섹션이 표시되지 않을 수 있습니다.');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ 카테고리 확인 및 설정 완료');
  console.log('='.repeat(80));
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : null;
  const category = process.argv[3] || null;
  
  if (!blogPostId) {
    console.error('❌ 사용법: node scripts/check-and-set-blog-category.js <blogPostId> [category]');
    process.exit(1);
  }
  
  checkAndSetCategory(blogPostId, category)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { checkAndSetCategory };

