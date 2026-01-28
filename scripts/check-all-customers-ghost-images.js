/**
 * 모든 고객의 고스트 이미지 및 중복 이미지 확인
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

// Storage에서 재귀적으로 모든 파일 목록 가져오기
async function getAllFilesFromStorage(path, allFiles = []) {
  const { data: items, error } = await supabase.storage
    .from('blog-images')
    .list(path, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (error) {
    return allFiles;
  }

  if (!items || items.length === 0) {
    return allFiles;
  }

  for (const item of items) {
    const fullPath = `${path}/${item.name}`;
    
    if (item.id) {
      // 파일인 경우
      allFiles.push({
        path: fullPath,
        name: item.name,
        size: item.metadata?.size || 0
      });
    } else {
      // 폴더인 경우 재귀적으로 탐색
      await getAllFilesFromStorage(fullPath, allFiles);
    }
  }

  return allFiles;
}

async function checkAllCustomersGhostImages() {
  console.log('🔍 모든 고객의 고스트 이미지 및 중복 확인 중...\n');

  try {
    // 1. 모든 고객 조회 (페이지네이션으로 전체 조회)
    const allCustomers = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: batch, error: customersError } = await supabase
        .from('customers')
        .select('id, name, folder_name')
        .not('folder_name', 'is', null)
        .range(offset, offset + limit - 1);
      
      if (customersError) {
        console.error('❌ 고객 조회 실패:', customersError);
        break;
      }
      
      if (batch && batch.length > 0) {
        allCustomers.push(...batch);
        offset += limit;
        hasMore = batch.length === limit;
      } else {
        hasMore = false;
      }
    }
    
    const customers = allCustomers;

    console.log(`📊 총 ${customers.length}명 고객 확인 중...\n`);

    const results = {
      totalCustomers: customers.length,
      customersWithIssues: [],
      totalGhostImages: 0,
      totalDuplicateImages: 0,
      totalValidImages: 0
    };

    // 2. 각 고객별로 확인
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const folderName = customer.folder_name;

      if (!folderName) continue;

      // 진행 상황 표시
      if ((i + 1) % 50 === 0) {
        console.log(`   진행 중: ${i + 1}/${customers.length}명...`);
      }

      try {
        // Storage 파일 확인
        const storageFiles = await getAllFilesFromStorage(`originals/customers/${folderName}`);
        
        // 썸네일/리사이즈 파일 제외
        const originalFiles = storageFiles.filter(f => {
          const name = f.name.toLowerCase();
          return !name.includes('_resized_') && 
                 !name.includes('_thumbnail_') && 
                 !name.includes('_thumb_') &&
                 !name.includes('_s_') &&
                 !name.includes('_m_') &&
                 !name.includes('_l_');
        });

        // DB 이미지 조회
        const { data: dbImages, error: dbError } = await supabase
          .from('image_assets')
          .select('id, filename, file_path, created_at')
          .ilike('file_path', `originals/customers/${folderName}/%`)
          .limit(1000);

        if (dbError || !dbImages) continue;

        if (dbImages.length === 0 && originalFiles.length === 0) {
          // 이미지가 없는 고객은 건너뜀
          continue;
        }

        // Storage 파일 경로 맵 생성 (전체 경로로 매칭)
        const storageFilePathMap = new Set(originalFiles.map(f => f.path.toLowerCase()));

        // file_path별로 그룹화 (날짜 포함하여 정확한 경로로 매칭)
        const filePathGroups = new Map();
        dbImages.forEach(img => {
          const filePath = img.file_path || '';
          // file_path가 날짜 폴더로만 끝나는 경우, filename 추가
          let actualPath = filePath;
          if (/\/\d{4}-\d{2}-\d{2}$/.test(filePath) && img.filename) {
            actualPath = `${filePath}/${img.filename}`;
          }
          
          if (!filePathGroups.has(actualPath)) {
            filePathGroups.set(actualPath, []);
          }
          filePathGroups.get(actualPath).push(img);
        });

        // 유효한 이미지와 고스트/중복 이미지 분류
        const validImages = [];
        const ghostImages = [];
        const duplicateImages = [];

        filePathGroups.forEach((images, filePath) => {
          const filePathLower = filePath.toLowerCase();
          
          if (storageFilePathMap.has(filePathLower)) {
            // Storage에 존재하는 경우, 가장 최근 것만 유효
            const sorted = images.sort((a, b) => 
              new Date(b.created_at) - new Date(a.created_at)
            );
            validImages.push(sorted[0]);
            // 같은 file_path에 여러 메타데이터가 있는 경우만 중복
            if (sorted.length > 1) {
              duplicateImages.push(...sorted.slice(1));
            }
          } else {
            // Storage에 없는 경우 모두 고스트
            ghostImages.push(...images);
          }
        });

        // 문제가 있는 고객만 기록
        if (ghostImages.length > 0 || duplicateImages.length > 0) {
          results.customersWithIssues.push({
            customerId: customer.id,
            name: customer.name,
            folderName: folderName,
            storageFiles: originalFiles.length,
            dbImages: dbImages.length,
            validImages: validImages.length,
            ghostImages: ghostImages.length,
            duplicateImages: duplicateImages.length
          });

          results.totalGhostImages += ghostImages.length;
          results.totalDuplicateImages += duplicateImages.length;
          results.totalValidImages += validImages.length;
        } else {
          results.totalValidImages += validImages.length;
        }

      } catch (error) {
        console.error(`   ❌ ${customer.name} (${folderName}) 처리 중 오류:`, error.message);
      }
    }

    // 3. 결과 출력
    console.log('\n📊 전체 결과:\n');
    console.log(`   총 고객 수: ${results.totalCustomers}명`);
    console.log(`   문제가 있는 고객: ${results.customersWithIssues.length}명`);
    console.log(`   유효한 이미지: ${results.totalValidImages}개`);
    console.log(`   고스트 이미지: ${results.totalGhostImages}개`);
    console.log(`   중복 이미지: ${results.totalDuplicateImages}개\n`);

    // 4. 문제가 있는 고객 상세
    if (results.customersWithIssues.length > 0) {
      console.log('⚠️  문제가 있는 고객 목록:\n');
      
      // 고스트 이미지가 많은 순으로 정렬
      const sorted = results.customersWithIssues.sort((a, b) => 
        (b.ghostImages + b.duplicateImages) - (a.ghostImages + a.duplicateImages)
      );

      sorted.slice(0, 20).forEach((customer, idx) => {
        console.log(`   ${idx + 1}. ${customer.name} (${customer.folderName})`);
        console.log(`      Storage: ${customer.storageFiles}개, DB: ${customer.dbImages}개`);
        console.log(`      유효: ${customer.validImages}개, 고스트: ${customer.ghostImages}개, 중복: ${customer.duplicateImages}개\n`);
      });

      if (results.customersWithIssues.length > 20) {
        console.log(`   ... 외 ${results.customersWithIssues.length - 20}명\n`);
      }

      // 5. 통계
      const ghostOnly = results.customersWithIssues.filter(c => c.ghostImages > 0 && c.duplicateImages === 0);
      const duplicateOnly = results.customersWithIssues.filter(c => c.ghostImages === 0 && c.duplicateImages > 0);
      const both = results.customersWithIssues.filter(c => c.ghostImages > 0 && c.duplicateImages > 0);

      console.log('📈 문제 유형별 통계:\n');
      console.log(`   고스트만: ${ghostOnly.length}명`);
      console.log(`   중복만: ${duplicateOnly.length}명`);
      console.log(`   둘 다: ${both.length}명\n`);

      // 6. JSON 파일로 저장
      const fs = require('fs');
      const reportPath = 'scripts/customer-ghost-images-report.json';
      fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
      console.log(`📄 상세 보고서 저장: ${reportPath}\n`);
    } else {
      console.log('✅ 모든 고객의 이미지가 동기화되어 있습니다!\n');
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkAllCustomersGhostImages().catch(console.error);
