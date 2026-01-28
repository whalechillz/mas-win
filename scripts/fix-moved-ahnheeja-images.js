/**
 * 안희자 고객의 이동된 이미지 메타데이터 복구 스크립트
 * 2026-01-28에서 2026-01-26으로 이동된 이미지의 메타데이터 복구
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
  console.log('🔧 안희자 고객의 이동된 이미지 메타데이터 복구...\n');

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

    // 2. 이동된 이미지 조회 (2026-01-26 폴더에 있지만 메타데이터가 잘못된 경우)
    const targetPath = `originals/customers/${folderName}/2026-01-26`;
    const oldPath = `originals/customers/${folderName}/2026-01-28`;
    
    console.log('🔍 이동된 이미지 조회 중...\n');
    
    // 방법 1: file_path로 조회 (2026-01-26)
    const { data: imagesInNewFolder, error: newFolderError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags')
      .ilike('file_path', `${targetPath}%`)
      .or(`filename.ilike.%ahnhuija-S1-20260128-01.webp%,filename.ilike.%ahnhuija-S1-20260128-02.webp%`)
      .limit(10);

    // 방법 2: 파일명으로 조회
    const { data: imagesByFilename, error: filenameError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags')
      .or(`filename.ilike.%ahnhuija-S1-20260128-01.webp%,filename.ilike.%ahnhuija-S1-20260128-02.webp%`)
      .limit(10);

    console.log(`📊 조회 결과:`);
    console.log(`   - 2026-01-26 폴더: ${imagesInNewFolder?.length || 0}개`);
    console.log(`   - 파일명으로 조회: ${imagesByFilename?.length || 0}개\n`);

    // 3. 모든 이미지 수집
    const allImages = new Map();
    
    if (imagesInNewFolder) {
      imagesInNewFolder.forEach(img => allImages.set(img.id, img));
    }
    
    if (imagesByFilename) {
      imagesByFilename.forEach(img => {
        if (!allImages.has(img.id)) {
          allImages.set(img.id, img);
        }
      });
    }

    const imagesToFix = Array.from(allImages.values());
    console.log(`✅ 수정 대상 이미지 ${imagesToFix.length}개 발견:\n`);

    let fixedCount = 0;
    for (const img of imagesToFix) {
      console.log(`📸 ${img.filename || '파일명 없음'}`);
      console.log(`   ID: ${img.id}`);
      console.log(`   현재 file_path: ${img.file_path || '없음'}`);
      console.log(`   현재 cdn_url: ${img.cdn_url ? img.cdn_url.substring(0, 100) + '...' : '없음'}`);
      console.log(`   현재 ai_tags: ${JSON.stringify(img.ai_tags || [])}`);
      
      // file_path에서 날짜 추출
      const dateFromPath = img.file_path ? img.file_path.match(/(\d{4}-\d{2}-\d{2})/)?.[1] : null;
      const expectedDate = '2026-01-26';
      
      // file_path가 2026-01-26이 아니면 수정
      const needsPathFix = !img.file_path || !img.file_path.includes('/2026-01-26/');
      // cdn_url이 없거나 잘못된 경우 수정
      const needsUrlFix = !img.cdn_url || !img.cdn_url.includes('/2026-01-26/');
      // ai_tags에 visit-2026-01-26 태그가 없으면 수정
      const currentTags = Array.isArray(img.ai_tags) ? img.ai_tags : [];
      const hasNewDateTag = currentTags.includes(`visit-${expectedDate}`);
      const hasOldDateTag = currentTags.includes('visit-2026-01-28');
      const needsTagFix = !hasNewDateTag || hasOldDateTag;
      
      if (!needsPathFix && !needsUrlFix && !needsTagFix) {
        console.log(`   ✅ 이미 정상 상태입니다.\n`);
        continue;
      }
      
      // 수정할 데이터 준비
      let newFilePath = img.file_path;
      let newCdnUrl = img.cdn_url;
      let updatedTags = [...currentTags];
      
      // file_path 수정
      if (needsPathFix) {
        if (img.file_path) {
          newFilePath = img.file_path.replace(/\/2026-01-28\//, '/2026-01-26/');
        } else {
          // file_path가 없으면 파일명으로부터 생성
          const fileName = img.filename || 'unknown';
          newFilePath = `${targetPath}/${fileName}`;
        }
        console.log(`   📝 file_path 수정: ${img.file_path || '없음'} → ${newFilePath}`);
      }
      
      // cdn_url 수정 (file_path로부터 생성)
      if (needsUrlFix || needsPathFix) {
        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(newFilePath);
        newCdnUrl = publicUrl;
        console.log(`   📝 cdn_url 수정: ${img.cdn_url ? img.cdn_url.substring(0, 100) + '...' : '없음'} → ${newCdnUrl.substring(0, 100)}...`);
      }
      
      // ai_tags 수정
      if (needsTagFix) {
        // visit-2026-01-28 태그 제거
        updatedTags = updatedTags.filter(tag => tag !== 'visit-2026-01-28');
        // visit-2026-01-26 태그 추가 (없으면)
        if (!updatedTags.includes(`visit-${expectedDate}`)) {
          updatedTags.push(`visit-${expectedDate}`);
        }
        // customer 태그 확인 및 추가
        if (!updatedTags.includes(customerTag)) {
          updatedTags.push(customerTag);
        }
        console.log(`   📝 ai_tags 수정: ${JSON.stringify(currentTags)} → ${JSON.stringify(updatedTags)}`);
      }
      
      // DB 업데이트
      const updateData = {
        file_path: newFilePath,
        cdn_url: newCdnUrl,
        ai_tags: updatedTags,
        updated_at: new Date().toISOString()
      };
      
      console.log(`   💾 DB 업데이트 중...`);
      const { data: updatedImage, error: updateError } = await supabase
        .from('image_assets')
        .update(updateData)
        .eq('id', img.id)
        .select()
        .single();
      
      if (updateError) {
        console.error(`   ❌ 업데이트 실패:`, updateError);
      } else {
        console.log(`   ✅ 업데이트 완료!`);
        fixedCount++;
      }
      console.log('');
    }

    console.log(`✅ 작업 완료: ${fixedCount}개 이미지 메타데이터 복구`);
  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

fixMovedAhnheejaImages().catch(console.error);
