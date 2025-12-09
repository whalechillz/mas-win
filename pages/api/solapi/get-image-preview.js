/**
 * Solapi imageId로 이미지 프리뷰 URL 가져오기
 * image_metadata 테이블에서 해당 imageId를 가진 이미지를 찾거나,
 * Solapi Storage API를 통해 이미지를 다운로드하여 Supabase에 임시 저장
 */

import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../../../utils/solapiSignature';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || '';
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { imageId } = req.query;

  if (!imageId) {
    return res.status(400).json({ success: false, message: 'imageId가 필요합니다.' });
  }

  if (!supabase) {
    return res.status(500).json({
      success: false,
      message: 'Supabase 환경 변수가 설정되지 않았습니다.'
    });
  }

  try {
    // 방법 1: channel_sms 테이블에서 해당 imageId를 가진 메시지 찾기
    // 그 메시지 ID로 image_metadata에서 이미지 찾기
    const { data: smsMessages, error: smsError } = await supabase
      .from('channel_sms')
      .select('id')
      .eq('image_url', imageId)
      .limit(1);

    if (!smsError && smsMessages && smsMessages.length > 0) {
      const messageId = smsMessages[0].id;
      const tag = `sms-${messageId}`;
      
      // image_metadata에서 해당 메시지의 이미지 찾기
      const { data: metadataImages, error: metadataError } = await supabase
        .from('image_metadata')
        .select('image_url')
        .contains('tags', [tag])
        .eq('source', 'mms')
        .eq('channel', 'sms')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!metadataError && metadataImages && metadataImages.length > 0) {
        return res.status(200).json({
          success: true,
          imageUrl: metadataImages[0].image_url,
          source: 'metadata-by-message-id'
        });
      }
    }

    // 방법 2: image_metadata 테이블에서 Solapi imageId로 직접 이미지 찾기
    // (이미지 업로드 시 Solapi imageId를 메타데이터로 저장했다고 가정)
    const { data: metadataImages2, error: metadataError2 } = await supabase
      .from('image_metadata')
      .select('image_url')
      .or(`tags.cs.{solapi-${imageId}},metadata->>solapiImageId.eq.${imageId}`)
      .limit(1);

    if (!metadataError2 && metadataImages2 && metadataImages2.length > 0) {
      return res.status(200).json({
        success: true,
        imageUrl: metadataImages2[0].image_url,
        source: 'metadata'
      });
    }

    // 방법 2: Solapi Storage API를 통해 이미지 다운로드
    // 주의: Solapi Storage는 직접적인 HTTP URL을 제공하지 않으므로,
    // 이미지를 다운로드하여 Supabase에 임시 저장하거나,
    // 또는 Solapi Storage의 다운로드 엔드포인트를 프록시로 사용해야 함
    
    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Solapi 환경 변수가 설정되지 않았습니다.'
      });
    }

    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);
    
    // Solapi Storage 다운로드 URL 시도
    const downloadUrls = [
      `https://api.solapi.com/storage/v1/files/${imageId}/download`,
      `https://api.solapi.com/storage/v1/files/${imageId}`,
    ];

    for (const downloadUrl of downloadUrls) {
      try {
        const downloadResponse = await fetch(downloadUrl, {
          method: 'GET',
          headers: authHeaders
        });

        if (downloadResponse.ok) {
          // 이미지를 다운로드하여 Supabase에 임시 저장
          const arrayBuffer = await downloadResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // 임시 파일명 생성
          const fileName = `solapi-${imageId}-${Date.now()}.jpg`;
          const storagePath = `temp/solapi/${fileName}`;

          // Supabase Storage에 업로드
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(storagePath, buffer, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (uploadError) {
            console.error('Supabase 업로드 오류:', uploadError);
            continue;
          }

          // 공개 URL 생성
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(storagePath);

          if (urlData?.publicUrl) {
            // image_metadata에 임시 저장 (태그 포함)
            // messageId가 query에 있으면 태그 추가
            const { messageId } = req.query;
            if (messageId) {
              try {
                const tag = `sms-${messageId}`;
                const metadataPayload = {
                  image_url: urlData.publicUrl,
                  folder_path: storagePath,
                  source: 'mms',
                  channel: 'sms',
                  file_size: buffer.length,
                  format: 'jpg',
                  upload_source: 'solapi-temp',
                  tags: [tag, 'solapi-temp', `solapi-${imageId}`],
                  title: `MMS 이미지 (메시지 #${messageId}) - Solapi 임시`,
                  alt_text: `MMS 이미지`,
                  updated_at: new Date().toISOString()
                };

                await supabase
                  .from('image_metadata')
                  .upsert(metadataPayload, { onConflict: 'image_url' })
                  .catch(err => {
                    console.error('⚠️ image_metadata 저장 실패 (무시):', err.message);
                  });
              } catch (err) {
                // 메타데이터 저장 실패는 무시 (임시 파일이므로)
              }
            }

            return res.status(200).json({
              success: true,
              imageUrl: urlData.publicUrl,
              source: 'solapi-download'
            });
          }
        }
      } catch (error) {
        console.error(`다운로드 URL 시도 실패 (${downloadUrl}):`, error.message);
        continue;
      }
    }

    // 모든 방법 실패
    return res.status(404).json({
      success: false,
      message: '이미지를 찾을 수 없습니다.'
    });

  } catch (error) {
    console.error('이미지 프리뷰 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '이미지 프리뷰 조회 중 오류가 발생했습니다.'
    });
  }
}

