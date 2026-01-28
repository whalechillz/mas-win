/**
 * 김직권 고객의 cdn_url 중복 확인 스크립트
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
  console.log('🔍 김직권 고객의 cdn_url 중복 확인...\n');

  try {
    // 김직권 고객 정보 조회
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .ilike('name', '%김직권%')
      .limit(1);

    if (!customers || customers.length === 0) {
      console.error('❌ 김직권 고객을 찾을 수 없습니다.');
      return;
    }

    const customer = customers[0];
    const folderName = customer.folder_name || `customer-${String(customer.id).padStart(3, '0')}`;
    
    console.log(`✅ 고객: ${customer.name} (ID: ${customer.id}, 폴더: ${folderName})\n`);

    // 해당 고객의 모든 이미지 조회
    const { data: images, error: imagesError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, is_customer_representative')
      .ilike('file_path', `originals/customers/${folderName}/%`)
      .order('created_at', { ascending: false });

    if (imagesError) {
      console.error('❌ 이미지 조회 실패:', imagesError);
      return;
    }

    console.log(`📦 총 ${images.length}개 이미지 발견\n`);

    // cdn_url 중복 확인
    const cdnUrlMap = new Map();
    const duplicates = [];

    images.forEach(img => {
      if (img.cdn_url) {
        if (cdnUrlMap.has(img.cdn_url)) {
          duplicates.push({
            cdn_url: img.cdn_url,
            image1: cdnUrlMap.get(img.cdn_url),
            image2: {
              id: img.id,
              filename: img.filename,
              file_path: img.file_path,
              is_representative: img.is_customer_representative
            }
          });
        } else {
          cdnUrlMap.set(img.cdn_url, {
            id: img.id,
            filename: img.filename,
            file_path: img.file_path,
            is_representative: img.is_customer_representative
          });
        }
      }
    });

    if (duplicates.length > 0) {
      console.log(`⚠️ 중복된 cdn_url 발견: ${duplicates.length}개\n`);
      duplicates.forEach((dup, index) => {
        console.log(`${index + 1}. cdn_url: ${dup.cdn_url.substring(0, 100)}...`);
        console.log(`   이미지 1: ${dup.image1.filename} (ID: ${dup.image1.id}, 대표: ${dup.image1.is_representative})`);
        console.log(`   이미지 2: ${dup.image2.filename} (ID: ${dup.image2.id}, 대표: ${dup.image2.is_representative})`);
        console.log('');
      });
    } else {
      console.log('✅ 중복된 cdn_url 없음\n');
    }

    // 대표 이미지 확인
    const representativeImages = images.filter(img => img.is_customer_representative);
    console.log(`🖼️ 대표 이미지: ${representativeImages.length}개\n`);
    representativeImages.forEach(img => {
      console.log(`   - ${img.filename} (ID: ${img.id})`);
      console.log(`     cdn_url: ${img.cdn_url?.substring(0, 100)}...`);
      console.log(`     file_path: ${img.file_path?.substring(0, 100)}...`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkDuplicateCdnUrls().catch(console.error);
