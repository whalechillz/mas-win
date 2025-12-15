/**
 * 타임스탬프가 있는 Solapi 중복 이미지 정리
 * 
 * 같은 imageId를 가진 파일 중:
 * - 타임스탬프가 있는 파일 (예: solapi-{imageId}-{timestamp}.jpg)
 * - 타임스탬프가 없는 파일 (예: solapi-{imageId}.jpg)
 * 
 * 타임스탬프가 없는 파일을 우선 유지하고, 타임스탬프가 있는 파일은 삭제
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupTimestampedDuplicates() {
  console.log('='.repeat(100));
  console.log('🧹 타임스탬프가 있는 Solapi 중복 이미지 정리');
  console.log('='.repeat(100));
  console.log('');

  try {
    // 1. 모든 Solapi 파일 조회
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list('originals/mms/solapi', { limit: 1000 });

    if (listError) {
      console.error('❌ 폴더 조회 실패:', listError.message);
      return;
    }

    if (!files || files.length === 0) {
      console.log('ℹ️  Solapi 폴더에 이미지가 없습니다.');
      return;
    }

    console.log(`✅ 발견된 파일: ${files.length}개\n`);

    // 2. imageId로 그룹화
    const imageIdGroups = new Map();
    
    for (const file of files) {
      const match = file.name.match(/solapi-(ST01FZ[A-Z0-9a-z]+)(?:-(\d+))?\.jpg$/i);
      if (match) {
        const imageId = match[1];
        const hasTimestamp = !!match[2];
        
        if (!imageIdGroups.has(imageId)) {
          imageIdGroups.set(imageId, []);
        }
        
        imageIdGroups.get(imageId).push({
          name: file.name,
          path: `originals/mms/solapi/${file.name}`,
          created_at: file.created_at,
          hasTimestamp: hasTimestamp
        });
      }
    }

    // 3. 같은 imageId를 가진 파일이 2개 이상인 경우 확인
    const duplicateGroups = Array.from(imageIdGroups.entries())
      .filter(([imageId, fileList]) => fileList.length > 1);

    if (duplicateGroups.length === 0) {
      console.log('✅ 중복 이미지가 없습니다.');
      return;
    }

    console.log(`🔍 중복 그룹: ${duplicateGroups.length}개\n`);

    let totalKept = 0;
    let totalDeleted = 0;

    // 4. 각 중복 그룹 처리
    for (const [imageId, fileList] of duplicateGroups) {
      // channel_sms에서 사용 여부 확인
      const { data: messages } = await supabase
        .from('channel_sms')
        .select('id')
        .eq('image_url', imageId)
        .limit(1);

      if (messages && messages.length > 0) {
        console.log(`📦 ${imageId.substring(0, 30)}... (${fileList.length}개) - 메시지에서 사용 중`);
        
        // 타임스탬프가 없는 파일 우선 유지
        const withoutTimestamp = fileList.filter(f => !f.hasTimestamp);
        const withTimestamp = fileList.filter(f => f.hasTimestamp);

        if (withoutTimestamp.length > 0 && withTimestamp.length > 0) {
          // 타임스탬프가 없는 파일 중 가장 오래된 것 유지
          withoutTimestamp.sort((a, b) => 
            new Date(a.created_at || 0) - new Date(b.created_at || 0)
          );
          const keepFile = withoutTimestamp[0];
          const deleteFiles = [...withoutTimestamp.slice(1), ...withTimestamp];

          console.log(`   ✅ 유지: ${keepFile.name}`);

          for (const deleteFile of deleteFiles) {
            // image_metadata 삭제
            const { data: urlData } = supabase.storage
              .from('blog-images')
              .getPublicUrl(deleteFile.path);

            if (urlData?.publicUrl) {
              const { data: metaList } = await supabase
                .from('image_metadata')
                .select('id')
                .eq('image_url', urlData.publicUrl);

              if (metaList && metaList.length > 0) {
                for (const meta of metaList) {
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
              .remove([deleteFile.path]);

            if (!delError) {
              console.log(`   🗑️  삭제: ${deleteFile.name}`);
              totalDeleted++;
            }
          }
          totalKept++;
        } else {
          // 타임스탬프가 모두 있거나 모두 없는 경우: 가장 오래된 것만 유지
          fileList.sort((a, b) => 
            new Date(a.created_at || 0) - new Date(b.created_at || 0)
          );
          const keepFile = fileList[0];
          const deleteFiles = fileList.slice(1);

          console.log(`   ✅ 유지: ${keepFile.name}`);

          for (const deleteFile of deleteFiles) {
            // image_metadata 삭제
            const { data: urlData } = supabase.storage
              .from('blog-images')
              .getPublicUrl(deleteFile.path);

            if (urlData?.publicUrl) {
              const { data: metaList } = await supabase
                .from('image_metadata')
                .select('id')
                .eq('image_url', urlData.publicUrl);

              if (metaList && metaList.length > 0) {
                for (const meta of metaList) {
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
              .remove([deleteFile.path]);

            if (!delError) {
              console.log(`   🗑️  삭제: ${deleteFile.name}`);
              totalDeleted++;
            }
          }
          totalKept++;
        }
        console.log('');
      } else {
        // 메시지에서 사용하지 않는 경우: 가장 오래된 것만 유지
        fileList.sort((a, b) => 
          new Date(a.created_at || 0) - new Date(b.created_at || 0)
        );
        const keepFile = fileList[0];
        const deleteFiles = fileList.slice(1);

        console.log(`📦 ${imageId.substring(0, 30)}... (${fileList.length}개) - 미사용`);
        console.log(`   ✅ 유지: ${keepFile.name}`);

        for (const deleteFile of deleteFiles) {
          // image_metadata 삭제
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(deleteFile.path);

          if (urlData?.publicUrl) {
            const { data: metaList } = await supabase
              .from('image_metadata')
              .select('id')
              .eq('image_url', urlData.publicUrl);

            if (metaList && metaList.length > 0) {
              for (const meta of metaList) {
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
            .remove([deleteFile.path]);

          if (!delError) {
            console.log(`   🗑️  삭제: ${deleteFile.name}`);
            totalDeleted++;
          }
        }
        totalKept++;
        console.log('');
      }
    }

    console.log('='.repeat(100));
    console.log('✅ 정리 완료!');
    console.log('='.repeat(100));
    console.log(`📁 유지: ${totalKept}개`);
    console.log(`🗑️  삭제: ${totalDeleted}개`);
    console.log('');

  } catch (error) {
    console.error('❌ 정리 중 오류:', error);
    process.exit(1);
  }
}

cleanupTimestampedDuplicates();

