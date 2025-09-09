#!/usr/bin/env node

/**
 * Playwright 스크린샷 기반 고화질 이미지 마이그레이션 시스템
 * 강석님 글의 모든 Wix 이미지를 고화질로 캡처하고 WebP로 최적화해서 Supabase Storage에 저장
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Supabase 클라이언트 설정
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 강석님 글의 Wix 이미지 목록 (8개)
const KANG_SEOK_IMAGES = [
  {
    name: 'MASSGOO 로고',
    url: 'https://static.wixstatic.com/media/abee05_627c6fec85f241e7a9458084a67e36b9~mv2.jpg/v1/crop/x_0,y_521,w_2400,h_928/fill/w_203,h_69,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/%EB%A7%88%EC%93%B0%EA%B5%AC.jpg',
    type: 'logo'
  },
  {
    name: '강석님 프로필',
    url: 'https://static.wixstatic.com/media/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg/v1/fill/w_120,h_170,al_c,q_80,usm_0.66_1.00_0.01,blur_2,enc_avif,quality_auto/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg',
    type: 'profile'
  },
  {
    name: '골프 장비',
    url: 'https://static.wixstatic.com/media/94f4be_78c51b941ff84e15ae0224439323f180~mv2.jpg/v1/fill/w_147,h_98,al_c,q_80,usm_0.66_1.00_0.01,blur_2,enc_avif,quality_auto/94f4be_78c51b941ff84e15ae0224439323f180~mv2.jpg',
    type: 'equipment'
  },
  {
    name: '드라이버 헤드',
    url: 'https://static.wixstatic.com/media/94f4be_68677951d32544c39809afc98c693277~mv2.jpg/v1/fill/w_220,h_330,fp_0.50_0.50,q_90/94f4be_68677951d32544c39809afc98c693277~mv2.jpg',
    type: 'driver'
  },
  {
    name: '스윙 모습',
    url: 'https://static.wixstatic.com/media/94f4be_6ba406c468914150a13c6a8603d06f12~mv2.jpg/v1/fill/w_404,h_330,fp_0.50_0.50,q_90/94f4be_6ba406c468914150a13c6a8603d06f12~mv2.jpg',
    type: 'swing'
  },
  {
    name: '골프 클럽',
    url: 'https://static.wixstatic.com/media/94f4be_be5b4bf9040a48e3b4ed2a4cc309d3ad~mv2.jpg/v1/fill/w_323,h_323,fp_0.50_0.50,q_90/94f4be_be5b4bf9040a48e3b4ed2a4cc309d3ad~mv2.jpg',
    type: 'club'
  },
  {
    name: '골프 장비 세트',
    url: 'https://static.wixstatic.com/media/94f4be_6ceba23029f947c9941a1206181daec9~mv2.jpg/v1/fill/w_324,h_323,fp_0.50_0.50,q_90/94f4be_6ceba23029f947c9941a1206181daec9~mv2.jpg',
    type: 'equipment-set'
  },
  {
    name: '골프 공',
    url: 'https://static.wixstatic.com/media/94f4be_c760743db9604476a67e16bbfe894c90~mv2.jpg/v1/fill/w_323,h_323,fp_0.50_0.50,q_90/94f4be_c760743db9604476a67e16bbfe894c90~mv2.jpg',
    type: 'ball'
  }
];

// Wix 이미지 URL을 고화질로 변환하는 함수
function convertWixToHighQuality(wixUrl) {
  if (!wixUrl || !wixUrl.includes('static.wixstatic.com')) {
    return wixUrl;
  }

  try {
    // 현재 URL 예시:
    // https://static.wixstatic.com/media/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg/v1/fill/w_120,h_170,al_c,q_80,usm_0.66_1.00_0.01,blur_2,enc_avif,quality_auto/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg
    
    // 고화질 변환:
    // https://static.wixstatic.com/media/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg/v1/fill/w_2000,h_2000,al_c,q_95/94f4be_a394473798764e3a8010db94d36b0ad4~mv2.jpg
    
    const baseUrl = wixUrl.split('/v1/')[0];
    const fileName = wixUrl.split('/').pop();
    
    return `${baseUrl}/v1/fill/w_2000,h_2000,al_c,q_95/${fileName}`;
  } catch (error) {
    console.error('Wix URL 변환 실패:', error);
    return wixUrl;
  }
}

// Wix 이미지 URL에서 원본 파일명 추출
function extractWixFileName(wixUrl) {
  if (!wixUrl || !wixUrl.includes('static.wixstatic.com')) {
    return 'unknown-image';
  }

  try {
    const fileName = wixUrl.split('/').pop();
    const baseName = fileName.split('~')[0] || fileName.split('.')[0];
    return baseName.replace(/[^a-zA-Z0-9-_]/g, '-');
  } catch (error) {
    console.error('파일명 추출 실패:', error);
    return 'unknown-image';
  }
}

// Playwright로 고화질 스크린샷 캡처
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
      fullPage: true
    });
    
    console.log(`✅ ${imageName} 고화질 캡처 완료 (${screenshot.length} bytes)`);
    return screenshot;
    
  } catch (error) {
    console.error(`❌ ${imageName} 캡처 실패:`, error.message);
    throw error;
  }
}

// Sharp로 WebP 최적화
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

// Supabase Storage에 저장
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

// 메인 마이그레이션 함수
async function migrateKangSeokImages() {
  console.log('🚀 강석님 글 이미지 고화질 마이그레이션 시작...');
  console.log(`📋 총 ${KANG_SEOK_IMAGES.length}개 이미지 처리 예정`);
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 뷰포트 설정 (고화질 캡처를 위해)
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  const migrationResults = [];
  
  try {
    for (let i = 0; i < KANG_SEOK_IMAGES.length; i++) {
      const image = KANG_SEOK_IMAGES[i];
      console.log(`\n📸 [${i + 1}/${KANG_SEOK_IMAGES.length}] ${image.name} 처리 중...`);
      
      try {
        // 1. 고화질 스크린샷 캡처
        const screenshot = await captureHighQualityScreenshot(page, image.url, image.name);
        
        // 2. WebP 최적화
        const optimizedBuffer = await optimizeToWebP(screenshot, image.name);
        
        // 3. 파일명 생성
        const timestamp = Date.now();
        const baseFileName = extractWixFileName(image.url);
        const fileName = `kang-seok-${image.type}-${baseFileName}-${timestamp}.webp`;
        
        // 4. Supabase Storage에 저장
        const publicUrl = await saveToSupabase(optimizedBuffer, fileName, image.name);
        
        // 5. 결과 저장
        migrationResults.push({
          name: image.name,
          type: image.type,
          originalUrl: image.url,
          highQualityUrl: convertWixToHighQuality(image.url),
          storedUrl: publicUrl,
          fileName: fileName,
          success: true
        });
        
        console.log(`✅ ${image.name} 마이그레이션 완료!`);
        
        // 다음 이미지 처리 전 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ ${image.name} 마이그레이션 실패:`, error.message);
        
        migrationResults.push({
          name: image.name,
          type: image.type,
          originalUrl: image.url,
          error: error.message,
          success: false
        });
      }
    }
    
  } finally {
    await browser.close();
  }
  
  // 결과 요약
  console.log('\n📊 마이그레이션 결과 요약:');
  console.log(`✅ 성공: ${migrationResults.filter(r => r.success).length}개`);
  console.log(`❌ 실패: ${migrationResults.filter(r => !r.success).length}개`);
  
  // 성공한 이미지들의 새로운 URL 목록
  const successResults = migrationResults.filter(r => r.success);
  if (successResults.length > 0) {
    console.log('\n🔗 새로운 Supabase Storage URL 목록:');
    successResults.forEach(result => {
      console.log(`${result.name}: ${result.storedUrl}`);
    });
  }
  
  // 결과를 JSON 파일로 저장
  const resultsFile = `kang-seok-migration-results-${Date.now()}.json`;
  await fs.writeFile(resultsFile, JSON.stringify(migrationResults, null, 2));
  console.log(`\n📄 결과 파일 저장: ${resultsFile}`);
  
  return migrationResults;
}

// 스크립트 실행
if (require.main === module) {
  migrateKangSeokImages()
    .then(results => {
      console.log('\n🎉 강석님 글 이미지 고화질 마이그레이션 완료!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 마이그레이션 실패:', error);
      process.exit(1);
    });
}

module.exports = { migrateKangSeokImages, convertWixToHighQuality };
