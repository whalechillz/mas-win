/**
 * 박성우 고객 이미지 날짜별 상세 확인
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

async function checkParksungwooByDate() {
  console.log('🔍 박성우 고객 이미지 날짜별 상세 확인...\n');

  try {
    const folderName = 'parksungwoo-6003';

    // 1. DB 이미지 조회
    const { data: dbImages, error: dbError } = await supabase
      .from('image_assets')
      .select('id, filename, file_path, cdn_url, created_at')
      .ilike('file_path', `originals/customers/${folderName}/%`)
      .order('file_path', { ascending: true });

    if (dbError) {
      console.error('❌ DB 조회 실패:', dbError);
      return;
    }

    console.log(`📊 DB 이미지: ${dbImages.length}개\n`);

    // 2. 날짜별로 그룹화
    const dateGroups = new Map();
    
    dbImages.forEach(img => {
      const filePath = img.file_path || '';
      // 날짜 추출
      const dateMatch = filePath.match(/\/(\d{4}-\d{2}-\d{2})\//);
      const date = dateMatch ? dateMatch[1] : '날짜 없음';
      
      if (!dateGroups.has(date)) {
        dateGroups.set(date, []);
      }
      dateGroups.get(date).push(img);
    });

    // 3. 각 날짜별로 Storage 파일 확인
    console.log('📅 날짜별 상세 분석:\n');

    for (const [date, images] of dateGroups) {
      console.log(`\n📅 ${date}:\n`);
      console.log(`   DB 메타데이터: ${images.length}개\n`);

      // Storage 폴더 확인
      const storagePath = `originals/customers/${folderName}/${date}`;
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('blog-images')
        .list(storagePath, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (storageError) {
        console.log(`   ❌ Storage 조회 실패: ${storageError.message}\n`);
        continue;
      }

      const actualFiles = (storageFiles || []).filter(f => f.id); // 파일만
      console.log(`   📦 Storage 실제 파일: ${actualFiles.length}개\n`);

      // Storage 파일명 맵
      const storageFileMap = new Map();
      actualFiles.forEach(f => {
        storageFileMap.set(f.name.toLowerCase(), {
          name: f.name,
          size: f.metadata?.size || 0,
          updated: f.updated_at
        });
      });

      // 각 DB 이미지와 Storage 파일 매칭
      images.forEach((img, idx) => {
        const fileName = img.filename || '';
        const filePath = img.file_path || '';
        const expectedPath = `${storagePath}/${fileName}`;
        
        const storageFile = storageFileMap.get(fileName.toLowerCase());
        
        console.log(`   ${idx + 1}. ${fileName}`);
        console.log(`      DB file_path: ${filePath}`);
        console.log(`      예상 경로: ${expectedPath}`);
        
        if (storageFile) {
          console.log(`      ✅ Storage 존재: ${(storageFile.size / 1024).toFixed(2)} KB`);
          console.log(`      업데이트: ${storageFile.updated}`);
        } else {
          console.log(`      ❌ Storage에 없음 (고스트)`);
        }
        console.log('');
      });

      // Storage에만 있는 파일 (DB 메타데이터 없음)
      const dbFileNames = new Set(images.map(img => (img.filename || '').toLowerCase()));
      const storageOnly = actualFiles.filter(f => !dbFileNames.has(f.name.toLowerCase()));
      
      if (storageOnly.length > 0) {
        console.log(`   ⚠️  Storage에만 있는 파일 (DB 메타데이터 없음): ${storageOnly.length}개\n`);
        storageOnly.forEach(f => {
          console.log(`      - ${f.name} (${((f.metadata?.size || 0) / 1024).toFixed(2)} KB)`);
        });
        console.log('');
      }
    }

    // 4. 같은 filename이 다른 날짜에 있는 경우 확인
    console.log('\n🔍 같은 filename이 다른 날짜에 있는 경우:\n');
    
    const filenameToDates = new Map();
    dbImages.forEach(img => {
      const fileName = img.filename || '';
      const filePath = img.file_path || '';
      const dateMatch = filePath.match(/\/(\d{4}-\d{2}-\d{2})\//);
      const date = dateMatch ? dateMatch[1] : '날짜 없음';
      
      if (!filenameToDates.has(fileName)) {
        filenameToDates.set(fileName, []);
      }
      filenameToDates.get(fileName).push({ date, img });
    });

    const multiDateFiles = Array.from(filenameToDates.entries())
      .filter(([filename, dates]) => dates.length > 1);

    if (multiDateFiles.length > 0) {
      for (const [filename, dates] of multiDateFiles) {
        console.log(`📸 ${filename}:`);
        console.log(`   ${dates.length}개 날짜에 존재:\n`);
        
        for (const { date, img } of dates) {
          const storagePath = `originals/customers/${folderName}/${date}`;
          const { data: storageFiles } = await supabase.storage
            .from('blog-images')
            .list(storagePath, { limit: 1000 });
          
          const actualFile = (storageFiles || []).find(f => 
            f.id && f.name.toLowerCase() === filename.toLowerCase()
          );
          
          console.log(`   - ${date}:`);
          console.log(`     DB ID: ${img.id}`);
          console.log(`     file_path: ${img.file_path}`);
          if (actualFile) {
            console.log(`     ✅ Storage 존재: ${((actualFile.metadata?.size || 0) / 1024).toFixed(2)} KB`);
          } else {
            console.log(`     ❌ Storage 없음`);
          }
          console.log('');
        }
      }
    } else {
      console.log('   ✅ 같은 filename이 여러 날짜에 있는 경우 없음\n');
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkParksungwooByDate().catch(console.error);
