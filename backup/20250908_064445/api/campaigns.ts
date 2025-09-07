import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        // 캠페인 목록 조회
        const { data: campaigns, error: getError } = await supabase
          .from('campaigns')
          .select('*')
          .order('start_date', { ascending: false });

        if (getError) throw getError;
        
        return res.status(200).json({ campaigns });

      case 'POST':
        // 새 캠페인 생성
        const { data: newCampaign, error: createError } = await supabase
          .from('campaigns')
          .insert(req.body)
          .select()
          .single();

        if (createError) throw createError;
        
        return res.status(201).json({ campaign: newCampaign });

      case 'PUT':
        // 캠페인 수정
        const { id, ...updateData } = req.body;
        
        const { data: updatedCampaign, error: updateError } = await supabase
          .from('campaigns')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        
        return res.status(200).json({ campaign: updatedCampaign });

      case 'DELETE':
        // 캠페인 삭제
        const { id: deleteId } = req.query;
        
        const { error: deleteError } = await supabase
          .from('campaigns')
          .delete()
          .eq('id', deleteId);

        if (deleteError) throw deleteError;
        
        return res.status(200).json({ success: true });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Campaign API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
