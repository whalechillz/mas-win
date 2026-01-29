/**
 * 업로드된 OCR 이미지 확인 스크립트
 * ocr_extracted가 true인 이미지와 OCR 텍스트를 조회
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('   .env.local 파일에서 NEXT_PUBLIC_SUPABASE_URL와 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUploadedOCRImages() {
  console.log('🔍 OCR로 처리된 이미지 확인 중...\n');

  try {
    // ocr_extracted가 true인 이미지 조회
    const { data: ocrImages, error } = await supabase
      .from('image_assets')
      .select('id, filename, original_filename, ocr_extracted, ocr_text, ocr_confidence, ocr_processed_at, created_at, cdn_url')
      .eq('ocr_extracted', true)
      .order('ocr_processed_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ 조회 오류:', error);
      
      // 컬럼이 없는 경우
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.error('\n⚠️  ocr_extracted 컬럼이 아직 없습니다.');
        console.error('   Supabase 대시보드에서 다음 SQL을 실행하세요:');
        console.error('   database/add-ocr-extracted-to-image-assets.sql\n');
      }
      return;
    }

    if (!ocrImages || ocrImages.length === 0) {
      console.log('📭 OCR로 처리된 이미지가 없습니다.\n');
      console.log('💡 OCR 이미지를 업로드하려면:');
      console.log('   1. 고객 관리 페이지에서 이미지 업로드');
      console.log('   2. "OCR (구글 비전)" 옵션 선택');
      console.log('   3. 문서 파일 (주문사양서 등) 업로드\n');
    } else {
      console.log(`✅ OCR로 처리된 이미지: ${ocrImages.length}개\n`);
      
      ocrImages.forEach((image, index) => {
        console.log(`\n[${index + 1}] ${image.filename || image.original_filename || '이름 없음'}`);
        console.log(`   ID: ${image.id}`);
        console.log(`   원본 파일명: ${image.original_filename || 'N/A'}`);
        console.log(`   OCR 처리 시각: ${image.ocr_processed_at || 'N/A'}`);
        console.log(`   신뢰도: ${image.ocr_confidence || 'N/A'}`);
        console.log(`   URL: ${image.cdn_url?.substring(0, 80) || 'N/A'}...`);
        
        if (image.ocr_text) {
          const textPreview = image.ocr_text.substring(0, 200);
          console.log(`   OCR 텍스트 (미리보기):`);
          console.log(`   ${textPreview}${image.ocr_text.length > 200 ? '...' : ''}`);
          console.log(`   전체 길이: ${image.ocr_text.length}자`);
        } else {
          console.log(`   OCR 텍스트: 없음`);
        }
      });
    }

    // 최근 업로드된 이미지 확인 (OCR 여부와 관계없이)
    console.log('\n\n📋 최근 업로드된 이미지 (최근 5개):\n');
    
    const { data: recentImages, error: recentError } = await supabase
      .from('image_assets')
      .select('id, filename, original_filename, ocr_extracted, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!recentError && recentImages) {
      recentImages.forEach((image, index) => {
        const ocrStatus = image.ocr_extracted ? '✅ OCR 처리됨' : '❌ OCR 미처리';
        console.log(`[${index + 1}] ${image.filename || image.original_filename || '이름 없음'} - ${ocrStatus}`);
        console.log(`   생성 시각: ${image.created_at}`);
      });
    }

  } catch (err) {
    console.error('❌ 오류 발생:', err.message);
  }
}

checkUploadedOCRImages().catch(console.error);
