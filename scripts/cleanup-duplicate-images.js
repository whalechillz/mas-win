/**
 * 중복 이미지 정리 스크립트
 * hash_md5 또는 hash_sha256이 동일한 이미지를 찾아 정리합니다.
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicateImages() {
  console.log('='.repeat(100));
  console.log('🔍 중복 이미지 정리 시작');
  console.log('='.repeat(100));
  console.log('');

  try {
    // 1. hash_md5가 있는 이미지 조회
    const { data: imagesWithHash, error: hashError } = await supabase
      .from('image_metadata')
      .select('*')
      .not('hash_md5', 'is', null)
      .order('created_at', { ascending: true });

    if (hashError) {
      console.error('❌ 이미지 조회 실패:', hashError.message);
      return;
    }

    if (!imagesWithHash || imagesWithHash.length === 0) {
      console.log('ℹ️ hash_md5가 있는 이미지가 없습니다.');
      return;
    }

    console.log(`📋 hash_md5가 있는 이미지: ${imagesWithHash.length}개`);
    console.log('');

    // 2. hash_md5로 그룹화하여 중복 찾기
    const hashGroups = new Map();
    imagesWithHash.forEach(img => {
      const hash = img.hash_md5;
      if (!hashGroups.has(hash)) {
        hashGroups.set(hash, []);
      }
      hashGroups.get(hash).push(img);
    });

    // 3. 중복 그룹 찾기 (2개 이상인 경우)
    const duplicateGroups = Array.from(hashGroups.entries())
      .filter(([hash, images]) => images.length > 1)
      .sort((a, b) => b[1].length - a[1].length); // 중복 개수 많은 순으로 정렬

    if (duplicateGroups.length === 0) {
      console.log('✅ 중복 이미지가 없습니다.');
      return;
    }

    console.log(`🔍 발견된 중복 그룹: ${duplicateGroups.length}개`);
    console.log('');

    let totalDuplicates = 0;
    let totalKept = 0;
    let totalDeleted = 0;

    // 4. 각 중복 그룹 처리
    for (const [hash, images] of duplicateGroups) {
      // 가장 오래된 이미지를 유지 (created_at이 가장 빠른 것)
      images.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const keepImage = images[0];
      const deleteImages = images.slice(1);

      console.log(`📦 Hash: ${hash.substring(0, 16)}...`);
      console.log(`   유지할 이미지: ${keepImage.image_url.substring(0, 60)}...`);
      console.log(`   삭제할 이미지: ${deleteImages.length}개`);

      // 삭제할 이미지들의 정보 출력 (처음 3개만)
      deleteImages.slice(0, 3).forEach((img, idx) => {
        console.log(`      ${idx + 1}. ${img.image_url.substring(0, 60)}...`);
      });
      if (deleteImages.length > 3) {
        console.log(`      ... 외 ${deleteImages.length - 3}개`);
      }

      // 실제 삭제는 하지 않고 정보만 출력 (안전을 위해)
      // 삭제하려면 아래 주석을 해제하세요
      /*
      for (const deleteImg of deleteImages) {
        const { error: deleteError } = await supabase
          .from('image_metadata')
          .delete()
          .eq('id', deleteImg.id);

        if (deleteError) {
          console.error(`   ❌ 삭제 실패 (ID: ${deleteImg.id}):`, deleteError.message);
        } else {
          totalDeleted++;
        }
      }
      */

      totalDuplicates += deleteImages.length;
      totalKept++;
    }

    console.log('');
    console.log('='.repeat(100));
    console.log('📊 정리 결과:');
    console.log(`   중복 그룹: ${duplicateGroups.length}개`);
    console.log(`   유지할 이미지: ${totalKept}개`);
    console.log(`   삭제할 이미지: ${totalDuplicates}개`);
    console.log('');
    console.log('⚠️ 실제 삭제를 원하시면 스크립트의 주석을 해제하세요.');
    console.log('='.repeat(100));

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

cleanupDuplicateImages();

