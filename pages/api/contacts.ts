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
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json(data);

      case 'POST':
        const { name, phone, email, message, source } = body;

        if (!name || !phone || !message) {
          return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
        }

        const { data: newContact, error: insertError } = await supabase
          .from('contacts')
          .insert({
            name,
            phone,
            email,
            message,
            source,
            status: 'pending',
            contacted: false
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return res.status(201).json(newContact);

      case 'PUT':
        const { id, ...updateData } = body;

        if (!id) {
          return res.status(400).json({ error: 'ID가 필요합니다.' });
        }

        const { data: updatedContact, error: updateError } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        return res.status(200).json(updatedContact);

      case 'DELETE':
        const { id: deleteId } = query;

        if (!deleteId) {
          return res.status(400).json({ error: 'ID가 필요합니다.' });
        }

        const { error: deleteError } = await supabase
          .from('contacts')
          .delete()
          .eq('id', deleteId);

        if (deleteError) throw deleteError;

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Contacts API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
} 