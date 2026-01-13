/**
 * 공통 폴더를 제품 합성 관리에 부품으로 등록하는 스크립트
 * 
 * 실행 방법:
 * node scripts/register-common-folders-as-components.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 등록할 공통 폴더 정보
const COMMON_FOLDERS = [
  {
    name: '그립 공통',
    slug: 'grip-common',
    description: '공통 그립 이미지',
  },
  {
    name: 'MUZIIK 샤프트',
    slug: 'muziik-common',
    description: 'MUZIIK 샤프트 공통 이미지',
  },
  {
    name: 'NGS 샤프트',
    slug: 'ngs-common',
    description: 'NGS 샤프트 공통 이미지',
  },
  {
    name: '시크리트포스 공통',
    slug: 'secret-force-common',
    description: '시크리트포스 공통 이미지',
  },
  {
    name: '시크리트포스 골드 공통',
    slug: 'secret-force-gold-common',
    description: '시크리트포스 골드 공통 이미지',
  },
  {
    name: '시크리트웨폰 블랙 공통',
    slug: 'secret-weapon-black-common',
    description: '시크리트웨폰 블랙 공통 이미지',
  },
  {
    name: '시크리트웨폰 골드 공통',
    slug: 'secret-weapon-gold-common',
    description: '시크리트웨폰 골드 공통 이미지',
  },
];

/**
 * 폴더의 첫 번째 이미지를 대표 이미지로 가져오기
 */
async function getFirstImage(folderPath) {
  try {
    const { data: files, error } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 1,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error || !files || files.length === 0) {
      return null;
    }

    const file = files.find(f => f.id); // 파일만 필터링
    if (!file) {
      return null;
    }

    const filePath = `${folderPath}/${file.name}`;
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error(`❌ 이미지 조회 실패 (${folderPath}):`, error);
    return null;
  }
}

/**
 * 폴더의 모든 이미지 목록 가져오기
 */
async function getAllImages(folderPath) {
  const allFiles = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data: files, error } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: batchSize,
        offset: offset,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error(`❌ 폴더 조회 에러 (${folderPath}):`, error);
      break;
    }

    if (!files || files.length === 0) {
      break;
    }

    // 파일만 필터링 (id가 있는 항목)
    const fileItems = files.filter(item => item.id);
    
    // URL 생성
    for (const file of fileItems) {
      const filePath = `${folderPath}/${file.name}`;
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);
      allFiles.push(publicUrl);
    }

    offset += batchSize;
    if (files.length < batchSize) {
      break;
    }
  }

  return allFiles;
}

/**
 * 부품 등록
 */
async function registerComponent(folderInfo) {
  console.log(`\n📦 부품 등록 시작: ${folderInfo.name} (${folderInfo.slug})`);

  const compositionPath = `originals/components/${folderInfo.slug}/composition`;

  // 이미지 목록 가져오기
  const allImages = await getAllImages(compositionPath);
  
  if (allImages.length === 0) {
    console.log(`  ⚠️  이미지가 없습니다. 건너뜁니다.`);
    return;
  }

  console.log(`  📄 ${allImages.length}개 이미지 발견`);

  // 대표 이미지 (첫 번째 이미지)
  const imageUrl = allImages[0];
  const referenceImages = allImages.slice(1);

  // 기존 제품 확인
  const { data: existing, error: checkError } = await supabase
    .from('product_composition')
    .select('id, name')
    .eq('slug', folderInfo.slug)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error(`  ❌ 기존 제품 확인 실패:`, checkError);
    return;
  }

  if (existing) {
    console.log(`  ℹ️  이미 등록된 제품입니다. 업데이트합니다.`);
    
    // 업데이트
    const { error: updateError } = await supabase
      .from('product_composition')
      .update({
        name: folderInfo.name,
        category: 'component',
        composition_target: 'accessory',
        image_url: imageUrl,
        reference_images: referenceImages,
        reference_images_enabled: referenceImages.reduce((acc, url) => {
          acc[url] = true;
          return acc;
        }, {}),
        description: folderInfo.description,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error(`  ❌ 업데이트 실패:`, updateError);
      return;
    }

    console.log(`  ✅ 업데이트 완료`);
  } else {
    // 최대 display_order 조회
    const { data: maxOrderData } = await supabase
      .from('product_composition')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const maxOrder = maxOrderData?.display_order || 0;
    const newDisplayOrder = maxOrder + 1;

    // 새로 등록
    const { error: insertError } = await supabase
      .from('product_composition')
      .insert({
        name: folderInfo.name,
        category: 'component',
        composition_target: 'accessory',
        image_url: imageUrl,
        reference_images: referenceImages,
        reference_images_enabled: referenceImages.reduce((acc, url) => {
          acc[url] = true;
          return acc;
        }, {}),
        slug: folderInfo.slug,
        description: folderInfo.description,
        is_active: true,
        display_order: newDisplayOrder,
      });

    if (insertError) {
      console.error(`  ❌ 등록 실패:`, insertError);
      return;
    }

    console.log(`  ✅ 등록 완료 (표시 순서: ${newDisplayOrder})`);
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 공통 폴더 부품 등록 시작\n');
  console.log(`등록 대상: ${COMMON_FOLDERS.length}개 폴더\n`);

  // 각 폴더 등록
  for (const folderInfo of COMMON_FOLDERS) {
    await registerComponent(folderInfo);
  }

  console.log('\n✅ 모든 부품 등록 완료!');
}

// 스크립트 실행
main().catch(error => {
  console.error('❌ 등록 중 오류 발생:', error);
  process.exit(1);
});
