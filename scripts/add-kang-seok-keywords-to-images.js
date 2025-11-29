/**
 * 강석 글 이미지에 강석 관련 키워드 추가
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

async function addKangSeokKeywordsToImages() {
  try {
    console.log('🏷️ 강석 글 이미지에 키워드 추가 시작...\n');
    console.log('='.repeat(80));
    
    // 강석 관련 키워드
    const kangSeokKeywords = [
      '강석',
      '연예인',
      '방송인',
      'MC',
      'MBC',
      '표준FM',
      '싱글벙글쇼',
      '강석 MC',
      '강석 방송인'
    ];
    
    // 강석 글 폴더의 이미지 URL 목록
    const prefix = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/blog/2015-08/123/';
    
    const imageFiles = [
      'complete-migration-1757771588300-1.webp',
      'complete-migration-1757771588785-2.webp',
      'complete-migration-1757771589662-4.webp',
      'complete-migration-1757771590044-5.webp',
      'complete-migration-1757771590842-7.webp',
      'complete-migration-1757771592268-10.webp',
      'complete-migration-1757771593103-12.webp'
    ];
    
    console.log(`📸 처리할 이미지: ${imageFiles.length}개\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const fileName of imageFiles) {
      const imageUrl = prefix + fileName;
      
      console.log(`\n📸 처리 중: ${fileName}`);
      
      // image_assets 테이블에서 현재 ai_tags 조회
      const { data: currentAsset, error: fetchError } = await supabase
        .from('image_assets')
        .select('id, ai_tags')
        .eq('cdn_url', imageUrl)
        .single();
      
      if (fetchError || !currentAsset) {
        console.log(`   ⚠️ 이미지를 찾을 수 없습니다: ${fetchError?.message || '없음'}`);
        skippedCount++;
        continue;
      }
      
      // 현재 ai_tags 가져오기
      const currentTags = Array.isArray(currentAsset.ai_tags) ? currentAsset.ai_tags : [];
      
      // 강석 키워드 추가 (중복 제거)
      const newTags = Array.from(new Set([...currentTags, ...kangSeokKeywords]));
      
      // 변경사항이 없으면 스킵
      if (newTags.length === currentTags.length && 
          newTags.every(tag => currentTags.includes(tag))) {
        console.log(`   ✅ 이미 키워드가 포함되어 있습니다.`);
        skippedCount++;
        continue;
      }
      
      // ai_tags 업데이트
      const { error: updateError } = await supabase
        .from('image_assets')
        .update({
          ai_tags: newTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentAsset.id);
      
      if (updateError) {
        console.log(`   ❌ 업데이트 실패: ${updateError.message}`);
        skippedCount++;
      } else {
        console.log(`   ✅ 키워드 추가 완료`);
        console.log(`   기존: ${currentTags.length}개 → 새로: ${newTags.length}개`);
        console.log(`   추가된 키워드: ${kangSeokKeywords.filter(k => !currentTags.includes(k)).join(', ')}`);
        updatedCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 최종 결과:');
    console.log(`   업데이트된 이미지: ${updatedCount}개`);
    console.log(`   스킵된 이미지: ${skippedCount}개`);
    console.log('='.repeat(80));
    console.log('✅ 작업 완료!\n');
    
    return {
      updatedCount,
      skippedCount
    };
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  addKangSeokKeywordsToImages()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { addKangSeokKeywordsToImages };

