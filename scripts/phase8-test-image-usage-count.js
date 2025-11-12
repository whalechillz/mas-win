#!/usr/bin/env node

/**
 * Phase 8: 이미지 사용 횟수 확인 테스트
 * 
 * HTML 파일과 DB의 이미지 사용 현황을 확인하고,
 * 갤러리에서 표시되는 사용 횟수를 검증합니다.
 */

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

// HTML 파일에서 이미지 경로 추출
function extractImagePathsFromHTML(htmlContent) {
  const imagePaths = [];
  
  const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgTagRegex.exec(htmlContent)) !== null) {
    imagePaths.push(match[1]);
  }
  
  const bgImageRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgImageRegex.exec(htmlContent)) !== null) {
    imagePaths.push(match[1]);
  }
  
  return imagePaths;
}

// 파일명 정규화 (언더스코어 제거, 소문자 변환, 확장자 제거)
function normalizeFileName(fileName) {
  if (!fileName) return '';
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  return withoutExt.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
}

// 이미지 URL이 특정 파일과 일치하는지 확인 (check-and-remove-duplicates.js와 동일한 로직)
function matchesImage(imageUrl, filePath, fileName) {
  if (!imageUrl) return false;
  
  // 1. Supabase Storage URL에서 파일 경로 추출
  const storageUrlMatch = imageUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (storageUrlMatch) {
    const storagePath = decodeURIComponent(storageUrlMatch[1]);
    if (storagePath === filePath) return true;
    const storageFileName = storagePath.split('/').pop();
    if (storageFileName === fileName) return true;
    
    // 정규화된 파일명 비교
    const normalizedStorage = normalizeFileName(storageFileName);
    const normalizedFile = normalizeFileName(fileName);
    if (normalizedStorage && normalizedFile && normalizedStorage === normalizedFile) return true;
  }
  
  // 2. 상대 경로 처리 (/campaigns/2025-05/...)
  if (imageUrl.startsWith('/campaigns/') || imageUrl.startsWith('/originals/')) {
    const relativePath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    if (filePath.includes(relativePath) || relativePath.includes(filePath)) return true;
    
    const relativeFileName = relativePath.split('/').pop().split('?')[0];
    if (relativeFileName === fileName) return true;
    
    // 정규화된 파일명 비교
    const normalizedRelative = normalizeFileName(relativeFileName);
    const normalizedFile = normalizeFileName(fileName);
    if (normalizedRelative && normalizedFile && normalizedRelative === normalizedFile) return true;
  }
  
  // 3. 직접 파일명 비교
  const urlFileName = imageUrl.split('/').pop().split('?')[0];
  if (urlFileName === fileName) return true;
  if (imageUrl.includes(filePath)) return true;
  
  // 정규화된 파일명 비교
  const normalizedUrl = normalizeFileName(urlFileName);
  const normalizedFile = normalizeFileName(fileName);
  if (normalizedUrl && normalizedFile && normalizedUrl === normalizedFile) return true;
  
  // 4. UUID 제거 후 파일명 비교
  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-(.+)$/;
  const urlMatch = urlFileName.match(uuidPattern);
  const fileMatch = fileName.match(uuidPattern);
  
  if (urlMatch && fileMatch) {
    if (urlMatch[1] === fileMatch[1]) return true;
    // 정규화된 비교
    const normalizedUrlBase = normalizeFileName(urlMatch[1]);
    const normalizedFileBase = normalizeFileName(fileMatch[1]);
    if (normalizedUrlBase && normalizedFileBase && normalizedUrlBase === normalizedFileBase) return true;
  }
  
  // 5. UUID 제거 후 원본 파일명 비교
  if (urlMatch) {
    const urlBaseName = urlMatch[1];
    const fileBaseName = fileName.replace(uuidPattern, '$1');
    if (urlBaseName === fileBaseName) return true;
    
    // 정규화된 비교
    const normalizedUrlBase = normalizeFileName(urlBaseName);
    const normalizedFileBase = normalizeFileName(fileBaseName);
    if (normalizedUrlBase && normalizedFileBase && normalizedUrlBase === normalizedFileBase) return true;
  }
  
  // 6. fileName에서 UUID 제거 후 비교
  if (fileMatch) {
    const fileBaseName = fileMatch[1];
    const normalizedUrlBase = normalizeFileName(urlFileName);
    const normalizedFileBase = normalizeFileName(fileBaseName);
    if (normalizedUrlBase && normalizedFileBase && normalizedUrlBase === normalizedFileBase) return true;
  }
  
  return false;
}

