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

    // 1. Supabase Storage에서 파일명 변경
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('images')
      .download(oldName);

    if (downloadError) {
      console.error('❌ 파일 다운로드 오류:', downloadError);
      return res.status(404).json({ error: 'File not found in storage' });
    }

    // 새 파일명으로 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(newName, downloadData, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ 파일 업로드 오류:', uploadError);
      return res.status(500).json({ error: 'Failed to upload renamed file' });
    }

    // 2. 기존 파일 삭제
    const { error: deleteError } = await supabase.storage
      .from('images')
      .remove([oldName]);

    if (deleteError) {
      console.error('❌ 기존 파일 삭제 오류:', deleteError);
      // 새 파일은 업로드되었으므로 계속 진행
    }

    // 3. 데이터베이스에서 메타데이터 업데이트
    const { error: updateError } = await supabase
      .from('image_metadata')
      .update({ 
        name: newName,
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
      newUrl: uploadData.path
    });

  } catch (error) {
    console.error('❌ 파일명 변경 오류:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
