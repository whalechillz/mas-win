/**
 * 이미지 좋아요 토글 API
 * POST /api/admin/toggle-image-like
 * Body: { imageUrl: string, isLiked: boolean }
 */

import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, isLiked } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl이 필요합니다.' });
    }

    const supabase = createServerSupabase();

    // image_metadata에서 해당 이미지 찾기 (is_liked 컬럼이 없을 수 있으므로 id만 먼저 조회)
    const { data: existingMetadata, error: selectError } = await supabase
      .from('image_metadata')
      .select('id')
      .eq('image_url', imageUrl)
      .single();

    // PGRST116 = not found (정상적인 경우)
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('메타데이터 조회 오류:', selectError);
      // is_liked 컬럼이 없을 수 있으므로, 컬럼 에러인지 확인
      if (selectError.message && selectError.message.includes('is_liked')) {
        // is_liked 컬럼이 없으면 컬럼 추가 안내
        return res.status(500).json({
          error: 'is_liked 컬럼이 데이터베이스에 없습니다. 마이그레이션을 실행해주세요.',
          details: 'database/add-is-liked-column.sql 파일을 Supabase에서 실행하세요.'
        });
      }
      throw selectError;
    }

    // 최종 좋아요 상태 결정
    const finalIsLiked = isLiked !== undefined ? isLiked : true;

    if (existingMetadata) {
      // 기존 메타데이터 업데이트 (is_liked 컬럼이 없으면 에러 발생 가능)
      const { data: updatedData, error: updateError } = await supabase
        .from('image_metadata')
        .update({ 
          is_liked: finalIsLiked,
          updated_at: new Date().toISOString()
        })
        .eq('image_url', imageUrl)
        .select('is_liked')
        .single();

      if (updateError) {
        // is_liked 컬럼이 없으면 에러 발생
        if (updateError.message && updateError.message.includes('is_liked')) {
          return res.status(500).json({
            error: 'is_liked 컬럼이 데이터베이스에 없습니다. 마이그레이션을 실행해주세요.',
            details: 'database/add-is-liked-column.sql 파일을 Supabase에서 실행하세요.'
          });
        }
        console.error('좋아요 업데이트 오류:', updateError);
        throw updateError;
      }

      return res.status(200).json({
        success: true,
        isLiked: updatedData?.is_liked ?? finalIsLiked,
        message: '좋아요 상태가 업데이트되었습니다.'
      });
    } else {
      // 메타데이터가 없으면 생성 (is_liked 컬럼이 없으면 에러 발생 가능)
      const { data: insertedData, error: insertError } = await supabase
        .from('image_metadata')
        .insert({
          image_url: imageUrl,
          is_liked: finalIsLiked,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('is_liked')
        .single();

      if (insertError) {
        // is_liked 컬럼이 없으면 에러 발생
        if (insertError.message && insertError.message.includes('is_liked')) {
          return res.status(500).json({
            error: 'is_liked 컬럼이 데이터베이스에 없습니다. 마이그레이션을 실행해주세요.',
            details: 'database/add-is-liked-column.sql 파일을 Supabase에서 실행하세요.'
          });
        }
        console.error('좋아요 생성 오류:', insertError);
        throw insertError;
      }

      return res.status(200).json({
        success: true,
        isLiked: insertedData?.is_liked ?? finalIsLiked,
        message: '좋아요가 추가되었습니다.'
      });
    }
  } catch (error) {
    console.error('좋아요 토글 오류:', error);
    return res.status(500).json({
      error: '좋아요 토글에 실패했습니다.',
      details: error.message
    });
  }
}

