import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // 동영상 파일이 크므로 제한 증가
    },
    responseLimit: '10mb',
  },
};

// 동영상 파일인지 확인
function isVideoFile(filename) {
  const videoExtensions = ['.mp4', '.avi', '.mov', '.webm', '.mkv', '.flv', '.m4v', '.3gp', '.wmv'];
  const ext = path.extname(filename).toLowerCase();
  return videoExtensions.includes(ext);
}

// ffprobe를 사용하여 동영상 메타데이터 추출
async function extractVideoMetadataWithFFprobe(videoPath) {
  try {
    // ffprobe 명령어 실행
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`
    );
    
    const metadata = JSON.parse(stdout);
    
    // 비디오 스트림 찾기
    const videoStream = metadata.streams?.find(s => s.codec_type === 'video');
    const format = metadata.format || {};
    
    // 메타데이터 추출
    const result = {
      width: videoStream?.width || null,
      height: videoStream?.height || null,
      duration: format.duration ? parseFloat(format.duration) : null,
      size: format.size ? parseInt(format.size) : null,
      bitrate: format.bit_rate ? parseInt(format.bit_rate) : null,
      codec: videoStream?.codec_name || null,
      codec_long: videoStream?.codec_long_name || null,
      fps: videoStream?.r_frame_rate ? 
        (() => {
          const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
          return den ? (num / den).toFixed(2) : null;
        })() : null,
      format: format.format_name || null,
      format_long: format.format_long_name || null,
    };
    
    return result;
  } catch (error) {
    console.error('ffprobe 실행 오류:', error);
    throw new Error(`동영상 메타데이터 추출 실패: ${error.message}`);
  }
}

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
    const { path: filePath, publicUrl, extractThumbnail = false } = req.body || {};
    
    if (!filePath && !publicUrl) {
      return res.status(400).json({ error: 'path or publicUrl required' });
    }

    // 파일명 추출
    const fullPath = filePath || publicUrl;
    const fileName = fullPath.split('/').pop() || '';
    
    // 동영상 파일인지 확인
    if (!isVideoFile(fileName)) {
      return res.status(400).json({ error: '동영상 파일이 아닙니다.' });
    }

    // 임시 파일 경로
    const tempDir = os.tmpdir();
    const tempVideoPath = path.join(tempDir, `video-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(fileName)}`);
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

      // 동영상 메타데이터 추출
      const videoMetadata = await extractVideoMetadataWithFFprobe(tempVideoPath);

      // 썸네일 추출 (요청된 경우)
      let thumbnailBuffer = null;
      let thumbnailUrl = null;
      
      if (extractThumbnail) {
        try {
          thumbnailBuffer = await extractVideoThumbnail(tempVideoPath, tempThumbnailPath);
          
          // 썸네일을 Supabase Storage에 업로드
          const thumbnailFileName = fileName.replace(/\.[^/.]+$/, '_thumb.jpg');
          const thumbnailPath = filePath ? 
            filePath.replace(/\.[^/.]+$/, '_thumb.jpg') :
            `thumbnails/${thumbnailFileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(thumbnailPath, thumbnailBuffer, {
              contentType: 'image/jpeg',
              upsert: true
            });
          
          if (!uploadError) {
            const { data: { publicUrl: thumbUrl } } = supabase.storage
              .from(bucket)
              .getPublicUrl(thumbnailPath);
            thumbnailUrl = thumbUrl;
          }
        } catch (thumbError) {
          console.warn('썸네일 추출 실패 (무시):', thumbError.message);
        }
      }

      // 임시 파일 정리
      try {
        if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
        if (fs.existsSync(tempThumbnailPath)) fs.unlinkSync(tempThumbnailPath);
      } catch (cleanupError) {
        console.warn('임시 파일 정리 실패:', cleanupError);
      }

      return res.status(200).json({
        success: true,
        meta: {
          width: videoMetadata.width,
          height: videoMetadata.height,
          duration: videoMetadata.duration,
          size: videoMetadata.size,
          bitrate: videoMetadata.bitrate,
          codec: videoMetadata.codec,
          codec_long: videoMetadata.codec_long_name,
          fps: videoMetadata.fps,
          format: videoMetadata.format,
          format_long: videoMetadata.format_long_name,
        },
        thumbnail_url: thumbnailUrl,
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
    console.error('동영상 메타데이터 추출 오류:', e);
    return res.status(500).json({ 
      error: e.message || '동영상 메타데이터 추출 실패',
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
}

