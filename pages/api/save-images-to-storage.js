import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

        // 이미지 다운로드
        const imageResponse = await fetch(src, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://blog.naver.com/',
          },
          timeout: 10000
        });

        if (!imageResponse.ok) {
          throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
        }

        const imageBuffer = await imageResponse.buffer();
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

        // 파일명 생성 (안전한 파일명으로 변환)
        const safeFileName = fileName
          ? fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
          : `image_${Date.now()}_${i}.jpg`;

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
      totalErrors: errors.length
    });

  } catch (error) {
    console.error('❌ 이미지 저장 오류:', error.message);
    return res.status(500).json({
      error: '이미지 저장 중 오류가 발생했습니다.',
      message: error.message
    });
  }
}
