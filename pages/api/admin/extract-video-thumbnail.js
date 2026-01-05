import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';

const execAsync = promisify(exec);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
};

// 동영상 첫 프레임 추출 (썸네일 생성)
async function extractVideoThumbnail(videoPath, outputPath) {
  try {
    // ffmpeg를 사용하여 첫 프레임 추출
    await execAsync(
      `ffmpeg -i "${videoPath}" -ss 00:00:00 -vframes 1 -q:v 2 "${outputPath}"`
    );
    
    // 추출된 이미지 파일 읽기
    const thumbnailBuffer = fs.readFileSync(outputPath);
    return thumbnailBuffer;
  } catch (error) {
    console.error('동영상 썸네일 추출 오류:', error);
    throw new Error(`썸네일 추출 실패: ${error.message}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.NEXT_PUBLIC_IMAGE_BUCKET || 'blog-images';
  
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase env missing' });
  }
  
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { path: filePath, publicUrl } = req.body || {};
    
    if (!filePath && !publicUrl) {
      return res.status(400).json({ error: 'path or publicUrl required' });
    }

    // 임시 파일 경로
    const tempDir = os.tmpdir();
    const tempVideoPath = path.join(tempDir, `video-${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`);
    const tempThumbnailPath = path.join(tempDir, `thumbnail-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`);

    try {
      // 동영상 파일 다운로드
      let arrayBuffer;
      if (filePath) {
        const { data, error } = await supabase.storage.from(bucket).download(filePath);
        if (error) {
          return res.status(404).json({ error: `download failed: ${error.message}` });
        }
        arrayBuffer = await data.arrayBuffer();
      } else {
        const resp = await fetch(publicUrl);
        if (!resp.ok) {
          return res.status(404).json({ error: `fetch failed: ${resp.status}` });
        }
        arrayBuffer = await resp.arrayBuffer();
      }

      // 임시 파일로 저장
      fs.writeFileSync(tempVideoPath, Buffer.from(arrayBuffer));

      // 동영상 첫 프레임 추출
      const thumbnailBuffer = await extractVideoThumbnail(tempVideoPath, tempThumbnailPath);
      
      // Sharp로 최적화 (JPEG 90% 품질)
      const optimizedThumbnail = await sharp(thumbnailBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();

      // Base64로 변환하여 반환 (AI 분석에 사용)
      const base64Thumbnail = optimizedThumbnail.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Thumbnail}`;

      // 임시 파일 정리
      try {
        if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
        if (fs.existsSync(tempThumbnailPath)) fs.unlinkSync(tempThumbnailPath);
      } catch (cleanupError) {
        console.warn('임시 파일 정리 실패:', cleanupError);
      }

      return res.status(200).json({
        success: true,
        thumbnail: dataUrl, // Base64 인코딩된 이미지
      });
    } catch (error) {
      // 임시 파일 정리
      try {
        if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
        if (fs.existsSync(tempThumbnailPath)) fs.unlinkSync(tempThumbnailPath);
      } catch (cleanupError) {
        console.warn('임시 파일 정리 실패:', cleanupError);
      }
      
      throw error;
    }
  } catch (e) {
    console.error('동영상 썸네일 추출 오류:', e);
    return res.status(500).json({ 
      error: e.message || '동영상 썸네일 추출 실패',
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
}

