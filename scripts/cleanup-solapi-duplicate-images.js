/**
 * Solapi 중복 이미지 정리 스크립트
 * 
 * 1. originals/mms/solapi 폴더의 모든 파일 조회
 * 2. 같은 Solapi imageId를 가진 파일들 그룹화
 * 3. 가장 오래된 파일만 유지, 나머지 삭제
 * 4. image_metadata에서 중복 항목 정리
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupSolapiDuplicates() {
  console.log('='.repeat(100));
  console.log('🧹 Solapi 중복 이미지 정리 시작');
  console.log('='.repeat(100));
  console.log('');

  try {
    // 1. originals/mms/solapi 폴더의 모든 파일 조회
    console.log('📁 originals/mms/solapi 폴더 스캔 중...');
    const { data: files, error: listError } = await supabase.storage
      .from('blog-images')
      .list('originals/mms/solapi', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' }
      });

    if (listError) {
      console.error('❌ 폴더 조회 실패:', listError.message);
      return;
    }

    if (!files || files.length === 0) {
      console.log('ℹ️  Solapi 폴더에 이미지가 없습니다.');
      return;
    }

    console.log(`✅ 발견된 파일: ${files.length}개\n`);

    // 2. Solapi imageId로 그룹화
    const imageIdGroups = new Map();
    
    for (const file of files) {
      // 파일명에서 Solapi imageId 추출
      // 형식: solapi-ST01FZ...jpg 또는 solapi-ST01FZ...-timestamp.jpg
      const match = file.name.match(/solapi-(ST01FZ[A-Z0-9a-z]+)(?:-(\d+))?\.jpg$/i);
      
      if (match) {
        const imageId = match[1];
        const timestamp = match[2] ? parseInt(match[2]) : 0;
        
        if (!imageIdGroups.has(imageId)) {
          imageIdGroups.set(imageId, []);
        }
        
        imageIdGroups.get(imageId).push({
          name: file.name,
          path: `originals/mms/solapi/${file.name}`,
          created_at: file.created_at,
          timestamp: timestamp
        });
      }
    }

    console.log(`🔍 발견된 Solapi imageId 그룹: ${imageIdGroups.size}개\n`);

    // 3. 중복 그룹 찾기 (2개 이상인 경우)
    const duplicateGroups = Array.from(imageIdGroups.entries())
      .filter(([imageId, files]) => files.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    if (duplicateGroups.length === 0) {
      console.log('✅ 중복 이미지가 없습니다.');
      return;
    }

    console.log(`🔍 중복 그룹: ${duplicateGroups.length}개\n`);

    let totalKept = 0;
    let totalDeleted = 0;
    const deletedPaths = [];

    // 4. 각 중복 그룹 처리
    for (const [imageId, fileList] of duplicateGroups) {
      console.log(`📦 Solapi imageId: ${imageId.substring(0, 30)}...`);
      console.log(`   파일 개수: ${fileList.length}개`);

      // 가장 오래된 파일 찾기 (created_at 기준)
      fileList.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateA - dateB;
      });

      const keepFile = fileList[0];
      const deleteFiles = fileList.slice(1);

      console.log(`   ✅ 유지: ${keepFile.name} (${keepFile.created_at})`);
      totalKept++;

      // 나머지 파일 삭제
      for (const deleteFile of deleteFiles) {
        try {
          const { error: deleteError } = await supabase.storage
            .from('blog-images')
            .remove([deleteFile.path]);

          if (deleteError) {
            console.error(`   ❌ 삭제 실패 (${deleteFile.name}):`, deleteError.message);
          } else {
            console.log(`   🗑️  삭제: ${deleteFile.name}`);
            totalDeleted++;
            deletedPaths.push(deleteFile.path);
          }
        } catch (error) {
          console.error(`   ❌ 삭제 오류 (${deleteFile.name}):`, error.message);
        }
      }
      console.log('');
    }

    // 5. image_metadata에서 중복 항목 정리
    console.log('📋 image_metadata 중복 항목 정리 중...\n');
    
    let metadataKept = 0;
    let metadataDeleted = 0;

    for (const [imageId, fileList] of duplicateGroups) {
      const keepFile = fileList[0];
      const keepPath = `originals/mms/solapi/${keepFile.name}`;
      
      // 유지할 파일의 Supabase URL 생성
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(keepPath);
      
      const keepUrl = urlData?.publicUrl;

      if (!keepUrl) {
        console.log(`   ⚠️  유지할 파일 URL 생성 실패: ${keepFile.name}`);
        continue;
      }

      // 같은 Solapi imageId를 가진 모든 메타데이터 조회
      const { data: allMetadata, error: metadataError } = await supabase
        .from('image_metadata')
        .select('id, image_url, tags')
        .contains('tags', [`solapi-${imageId}`]);

      if (metadataError) {
        console.error(`   ❌ 메타데이터 조회 실패:`, metadataError.message);
        continue;
      }

      if (!allMetadata || allMetadata.length === 0) {
        continue;
      }

      // 유지할 URL과 일치하는 메타데이터 찾기
      const keepMetadata = allMetadata.find(m => m.image_url === keepUrl);
      const deleteMetadata = allMetadata.filter(m => m.image_url !== keepUrl);

      if (keepMetadata) {
        // 유지할 메타데이터의 태그 통합
        const allTags = new Set();
        allMetadata.forEach(m => {
          if (m.tags && Array.isArray(m.tags)) {
            m.tags.forEach(tag => allTags.add(tag));
          }
        });

        await supabase
          .from('image_metadata')
          .update({
            tags: Array.from(allTags),
            updated_at: new Date().toISOString()
          })
          .eq('id', keepMetadata.id);

        metadataKept++;
        console.log(`   ✅ 메타데이터 유지 및 태그 통합: ${keepUrl.substring(0, 60)}...`);
      }

      // 삭제된 파일의 메타데이터 삭제
      for (const deleteMeta of deleteMetadata) {
        // 삭제된 파일 경로와 일치하는지 확인
        const isDeletedFile = deletedPaths.some(deletedPath => {
          const { data: deletedUrlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(deletedPath);
          return deletedUrlData?.publicUrl === deleteMeta.image_url;
        });

        if (isDeletedFile) {
          await supabase
            .from('image_metadata')
            .delete()
            .eq('id', deleteMeta.id);

          metadataDeleted++;
          console.log(`   🗑️  메타데이터 삭제: ID ${deleteMeta.id}`);
        }
      }
    }

    console.log('\n' + '='.repeat(100));
    console.log('✅ 정리 완료!');
    console.log('='.repeat(100));
    console.log(`📁 Storage 파일: ${totalKept}개 유지, ${totalDeleted}개 삭제`);
    console.log(`📋 메타데이터: ${metadataKept}개 유지, ${metadataDeleted}개 삭제`);
    console.log('');

  } catch (error) {
    console.error('❌ 정리 중 오류:', error);
    process.exit(1);
  }
}

cleanupSolapiDuplicates();

