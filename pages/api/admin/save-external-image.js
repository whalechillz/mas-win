// 외부 이미지를 Supabase Storage에 저장하는 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 한글 파일명을 영문으로 변환하는 함수
function sanitizeFileName(fileName) {
  if (!fileName) return `image-${Date.now()}.jpg`;
  
  // 파일 확장자 추출
  const lastDotIndex = fileName.lastIndexOf('.');
  const extension = lastDotIndex > -1 ? fileName.substring(lastDotIndex) : '.jpg';
  const nameWithoutExt = lastDotIndex > -1 ? fileName.substring(0, lastDotIndex) : fileName;
  
  // 한글과 특수문자를 영문으로 변환
  let sanitizedName = nameWithoutExt;
  
  // 한글-영문 매핑 (전체 문자열 매칭)
  const koreanMap = {
    '수상내역': 'award-history',
    '책장': 'bookshelf',
    '전문가': 'expert',
    '고객': 'customer',
    '피팅': 'fitting',
    '상담': 'consultation',
    '장면': 'scene',
    '보증서': 'warranty',
    '골프': 'golf',
    '스토어': 'store',
    '매스': 'mass',
    '파크': 'park',
    '성우': 'seongwoo',
    '전문가와_고객의_1대1_피팅_상담_장면': 'expert-customer-1on1-fitting-consultation-scene',
    '수상내역_책장': 'award-history-bookshelf'
  };
  
  // 전체 문자열에서 한글 매핑 적용
  for (const [korean, english] of Object.entries(koreanMap)) {
    if (sanitizedName.includes(korean)) {
      sanitizedName = sanitizedName.replace(korean, english);
    }
  }
  
  // 남은 한글과 특수문자 처리
  sanitizedName = sanitizedName
    .replace(/[가-힣]/g, '') // 한글 제거
    .replace(/[^a-zA-Z0-9-_]/g, '-') // 특수문자를 하이픈으로 변환
    .replace(/-+/g, '-') // 연속된 하이픈을 하나로
    .replace(/^-|-$/g, '') // 앞뒤 하이픈 제거
    .toLowerCase();
  
  const finalName = sanitizedName || `image-${Date.now()}`;
  return `${finalName}${extension}`;
}

export default async function handler(req, res) {
  console.log('🔍 외부 이미지 저장 API 요청:', req.method, req.url);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { imageUrl, fileName } = req.body;
    
    // imageUrl이 객체인 경우 src 속성 추출
    let actualImageUrl = imageUrl;
    if (typeof imageUrl === 'object' && imageUrl.src) {
      actualImageUrl = imageUrl.src;
      console.log('🔧 객체에서 URL 추출:', actualImageUrl);
    }
    
    if (!actualImageUrl) {
      return res.status(400).json({ error: '이미지 URL이 필요합니다' });
    }
    
    console.log('📥 외부 이미지 다운로드 중:', actualImageUrl);
    
    // 외부 이미지 다운로드 (네이버 이미지 차단 우회를 위한 헤더 추가)
    const imageResponse = await fetch(actualImageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://blog.naver.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageData = Buffer.from(imageBuffer);
    
    // 파일명 생성 및 한글 파일명 변환
    const timestamp = Date.now();
    const originalFileName = fileName || `external-image-${timestamp}.jpg`;
    const finalFileName = sanitizeFileName(originalFileName);
    
    console.log('📝 원본 파일명:', originalFileName);
    console.log('📝 변환된 파일명:', finalFileName);
    console.log('💾 Supabase Storage에 업로드 중:', finalFileName);
    
    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(finalFileName, imageData, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Supabase 업로드 에러:', error);
      throw new Error(`Supabase 업로드 실패: ${error.message}`);
    }
    
    // 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(finalFileName);
    
    const supabaseUrl = publicUrlData.publicUrl;
    
    console.log('✅ 외부 이미지 저장 성공:', supabaseUrl);
    
    return res.status(200).json({
      success: true,
      supabaseUrl: supabaseUrl,
      fileName: finalFileName,
      originalUrl: actualImageUrl,
      message: '외부 이미지가 Supabase에 성공적으로 저장되었습니다'
    });
    
  } catch (error) {
    console.error('❌ 외부 이미지 저장 에러:', error);
    return res.status(500).json({
      error: '외부 이미지 저장에 실패했습니다',
      details: error.message
    });
  }
}