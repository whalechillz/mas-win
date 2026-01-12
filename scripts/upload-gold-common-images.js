/**
 * 골드 공통 이미지 업로드 스크립트
 * 다운로드 폴더의 파일들을 secret-force-gold-common/composition/에 업로드
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const downloadsPath = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Downloads');

const TARGET_FOLDER = 'originals/products/secret-force-gold-common/composition';

// 파일명 매핑
const fileMappings = {
  '소울_01.webp': 'secret-force-gold-common-sole-01.webp',
  '소울_02.webp': 'secret-force-gold-common-sole-02.webp',
  '소울_03.webp': 'secret-force-gold-common-sole-03.webp',
  '크라운.webp': 'secret-force-gold-common-crown.webp',
  '프론트-페이스.webp': 'secret-force-gold-common-front-face.webp',
};

/**
 * 파일 업로드
 */
async function uploadFile(sourceFileName, targetFileName) {
  try {
    const sourcePath = path.join(downloadsPath, sourceFileName);

    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${sourcePath}`);
      return { success: false, error: 'File not found' };
    }

    const fileBuffer = fs.readFileSync(sourcePath);
    const storagePath = `${TARGET_FOLDER}/${targetFileName}`;

    console.log(`📤 업로드 중: ${sourceFileName} → ${targetFileName}`);

    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, fileBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true, // 이미 존재하면 덮어쓰기
      });

    if (error) {
      console.error(`❌ 업로드 오류:`, error);
      return { success: false, error };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(storagePath);

    console.log(`✅ 업로드 완료: ${targetFileName}`);
    console.log(`   📁 경로: ${storagePath}`);
    console.log(`   🔗 URL: ${publicUrl}`);

    return { success: true, url: publicUrl, path: storagePath };
  } catch (error) {
    console.error(`❌ 파일 업로드 오류:`, error);
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 골드 공통 이미지 업로드 시작\n');
  console.log(`📁 다운로드 폴더: ${downloadsPath}`);
  console.log(`📁 대상 폴더: ${TARGET_FOLDER}\n`);

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (const [sourceFile, targetFile] of Object.entries(fileMappings)) {
    const result = await uploadFile(sourceFile, targetFile);
    results.push({
      source: sourceFile,
      target: targetFile,
      ...result,
    });

    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
    console.log(''); // 빈 줄 추가
  }

  // 결과 저장
  const resultPath = path.join(__dirname, 'upload-gold-common-images-result.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));

  console.log('='.repeat(60));
  console.log('✅ 업로드 완료!');
  console.log('='.repeat(60));
  console.log(`📄 결과 파일: ${resultPath}`);
  console.log(`\n📊 요약:`);
  console.log(`   - 성공: ${successCount}개`);
  console.log(`   - 실패: ${errorCount}개`);
  console.log(`\n📁 업로드된 파일 목록:`);
  results.filter(r => r.success).forEach(r => console.log(`   ✅ ${r.path}`));
}

main().catch(console.error);
