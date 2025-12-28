/**
 * detail 폴더의 불필요한 파일 확인
 * - _-_-_-_로 시작하는 파일들 (불필요)
 * - 500 관련 파일들 (composition으로 이동 필요)
 * - 중복 파일들
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const driverProducts = [
  { folder: 'black-beryl', slug: 'black-beryl', name: '시크리트웨폰 블랙 MUZIIK' },
  { folder: 'black-weapon', slug: 'secret-weapon-black', name: '시크리트웨폰 블랙' },
  { folder: 'gold-weapon4', slug: 'secret-weapon-4-1', name: '시크리트웨폰 골드 4.1' },
  { folder: 'gold2', slug: 'secret-force-gold-2', name: '시크리트포스 골드 2' },
  { folder: 'gold2-sapphire', slug: 'gold2-sapphire', name: '시크리트포스 골드 2 MUZIIK' },
  { folder: 'pro3', slug: 'secret-force-pro-3', name: '시크리트포스 PRO 3' },
  { folder: 'pro3-muziik', slug: 'pro3-muziik', name: '시크리트포스 PRO 3 MUZIIK' },
  { folder: 'v3', slug: 'secret-force-v3', name: '시크리트포스 V3' },
];

async function checkUnnecessaryFiles() {
  console.log('🔍 detail 폴더의 불필요한 파일 확인 시작...\n');

  const allResults = {};

  for (const product of driverProducts) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 ${product.name} (${product.folder})`);
    console.log(`${'='.repeat(60)}`);

    const result = {
      folder: product.folder,
      slug: product.slug,
      name: product.name,
      detailFiles: [],
      unnecessaryFiles: [], // _-_-_-_로 시작하는 파일들
      compositionFilesInDetail: [], // detail에 있지만 composition으로 이동해야 할 파일들
      duplicateFiles: [], // 중복 파일들
      needsCleanup: false
    };

    try {
      // detail 폴더 확인
      const { data: detailFiles, error: detailError } = await supabase.storage
        .from('blog-images')
        .list(`originals/products/${product.folder}/detail`, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (!detailError && detailFiles) {
        result.detailFiles = detailFiles.map(f => f.name);
        console.log(`   📁 detail/ 폴더: ${result.detailFiles.length}개 파일`);

        // 불필요한 파일 찾기
        result.detailFiles.forEach(fileName => {
          // _-_-_-_로 시작하는 파일들
          if (fileName.startsWith('_-_-_-_') || fileName.startsWith('_-_-_') || fileName.startsWith('_-_')) {
            result.unnecessaryFiles.push({
              fileName,
              reason: 'malformed_filename'
            });
          }
          
          // 500 관련 파일들 (composition으로 이동 필요)
          if (fileName.includes('500') || fileName.includes('350')) {
            result.compositionFilesInDetail.push({
              fileName,
              reason: 'should_be_in_composition'
            });
          }
        });

        // 중복 파일 찾기 (같은 번호지만 다른 형식)
        const fileMap = new Map();
        result.detailFiles.forEach(fileName => {
          // 파일명에서 번호 추출 (예: 01, 02, 00-01 등)
          const numberMatch = fileName.match(/(\d{2}(?:[-_]\d{2})?)/);
          if (numberMatch) {
            const number = numberMatch[1];
            if (!fileMap.has(number)) {
              fileMap.set(number, []);
            }
            fileMap.get(number).push(fileName);
          }
        });

        fileMap.forEach((files, number) => {
          if (files.length > 1) {
            // 가장 깨끗한 파일명 찾기 (_-_-_-_ 제외, 가장 짧은 것)
            const cleanFiles = files.filter(f => !f.startsWith('_-'));
            if (cleanFiles.length > 0 && files.length > cleanFiles.length) {
              result.duplicateFiles.push({
                number,
                files,
                keep: cleanFiles[0],
                delete: files.filter(f => f !== cleanFiles[0])
              });
            }
          }
        });

        // 결과 출력
        if (result.unnecessaryFiles.length > 0) {
          console.log(`   ⚠️  불필요한 파일 (_-_-_-_ 시작): ${result.unnecessaryFiles.length}개`);
          result.unnecessaryFiles.forEach(item => {
            console.log(`      - ${item.fileName}`);
          });
        }

        if (result.compositionFilesInDetail.length > 0) {
          console.log(`   ⚠️  composition으로 이동 필요: ${result.compositionFilesInDetail.length}개`);
          result.compositionFilesInDetail.forEach(item => {
            console.log(`      - ${item.fileName}`);
          });
        }

        if (result.duplicateFiles.length > 0) {
          console.log(`   ⚠️  중복 파일: ${result.duplicateFiles.length}개 그룹`);
          result.duplicateFiles.forEach(item => {
            console.log(`      - ${item.number}: ${item.files.length}개 (유지: ${item.keep})`);
          });
        }

        if (result.unnecessaryFiles.length === 0 && 
            result.compositionFilesInDetail.length === 0 && 
            result.duplicateFiles.length === 0) {
          console.log(`   ✅ 불필요한 파일 없음`);
        } else {
          result.needsCleanup = true;
        }
      }

    } catch (error) {
      console.error(`   ❌ 오류 발생: ${error.message}`);
      result.errors = error.message;
    }

    allResults[product.folder] = result;
  }

  // 결과 저장
  const outputPath = path.join(__dirname, 'unnecessary-files-in-detail.json');
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
  console.log(`\n\n✅ 결과가 ${outputPath}에 저장되었습니다.`);

  // 요약 출력
  console.log('\n📊 정리 필요 제품 요약:');
  const needsCleanup = Object.values(allResults).filter(r => r.needsCleanup);
  
  if (needsCleanup.length === 0) {
    console.log('   ✅ 모든 제품이 깨끗합니다!');
  } else {
    needsCleanup.forEach(product => {
      console.log(`\n   📦 ${product.name} (${product.folder}):`);
      if (product.unnecessaryFiles.length > 0) {
        console.log(`      - 불필요한 파일 삭제: ${product.unnecessaryFiles.length}개`);
      }
      if (product.compositionFilesInDetail.length > 0) {
        console.log(`      - composition으로 이동: ${product.compositionFilesInDetail.length}개`);
      }
      if (product.duplicateFiles.length > 0) {
        const totalDuplicates = product.duplicateFiles.reduce((sum, d) => sum + d.delete.length, 0);
        console.log(`      - 중복 파일 삭제: ${totalDuplicates}개`);
      }
    });
  }

  console.log('\n✅ 확인 완료!');
}

checkUnnecessaryFiles();

