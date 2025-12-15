/**
 * Solapi 이미지 확인 및 originals/mms/solapi로 이동
 * 
 * 1. image_metadata에서 Solapi imageId를 image_url로 가진 항목 찾기
 * 2. 실제 Supabase 파일 찾기
 * 3. image_metadata의 image_url을 Supabase URL로 업데이트
 * 4. 다른 폴더에 있는 Solapi 파일들을 originals/mms/solapi로 이동
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndMoveSolapiImages() {
  console.log('='.repeat(100));
  console.log('🔍 Solapi 이미지 확인 및 정리');
  console.log('='.repeat(100));
  console.log('');

  // 1. image_metadata에서 Solapi imageId를 image_url로 가진 항목 찾기
  console.log('📋 1단계: image_metadata에서 Solapi imageId 찾기\n');
  const { data: metadataWithSolapiId, error: metadataError } = await supabase
    .from('image_metadata')
    .select('id, image_url, folder_path, tags, source, channel')
    .like('image_url', 'ST01FZ%');

  if (metadataError) {
    console.error('❌ image_metadata 조회 실패:', metadataError.message);
    return;
  }

  console.log(`✅ 발견된 항목: ${metadataWithSolapiId?.length || 0}개\n`);

  let updatedCount = 0;
  let notFoundCount = 0;

  // 2. 각 imageId에 대해 실제 파일 찾기 및 업데이트
  if (metadataWithSolapiId && metadataWithSolapiId.length > 0) {
    console.log('📋 2단계: 실제 파일 찾기 및 image_metadata 업데이트\n');

    for (const meta of metadataWithSolapiId) {
      const imageId = meta.image_url;
      console.log(`📋 imageId: ${imageId.substring(0, 30)}...`);
      console.log(`   현재 folder_path: ${meta.folder_path || '(없음)'}`);

      // originals/mms/solapi에서 파일 찾기
      const { data: solapiFiles, error: filesError } = await supabase.storage
        .from('blog-images')
        .list('originals/mms/solapi', { limit: 1000 });

      if (filesError) {
        console.error(`   ❌ 파일 조회 실패:`, filesError.message);
        continue;
      }

      const matchingFile = solapiFiles?.find(f => {
        const match = f.name.match(/solapi-(ST01FZ[A-Z0-9a-z]+)/);
        return match && match[1] === imageId;
      });

      if (matchingFile) {
        const filePath = `originals/mms/solapi/${matchingFile.name}`;
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          console.log(`   ✅ 파일 발견: ${matchingFile.name}`);

          // image_metadata 업데이트
          const { error: updateError } = await supabase
            .from('image_metadata')
            .update({
              image_url: urlData.publicUrl,
              folder_path: 'originals/mms/solapi',
              updated_at: new Date().toISOString()
            })
            .eq('id', meta.id);

          if (updateError) {
            console.error(`   ❌ 업데이트 실패:`, updateError.message);
          } else {
            console.log(`   ✅ image_metadata 업데이트 완료`);
            updatedCount++;
          }
        }
      } else {
        console.log(`   ⚠️  파일을 찾을 수 없음 (get-image-preview API가 생성 필요)`);
        notFoundCount++;
      }
      console.log('');
    }
  }

  // 3. 다른 폴더에 있는 Solapi 파일 찾기 및 이동
  console.log('='.repeat(100));
  console.log('📋 3단계: 다른 폴더에 있는 Solapi 파일 찾기 및 이동');
  console.log('='.repeat(100));
  console.log('');

  const solapiFilesInOtherFolders = [];

  // originals/mms 하위 모든 폴더 스캔
  const { data: mmsFolders, error: foldersError } = await supabase.storage
    .from('blog-images')
    .list('originals/mms', { limit: 1000 });

  if (foldersError) {
    console.error('❌ 폴더 조회 실패:', foldersError.message);
    return;
  }

  for (const folder of mmsFolders || []) {
    if (folder.id) continue; // 파일은 건너뜀
    if (folder.name === 'solapi') continue; // solapi 폴더는 건너뜀

    const folderPath = `originals/mms/${folder.name}`;
    const { data: files, error: filesError } = await supabase.storage
      .from('blog-images')
      .list(folderPath, { limit: 1000 });

    if (filesError) {
      console.warn(`⚠️  폴더 조회 실패 (${folderPath}):`, filesError.message);
      continue;
    }

    const solapiFiles = files?.filter(f => 
      f.id && f.name.includes('solapi-ST01FZ')
    ) || [];

    if (solapiFiles.length > 0) {
      solapiFilesInOtherFolders.push({
        folder: folderPath,
        files: solapiFiles
      });
    }
  }

  if (solapiFilesInOtherFolders.length > 0) {
    console.log(`📦 다른 폴더에 있는 Solapi 파일: ${solapiFilesInOtherFolders.length}개 폴더\n`);

    let movedCount = 0;
    let failedCount = 0;

    for (const { folder, files } of solapiFilesInOtherFolders) {
      console.log(`📁 ${folder}: ${files.length}개 파일\n`);

      for (const file of files) {
        const oldPath = `${folder}/${file.name}`;
        const newPath = `originals/mms/solapi/${file.name}`;

        console.log(`   📦 이동: ${file.name}`);
        console.log(`      ${oldPath}`);
        console.log(`      → ${newPath}`);

        try {
          // 파일 다운로드
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('blog-images')
            .download(oldPath);

          if (downloadError) {
            console.error(`      ❌ 다운로드 실패:`, downloadError.message);
            failedCount++;
            continue;
          }

          // 새 위치에 업로드
          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const { error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(newPath, buffer, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (uploadError) {
            console.error(`      ❌ 업로드 실패:`, uploadError.message);
            failedCount++;
            continue;
          }

          // 새 URL 생성
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(newPath);

          if (urlData?.publicUrl) {
            // image_metadata 업데이트
            const { data: existingMeta } = await supabase
              .from('image_metadata')
              .select('id')
              .eq('image_url', urlData.publicUrl)
              .limit(1);

            if (!existingMeta || existingMeta.length === 0) {
              // 기존 image_metadata 찾기 (oldPath 기반)
              const { data: oldUrlData } = supabase.storage
                .from('blog-images')
                .getPublicUrl(oldPath);

              if (oldUrlData?.publicUrl) {
                const { data: oldMeta } = await supabase
                  .from('image_metadata')
                  .select('id, tags')
                  .eq('image_url', oldUrlData.publicUrl)
                  .limit(1);

                if (oldMeta && oldMeta.length > 0) {
                  await supabase
                    .from('image_metadata')
                    .update({
                      image_url: urlData.publicUrl,
                      folder_path: 'originals/mms/solapi',
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', oldMeta[0].id);
                }
              }
            }

            // 기존 파일 삭제
            const { error: deleteError } = await supabase.storage
              .from('blog-images')
              .remove([oldPath]);

            if (deleteError) {
              console.warn(`      ⚠️  기존 파일 삭제 실패 (무시):`, deleteError.message);
            }

            console.log(`      ✅ 이동 완료`);
            movedCount++;
          }
        } catch (error) {
          console.error(`      ❌ 이동 오류:`, error.message);
          failedCount++;
        }
        console.log('');
      }
    }

    console.log(`✅ 이동 완료: ${movedCount}개 성공, ${failedCount}개 실패\n`);
  } else {
    console.log('✅ 다른 폴더에 Solapi 파일 없음\n');
  }

  // 4. 최종 정리
  console.log('='.repeat(100));
  console.log('✅ 정리 완료!');
  console.log('='.repeat(100));
  console.log(`📋 image_metadata 업데이트: ${updatedCount}개`);
  console.log(`⚠️  파일 없음: ${notFoundCount}개`);
  console.log('');
}

checkAndMoveSolapiImages()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });

