import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // GET: 장면 설명 조회
  if (req.method === 'GET') {
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    const { data, error } = await supabase
      .from('customer_story_scenes')
      .select('*')
      .eq('customer_id', parseInt(customerId as string))
      .order('scene_number', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data: data || [] });
  }

  // POST: 장면 설명 저장/업데이트
  if (req.method === 'POST') {
    const { customerId, sceneNumber, description } = req.body;

    if (!customerId || !sceneNumber) {
      return res.status(400).json({ error: 'customerId and sceneNumber are required' });
    }

    const { data, error } = await supabase
      .from('customer_story_scenes')
      .upsert({
        customer_id: customerId,
        scene_number: sceneNumber,
        description: description || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'customer_id,scene_number'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
