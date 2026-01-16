// Playwright로 이미지 삭제 테스트 (상세 디버깅)
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const STORAGE_BUCKET = 'blog-images';

(async () => {
  console.log('🧪 이미지 삭제 테스트 (상세 디버깅) 시작...\n');

  // 테스트 이미지 정보 로드
  const testInfoPath = path.join(__dirname, 'test-image-info.json');
  let testImageInfo = null;

  if (fs.existsSync(testInfoPath)) {
    const testInfoContent = fs.readFileSync(testInfoPath, 'utf-8');
    testImageInfo = JSON.parse(testInfoContent);
    console.log('📋 테스트 이미지 정보 로드:');
    console.log(`   - 파일명: ${testImageInfo.fileName}`);
    console.log(`   - 경로: ${testImageInfo.filePath}`);
    console.log(`   - URL: ${testImageInfo.publicUrl?.substring(0, 80)}...`);
    console.log(`   - 메타데이터 ID: ${testImageInfo.metadataId || '없음'}\n`);
  } else {
    console.log('⚠️ 테스트 이미지 정보 파일이 없습니다.');
    console.log('💡 먼저 create-test-image-for-delete.js를 실행하세요.\n');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 콘솔 로그 캡처
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      console.error(`   🔴 콘솔 에러: ${text}`);
    } else if (text.includes('삭제') || text.includes('delete') || text.includes('API')) {
      console.log(`   📝 콘솔 로그: ${text.substring(0, 150)}`);
    }
  });

  try {
    // 1. 로그인
    console.log('1️⃣ 로그인...');
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForTimeout(2000);

    const loginForm = await page.locator('form').first();
    if (await loginForm.isVisible({ timeout: 5000 })) {
      console.log('   ✅ 로그인 폼 발견');
      await page.fill('input[name="email"], input[type="text"]', '010-6669-9000');
      await page.fill('input[name="password"], input[type="password"]', '66699000');
      await page.click('button[type="submit"], button:has-text("로그인")');
      await page.waitForTimeout(3000);
      console.log('   ✅ 로그인 완료\n');
    } else {
      throw new Error('로그인 폼을 찾을 수 없습니다.');
    }

    // 2. 삭제 전 상태 확인 (Storage, DB)
    console.log('2️⃣ 삭제 전 상태 확인...');
    
    // Storage 확인
    const { data: storageFilesBefore, error: storageErrorBefore } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('originals/test-delete', { limit: 100 });
    
    const fileExistsBefore = storageFilesBefore?.some(f => f.name === testImageInfo.fileName);
    console.log(`   📦 Storage 파일 존재: ${fileExistsBefore ? '✅ 있음' : '❌ 없음'}`);
    if (storageFilesBefore) {
      console.log(`   📦 Storage 파일 개수: ${storageFilesBefore.length}개`);
    }

    // image_assets 확인
    const { data: assetsBefore, error: assetsErrorBefore } = await supabase
      .from('image_assets')
      .select('id, file_path, filename, cdn_url')
      .ilike('file_path', `%${testImageInfo.fileName}%`);
    
    console.log(`   💾 image_assets 레코드: ${assetsBefore?.length || 0}개`);
    if (assetsBefore && assetsBefore.length > 0) {
      console.log(`   💾 image_assets ID: ${assetsBefore[0].id}`);
    }

    // image_metadata 확인
    const { data: metadataBefore, error: metadataErrorBefore } = await supabase
      .from('image_metadata')
      .select('id, image_url, folder_path, file_path')
      .or(`image_url.eq.${testImageInfo.publicUrl},folder_path.ilike.%test-delete%`);
    
    console.log(`   📋 image_metadata 레코드: ${metadataBefore?.length || 0}개`);
    if (metadataBefore && metadataBefore.length > 0) {
      console.log(`   📋 image_metadata ID: ${metadataBefore.map(m => m.id).join(', ')}`);
    }

    // 3. 갤러리 관리 페이지 접속
    console.log('\n3️⃣ 갤러리 관리 페이지 접속...');
    await page.goto('http://localhost:3000/admin/gallery');
    await page.waitForTimeout(3000);
    console.log('   ✅ 갤러리 관리 페이지 로드 완료\n');

    // 4. 테스트 이미지 검색
    console.log('4️⃣ 테스트 이미지 검색...');
    await page.waitForTimeout(2000);

    // 검색창에 파일명 입력
    const searchInput = page.locator('input[type="text"][placeholder*="검색"], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill(testImageInfo.fileName);
      await page.waitForTimeout(2000);
      console.log(`   ✅ 검색어 입력: ${testImageInfo.fileName}`);
    }

    await page.waitForTimeout(3000);

    // 5. API로 이미지 ID 찾기
    console.log('\n5️⃣ API로 이미지 ID 찾기...');
    
    const imageInfo = await page.evaluate(async ({ imageUrl, fileName }) => {
      console.log('🔍 API로 이미지 검색 시작...');
      const response = await fetch(`/api/admin/all-images?limit=1000&prefix=originals/test-delete&forceRefresh=true&_t=${Date.now()}`);
      const data = await response.json();
      console.log('📊 API 응답:', { total: data.total, imagesCount: data.images?.length });
      
      const found = (data.images || []).find(img => 
        img.name === fileName || img.url === imageUrl
      );
      
      if (found) {
        console.log('✅ 이미지 발견:', { id: found.id, name: found.name, url: found.url?.substring(0, 80) });
      } else {
        console.log('❌ 이미지를 찾을 수 없음');
      }
      
      return {
        found: found || null,
        total: data.total,
        allImages: (data.images || []).map(img => ({ id: img.id, name: img.name }))
      };
    }, { imageUrl: testImageInfo.publicUrl, fileName: testImageInfo.fileName });

    if (!imageInfo.found) {
      throw new Error(`테스트 이미지를 찾을 수 없습니다: ${testImageInfo.fileName}`);
    }

    const imageId = imageInfo.found.id;
    console.log(`   ✅ 이미지 발견: ${imageInfo.found.name} (ID: ${imageId})`);

    // 6. 삭제 실행
    console.log('\n6️⃣ 이미지 삭제 실행...');
    
    const deleteResult = await page.evaluate(async (imageId) => {
      console.log('🗑️ 삭제 API 호출 시작...', { imageId });
      
      const response = await fetch('/api/admin/image-asset-manager', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: imageId, permanent: true })
      });

      console.log('📡 API 응답 상태:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📦 API 응답 데이터:', data);
      
      return { ok: response.ok, status: response.status, data };
    }, imageId);

    console.log('   📊 삭제 API 응답:');
    console.log(`      - 성공: ${deleteResult.ok ? '✅' : '❌'}`);
    console.log(`      - 상태: ${deleteResult.status}`);
    console.log(`      - 메시지: ${deleteResult.data.message || '없음'}`);
    console.log(`      - Storage 삭제: ${deleteResult.data.storageDeleted ? '✅' : '❌'}`);
    console.log(`      - DB 삭제 행 수: ${deleteResult.data.deletedRows || 0}`);
    console.log(`      - 메타데이터 삭제: ${deleteResult.data.metadataDeleted ? '✅' : '❌'}`);
    if (deleteResult.data.warnings && deleteResult.data.warnings.length > 0) {
      console.log(`      - 경고: ${deleteResult.data.warnings.join(', ')}`);
    }

    // 7. 삭제 후 상태 확인 (즉시)
    console.log('\n7️⃣ 삭제 후 즉시 상태 확인...');
    await page.waitForTimeout(2000);

    // Storage 확인
    const { data: storageFilesAfter, error: storageErrorAfter } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('originals/test-delete', { limit: 100 });
    
    const fileExistsAfter = storageFilesAfter?.some(f => f.name === testImageInfo.fileName);
    console.log(`   📦 Storage 파일 존재: ${fileExistsAfter ? '❌ 여전히 있음' : '✅ 삭제됨'}`);
    if (storageFilesAfter) {
      console.log(`   📦 Storage 파일 개수: ${storageFilesAfter.length}개 (이전: ${storageFilesBefore?.length || 0}개)`);
    }

    // image_assets 확인
    const { data: assetsAfter, error: assetsErrorAfter } = await supabase
      .from('image_assets')
      .select('id, file_path, filename, cdn_url')
      .ilike('file_path', `%${testImageInfo.fileName}%`);
    
    console.log(`   💾 image_assets 레코드: ${assetsAfter?.length || 0}개 (이전: ${assetsBefore?.length || 0}개)`);
    if (assetsAfter && assetsAfter.length > 0) {
      console.log(`   ⚠️ image_assets에 여전히 존재: ${assetsAfter.map(a => a.id).join(', ')}`);
    }

    // image_metadata 확인
    const { data: metadataAfter, error: metadataErrorAfter } = await supabase
      .from('image_metadata')
      .select('id, image_url, folder_path, file_path')
      .or(`image_url.eq.${testImageInfo.publicUrl},folder_path.ilike.%test-delete%`);
    
    console.log(`   📋 image_metadata 레코드: ${metadataAfter?.length || 0}개 (이전: ${metadataBefore?.length || 0}개)`);
    if (metadataAfter && metadataAfter.length > 0) {
      console.log(`   ⚠️ image_metadata에 여전히 존재: ${metadataAfter.map(m => m.id).join(', ')}`);
    }

    // 8. API로 삭제 확인 (여러 번 시도)
    console.log('\n8️⃣ API로 삭제 확인 (여러 번 시도)...');
    
    for (let attempt = 1; attempt <= 5; attempt++) {
      console.log(`   🔄 시도 ${attempt}/5...`);
      await page.waitForTimeout(2000);
      
      const apiCheck = await page.evaluate(async ({ imageUrl, fileName, attemptNum }) => {
        console.log(`🔍 API 확인 시도 ${attemptNum}...`);
        const response = await fetch(`/api/admin/all-images?limit=1000&prefix=originals/test-delete&forceRefresh=true&_t=${Date.now()}`);
        const data = await response.json();
        console.log(`📊 API 응답 (시도 ${attemptNum}):`, { total: data.total, imagesCount: data.images?.length });
        
        const found = (data.images || []).find(img => 
          img.name === fileName || img.url === imageUrl
        );
        
        return {
          total: data.total,
          found: found !== undefined,
          image: found
        };
      }, { imageUrl: testImageInfo.publicUrl, fileName: testImageInfo.fileName, attemptNum: attempt });
      
      console.log(`      - 총 이미지: ${apiCheck.total}개`);
      console.log(`      - 테스트 이미지 발견: ${apiCheck.found ? '❌ 여전히 있음' : '✅ 제거됨'}`);
      
      if (!apiCheck.found) {
        console.log(`   ✅ 삭제 확인 성공 (시도 ${attempt})`);
        break;
      }
      
      if (attempt === 5) {
        console.log(`   ⚠️ 5번 시도 후에도 API 응답에 포함됨 (캐시 문제일 수 있음)`);
      }
    }

    // 9. 최종 상태 확인 (10초 후)
    console.log('\n9️⃣ 최종 상태 확인 (10초 대기 후)...');
    await page.waitForTimeout(10000);

    // Storage 최종 확인
    const { data: storageFilesFinal, error: storageErrorFinal } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('originals/test-delete', { limit: 100 });
    
    const fileExistsFinal = storageFilesFinal?.some(f => f.name === testImageInfo.fileName);
    console.log(`   📦 Storage 파일 최종 확인: ${fileExistsFinal ? '❌ 여전히 있음' : '✅ 삭제됨'}`);

    // image_assets 최종 확인
    const { data: assetsFinal, error: assetsErrorFinal } = await supabase
      .from('image_assets')
      .select('id, file_path, filename, cdn_url')
      .ilike('file_path', `%${testImageInfo.fileName}%`);
    
    console.log(`   💾 image_assets 최종 확인: ${assetsFinal?.length || 0}개 레코드`);

    // image_metadata 최종 확인
    const { data: metadataFinal, error: metadataErrorFinal } = await supabase
      .from('image_metadata')
      .select('id, image_url, folder_path, file_path')
      .or(`image_url.eq.${testImageInfo.publicUrl},folder_path.ilike.%test-delete%`);
    
    console.log(`   📋 image_metadata 최종 확인: ${metadataFinal?.length || 0}개 레코드`);

    // 최종 스크린샷
    await page.screenshot({ path: 'test-delete-debug-final.png', fullPage: true });
    console.log('\n   📸 최종 스크린샷 저장: test-delete-debug-final.png');

    // 콘솔 로그 저장
    const logsPath = path.join(__dirname, 'test-delete-console-logs.json');
    fs.writeFileSync(logsPath, JSON.stringify(consoleLogs, null, 2));
    console.log(`   💾 콘솔 로그 저장: ${logsPath}`);

    console.log('\n✅ 이미지 삭제 테스트 (상세 디버깅) 완료!');
    console.log('\n📋 최종 결과 요약:');
    console.log(`   - Storage 삭제: ${!fileExistsFinal ? '✅' : '❌'}`);
    console.log(`   - image_assets 삭제: ${(assetsFinal?.length || 0) === 0 ? '✅' : '❌'}`);
    console.log(`   - image_metadata 삭제: ${(metadataFinal?.length || 0) === 0 ? '✅' : '❌'}`);
    console.log(`   - API 응답에서 제외: ${!apiCheck.found ? '✅' : '❌ (캐시 문제 가능)'}`);

  } catch (error) {
    console.error(`\n❌ 테스트 실패: ${error.message}`);
    await page.screenshot({ path: 'test-delete-debug-failure.png', fullPage: true });
    console.log('   📸 실패 스크린샷 저장: test-delete-debug-failure.png');
    
    // 콘솔 로그 저장
    const logsPath = path.join(__dirname, 'test-delete-console-logs.json');
    fs.writeFileSync(logsPath, JSON.stringify(consoleLogs, null, 2));
    console.log(`   💾 콘솔 로그 저장: ${logsPath}`);
    
    throw error;
  } finally {
    await page.close();
    await browser.close();
  }
})();
