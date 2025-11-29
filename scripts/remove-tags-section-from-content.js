/**
 * 블로그 글에서 하드코딩된 태그 섹션 제거
 * 사용법: node scripts/remove-tags-section-from-content.js <blogPostId>
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

async function removeTagsSectionFromContent(blogPostId) {
  console.log(`🔧 블로그 글(ID: ${blogPostId}) 태그 섹션 제거 시작...\n`);
  console.log('='.repeat(80));
  
  // 1. 블로그 글 조회
  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title, content')
    .eq('id', blogPostId)
    .single();
  
  if (postError || !post) {
    console.error('❌ 블로그 글을 찾을 수 없습니다:', postError);
    return;
  }
  
  console.log(`📝 블로그 글: ${post.title}\n`);
  
  if (!post.content) {
    console.log('⚠️ content가 비어있습니다.');
    return;
  }
  
  let newContent = post.content;
  let changesCount = 0;
  
  // 2. 태그 섹션 제거
  // 패턴 1: "### 태그" 또는 "## 태그" 제목과 다음 줄의 태그 목록
  const tagsPattern1 = /(?:###?\s*)?태그\s*\n\n?([^\n]+(?:\n[^\n]+)*?)(?=\n\n|$)/gi;
  const matches1 = [...newContent.matchAll(tagsPattern1)];
  
  matches1.forEach(match => {
    console.log(`🔍 태그 섹션 발견:`);
    console.log(`   ${match[0].substring(0, 200)}...`);
    newContent = newContent.replace(match[0], '');
    console.log(`   ✅ 제거 완료`);
    changesCount++;
  });
  
  // 패턴 2: "### 태그" 제목만 있는 경우
  const tagsPattern2 = /(?:###?\s*)?태그\s*\n\n(?=\n|$)/gi;
  const matches2 = [...newContent.matchAll(tagsPattern2)];
  
  matches2.forEach(match => {
    console.log(`🔍 태그 제목만 남아있음:`);
    console.log(`   ${match[0]}`);
    newContent = newContent.replace(match[0], '');
    console.log(`   ✅ 제거 완료`);
    changesCount++;
  });
  
  // 3. 연속된 빈 줄 정리 (3개 이상 → 2개)
  newContent = newContent.replace(/\n{3,}/g, '\n\n');
  
  // 4. 데이터베이스 업데이트
  if (changesCount > 0) {
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ 
        content: newContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', blogPostId);
    
    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError);
      return;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 태그 섹션 제거 완료');
    console.log('='.repeat(80));
    console.log(`   제거된 섹션: ${changesCount}개`);
    console.log(`   업데이트된 content 길이: ${newContent.length}자 (기존: ${post.content.length}자)`);
    console.log('='.repeat(80));
  } else {
    console.log('\n✅ 태그 섹션이 없습니다.');
  }
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : 123;
  removeTagsSectionFromContent(blogPostId)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { removeTagsSectionFromContent };

