/**
 * Playwright 스크린샷 기반 고화질 이미지 마이그레이션 API
 * Wix 이미지를 Playwright로 고화질 캡처하고 WebP로 최적화해서 Supabase Storage에 저장
 */

import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { convertWixToHighQuality, extractWixFileName } from '../../lib/wix-image-utils.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Playwright로 고화질 스크린샷 캡처
 * @param {object} page - Playwright 페이지 객체
 * @param {string} imageUrl - 이미지 URL
 * @param {string} imageName - 이미지 이름
 * @returns {Buffer} 스크린샷 버퍼
 */
async function captureHighQualityScreenshot(page, imageUrl, imageName) {
  try {
    console.log(`📸 ${imageName} 고화질 캡처 시작...`);
    
    // 고화질 URL로 변환
    const highQualityUrl = convertWixToHighQuality(imageUrl);
    console.log(`🔗 고화질 URL: ${highQualityUrl}`);
    
    // 이미지 요소로 이동
    await page.goto(highQualityUrl, { waitUntil: 'networkidle' });
    
    // 고화질 스크린샷 캡처
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true,
      quality: 100
    });
    
    console.log(`✅ ${imageName} 고화질 캡처 완료 (${screenshot.length} bytes)`);
    return screenshot;
    
  } catch (error) {
    console.error(`❌ ${imageName} 캡처 실패:`, error.message);
    throw error;
  }
}

/**
 * Sharp로 WebP 최적화
 * @param {Buffer} imageBuffer - 원본 이미지 버퍼
 * @param {string} imageName - 이미지 이름
 * @returns {Buffer} 최적화된 WebP 버퍼
 */
async function optimizeToWebP(imageBuffer, imageName) {
  try {
    console.log(`🎨 ${imageName} WebP 최적화 시작...`);
    
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(1200, 1200, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ 
        quality: 90,
        effort: 6 
      })
      .toBuffer();
    
    console.log(`✅ ${imageName} WebP 최적화 완료 (${optimizedBuffer.length} bytes)`);
    return optimizedBuffer;
    
  } catch (error) {
    console.error(`❌ ${imageName} WebP 최적화 실패:`, error.message);
    throw error;
  }
}

/**
 * Supabase Storage에 저장
 * @param {Buffer} imageBuffer - 이미지 버퍼
 * @param {string} fileName - 파일명
 * @param {string} imageName - 이미지 이름
 * @returns {string} 공개 URL
 */
async function saveToSupabase(imageBuffer, fileName, imageName) {
  try {
    console.log(`💾 ${imageName} Supabase Storage 저장 시작...`);
    
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600'
      });
    
    if (error) throw error;
    
    const { data: publicUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);
    
    console.log(`✅ ${imageName} Supabase Storage 저장 완료: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
    
  } catch (error) {
    console.error(`❌ ${imageName} Supabase Storage 저장 실패:`, error.message);
    throw error;
  }
}

/**
 * 단일 이미지 마이그레이션
 * @param {object} page - Playwright 페이지 객체
 * @param {object} imageData - 이미지 데이터
 * @returns {object} 마이그레이션 결과
 */
async function migrateSingleImage(page, imageData) {
  const { name, url, type } = imageData;
  
  try {
    console.log(`\n📸 ${name} 처리 중...`);
    
    // 1. 고화질 스크린샷 캡처
    const screenshot = await captureHighQualityScreenshot(page, url, name);
    
    // 2. WebP 최적화
    const optimizedBuffer = await optimizeToWebP(screenshot, name);
    
    // 3. 파일명 생성
    const timestamp = Date.now();
    const baseFileName = extractWixFileName(url);
    const fileName = `kang-seok-${type}-${baseFileName}-${timestamp}.webp`;
    
    // 4. Supabase Storage에 저장
    const publicUrl = await saveToSupabase(optimizedBuffer, fileName, name);
    
    // 5. 결과 반환
    return {
      name,
      type,
      originalUrl: url,
      highQualityUrl: convertWixToHighQuality(url),
      storedUrl: publicUrl,
      fileName,
      success: true
    };
    
  } catch (error) {
    console.error(`❌ ${name} 마이그레이션 실패:`, error.message);
    
    return {
      name,
      type,
      originalUrl: url,
      error: error.message,
      success: false
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { images } = req.body;
    
    if (!images || !Array.isArray(images)) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    console.log('🚀 Playwright 스크린샷 기반 고화질 이미지 마이그레이션 시작...');
    console.log(`📋 총 ${images.length}개 이미지 처리 예정`);

    const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // 뷰포트 설정 (고화질 캡처를 위해)
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const migrationResults = [];
    
    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(`\n📸 [${i + 1}/${images.length}] ${image.name} 처리 중...`);
        
        const result = await migrateSingleImage(page, image);
        migrationResults.push(result);
        
        if (result.success) {
          console.log(`✅ ${image.name} 마이그레이션 완료!`);
        }
        
        // 다음 이미지 처리 전 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } finally {
      await browser.close();
    }
    
    // 결과 요약
    const successCount = migrationResults.filter(r => r.success).length;
    const failureCount = migrationResults.filter(r => !r.success).length;
    
    console.log('\n📊 마이그레이션 결과 요약:');
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failureCount}개`);
    
    // 성공한 이미지들의 새로운 URL 목록
    const successResults = migrationResults.filter(r => r.success);
    if (successResults.length > 0) {
      console.log('\n🔗 새로운 Supabase Storage URL 목록:');
      successResults.forEach(result => {
        console.log(`${result.name}: ${result.storedUrl}`);
      });
    }
    
    return res.status(200).json({
      success: true,
      message: '이미지 마이그레이션 완료',
      results: migrationResults,
      summary: {
        total: images.length,
        success: successCount,
        failure: failureCount
      }
    });
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
