/**
 * 155번 폴더에 .keep.png 파일 생성 (폴더 유지용)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createKeepFile() {
  const folderPath = 'originals/mms/2025-12-05/155';
  const keepFilePath = `${folderPath}/.keep.png`;
  
  console.log('📌 155번 폴더에 .keep.png 파일 생성 중...\n');
  console.log(`   폴더 경로: ${folderPath}`);
  console.log(`   파일 경로: ${keepFilePath}\n`);
  
  // 먼저 폴더 상태 확인
  const { data: existingFiles } = await supabase.storage
    .from('blog-images')
    .list(folderPath, { limit: 10 });
  
  if (existingFiles && existingFiles.length > 0) {
    const hasKeepFile = existingFiles.some(file => file.name.toLowerCase() === '.keep.png');
    if (hasKeepFile) {
      console.log('✅ .keep.png 파일이 이미 존재합니다.\n');
      return;
    }
  }
  
  // 1x1 투명 PNG (Base64)
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
  const content = Buffer.from(pngBase64, 'base64');
  
  const { error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(keepFilePath, content, {
      contentType: 'image/png',
      upsert: true
    });
  
  if (uploadError) {
    console.error('❌ .keep.png 파일 생성 실패:', uploadError.message);
    process.exit(1);
  }
  
  console.log('✅ .keep.png 파일 생성 완료!');
  console.log(`   경로: ${keepFilePath}\n`);
  console.log('='.repeat(60));
  console.log('✅ 완료!');
  console.log('   이제 155번 폴더가 갤러리에서 계속 표시됩니다.');
  console.log('   링크된 이미지(128번)도 정상적으로 표시됩니다.');
  console.log('='.repeat(60));
}

createKeepFile();

 * 155번 폴더에 .keep.png 파일 생성 (폴더 유지용)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createKeepFile() {
  const folderPath = 'originals/mms/2025-12-05/155';
  const keepFilePath = `${folderPath}/.keep.png`;
  
  console.log('📌 155번 폴더에 .keep.png 파일 생성 중...\n');
  console.log(`   폴더 경로: ${folderPath}`);
  console.log(`   파일 경로: ${keepFilePath}\n`);
  
  // 먼저 폴더 상태 확인
  const { data: existingFiles } = await supabase.storage
    .from('blog-images')
    .list(folderPath, { limit: 10 });
  
  if (existingFiles && existingFiles.length > 0) {
    const hasKeepFile = existingFiles.some(file => file.name.toLowerCase() === '.keep.png');
    if (hasKeepFile) {
      console.log('✅ .keep.png 파일이 이미 존재합니다.\n');
      return;
    }
  }
  
  // 1x1 투명 PNG (Base64)
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
  const content = Buffer.from(pngBase64, 'base64');
  
  const { error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(keepFilePath, content, {
      contentType: 'image/png',
      upsert: true
    });
  
  if (uploadError) {
    console.error('❌ .keep.png 파일 생성 실패:', uploadError.message);
    process.exit(1);
  }
  
  console.log('✅ .keep.png 파일 생성 완료!');
  console.log(`   경로: ${keepFilePath}\n`);
  console.log('='.repeat(60));
  console.log('✅ 완료!');
  console.log('   이제 155번 폴더가 갤러리에서 계속 표시됩니다.');
  console.log('   링크된 이미지(128번)도 정상적으로 표시됩니다.');
  console.log('='.repeat(60));
}

createKeepFile();

 * 155번 폴더에 .keep.png 파일 생성 (폴더 유지용)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createKeepFile() {
  const folderPath = 'originals/mms/2025-12-05/155';
  const keepFilePath = `${folderPath}/.keep.png`;
  
  console.log('📌 155번 폴더에 .keep.png 파일 생성 중...\n');
  console.log(`   폴더 경로: ${folderPath}`);
  console.log(`   파일 경로: ${keepFilePath}\n`);
  
  // 먼저 폴더 상태 확인
  const { data: existingFiles } = await supabase.storage
    .from('blog-images')
    .list(folderPath, { limit: 10 });
  
  if (existingFiles && existingFiles.length > 0) {
    const hasKeepFile = existingFiles.some(file => file.name.toLowerCase() === '.keep.png');
    if (hasKeepFile) {
      console.log('✅ .keep.png 파일이 이미 존재합니다.\n');
      return;
    }
  }
  
  // 1x1 투명 PNG (Base64)
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
  const content = Buffer.from(pngBase64, 'base64');
  
  const { error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(keepFilePath, content, {
      contentType: 'image/png',
      upsert: true
    });
  
  if (uploadError) {
    console.error('❌ .keep.png 파일 생성 실패:', uploadError.message);
    process.exit(1);
  }
  
  console.log('✅ .keep.png 파일 생성 완료!');
  console.log(`   경로: ${keepFilePath}\n`);
  console.log('='.repeat(60));
  console.log('✅ 완료!');
  console.log('   이제 155번 폴더가 갤러리에서 계속 표시됩니다.');
  console.log('   링크된 이미지(128번)도 정상적으로 표시됩니다.');
  console.log('='.repeat(60));
}

createKeepFile();

 * 155번 폴더에 .keep.png 파일 생성 (폴더 유지용)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createKeepFile() {
  const folderPath = 'originals/mms/2025-12-05/155';
  const keepFilePath = `${folderPath}/.keep.png`;
  
  console.log('📌 155번 폴더에 .keep.png 파일 생성 중...\n');
  console.log(`   폴더 경로: ${folderPath}`);
  console.log(`   파일 경로: ${keepFilePath}\n`);
  
  // 먼저 폴더 상태 확인
  const { data: existingFiles } = await supabase.storage
    .from('blog-images')
    .list(folderPath, { limit: 10 });
  
  if (existingFiles && existingFiles.length > 0) {
    const hasKeepFile = existingFiles.some(file => file.name.toLowerCase() === '.keep.png');
    if (hasKeepFile) {
      console.log('✅ .keep.png 파일이 이미 존재합니다.\n');
      return;
    }
  }
  
  // 1x1 투명 PNG (Base64)
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
  const content = Buffer.from(pngBase64, 'base64');
  
  const { error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(keepFilePath, content, {
      contentType: 'image/png',
      upsert: true
    });
  
  if (uploadError) {
    console.error('❌ .keep.png 파일 생성 실패:', uploadError.message);
    process.exit(1);
  }
  
  console.log('✅ .keep.png 파일 생성 완료!');
  console.log(`   경로: ${keepFilePath}\n`);
  console.log('='.repeat(60));
  console.log('✅ 완료!');
  console.log('   이제 155번 폴더가 갤러리에서 계속 표시됩니다.');
  console.log('   링크된 이미지(128번)도 정상적으로 표시됩니다.');
  console.log('='.repeat(60));
}

createKeepFile();

 * 155번 폴더에 .keep.png 파일 생성 (폴더 유지용)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createKeepFile() {
  const folderPath = 'originals/mms/2025-12-05/155';
  const keepFilePath = `${folderPath}/.keep.png`;
  
  console.log('📌 155번 폴더에 .keep.png 파일 생성 중...\n');
  console.log(`   폴더 경로: ${folderPath}`);
  console.log(`   파일 경로: ${keepFilePath}\n`);
  
  // 먼저 폴더 상태 확인
  const { data: existingFiles } = await supabase.storage
    .from('blog-images')
    .list(folderPath, { limit: 10 });
  
  if (existingFiles && existingFiles.length > 0) {
    const hasKeepFile = existingFiles.some(file => file.name.toLowerCase() === '.keep.png');
    if (hasKeepFile) {
      console.log('✅ .keep.png 파일이 이미 존재합니다.\n');
      return;
    }
  }
  
  // 1x1 투명 PNG (Base64)
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2e+8kAAAAASUVORK5CYII=';
  const content = Buffer.from(pngBase64, 'base64');
  
  const { error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(keepFilePath, content, {
      contentType: 'image/png',
      upsert: true
    });
  
  if (uploadError) {
    console.error('❌ .keep.png 파일 생성 실패:', uploadError.message);
    process.exit(1);
  }
  
  console.log('✅ .keep.png 파일 생성 완료!');
  console.log(`   경로: ${keepFilePath}\n`);
  console.log('='.repeat(60));
  console.log('✅ 완료!');
  console.log('   이제 155번 폴더가 갤러리에서 계속 표시됩니다.');
  console.log('   링크된 이미지(128번)도 정상적으로 표시됩니다.');
  console.log('='.repeat(60));
}

createKeepFile();







