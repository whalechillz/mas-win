import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Multer 설정 (메모리 저장)
const upload = multer({ storage: multer.memoryStorage() });

// Next.js API에서 multer 사용을 위한 설정
export const config = {
  api: {
    bodyParser: false,
  },
};

// 구글 시트에서 데이터 가져오기 (간단한 구현)
async function fetchFromGoogleSheets(sheetUrl: string, sheetName: string) {
  try {
    // 실제 구현에서는 Google Sheets API를 사용해야 하지만,
    // 여기서는 간단한 예시 데이터를 반환
    console.log('구글 시트 URL:', sheetUrl);
    console.log('시트 이름:', sheetName);
    
    // 실제로는 Google Sheets API를 사용해야 함
    // 현재는 예시 데이터 반환
    return [
      { name: '김고객', phone: '010-1234-5678' },
      { name: '이고객', phone: '010-2345-6789' },
      { name: '박고객', phone: '010-3456-7890' }
    ];
  } catch (error) {
    console.error('구글 시트 데이터 가져오기 오류:', error);
    throw new Error('구글 시트에서 데이터를 가져올 수 없습니다.');
  }
}

// CSV 파일 파싱
async function parseCsvFile(buffer: Buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());
    
    stream
      .pipe(csv())
      .on('data', (data) => {
        // CSV 컬럼명에 따라 매핑
        const customer = {
          name: data['고객명'] || data['name'] || data['Name'] || '',
          phone: data['전화번호'] || data['phone'] || data['Phone'] || ''
        };
        
        if (customer.name && customer.phone) {
          results.push(customer);
        }
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// 고객 데이터를 데이터베이스에 저장
async function saveCustomers(customers: Array<{name: string, phone: string}>) {
  const results = [];
  
  for (const customer of customers) {
    try {
      // 전화번호 정리
      const cleanPhone = customer.phone.replace(/[\-\s]/g, '');
      
      // 기존 고객 확인
      const { data: existingCustomer } = await supabase
        .from('customer_profiles')
        .select('id')
        .eq('phone', cleanPhone)
        .single();

      if (existingCustomer) {
        // 기존 고객 업데이트
        const { error: updateError } = await supabase
          .from('customer_profiles')
          .update({
            name: customer.name,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCustomer.id);

        if (updateError) {
          results.push({
            name: customer.name,
            phone: customer.phone,
            status: 'failed',
            error: updateError.message
          });
        } else {
          results.push({
            name: customer.name,
            phone: customer.phone,
            status: 'success',
            action: 'updated'
          });
        }
      } else {
        // 새 고객 생성
        const { data: newCustomer, error: insertError } = await supabase
          .from('customer_profiles')
          .insert({
            name: customer.name,
            phone: cleanPhone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          results.push({
            name: customer.name,
            phone: customer.phone,
            status: 'failed',
            error: insertError.message
          });
        } else {
          results.push({
            name: customer.name,
            phone: customer.phone,
            status: 'success',
            action: 'created'
          });
        }
      }
    } catch (error) {
      results.push({
        name: customer.name,
        phone: customer.phone,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  return results;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    let customers = [];

    // Content-Type 확인
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
      // CSV 파일 업로드
      const uploadMiddleware = upload.single('file');
      
      await new Promise((resolve, reject) => {
        uploadMiddleware(req, res, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      });

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'CSV 파일이 선택되지 않았습니다.'
        });
      }

      customers = await parseCsvFile(req.file.buffer);
    } else {
      // 구글 시트 연동
      const { googleSheetUrl, sheetName } = req.body;
      
      if (!googleSheetUrl) {
        return res.status(400).json({
          success: false,
          message: '구글 시트 URL이 필요합니다.'
        });
      }

      customers = await fetchFromGoogleSheets(googleSheetUrl, sheetName || '마쓱구골프');
    }

    if (!customers || customers.length === 0) {
      return res.status(400).json({
        success: false,
        message: '가져올 고객 데이터가 없습니다.'
      });
    }

    // 고객 데이터 저장
    const results = await saveCustomers(customers);
    
    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    return res.status(200).json({
      success: true,
      message: `고객 데이터 가져오기 완료. 성공: ${successCount}명, 실패: ${failCount}명`,
      count: successCount,
      total: customers.length,
      customers: results
    });

  } catch (error) {
    console.error('고객 데이터 가져오기 오류:', error);
    return res.status(500).json({
      success: false,
      message: '고객 데이터 가져오기 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}
