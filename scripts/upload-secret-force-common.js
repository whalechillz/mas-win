/**
 * secret-force-common 폴더에 9개 파일 업로드 스크립트
 * 
 * 다운로드 폴더의 파일을 읽어서 Supabase Storage에 업로드
 * 파일명 매핑:
 * - (0) → secret-force-common-sole-01.webp
 * - (1) → secret-force-common-sole-02.webp
 * - (2) → secret-force-common-sole-03.webp
 * - (3) → secret-force-common-front-face-01.webp
 * - (4) → secret-force-common-crown-01.webp
 * - (5) → secret-force-common-toe-01.webp
 * - (6) → secret-force-common-back-01.webp
 * - (7) → secret-force-common-back-02.webp
 * - (8) → secret-force-common-back-03.webp
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('   .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 설정해주세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 파일명 매핑
const fileMappings = {
  '마쓰구_드라이버_2000X2000 (0).webp': 'secret-force-common-sole-01.webp',
  '마쓰구_드라이버_2000X2000 (1).webp': 'secret-force-common-sole-02.webp',
  '마쓰구_드라이버_2000X2000 (2).webp': 'secret-force-common-sole-03.webp',
  '마쓰구_드라이버_2000X2000 (3).webp': 'secret-force-common-front-face-01.webp',
  '마쓰구_드라이버_2000X2000 (4).webp': 'secret-force-common-crown-01.webp',
  '마쓰구_드라이버_2000X2000 (5).webp': 'secret-force-common-toe-01.webp',
  '마쓰구_드라이버_2000X2000 (6).webp': 'secret-force-common-back-01.webp',
  '마쓰구_드라이버_2000X2000 (7).webp': 'secret-force-common-back-02.webp',
  '마쓰구_드라이버_2000X2000 (8).webp': 'secret-force-common-back-03.webp',
};

const targetFolder = 'originals/products/secret-force-common/composition';

/**
 * 파일 업로드
 */
async function uploadFile(localPath, fileName) {
  try {
    if (!fs.existsSync(localPath)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${localPath}`);
      return { success: false, error: 'File not found' };
    }

    const fileBuffer = fs.readFileSync(localPath);
    const storagePath = `${targetFolder}/${fileName}`;

    console.log(`📤 업로드 중: ${path.basename(localPath)} → ${storagePath}`);

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, fileBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true, // 이미 존재하면 덮어쓰기
      });

    if (error) {
      console.error(`❌ 업로드 오류 (${fileName}):`, error);
      return { success: false, error };
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(storagePath);

    console.log(`✅ 업로드 완료: ${fileName}`);
    console.log(`   URL: ${publicUrl}`);

    return { success: true, url: publicUrl, path: storagePath };
  } catch (error) {
    console.error(`❌ 파일 업로드 오류 (${fileName}):`, error);
    return { success: false, error };
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 secret-force-common 파일 업로드 시작\n');

  // 다운로드 폴더 경로 (사용자 홈 디렉토리 기준)
  const downloadsPath = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Downloads');

  if (!fs.existsSync(downloadsPath)) {
    console.error(`❌ 다운로드 폴더를 찾을 수 없습니다: ${downloadsPath}`);
    console.error('   파일 경로를 직접 지정해주세요.');
    process.exit(1);
  }

  console.log(`📁 다운로드 폴더: ${downloadsPath}\n`);

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  // 각 파일 업로드
  for (const [originalName, newName] of Object.entries(fileMappings)) {
    const localPath = path.join(downloadsPath, originalName);

    if (!fs.existsSync(localPath)) {
      console.warn(`⚠️ 파일을 찾을 수 없습니다: ${originalName}`);
      console.warn(`   경로: ${localPath}`);
      errorCount++;
      results.push({
        originalName,
        newName,
        success: false,
        error: 'File not found',
      });
      continue;
    }

    const result = await uploadFile(localPath, newName);
    results.push({
      originalName,
      newName,
      ...result,
    });

    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  // 결과 저장
  const resultPath = path.join(__dirname, 'upload-secret-force-common-result.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));

  console.log('\n✅ 업로드 완료!');
  console.log(`📄 결과 파일: ${resultPath}`);
  console.log(`\n📊 요약:`);
  console.log(`  - 성공: ${successCount}개`);
  console.log(`  - 실패: ${errorCount}개`);
  console.log(`  - 대상 폴더: ${targetFolder}`);
}

// 실행
main().catch(console.error);
