/**
 * 이경영 글의 깨진 이미지 제거 및 정리
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

async function fixBrokenImages(blogPostId) {
  console.log(`🔧 블로그 글(ID: ${blogPostId}) 깨진 이미지 수정 시작...\n`);
  console.log('='.repeat(80));
  
  // 1. 블로그 글 정보 조회
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
  
  // 2. 깨진 이미지 URL 목록
  const brokenImageNames = [
    'complete-migration-1757777702116-2.webp',
    'complete-migration-1757777704699-4.webp'
  ];
  
  // 3. content에서 깨진 이미지 제거
  let updatedContent = post.content;
  let removedCount = 0;
  
  // 마크다운 이미지 패턴: ![alt](url)
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const matches = [...updatedContent.matchAll(imagePattern)];
  
  for (const match of matches) {
    const fullMatch = match[0];
    const alt = match[1];
    const url = match[2];
    
    // 깨진 이미지인지 확인
    const isBroken = brokenImageNames.some(name => url.includes(name));
    
    if (isBroken) {
      console.log(`🗑️ 깨진 이미지 제거: [${alt}]`);
      console.log(`   URL: ${url.substring(0, 80)}...`);
      
      // 이미지 마크다운 제거
      updatedContent = updatedContent.replace(fullMatch, '');
      removedCount++;
    }
  }
  
  // 연속된 빈 줄 정리
  updatedContent = updatedContent.replace(/\n{3,}/g, '\n\n');
  
  // 4. 데이터베이스 업데이트
  if (removedCount > 0) {
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        content: updatedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', blogPostId);
    
    if (updateError) {
      console.error('❌ 블로그 글 업데이트 실패:', updateError);
      return;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ 깨진 이미지 제거 완료');
    console.log('='.repeat(80));
    console.log(`제거된 이미지: ${removedCount}개`);
    console.log(`업데이트된 content 길이: ${updatedContent.length}자 (기존: ${post.content.length}자)`);
    console.log('='.repeat(80));
  } else {
    console.log('\n✅ 깨진 이미지가 없습니다.');
  }
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : 305;
  
  fixBrokenImages(blogPostId)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { fixBrokenImages };

