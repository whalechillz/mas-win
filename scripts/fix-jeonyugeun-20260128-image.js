/**
 * 전유근 고객의 2026-01-28 이미지 파일 위치 수정
 * file_path는 2026-01-21로 업데이트되었지만 실제 파일은 2026-01-28에 있음
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

async function fixImageLocation() {
  console.log('🔧 전유근 고객의 2026-01-28 이미지 파일 위치 수정...\n');

  try {
    const imageId = 'd042859f-f249-4632-a6fe-4436101b99e3'; // 첫 번째 이미지 ID
    const fileName = 'jeonyugeun-S1-20260128-01.webp';
    const folderName = 'jeonyugeun-9269';

    // 현재 file_path (2026-01-21)
    const currentFilePath = `originals/customers/${folderName}/2026-01-21/${fileName}`;
    // 실제 파일이 있는 경로 (2026-01-28)
    const actualFilePath = `originals/customers/${folderName}/2026-01-28/${fileName}`;

    console.log(`📸 이미지: ${fileName}`);
    console.log(`   현재 file_path: ${currentFilePath}`);
    console.log(`   실제 파일 경로: ${actualFilePath}\n`);

    // 실제 파일이 있는지 확인
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list(`originals/customers/${folderName}/2026-01-28`, {
        search: fileName
      });

    const fileExists = !listError && files && files.length > 0;
    console.log(`   실제 파일 존재: ${fileExists ? '✅' : '❌'}`);

    if (!fileExists) {
      console.error('❌ 실제 파일을 찾을 수 없습니다.');
      return;
    }

    // 목표 폴더 생성
    const targetFolder = `originals/customers/${folderName}/2026-01-21`;
    const { error: listTargetError } = await supabase.storage
      .from('blog-images')
      .list(targetFolder);

    if (listTargetError) {
      const markerPath = `${targetFolder}/.folder`;
      await supabase.storage
        .from('blog-images')
        .upload(markerPath, new Blob(['folder marker'], { type: 'text/plain' }), {
          upsert: true,
          contentType: 'text/plain'
        });
      console.log(`✅ 폴더 생성: ${targetFolder}`);
    }

    // 파일 이동
    console.log(`📁 파일 이동 시작...`);
    const { data: moveData, error: moveError } = await supabase.storage
      .from('blog-images')
      .move(actualFilePath, currentFilePath);

    if (moveError) {
      console.error('❌ 파일 이동 실패:', moveError);
      return;
    }

    console.log('✅ 파일 이동 완료');

    // cdn_url 업데이트
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(currentFilePath);

    const { data: updatedImage, error: updateError } = await supabase
      .from('image_assets')
      .update({
        cdn_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', imageId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ cdn_url 업데이트 실패:', updateError);
    } else {
      console.log('✅ cdn_url 업데이트 완료');
    }

    console.log('\n✅ 작업 완료!');
  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

fixImageLocation().catch(console.error);
