/**
 * 모든 고객의 이미지 누락 문제 일괄 수정 스크립트
 * 
 * 1. file_path에 파일명이 없는 경우 filename을 사용하여 수정
 * 2. ai_tags에 customer-{id} 태그가 없는 경우 추가
 * 3. cdn_url 업데이트
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

async function fixAllCustomersImages() {
  console.log('🔧 모든 고객의 이미지 누락 문제 일괄 수정 시작...\n');

  try {
    // 모든 고객 조회
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .order('id', { ascending: true });

    if (customersError) {
      console.error('❌ 고객 조회 실패:', customersError);
      return;
    }

    console.log(`✅ 총 ${customers.length}명의 고객 발견\n`);

    let totalFixed = 0;
    let customersFixed = 0;
    let checkedCount = 0;

    for (const customer of customers) {
      if (!customer.folder_name) {
        continue;
      }

      checkedCount++;
      if (checkedCount % 50 === 0) {
        console.log(`진행 중... ${checkedCount}/${customers.length} (수정: ${customersFixed}명, ${totalFixed}개 이미지)`);
      }

      const customerTag = `customer-${customer.id}`;
      const exactFolderPath = `originals/customers/${customer.folder_name}`;

      // 해당 고객의 이미지 조회
      const { data: images, error: imagesError } = await supabase
        .from('image_assets')
        .select('id, filename, file_path, cdn_url, ai_tags, english_filename, original_filename')
        .ilike('file_path', `${exactFolderPath}/%`)
        .limit(500);

      if (imagesError || !images || images.length === 0) {
        continue;
      }

      let customerFixedCount = 0;

      for (const img of images) {
        let needsUpdate = false;
        const updateData = {};

        // 1. file_path에 파일명이 없는 경우 수정
        if (img.file_path) {
          const pathParts = img.file_path.split('/');
          const lastPart = pathParts[pathParts.length - 1];
          const isDateFolder = /^\d{4}-\d{2}-\d{2}$/.test(lastPart);
          
          if (isDateFolder || !lastPart.includes('.')) {
            // filename에서 파일명 추출
            const fileName = img.filename || img.english_filename || img.original_filename;
            if (fileName) {
              const correctedFilePath = `${img.file_path}/${fileName}`;
              updateData.file_path = correctedFilePath;
              
              // cdn_url도 업데이트
              const { data: { publicUrl } } = supabase.storage
                .from('blog-images')
                .getPublicUrl(correctedFilePath);
              updateData.cdn_url = publicUrl;
              
              needsUpdate = true;
            }
          }
        }

        // 2. ai_tags에 customer 태그가 없는 경우 추가
        const tags = Array.isArray(img.ai_tags) ? [...img.ai_tags] : [];
        if (!tags.includes(customerTag) && img.file_path?.startsWith(exactFolderPath)) {
          tags.push(customerTag);
          updateData.ai_tags = tags;
          needsUpdate = true;
        }

        // 3. 업데이트 실행
        if (needsUpdate) {
          updateData.updated_at = new Date().toISOString();
          
          const { error: updateError } = await supabase
            .from('image_assets')
            .update(updateData)
            .eq('id', img.id);

          if (updateError) {
            // cdn_url 중복 오류인 경우 처리
            if (updateError.message?.includes('duplicate key value violates unique constraint "idx_image_assets_cdn_url_unique"')) {
              console.warn(`⚠️ [${customer.name}] cdn_url 중복, NULL로 설정 후 재시도:`, {
                imageId: img.id,
                filename: img.filename
              });
              
              // 중복된 cdn_url을 가진 다른 이미지 찾기
              if (updateData.cdn_url) {
                const { data: duplicates } = await supabase
                  .from('image_assets')
                  .select('id')
                  .eq('cdn_url', updateData.cdn_url)
                  .neq('id', img.id);
                
                if (duplicates && duplicates.length > 0) {
                  // 중복 이미지의 cdn_url을 NULL로 설정
                  await supabase
                    .from('image_assets')
                    .update({ cdn_url: null, updated_at: new Date().toISOString() })
                    .in('id', duplicates.map(d => d.id));
                  
                  // 다시 업데이트 시도
                  const { error: retryError } = await supabase
                    .from('image_assets')
                    .update(updateData)
                    .eq('id', img.id);
                  
                  if (!retryError) {
                    customerFixedCount++;
                    totalFixed++;
                  } else {
                    console.error(`❌ [${customer.name}] 재시도 실패:`, retryError);
                  }
                }
              }
            } else {
              console.error(`❌ [${customer.name}] 업데이트 실패:`, updateError);
            }
          } else {
            customerFixedCount++;
            totalFixed++;
          }
        }
      }

      if (customerFixedCount > 0) {
        customersFixed++;
        if (customersFixed <= 20) {
          console.log(`✅ [${customer.name}] ${customerFixedCount}개 이미지 수정 완료`);
        }
      }
    }

    console.log(`\n✅ 작업 완료:`);
    console.log(`   확인한 고객: ${checkedCount}명`);
    console.log(`   수정한 고객: ${customersFixed}명`);
    console.log(`   총 수정한 이미지: ${totalFixed}개`);

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

fixAllCustomersImages().catch(console.error);
