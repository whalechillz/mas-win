/**
 * Solapi 이미지 확인 및 정리 스크립트
 * 
 * 1. 특정 파일들이 메시지에 연결되어 있는지 확인
 * 2. 사용되지 않는 이미지 삭제 (Storage + image_metadata)
 * 3. 중복 이미지 정리
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndCleanup() {
  console.log('='.repeat(100));
  console.log('🔍 Solapi 이미지 확인 및 정리');
  console.log('='.repeat(100));
  console.log('');

  // 1. 확인할 파일들
  const filesToCheck = [
    'solapi-ST01FZ251029054420785uh0PXUpnoe2-1765772328050.jpg',
    'solapi-ST01FZ251215022939395w6sR1vmZC52-1765767537673.jpg'
  ];

  let totalDeleted = 0;
  let totalKept = 0;

  for (const fileName of filesToCheck) {
    const match = fileName.match(/solapi-(ST01FZ[A-Z0-9a-z]+)/);
    if (!match) continue;

    const imageId = match[1];
    console.log(`\n📋 파일: ${fileName}`);
    console.log(`   Solapi imageId: ${imageId}`);

    // 1. channel_sms에서 사용 여부 확인
    console.log('   🔍 channel_sms에서 사용 여부 확인...');
    const { data: messages, error: messagesError } = await supabase
      .from('channel_sms')
      .select('id, message_text, status, created_at')
      .eq('image_url', imageId);

    if (messagesError) {
      console.error(`   ❌ 조회 실패:`, messagesError.message);
      continue;
    }

    if (messages && messages.length > 0) {
      console.log(`   ⚠️  사용 중: ${messages.length}개 메시지`);
      messages.forEach(msg => {
        console.log(`      - 메시지 ID: ${msg.id}, 상태: ${msg.status}`);
      });
      console.log(`   ❌ 삭제 불가: 메시지에서 사용 중입니다.`);
      totalKept++;
      continue;
    }

    console.log(`   ✅ 사용 안 함: channel_sms에서 사용되지 않음`);

    // 2. 같은 imageId를 가진 모든 파일 확인
    console.log('   🔍 같은 imageId를 가진 파일 확인...');
    const { data: allFiles, error: filesError } = await supabase.storage
      .from('blog-images')
      .list('originals/mms/solapi', { limit: 1000 });

    if (filesError) {
      console.error(`   ❌ 파일 조회 실패:`, filesError.message);
      continue;
    }

    const sameImageIdFiles = allFiles?.filter(f => 
      f.name.includes(imageId)
    ) || [];

    if (sameImageIdFiles.length === 0) {
      console.log(`   ✅ 같은 imageId 파일 없음 (이미 삭제됨)`);
      continue;
    }

    console.log(`   📦 같은 imageId 파일: ${sameImageIdFiles.length}개`);

    // 가장 오래된 것만 유지
    sameImageIdFiles.sort((a, b) => 
      new Date(a.created_at || 0) - new Date(b.created_at || 0)
    );

    const keepFile = sameImageIdFiles[0];
    const deleteFiles = sameImageIdFiles.slice(1);

    console.log(`   ✅ 유지: ${keepFile.name} (${keepFile.created_at})`);
    totalKept++;

    // 나머지 파일 삭제
    for (const deleteFile of deleteFiles) {
      const filePath = `originals/mms/solapi/${deleteFile.name}`;
      
      console.log(`   🗑️  삭제 시도: ${deleteFile.name}`);

      // image_metadata에서 먼저 찾기
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);
      
      if (urlData?.publicUrl) {
        // image_metadata에서 삭제
        const { data: metadataList } = await supabase
          .from('image_metadata')
          .select('id')
          .eq('image_url', urlData.publicUrl);

        if (metadataList && metadataList.length > 0) {
          for (const meta of metadataList) {
            await supabase
              .from('image_metadata')
              .delete()
              .eq('id', meta.id);
            console.log(`      🗑️  메타데이터 삭제: ID ${meta.id}`);
          }
        }
      }

      // Storage에서 삭제
      const { error: storageError } = await supabase.storage
        .from('blog-images')
        .remove([filePath]);

      if (storageError) {
        console.error(`      ❌ Storage 삭제 실패:`, storageError.message);
      } else {
        console.log(`      ✅ Storage 삭제 완료`);
        totalDeleted++;
      }
    }
  }

  // 3. 전체 Solapi 폴더 중복 정리
  console.log('\n' + '='.repeat(100));
  console.log('📁 전체 Solapi 폴더 중복 정리');
  console.log('='.repeat(100));
  console.log('');

  const { data: allSolapiFiles, error: allFilesError } = await supabase.storage
    .from('blog-images')
    .list('originals/mms/solapi', { limit: 1000 });

  if (!allFilesError && allSolapiFiles) {
    // imageId로 그룹화
    const imageIdGroups = new Map();
    
    for (const file of allSolapiFiles) {
      const match = file.name.match(/solapi-(ST01FZ[A-Z0-9a-z]+)/);
      if (match) {
        const imageId = match[1];
        if (!imageIdGroups.has(imageId)) {
          imageIdGroups.set(imageId, []);
        }
        imageIdGroups.get(imageId).push({
          name: file.name,
          path: `originals/mms/solapi/${file.name}`,
          created_at: file.created_at
        });
      }
    }

    // 중복 그룹 찾기
    const duplicateGroups = Array.from(imageIdGroups.entries())
      .filter(([imageId, files]) => files.length > 1);

    if (duplicateGroups.length > 0) {
      console.log(`🔍 중복 그룹: ${duplicateGroups.length}개\n`);

      for (const [imageId, fileList] of duplicateGroups) {
        // channel_sms에서 사용 여부 확인
        const { data: msgs } = await supabase
          .from('channel_sms')
          .select('id')
          .eq('image_url', imageId)
          .limit(1);

        if (msgs && msgs.length > 0) {
          console.log(`📦 ${imageId.substring(0, 30)}... (${fileList.length}개) - 사용 중, 건너뜀`);
          continue;
        }

        // 가장 오래된 것만 유지
        fileList.sort((a, b) => 
          new Date(a.created_at || 0) - new Date(b.created_at || 0)
        );

        const keep = fileList[0];
        const deleteList = fileList.slice(1);

        console.log(`📦 ${imageId.substring(0, 30)}... (${fileList.length}개)`);
        console.log(`   ✅ 유지: ${keep.name}`);

        for (const delFile of deleteList) {
          // image_metadata 삭제
          const { data: delUrlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(delFile.path);

          if (delUrlData?.publicUrl) {
            const { data: delMetaList } = await supabase
              .from('image_metadata')
              .select('id')
              .eq('image_url', delUrlData.publicUrl);

            if (delMetaList && delMetaList.length > 0) {
              for (const meta of delMetaList) {
                await supabase
                  .from('image_metadata')
                  .delete()
                  .eq('id', meta.id);
              }
            }
          }

          // Storage 삭제
          const { error: delError } = await supabase.storage
            .from('blog-images')
            .remove([delFile.path]);

          if (!delError) {
            console.log(`   🗑️  삭제: ${delFile.name}`);
            totalDeleted++;
          }
        }
      }
    } else {
      console.log('✅ 중복 이미지 없음');
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('✅ 정리 완료!');
  console.log('='.repeat(100));
  console.log(`📁 유지: ${totalKept}개`);
  console.log(`🗑️  삭제: ${totalDeleted}개`);
  console.log('');
}

checkAndCleanup()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 오류:', error);
    process.exit(1);
  });

