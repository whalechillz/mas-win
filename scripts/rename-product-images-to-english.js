const fs = require('fs').promises;
const path = require('path');

// 파일명 매핑 테이블
const filenameMapping = {
  // 제품 합성용 솔 이미지
  'gold2-sapphire': {
    '마쓰구_시크리트포스_골드_2_500.webp': 'secret-force-gold-2-sole-500.webp',
  },
  'gold2': {
    '마쓰구_시크리트포스_골드_2_500.webp': 'secret-force-gold-2-sole-500.webp',
  },
  'black-beryl': {
    '마쓰구_시크리트웨폰_블랙_500.webp': 'secret-weapon-black-sole-500.webp',
  },
  'pro3': {
    '마쓰구_시크리트포스_PRO_500.webp': 'secret-force-pro-3-sole-500.webp',
    '마쓰구_시크리트포스_PRO_3_공홈_00.webp': 'secret-force-pro-3-gallery-00.webp',
    '마쓰구_시크리트포스_PRO_3_공홈_01.webp': 'secret-force-pro-3-gallery-01.webp',
    '마쓰구_시크리트포스_PRO_3_공홈_02.webp': 'secret-force-pro-3-gallery-02.webp',
    '마쓰구_시크리트포스_PRO_3_공홈_03.webp': 'secret-force-pro-3-gallery-03.webp',
    '마쓰구_시크리트포스_PRO_3_공홈_04.webp': 'secret-force-pro-3-gallery-04.webp',
    '마쓰구_시크리트포스_PRO_3_공홈_05.webp': 'secret-force-pro-3-gallery-05.webp',
    '마쓰구_시크리트포스_PRO_3_공홈_06.webp': 'secret-force-pro-3-gallery-06.webp',
    '마쓰구_시크리트포스_PRO_3_공홈_07.webp': 'secret-force-pro-3-gallery-07.webp',
    '마쓰구_시크리트포스_PRO_3_공홈_08.webp': 'secret-force-pro-3-gallery-08.webp',
  },
  'v3': {
    '마쓰구_시크리트포스_V3_350_bg.webp': 'secret-force-v3-sole-350-bg.webp',
    '마쓰구_시크리트포스_V3_05_00.webp': 'secret-force-v3-gallery-05-00.webp',
    '마쓰구_시크리트포스_V3_공홈_02.webp': 'secret-force-v3-gallery-02.webp',
    '마쓰구_시크리트포스_V3_공홈_03.webp': 'secret-force-v3-gallery-03.webp',
    '마쓰구_시크리트포스_V3_공홈_04.webp': 'secret-force-v3-gallery-04.webp',
    '마쓰구_시크리트포스_V3_공홈_05.webp': 'secret-force-v3-gallery-05.webp',
    '마쓰구_시크리트포스_V3_공홈_06.webp': 'secret-force-v3-gallery-06.webp',
    '마쓰구_시크리트포스_V3_공홈_07.webp': 'secret-force-v3-gallery-07.webp',
  },
  'black-weapon': {
    '마쓰구_시크리트웨폰_블랙_500.webp': 'secret-weapon-black-sole-500.webp',
    '마쓰구_시크리트웨폰_블랙_공홈_00_01.webp': 'secret-weapon-black-gallery-00-01.webp',
    '마쓰구_시크리트웨폰_블랙_공홈_01.webp': 'secret-weapon-black-gallery-01.webp',
    '마쓰구_시크리트웨폰_블랙_공홈_02.webp': 'secret-weapon-black-gallery-02.webp',
    '마쓰구_시크리트웨폰_블랙_공홈_03.webp': 'secret-weapon-black-gallery-03.webp',
    '마쓰구_시크리트웨폰_블랙_공홈_04.webp': 'secret-weapon-black-gallery-04.webp',
    '마쓰구_시크리트웨폰_블랙_공홈_05.webp': 'secret-weapon-black-gallery-05.webp',
    '마쓰구_시크리트웨폰_블랙_공홈_06.webp': 'secret-weapon-black-gallery-06.webp',
    '마쓰구_시크리트웨폰_블랙_공홈_07.webp': 'secret-weapon-black-gallery-07.webp',
    '마쓰구_시크리트웨폰_블랙_공홈_08_01.webp': 'secret-weapon-black-gallery-08-01.webp',
  },
  'gold-weapon4': {
    '마쓰구_시크리트웨폰_4.1_500.webp': 'secret-weapon-gold-4-1-sole-500.webp',
    '마쓰구_시크리트웨폰_4.1_공홈_00_01.jpg': 'secret-weapon-gold-4-1-gallery-00-01.webp',
    '마쓰구_시크리트웨폰_4.1_공홈_01.png': 'secret-weapon-gold-4-1-gallery-01.webp',
    '마쓰구_시크리트웨폰_4.1_공홈_02.jpg': 'secret-weapon-gold-4-1-gallery-02.webp',
    '마쓰구_시크리트웨폰_4.1_공홈_03.jpg': 'secret-weapon-gold-4-1-gallery-03.webp',
    '마쓰구_시크리트웨폰_4.1_공홈_04.jpg': 'secret-weapon-gold-4-1-gallery-04.webp',
    '마쓰구_시크리트웨폰_4.1_공홈_05.jpg': 'secret-weapon-gold-4-1-gallery-05.webp',
    '마쓰구_시크리트웨폰_4.1_공홈_06.jpg': 'secret-weapon-gold-4-1-gallery-06.webp',
    '마쓰구_시크리트웨폰_4.1_공홈_07.jpg': 'secret-weapon-gold-4-1-gallery-07.webp',
    '마쓰구_시크리트웨폰_4.1_공홈_08_01.jpg': 'secret-weapon-gold-4-1-gallery-08-01.webp',
  },
};

async function renameFiles() {
  const baseDir = path.join(process.cwd(), 'public', 'main', 'products');
  let totalRenamed = 0;
  let totalErrors = 0;

  console.log('🔄 제품 이미지 파일명을 영어로 변경 시작...\n');

  for (const [folder, mappings] of Object.entries(filenameMapping)) {
    const folderPath = path.join(baseDir, folder);
    
    try {
      // 폴더 존재 확인
      await fs.access(folderPath);
      console.log(`📁 ${folder} 폴더 처리 중...`);

      for (const [oldName, newName] of Object.entries(mappings)) {
        const oldPath = path.join(folderPath, oldName);
        const newPath = path.join(folderPath, newName);

        try {
          // 파일 존재 확인
          await fs.access(oldPath);
          
          // 새 파일명이 이미 존재하는지 확인
          try {
            await fs.access(newPath);
            console.log(`   ⏭️  ${oldName} → ${newName} (이미 존재)`);
            continue;
          } catch {
            // 파일명이 없으면 정상 진행
          }

          // 파일명 변경
          await fs.rename(oldPath, newPath);
          console.log(`   ✅ ${oldName} → ${newName}`);
          totalRenamed++;
        } catch (error) {
          if (error.code === 'ENOENT') {
            console.log(`   ⚠️  ${oldName} (파일 없음)`);
          } else {
            console.error(`   ❌ ${oldName} → ${newName} 실패:`, error.message);
            totalErrors++;
          }
        }
      }
    } catch (error) {
      console.error(`❌ ${folder} 폴더 접근 실패:`, error.message);
      totalErrors++;
    }
  }

  console.log(`\n✅ 완료: ${totalRenamed}개 파일 변경, ${totalErrors}개 오류`);
}

renameFiles().catch(console.error);

