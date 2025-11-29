import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // 예약 불가 시간대 조회
    try {
      const { date, location } = req.query;
      
      let query = supabase
        .from('booking_blocks')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      
      if (date) {
        query = query.eq('date', date);
      }
      
      if (location) {
        query = query.eq('location', location);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return res.status(200).json({ blocks: data || [] });
    } catch (error: any) {
      console.error('예약 불가 시간대 조회 오류:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  if (req.method === 'POST') {
    // 예약 불가 시간대 또는 가상 예약 생성
    try {
      const { date, time, duration, location, reason, is_virtual } = req.body;
      
      if (!date || !time) {
        return res.status(400).json({ error: '날짜와 시간이 필요합니다.' });
      }
      
      const { data, error } = await supabase
        .from('booking_blocks')
        .insert({
          date,
          time,
          duration: duration || 60,
          location: location || 'Massgoo Studio',
          reason: reason || null,
          is_virtual: is_virtual || false,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return res.status(201).json({ block: data });
    } catch (error: any) {
      console.error('예약 불가 시간대 생성 오류:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  if (req.method === 'DELETE') {
    // 예약 불가 시간대 삭제
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'ID가 필요합니다.' });
      }
      
      const { error } = await supabase
        .from('booking_blocks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('예약 불가 시간대 삭제 오류:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

