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

  const tempDir = path.join(os.tmpdir(), `gif-convert-${Date.now()}`);
  let tempVideoPath = null;
  let tempGifPath = null;

  try {
    const { videoUrl, folderPath, fileName, fps = 10, duration = 0, width = 320 } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: '동영상 URL이 필요합니다.' });
    }

    // 임시 디렉토리 생성
    fs.mkdirSync(tempDir, { recursive: true });

    // 파일명 생성
    const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : `video-${Date.now()}`;
    const outputFileName = `${baseName}-${fps}fps-${duration || 'full'}s.gif`;
    tempGifPath = path.join(tempDir, outputFileName);

    // 동영상 다운로드
    console.log('📥 동영상 다운로드 중:', videoUrl);
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error('동영상 다운로드 실패');
    }

    const arrayBuffer = await videoResponse.arrayBuffer();
    const videoExtension = path.extname(fileName || 'video.mp4');
    tempVideoPath = path.join(tempDir, `input${videoExtension}`);
    fs.writeFileSync(tempVideoPath, Buffer.from(arrayBuffer));

    // ffmpeg 설치 여부 확인
    console.log('🔍 [ffmpeg 체크] 시작...');
    console.log('   - 환경 변수 VERCEL:', process.env.VERCEL);
    console.log('   - 플랫폼:', process.platform);
    console.log('   - Node.js 버전:', process.version);
    
    let ffmpegPath = null;
    try {
      const { stdout } = await execAsync('which ffmpeg');
      ffmpegPath = stdout.trim();
      console.log('✅ [ffmpeg 체크] 설치 확인됨:', ffmpegPath);
      
      // 버전 확인
      try {
        const { stdout: version } = await execAsync('ffmpeg -version | head -1');
        console.log('✅ [ffmpeg 버전]', version.trim());
      } catch (e) {
        console.warn('⚠️ [ffmpeg 버전 확인 실패]', e.message);
      }
    } catch (ffmpegCheckError) {
      const isVercel = process.env.VERCEL === '1';
      console.error('❌ [ffmpeg 체크] 설치되지 않음:', {
        error: ffmpegCheckError.message,
        code: ffmpegCheckError.code,
        isVercel,
        platform: process.platform
      });
      
      const errorMessage = isVercel 
        ? 'Vercel 환경에서는 동영상 변환 기능을 사용할 수 없습니다. 로컬 환경에서만 사용 가능합니다.'
        : `ffmpeg가 설치되어 있지 않습니다. 시스템에 ffmpeg를 설치해주세요.\n\n설치 방법:\n- macOS: brew install ffmpeg\n- Ubuntu/Debian: sudo apt-get install ffmpeg\n- Windows: https://ffmpeg.org/download.html\n\n오류 상세: ${ffmpegCheckError.message}`;
      
      return res.status(500).json({
        success: false,
        error: errorMessage,
        requiresFfmpeg: true,
        isVercel: isVercel,
        platform: process.platform,
        details: ffmpegCheckError.message
      });
    }

    // ffmpeg로 GIF 변환
    console.log('🎬 GIF 변환 중...', { fps, duration, width });
    
    // ffmpeg 명령어 구성
    let ffmpegCommand = `ffmpeg -i "${tempVideoPath}"`;
    
    // 길이 제한 (duration이 0이면 전체)
    if (duration > 0) {
      ffmpegCommand += ` -t ${duration}`;
    }
    
    // 필터 옵션: FPS, 해상도, 품질
    ffmpegCommand += ` -vf "fps=${fps},scale=${width}:-1:flags=lanczos"`;
    
    // GIF 옵션: 팔레트 생성으로 품질 향상
    ffmpegCommand += ` -y "${tempGifPath}"`;

    console.log('🔧 ffmpeg 명령어:', ffmpegCommand);

    // ffmpeg 실행
    let stdout, stderr;
    try {
      const result = await execAsync(ffmpegCommand);
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (execError: any) {
      console.error('❌ ffmpeg 실행 오류:', execError);
      // stderr에 "command not found"가 포함되어 있는지 확인
      if (execError.stderr && execError.stderr.includes('command not found')) {
        const isVercel = process.env.VERCEL === '1';
        return res.status(500).json({
          success: false,
          error: isVercel 
            ? 'Vercel 환경에서는 동영상 변환 기능을 사용할 수 없습니다. 로컬 환경에서만 사용 가능합니다.'
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

    // GIF 파일 확인
    if (!fs.existsSync(tempGifPath)) {
      throw new Error('GIF 파일 생성 실패');
    }

    const gifBuffer = fs.readFileSync(tempGifPath);
    const gifSize = gifBuffer.length;

    // Supabase Storage에 업로드
    const bucket = 'blog-images';
    const uploadPath = folderPath ? `${folderPath}/${outputFileName}` : outputFileName;

    console.log('💾 GIF Supabase Storage에 업로드 중:', uploadPath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(uploadPath, gifBuffer, {
        contentType: 'image/gif',
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
        .from('image_metadata')
        .select('*')
        .eq('image_url', videoUrl)
        .maybeSingle();

      if (!metadataError && originalMetadata) {
        const newMetadata = {
          image_url: urlData.publicUrl,
          folder_path: folderPath,
          alt_text: originalMetadata.alt_text || null,
          title: originalMetadata.title || null,
          description: originalMetadata.description || null,
          tags: originalMetadata.tags || null,
          prompt: originalMetadata.prompt || null,
          category_id: originalMetadata.category_id || null,
          file_size: gifSize,
          width: width || null,
          height: null, // GIF는 높이 자동 계산
          format: 'gif',
          upload_source: 'video-to-gif',
          status: originalMetadata.status || 'active',
          story_scene: originalMetadata.story_scene || null,
          image_type: originalMetadata.image_type || null,
          customer_name_en: originalMetadata.customer_name_en || null,
          customer_initials: originalMetadata.customer_initials || null,
          date_folder: originalMetadata.date_folder || null,
          english_filename: outputFileName,
          original_filename: originalMetadata.original_filename || outputFileName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: saveError } = await supabase
          .from('image_metadata')
          .upsert(newMetadata, {
            onConflict: 'image_url',
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

    console.log('✅ GIF 변환 완료:', urlData.publicUrl);

    res.json({
      success: true,
      imageUrl: urlData.publicUrl,
      fileName: outputFileName,
      size: gifSize
    });

  } catch (error) {
    console.error('❌ GIF 변환 오류:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        error: error.message || 'GIF 변환 중 오류가 발생했습니다.' 
      });
    }
  } finally {
    // 임시 파일 정리
    try {
      if (tempVideoPath && fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
      }
      if (tempGifPath && fs.existsSync(tempGifPath)) {
        fs.unlinkSync(tempGifPath);
      }
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir);
      }
    } catch (cleanupError) {
      console.warn('⚠️ 임시 파일 정리 실패:', cleanupError);
    }
  }
}
