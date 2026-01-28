/**
 * 고객 이미지 파일 이동/이름 변경 API
 * 임시 파일을 최종 파일명으로 이동하고 메타데이터 업데이트
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'blog-images';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { metadataId, finalFileName, finalFilePath } = req.body;

    if (!metadataId || !finalFileName || !finalFilePath) {
      return res.status(400).json({
        error: 'metadataId, finalFileName, finalFilePath가 필요합니다.'
      });
    }

    console.log('📥 [move-customer-image-file] 요청 수신:', {
      metadataId,
      finalFileName,
      finalFilePath: finalFilePath.substring(0, 100)
    });

    // 1. 메타데이터에서 임시 파일 정보 가져오기
    const { data: metadata, error: fetchError } = await supabase
      .from('image_assets')
      .select('cdn_url, file_path, filename')
      .eq('id', metadataId)
      .single();

    if (fetchError || !metadata) {
      console.error('❌ [move-customer-image-file] 메타데이터 조회 실패:', fetchError);
      return res.status(404).json({
        error: '메타데이터를 찾을 수 없습니다.'
      });
    }

    console.log('📦 [move-customer-image-file] 메타데이터 조회 완료:', {
      tempFilePath: metadata.file_path?.substring(0, 100),
      tempUrl: metadata.cdn_url?.substring(0, 100)
    });

    // 2. 임시 파일을 최종 경로로 이동 (Supabase Storage move 사용)
    const tempFilePath = metadata.file_path;
    if (!tempFilePath) {
      return res.status(400).json({
        error: '임시 파일 경로가 없습니다.'
      });
    }

    console.log('📁 [move-customer-image-file] 파일 이동 시작:', {
      from: tempFilePath.substring(0, 100),
      to: finalFilePath.substring(0, 100)
    });

    // Supabase Storage move 사용 (복사 후 삭제보다 효율적)
    const { data: moveData, error: moveError } = await supabase.storage
      .from(bucketName)
      .move(tempFilePath, finalFilePath);

    if (moveError) {
      // 이미 존재하는 파일인 경우 (중복)
      if (moveError.message?.includes('already exists') || moveError.statusCode === '409') {
        console.log('⚠️ [move-customer-image-file] 파일이 이미 존재함, 메타데이터만 업데이트');
        // 메타데이터만 업데이트 (파일은 이미 존재)
      } else {
        console.error('❌ [move-customer-image-file] 파일 이동 실패:', moveError);
        // move 실패 시 복사 후 삭제 방식으로 시도
        try {
          // 파일 다운로드
          const { data: fileData, error: readError } = await supabase.storage
            .from(bucketName)
            .download(tempFilePath);

          if (readError || !fileData) {
            throw new Error(`임시 파일 읽기 실패: ${readError?.message}`);
          }

          // 파일을 Buffer로 변환
          const fileBlob = await fileData.arrayBuffer();
          const fileBuffer = Buffer.from(fileBlob);

          // 최종 경로에 파일 업로드
          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(finalFilePath, fileBuffer, {
              contentType: metadata.mime_type || 'image/webp',
              upsert: false
            });

          if (uploadError) {
            throw new Error(`최종 파일 업로드 실패: ${uploadError.message}`);
          }

          // 임시 파일 삭제
          await supabase.storage
            .from(bucketName)
            .remove([tempFilePath]);

          console.log('✅ [move-customer-image-file] 파일 복사 후 삭제 완료');
        } catch (copyError: any) {
          console.error('❌ [move-customer-image-file] 파일 복사 방식도 실패:', copyError);
          return res.status(500).json({
            error: '파일 이동 실패: ' + copyError.message
          });
        }
      }
    } else {
      console.log('✅ [move-customer-image-file] 파일 이동 완료');
    }

    // 3. 최종 파일의 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(finalFilePath);

    console.log('✅ [move-customer-image-file] 최종 파일 URL 생성:', {
      finalFilePath: finalFilePath.substring(0, 100),
      publicUrl: publicUrl.substring(0, 100)
    });

    // 4. 메타데이터 업데이트 (cdn_url 중복 처리)
    // ✅ cdn_url unique constraint 위반 방지: 기존 cdn_url이 있으면 null로 설정
    let finalPublicUrl = publicUrl;
    
    // cdn_url 중복 확인
    const { data: existingImageWithUrl, error: checkUrlError } = await supabase
      .from('image_assets')
      .select('id, cdn_url')
      .eq('cdn_url', publicUrl)
      .neq('id', metadataId) // 현재 메타데이터 제외
      .maybeSingle();

    if (existingImageWithUrl) {
      console.warn('⚠️ [move-customer-image-file] cdn_url 중복 발견, 기존 이미지의 cdn_url을 null로 설정');
      
      // 기존 이미지의 cdn_url을 null로 설정 (unique constraint 위반 방지)
      await supabase
        .from('image_assets')
        .update({ cdn_url: null })
        .eq('id', existingImageWithUrl.id);
      
      console.log('✅ [move-customer-image-file] 기존 이미지의 cdn_url 제거 완료');
    }

    const { data: updatedMetadata, error: updateError } = await supabase
      .from('image_assets')
      .update({
        filename: finalFileName,
        file_path: finalFilePath,
        cdn_url: finalPublicUrl,
        status: 'active' // pending → active
      })
      .eq('id', metadataId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [move-customer-image-file] 메타데이터 업데이트 실패:', updateError);
      
      // cdn_url unique constraint 위반인 경우 더 자세한 에러 메시지
      if (updateError.message?.includes('idx_image_assets_cdn_url_unique') || 
          updateError.message?.includes('duplicate key')) {
        return res.status(409).json({
          error: '이미 같은 URL의 이미지가 존재합니다. 파일명 순번을 자동으로 증가시켜 다시 시도해주세요.',
          details: updateError.message,
          code: 'DUPLICATE_CDN_URL'
        });
      }
      
      return res.status(500).json({
        error: '메타데이터 업데이트 실패: ' + updateError.message
      });
    }

    console.log('✅ [move-customer-image-file] 메타데이터 업데이트 완료');

    // 5. 임시 파일 삭제 (선택적 - 실패해도 계속 진행)
    try {
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([tempFilePath]);

      if (deleteError) {
        console.warn('⚠️ [move-customer-image-file] 임시 파일 삭제 실패 (무시):', deleteError);
      } else {
        console.log('✅ [move-customer-image-file] 임시 파일 삭제 완료');
      }
    } catch (deleteErr) {
      console.warn('⚠️ [move-customer-image-file] 임시 파일 삭제 중 오류 (무시):', deleteErr);
    }

    return res.status(200).json({
      success: true,
      metadata: updatedMetadata,
      finalFilePath,
      finalUrl: publicUrl
    });

  } catch (error: any) {
    console.error('❌ [move-customer-image-file] 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '파일 이동 중 오류가 발생했습니다.'
    });
  }
}
