/**
 * 모든 고객의 이미지 Storage 동기화 (고스트 이미지 및 중복 이미지 삭제)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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
      allFiles.push({
        path: fullPath,
        name: item.name,
        size: item.metadata?.size || 0
      });
    } else {
      await getAllFilesFromStorage(fullPath, allFiles);
    }
  }

  return allFiles;
}

async function syncAllCustomersImages() {
  console.log('🔄 모든 고객 이미지 Storage 동기화 시작...\n');

  const DRY_RUN = !process.argv.includes('--execute');
  const BATCH_SIZE = parseInt(process.argv.find(arg => arg.startsWith('--batch='))?.split('=')[1] || '10', 10);

  if (DRY_RUN) {
    console.log('🔍 DRY RUN 모드: 실제 삭제 없이 시뮬레이션만 수행합니다.\n');
    console.log('   실제 동기화를 실행하려면: node scripts/sync-all-customers-images.js --execute\n');
  } else {
    console.log('🚀 실제 동기화를 시작합니다...\n');
  }

  // 백업 파일 경로
  const backupPath = `scripts/image-sync-backup-${new Date().toISOString().split('T')[0]}.json`;
  const deletedIds = [];

  try {
    // 1. 문제가 있는 고객 목록 로드 (이전 확인 결과 사용)
    let customersToSync = [];
    
    if (fs.existsSync('scripts/customer-ghost-images-report.json')) {
      const report = JSON.parse(fs.readFileSync('scripts/customer-ghost-images-report.json', 'utf8'));
      customersToSync = report.customersWithIssues;
      console.log(`📋 보고서에서 ${customersToSync.length}명 고객 로드\n`);
    } else {
      console.log('⚠️  보고서 파일이 없습니다. 전체 고객을 스캔합니다...\n');
      
      // 전체 고객 조회
      const { data: allCustomers } = await supabase
        .from('customers')
        .select('id, name, folder_name')
        .not('folder_name', 'is', null)
        .limit(1000);
      
      customersToSync = (allCustomers || []).map(c => ({
        customerId: c.id,
        name: c.name,
        folderName: c.folder_name
      }));
    }

    console.log(`📊 동기화 대상: ${customersToSync.length}명 고객\n`);

    let totalProcessed = 0;
    let totalDeleted = 0;
    let totalErrors = 0;

    // 2. 배치별로 처리
    for (let batchStart = 0; batchStart < customersToSync.length; batchStart += BATCH_SIZE) {
      const batch = customersToSync.slice(batchStart, batchStart + BATCH_SIZE);
      
      console.log(`\n📦 배치 ${Math.floor(batchStart / BATCH_SIZE) + 1} 처리 중 (${batchStart + 1}-${Math.min(batchStart + BATCH_SIZE, customersToSync.length)}/${customersToSync.length})...\n`);

      for (const customer of batch) {
        try {
          const folderName = customer.folderName;
          if (!folderName) continue;

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

          if (dbError || !dbImages || dbImages.length === 0) continue;

          // Storage 파일명 맵
          const storageFileNames = new Set(originalFiles.map(f => f.name.toLowerCase()));

          // file_path별로 그룹화 (날짜 포함하여 정확한 경로로 매칭)
          const filePathMap = new Map();
          dbImages.forEach(img => {
            const filePath = img.file_path || '';
            // file_path가 날짜 폴더로만 끝나는 경우, filename 추가
            let actualPath = filePath;
            if (/\/\d{4}-\d{2}-\d{2}$/.test(filePath) && img.filename) {
              actualPath = `${filePath}/${img.filename}`;
            }
            
            if (!filePathMap.has(actualPath)) {
              filePathMap.set(actualPath, []);
            }
            filePathMap.get(actualPath).push(img);
          });

          // Storage 파일 경로 맵
          const storageFilePathMap = new Set(storageFiles.map(f => f.path.toLowerCase()));

          // 유지할 것과 삭제할 것 결정
          const toKeep = [];
          const toDelete = [];

          filePathMap.forEach((images, filePath) => {
            const filePathLower = filePath.toLowerCase();
            
            if (storageFilePathMap.has(filePathLower)) {
              // Storage에 존재하는 경우, 가장 최근 것만 유지
              const sorted = images.sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
              );
              toKeep.push(sorted[0]);
              // 같은 file_path에 여러 메타데이터가 있는 경우만 중복
              if (sorted.length > 1) {
                toDelete.push(...sorted.slice(1));
              }
            } else {
              // Storage에 없는 경우 모두 삭제 (고스트)
              toDelete.push(...images);
            }
          });

          if (toDelete.length > 0) {
            console.log(`   📝 ${customer.name} (${folderName}): ${toDelete.length}개 삭제 예정`);

            if (!DRY_RUN) {
              const deleteIds = toDelete.map(img => img.id);
              
              const { error: deleteError } = await supabase
                .from('image_assets')
                .delete()
                .in('id', deleteIds);

              if (deleteError) {
                console.error(`   ❌ ${customer.name} 삭제 실패: ${deleteError.message}`);
                totalErrors++;
              } else {
                deletedIds.push(...deleteIds.map(id => ({
                  id,
                  customer: customer.name,
                  folderName: folderName,
                  deletedAt: new Date().toISOString()
                })));
                totalDeleted += deleteIds.length;
                console.log(`   ✅ ${customer.name}: ${deleteIds.length}개 삭제 완료`);
              }
            }
          }

          totalProcessed++;

        } catch (error) {
          console.error(`   ❌ ${customer.name} 처리 중 오류:`, error.message);
          totalErrors++;
        }
      }

      // 배치 간 잠시 대기 (DB 부하 방지)
      if (!DRY_RUN && batchStart + BATCH_SIZE < customersToSync.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 3. 백업 저장
    if (!DRY_RUN && deletedIds.length > 0) {
      const backup = {
        syncDate: new Date().toISOString(),
        totalDeleted: deletedIds.length,
        deletedImages: deletedIds
      };
      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
      console.log(`\n💾 백업 저장: ${backupPath}`);
    }

    // 4. 최종 결과
    console.log('\n📊 최종 결과:\n');
    console.log(`   처리된 고객: ${totalProcessed}명`);
    if (!DRY_RUN) {
      console.log(`   삭제된 이미지: ${totalDeleted}개`);
      console.log(`   오류 발생: ${totalErrors}건`);
      if (deletedIds.length > 0) {
        console.log(`   백업 파일: ${backupPath}`);
      }
    } else {
      console.log(`   삭제 예정 이미지: ${customersToSync.reduce((sum, c) => sum + (c.ghostImages || 0) + (c.duplicateImages || 0), 0)}개`);
    }

    if (DRY_RUN) {
      console.log('\n💡 실제 동기화를 실행하려면:');
      console.log('   node scripts/sync-all-customers-images.js --execute');
      console.log('\n   배치 크기 조정:');
      console.log('   node scripts/sync-all-customers-images.js --execute --batch=5');
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

syncAllCustomersImages().catch(console.error);
