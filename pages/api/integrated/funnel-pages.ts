import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabase(req, res);

  // 인증 확인
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method, query, body } = req;

  try {
    switch (method) {
      case 'GET':
        if (query.funnel_plan_id) {
          // 특정 퍼널 계획의 페이지 조회
          const { data, error } = await supabase
            .from('funnel_pages')
            .select('*')
            .eq('funnel_plan_id', query.funnel_plan_id);

          if (error) throw error;

          return res.status(200).json({ data });
        } else if (query.id) {
          // 특정 페이지 조회
          const { data, error } = await supabase
            .from('funnel_pages')
            .select('*')
            .eq('id', query.id)
            .single();

          if (error) throw error;

          return res.status(200).json({ data });
        } else {
          // 전체 페이지 목록
          const { data, error } = await supabase
            .from('funnel_pages')
            .select(`
              *,
              monthly_funnel_plans (
                year,
                month,
                theme
              )
            `)
            .order('created_at', { ascending: false });

          if (error) throw error;

          return res.status(200).json({ data });
        }

      case 'POST':
        // 새 퍼널 페이지 생성
        const { 
          funnel_plan_id,
          main_image,
          sub_images,
          content,
          page_url
        } = body;

        if (!funnel_plan_id) {
          return res.status(400).json({ error: 'funnel_plan_id가 필요합니다.' });
        }

        const { data: newPage, error: createError } = await supabase
          .from('funnel_pages')
          .insert({
            funnel_plan_id,
            main_image: main_image || {
              path: '',
              prompt: '',
              generatedBy: 'manual'
            },
            sub_images: sub_images || [],
            content: content || {
              headline: '',
              subheadline: '',
              cta: '',
              benefits: []
            },
            page_url,
            page_status: 'draft'
          })
          .select()
          .single();

        if (createError) throw createError;

        return res.status(201).json({ data: newPage });

      case 'PUT':
        // 퍼널 페이지 수정
        const { id } = query;
        if (!id) {
          return res.status(400).json({ error: 'ID가 필요합니다.' });
        }

        const updateData: any = {};
        
        // 업데이트할 필드만 추가
        if (body.main_image !== undefined) updateData.main_image = body.main_image;
        if (body.sub_images !== undefined) updateData.sub_images = body.sub_images;
        if (body.content !== undefined) updateData.content = body.content;
        if (body.page_url !== undefined) updateData.page_url = body.page_url;
        if (body.page_status !== undefined) updateData.page_status = body.page_status;

        const { data: updatedPage, error: updateError } = await supabase
          .from('funnel_pages')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        return res.status(200).json({ data: updatedPage });

      case 'DELETE':
        // 퍼널 페이지 삭제
        const { id: deleteId } = query;
        if (!deleteId) {
          return res.status(400).json({ error: 'ID가 필요합니다.' });
        }

        const { error: deleteError } = await supabase
          .from('funnel_pages')
          .delete()
          .eq('id', deleteId);

        if (deleteError) throw deleteError;

        return res.status(200).json({ success: true });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('Funnel Pages API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      details: error 
    });
  }
}
