/**
 * 날짜 형식 마이그레이션: YYYY.MM.DD → YYYY-MM-DD
 * 
 * 변경 범위:
 * 1. image_assets.file_path
 * 2. image_assets.cdn_url
 * 3. Storage 실제 폴더명 (중요!)
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

// 날짜 변환 함수: 2024.10.29 → 2024-10-29
function convertDotToDash(dateStr) {
  return dateStr.replace(/\./g, '-');
}

// file_path에서 점 형식 날짜를 찾아 대시 형식으로 변환
function convertFilePath(filePath) {
  if (!filePath) return filePath;
  
  // 패턴 1: /2024.10.29/ 또는 /2024.10.29
  return filePath.replace(/\/(\d{4})\.(\d{2})\.(\d{2})(\/|$)/g, '/$1-$2-$3$4');
}

// cdn_url에서도 동일하게 변환
function convertCdnUrl(cdnUrl) {
  if (!cdnUrl) return cdnUrl;
  
  return cdnUrl.replace(/\/(\d{4})\.(\d{2})\.(\d{2})(\/|$)/g, '/$1-$2-$3$4');
}

async function migrateDateFormats() {
  console.log('🔄 날짜 형식 마이그레이션 시작: YYYY.MM.DD → YYYY-MM-DD\n');

  try {
    // 1. 점 형식 날짜를 사용하는 이미지 조회
    // Supabase에서는 정규식을 직접 사용할 수 없으므로 모든 고객 이미지를 조회 후 필터링
    const { data: allImages, error: allImagesError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags')
      .ilike('file_path', 'originals/customers/%')
      .limit(10000);

    if (allImagesError) {
      console.error('❌ 이미지 조회 실패:', allImagesError);
      return;
    }

    // 점 형식 날짜가 포함된 이미지만 필터링
    const images = (allImages || []).filter((img) => {
      const filePath = img.file_path || '';
      const cdnUrl = img.cdn_url || '';
      return /\d{4}\.\d{2}\.\d{2}/.test(filePath) || /\d{4}\.\d{2}\.\d{2}/.test(cdnUrl);
    });

    if (allImagesError) {
      console.error('❌ 이미지 조회 실패:', allImagesError);
      return;
    }

    if (!images || images.length === 0) {
      console.log('✅ 마이그레이션할 이미지가 없습니다.');
      return;
    }

    console.log(`📦 마이그레이션 대상: ${images.length}개 이미지\n`);

    // 2. 점 형식 날짜 추출 및 그룹화
    const dateGroups = new Map(); // 날짜별로 그룹화

    images.forEach((img) => {
      const filePath = img.file_path || '';
      const cdnUrl = img.cdn_url || '';
      
      // file_path에서 점 형식 날짜 추출
      const dotMatch = filePath.match(/\/(\d{4}\.\d{2}\.\d{2})\//) || 
                       filePath.match(/\/(\d{4}\.\d{2}\.\d{2})$/);
      
      if (dotMatch) {
        const dotDate = dotMatch[1];
        const dashDate = convertDotToDash(dotDate);
        
        if (!dateGroups.has(dotDate)) {
          dateGroups.set(dotDate, {
            dotDate,
            dashDate,
            images: []
          });
        }
        
        dateGroups.get(dotDate).images.push(img);
      }
    });

    console.log(`📅 마이그레이션할 날짜: ${dateGroups.size}개\n`);
    dateGroups.forEach((group, dotDate) => {
      console.log(`   ${dotDate} → ${group.dashDate} (${group.images.length}개 이미지)`);
    });
    console.log('');

    // 3. 사용자 확인 (실제 마이그레이션 전)
    console.log('⚠️  주의사항:');
    console.log('   1. Storage 폴더명이 실제로 변경됩니다.');
    console.log('   2. file_path와 cdn_url이 업데이트됩니다.');
    console.log('   3. 이 작업은 되돌릴 수 없습니다.\n');
    
    // 실제 마이그레이션은 주석 처리 (안전을 위해)
    const DRY_RUN = process.argv.includes('--execute') ? false : true;
    
    if (DRY_RUN) {
      console.log('🔍 DRY RUN 모드: 실제 변경 없이 시뮬레이션만 수행합니다.\n');
      console.log('   실제 마이그레이션을 실행하려면: node scripts/migrate-date-format-dot-to-dash.js --execute\n');
    } else {
      console.log('🚀 실제 마이그레이션을 시작합니다...\n');
    }

    let successCount = 0;
    let errorCount = 0;

    // 4. 날짜별로 마이그레이션 수행
    for (const [dotDate, group] of dateGroups) {
      const { dashDate, images: groupImages } = group;
      
      console.log(`\n📅 ${dotDate} → ${dashDate} 처리 중...`);

      // 4-1. Storage 폴더 이동 (각 고객별로)
      const customerFolders = new Set();
      groupImages.forEach((img) => {
        const filePath = img.file_path || '';
        const customerMatch = filePath.match(/originals\/customers\/([^\/]+)\//);
        if (customerMatch) {
          customerFolders.add(customerMatch[1]);
        }
      });

      for (const customerFolder of customerFolders) {
        const oldFolderPath = `originals/customers/${customerFolder}/${dotDate}`;
        const newFolderPath = `originals/customers/${customerFolder}/${dashDate}`;

        console.log(`   📦 Storage 폴더 이동: ${oldFolderPath} → ${newFolderPath}`);

        if (!DRY_RUN) {
          // Storage 폴더 이동
          const { data: files, error: listError } = await supabase.storage
            .from('blog-images')
            .list(oldFolderPath);

          if (listError) {
            console.error(`   ❌ 폴더 조회 실패: ${listError.message}`);
            continue;
          }

          if (!files || files.length === 0) {
            console.log(`   ⚠️  폴더가 비어있거나 존재하지 않음`);
            continue;
          }

          // 각 파일을 새 폴더로 이동
          for (const file of files) {
            if (file.name) {
              const oldFilePath = `${oldFolderPath}/${file.name}`;
              const newFilePath = `${newFolderPath}/${file.name}`;

              const { error: moveError } = await supabase.storage
                .from('blog-images')
                .move(oldFilePath, newFilePath);

              if (moveError) {
                console.error(`   ❌ 파일 이동 실패 (${file.name}): ${moveError.message}`);
                errorCount++;
              } else {
                console.log(`   ✅ 파일 이동 완료: ${file.name}`);
              }
            }
          }
        }
      }

      // 4-2. 데이터베이스 업데이트
      for (const img of groupImages) {
        const oldFilePath = img.file_path || '';
        const oldCdnUrl = img.cdn_url || '';
        
        const newFilePath = convertFilePath(oldFilePath);
        const newCdnUrl = convertCdnUrl(oldCdnUrl);

        const hasChanges = oldFilePath !== newFilePath || oldCdnUrl !== newCdnUrl;

        if (hasChanges) {
          console.log(`   📝 DB 업데이트: ${img.filename || img.id}`);
          console.log(`      file_path: ${oldFilePath.substring(0, 80)}...`);
          console.log(`                → ${newFilePath.substring(0, 80)}...`);

          if (!DRY_RUN) {
            const updateData = {};
            if (oldFilePath !== newFilePath) {
              updateData.file_path = newFilePath;
            }
            
            let newCdnUrlValue = null;
            if (oldCdnUrl !== newCdnUrl && newFilePath) {
              // cdn_url은 file_path로부터 재생성하는 것이 더 정확
              const { data: { publicUrl } } = supabase.storage
                .from('blog-images')
                .getPublicUrl(newFilePath);
              newCdnUrlValue = publicUrl;
              updateData.cdn_url = publicUrl;
            }

            // cdn_url 중복 제약 조건 처리
            if (newCdnUrlValue) {
              // 동일한 cdn_url을 가진 다른 이미지 찾기
              const { data: duplicateImages } = await supabase
                .from('image_assets')
                .select('id')
                .eq('cdn_url', newCdnUrlValue)
                .neq('id', img.id);

              if (duplicateImages && duplicateImages.length > 0) {
                // 중복된 이미지들의 cdn_url을 NULL로 설정
                const duplicateIds = duplicateImages.map(d => d.id);
                await supabase
                  .from('image_assets')
                  .update({ cdn_url: null })
                  .in('id', duplicateIds);
                console.log(`   ⚠️  중복 cdn_url 처리: ${duplicateIds.length}개 이미지의 cdn_url을 NULL로 설정`);
              }
            }

            const { error: updateError } = await supabase
              .from('image_assets')
              .update(updateData)
              .eq('id', img.id);

            if (updateError) {
              console.error(`   ❌ DB 업데이트 실패: ${updateError.message}`);
              errorCount++;
            } else {
              console.log(`   ✅ DB 업데이트 완료`);
              successCount++;
            }
          } else {
            successCount++;
          }
        }
      }
    }

    console.log('\n📊 마이그레이션 결과:');
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${errorCount}개`);

    if (DRY_RUN) {
      console.log('\n💡 실제 마이그레이션을 실행하려면:');
      console.log('   node scripts/migrate-date-format-dot-to-dash.js --execute');
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

migrateDateFormats().catch(console.error);
