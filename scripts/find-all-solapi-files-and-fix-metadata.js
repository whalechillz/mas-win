/**
 * 모든 Solapi 파일 찾기 및 image_metadata 연결/수정
 * 
 * 1. Storage에서 solapi-ST01FZ로 시작하는 모든 파일 찾기
 * 2. 각 파일의 imageId 추출
 * 3. image_metadata에 연결되어 있는지 확인
 * 4. 없으면 생성, 있으면 업데이트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findAllSolapiFilesAndFixMetadata() {
  console.log('='.repeat(100));
  console.log('🔍 모든 Solapi 파일 찾기 및 image_metadata 연결');
  console.log('='.repeat(100));
  console.log('');

  const allSolapiFiles = [];

  // 재귀적으로 모든 폴더에서 Solapi 파일 찾기
  async function findSolapiFilesRecursive(path = '') {
    const { data: items, error } = await supabase.storage
      .from('blog-images')
      .list(path, { limit: 1000 });

    if (error || !items) return;

    for (const item of items) {
      if (!item.id) {
        // 폴더인 경우 재귀 탐색
        const subPath = path ? `${path}/${item.name}` : item.name;
        // temp 폴더는 제외
        if (!subPath.startsWith('temp/')) {
          await findSolapiFilesRecursive(subPath);
        }
      } else if (item.name.includes('solapi-ST01FZ')) {
        // Solapi 파일 발견
        const fullPath = path ? `${path}/${item.name}` : item.name;
        const match = item.name.match(/solapi-(ST01FZ[A-Z0-9a-z]+)/);
        
        if (match) {
          allSolapiFiles.push({
            name: item.name,
            path: fullPath,
            imageId: match[1],
            created_at: item.created_at
          });
        }
      }
    }
  }

  console.log('📁 Storage 스캔 중...\n');
  await findSolapiFilesRecursive('');

  console.log(`✅ 발견된 Solapi 파일: ${allSolapiFiles.length}개\n`);

  if (allSolapiFiles.length === 0) {
    console.log('ℹ️  Solapi 파일이 없습니다.');
    return;
  }

  // 폴더별로 그룹화
  const filesByFolder = {};
  allSolapiFiles.forEach(file => {
    const folder = file.path.split('/').slice(0, -1).join('/') || '루트';
    if (!filesByFolder[folder]) {
      filesByFolder[folder] = [];
    }
    filesByFolder[folder].push(file);
  });

  console.log('📁 폴더별 분류:\n');
  Object.keys(filesByFolder).sort().forEach(folder => {
    console.log(`📁 ${folder}: ${filesByFolder[folder].length}개`);
  });
  console.log('');

  // originals/mms/solapi로 이동할 파일들
  const filesToMove = [];
  const filesInSolapi = [];

  for (const file of allSolapiFiles) {
    if (file.path.startsWith('originals/mms/solapi/')) {
      filesInSolapi.push(file);
    } else {
      filesToMove.push(file);
    }
  }

  // 1. originals/mms/solapi에 있는 파일들의 image_metadata 확인 및 생성
  console.log('='.repeat(100));
  console.log('📋 1단계: originals/mms/solapi 파일들의 image_metadata 확인');
  console.log('='.repeat(100));
  console.log('');

  let createdCount = 0;
  let updatedCount = 0;

  for (const file of filesInSolapi) {
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(file.path);

    if (!urlData?.publicUrl) continue;

    // image_metadata에서 찾기
    const { data: existing } = await supabase
      .from('image_metadata')
      .select('id, image_url, tags')
      .eq('image_url', urlData.publicUrl)
      .limit(1);

    if (existing && existing.length > 0) {
      // 기존 메타데이터 확인
      const meta = existing[0];
      const hasSolapiTag = meta.tags?.includes(`solapi-${file.imageId}`);

      if (!hasSolapiTag) {
        // solapi 태그 추가
        const tags = meta.tags || [];
        const newTags = [...new Set([...tags, `solapi-${file.imageId}`, 'solapi-permanent'])];
        
        await supabase
          .from('image_metadata')
          .update({
            tags: newTags,
            folder_path: 'originals/mms/solapi',
            updated_at: new Date().toISOString()
          })
          .eq('id', meta.id);

        console.log(`✅ 태그 추가: ${file.name}`);
        updatedCount++;
      } else {
        console.log(`ℹ️  이미 연결됨: ${file.name}`);
      }
    } else {
      // 새 메타데이터 생성
      const { error: insertError } = await supabase
        .from('image_metadata')
        .insert({
          image_url: urlData.publicUrl,
          folder_path: 'originals/mms/solapi',
          source: 'mms',
          channel: 'sms',
          upload_source: 'solapi-permanent',
          tags: [`solapi-${file.imageId}`, 'solapi-permanent', 'mms'],
          title: `MMS 이미지 - Solapi (${file.imageId.substring(0, 20)}...)`,
          alt_text: 'MMS 이미지',
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error(`❌ 생성 실패 (${file.name}):`, insertError.message);
      } else {
        console.log(`✅ 메타데이터 생성: ${file.name}`);
        createdCount++;
      }
    }
  }

  // 2. 다른 폴더에 있는 파일들을 originals/mms/solapi로 이동
  if (filesToMove.length > 0) {
    console.log('\n' + '='.repeat(100));
    console.log('📋 2단계: 다른 폴더의 파일들을 originals/mms/solapi로 이동');
    console.log('='.repeat(100));
    console.log('');

    let movedCount = 0;
    let failedCount = 0;

    for (const file of filesToMove) {
      const newPath = `originals/mms/solapi/${file.name}`;

      // 이미 같은 이름의 파일이 있는지 확인
      const { data: existingFiles } = await supabase.storage
        .from('blog-images')
        .list('originals/mms/solapi', { limit: 1000 });

      const alreadyExists = existingFiles?.some(f => f.name === file.name);

      if (alreadyExists) {
        console.log(`⚠️  이미 존재함 (건너뜀): ${file.name}`);
        
        // 기존 파일의 메타데이터만 확인
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(newPath);

        if (urlData?.publicUrl) {
          const { data: existing } = await supabase
            .from('image_metadata')
            .select('id, tags')
            .eq('image_url', urlData.publicUrl)
            .limit(1);

          if (existing && existing.length > 0) {
            const tags = existing[0].tags || [];
            if (!tags.includes(`solapi-${file.imageId}`)) {
              await supabase
                .from('image_metadata')
                .update({
                  tags: [...new Set([...tags, `solapi-${file.imageId}`])],
                  updated_at: new Date().toISOString()
                })
                .eq('id', existing[0].id);
            }
          }
        }

        // 기존 파일 삭제
        const { error: deleteError } = await supabase.storage
          .from('blog-images')
          .remove([file.path]);

        if (!deleteError) {
          console.log(`   🗑️  중복 파일 삭제: ${file.path}`);
        }
        continue;
      }

      console.log(`📦 이동: ${file.name}`);
      console.log(`   ${file.path} → ${newPath}`);

      try {
        // 파일 다운로드
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('blog-images')
          .download(file.path);

        if (downloadError) {
          console.error(`   ❌ 다운로드 실패:`, downloadError.message);
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
          console.error(`   ❌ 업로드 실패:`, uploadError.message);
          failedCount++;
          continue;
        }

        // 새 URL 생성
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(newPath);

        if (urlData?.publicUrl) {
          // image_metadata 생성/업데이트
          const { data: existing } = await supabase
            .from('image_metadata')
            .select('id, tags')
            .eq('image_url', urlData.publicUrl)
            .limit(1);

          if (existing && existing.length > 0) {
            // 기존 메타데이터 업데이트
            const tags = existing[0].tags || [];
            const newTags = [...new Set([...tags, `solapi-${file.imageId}`, 'solapi-permanent'])];
            
            await supabase
              .from('image_metadata')
              .update({
                tags: newTags,
                folder_path: 'originals/mms/solapi',
                updated_at: new Date().toISOString()
              })
              .eq('id', existing[0].id);
          } else {
            // 새 메타데이터 생성
            await supabase
              .from('image_metadata')
              .insert({
                image_url: urlData.publicUrl,
                folder_path: 'originals/mms/solapi',
                source: 'mms',
                channel: 'sms',
                upload_source: 'solapi-permanent',
                tags: [`solapi-${file.imageId}`, 'solapi-permanent', 'mms'],
                title: `MMS 이미지 - Solapi (${file.imageId.substring(0, 20)}...)`,
                alt_text: 'MMS 이미지',
                updated_at: new Date().toISOString()
              });
          }

          // 기존 파일 삭제
          const { error: deleteError } = await supabase.storage
            .from('blog-images')
            .remove([file.path]);

          if (deleteError) {
            console.warn(`   ⚠️  기존 파일 삭제 실패 (무시):`, deleteError.message);
          }

          console.log(`   ✅ 이동 완료`);
          movedCount++;
        }
      } catch (error) {
        console.error(`   ❌ 이동 오류:`, error.message);
        failedCount++;
      }
      console.log('');
    }

    console.log(`✅ 이동 완료: ${movedCount}개 성공, ${failedCount}개 실패\n`);
  }

  // 3. 최종 정리
  console.log('='.repeat(100));
  console.log('✅ 정리 완료!');
  console.log('='.repeat(100));
  console.log(`📋 image_metadata 생성: ${createdCount}개`);
  console.log(`📋 image_metadata 업데이트: ${updatedCount}개`);
  if (filesToMove.length > 0) {
    console.log(`📦 파일 이동: ${filesToMove.length}개`);
  }
  console.log('');
}

findAllSolapiFilesAndFixMetadata()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });

