// 이미지 버전 관리 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('🔍 이미지 버전 관리 API 요청:', req.method, req.url);
  
  try {
    if (req.method === 'GET') {
      // 이미지 버전 정보 조회
      const { imageId } = req.query;
      
      if (!imageId) {
        return res.status(400).json({
          error: 'imageId 파라미터가 필요합니다.'
        });
      }

      // 메타데이터에서 버전 정보 조회
      const { data: metadata, error } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('id', imageId)
        .single();

      if (error) {
        console.error('❌ 메타데이터 조회 에러:', error);
        return res.status(500).json({
          error: '메타데이터를 불러올 수 없습니다.',
          details: error.message
        });
      }

      // 버전 정보 파싱
      const versions = metadata.versions ? JSON.parse(metadata.versions) : {};
      
      return res.status(200).json({
        imageId,
        versions,
        metadata
      });
      
    } else if (req.method === 'POST') {
      // 이미지 버전 생성/업데이트
      const { imageId, versions, baseFileName, imageBuffer } = req.body;
      
      if (!imageId || !versions || !baseFileName) {
        return res.status(400).json({
          error: 'imageId, versions, baseFileName이 필요합니다.'
        });
      }

      const createdVersions = {};
      const errors = [];

      // 각 버전별로 파일 생성
      for (const [versionType, config] of Object.entries(versions)) {
        try {
          const fileName = `${baseFileName}_${versionType}.${config.extension}`;
          
          // Sharp로 이미지 처리
          let processedBuffer = imageBuffer;
          if (config.resize) {
            // Sharp 동적 import (Vercel 환경 호환성)
            const sharp = (await import('sharp')).default;
            processedBuffer = await sharp(imageBuffer)
              .resize(config.resize.width, config.resize.height, config.resize.options || {})
              .jpeg({ quality: config.quality || 80 })
              .toBuffer();
          }

          // Supabase Storage에 업로드
          const { data, error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(fileName, processedBuffer, {
              contentType: `image/${config.extension}`,
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error(`❌ ${versionType} 버전 업로드 에러:`, uploadError);
            errors.push(`${versionType}: ${uploadError.message}`);
            continue;
          }

          // 공개 URL 생성
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(fileName);

          createdVersions[versionType] = {
            fileName,
            url: urlData.publicUrl,
            size: processedBuffer.length,
            width: config.resize?.width,
            height: config.resize?.height
          };

          console.log(`✅ ${versionType} 버전 생성 완료:`, fileName);
          
        } catch (error) {
          console.error(`❌ ${versionType} 버전 생성 오류:`, error);
          errors.push(`${versionType}: ${error.message}`);
        }
      }

      // 메타데이터에 버전 정보 저장
      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({
          versions: JSON.stringify(createdVersions),
          updated_at: new Date().toISOString()
        })
        .eq('id', imageId);

      if (updateError) {
        console.error('❌ 메타데이터 업데이트 에러:', updateError);
        return res.status(500).json({
          error: '메타데이터 업데이트에 실패했습니다.',
          details: updateError.message
        });
      }

      return res.status(200).json({
        success: true,
        versions: createdVersions,
        errors: errors.length > 0 ? errors : null
      });
      
    } else if (req.method === 'DELETE') {
      // 특정 버전 삭제
      const { imageId, versionType } = req.body;
      
      if (!imageId || !versionType) {
        return res.status(400).json({
          error: 'imageId와 versionType이 필요합니다.'
        });
      }

      // 메타데이터에서 버전 정보 조회
      const { data: metadata, error: fetchError } = await supabase
        .from('image_metadata')
        .select('versions')
        .eq('id', imageId)
        .single();

      if (fetchError) {
        return res.status(500).json({
          error: '메타데이터 조회에 실패했습니다.',
          details: fetchError.message
        });
      }

      const versions = metadata.versions ? JSON.parse(metadata.versions) : {};
      
      if (!versions[versionType]) {
        return res.status(404).json({
          error: '해당 버전을 찾을 수 없습니다.'
        });
      }

      // 스토리지에서 파일 삭제
      const { error: deleteError } = await supabase.storage
        .from('blog-images')
        .remove([versions[versionType].fileName]);

      if (deleteError) {
        console.error('❌ 파일 삭제 에러:', deleteError);
        return res.status(500).json({
          error: '파일 삭제에 실패했습니다.',
          details: deleteError.message
        });
      }

      // 메타데이터에서 버전 정보 제거
      delete versions[versionType];
      
      const { error: updateError } = await supabase
        .from('image_metadata')
        .update({
          versions: JSON.stringify(versions),
          updated_at: new Date().toISOString()
        })
        .eq('id', imageId);

      if (updateError) {
        return res.status(500).json({
          error: '메타데이터 업데이트에 실패했습니다.',
          details: updateError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: `${versionType} 버전이 삭제되었습니다.`
      });
      
    } else {
      return res.status(405).json({
        error: '지원하지 않는 HTTP 메서드입니다.'
      });
    }
    
  } catch (error) {
    console.error('❌ 이미지 버전 관리 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
