// CSV와 DB의 전화번호 비교 API
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import csv from 'csv-parser';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 1. DB에서 모든 전화번호 가져오기
    const { data: dbCustomers, error: dbError } = await supabase
      .from('customers')
      .select('phone, name, id');
    
    if (dbError) {
      return res.status(500).json({ success: false, message: dbError.message });
    }

    const dbPhones = new Set(dbCustomers?.map(c => c.phone) || []);
    
    // 2. CSV 파일 읽기
    const csvPath = path.join(process.cwd(), 'database', '마스골프 고객 DB - MASSGOO.csv');
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ success: false, message: 'CSV 파일을 찾을 수 없습니다.' });
    }

    const csvPhones = new Set<string>();
    const csvPhoneDetails: Record<string, { row: number; name: string; phone: string }> = {};

    await new Promise((resolve, reject) => {
      let rowNum = 1;
      fs.createReadStream(csvPath, { encoding: 'utf-8' })
        .pipe(csv())
        .on('data', (row: any) => {
          rowNum++;
          const name = row['이름']?.trim() || '';
          const phoneRaw = row['연락처']?.trim() || '';
          const phoneClean = phoneRaw.replace(/[^0-9]/g, '');
          
          if (phoneClean.length >= 10 && phoneClean.length <= 11 && name) {
            csvPhones.add(phoneClean);
            if (!csvPhoneDetails[phoneClean]) {
              csvPhoneDetails[phoneClean] = {
                row: rowNum,
                name,
                phone: phoneRaw
              };
            }
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // 3. 비교
    const missingFromDB = Array.from(csvPhones).filter(phone => !dbPhones.has(phone));
    const onlyInDB = Array.from(dbPhones).filter(phone => !csvPhones.has(phone));

    // 4. 누락된 고객 정보 생성
    const missingCustomers = missingFromDB.map(phone => csvPhoneDetails[phone]).filter(Boolean);

    // 5. 상세 정보 정렬 (행 번호 순)
    missingCustomers.sort((a, b) => (a?.row || 0) - (b?.row || 0));

    return res.status(200).json({
      success: true,
      stats: {
        csvTotal: csvPhones.size,
        dbTotal: dbPhones.size,
        missing: missingFromDB.length,
        onlyInDB: onlyInDB.length
      },
      missingCustomers: missingCustomers, // 전체 반환
      missingPhones: missingFromDB, // 누락된 전화번호 목록
      missingCount: missingCustomers.length,
      message: `CSV에 ${csvPhones.size}개, DB에 ${dbPhones.size}개. 누락: ${missingFromDB.length}개`
    });

  } catch (error: any) {
    console.error('전화번호 비교 오류:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

