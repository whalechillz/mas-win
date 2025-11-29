/**
 * 텍스트 단락을 더 세밀하게 분리하여 이미지 배치 공간 확보
 * 사용법: node scripts/improve-paragraph-splitting.js <blogPostId>
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

async function improveParagraphSplitting(blogPostId) {
  console.log(`🔧 블로그 글(ID: ${blogPostId}) 텍스트 단락 개선 시작...\n`);
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
  
  // 2. content를 단락으로 분리
  const paragraphs = post.content.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
  const newParagraphs = [];
  let changesCount = 0;
  
  for (const para of paragraphs) {
    // 제목이나 이미지는 그대로 유지
    if (para.match(/^#+\s/) || para.match(/^!\[/)) {
      newParagraphs.push(para);
      continue;
    }
    
    // 텍스트 단락인 경우
    // 문장 단위로 분리 (마침표, 느낌표, 물음표, 따옴표 닫기 기준)
    const sentences = para.split(/([.!?。！？"]\s+)/);
    const cleanSentences = [];
    
    for (let i = 0; i < sentences.length; i += 2) {
      if (sentences[i]) {
        const sentence = (sentences[i] + (sentences[i + 1] || '')).trim();
        if (sentence.length > 0) {
          cleanSentences.push(sentence);
        }
      }
    }
    
    // 문장이 2개 이상이면 각 문장을 별도 단락으로 분리
    if (cleanSentences.length > 1) {
      cleanSentences.forEach((sentence, idx) => {
        if (sentence.trim().length > 20) { // 최소 20자 이상인 문장만 단락으로
          newParagraphs.push(sentence.trim());
          if (idx < cleanSentences.length - 1) {
            // 마지막 문장이 아니면 빈 줄 추가하지 않음 (이미지 배치를 위해)
          }
        }
      });
      console.log(`   ✅ 단락 분할: ${para.substring(0, 50)}... → ${cleanSentences.length}개 단락`);
      changesCount += cleanSentences.length - 1;
    } else {
      // 문장이 1개면 그대로 유지
      newParagraphs.push(para);
    }
  }
  
  let newContent = newParagraphs.join('\n\n');
  
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
    console.log('✅ 텍스트 단락 개선 완료');
    console.log('='.repeat(80));
    console.log(`   추가된 단락: ${changesCount}개`);
    console.log(`   업데이트된 content 길이: ${newContent.length}자 (기존: ${post.content.length}자)`);
    console.log('='.repeat(80));
  } else {
    console.log('\n✅ 개선할 단락이 없습니다.');
  }
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : 123;
  improveParagraphSplitting(blogPostId)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { improveParagraphSplitting };

