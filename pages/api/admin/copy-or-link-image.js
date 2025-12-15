/**
 * 이미지 복사 또는 링크 생성 API
 * - 복사: 실제 파일을 대상 폴더에 복사하고 새 메타데이터 생성
 * - 링크: 기존 이미지에 태그만 추가 (파일 복사 없음)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageUrl, targetFolder, action, messageId } = req.body;

    if (!imageUrl || !targetFolder || !action) {
      return res.status(400).json({ 
        error: 'imageUrl, targetFolder, action이 필요합니다.',
        action: 'copy 또는 link'
      });
    }

    if (action !== 'copy' && action !== 'link') {
      return res.status(400).json({ 
        error: 'action은 "copy" 또는 "link"여야 합니다.'
      });
    }

    console.log('📋 이미지 복사/링크 작업 시작:', {
      imageUrl: imageUrl.substring(0, 50) + '...',
      targetFolder,
      action,
      messageId
    });

    // URL에서 경로 추출
    const extractPathFromUrl = (url) => {
      const match = url.match(/blog-images\/([^?]+)/);
      if (match) {
        return match[1];
      }
      if (!url.includes('http') && !url.includes('storage')) {
        return url;
      }
      return null;
    };

    const sourcePath = extractPathFromUrl(imageUrl);
    if (!sourcePath) {
      return res.status(400).json({ 
        error: '이미지 URL에서 경로를 추출할 수 없습니다.',
        imageUrl 
      });
    }

    const fileName = sourcePath.split('/').pop();
    const targetPath = `${targetFolder}/${fileName}`;

    if (action === 'copy') {
      // 복사 작업
      console.log('📁 이미지 복사 중:', { sourcePath, targetPath });

      // 1. 원본 파일 다운로드
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('blog-images')
        .download(sourcePath);

      if (downloadError) {
        console.error('❌ 파일 다운로드 실패:', downloadError);
        return res.status(500).json({
          error: '원본 파일을 다운로드할 수 없습니다.',
          details: downloadError.message
        });
      }

      // 2. 대상 폴더에 파일 업로드
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(targetPath, fileData, {
          contentType: fileData.type || 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message.includes('duplicate') || uploadError.message.includes('already exists')) {
          return res.status(400).json({
            error: '대상 폴더에 이미 같은 파일이 있습니다.',
            targetPath
          });
        }
        throw uploadError;
      }

      // 3. 새 공개 URL 생성
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(targetPath);

      // 4. 기존 메타데이터 조회 (태그 등 복사)
      const { data: sourceMetadata } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('image_url', imageUrl)
        .maybeSingle();

      // 5. 새 메타데이터 생성
      const newTags = [];
      if (messageId) {
        newTags.push(`sms-${messageId}`);
      }
      if (sourceMetadata?.tags) {
        const existingTags = Array.isArray(sourceMetadata.tags) ? sourceMetadata.tags : [sourceMetadata.tags];
        newTags.push(...existingTags.filter(tag => !tag.startsWith('sms-')));
      }
      if (newTags.length === 0) {
        newTags.push('mms');
      }

      const dateFolder = targetFolder.match(/\d{4}-\d{2}-\d{2}/)?.[0] || null;

      const { data: newMetadata, error: metadataError } = await supabase
        .from('image_metadata')
        .insert({
          image_url: urlData.publicUrl,
          folder_path: targetFolder,
          date_folder: dateFolder,
          original_path: targetPath,
          source: 'mms',
          channel: 'sms',
          tags: newTags,
          alt_text: sourceMetadata?.alt_text || null,
          title: sourceMetadata?.title || `복사본 - ${fileName}`,
          description: sourceMetadata?.description || null,
          file_size: fileData.size || null,
          upload_source: 'copy',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (metadataError) {
        console.error('⚠️ 메타데이터 생성 실패:', metadataError);
        // 파일은 복사되었으므로 계속 진행
      }

      console.log('✅ 이미지 복사 완료:', urlData.publicUrl);

      return res.status(200).json({
        success: true,
        action: 'copy',
        newImageUrl: urlData.publicUrl,
        targetPath,
        message: '이미지가 성공적으로 복사되었습니다.'
      });

    } else if (action === 'link') {
      // 링크 작업 (태그만 추가)
      console.log('🔗 이미지 링크 생성 중:', { imageUrl, targetFolder, messageId });

      // 1. 기존 메타데이터 조회
      const { data: existingMetadata, error: findError } = await supabase
        .from('image_metadata')
        .select('*')
        .eq('image_url', imageUrl)
        .maybeSingle();

      if (findError && findError.code !== 'PGRST116') {
        console.error('❌ 메타데이터 조회 실패:', findError);
        return res.status(500).json({
          error: '메타데이터 조회 실패',
          details: findError.message
        });
      }

      if (!existingMetadata) {
        // 메타데이터가 없으면 생성
        const dateFolder = targetFolder.match(/\d{4}-\d{2}-\d{2}/)?.[0] || null;
        const tags = messageId ? [`sms-${messageId}`, 'mms'] : ['mms'];

        const { data: newMetadata, error: createError } = await supabase
          .from('image_metadata')
          .insert({
            image_url: imageUrl,
            folder_path: sourcePath.split('/').slice(0, -1).join('/'), // 원본 폴더
            date_folder: dateFolder,
            source: 'mms',
            channel: 'sms',
            tags: tags,
            upload_source: 'link',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ 메타데이터 생성 실패:', createError);
          return res.status(500).json({
            error: '메타데이터 생성 실패',
            details: createError.message
          });
        }

        console.log('✅ 링크 메타데이터 생성 완료');

        return res.status(200).json({
          success: true,
          action: 'link',
          imageUrl: imageUrl,
          targetFolder,
          message: '이미지 링크가 생성되었습니다.'
        });
      }

      // 2. 기존 메타데이터에 태그 추가
      const existingTags = existingMetadata.tags || [];
      const newTag = messageId ? `sms-${messageId}` : null;

      if (newTag && !existingTags.includes(newTag)) {
        const updatedTags = [...existingTags, newTag];

        const { error: updateError } = await supabase
          .from('image_metadata')
          .update({
            tags: updatedTags,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMetadata.id);

        if (updateError) {
          console.error('❌ 태그 업데이트 실패:', updateError);
          return res.status(500).json({
            error: '태그 업데이트 실패',
            details: updateError.message
          });
        }

        console.log('✅ 태그 추가 완료:', newTag);

        return res.status(200).json({
          success: true,
          action: 'link',
          imageUrl: imageUrl,
          targetFolder,
          tags: updatedTags,
          message: '이미지 링크가 생성되었습니다.'
        });
      } else {
        console.log('ℹ️  태그가 이미 존재합니다:', newTag);
        return res.status(200).json({
          success: true,
          action: 'link',
          imageUrl: imageUrl,
          targetFolder,
          tags: existingTags,
          message: '이미지 링크가 이미 존재합니다.'
        });
      }
    }

  } catch (error) {
    console.error('❌ 이미지 복사/링크 오류:', error);
    return res.status(500).json({
      error: '이미지 복사/링크 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}





