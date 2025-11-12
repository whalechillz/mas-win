#!/usr/bin/env node

/**
 * Phase 8: 마이그레이션 결과 검증 스크립트
 * 
 * 1. 모든 이미지가 Storage에 업로드되었는지 확인
 * 2. HTML 파일의 이미지 URL이 업데이트되었는지 확인
 * 3. 블로그 본문의 이미지 URL이 업데이트되었는지 확인
 * 4. 메타데이터가 모두 생성되었는지 확인
 * 5. 중복 이미지 확인
 */

const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blog-images';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const CAMPAIGNS_DIR = path.join(PUBLIC_DIR, 'campaigns');

async function verifyMigration() {
  console.log('🔍 Phase 8: 마이그레이션 결과 검증\n');
  console.log('='.repeat(60));

  const months = ['2025-05', '2025-06', '2025-07', '2025-08', '2025-09'];
  const verificationResults = {
    storage: { total: 0, found: 0, missing: [] },
    metadata: { total: 0, found: 0, missing: [] },
    html: { total: 0, updated: 0, old: [] },
    blog: { total: 0, updated: 0, old: [] },
    duplicates: { groups: [], count: 0 },
  };

  // 1. Storage 파일 확인
  console.log('\n📦 1단계: Storage 파일 확인');
  for (const month of months) {
    const localMonthDir = path.join(CAMPAIGNS_DIR, month);
    const storageFolder = `originals/campaigns/${month}`;

    let localFiles = [];
    try {
      localFiles = await fs.readdir(localMonthDir);
      localFiles = localFiles.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4'].includes(ext);
      });
    } catch (e) {
      console.warn(`  ⚠️ 로컬 폴더를 찾을 수 없습니다: ${localMonthDir}`);
      continue;
    }

    const { data: storageFiles, error: storageError } = await supabase.storage
      .from(bucketName)
      .list(storageFolder, { limit: 100 });

    if (storageError) {
      console.error(`  ❌ Storage 파일 목록 조회 실패 (${storageFolder}):`, storageError.message);
      continue;
    }

    const storageFileNames = storageFiles
      .map(f => f.name)
      .filter(name => name !== '.keep.png');

    verificationResults.storage.total += localFiles.length;

    for (const localFile of localFiles) {
      const localBaseName = localFile.replace(/\.[^/.]+$/, '');
      let found = false;

      for (const storageFile of storageFileNames) {
        const storageBaseName = storageFile.replace(/^[0-9a-fA-F-]{36}-/, '').replace(/\.[^/.]+$/, '');
        if (storageFile === localFile || storageBaseName === localBaseName) {
          found = true;
          break;
        }
      }

      if (found) {
        verificationResults.storage.found++;
      } else {
        verificationResults.storage.missing.push({ month, fileName: localFile });
      }
    }

    console.log(`  ${month}: 로컬 ${localFiles.length}개, Storage ${storageFileNames.length}개`);
  }

  // 2. 메타데이터 확인
  console.log('\n📋 2단계: 메타데이터 확인');
  for (const month of months) {
    const storageFolder = `originals/campaigns/${month}`;
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from(bucketName)
      .list(storageFolder, { limit: 100 });

    if (storageError) continue;

    const storageFileNames = storageFiles
      .map(f => f.name)
      .filter(name => name !== '.keep.png');

    verificationResults.metadata.total += storageFileNames.length;

    for (const storageFile of storageFileNames) {
      const { data: metadata, error: metadataError } = await supabase
        .from('image_assets')
        .select('id')
        .eq('file_path', `${storageFolder}/${storageFile}`)
        .single();

      if (metadata && !metadataError) {
        verificationResults.metadata.found++;
      } else {
        verificationResults.metadata.missing.push({ month, fileName: storageFile });
      }
    }
  }

  // 3. HTML 파일 URL 확인
  console.log('\n📄 3단계: HTML 파일 URL 확인');
  for (const month of months) {
    const htmlFile = path.join(PUBLIC_DIR, 'campaigns', `funnel-${month}-live.html`);
    try {
      const htmlContent = await fs.readFile(htmlFile, 'utf-8');
      
      // 로컬 경로 패턴 찾기
      const localPathPatterns = [
        /src=["']\/campaigns\/[^"']+["']/g,
        /src=["']\.\.\/campaigns\/[^"']+["']/g,
        /url\(["']?\/campaigns\/[^"')]+["']?\)/g,
      ];

      let hasOldPaths = false;
      for (const pattern of localPathPatterns) {
        if (pattern.test(htmlContent)) {
          hasOldPaths = true;
          break;
        }
      }

      verificationResults.html.total++;
      if (hasOldPaths) {
        verificationResults.html.old.push({ month, file: `funnel-${month}-live.html` });
      } else {
        verificationResults.html.updated++;
      }
    } catch (e) {
      // HTML 파일이 없으면 스킵
    }
  }

  // 4. 블로그 본문 URL 확인 (샘플링)
  console.log('\n📝 4단계: 블로그 본문 URL 확인 (샘플링)');
  const { data: blogPosts, error: blogError } = await supabase
    .from('blog_posts')
    .select('id, content, featured_image')
    .like('content', '%/campaigns/%')
    .limit(10);

  if (!blogError && blogPosts) {
    for (const post of blogPosts) {
      const content = post.content || '';
      const localPathPattern = /\/campaigns\/[^"'\s\)]+/g;
      const matches = content.match(localPathPattern);

      if (matches && matches.length > 0) {
        verificationResults.blog.total++;
        verificationResults.blog.old.push({ postId: post.id, urls: matches });
      } else {
        verificationResults.blog.total++;
        verificationResults.blog.updated++;
      }
    }
  }

  // 5. 중복 이미지 확인 (해시 기반)
  console.log('\n🔄 5단계: 중복 이미지 확인');
  const { data: allCampaignImages, error: imagesError } = await supabase
    .from('image_assets')
    .select('id, filename, file_path, hash_md5')
    .like('file_path', 'originals/campaigns/%');

  if (!imagesError && allCampaignImages) {
    const hashMap = new Map();
    
    for (const img of allCampaignImages) {
      if (!img.hash_md5) continue;
      
      if (!hashMap.has(img.hash_md5)) {
        hashMap.set(img.hash_md5, []);
      }
      hashMap.get(img.hash_md5).push(img);
    }

    hashMap.forEach((group, hash) => {
      if (group.length > 1) {
        verificationResults.duplicates.groups.push({
          hash,
          count: group.length,
          files: group.map(img => ({
            filename: img.filename,
            file_path: img.file_path,
          })),
        });
        verificationResults.duplicates.count += group.length - 1; // 중복 개수 (대표 1개 제외)
      }
    });
  }

  // 결과 출력
  console.log('\n' + '='.repeat(60));
  console.log('📊 검증 결과 요약\n');

  console.log('1. Storage 파일:');
  console.log(`   ✅ 업로드 완료: ${verificationResults.storage.found}/${verificationResults.storage.total}`);
  if (verificationResults.storage.missing.length > 0) {
    console.log(`   ❌ 누락: ${verificationResults.storage.missing.length}개`);
    verificationResults.storage.missing.slice(0, 5).forEach(item => {
      console.log(`      - ${item.month}/${item.fileName}`);
    });
  }

  console.log('\n2. 메타데이터:');
  console.log(`   ✅ 생성 완료: ${verificationResults.metadata.found}/${verificationResults.metadata.total}`);
  if (verificationResults.metadata.missing.length > 0) {
    console.log(`   ❌ 누락: ${verificationResults.metadata.missing.length}개`);
    verificationResults.metadata.missing.slice(0, 5).forEach(item => {
      console.log(`      - ${item.month}/${item.fileName}`);
    });
  }

  console.log('\n3. HTML 파일 URL:');
  console.log(`   ✅ 업데이트 완료: ${verificationResults.html.updated}/${verificationResults.html.total}`);
  if (verificationResults.html.old.length > 0) {
    console.log(`   ⚠️ 업데이트 필요: ${verificationResults.html.old.length}개`);
    verificationResults.html.old.forEach(item => {
      console.log(`      - ${item.file}`);
    });
  }

  console.log('\n4. 블로그 본문 URL:');
  console.log(`   ✅ 업데이트 완료: ${verificationResults.blog.updated}/${verificationResults.blog.total}`);
  if (verificationResults.blog.old.length > 0) {
    console.log(`   ⚠️ 업데이트 필요: ${verificationResults.blog.old.length}개`);
    verificationResults.blog.old.slice(0, 3).forEach(item => {
      console.log(`      - 블로그 ID ${item.postId}: ${item.urls.length}개 URL`);
    });
  }

  console.log('\n5. 중복 이미지:');
  console.log(`   🔄 중복 그룹: ${verificationResults.duplicates.groups.length}개`);
  console.log(`   📊 중복 파일 수: ${verificationResults.duplicates.count}개`);
  if (verificationResults.duplicates.groups.length > 0) {
    console.log('\n   상위 5개 중복 그룹:');
    verificationResults.duplicates.groups
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .forEach((group, index) => {
        console.log(`   ${index + 1}. 해시 ${group.hash.substring(0, 8)}... (${group.count}개)`);
        group.files.slice(0, 3).forEach(file => {
          console.log(`      - ${file.filename}`);
        });
      });
  }

  // 결과 저장
  const outputPath = path.join(process.cwd(), 'docs', 'phase8-verification-result.json');
  await fs.writeFile(outputPath, JSON.stringify(verificationResults, null, 2));
  console.log(`\n📄 검증 결과 저장: ${outputPath}\n`);

  // 전체 상태 요약
  const allPassed = 
    verificationResults.storage.missing.length === 0 &&
    verificationResults.metadata.missing.length === 0 &&
    verificationResults.html.old.length === 0 &&
    verificationResults.blog.old.length === 0;

  if (allPassed) {
    console.log('✅ 모든 검증 통과!');
  } else {
    console.log('⚠️ 일부 검증 실패. 위의 상세 내용을 확인하세요.');
  }
}

if (require.main === module) {
  verifyMigration().catch((error) => {
    console.error('❌ 검증 오류:', error);
    process.exit(1);
  });
}

module.exports = { verifyMigration };








