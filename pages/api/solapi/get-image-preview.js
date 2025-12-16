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

/**
 * Supabase Storage URL이 실제 객체를 가리키는지 확인
 * - blog-images 버킷 기준으로만 동작 (현재 Solapi 이미지는 blog-images에만 저장)
 * - URL이 Storage public URL 형식이 아니면 true 반환 (검증 불가 → 그대로 사용)
 */
async function ensureSupabaseObjectExists(publicUrl) {
  try {
    if (!publicUrl || typeof publicUrl !== 'string') return false;

    const match = publicUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (!match) {
      // Supabase Storage URL 형식이 아니면 검증하지 않고 true로 취급
      return true;
    }

    const bucket = match[1];
    const fullPath = decodeURIComponent(match[2]);

    // 현재 Solapi 이미지는 blog-images 버킷만 사용
    if (bucket !== 'blog-images') {
      return true;
    }

    const lastSlashIndex = fullPath.lastIndexOf('/');
    const folderPath = lastSlashIndex > -1 ? fullPath.slice(0, lastSlashIndex) : '';
    const fileName = lastSlashIndex > -1 ? fullPath.slice(lastSlashIndex + 1) : fullPath;

    const { data: files, error } = await supabase.storage
      .from(bucket)
      .list(folderPath, {
        limit: 1000
      });

    if (error) {
      console.error('⚠️ Supabase 객체 존재 여부 확인 실패:', error.message);
      return false;
    }

    if (!files || files.length === 0) {
      return false;
    }

    return files.some((f) => f.name === fileName);
  } catch (err) {
    console.error('⚠️ Supabase 객체 존재 여부 확인 중 예외:', err.message);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { imageId, messageId, redirect } = req.query;

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
        const candidateUrl = metadataImages[0].image_url;
        const exists = await ensureSupabaseObjectExists(candidateUrl);

        if (exists) {
          console.log('✅ 메시지 ID 기반 메타데이터 이미지 재사용:', candidateUrl);
        if (redirect === 'true') {
            return res.redirect(candidateUrl);
        }
        return res.status(200).json({
          success: true,
            imageUrl: candidateUrl,
          source: 'metadata-by-message-id'
        });
        }

        console.warn(
          '⚠️ 메시지 ID 기반 메타데이터가 가리키는 Supabase 객체가 존재하지 않습니다. Solapi에서 재다운로드 시도:',
          { imageId, candidateUrl }
        );
      }
    }

    // 방법 2: image_metadata 테이블에서 Solapi imageId로 직접 이미지 찾기
    // ⭐ 수정: upload_source 조건 제거하여 더 많은 이미지 찾기
    const { data: metadataImages2, error: metadataError2 } = await supabase
      .from('image_metadata')
      .select('image_url, folder_path')
      .contains('tags', [`solapi-${imageId}`])
      .order('created_at', { ascending: true }) // 가장 오래된 것 우선 (중복 방지)
      .limit(1);

    if (!metadataError2 && metadataImages2 && metadataImages2.length > 0) {
      const existingImageUrl = metadataImages2[0].image_url;
      // Supabase URL인지 확인
      if (existingImageUrl && existingImageUrl.includes('supabase.co')) {
        const exists = await ensureSupabaseObjectExists(existingImageUrl);

        if (exists) {
        console.log('✅ 기존 Solapi 이미지 재사용:', existingImageUrl);
        if (redirect === 'true') {
          return res.redirect(existingImageUrl);
        }
        return res.status(200).json({
          success: true,
          imageUrl: existingImageUrl,
          source: 'metadata-existing'
        });
        }

        console.warn(
          '⚠️ solapi- 태그 기반 메타데이터가 가리키는 Supabase 객체가 존재하지 않습니다. Solapi에서 재다운로드 시도:',
          { imageId, existingImageUrl }
        );
      }
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
          
          // ⭐ 중복 방지: 같은 imageId의 이미지가 이미 있는지 먼저 확인 (upload_source 조건 제거)
          const { data: existingImages } = await supabase
            .from('image_metadata')
            .select('image_url, folder_path')
            .contains('tags', [`solapi-${imageId}`])
            .limit(1);

          if (existingImages && existingImages.length > 0) {
            const existingUrl = existingImages[0].image_url;
            if (existingUrl && existingUrl.includes('supabase.co')) {
              console.log('✅ 기존 Solapi 이미지 재사용 (다운로드 전):', existingUrl);
              if (redirect === 'true') {
                return res.redirect(existingUrl);
              }
              return res.status(200).json({
                success: true,
                imageUrl: existingUrl,
                source: 'metadata-existing'
              });
            }
          }

          // 파일명 생성 (타임스탬프 제거하여 중복 방지)
          const fileName = `solapi-${imageId}.jpg`;
          // ✅ Solapi 이미지는 solapi/ 폴더를 canonical 위치로 사용
          const storagePath = `solapi/${fileName}`;

          // ⭐ 중복 확인: 같은 파일명이 이미 있는지 확인
          const { data: existingFiles } = await supabase.storage
            .from('blog-images')
            .list('solapi', {
              limit: 1000
            });

          let finalUrl = null;
          let shouldUpload = true;

          // 같은 파일명이 있는지 확인
          if (existingFiles) {
            const existingFile = existingFiles.find(f => f.name === fileName);
            if (existingFile) {
              // 기존 파일이 있으면 재사용
              const { data: urlData } = supabase.storage
                .from('blog-images')
                .getPublicUrl(storagePath);
              finalUrl = urlData?.publicUrl;
              shouldUpload = false;
              console.log('✅ 기존 Solapi 이미지 파일 재사용:', finalUrl);
              if (redirect === 'true' && finalUrl) {
                return res.redirect(finalUrl);
              }
            }
          }

          if (shouldUpload) {
            // 새로 업로드
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

            const { data: urlData } = supabase.storage
              .from('blog-images')
              .getPublicUrl(storagePath);
            finalUrl = urlData?.publicUrl;
          }

          if (finalUrl) {

            // image_metadata에 저장 (태그 포함, 중복 방지)
            // messageId가 query에 있으면 태그 추가
            const { messageId } = req.query;
            try {
              const tags = ['solapi-permanent', `solapi-${imageId}`];
              if (messageId) {
                tags.push(`sms-${messageId}`);
              }

              // ⭐ 중복 확인: 같은 imageId의 메타데이터가 이미 있는지 확인
              const { data: existingMetadata } = await supabase
                .from('image_metadata')
                .select('id, tags')
                .contains('tags', [`solapi-${imageId}`])
                .eq('image_url', finalUrl)
                .limit(1);

              if (existingMetadata && existingMetadata.length > 0) {
                // 기존 메타데이터가 있으면 태그만 업데이트
                const existingTags = existingMetadata[0].tags || [];
                const newTags = [...new Set([...existingTags, ...tags])];
                
                await supabase
                  .from('image_metadata')
                  .update({
                    tags: newTags,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existingMetadata[0].id);
                
                console.log('✅ 기존 메타데이터 태그 업데이트');
              } else {
                // 새 메타데이터 생성
                const metadataPayload = {
                  image_url: finalUrl,
                  folder_path: storagePath,
                  source: 'mms',
                  channel: 'sms',
                  file_size: buffer.length,
                  format: 'jpg',
                  upload_source: 'solapi-permanent',
                  tags: tags,
                  title: messageId 
                    ? `MMS 이미지 (메시지 #${messageId}) - Solapi`
                    : `MMS 이미지 - Solapi`,
                  alt_text: `MMS 이미지`,
                  updated_at: new Date().toISOString()
                };

                await supabase
                  .from('image_metadata')
                  .upsert(metadataPayload, { onConflict: 'image_url' })
                  .catch(err => {
                    console.error('⚠️ image_metadata 저장 실패 (무시):', err.message);
                  });
              }
            } catch (err) {
              console.error('⚠️ 메타데이터 저장 오류 (무시):', err.message);
            }

            if (redirect === 'true') {
              return res.redirect(finalUrl);
            }
            return res.status(200).json({
              success: true,
              imageUrl: finalUrl,
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

