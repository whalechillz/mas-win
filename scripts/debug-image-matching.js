// 디버깅: 이미지 매칭 로직 테스트
const imageUrl = 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/campaigns/2025-05/842b4045-55b3-4e81-940d-245b51e0801b-golferavatar512x51202.jpg';
const imagePath = '/campaigns/2025-05/golfer_avatar_512x512_02.jpg';

// URL에서 경로 추출
const storageUrlMatch = imageUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
let filePath = '';
let fileName = '';

if (storageUrlMatch) {
  filePath = decodeURIComponent(storageUrlMatch[1]);
  fileName = filePath.split('/').pop();
}

console.log('📊 추출된 값:');
console.log('  filePath:', filePath);
console.log('  fileName:', fileName);
console.log('  imagePath:', imagePath);
console.log('');

// 월 추출
const filePathMonthMatch = filePath.match(/campaigns\/(\d{4}-\d{2})/);
const imagePathMatch = imagePath.match(/\/campaigns\/(\d{4}-\d{2})\/(.+)$/);

console.log('📅 월 추출:');
if (filePathMonthMatch) {
  console.log('  filePath 월:', filePathMonthMatch[1]);
}
if (imagePathMatch) {
  console.log('  imagePath 월:', imagePathMatch[1]);
  console.log('  imagePath 파일명:', imagePathMatch[2]);
}
console.log('');

// 정규화 비교 (UUID 제거 포함)
function normalizeFileName(fileName) {
  if (!fileName) return '';
  // UUID 패턴 제거: 842b4045-55b3-4e81-940d-245b51e0801b-golferavatar512x51202.jpg
  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-(.+)$/;
  let baseName = fileName;
  const match = fileName.match(uuidPattern);
  if (match) {
    baseName = match[1];
  }
  const withoutExt = baseName.replace(/\.[^/.]+$/, '');
  return withoutExt.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
}

if (filePathMonthMatch && imagePathMatch) {
  const filePathMonth = filePathMonthMatch[1];
  const imagePathMonth = imagePathMatch[1];
  const imageFileName = imagePathMatch[2];
  
  console.log('🔍 매칭 검사:');
  console.log('  월 일치:', filePathMonth === imagePathMonth);
  
  const normalizedImage = normalizeFileName(imageFileName);
  const normalizedStorage = normalizeFileName(fileName);
  
  console.log('  정규화된 imageFileName:', normalizedImage);
  console.log('  정규화된 fileName:', normalizedStorage);
  console.log('  파일명 일치:', normalizedImage === normalizedStorage);
  
  if (filePathMonth === imagePathMonth && normalizedImage === normalizedStorage) {
    console.log('\n✅ 매칭 성공!');
  } else {
    console.log('\n❌ 매칭 실패');
  }
}







