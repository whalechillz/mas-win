/**
 * 이남구 고객 DB 이미지 상세 분석
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeLeenamguDbImages() {
  console.log('🔍 이남구 고객 DB 이미지 상세 분석...\n');

  try {
    // DB 이미지 전체 조회
    const { data: dbImages, error: dbError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, ai_tags, created_at, updated_at')
      .ilike('file_path', 'originals/customers/leenamgu-8768/%')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('❌ DB 조회 실패:', dbError);
      return;
    }

    console.log(`📊 총 ${dbImages.length}개 이미지 메타데이터\n`);

    // Storage 파일 목록
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('blog-images')
      .list('originals/customers/leenamgu-8768', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (storageError) {
      console.error('❌ Storage 조회 실패:', storageError);
      return;
    }

    // 재귀적으로 모든 파일 가져오기
    async function getAllFiles(path, files = []) {
      const { data: items } = await supabase.storage
        .from('blog-images')
        .list(path, { limit: 1000 });
      
      if (!items) return files;
      
      for (const item of items) {
        const fullPath = `${path}/${item.name}`;
        if (item.id) {
          files.push({ path: fullPath, name: item.name });
        } else {
          await getAllFiles(fullPath, files);
        }
      }
      return files;
    }

    const allStorageFiles = await getAllFiles('originals/customers/leenamgu-8768');
    const storageFileMap = new Map(allStorageFiles.map(f => [f.path, f]));

    console.log(`📦 Storage 실제 파일: ${allStorageFiles.length}개\n`);

    // DB 이미지별로 파일 존재 여부 확인
    const imagesWithStatus = dbImages.map(img => {
      const filePath = img.file_path || '';
      const exists = storageFileMap.has(filePath);
      
      // 파일명 추출
      const fileName = filePath.split('/').pop() || '';
      
      return {
        ...img,
        fileName,
        exists,
        filePath
      };
    });

    // 존재하는 이미지
    const existingImages = imagesWithStatus.filter(img => img.exists);
    // 존재하지 않는 이미지 (고스트 이미지)
    const ghostImages = imagesWithStatus.filter(img => !img.exists);

    console.log('📊 분석 결과:\n');
    console.log(`   ✅ Storage에 존재: ${existingImages.length}개`);
    console.log(`   ❌ Storage에 없음 (고스트): ${ghostImages.length}개\n`);

    // 고스트 이미지 상세
    if (ghostImages.length > 0) {
      console.log('❌ Storage에 없는 이미지 (고스트 이미지):\n');
      ghostImages.forEach((img, idx) => {
        console.log(`   ${idx + 1}. ID: ${img.id}`);
        console.log(`      파일명: ${img.fileName}`);
        console.log(`      file_path: ${img.filePath}`);
        console.log(`      생성일: ${img.created_at}`);
        console.log(`      cdn_url: ${img.cdn_url ? img.cdn_url.substring(0, 80) + '...' : '없음'}\n`);
      });
    }

    // 중복 파일명 확인
    const fileNameCount = new Map();
    imagesWithStatus.forEach(img => {
      const name = img.fileName.toLowerCase();
      fileNameCount.set(name, (fileNameCount.get(name) || 0) + 1);
    });

    const duplicates = Array.from(fileNameCount.entries())
      .filter(([name, count]) => count > 1);

    if (duplicates.length > 0) {
      console.log('⚠️  중복 파일명:\n');
      duplicates.forEach(([name, count]) => {
        console.log(`   ${name}: ${count}개`);
        const dupImages = imagesWithStatus.filter(img => 
          img.fileName.toLowerCase() === name
        );
        dupImages.forEach(img => {
          console.log(`      - ID: ${img.id}, 존재: ${img.exists ? '✅' : '❌'}`);
        });
        console.log('');
      });
    }

    // 날짜별 그룹화
    const dateGroups = new Map();
    imagesWithStatus.forEach(img => {
      const dateMatch = img.filePath.match(/\/(\d{4}-\d{2}-\d{2})\//);
      const date = dateMatch ? dateMatch[1] : '날짜 없음';
      
      if (!dateGroups.has(date)) {
        dateGroups.set(date, []);
      }
      dateGroups.get(date).push(img);
    });

    console.log('📅 날짜별 분류:\n');
    dateGroups.forEach((images, date) => {
      const existing = images.filter(img => img.exists).length;
      const ghost = images.filter(img => !img.exists).length;
      console.log(`   ${date}: 총 ${images.length}개 (존재: ${existing}개, 고스트: ${ghost}개)`);
    });

    // 삭제 권장 이미지
    console.log('\n💡 삭제 권장:\n');
    console.log(`   고스트 이미지: ${ghostImages.length}개 (Storage에 실제 파일 없음)`);
    
    if (ghostImages.length > 0) {
      console.log('\n   삭제 스크립트 실행:');
      console.log('   node scripts/delete-leenamgu-ghost-images.js --execute');
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

analyzeLeenamguDbImages().catch(console.error);
