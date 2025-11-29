/**
 * 강석 글의 누락된 이미지 복구
 * 삭제된 파일이 실제로 Storage에 있는지 확인하고, 있다면 content의 URL을 교체
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

async function fixKangSeokMissingImages() {
  try {
    console.log('🔧 강석 글(ID 123)의 누락된 이미지 복구 시작...\n');
    
    // 1. 강석 글 조회
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('id, title, content')
      .eq('id', 123)
      .single();
    
    if (error || !post) {
      console.error('❌ 강석 글을 찾을 수 없습니다:', error);
      return;
    }
    
    // 2. 누락된 이미지와 대체 이미지 매핑
    // 해시가 같은 이미지들 (중복 이미지)
    const imageMappings = [
      {
        missing: 'complete-migration-1757771589208-3.webp', // Storage에 없음
        replacement: 'complete-migration-1757771589662-4.webp', // 같은 해시, 삭제 예정이었음
        hash: 'ed7eea7eab1cb252f8e1037c3e93301c'
      },
      {
        missing: 'complete-migration-1757771591887-9.webp', // Storage에 없음
        replacement: 'complete-migration-1757771592268-10.webp', // 같은 해시, 삭제 예정이었음
        hash: 'e1a13782ab939490e2f7de4a35c8fbdd'
      },
      {
        missing: 'complete-migration-1757771592666-11.webp', // Storage에 없음
        replacement: 'complete-migration-1757771593103-12.webp', // 같은 해시, 삭제 예정이었음
        hash: '265fb7590158630d4a9a9b3b2d973837'
      }
    ];
    
    console.log('📋 이미지 교체 계획:');
    console.log('='.repeat(80));
    
    let updatedContent = post.content;
    let replacedCount = 0;
    
    for (const mapping of imageMappings) {
      const missingUrl = `https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/${mapping.missing}`;
      const replacementUrl = `https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/${mapping.replacement}`;
      
      // 1. 대체 이미지가 Storage에 있는지 확인
      const { data: fileData, error: fileError } = await supabase
        .storage
        .from('blog-images')
        .list('', {
          search: mapping.replacement
        });
      
      const fileExists = fileData && fileData.length > 0 && fileData.find(f => f.name === mapping.replacement);
      
      // 2. HTTP 접근 가능한지 확인
      let httpAccessible = false;
      try {
        const response = await fetch(replacementUrl, { method: 'HEAD' });
        httpAccessible = response.ok;
      } catch (e) {
        // 무시
      }
      
      console.log(`\n${mapping.missing} → ${mapping.replacement}`);
      console.log(`  해시: ${mapping.hash}`);
      console.log(`  Storage 존재: ${fileExists ? '✅' : '❌'}`);
      console.log(`  HTTP 접근: ${httpAccessible ? '✅' : '❌'}`);
      
      if (fileExists || httpAccessible) {
        // content에서 URL 교체
        const oldPattern = new RegExp(mapping.missing.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (updatedContent.includes(mapping.missing)) {
          updatedContent = updatedContent.replace(oldPattern, mapping.replacement);
          replacedCount++;
          console.log(`  ✅ 교체 완료`);
        } else {
          console.log(`  ⚠️ content에 해당 URL 없음`);
        }
      } else {
        console.log(`  ❌ 대체 이미지도 Storage에 없음 - 복구 불가`);
      }
    }
    
    if (replacedCount > 0) {
      // 3. 데이터베이스 업데이트
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          content: updatedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', 123);
      
      if (updateError) {
        console.error('❌ 업데이트 실패:', updateError);
        return;
      }
      
      console.log(`\n✅ 복구 완료! ${replacedCount}개 이미지 URL 교체됨`);
    } else {
      console.log(`\n⚠️ 교체된 이미지 없음`);
    }
    
    return {
      post,
      replacedCount
    };
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  fixKangSeokMissingImages()
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { fixKangSeokMissingImages };

