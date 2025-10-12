// MD 파일 저장 API
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { files } = req.body;

  if (!files || !Array.isArray(files)) {
    return res.status(400).json({ success: false, message: '파일 데이터가 필요합니다.' });
  }

  try {
    // 기존 MD 파일들 삭제
    const { error: deleteError } = await supabase
      .from('md_reference_files')
      .delete()
      .neq('id', 0); // 모든 레코드 삭제

    if (deleteError) {
      console.error('기존 파일 삭제 오류:', deleteError);
    }

    // 새 파일들 저장
    const filesToInsert = files.map(file => ({
      filename: file.name,
      file_type: file.type || 'text/plain',
      file_size: file.size || 0,
      content: file.content,
      uploaded_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('md_reference_files')
      .insert(filesToInsert)
      .select();

    if (error) {
      console.error('MD 파일 저장 오류:', error);
      return res.status(500).json({
        success: false,
        message: 'MD 파일 저장 실패',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: `${files.length}개의 MD 파일이 저장되었습니다.`,
      savedFiles: data
    });

  } catch (error) {
    console.error('MD 파일 저장 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: 'MD 파일 저장 실패',
      error: error.message
    });
  }
}
