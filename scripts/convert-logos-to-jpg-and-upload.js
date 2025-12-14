/**
 * 로고 이미지를 JPG로 변환하고 Supabase에 업로드하는 스크립트
 * - PNG → JPG 변환
 * - originals/logos/ 폴더에 업로드
 * 
 * 사용법: node scripts/convert-logos-to-jpg-and-upload.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env.local') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인해주세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 변환할 로고 파일 목록
const logoFiles = [
  {
    inputPath: path.join(__dirname, '../public/main/logo/massgoo_logo_black.png'),
    outputFilename: 'massgoo_logo_black.jpg',
    brand: 'massgoo',
    color: 'black',
    variant: 'no_bg'
  },
  {
    inputPath: path.join(__dirname, '../public/main/logo/massgoo_logo_white.png'),
    outputFilename: 'massgoo_logo_white.jpg',
    brand: 'massgoo',
    color: 'white',
    variant: 'no_bg'
  },
  {
    inputPath: path.join(__dirname, '../public/main/logo/massgoo_logo_black_with_bg.png'),
    outputFilename: 'massgoo_logo_black_with_bg.jpg',
    brand: 'massgoo',
    color: 'black',
    variant: 'with_bg'
  },
  {
    inputPath: path.join(__dirname, '../public/main/logo/massgoo_logo_white_with_bg.png'),
    outputFilename: 'massgoo_logo_white_with_bg.jpg',
    brand: 'massgoo',
    color: 'white',
    variant: 'with_bg'
  }
];

async function convertAndUploadLogo(logoInfo) {
  try {
    // 1. PNG → JPG 변환
    if (!fs.existsSync(logoInfo.inputPath)) {
      console.log(`⏭️  파일 없음: ${logoInfo.inputPath}`);
      return null;
    }

    console.log(`🔄 변환 중: ${logoInfo.outputFilename}...`);
    
    const jpegBuffer = await sharp(logoInfo.inputPath)
      .jpeg({ 
        quality: 90, 
        progressive: true, 
        mozjpeg: true 
      })
      .toBuffer();

    console.log(`✅ 변환 완료: ${(jpegBuffer.length / 1024).toFixed(2)}KB`);

    // 2. Supabase Storage에 업로드
    const storagePath = `originals/logos/${logoInfo.outputFilename}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, jpegBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error(`❌ 업로드 실패:`, uploadError.message);
      return null;
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(storagePath);

    console.log(`✅ 업로드 완료: ${publicUrl}`);

    // 3. 메타데이터 저장
    const hashMd5 = crypto.createHash('md5').update(jpegBuffer).digest('hex');
    const hashSha256 = crypto.createHash('sha256').update(jpegBuffer).digest('hex');

    const metadata = {
      image_url: publicUrl,
      folder_path: 'originals/logos',
      file_size: jpegBuffer.length,
      hash_md5: hashMd5,
      hash_sha256: hashSha256,
      is_logo: true,
      logo_brand: logoInfo.brand,
      logo_type: 'full',
      logo_color_variant: logoInfo.color,
      alt_text: `${logoInfo.brand} ${logoInfo.color} logo ${logoInfo.variant === 'with_bg' ? '(배경 포함)' : ''}`,
      title: `${logoInfo.brand} ${logoInfo.color} ${logoInfo.variant === 'with_bg' ? '(배경 포함)' : ''} - JPG`,
      description: `로고 이미지 (JPG) - 브랜드: ${logoInfo.brand}, 색상: ${logoInfo.color}, 변형: ${logoInfo.variant}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 중복 확인
    const { data: existing } = await supabase
      .from('image_metadata')
      .select('id')
      .eq('hash_md5', hashMd5)
      .single();

    if (existing) {
      await supabase
        .from('image_metadata')
        .update({ ...metadata, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      console.log(`   메타데이터 업데이트 완료 (ID: ${existing.id})`);
      return { ...metadata, id: existing.id, publicUrl };
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('image_metadata')
        .insert(metadata)
        .select()
        .single();

      if (insertError) {
        console.error(`⚠️  메타데이터 저장 실패:`, insertError.message);
        return { ...metadata, publicUrl };
      } else {
        console.log(`   메타데이터 저장 완료 (ID: ${inserted.id})`);
        return { ...inserted, publicUrl };
      }
    }
  } catch (error) {
    console.error(`❌ 오류:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 로고 이미지 JPG 변환 및 업로드 시작...\n');

  const results = [];
  for (const logoInfo of logoFiles) {
    const result = await convertAndUploadLogo(logoInfo);
    if (result) {
      results.push(result);
    }
    console.log('');
  }

  console.log('='.repeat(60));
  console.log(`✅ 완료! 총 ${results.length}개 로고 업로드됨`);
  console.log('='.repeat(60));

  // 결과 요약
  console.log('\n📋 업로드된 로고 목록:');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.title}`);
    console.log(`   URL: ${result.publicUrl || result.image_url}`);
    if (result.id) {
      console.log(`   ID: ${result.id}`);
    }
    console.log('');
  });
}

// ES 모듈로 실행
main().catch(console.error);