async function testImageUsageCount() {
  console.log('🔍 Phase 8: 이미지 사용 횟수 확인 테스트\n');
  console.log('='.repeat(60));

  // 1. HTML 파일에서 이미지 경로 추출
  console.log('\n📄 1단계: HTML 파일에서 이미지 경로 추출');
  const versionsDir = path.join(process.cwd(), 'public', 'versions');
  const htmlFiles = fs.existsSync(versionsDir) 
    ? fs.readdirSync(versionsDir).filter(f => f.endsWith('.html'))
    : [];

  const htmlImageUsage = {};
  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(versionsDir, htmlFile);
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const imagePaths = extractImagePathsFromHTML(htmlContent);
    htmlImageUsage[htmlFile] = imagePaths;
    console.log(`  ${htmlFile}: ${imagePaths.length}개 이미지 경로`);
    
    // 디버깅: 첫 번째 이미지 경로 출력
    if (imagePaths.length > 0 && htmlFile === 'funnel-2025-05-live.html') {
      console.log(`    첫 번째 이미지 경로: ${imagePaths[0]}`);
      console.log(`    두 번째 이미지 경로: ${imagePaths[1] || '없음'}`);
    }
  }

  // 2. DB에서 2025-05 폴더의 이미지 조회
  console.log('\n📦 2단계: DB에서 originals/campaigns/2025-05 이미지 조회');
  const { data: dbImages, error: dbError } = await supabase
    .from('image_assets')
    .select('id, filename, file_path, cdn_url, hash_md5, original_filename, usage_count')
    .like('file_path', 'originals/campaigns/2025-05/%')
    .order('file_path', { ascending: true });

  if (dbError) {
    console.error('❌ DB 조회 실패:', dbError.message);
    process.exit(1);
  }
  console.log(`✅ DB 이미지 조회: ${dbImages.length}개`);

  // 3. 각 이미지의 사용 현황 확인
  console.log('\n🔍 3단계: 각 이미지의 사용 현황 확인');
  const usageResults = [];
  
  for (const image of dbImages) {
    const usage = {
      image: {
        id: image.id,
        filename: image.filename,
        file_path: image.file_path,
        cdn_url: image.cdn_url,
        original_filename: image.original_filename,
        db_usage_count: image.usage_count || 0,
      },
      htmlFiles: [],
      blogPosts: [],
      totalCount: 0,
    };

    // HTML 파일에서 사용 확인
    for (const [htmlFile, imagePaths] of Object.entries(htmlImageUsage)) {
      for (const imagePath of imagePaths) {
        const isMatch = matchesImage(imagePath, image.file_path, image.filename);
        if (isMatch) {
          if (!usage.htmlFiles.includes(htmlFile)) {
            usage.htmlFiles.push(htmlFile);
            usage.totalCount++;
          }
          // 디버깅: 첫 번째 매칭 출력
          if (usage.totalCount === 1) {
            console.log(`    ✅ 매칭 발견: ${image.filename}`);
            console.log(`       HTML 경로: ${imagePath}`);
            console.log(`       DB 경로: ${image.file_path}`);
            console.log(`       DB 파일명: ${image.filename}`);
          }
        }
      }
    }

    // 블로그 본문에서 사용 확인
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('id, title, content')
      .not('content', 'is', null);

    if (blogPosts) {
      for (const post of blogPosts) {
        if (!post.content) continue;
        
        const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        
        let match;
        while ((match = markdownImageRegex.exec(post.content)) !== null) {
          if (matchesImage(match[2], image.file_path, image.filename)) {
            usage.blogPosts.push({ id: post.id, title: post.title });
            usage.totalCount++;
          }
        }
        
        while ((match = htmlImageRegex.exec(post.content)) !== null) {
          if (matchesImage(match[1], image.file_path, image.filename)) {
            if (!usage.blogPosts.find(p => p.id === post.id)) {
              usage.blogPosts.push({ id: post.id, title: post.title });
              usage.totalCount++;
            }
          }
        }
      }
    }

    if (usage.totalCount > 0 || usage.htmlFiles.length > 0 || usage.blogPosts.length > 0) {
      usageResults.push(usage);
    }
  }

  console.log(`\n✅ 사용 중인 이미지: ${usageResults.length}개`);
  console.log(`⚠️  미사용 이미지: ${dbImages.length - usageResults.length}개`);

  // 4. 사용 중인 이미지 상세 정보 출력
  if (usageResults.length > 0) {
    console.log('\n📋 사용 중인 이미지 상세:');
    usageResults.slice(0, 10).forEach((usage, index) => {
      console.log(`\n  ${index + 1}. ${usage.image.filename}`);
      console.log(`     파일 경로: ${usage.image.file_path}`);
      console.log(`     DB 사용 횟수: ${usage.image.db_usage_count}`);
      console.log(`     실제 사용 횟수: ${usage.totalCount}`);
      console.log(`     HTML 파일: ${usage.htmlFiles.length}개 (${usage.htmlFiles.join(', ')})`);
      console.log(`     블로그: ${usage.blogPosts.length}개`);
      if (usage.image.db_usage_count !== usage.totalCount) {
        console.log(`     ⚠️  불일치: DB=${usage.image.db_usage_count}, 실제=${usage.totalCount}`);
      }
    });
  }

  // 5. Playwright로 갤러리에서 사용 횟수 확인
  console.log('\n🎭 4단계: Playwright로 갤러리에서 사용 횟수 확인');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 로그인
    await page.goto(`${BASE_URL}/admin/gallery`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/login')) {
      console.log('  로그인 중...');
      await page.waitForSelector('input#login', { timeout: 15000 });
      await page.fill('input#login', ADMIN_LOGIN);
      await page.fill('input#password', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      const afterLoginUrl = page.url();
      if (!afterLoginUrl.includes('/admin/gallery')) {
        await page.goto(`${BASE_URL}/admin/gallery`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);
      }
    }

    // originals/campaigns/2025-05 폴더 선택
    console.log('  originals/campaigns/2025-05 폴더 선택 중...');
    await page.waitForTimeout(2000);
    
    // 폴더 트리에서 originals 확장
    const originalsText = page.locator('text=/originals/i').first();
    if (await originalsText.count() > 0) {
      const originalsFolder = originalsText.locator('xpath=ancestor::div[contains(@class, "cursor-pointer")]').first();
      if (await originalsFolder.count() > 0) {
        const expandButton = originalsFolder.locator('button').first();
        if (await expandButton.count() > 0) {
          const buttonText = await expandButton.textContent().catch(() => '');
          if (buttonText?.trim() === '▶' || buttonText?.trim() === '') {
            await expandButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }
    
    // campaigns 폴더 확장
    await page.waitForTimeout(1000);
    const campaignsText = page.locator('text=/campaigns/i').first();
    if (await campaignsText.count() > 0) {
      const campaignsFolder = campaignsText.locator('xpath=ancestor::div[contains(@class, "cursor-pointer")]').first();
      if (await campaignsFolder.count() > 0) {
        const expandButton = campaignsFolder.locator('button').first();
        if (await expandButton.count() > 0) {
          const buttonText = await expandButton.textContent().catch(() => '');
          if (buttonText?.trim() === '▶' || buttonText?.trim() === '') {
            await expandButton.click();
            await page.waitForTimeout(1000);
          }
        }
        await campaignsFolder.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // 2025-05 폴더 선택
    await page.waitForTimeout(1000);
    const folder202505Text = page.locator('text=/2025-05/i').first();
    if (await folder202505Text.count() > 0) {
      const folder202505 = folder202505Text.locator('xpath=ancestor::div[contains(@class, "cursor-pointer")]').first();
      if (await folder202505.count() > 0) {
        await folder202505.click();
        await page.waitForTimeout(3000);
      }
    }

    // 이미지 카드에서 사용 횟수 확인
    console.log('  이미지 사용 횟수 확인 중...');
    await page.waitForTimeout(2000);
    
    const imageCards = await page.locator('div[class*="group"]:has(img), div[class*="card"]:has(img)').all();
    console.log(`  발견된 이미지 카드: ${imageCards.length}개`);
    
    const galleryUsageResults = [];
    for (let i = 0; i < Math.min(imageCards.length, 20); i++) {
      const card = imageCards[i];
      const usageText = await card.locator('text=/\\d+회 사용/').textContent().catch(() => '0회 사용');
      const filenameText = await card.locator('text=/originals\\/cam/').textContent().catch(() => '');
      
      const usageMatch = usageText.match(/(\d+)회 사용/);
      const usageCount = usageMatch ? parseInt(usageMatch[1]) : 0;
      
      if (filenameText) {
        galleryUsageResults.push({
          filename: filenameText,
          usageCount,
        });
      }
    }

    console.log('\n📊 갤러리에서 확인된 사용 횟수:');
    galleryUsageResults.slice(0, 10).forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.filename}: ${result.usageCount}회`);
    });

    // DB와 갤러리 비교
    console.log('\n🔍 DB와 갤러리 사용 횟수 비교:');
    usageResults.slice(0, 10).forEach((usage, index) => {
      const galleryResult = galleryUsageResults.find(r => 
        usage.image.filename.includes(r.filename) || r.filename.includes(usage.image.filename)
      );
      
      if (galleryResult) {
        console.log(`  ${index + 1}. ${usage.image.filename}`);
        console.log(`     DB: ${usage.image.db_usage_count}회, 실제: ${usage.totalCount}회, 갤러리: ${galleryResult.usageCount}회`);
        if (usage.totalCount > 0 && galleryResult.usageCount === 0) {
          console.log(`     ⚠️  문제: 실제로는 사용 중이지만 갤러리에서 0회로 표시됨`);
        }
      }
    });

    // 스크린샷
    const screenshotPath = path.join(process.cwd(), 'docs', 'e2e-tests', `image-usage-count-test-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 스크린샷 저장: ${screenshotPath}`);

    console.log('\n💡 브라우저를 열어두었습니다. 수동으로 확인하세요.');
    await page.waitForTimeout(300000); // 5분 대기

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testImageUsageCount();
}

module.exports = { testImageUsageCount };








