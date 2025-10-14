import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 한글 파일명을 영어로 변환하는 함수
function convertKoreanToEnglish(filename) {
  // 한글을 제거하고 영어/숫자/특수문자만 남기기
  const englishOnly = filename.replace(/[가-힣]/g, '');
  
  // 연속된 언더스코어나 점 정리
  const cleaned = englishOnly.replace(/[._]+/g, '_');
  
  // 파일 확장자 분리
  const parts = cleaned.split('.');
  const extension = parts.pop();
  const nameWithoutExt = parts.join('.');
  
  // 빈 이름인 경우 기본값 사용
  const finalName = nameWithoutExt.trim() || 'image';
  
  // 타임스탬프 추가로 고유성 보장
  const timestamp = Date.now();
  
  return `${finalName}_${timestamp}.${extension}`;
}

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { images, postTitle } = req.body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: '이미지 배열이 필요합니다.' });
  }

  try {
    console.log('📁 Supabase 스토리지에 이미지 저장 시작:', images.length, '개');

    const savedImages = [];
    const errors = [];

    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      const { src, fileName, alt } = imageData;

      try {
        console.log(`🖼️ 이미지 ${i + 1}/${images.length} 저장 중:`, fileName);

        // 이미지 다운로드 (네이버 이미지는 프록시 사용)
        let imageUrl = src;
        if (src.includes('pstatic.net') || src.includes('naver.net')) {
          // 이미지 프록시를 통해 다운로드
          imageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.masgolf.co.kr'}/api/image-proxy?url=${encodeURIComponent(src)}`;
          console.log('🔄 네이버 이미지 프록시 사용:', imageUrl);
        }
        
        const imageResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://blog.naver.com/',
          }
        });

        if (!imageResponse.ok) {
          throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
        }

        const imageBuffer = await imageResponse.buffer();
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

        // 파일명 생성 (한글 파일명을 영어로 변환)
        let safeFileName;
        if (fileName) {
          // 한글이 포함된 파일명인지 확인
          if (/[가-힣]/.test(fileName)) {
            console.log('🔄 한글 파일명 감지, 영어로 변환:', fileName);
            safeFileName = convertKoreanToEnglish(fileName);
            console.log('✅ 변환된 파일명:', safeFileName);
          } else {
            // 한글이 없으면 기존 방식으로 안전한 파일명 생성
            safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
          }
        } else {
          safeFileName = `image_${Date.now()}_${i}.jpg`;
        }

        // Supabase 스토리지에 업로드
        const filePath = `scraped-images/${postTitle ? postTitle.replace(/[^a-zA-Z0-9.-]/g, '_') : 'untitled'}/${safeFileName}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(filePath, imageBuffer, {
            contentType: contentType,
            upsert: true
          });

        if (uploadError) {
          throw new Error(`스토리지 업로드 실패: ${uploadError.message}`);
        }

        // 공개 URL 생성
        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(filePath);

        savedImages.push({
          originalSrc: src,
          fileName: safeFileName,
          filePath: filePath,
          publicUrl: publicUrl,
          size: imageBuffer.length,
          contentType: contentType
        });

        // 이미지 메타데이터 저장 (기존 갤러리 관리와 동일한 방식)
        const { error: metadataError } = await supabase
          .from('image_metadata')
          .insert({
            image_url: publicUrl,
            original_url: src,
            prompt: `스크래핑된 이미지: ${postTitle || 'untitled'}`,
            title: postTitle || '스크래핑된 이미지',
            excerpt: alt || '네이버 블로그에서 스크래핑된 이미지',
            content_type: 'scraped',
            brand_strategy: 'naver-blog',
            created_at: new Date().toISOString(),
            usage_count: 0,
            is_featured: false,
            // 추가 필드들 (기존 갤러리 관리와 동일하게)
            alt_text: alt || '',
            keywords: '',
            category: 'scraped',
            file_name: safeFileName
          });

        if (metadataError) {
          console.error('❌ 메타데이터 저장 실패:', {
            error: metadataError,
            imageUrl: publicUrl,
            fileName: safeFileName,
            postTitle: postTitle
          });
          // 메타데이터 저장 실패해도 이미지는 저장되었으므로 계속 진행
        } else {
          console.log('✅ 메타데이터 저장 완료:', {
            imageUrl: publicUrl,
            fileName: safeFileName
          });
        }

        console.log(`✅ 이미지 저장 성공:`, safeFileName);

      } catch (error) {
        console.error(`❌ 이미지 저장 실패:`, error.message);
        errors.push({
          fileName: fileName || `이미지 ${i + 1}`,
          error: error.message
        });
      }
    }

    console.log(`📊 저장 완료: ${savedImages.length}개 성공, ${errors.length}개 실패`);

    return res.status(200).json({
      success: true,
      savedImages: savedImages,
      errors: errors,
      totalSaved: savedImages.length,
      totalErrors: errors.length,
      // 갤러리 업데이트를 위한 정보 추가
      galleryUpdate: {
        message: `${savedImages.length}개 이미지가 갤러리에 저장되었습니다.`,
        savedUrls: savedImages.map(img => img.publicUrl)
      }
    });

  } catch (error) {
    console.error('❌ 이미지 저장 오류:', error.message);
    return res.status(500).json({
      error: '이미지 저장 중 오류가 발생했습니다.',
      message: error.message
    });
  }
}
