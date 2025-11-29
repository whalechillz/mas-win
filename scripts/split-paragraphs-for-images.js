/**
 * 텍스트 단락을 더 작은 단락으로 나누어 이미지 배치 공간 확보
 * 사용법: node scripts/split-paragraphs-for-images.js <blogPostId>
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

async function splitParagraphsForImages(blogPostId) {
  console.log(`🔧 블로그 글(ID: ${blogPostId}) 텍스트 단락 분할 시작...\n`);
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
  
  // 2. content를 줄 단위로 분리
  const lines = post.content.split('\n');
  const newLines = [];
  let changesCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    newLines.push(line);
    
    // 긴 텍스트 단락을 문장 단위로 분리
    // 제목이나 이미지가 아니고, 빈 줄이 아니고, 길이가 200자 이상인 경우
    if (!line.match(/^#+\s/) && 
        !line.match(/^!\[/) && 
        line.trim().length > 0 && 
        line.trim().length > 200) {
      
      // 문장 단위로 분리 (마침표, 느낌표, 물음표 기준)
      const sentences = line.split(/([.!?。！？]\s+)/);
      if (sentences.length > 2) {
        // 문장이 2개 이상이면 각 문장을 별도 단락으로 분리
        const sentenceGroups = [];
        let currentGroup = '';
        
        for (let j = 0; j < sentences.length; j++) {
          currentGroup += sentences[j];
          // 마침표, 느낌표, 물음표가 나오면 단락으로 분리
          if (sentences[j].match(/[.!?。！？]/) && currentGroup.trim().length > 30) {
            sentenceGroups.push(currentGroup.trim());
            currentGroup = '';
          }
        }
        
        if (currentGroup.trim().length > 0) {
          sentenceGroups.push(currentGroup.trim());
        }
        
        if (sentenceGroups.length > 1) {
          // 마지막 줄을 여러 단락으로 분리
          newLines.pop(); // 마지막 줄 제거
          sentenceGroups.forEach((group, groupIdx) => {
            newLines.push(group);
            if (groupIdx < sentenceGroups.length - 1) {
              newLines.push(''); // 빈 줄 추가
            }
          });
          console.log(`   ✅ 단락 분할: ${line.substring(0, 50)}... → ${sentenceGroups.length}개 단락`);
          changesCount += sentenceGroups.length - 1;
        }
      }
    }
  }
  
  let newContent = newLines.join('\n');
  
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
    console.log('✅ 텍스트 단락 분할 완료');
    console.log('='.repeat(80));
    console.log(`   분할된 단락: ${changesCount}개`);
    console.log(`   업데이트된 content 길이: ${newContent.length}자 (기존: ${post.content.length}자)`);
    console.log('='.repeat(80));
  } else {
    console.log('\n✅ 분할할 단락이 없습니다.');
  }
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : 123;
  splitParagraphsForImages(blogPostId)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { splitParagraphsForImages };

