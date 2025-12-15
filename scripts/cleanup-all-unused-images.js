/**
 * 모든 중복 및 미사용 이미지 정리 스크립트
 * 
 * 1. Solapi 중복 이미지 정리
 * 2. 미사용 이미지 감지 및 삭제
 * 3. image_metadata 정리
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupAllUnusedImages() {
  console.log('='.repeat(100));
  console.log('🧹 모든 중복 및 미사용 이미지 정리 시작');
  console.log('='.repeat(100));
  console.log('');

  try {
    // 1. Solapi 중복 이미지 정리
    console.log('📁 1단계: Solapi 중복 이미지 정리\n');
    const { data: solapiFiles, error: solapiError } = await supabase.storage
      .from('blog-images')
      .list('originals/mms/solapi', {
        limit: 1000
      });

    if (!solapiError && solapiFiles && solapiFiles.length > 0) {
      const imageIdGroups = new Map();
      
      for (const file of solapiFiles) {
        const match = file.name.match(/solapi-(ST01FZ[A-Z0-9a-z]+)(?:-(\d+))?\.jpg$/i);
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

      const duplicateGroups = Array.from(imageIdGroups.entries())
        .filter(([imageId, files]) => files.length > 1);

      if (duplicateGroups.length > 0) {
        console.log(`🔍 Solapi 중복 그룹: ${duplicateGroups.length}개\n`);
        let deletedCount = 0;

        for (const [imageId, fileList] of duplicateGroups) {
          fileList.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          const keepFile = fileList[0];
          const deleteFiles = fileList.slice(1);

          console.log(`📦 ${imageId.substring(0, 30)}... (${fileList.length}개)`);
          console.log(`   ✅ 유지: ${keepFile.name}`);

          for (const deleteFile of deleteFiles) {
            const { error } = await supabase.storage
              .from('blog-images')
              .remove([deleteFile.path]);

            if (!error) {
              console.log(`   🗑️  삭제: ${deleteFile.name}`);
              deletedCount++;
            }
          }
        }

        console.log(`\n✅ Solapi 중복 이미지 삭제: ${deletedCount}개\n`);
      } else {
        console.log('✅ Solapi 중복 이미지 없음\n');
      }
    }

    // 2. 미사용 이미지 감지 (image_metadata에 있지만 실제로 사용되지 않는 이미지)
    console.log('📋 2단계: 미사용 이미지 감지\n');
    
    // 모든 image_metadata 조회
    const { data: allMetadata, error: metadataError } = await supabase
      .from('image_metadata')
      .select('id, image_url, tags, usage_count, folder_path')
      .eq('source', 'mms')
      .eq('channel', 'sms');

    if (metadataError) {
      console.error('❌ 메타데이터 조회 실패:', metadataError.message);
      return;
    }

    if (!allMetadata || allMetadata.length === 0) {
      console.log('ℹ️  MMS 이미지 메타데이터가 없습니다.\n');
      return;
    }

    console.log(`📋 전체 MMS 이미지 메타데이터: ${allMetadata.length}개\n`);

    // usage_count가 0이고 태그에 sms-{id}가 없는 이미지 찾기
    const unusedImages = allMetadata.filter(meta => {
      const hasUsage = meta.usage_count > 0;
      const hasSmsTag = meta.tags?.some(tag => tag.startsWith('sms-'));
      return !hasUsage && !hasSmsTag;
    });

    if (unusedImages.length > 0) {
      console.log(`🔍 미사용 이미지: ${unusedImages.length}개\n`);
      console.log('🗑️  미사용 이미지 삭제 중...\n');
      let deletedCount = 0;
      let failedCount = 0;

      for (const img of unusedImages) {
        try {
          // image_metadata에서 삭제
          const { error: deleteError } = await supabase
            .from('image_metadata')
            .delete()
            .eq('id', img.id);

          if (deleteError) {
            console.error(`   ❌ 삭제 실패 (ID: ${img.id}):`, deleteError.message);
            failedCount++;
          } else {
            console.log(`   🗑️  삭제: ${img.image_url.substring(0, 60)}...`);
            deletedCount++;

            // Storage에서도 삭제 시도 (폴더 경로가 있는 경우)
            if (img.folder_path) {
              const fileName = img.image_url.split('/').pop();
              const filePath = `${img.folder_path}/${fileName}`;
              
              const { error: storageError } = await supabase.storage
                .from('blog-images')
                .remove([filePath]);

              if (storageError) {
                console.log(`      ⚠️  Storage 삭제 실패 (무시): ${storageError.message}`);
              }
            }
          }
        } catch (error) {
          console.error(`   ❌ 삭제 오류 (ID: ${img.id}):`, error.message);
          failedCount++;
        }
      }

      console.log(`\n✅ 미사용 이미지 삭제 완료: ${deletedCount}개 삭제, ${failedCount}개 실패\n`);
    } else {
      console.log('✅ 미사용 이미지 없음\n');
    }

    // 3. image_metadata 중복 항목 정리 (같은 image_url을 가진 항목)
    console.log('📋 3단계: image_metadata 중복 항목 정리\n');
    
    const urlGroups = new Map();
    allMetadata.forEach(meta => {
      if (!urlGroups.has(meta.image_url)) {
        urlGroups.set(meta.image_url, []);
      }
      urlGroups.get(meta.image_url).push(meta);
    });

    const duplicateMetadata = Array.from(urlGroups.entries())
      .filter(([url, metas]) => metas.length > 1);

    if (duplicateMetadata.length > 0) {
      console.log(`🔍 중복 메타데이터 그룹: ${duplicateMetadata.length}개\n`);
      let mergedCount = 0;

      for (const [url, metas] of duplicateMetadata) {
        // 가장 오래된 것 유지, 나머지는 태그 통합 후 삭제
        metas.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        const keepMeta = metas[0];
        const deleteMetas = metas.slice(1);

        // 모든 태그 통합
        const allTags = new Set();
        metas.forEach(m => {
          if (m.tags && Array.isArray(m.tags)) {
            m.tags.forEach(tag => allTags.add(tag));
          }
        });

        // 유지할 메타데이터 업데이트
        await supabase
          .from('image_metadata')
          .update({
            tags: Array.from(allTags),
            updated_at: new Date().toISOString()
          })
          .eq('id', keepMeta.id);

        // 나머지 삭제
        for (const deleteMeta of deleteMetas) {
          await supabase
            .from('image_metadata')
            .delete()
            .eq('id', deleteMeta.id);
          mergedCount++;
        }

        console.log(`✅ ${url.substring(0, 50)}... (${metas.length}개 → 1개)`);
      }

      console.log(`\n✅ 중복 메타데이터 통합: ${mergedCount}개 삭제\n`);
    } else {
      console.log('✅ 중복 메타데이터 없음\n');
    }

    console.log('='.repeat(100));
    console.log('✅ 정리 완료!');
    console.log('='.repeat(100));
    console.log('');

  } catch (error) {
    console.error('❌ 정리 중 오류:', error);
    process.exit(1);
  }
}

cleanupAllUnusedImages();

