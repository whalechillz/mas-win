import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { q = '', page = '1', pageSize = '20', optout, sortBy = 'updated_at', sortOrder = 'desc' } = req.query as Record<string, string>;
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const sizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 20));
      const from = (pageNum - 1) * sizeNum;
      const to = from + sizeNum - 1;

      // 정렬 컬럼 검증
      const allowedSortColumns = ['name', 'phone', 'updated_at', 'created_at', 'last_contact_date', 'last_purchase_date', 'first_purchase_date', 'last_service_date', 'vip_level'];
      const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'updated_at';
      const ascending = sortOrder === 'asc';

      let query = supabase.from('customers')
        .select('*', { count: 'exact' })
        .order(sortColumn, { ascending })
        .range(from, to);

      if (q && q.trim().length > 0) {
        // 간단 검색: 이름/전화번호/주소
        query = query.ilike('name', `%${q}%`).or(`phone.ilike.%${q}%,address.ilike.%${q}%`);
      }
      if (typeof optout !== 'undefined') {
        query = query.eq('opt_out', optout === 'true');
      }

      const { data, error, count } = await query;
      if (error) return res.status(500).json({ success: false, message: error.message });
      return res.status(200).json({ success: true, data, count, page: pageNum, pageSize: sizeNum });
    }

    if (req.method === 'POST') {
      // Create - 개별 고객 추가
      const { name, phone, address, first_inquiry_date, first_purchase_date, last_purchase_date, last_service_date, last_contact_date } = req.body || {};
      
      if (!name || !phone) {
        return res.status(400).json({ success: false, message: '이름과 전화번호는 필수입니다.' });
      }

      // 전화번호 정규화
      const cleanPhone = String(phone).replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        return res.status(400).json({ success: false, message: '전화번호는 10-11자리 숫자여야 합니다.' });
      }

      const { data, error } = await supabase
        .from('customers')
        .insert({
          name,
          phone: cleanPhone,
          address: address || null,
          first_inquiry_date: first_inquiry_date || null,
          first_purchase_date: first_purchase_date || null,
          last_purchase_date: last_purchase_date || null,
          last_service_date: last_service_date || null,
          last_contact_date: last_contact_date || null,
          opt_out: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return res.status(400).json({ success: false, message: '이미 존재하는 전화번호입니다.' });
        }
        return res.status(500).json({ success: false, message: error.message });
      }
      return res.status(200).json({ success: true, data });
    }

    if (req.method === 'PATCH') {
      // Update - 고객 정보 수정
      const { id, update } = req.body || {};
      if (!id || !update) return res.status(400).json({ success: false, message: 'id와 update가 필요합니다.' });
      
      // 전화번호 정규화
      if (update.phone) {
        const cleanPhone = String(update.phone).replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
          return res.status(400).json({ success: false, message: '전화번호는 10-11자리 숫자여야 합니다.' });
        }
        update.phone = cleanPhone;
      }

      update.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from('customers').update(update).eq('id', id).select().single();
      if (error) return res.status(500).json({ success: false, message: error.message });
      return res.status(200).json({ success: true, data });
    }

    if (req.method === 'DELETE') {
      // Delete - 고객 삭제
      const { id } = req.query as Record<string, string>;
      if (!id) return res.status(400).json({ success: false, message: 'id가 필요합니다.' });
      
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) return res.status(500).json({ success: false, message: error.message });
      return res.status(200).json({ success: true, message: '고객이 삭제되었습니다.' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
}


