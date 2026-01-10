/**
 * 샤프트 및 배지 이미지 업로드 스크립트
 * 
 * 1. secret-force-common-shaft*.webp 파일을 복사하여:
 *    - secret-force-v3-shaft*.webp (V3용)
 *    - secret-force-pro-3-shaft*.webp (PRO 3용)
 * 
 * 2. 배지 파일 업로드:
 *    - secret-force-pro-3-badge.webp → PRO 3, PRO 3 MUZIIK
 *    - secret-force-v3-badge.webp → V3
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

// 다운로드 폴더 경로
const downloadsPath = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Downloads');

/**
 * 파일을 Supabase Storage에 업로드
 */
async function uploadFile(localPath, storagePath) {
  try {
    if (!fs.existsSync(localPath)) {
      console.error(`❌ 파일을 찾을 수 없습니다: ${localPath}`);
      return { success: false, error: 'File not found' };
    }

    const fileBuffer = fs.readFileSync(localPath);

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
      console.error(`❌ 업로드 오류 (${storagePath}):`, error);
      return { success: false, error };
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(storagePath);

    console.log(`✅ 업로드 완료: ${path.basename(storagePath)}`);
    console.log(`   📁 경로: ${storagePath}`);
    console.log(`   🔗 URL: ${publicUrl}`);

    return { success: true, url: publicUrl, path: storagePath };
  } catch (error) {
    console.error(`❌ 파일 업로드 오류 (${storagePath}):`, error);
    return { success: false, error };
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 샤프트 및 배지 이미지 업로드 시작\n');

  if (!fs.existsSync(downloadsPath)) {
    console.error(`❌ 다운로드 폴더를 찾을 수 없습니다: ${downloadsPath}`);
    process.exit(1);
  }

  console.log(`📁 다운로드 폴더: ${downloadsPath}\n`);

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  // ============================================
  // 1. 샤프트 이미지 복사 및 업로드
  // ============================================
  console.log('📋 1단계: 샤프트 이미지 복사 및 업로드\n');

  const shaftFiles = [
    {
      source: 'secret-force-common-shaft-grip.webp',
      targets: [
        { slug: 'secret-force-v3', fileName: 'secret-force-v3-shaft-grip.webp' },
        { slug: 'secret-force-pro-3', fileName: 'secret-force-pro-3-shaft-grip.webp' },
      ]
    },
    {
      source: 'secret-force-common-shaft.webp',
      targets: [
        { slug: 'secret-force-v3', fileName: 'secret-force-v3-shaft.webp' },
        { slug: 'secret-force-pro-3', fileName: 'secret-force-pro-3-shaft.webp' },
      ]
    }
  ];

  for (const shaftFile of shaftFiles) {
    const sourceLocalPath = path.join(downloadsPath, shaftFile.source);

    if (!fs.existsSync(sourceLocalPath)) {
      console.warn(`⚠️ 파일을 찾을 수 없습니다: ${shaftFile.source}`);
      console.warn(`   경로: ${sourceLocalPath}`);
      errorCount++;
      continue;
    }

    // 각 타겟에 업로드
    for (const target of shaftFile.targets) {
      const storagePath = `originals/products/${target.slug}/composition/${target.fileName}`;
      const result = await uploadFile(sourceLocalPath, storagePath);
      
      results.push({
        type: 'shaft',
        source: shaftFile.source,
        target: target.fileName,
        slug: target.slug,
        storagePath: storagePath,
        ...result,
      });

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
  }

  // ============================================
  // 2. 배지 이미지 업로드
  // ============================================
  console.log('\n📋 2단계: 배지 이미지 업로드\n');

  const badgeFiles = [
    {
      source: 'secret-force-pro-3-badge.webp',
      targets: [
        { slug: 'secret-force-pro-3', fileName: 'secret-force-pro-3-badge.webp' },
        { slug: 'secret-force-pro-3-muziik', fileName: 'secret-force-pro-3-badge.webp' },
      ]
    },
    {
      source: 'secret-force-v3-badge.webp',
      targets: [
        { slug: 'secret-force-v3', fileName: 'secret-force-v3-badge.webp' },
      ]
    }
  ];

  for (const badgeFile of badgeFiles) {
    const sourceLocalPath = path.join(downloadsPath, badgeFile.source);

    if (!fs.existsSync(sourceLocalPath)) {
      console.warn(`⚠️ 파일을 찾을 수 없습니다: ${badgeFile.source}`);
      console.warn(`   경로: ${sourceLocalPath}`);
      errorCount++;
      continue;
    }

    // 각 타겟에 업로드
    for (const target of badgeFile.targets) {
      const storagePath = `originals/products/${target.slug}/composition/${target.fileName}`;
      const result = await uploadFile(sourceLocalPath, storagePath);
      
      results.push({
        type: 'badge',
        source: badgeFile.source,
        target: target.fileName,
        slug: target.slug,
        storagePath: storagePath,
        ...result,
      });

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
  }

  // 결과 저장
  const resultPath = path.join(__dirname, 'upload-shaft-badge-result.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('✅ 업로드 완료!');
  console.log('='.repeat(60));
  console.log(`📄 결과 파일: ${resultPath}`);
  console.log(`\n📊 요약:`);
  console.log(`  - 성공: ${successCount}개`);
  console.log(`  - 실패: ${errorCount}개`);
  console.log(`\n📁 업로드된 파일 목록:`);
  
  const successResults = results.filter(r => r.success);
  successResults.forEach(r => {
    console.log(`  ✅ ${r.storagePath}`);
  });

  if (errorCount > 0) {
    console.log(`\n❌ 실패한 파일:`);
    const failedResults = results.filter(r => !r.success);
    failedResults.forEach(r => {
      console.log(`  ❌ ${r.source} → ${r.slug}/composition/${r.target}`);
      console.log(`     오류: ${r.error?.message || r.error || 'Unknown error'}`);
    });
  }
}

// 실행
main().catch(console.error);
