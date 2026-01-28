/**
 * leenalgu-8768 폴더 완전 삭제
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteLeenalguFolder() {
  console.log('🗑️  leenalgu-8768 폴더 삭제 중...\n');

  try {
    // 1. 하위 폴더 확인
    const { data: folders, error: foldersError } = await supabase.storage
      .from('blog-images')
      .list('originals/customers/leenalgu-8768', {
        limit: 100
      });

    if (foldersError) {
      console.error('❌ 폴더 조회 실패:', foldersError);
      return;
    }

    if (!folders || folders.length === 0) {
      console.log('✅ 폴더가 이미 비어있습니다.');
      return;
    }

    console.log(`📂 발견된 항목: ${folders.length}개\n`);

    // 2. 모든 하위 폴더와 파일 삭제
    const filesToDelete = [];
    
    for (const folder of folders) {
      if (folder.name) {
        const folderPath = `originals/customers/leenalgu-8768/${folder.name}`;
        
        // 하위 파일 확인
        const { data: files, error: filesError } = await supabase.storage
          .from('blog-images')
          .list(folderPath, {
            limit: 1000
          });

        if (!filesError && files && files.length > 0) {
          files.forEach(file => {
            if (file.name) {
              filesToDelete.push(`${folderPath}/${file.name}`);
            }
          });
        } else {
          // 폴더만 있는 경우
          filesToDelete.push(folderPath);
        }
      }
    }

    if (filesToDelete.length > 0) {
      console.log(`📝 삭제할 항목: ${filesToDelete.length}개\n`);
      
      // 배치로 삭제 (Supabase는 한 번에 여러 파일 삭제 가능)
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove(filesToDelete);

      if (deleteError) {
        console.error('❌ 파일 삭제 실패:', deleteError);
      } else {
        console.log(`✅ ${filesToDelete.length}개 항목 삭제 완료`);
      }
    }

    // 3. 최상위 폴더 삭제 시도
    const { error: folderDeleteError } = await supabase.storage
      .from('blog-images')
      .remove(['originals/customers/leenalgu-8768']);

    if (folderDeleteError) {
      console.log(`⚠️  폴더 삭제 실패 (이미 비어있을 수 있음): ${folderDeleteError.message}`);
    } else {
      console.log('✅ leenalgu-8768 폴더 삭제 완료');
    }

    // 4. 최종 확인
    const { data: finalCheck } = await supabase.storage
      .from('blog-images')
      .list('originals/customers/leenalgu-8768', {
        limit: 1
      });

    if (!finalCheck || finalCheck.length === 0) {
      console.log('\n✅ leenalgu-8768 폴더가 완전히 삭제되었습니다.');
    } else {
      console.log(`\n⚠️  아직 ${finalCheck.length}개 항목이 남아있습니다.`);
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

deleteLeenalguFolder().catch(console.error);
