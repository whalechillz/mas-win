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
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json(data);

      case 'POST':
        const { name, role, email, phone, department } = body;

        if (!name || !role) {
          return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
        }

        const { data: newMember, error: insertError } = await supabase
          .from('team_members')
          .insert({
            name,
            role,
            email,
            phone,
            department,
            status: 'active'
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return res.status(201).json(newMember);

      case 'PUT':
        const { id, ...updateData } = body;

        if (!id) {
          return res.status(400).json({ error: 'ID가 필요합니다.' });
        }

        const { data: updatedMember, error: updateError } = await supabase
          .from('team_members')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        return res.status(200).json(updatedMember);

      case 'DELETE':
        const { id: deleteId } = query;

        if (!deleteId) {
          return res.status(400).json({ error: 'ID가 필요합니다.' });
        }

        const { error: deleteError } = await supabase
          .from('team_members')
          .delete()
          .eq('id', deleteId);

        if (deleteError) throw deleteError;

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Team API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
} 