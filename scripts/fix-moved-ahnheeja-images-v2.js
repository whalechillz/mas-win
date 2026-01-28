/**
 * 안희자 고객의 이동된 이미지 메타데이터 복구 스크립트 (v2)
 * 중복 메타데이터 확인 및 정리
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

async function fixMovedAhnheejaImages() {
  console.log('🔧 안희자 고객의 이동된 이미지 메타데이터 복구 (v2)...\n');

  try {
    // 1. 안희자 고객 정보 조회
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, folder_name')
      .ilike('name', '%안희자%')
      .limit(1);

    if (!customers || customers.length === 0) {
      console.error('❌ 안희자 고객을 찾을 수 없습니다.');
      return;
    }

    const customer = customers[0];
    const customerTag = `customer-${customer.id}`;
    const folderName = customer.folder_name || `customer-${String(customer.id).padStart(3, '0')}`;
    console.log(`✅ 고객: ${customer.name} (ID: ${customer.id}, 폴더: ${folderName})\n`);

    // 2. 이동된 이미지 조회 (파일명으로)
    const targetFiles = ['ahnhuija-S1-20260128-01.webp', 'ahnhuija-S1-20260128-02.webp'];
    
    console.log('🔍 이동된 이미지 조회 중...\n');
    
    const allImages = [];
    for (const fileName of targetFiles) {
      const { data: images, error } = await supabase
        .from('image_assets')
        .select('id, filename, file_path, cdn_url, ai_tags, created_at')
        .or(`filename.ilike.%${fileName}%,file_path.ilike.%${fileName}%`)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (images) {
        allImages.push(...images);
      }
    }

    console.log(`✅ 총 ${allImages.length}개 이미지 발견:\n`);

    // 3. 파일명별로 그룹화
    const imagesByFile = new Map();
    for (const img of allImages) {
      const fileName = img.filename || img.file_path?.split('/').pop() || 'unknown';
      if (!imagesByFile.has(fileName)) {
        imagesByFile.set(fileName, []);
      }
      imagesByFile.get(fileName).push(img);
    }

    let fixedCount = 0;
    let deletedCount = 0;

    for (const [fileName, images] of imagesByFile.entries()) {
      console.log(`📸 ${fileName}: ${images.length}개 메타데이터 발견\n`);
      
      // 가장 최신 메타데이터 찾기 (created_at 기준)
      const sortedImages = images.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      const latestImage = sortedImages[0];
      const duplicateImages = sortedImages.slice(1);
      
      console.log(`   최신 메타데이터: ID ${latestImage.id}`);
      console.log(`   중복 메타데이터: ${duplicateImages.length}개\n`);
      
      // 중복 메타데이터 삭제
      if (duplicateImages.length > 0) {
        for (const dup of duplicateImages) {
          console.log(`   🗑️ 중복 메타데이터 삭제: ID ${dup.id}`);
          const { error: deleteError } = await supabase
            .from('image_assets')
            .delete()
            .eq('id', dup.id);
          
          if (deleteError) {
            console.error(`      ❌ 삭제 실패:`, deleteError);
          } else {
            console.log(`      ✅ 삭제 완료`);
            deletedCount++;
          }
        }
        console.log('');
      }
      
      // 최신 메타데이터 수정
      const expectedPath = `originals/customers/${folderName}/2026-01-26/${fileName}`;
      const currentPath = latestImage.file_path || '';
      const needsPathFix = !currentPath.includes('/2026-01-26/') || !currentPath.endsWith(fileName);
      
      // cdn_url 생성
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(expectedPath);
      
      // ai_tags 업데이트
      const currentTags = Array.isArray(latestImage.ai_tags) ? latestImage.ai_tags : [];
      let updatedTags = [...currentTags];
      
      // visit-2026-01-28 태그 제거
      updatedTags = updatedTags.filter(tag => tag !== 'visit-2026-01-28');
      // visit-2026-01-26 태그 추가
      if (!updatedTags.includes('visit-2026-01-26')) {
        updatedTags.push('visit-2026-01-26');
      }
      // customer 태그 확인
      if (!updatedTags.includes(customerTag)) {
        updatedTags.push(customerTag);
      }
      
      const needsUpdate = needsPathFix || 
                         latestImage.cdn_url !== publicUrl ||
                         JSON.stringify(currentTags) !== JSON.stringify(updatedTags);
      
      if (needsUpdate) {
        console.log(`   📝 메타데이터 수정:`);
        if (needsPathFix) {
          console.log(`      file_path: ${currentPath || '없음'} → ${expectedPath}`);
        }
        if (latestImage.cdn_url !== publicUrl) {
          console.log(`      cdn_url 업데이트`);
        }
        if (JSON.stringify(currentTags) !== JSON.stringify(updatedTags)) {
          console.log(`      ai_tags: ${JSON.stringify(currentTags)} → ${JSON.stringify(updatedTags)}`);
        }
        
        const updateData = {
          file_path: expectedPath,
          cdn_url: publicUrl,
          ai_tags: updatedTags,
          updated_at: new Date().toISOString()
        };
        
        const { data: updatedImage, error: updateError } = await supabase
          .from('image_assets')
          .update(updateData)
          .eq('id', latestImage.id)
          .select()
          .single();
        
        if (updateError) {
          console.error(`      ❌ 업데이트 실패:`, updateError);
        } else {
          console.log(`      ✅ 업데이트 완료!`);
          fixedCount++;
        }
      } else {
        console.log(`   ✅ 이미 정상 상태입니다.`);
      }
      console.log('');
    }

    console.log(`✅ 작업 완료:`);
    console.log(`   - 메타데이터 수정: ${fixedCount}개`);
    console.log(`   - 중복 메타데이터 삭제: ${deletedCount}개`);
  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

fixMovedAhnheejaImages().catch(console.error);
