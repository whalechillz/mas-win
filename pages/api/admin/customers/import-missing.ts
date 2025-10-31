// 누락된 고객만 선별적으로 임포트하는 API
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 1. DB에서 모든 전화번호 가져오기
    const { data: dbCustomers, error: dbError } = await supabase
      .from('customers')
      .select('phone');
    
    if (dbError) {
      return res.status(500).json({ success: false, message: dbError.message });
    }

    const dbPhones = new Set(dbCustomers?.map(c => c.phone) || []);
    
    // 2. CSV 파일 읽기
    const csvPath = path.join(process.cwd(), 'database', '마스골프 고객 DB - MASSGOO.csv');
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ success: false, message: 'CSV 파일을 찾을 수 없습니다.' });
    }

    const missingCustomers: any[] = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath, { encoding: 'utf-8' })
        .pipe(csv())
        .on('data', (row: any) => {
          const name = row['이름']?.trim() || '';
          const phoneRaw = row['연락처']?.trim() || '';
          const phoneClean = phoneRaw.replace(/[^0-9]/g, '');
          
          // DB에 없는 고객만 추가
          if (phoneClean.length >= 10 && phoneClean.length <= 11 && name && !dbPhones.has(phoneClean)) {
            missingCustomers.push({
              name,
              phone: phoneClean,
              address: row['주소지']?.trim() || null,
              firstInquiryDate: parseDate(row['최초문의일']),
              firstPurchaseDate: parseDate(row['최초구매일']),
              lastPurchaseDate: parseDate(row['마지막지불일'] || row['마지막구매일']),
              lastServiceDate: parseDate(row['마지막A/S출고일']),
              lastContactDate: parseDate(row['최근연락내역']),
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (missingCustomers.length === 0) {
      return res.status(200).json({
        success: true,
        message: '누락된 고객이 없습니다.',
        count: 0
      });
    }

    // 3. 누락된 고객들을 배치로 저장
    const CHUNK = 500;
    const results: any[] = [];
    
    for (let i = 0; i < missingCustomers.length; i += CHUNK) {
      const batch = missingCustomers.slice(i, i + CHUNK);
      const now = new Date().toISOString();

      const upsertPayload = batch.map(c => ({
        name: c.name,
        phone: c.phone,
        address: c.address || null,
        first_inquiry_date: c.firstInquiryDate || null,
        first_purchase_date: c.firstPurchaseDate || null,
        last_purchase_date: c.lastPurchaseDate || null,
        last_service_date: c.lastServiceDate || null,
        last_contact_date: c.lastContactDate || now, // 명시적으로 없으면 현재 시간
        opt_out: false,
        created_at: now,
        updated_at: now,
      }));

      const { error } = await supabase
        .from('customers')
        .upsert(upsertPayload, { onConflict: 'phone' });

      if (error) {
        console.error(`배치 ${i}-${i + batch.length} 업로드 오류:`, error);
        results.push({ status: 'failed', count: batch.length, error: error.message });
      } else {
        results.push({ status: 'success', count: batch.length });
      }
    }

    // 결과 집계
    let totalSuccess = 0;
    let totalFailed = 0;
    results.forEach(r => {
      if (r.status === 'success') {
        totalSuccess += r.count;
      } else {
        totalFailed += r.count;
      }
    });

    return res.status(200).json({
      success: true,
      message: `누락된 고객 ${missingCustomers.length}명 중 ${totalSuccess}명 저장 완료`,
      stats: {
        found: missingCustomers.length,
        imported: totalSuccess,
        failed: totalFailed
      },
      results
    });

  } catch (error: any) {
    console.error('누락 고객 임포트 오류:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

function parseDate(v: string) {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

