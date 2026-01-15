import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { imageId, storyScene, displayOrder } = req.body;

  if (!imageId) {
    return res.status(400).json({ error: 'imageId is required' });
  }

  // storyScene이 null일 수 있음 (미할당으로 이동)
  const updateData: any = {
    story_scene: storyScene !== undefined ? storyScene : null,
    updated_at: new Date().toISOString()
  };

  if (displayOrder !== undefined) {
    updateData.display_order = displayOrder;
  }

  const { data, error } = await supabase
    .from('image_metadata')
    .update(updateData)
    .eq('id', imageId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true, data });
}
