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
          // 특정 퍼널 계획의 콘텐츠 조회
          const { data, error } = await supabase
            .from('generated_contents')
            .select('*')
            .eq('funnel_plan_id', query.funnel_plan_id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          return res.status(200).json({ data });
        } else if (query.id) {
          // 특정 콘텐츠 조회
          const { data, error } = await supabase
            .from('generated_contents')
            .select(`
              *,
              monthly_funnel_plans (
                year,
                month,
                theme
              )
            `)
            .eq('id', query.id)
            .single();

          if (error) throw error;

          return res.status(200).json({ data });
        } else {
          // 전체 콘텐츠 목록 (필터 옵션)
          let query = supabase
            .from('generated_contents')
            .select(`
              *,
              monthly_funnel_plans (
                year,
                month,
                theme
              )
            `);

          // 채널 필터
          if (req.query.channel) {
            query = query.eq('channel', req.query.channel);
          }

          // 상태 필터
          if (req.query.status) {
            query = query.eq('status', req.query.status);
          }

          // 년월 필터
          if (req.query.year && req.query.month) {
            const { data: plans } = await supabase
              .from('monthly_funnel_plans')
              .select('id')
              .eq('year', req.query.year)
              .eq('month', req.query.month);

            if (plans && plans.length > 0) {
              query = query.in('funnel_plan_id', plans.map(p => p.id));
            }
          }

          const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(50);

          if (error) throw error;

          return res.status(200).json({ data });
        }

      case 'PUT':
        // 콘텐츠 수정
        const { id } = query;
        if (!id) {
          return res.status(400).json({ error: 'ID가 필요합니다.' });
        }

        const updateData: any = {};
        
        // 업데이트할 필드만 추가
        if (body.title !== undefined) updateData.title = body.title;
        if (body.content !== undefined) updateData.content = body.content;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.scheduled_date !== undefined) updateData.scheduled_date = body.scheduled_date;
        if (body.published_url !== undefined) updateData.published_url = body.published_url;
        
        // 발행 처리
        if (body.status === 'published' && !body.published_date) {
          updateData.published_date = new Date().toISOString();
        }

        const { data: updatedContent, error: updateError } = await supabase
          .from('generated_contents')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        return res.status(200).json({ data: updatedContent });

      case 'DELETE':
        // 콘텐츠 삭제
        const { id: deleteId } = query;
        if (!deleteId) {
          return res.status(400).json({ error: 'ID가 필요합니다.' });
        }

        const { error: deleteError } = await supabase
          .from('generated_contents')
          .delete()
          .eq('id', deleteId);

        if (deleteError) throw deleteError;

        return res.status(200).json({ success: true });

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('Contents API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      details: error 
    });
  }
}
