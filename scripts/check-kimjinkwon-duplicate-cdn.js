/**
 * 김진권 고객의 중복 cdn_url 확인 스크립트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDuplicateCdnUrls() {
  console.log('🔍 김진권 고객의 중복 cdn_url 확인...\n');

  try {
    // 김진권 고객 정보 조회
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .ilike('name', '%김진권%')
      .limit(1);

    if (!customers || customers.length === 0) {
      console.error('❌ 김진권 고객을 찾을 수 없습니다.');
      return;
    }

    const customer = customers[0];
    const folderName = customer.folder_name || `customer-${String(customer.id).padStart(3, '0')}`;
    
    console.log(`✅ 고객: ${customer.name} (ID: ${customer.id}, 폴더: ${folderName})\n`);

    // 해당 고객의 모든 이미지 조회
    const { data: images, error: imagesError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, is_customer_representative, ai_tags')
      .ilike('file_path', `originals/customers/${folderName}/%`)
      .order('created_at', { ascending: false });

    if (imagesError) {
      console.error('❌ 이미지 조회 실패:', imagesError);
      return;
    }

    console.log(`📦 총 이미지: ${images.length}개\n`);

    // cdn_url별로 그룹화하여 중복 확인
    const cdnUrlMap = new Map();
    images.forEach(img => {
      if (img.cdn_url) {
        if (!cdnUrlMap.has(img.cdn_url)) {
          cdnUrlMap.set(img.cdn_url, []);
        }
        cdnUrlMap.get(img.cdn_url).push(img);
      }
    });

    // 중복된 cdn_url 찾기
    const duplicates = Array.from(cdnUrlMap.entries()).filter(([url, imgs]) => imgs.length > 1);

    if (duplicates.length > 0) {
      console.log(`⚠️ 중복된 cdn_url 발견: ${duplicates.length}개\n`);
      
      duplicates.forEach(([url, imgs]) => {
        console.log(`📸 중복 cdn_url: ${url.substring(0, 100)}...`);
        console.log(`   중복 개수: ${imgs.length}개\n`);
        
        imgs.forEach((img, index) => {
          console.log(`   ${index + 1}. ID: ${img.id}`);
          console.log(`      filename: ${img.filename || '없음'}`);
          console.log(`      file_path: ${img.file_path || '없음'}`);
          console.log(`      is_customer_representative: ${img.is_customer_representative || false}`);
          console.log('');
        });
      });
    } else {
      console.log('✅ 중복된 cdn_url 없음\n');
    }

    // 대표 이미지 확인
    const representativeImages = images.filter(img => img.is_customer_representative === true);
    console.log(`🖼️ 대표 이미지: ${representativeImages.length}개\n`);
    
    if (representativeImages.length > 0) {
      representativeImages.forEach(img => {
        console.log(`   - ${img.filename || '파일명 없음'} (ID: ${img.id})`);
        console.log(`     cdn_url: ${img.cdn_url?.substring(0, 100)}...`);
        console.log(`     file_path: ${img.file_path || '없음'}`);
        console.log('');
      });
    }

    // file_path가 다른데 cdn_url이 같은 경우 확인
    const filePathMap = new Map();
    images.forEach(img => {
      if (img.cdn_url && img.file_path) {
        const key = img.cdn_url;
        if (!filePathMap.has(key)) {
          filePathMap.set(key, []);
        }
        filePathMap.get(key).push(img.file_path);
      }
    });

    const pathDuplicates = Array.from(filePathMap.entries()).filter(([url, paths]) => {
      const uniquePaths = new Set(paths);
      return uniquePaths.size > 1;
    });

    if (pathDuplicates.length > 0) {
      console.log(`\n⚠️ 같은 cdn_url인데 file_path가 다른 경우: ${pathDuplicates.length}개\n`);
      pathDuplicates.forEach(([url, paths]) => {
        console.log(`   cdn_url: ${url.substring(0, 100)}...`);
        paths.forEach(path => {
          console.log(`      - ${path}`);
        });
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkDuplicateCdnUrls().catch(console.error);
