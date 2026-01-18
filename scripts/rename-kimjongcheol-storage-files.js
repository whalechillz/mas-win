/**
 * 김종철 고객 Storage 파일명 및 폴더명 변경 스크립트
 * kimjotcheot -> kimjongchull
 * kimjotcheot-6654 -> kimjongchull-6654
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CUSTOMER_ID = 15203;
const OLD_NAME_EN = 'kimjotcheot';
const NEW_NAME_EN = 'kimjongchull';
const OLD_FOLDER_NAME = 'kimjotcheot-6654';
const NEW_FOLDER_NAME = 'kimjongchull-6654';
const VISIT_DATE = '2024-10-21';
const DATE_FOLDER = VISIT_DATE.replace(/-/g, '.');

async function renameStorageFiles() {
  console.log('🔄 김종철 고객 Storage 파일명 및 폴더명 변경 시작...\n');

  // 1. image_metadata에서 모든 이미지 조회
  console.log('1️⃣ 이미지 메타데이터 조회...');
  const { data: images, error: fetchError } = await supabase
    .from('image_metadata')
    .select('id, image_url, english_filename, folder_path')
    .contains('tags', [`customer-${CUSTOMER_ID}`]);

  if (fetchError) {
    console.error('❌ 이미지 조회 실패:', fetchError);
    return;
  }

  console.log(`✅ ${images.length}개 이미지 발견\n`);

  // 2. 각 이미지 파일명 및 경로 변경
  let successCount = 0;
  let failCount = 0;

  for (const image of images) {
    try {
      console.log(`📤 처리 중: ${image.english_filename || '알 수 없음'}`);

      // 기존 Storage 경로 추출
      const oldStoragePath = image.image_url.replace(
        `${supabaseUrl}/storage/v1/object/public/${bucketName}/`,
        ''
      );

      // 새 파일명 생성
      const newFileName = image.english_filename || oldStoragePath.split('/').pop();
      const newFileNameUpdated = newFileName.replace(OLD_NAME_EN, NEW_NAME_EN);

      // 새 폴더 경로 생성
      const newFolderPath = `originals/customers/${NEW_FOLDER_NAME}/${DATE_FOLDER}`;
      const newStoragePath = `${newFolderPath}/${newFileNameUpdated}`;

      console.log(`   기존: ${oldStoragePath}`);
      console.log(`   변경: ${newStoragePath}`);

      // Storage에서 파일 복사 (이동)
      // Supabase Storage는 직접 rename이 없으므로 복사 후 삭제
      const { data: fileData, error: readError } = await supabase.storage
        .from(bucketName)
        .download(oldStoragePath);

      if (readError) {
        console.error(`   ❌ 파일 읽기 실패: ${readError.message}`);
        failCount++;
        continue;
      }

      // 새 경로로 업로드
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(newStoragePath, await fileData.arrayBuffer(), {
          contentType: 'image/webp',
          upsert: true
        });

      if (uploadError) {
        console.error(`   ❌ 파일 업로드 실패: ${uploadError.message}`);
        failCount++;
        continue;
      }

      // 새 URL 생성
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(newStoragePath);

      // 메타데이터 업데이트
      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({
          image_url: publicUrl,
          folder_path: newFolderPath,
          english_filename: newFileNameUpdated
        })
        .eq('id', image.id);

      if (updateError) {
        console.error(`   ❌ 메타데이터 업데이트 실패: ${updateError.message}`);
        failCount++;
        continue;
      }

      // 기존 파일 삭제
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([oldStoragePath]);

      if (deleteError) {
        console.warn(`   ⚠️  기존 파일 삭제 실패 (계속 진행): ${deleteError.message}`);
      }

      console.log(`   ✅ 완료: ${newFileNameUpdated}`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ 처리 실패: ${error.message}`);
      failCount++;
    }
  }

  // 3. customers 테이블의 folder_name 업데이트
  console.log('\n3️⃣ customers 테이블 folder_name 업데이트...');
  const { error: folderUpdateError } = await supabase
    .from('customers')
    .update({ folder_name: NEW_FOLDER_NAME })
    .eq('id', CUSTOMER_ID);

  if (folderUpdateError) {
    console.error('❌ folder_name 업데이트 실패:', folderUpdateError);
  } else {
    console.log(`✅ folder_name 업데이트 완료: ${OLD_FOLDER_NAME} -> ${NEW_FOLDER_NAME}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Storage 파일명 및 폴더명 변경 완료!');
  console.log('='.repeat(60));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📁 폴더명: ${OLD_FOLDER_NAME} -> ${NEW_FOLDER_NAME}`);
  console.log('='.repeat(60));
}

renameStorageFiles()
  .then(() => {
    console.log('\n✅ 변경 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 변경 중 오류 발생:', error);
    process.exit(1);
  });
