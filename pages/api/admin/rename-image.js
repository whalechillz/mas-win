import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { oldName, newName } = req.body;

    if (!oldName || !newName) {
      return res.status(400).json({ error: 'oldName and newName are required' });
    }

    if (oldName === newName) {
      return res.status(200).json({ message: 'No change needed' });
    }

    console.log('📝 파일명 변경 요청:', oldName, '→', newName);

    // 1. 먼저 데이터베이스에서 파일 정보 확인
    const { data: dbImage, error: dbError } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('name', oldName)
      .single();

    if (dbError || !dbImage) {
      console.error('❌ 데이터베이스에서 파일을 찾을 수 없음:', dbError);
      return res.status(404).json({ error: 'File not found in database' });
    }

    console.log('📁 데이터베이스에서 찾은 파일:', dbImage);

    // 2. URL에서 버킷명 추출
    const url = dbImage.url;
    const bucketMatch = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\//);
    const bucketName = bucketMatch ? bucketMatch[1] : 'images';
    
    console.log('🪣 추출된 버킷명:', bucketName);

    // 3. Supabase Storage에서 파일 다운로드
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(oldName);

    if (downloadError) {
      console.error('❌ 파일 다운로드 오류:', downloadError);
      return res.status(404).json({ error: `File not found in storage bucket: ${bucketName}` });
    }

    // 4. 새 파일명으로 업로드 (같은 버킷에)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(newName, downloadData, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ 파일 업로드 오류:', uploadError);
      return res.status(500).json({ error: 'Failed to upload renamed file' });
    }

    // 5. 기존 파일 삭제
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([oldName]);

    if (deleteError) {
      console.error('❌ 기존 파일 삭제 오류:', deleteError);
      // 새 파일은 업로드되었으므로 계속 진행
    }

    // 6. 데이터베이스에서 메타데이터 업데이트 (새 URL 포함)
    const newUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${newName}`;
    const { error: updateError } = await supabase
      .from('image_metadata')
      .update({ 
        name: newName,
        url: newUrl,
        updated_at: new Date().toISOString()
      })
      .eq('name', oldName);

    if (updateError) {
      console.error('❌ 메타데이터 업데이트 오류:', updateError);
      return res.status(500).json({ error: 'Failed to update metadata' });
    }

    console.log('✅ 파일명 변경 완료:', oldName, '→', newName);

    res.status(200).json({ 
      message: 'File renamed successfully',
      oldName,
      newName,
      newUrl: newUrl,
      bucketName: bucketName
    });

  } catch (error) {
    console.error('❌ 파일명 변경 오류:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
