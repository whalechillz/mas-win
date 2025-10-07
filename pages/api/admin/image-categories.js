import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('image_categories').select('*').order('name', { ascending: true });
      if (error) throw error;
      return res.status(200).json({ categories: data || [] });
    }

    if (req.method === 'POST') {
      const { id, name, slug } = req.body || {};
      if (!name) return res.status(400).json({ error: 'name is required' });
      if (id) {
        const { data, error } = await supabase.from('image_categories').update({ name, slug }).eq('id', id).select();
        if (error) throw error;
        return res.status(200).json({ category: data?.[0] });
      }
      const { data, error } = await supabase.from('image_categories').insert([{ name, slug }]).select();
      if (error) throw error;
      return res.status(201).json({ category: data?.[0] });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('image_categories').delete().eq('id', id);
      if (error) throw error;
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('image-categories error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}


