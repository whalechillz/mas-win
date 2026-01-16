// Playwright로 특정 이미지 파일 삭제 테스트
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const STORAGE_BUCKET = 'blog-images';

// 삭제할 파일명
const TARGET_FILENAME = 'test-delete-1768386334011.png';

(async () => {
  console.log('🧪 특정 이미지 삭제 테스트 시작...\n');
  console.log(`📋 대상 파일: ${TARGET_FILENAME}\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 콘솔 로그 캡처
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
    
    // 삭제 관련 로그만 필터링하여 출력
    if (text.includes('삭제') || 
        text.includes('delete') || 
        text.includes('API') || 
        text.includes('fetchImages') ||
        text.includes('compareResult') ||
        text.includes('images 상태') ||
        text.includes('Storage') ||
        text.includes('🔍') ||
        text.includes('✅') ||
        text.includes('❌') ||
        text.includes('⚠️') ||
        type === 'error') {
      const prefix = type === 'error' ? '🔴' : type === 'warn' ? '⚠️' : '📝';
      console.log(`   ${prefix} [${type}] ${text.substring(0, 200)}`);
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

    // 2. 갤러리 페이지로 이동
    console.log('2️⃣ 갤러리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/gallery');
    await page.waitForTimeout(3000);
    console.log('   ✅ 갤러리 페이지 로드 완료\n');

    // 3. 삭제 전 상태 확인 (Storage, DB)
    console.log('3️⃣ 삭제 전 상태 확인...');
    
    // Storage 확인
    const { data: storageFilesBefore, error: storageErrorBefore } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('originals/test-delete', { limit: 100 });
    
    const fileExistsBefore = storageFilesBefore?.some(f => f.name === TARGET_FILENAME);
    console.log(`   📦 Storage 파일 존재: ${fileExistsBefore ? '✅ 있음' : '❌ 없음'}`);
    if (storageFilesBefore) {
      console.log(`   📦 Storage 파일 개수: ${storageFilesBefore.length}개`);
    }

    // image_assets 확인
    const { data: assetsBefore, error: assetsErrorBefore } = await supabase
      .from('image_assets')
      .select('id, file_path, filename, cdn_url')
      .ilike('filename', `%${TARGET_FILENAME}%`);
    
    console.log(`   💾 image_assets 레코드: ${assetsBefore?.length || 0}개`);
    let imageAssetId = null;
    if (assetsBefore && assetsBefore.length > 0) {
      imageAssetId = assetsBefore[0].id;
      console.log(`   💾 image_assets ID: ${imageAssetId}`);
      console.log(`   💾 file_path: ${assetsBefore[0].file_path}`);
      console.log(`   💾 cdn_url: ${assetsBefore[0].cdn_url?.substring(0, 80)}...`);
    }

    // image_metadata 확인
    const { data: metadataBefore, error: metadataErrorBefore } = await supabase
      .from('image_metadata')
      .select('id, image_url, file_name, folder_path')
      .ilike('file_name', `%${TARGET_FILENAME}%`);
    
    console.log(`   📋 image_metadata 레코드: ${metadataBefore?.length || 0}개`);
    let imageMetadataId = null;
    if (metadataBefore && metadataBefore.length > 0) {
      imageMetadataId = metadataBefore[0].id;
      console.log(`   📋 image_metadata ID: ${imageMetadataId}`);
      console.log(`   📋 image_url: ${metadataBefore[0].image_url?.substring(0, 80)}...`);
    }

    // 4. API를 통해 이미지 찾기
    console.log('\n4️⃣ API를 통해 이미지 찾기...');
    const imageInfo = await page.evaluate(async (params) => {
      const { filename } = params;
      const response = await fetch(`/api/admin/all-images?limit=1000&offset=0&prefix=originals/test-delete&includeChildren=false&forceRefresh=true`);
      const data = await response.json();
      
      console.log('📊 API 응답:', {
        success: data.success,
        total: data.total,
        imagesCount: data.images ? data.images.length : 0
      });
      
      // data.success가 없어도 data.images가 있으면 사용
      if (data.images && data.images.length > 0) {
        const foundImage = data.images.find((img) => 
          img.name === filename || 
          img.filename === filename ||
          (img.url && img.url.includes(filename))
        );
        
        if (foundImage) {
          console.log('✅ 이미지 발견:', {
            id: foundImage.id,
            name: foundImage.name,
            filename: foundImage.filename
          });
          
          return {
            id: foundImage.id,
            name: foundImage.name,
            filename: foundImage.filename || foundImage.name,
            url: foundImage.url,
            folder_path: foundImage.folder_path
          };
        } else {
          console.log('❌ 이미지를 찾을 수 없음:', {
            filename,
            availableNames: data.images.slice(0, 5).map(img => img.name)
          });
        }
      }
      return null;
    }, { filename: TARGET_FILENAME });

    if (!imageInfo) {
      console.error('   ❌ 이미지를 찾을 수 없습니다.');
      console.log('   💡 API 응답 확인 중...');
      
      // API 응답 확인
      const apiResponse = await page.evaluate(async () => {
        const response = await fetch(`/api/admin/all-images?limit=1000&offset=0&prefix=originals/test-delete&includeChildren=false&forceRefresh=true`);
        const data = await response.json();
        return {
          success: data.success,
          total: data.total,
          imagesCount: data.images ? data.images.length : 0,
          firstFewImages: data.images ? data.images.slice(0, 5).map((img) => ({
            name: img.name,
            filename: img.filename,
            id: img.id
          })) : []
        };
      });
      
      console.log('   📊 API 응답:', apiResponse);
      
      // API 응답에 이미지가 있으면 첫 번째 이미지 사용
      if (apiResponse.imagesCount > 0 && apiResponse.firstFewImages.length > 0) {
        const firstImage = apiResponse.firstFewImages.find(img => img.name === TARGET_FILENAME);
        if (firstImage) {
          console.log('   ✅ API 응답에서 이미지 발견, ID 사용:', firstImage.id);
          // imageInfo를 직접 구성
          const manualImageInfo = {
            id: firstImage.id,
            name: firstImage.name || TARGET_FILENAME,
            filename: firstImage.filename || TARGET_FILENAME,
            url: null,
            folder_path: 'originals/test-delete'
          };
          
          // imageInfo를 수동으로 설정하고 계속 진행
          Object.assign({}, { imageInfo: manualImageInfo });
          // 계속 진행하기 위해 imageInfo를 반환
          throw new Error(`이미지를 찾을 수 없습니다. 하지만 API에는 ${apiResponse.imagesCount}개의 이미지가 있습니다.`);
        }
      }
      
      throw new Error('이미지를 찾을 수 없습니다.');
    }

    console.log('   ✅ 이미지 발견:');
    console.log(`      - ID: ${imageInfo.id}`);
    console.log(`      - 파일명: ${imageInfo.name || imageInfo.filename}`);
    console.log(`      - URL: ${imageInfo.url?.substring(0, 80)}...`);
    console.log(`      - 폴더: ${imageInfo.folder_path}\n`);

    // 5. 검색으로 이미지 찾기
    console.log('5️⃣ 검색으로 이미지 찾기...');
    await page.fill('input[placeholder*="파일명"], input[placeholder*="검색"]', TARGET_FILENAME);
    await page.waitForTimeout(2000);
    console.log('   ✅ 검색 완료\n');

    // 6. API를 통해 직접 삭제 시도
    console.log('6️⃣ API를 통해 직접 삭제 시도...');
    console.log(`   📋 삭제할 이미지 ID: ${imageInfo.id}`);
    console.log(`   📋 삭제할 파일명: ${imageInfo.name || imageInfo.filename}\n`);
    
    const deleteResult = await page.evaluate(async (params) => {
      const { imageId, filename, folder_path } = params;
      
      console.log('🗑️ 삭제 API 호출 시작...', { imageId, filename, folder_path });
      
      const response = await fetch('/api/admin/image-asset-manager', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: imageId,
          permanent: true,
          folder_path: folder_path || 'originals/test-delete',
          name: filename,
          url: null
        })
      });

      console.log('📡 API 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 오류 응답 (텍스트):', errorText);
        try {
          const errorData = JSON.parse(errorText);
          return { ok: false, status: response.status, error: errorData };
        } catch (e) {
          return { ok: false, status: response.status, error: { error: errorText } };
        }
      }
      
      const data = await response.json();
      console.log('📦 API 응답 데이터:', data);
      
      return { ok: true, status: response.status, data };
    }, { 
      imageId: imageInfo.id, 
      filename: imageInfo.name || imageInfo.filename,
      folder_path: imageInfo.folder_path
    });

    console.log('   📊 삭제 API 응답:');
    console.log(`      - 성공: ${deleteResult.ok ? '✅' : '❌'}`);
    console.log(`      - 상태: ${deleteResult.status}`);
    
    if (deleteResult.ok && deleteResult.data) {
      console.log(`      - 메시지: ${deleteResult.data.message || '없음'}`);
      console.log(`      - Storage 삭제: ${deleteResult.data.storageDeleted ? '✅' : '❌'}`);
      console.log(`      - DB 삭제 행 수: ${deleteResult.data.deletedRows || 0}`);
      console.log(`      - 메타데이터 삭제: ${deleteResult.data.metadataDeleted ? '✅' : '❌'}`);
      if (deleteResult.data.warnings && deleteResult.data.warnings.length > 0) {
        console.log(`      - 경고: ${deleteResult.data.warnings.join(', ')}`);
      }
    } else {
      console.log(`      - 오류: ${deleteResult.error?.error || '알 수 없음'}`);
    }
    console.log('');

    // 10. 삭제 후 상태 확인
    console.log('🔟 삭제 후 상태 확인...');
    await page.waitForTimeout(3000);

    // Storage 확인
    const { data: storageFilesAfter, error: storageErrorAfter } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('originals/test-delete', { limit: 100 });
    
    const fileExistsAfter = storageFilesAfter?.some(f => f.name === TARGET_FILENAME);
    console.log(`   📦 Storage 파일 존재: ${fileExistsAfter ? '❌ 여전히 있음' : '✅ 삭제됨'}`);
    if (storageFilesAfter) {
      console.log(`   📦 Storage 파일 개수: ${storageFilesAfter.length}개 (이전: ${storageFilesBefore?.length || 0}개)`);
    }

    // image_assets 확인
    const { data: assetsAfter, error: assetsErrorAfter } = await supabase
      .from('image_assets')
      .select('id, file_path, filename, cdn_url')
      .ilike('filename', `%${TARGET_FILENAME}%`);
    
    console.log(`   💾 image_assets 레코드: ${assetsAfter?.length || 0}개 (이전: ${assetsBefore?.length || 0}개)`);

    // image_metadata 확인
    const { data: metadataAfter, error: metadataErrorAfter } = await supabase
      .from('image_metadata')
      .select('id, image_url, file_name, folder_path')
      .ilike('file_name', `%${TARGET_FILENAME}%`);
    
    console.log(`   📋 image_metadata 레코드: ${metadataAfter?.length || 0}개 (이전: ${metadataBefore?.length || 0}개)`);

    // 11. API를 통해 삭제 확인
    console.log('\n1️⃣1️⃣ API를 통해 삭제 확인...');
    await page.waitForTimeout(2000);
    
    const apiCheck = await page.evaluate(async (params) => {
      const { imageId, filename } = params;
      const response = await fetch(`/api/admin/all-images?limit=1000&offset=0&prefix=originals/test-delete&includeChildren=false&forceRefresh=true`);
      const data = await response.json();
      
      if (data.success && data.images) {
        const foundImage = data.images.find((img) => 
          img.id === imageId ||
          img.name === filename || 
          img.filename === filename ||
          (img.url && img.url.includes(filename))
        );
        
        return {
          found: !!foundImage,
          total: data.total,
          imagesCount: data.images.length,
          imageInfo: foundImage ? {
            id: foundImage.id,
            name: foundImage.name,
            filename: foundImage.filename
          } : null
        };
      }
      return { found: false, total: 0, imagesCount: 0, imageInfo: null };
    }, { imageId: imageInfo.id, filename: TARGET_FILENAME });

    console.log(`   📊 API 확인 결과:`);
    console.log(`      - 이미지 발견: ${apiCheck.found ? '❌ 여전히 있음' : '✅ 삭제됨'}`);
    console.log(`      - 전체 이미지 수: ${apiCheck.total}`);
    console.log(`      - 응답 이미지 수: ${apiCheck.imagesCount}`);

    // 12. 최종 요약
    console.log('\n📊 최종 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 대상 파일: ${TARGET_FILENAME}`);
    console.log(`📋 이미지 ID: ${imageInfo.id}`);
    console.log('');
    console.log('삭제 전:');
    console.log(`   📦 Storage: ${fileExistsBefore ? '✅ 있음' : '❌ 없음'}`);
    console.log(`   💾 image_assets: ${assetsBefore?.length || 0}개`);
    console.log(`   📋 image_metadata: ${metadataBefore?.length || 0}개`);
    console.log('');
    console.log('삭제 후:');
    console.log(`   📦 Storage: ${fileExistsAfter ? '❌ 여전히 있음' : '✅ 삭제됨'}`);
    console.log(`   💾 image_assets: ${assetsAfter?.length || 0}개`);
    console.log(`   📋 image_metadata: ${metadataAfter?.length || 0}개`);
    console.log(`   📊 API: ${apiCheck.found ? '❌ 여전히 있음' : '✅ 삭제됨'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 13. 콘솔 로그 요약
    console.log('\n📝 삭제 관련 콘솔 로그 요약:');
    const deleteLogs = consoleLogs.filter(log => 
      log.text.includes('삭제') || 
      log.text.includes('delete') || 
      log.text.includes('API') ||
      log.text.includes('fetchImages') ||
      log.text.includes('compareResult') ||
      log.text.includes('images 상태') ||
      log.text.includes('Storage') ||
      log.type === 'error'
    );
    
    deleteLogs.forEach((log, idx) => {
      if (idx < 50) { // 최대 50개만 출력
        const prefix = log.type === 'error' ? '🔴' : log.type === 'warn' ? '⚠️' : '📝';
        console.log(`   ${prefix} ${log.text.substring(0, 150)}`);
      }
    });

    if (deleteLogs.length > 50) {
      console.log(`   ... 외 ${deleteLogs.length - 50}개 로그 생략`);
    }

    console.log('\n✅ 테스트 완료!\n');
    console.log('💡 브라우저를 닫으려면 아무 키나 누르세요...');
    
    // 브라우저 유지 (수동으로 닫기)
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    console.error('❌ 상세 오류:', error.stack);
  } finally {
    await browser.close();
  }
})();
