/**
 * 배경이 있는 로고 이미지 생성 스크립트
 * - massgoo_logo_black.png + 흰색 배경 = massgoo_logo_black_with_bg.png
 * - massgoo_logo_white.png + 검은색 배경 = massgoo_logo_white_with_bg.png
 * 
 * 사용법: node scripts/create-logos-with-background.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createLogoWithBackground() {
  const logoBlackPath = path.join(__dirname, '../public/main/logo/massgoo_logo_black.png');
  const logoWhitePath = path.join(__dirname, '../public/main/logo/massgoo_logo_white.png');
  const outputDir = path.join(__dirname, '../public/main/logo');

  // 출력 디렉토리 확인
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // 로고 이미지 메타데이터 가져오기
    const blackLogoMeta = await sharp(logoBlackPath).metadata();
    const whiteLogoMeta = await sharp(logoWhitePath).metadata();

    console.log('📐 로고 크기 정보:');
    console.log(`   검은 로고: ${blackLogoMeta.width}x${blackLogoMeta.height}`);
    console.log(`   흰 로고: ${whiteLogoMeta.width}x${whiteLogoMeta.height}`);

    // 배경 크기 설정 (로고보다 약간 크게, 여백 추가)
    const padding = 40; // 상하좌우 여백
    const bgWidth = Math.max(blackLogoMeta.width, whiteLogoMeta.width) + (padding * 2);
    const bgHeight = Math.max(blackLogoMeta.height, whiteLogoMeta.height) + (padding * 2);

    console.log(`\n📦 배경 크기: ${bgWidth}x${bgHeight} (여백: ${padding}px)`);

    // 1. 검은 로고 + 흰색 배경
    console.log('\n📤 생성 중: massgoo_logo_black_with_bg.png');
    const blackLogoBuffer = await sharp(logoBlackPath)
      .resize(blackLogoMeta.width, blackLogoMeta.height, { fit: 'contain' })
      .toBuffer();

    const blackWithBg = await sharp({
      create: {
        width: bgWidth,
        height: bgHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 } // 흰색 배경
      }
    })
      .composite([{
        input: blackLogoBuffer,
        left: padding,
        top: padding
      }])
      .png()
      .toBuffer();

    const blackOutputPath = path.join(outputDir, 'massgoo_logo_black_with_bg.png');
    await fs.promises.writeFile(blackOutputPath, blackWithBg);
    console.log(`✅ 완료: ${blackOutputPath}`);

    // 2. 흰 로고 + 검은색 배경
    console.log('\n📤 생성 중: massgoo_logo_white_with_bg.png');
    const whiteLogoBuffer = await sharp(logoWhitePath)
      .resize(whiteLogoMeta.width, whiteLogoMeta.height, { fit: 'contain' })
      .toBuffer();

    const whiteWithBg = await sharp({
      create: {
        width: bgWidth,
        height: bgHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 } // 검은색 배경
      }
    })
      .composite([{
        input: whiteLogoBuffer,
        left: padding,
        top: padding
      }])
      .png()
      .toBuffer();

    const whiteOutputPath = path.join(outputDir, 'massgoo_logo_white_with_bg.png');
    await fs.promises.writeFile(whiteOutputPath, whiteWithBg);
    console.log(`✅ 완료: ${whiteOutputPath}`);

    // 파일 크기 확인
    const blackStats = fs.statSync(blackOutputPath);
    const whiteStats = fs.statSync(whiteOutputPath);

    console.log('\n📊 생성된 파일 정보:');
    console.log(`   massgoo_logo_black_with_bg.png: ${(blackStats.size / 1024).toFixed(2)} KB`);
    console.log(`   massgoo_logo_white_with_bg.png: ${(whiteStats.size / 1024).toFixed(2)} KB`);

    console.log('\n🎉 모든 로고 이미지 생성 완료!');
    console.log('\n다음 단계: node scripts/upload-logos-to-supabase.js 실행하여 Supabase에 업로드하세요.');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    if (error.code === 'ENOENT') {
      console.error('   로고 파일을 찾을 수 없습니다. 다음 경로를 확인하세요:');
      console.error(`   - ${logoBlackPath}`);
      console.error(`   - ${logoWhitePath}`);
    }
    process.exit(1);
  }
}

// ES 모듈로 실행
createLogoWithBackground().catch(console.error);

