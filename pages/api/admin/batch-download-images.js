import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { images, options = {} } = req.body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: '다운로드할 이미지 목록이 필요합니다.' });
  }

  const results = {
    success: [],
    failed: [],
    total: images.length
  };

  console.log(`📥 ${images.length}개 이미지 배치 다운로드 시작`);

  try {
    // 병렬 처리로 이미지 다운로드 (최대 5개씩)
    const batchSize = 5;
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (imageData) => {
        try {
          const result = await downloadAndSaveImage(imageData, options);
          return { success: true, data: result, original: imageData };
        } catch (error) {
          console.error(`이미지 다운로드 실패 (${imageData.src}):`, error.message);
          return { success: false, error: error.message, original: imageData };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.success) {
          results.success.push(result.data);
        } else {
          results.failed.push({
            src: result.original.src,
            error: result.error
          });
        }
      });

      // 배치 간 잠시 대기 (서버 부하 방지)
      if (i + batchSize < images.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ 배치 다운로드 완료: ${results.success.length}개 성공, ${results.failed.length}개 실패`);

    res.status(200).json({
      success: true,
      results: results,
      message: `${results.success.length}개 이미지가 성공적으로 저장되었습니다.`
    });

  } catch (error) {
    console.error('배치 다운로드 오류:', error);
    res.status(500).json({ 
      error: '배치 다운로드 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

async function downloadAndSaveImage(imageData, options) {
  try {
    // 1. 이미지 다운로드
    const response = await fetch(imageData.src, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });

    if (!response.ok) {
      throw new Error(`이미지 다운로드 실패: ${response.status} ${response.statusText}`);
    }

    const imageBuffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // 2. 파일명 생성
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileName = options.prefix ? 
      `${options.prefix}-${timestamp}-${randomId}.${imageData.fileExtension}` :
      `webpage-${timestamp}-${randomId}.${imageData.fileExtension}`;

    // 3. Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, imageBuffer, {
        contentType: contentType,
        upsert: true
      });

    if (error) {
      throw new Error(`Supabase 업로드 실패: ${error.message}`);
    }

    // 4. 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('공개 URL 생성 실패');
    }

    return {
      originalUrl: imageData.src,
      supabaseUrl: publicUrlData.publicUrl,
      fileName: fileName,
      fileSize: imageBuffer.length,
      contentType: contentType,
      alt: imageData.alt,
      title: imageData.title,
      width: imageData.width,
      height: imageData.height,
      isBackground: imageData.isBackground || false,
      downloadedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`이미지 처리 실패: ${error.message}`);
  }
}
