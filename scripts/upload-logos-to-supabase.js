/**
 * 로고 파일을 Supabase Storage의 originals/logos/ 폴더로 업로드하는 스크립트
 * 
 * 사용법: node scripts/upload-logos-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

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

// 로고 파일 정보
const logoFiles = [
  {
    localPath: path.join(__dirname, '../public/main/logo/massgoo_logo_black.png'),
    brand: 'massgoo',
    color: 'black',
    type: 'full',
    variant: 'no_bg',
    filename: 'massgoo-black-full.png'
  },
  {
    localPath: path.join(__dirname, '../public/main/logo/massgoo_logo_white.png'),
    brand: 'massgoo',
    color: 'white',
    type: 'full',
    variant: 'no_bg',
    filename: 'massgoo-white-full.png'
  },
  {
    localPath: path.join(__dirname, '../public/main/logo/massgoo_logo_black_with_bg.png'),
    brand: 'massgoo',
    color: 'black',
    type: 'full',
    variant: 'with_bg',
    filename: 'massgoo-black-full-with-bg.png'
  },
  {
    localPath: path.join(__dirname, '../public/main/logo/massgoo_logo_white_with_bg.png'),
    brand: 'massgoo',
    color: 'white',
    type: 'full',
    variant: 'with_bg',
    filename: 'massgoo-white-full-with-bg.png'
  },
  {
    localPath: path.join(__dirname, '../public/main/brand/mas9golf-icon.svg'),
    brand: 'mas9golf',
    color: 'default',
    type: 'icon',
    variant: 'no_bg',
    filename: 'mas9golf-icon.svg'
  }
];

async function uploadLogoToSupabase(logoInfo) {
  try {
    // 파일 존재 확인
    if (!fs.existsSync(logoInfo.localPath)) {
      console.log(`⏭️  파일 없음: ${logoInfo.localPath}`);
      return null;
    }

    // 파일 읽기
    const fileBuffer = fs.readFileSync(logoInfo.localPath);
    const fileStats = fs.statSync(logoInfo.localPath);
    
    // 파일 확장자로 MIME 타입 결정
    const ext = path.extname(logoInfo.filename).toLowerCase();
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp'
    };
    const contentType = mimeTypes[ext] || 'image/png';

    // Supabase Storage 경로
    const storagePath = `originals/logos/${logoInfo.filename}`;

    console.log(`📤 업로드 중: ${logoInfo.filename}...`);

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, fileBuffer, {
        contentType: contentType,
        upsert: true // 이미 있으면 덮어쓰기
      });

    if (uploadError) {
      console.error(`❌ 업로드 실패 (${logoInfo.filename}):`, uploadError.message);
      return null;
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(storagePath);

    console.log(`✅ 업로드 완료: ${logoInfo.filename}`);
    console.log(`   URL: ${publicUrl}`);

    // 해시 생성
    const hashMd5 = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const hashSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // image_metadata에 메타데이터 저장
    const metadata = {
      image_url: publicUrl,
      folder_path: 'originals/logos',
      date_folder: null,
      source: 'manual',
      channel: 'all',
      file_size: fileStats.size,
      // mime_type: contentType, // 컬럼이 없으므로 제거
      width: null, // 이미지 크기는 나중에 분석 가능
      height: null,
      alt_text: `${logoInfo.brand} ${logoInfo.color} ${logoInfo.type} ${logoInfo.variant || 'no_bg'} logo`,
      title: `${logoInfo.brand} ${logoInfo.color} ${logoInfo.type} ${logoInfo.variant === 'with_bg' ? '(배경 포함)' : ''}`,
      description: `로고 이미지 - 브랜드: ${logoInfo.brand}, 색상: ${logoInfo.color}, 타입: ${logoInfo.type}, 변형: ${logoInfo.variant || 'no_bg'}`,
      hash_md5: hashMd5,
      hash_sha256: hashSha256,
      is_logo: true,
      logo_brand: logoInfo.brand,
      logo_type: logoInfo.type,
      logo_color_variant: logoInfo.color,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 중복 확인 (hash_md5로)
    const { data: existing } = await supabase
      .from('image_metadata')
      .select('id')
      .eq('hash_md5', hashMd5)
      .single();

    if (existing) {
      // 기존 레코드 업데이트
      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({
          ...metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error(`⚠️  메타데이터 업데이트 실패:`, updateError.message);
      } else {
        console.log(`   메타데이터 업데이트 완료 (ID: ${existing.id})`);
      }
      return { ...metadata, id: existing.id, publicUrl };
    } else {
      // 새 레코드 생성
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
    console.error(`❌ 오류 (${logoInfo.filename}):`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 로고 파일 업로드 시작...\n');

  const results = [];
  for (const logoInfo of logoFiles) {
    const result = await uploadLogoToSupabase(logoInfo);
    if (result) {
      results.push(result);
    }
    console.log(''); // 빈 줄
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

