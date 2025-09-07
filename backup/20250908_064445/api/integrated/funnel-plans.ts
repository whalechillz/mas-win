import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query, body } = req;

  try {
    switch (method) {
      case 'GET':
        const { year, month } = query;
        
        let queryBuilder = supabase
          .from('monthly_funnel_plans')
          .select('*')
          .order('year', { ascending: false })
          .order('month', { ascending: false });

        if (year) queryBuilder = queryBuilder.eq('year', year);
        if (month) queryBuilder = queryBuilder.eq('month', month);

        const { data, error } = await queryBuilder;

        if (error) throw error;

        return res.status(200).json(data);

      case 'POST':
        const { year: newYear, month: newMonth, theme, funnel_data, status } = body;

        if (!newYear || !newMonth) {
          return res.status(400).json({ error: 'year와 month는 필수입니다.' });
        }

        const { data: newPlan, error: insertError } = await supabase
          .from('monthly_funnel_plans')
          .insert({
            year: newYear,
            month: newMonth,
            theme,
            funnel_data: funnel_data || {},
            status: status || 'planning'
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return res.status(201).json(newPlan);

      case 'PUT':
        const { id, ...updateData } = body;

        if (!id) {
          return res.status(400).json({ error: 'id는 필수입니다.' });
        }

        const { data: updatedPlan, error: updateError } = await supabase
          .from('monthly_funnel_plans')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        return res.status(200).json(updatedPlan);

      case 'DELETE':
        const { id: deleteId } = query;

        if (!deleteId) {
          return res.status(400).json({ error: 'id는 필수입니다.' });
        }

        const { error: deleteError } = await supabase
          .from('monthly_funnel_plans')
          .delete()
          .eq('id', deleteId);

        if (deleteError) throw deleteError;

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
