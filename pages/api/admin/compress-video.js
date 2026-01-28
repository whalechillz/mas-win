import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const tempDir = path.join(os.tmpdir(), `video-compress-${Date.now()}`);
  let tempVideoPath = null;
  let tempCompressedPath = null;

  try {
    const { videoUrl, folderPath, fileName, bitrate, crf = 23 } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: '동영상 URL이 필요합니다.' });
    }

    // 임시 디렉토리 생성
    fs.mkdirSync(tempDir, { recursive: true });

    // 파일명 생성
    const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : `video-${Date.now()}`;
    const videoExtension = path.extname(fileName || 'video.mp4') || '.mp4';
    const outputFileName = `${baseName}-compressed${videoExtension}`;
    tempCompressedPath = path.join(tempDir, outputFileName);

    // 동영상 다운로드
    console.log('📥 동영상 다운로드 중:', videoUrl);
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error('동영상 다운로드 실패');
    }

    const arrayBuffer = await videoResponse.arrayBuffer();
    const originalSize = arrayBuffer.byteLength;
    tempVideoPath = path.join(tempDir, `input${videoExtension}`);
    fs.writeFileSync(tempVideoPath, Buffer.from(arrayBuffer));

    // ffmpeg 설치 여부 확인
    console.log('🔍 ffmpeg 설치 여부 확인 중...');
    try {
      await execAsync('which ffmpeg');
      console.log('✅ ffmpeg 설치 확인됨');
    } catch (ffmpegCheckError) {
      const isVercel = process.env.VERCEL === '1';
      console.error('❌ ffmpeg가 설치되어 있지 않습니다:', ffmpegCheckError);
      
      return res.status(500).json({
        success: false,
        error: isVercel 
          ? 'Vercel 환경에서는 동영상 압축 기능을 사용할 수 없습니다. 로컬 환경에서만 사용 가능합니다.'
          : 'ffmpeg가 설치되어 있지 않습니다. 시스템에 ffmpeg를 설치해주세요.',
        requiresFfmpeg: true,
        isVercel: isVercel
      });
    }

    // ffmpeg로 압축
    console.log('🎬 동영상 압축 중...', { bitrate, crf });
    
    // ffmpeg 명령어 구성
    let ffmpegCommand = `ffmpeg -i "${tempVideoPath}"`;
    
    // 비디오 코덱 설정
    ffmpegCommand += ` -vcodec libx264`;
    
    // 비트레이트 또는 CRF 설정
    if (bitrate) {
      ffmpegCommand += ` -b:v ${bitrate}`;
    } else {
      // CRF 사용 (18-28, 낮을수록 고품질)
      ffmpegCommand += ` -crf ${crf}`;
    }
    
    // 프리셋 설정 (압축 속도)
    ffmpegCommand += ` -preset slow`;
    
    // 오디오 코덱 설정 (원본 유지)
    ffmpegCommand += ` -acodec copy`;
    
    // 출력 파일
    ffmpegCommand += ` -y "${tempCompressedPath}"`;

    console.log('🔧 ffmpeg 명령어:', ffmpegCommand);

    // ffmpeg 실행
    let stdout, stderr;
    try {
      const result = await execAsync(ffmpegCommand);
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (execError) {
      console.error('❌ ffmpeg 실행 오류:', execError);
      if (execError.stderr && execError.stderr.includes('command not found')) {
        const isVercel = process.env.VERCEL === '1';
        return res.status(500).json({
          success: false,
          error: isVercel 
            ? 'Vercel 환경에서는 동영상 압축 기능을 사용할 수 없습니다. 로컬 환경에서만 사용 가능합니다.'
            : 'ffmpeg가 설치되어 있지 않습니다. 시스템에 ffmpeg를 설치해주세요.',
          requiresFfmpeg: true,
          isVercel: isVercel
        });
      }
      throw execError;
    }
    
    if (stderr && !stderr.includes('frame=')) {
      console.warn('⚠️ ffmpeg 경고:', stderr);
    }

    // 압축된 파일 확인
    if (!fs.existsSync(tempCompressedPath)) {
      throw new Error('압축 파일 생성 실패');
    }

    const compressedBuffer = fs.readFileSync(tempCompressedPath);
    const compressedSize = compressedBuffer.length;

    // Supabase Storage에 업로드
    const bucket = 'blog-images';
    const uploadPath = folderPath ? `${folderPath}/${outputFileName}` : outputFileName;

    console.log('💾 압축된 동영상 Supabase Storage에 업로드 중:', uploadPath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(uploadPath, compressedBuffer, {
        contentType: `video/${videoExtension.slice(1)}`,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase 업로드 오류:', uploadError);
      throw uploadError;
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadPath);

    // 원본 동영상의 메타데이터 복사
    try {
      const { data: originalMetadata, error: metadataError } = await supabase
        .from('image_assets')
        .select('*')
        .eq('cdn_url', videoUrl)
        .maybeSingle();

      if (!metadataError && originalMetadata) {
        const newMetadata = {
          cdn_url: urlData.publicUrl,
          file_path: folderPath ? `${folderPath}/${outputFileName}` : outputFileName,
          alt_text: originalMetadata.alt_text || null,
          title: originalMetadata.title || null,
          description: originalMetadata.description || null,
          ai_tags: originalMetadata.ai_tags || originalMetadata.tags || null,
          file_size: compressedSize,
          width: originalMetadata.width || null,
          height: originalMetadata.height || null,
          format: videoExtension.slice(1),
          upload_source: 'video-compression',
          status: originalMetadata.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
          // ⚠️ image_assets에는 다음 필드들이 없음: folder_path, prompt, category_id, story_scene, image_type, customer_name_en, customer_initials, date_folder, english_filename, original_filename
        };

        const { error: saveError } = await supabase
          .from('image_assets')
          .upsert(newMetadata, {
            onConflict: 'cdn_url',
            ignoreDuplicates: false
          });

        if (saveError) {
          console.warn('⚠️ 메타데이터 저장 실패 (계속 진행):', saveError);
        } else {
          console.log('✅ 메타데이터 복사 완료');
        }
      }
    } catch (metadataCopyError) {
      console.warn('⚠️ 메타데이터 복사 중 오류 (계속 진행):', metadataCopyError);
    }

    console.log('✅ 동영상 압축 완료:', urlData.publicUrl);

    res.json({
      success: true,
      imageUrl: urlData.publicUrl,
      fileName: outputFileName,
      size: compressedSize,
      originalSize: originalSize
    });

  } catch (error) {
    console.error('❌ 동영상 압축 오류:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        error: error.message || '동영상 압축 중 오류가 발생했습니다.' 
      });
    }
  } finally {
    // 임시 파일 정리
    try {
      if (tempVideoPath && fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
      }
      if (tempCompressedPath && fs.existsSync(tempCompressedPath)) {
        fs.unlinkSync(tempCompressedPath);
      }
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir);
      }
    } catch (cleanupError) {
      console.warn('⚠️ 임시 파일 정리 실패:', cleanupError);
    }
  }
}
