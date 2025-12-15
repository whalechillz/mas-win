/**
 * 갤러리에서 보이는 모든 Solapi 이미지 확인 및 정리
 * 
 * 1. Storage에서 모든 Solapi 파일 찾기
 * 2. image_metadata 확인 및 생성/업데이트
 * 3. channel_sms에서 사용 여부 확인
 * 4. 중복 파일 정리
 * 5. 모든 파일을 originals/mms/solapi로 통합
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function comprehensiveSolapiCleanup() {
  console.log('='.repeat(100));
  console.log('🔍 갤러리 Solapi 이미지 종합 정리');
  console.log('='.repeat(100));
  console.log('');

  const allSolapiFiles = [];
  const imageIdToFiles = new Map(); // imageId -> [files]

  // 1. Storage 전체에서 Solapi 파일 찾기
  console.log('📁 1단계: Storage 전체 스캔 중...\n');
  
  async function findSolapiFilesRecursive(path = '') {
    try {
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
            const imageId = match[1];
            const fileInfo = {
              name: item.name,
              path: fullPath,
              imageId: imageId,
              created_at: item.created_at,
              folder: path
            };
            
            allSolapiFiles.push(fileInfo);
            
            if (!imageIdToFiles.has(imageId)) {
              imageIdToFiles.set(imageId, []);
            }
            imageIdToFiles.get(imageId).push(fileInfo);
          }
        }
      }
    } catch (error) {
      console.error(`❌ 폴더 스캔 오류 (${path}):`, error.message);
    }
  }

  await findSolapiFilesRecursive('');

  console.log(`✅ 발견된 Solapi 파일: ${allSolapiFiles.length}개`);
  console.log(`✅ 고유 imageId: ${imageIdToFiles.size}개\n`);

  // 폴더별 분류
  const filesByFolder = {};
  allSolapiFiles.forEach(file => {
    const folder = file.folder || '루트';
    if (!filesByFolder[folder]) {
      filesByFolder[folder] = [];
    }
    filesByFolder[folder].push(file);
  });

  console.log('📁 폴더별 분류:\n');
  Object.keys(filesByFolder).sort().forEach(folder => {
    console.log(`   ${folder}: ${filesByFolder[folder].length}개`);
  });
  console.log('');

  // 2. channel_sms에서 사용 중인 imageId 확인
  console.log('='.repeat(100));
  console.log('📋 2단계: channel_sms에서 사용 중인 imageId 확인');
  console.log('='.repeat(100));
  console.log('');

  const { data: messages, error: messagesError } = await supabase
    .from('channel_sms')
    .select('id, image_url, status')
    .not('image_url', 'is', null);

  if (messagesError) {
    console.error('❌ 메시지 조회 실패:', messagesError.message);
    return;
  }

  const usedImageIds = new Set();
  messages?.forEach(msg => {
    if (msg.image_url && msg.image_url.startsWith('ST01FZ')) {
      usedImageIds.add(msg.image_url);
    }
  });

  console.log(`✅ 사용 중인 imageId: ${usedImageIds.size}개\n`);

  // 3. 각 imageId별로 파일 정리 및 image_metadata 생성
  console.log('='.repeat(100));
  console.log('📋 3단계: 파일 정리 및 image_metadata 생성/업데이트');
  console.log('='.repeat(100));
  console.log('');

  let totalMoved = 0;
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalDeleted = 0;

  for (const [imageId, files] of imageIdToFiles.entries()) {
    const isUsed = usedImageIds.has(imageId);
    
    console.log(`📦 imageId: ${imageId.substring(0, 30)}... (${files.length}개 파일, 사용: ${isUsed ? '✅' : '❌'})`);

    // 파일 정렬: originals/mms/solapi에 있는 것 우선, 그 다음 생성일 오름차순
    files.sort((a, b) => {
      const aInSolapi = a.path.startsWith('originals/mms/solapi/');
      const bInSolapi = b.path.startsWith('originals/mms/solapi/');
      
      if (aInSolapi && !bInSolapi) return -1;
      if (!aInSolapi && bInSolapi) return 1;
      
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    });

    const keepFile = files[0];
    const deleteFiles = files.slice(1);

    // keepFile이 originals/mms/solapi에 없으면 이동
    if (!keepFile.path.startsWith('originals/mms/solapi/')) {
      const newPath = `originals/mms/solapi/${keepFile.name}`;
      
      // 이미 같은 이름의 파일이 있는지 확인
      const { data: existingFiles } = await supabase.storage
        .from('blog-images')
        .list('originals/mms/solapi', { limit: 1000 });

      const alreadyExists = existingFiles?.some(f => f.name === keepFile.name);

      if (!alreadyExists) {
        console.log(`   📦 이동: ${keepFile.name}`);
        console.log(`      ${keepFile.path} → ${newPath}`);

        try {
          // 파일 다운로드
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('blog-images')
            .download(keepFile.path);

          if (downloadError) {
            console.error(`      ❌ 다운로드 실패:`, downloadError.message);
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
            continue;
          }

          // 기존 파일 삭제
          const { error: deleteError } = await supabase.storage
            .from('blog-images')
            .remove([keepFile.path]);

          if (deleteError) {
            console.warn(`      ⚠️  기존 파일 삭제 실패 (무시):`, deleteError.message);
          }

          keepFile.path = newPath;
          console.log(`      ✅ 이동 완료`);
          totalMoved++;
        } catch (error) {
          console.error(`      ❌ 이동 오류:`, error.message);
          continue;
        }
      } else {
        console.log(`   ⚠️  이미 존재함: ${keepFile.name}`);
        // 기존 파일 삭제
        const { error: deleteError } = await supabase.storage
          .from('blog-images')
          .remove([keepFile.path]);

        if (!deleteError) {
          console.log(`   🗑️  중복 파일 삭제: ${keepFile.path}`);
          totalDeleted++;
        }
        keepFile.path = newPath;
      }
    } else {
      console.log(`   ✅ 올바른 위치: ${keepFile.name}`);
    }

    // keepFile의 URL 생성
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(keepFile.path);

    if (!urlData?.publicUrl) {
      console.log(`   ⚠️  URL 생성 실패`);
      continue;
    }

    // image_metadata 확인 및 생성/업데이트
    const { data: existing } = await supabase
      .from('image_metadata')
      .select('id, image_url, tags')
      .eq('image_url', urlData.publicUrl)
      .limit(1);

    if (existing && existing.length > 0) {
      // 기존 메타데이터 업데이트
      const meta = existing[0];
      const tags = meta.tags || [];
      const newTags = [...new Set([...tags, `solapi-${imageId}`, 'solapi-permanent', 'mms'])];

      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({
          tags: newTags,
          folder_path: 'originals/mms/solapi',
          updated_at: new Date().toISOString()
        })
        .eq('id', meta.id);

      if (updateError) {
        console.error(`   ❌ 업데이트 실패:`, updateError.message);
      } else {
        console.log(`   ✅ image_metadata 업데이트`);
        totalUpdated++;
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
          tags: [`solapi-${imageId}`, 'solapi-permanent', 'mms'],
          title: `MMS 이미지 - Solapi (${imageId.substring(0, 20)}...)`,
          alt_text: 'MMS 이미지',
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error(`   ❌ 생성 실패:`, insertError.message);
      } else {
        console.log(`   ✅ image_metadata 생성`);
        totalCreated++;
      }
    }

    // 중복 파일 삭제
    for (const deleteFile of deleteFiles) {
      console.log(`   🗑️  삭제: ${deleteFile.name} (${deleteFile.path})`);

      // image_metadata에서도 삭제
      const { data: delUrlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(deleteFile.path);

      if (delUrlData?.publicUrl) {
        const { data: delMeta } = await supabase
          .from('image_metadata')
          .select('id')
          .eq('image_url', delUrlData.publicUrl)
          .limit(1);

        if (delMeta && delMeta.length > 0) {
          await supabase
            .from('image_metadata')
            .delete()
            .eq('id', delMeta[0].id);
        }
      }

      // Storage에서 삭제
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove([deleteFile.path]);

      if (deleteError) {
        console.error(`      ❌ 삭제 실패:`, deleteError.message);
      } else {
        totalDeleted++;
      }
    }

    console.log('');
  }

  // 4. 최종 정리
  console.log('='.repeat(100));
  console.log('✅ 정리 완료!');
  console.log('='.repeat(100));
  console.log(`📦 파일 이동: ${totalMoved}개`);
  console.log(`📋 image_metadata 생성: ${totalCreated}개`);
  console.log(`📋 image_metadata 업데이트: ${totalUpdated}개`);
  console.log(`🗑️  중복 파일 삭제: ${totalDeleted}개`);
  console.log('');

  // 5. 최종 상태 확인
  console.log('='.repeat(100));
  console.log('📊 최종 상태 확인');
  console.log('='.repeat(100));
  console.log('');

  const { data: finalFiles } = await supabase.storage
    .from('blog-images')
    .list('originals/mms/solapi', { limit: 1000 });

  console.log(`📁 originals/mms/solapi 파일: ${finalFiles?.length || 0}개\n`);

  const { data: finalMetadata } = await supabase
    .from('image_metadata')
    .select('id, image_url, tags')
    .eq('folder_path', 'originals/mms/solapi')
    .limit(1000);

  console.log(`📋 image_metadata 항목: ${finalMetadata?.length || 0}개\n`);

  // imageId별로 그룹화하여 확인
  const imageIdCount = new Map();
  finalMetadata?.forEach(meta => {
    const solapiTag = meta.tags?.find(tag => tag.startsWith('solapi-ST01FZ'));
    if (solapiTag) {
      const imageId = solapiTag.replace('solapi-', '');
      imageIdCount.set(imageId, (imageIdCount.get(imageId) || 0) + 1);
    }
  });

  console.log(`📦 고유 imageId (image_metadata): ${imageIdCount.size}개\n`);
}

comprehensiveSolapiCleanup()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });

