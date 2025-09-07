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
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json(data);

      case 'POST':
        const { name, phone, date, time, club, notes } = body;

        if (!name || !phone || !date) {
          return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
        }

        const { data: newBooking, error: insertError } = await supabase
          .from('bookings')
          .insert({
            name,
            phone,
            date,
            time,
            club,
            notes,
            status: 'pending'
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return res.status(201).json(newBooking);

      case 'PUT':
        const { id, ...updateData } = body;

        if (!id) {
          return res.status(400).json({ error: 'ID가 필요합니다.' });
        }

        const { data: updatedBooking, error: updateError } = await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        return res.status(200).json(updatedBooking);

      case 'DELETE':
        const { id: deleteId } = query;

        if (!deleteId) {
          return res.status(400).json({ error: 'ID가 필요합니다.' });
        }

        const { error: deleteError } = await supabase
          .from('bookings')
          .delete()
          .eq('id', deleteId);

        if (deleteError) throw deleteError;

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Bookings API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
} 