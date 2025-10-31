import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import type { IncomingMessage } from 'http';

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

// JSON Body 수동 파싱 (bodyParser:false 환경)
async function readJsonBody<T = any>(req: IncomingMessage): Promise<T> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) chunks.push(chunk as Uint8Array);
  const raw = Buffer.concat(chunks).toString('utf8') || '{}';
  try { return JSON.parse(raw); } catch {
    return {} as T;
  }
}

// 구글 시트에서 데이터 가져오기 - 공유 URL → CSV export로 변환 후 파싱
async function fetchFromGoogleSheets(sheetUrl: string, sheetName: string) {
  try {
    // sheetName은 현재 사용하지 않고 gid를 우선 사용 (MASSGOO 탭 지정)
    // 공유 URL 예: https://docs.google.com/spreadsheets/d/{id}/edit?gid=0#gid=0
    const idMatch = sheetUrl.match(/\/spreadsheets\/d\/([^/]+)/);
    const gidMatch = sheetUrl.match(/[?&#]gid=(\d+)/);
    const sheetId = idMatch?.[1];
    const gid = gidMatch?.[1] || '0';
    if (!sheetId) {
      throw new Error('유효하지 않은 구글 시트 URL입니다. URL 형식을 확인해주세요.');
    }

    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    console.log('구글 시트 CSV 다운로드 시도:', exportUrl);
    
    const resp = await fetch(exportUrl);
    if (!resp.ok) {
      const text = await resp.text();
      console.error('구글 시트 CSV 다운로드 실패:', resp.status, text.substring(0, 200));
      
      if (resp.status === 403) {
        throw new Error('구글 시트 접근 권한이 없습니다. 시트가 "링크가 있는 모든 사용자"로 공개 설정되어 있는지 확인해주세요.');
      } else if (resp.status === 404) {
        throw new Error('구글 시트를 찾을 수 없습니다. URL이 올바른지 확인해주세요.');
      } else {
        throw new Error(`구글 시트 CSV 다운로드 실패 (${resp.status}): 시트가 공개 설정되어 있는지 확인해주세요.`);
      }
    }
    
    const csvBuffer = Buffer.from(await resp.arrayBuffer());
    if (csvBuffer.length === 0) {
      throw new Error('구글 시트에서 데이터를 가져올 수 없습니다. 시트가 비어있거나 접근 권한이 없습니다.');
    }
    
    const rows = await parseCsvFile(csvBuffer) as any[];
    console.log(`구글 시트에서 ${rows.length}개의 행을 가져왔습니다.`);
    return rows;
  } catch (error: any) {
    console.error('구글 시트 데이터 가져오기 오류:', error);
    throw error; // 원본 에러 메시지 전달
  }
}

// CSV 파일 파싱
async function parseCsvFile(buffer: Buffer) {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const errors: string[] = [];
    let rowCount = 0;
    
    try {
      const stream = Readable.from(buffer.toString('utf-8'));
      
      stream
        .pipe(csv())
        .on('data', (data) => {
          rowCount++;
          try {
            // MASSGOO 탭 스키마 매핑
            const customer = mapRawToCustomer(data);
            if (customer.name && customer.phone) {
              results.push(customer);
            } else {
              if (rowCount <= 10) { // 처음 10개 행만 에러 로깅
                errors.push(`행 ${rowCount}: 이름 또는 전화번호 없음`);
              }
            }
          } catch (err: any) {
            if (rowCount <= 10) {
              errors.push(`행 ${rowCount}: ${err.message || '파싱 오류'}`);
            }
          }
        })
        .on('end', () => {
          if (errors.length > 0) {
            console.warn('CSV 파싱 중 일부 행에서 오류 발생:', errors.slice(0, 10));
          }
          console.log(`CSV 파싱 완료: ${results.length}개 성공, ${rowCount - results.length}개 스킵`);
          resolve(results);
        })
        .on('error', (error) => {
          console.error('CSV 스트림 오류:', error);
          reject(new Error(`CSV 파일 파싱 오류: ${error.message}`));
        });
    } catch (error: any) {
      console.error('CSV 파싱 초기화 오류:', error);
      reject(new Error(`CSV 파일 읽기 오류: ${error.message}`));
    }
  });
}

// 컬럼 매핑 및 정규화
function mapRawToCustomer(row: Record<string, any>) {
  const get = (k: string) => row[k] ?? row[k.trim()] ?? '';
  const name = get('이름') || get('고객명') || get('name') || '';
  const phone = cleanPhone(get('연락처') || get('전화번호') || get('phone') || '');
  const address = get('주소지') || get('주소') || '';
  const purchaseFlag = get('구매내역'); // 텍스트 [구매이력]
  const firstInquiryDate = parseDate(get('최초문의일'));
  const firstPurchaseDate = parseDate(get('최초구매일'));
  // CSV에는 "마지막지불일"로 되어 있지만 코드에서는 "마지막구매일"로 찾음
  const lastPurchaseDate = parseDate(get('마지막구매일') || get('마지막지불일'));
  const lastServiceDate = parseDate(get('마지막A/S출고일'));
  const lastContactDate = parseDate(get('최근연락내역'));

  return {
    name,
    phone,
    address,
    purchaseFlag,
    firstInquiryDate,
    firstPurchaseDate,
    lastPurchaseDate,
    lastServiceDate,
    lastContactDate,
  };
}

function cleanPhone(v: string) {
  const only = String(v || '').replace(/[^0-9]/g, '');
  // 10~11자리만 수용, 아니면 빈 값
  if (!only) return '';
  return only.length === 10 || only.length === 11 ? only : '';
}

function parseDate(v: string) {
  if (!v) return null as unknown as string | null;
  const s = String(v).trim();
  if (!s) return null as unknown as string | null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null as unknown as string | null;
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// 고객 데이터를 배치 Upsert (phone 고유)
async function saveCustomers(customers: Array<any>) {
  const results: any[] = [];
  const CHUNK = 500;
  
  // 전체 고객에서 중복 전화번호 제거 (같은 전화번호가 여러 번 나오면 마지막 것만 남김)
  const phoneMap = new Map<string, any>();
  customers.forEach(c => {
    if (c.name && c.phone) {
      phoneMap.set(c.phone, c); // 같은 전화번호면 나중 값으로 덮어쓰기
    }
  });
  const uniqueCustomers = Array.from(phoneMap.values());
  console.log(`중복 제거: ${customers.length}명 → ${uniqueCustomers.length}명`);
  
  for (let i = 0; i < uniqueCustomers.length; i += CHUNK) {
    const batch = uniqueCustomers.slice(i, i + CHUNK);

    // 무결성 보정: 날짜 순서 점검
    batch.forEach(c => {
      if (c.firstPurchaseDate && c.lastPurchaseDate) {
        if (c.firstPurchaseDate > c.lastPurchaseDate) {
          const tmp = c.firstPurchaseDate; c.firstPurchaseDate = c.lastPurchaseDate; c.lastPurchaseDate = tmp;
        }
      }
    });

    // Supabase upsert (없는 컬럼이 있으면 에러가 날 수 있으므로 안전 컬럼만)
    const upsertPayload = batch.map(c => ({
      name: c.name,
      phone: c.phone,
      address: c.address || null,
      first_inquiry_date: c.firstInquiryDate || null,
      first_purchase_date: c.firstPurchaseDate || null,
      last_purchase_date: c.lastPurchaseDate || null,
      last_service_date: c.lastServiceDate || null,
      last_contact_date: c.lastContactDate || null,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }));

    const { error, data } = await supabase
      .from('customers')
      // @ts-ignore upsert 옵션
      .upsert(upsertPayload, { onConflict: 'phone' });

    if (error) {
      console.error(`배치 업로드 오류 (${i}-${i + batch.length}):`, error);
      results.push({ status: 'failed', count: batch.length, error: error.message });
    } else {
      results.push({ status: 'success', count: batch.length });
    }
  }
  return results;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    let customers: any[] = [];

    // Content-Type 확인
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
      // CSV 파일 업로드
      const uploadMiddleware = upload.single('file');
      
      await new Promise((resolve, reject) => {
        (uploadMiddleware as unknown as any)(req as any, res as any, (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      });

      if (!(req as any).file) {
        return res.status(400).json({
          success: false,
          message: 'CSV 파일이 선택되지 않았습니다.'
        });
      }

      customers = await parseCsvFile((req as any).file.buffer) as any[];
    } else {
      // 구글 시트 연동
      const body = await readJsonBody<any>(req);
      const { googleSheetUrl, sheetName } = body || {};
      
      if (!googleSheetUrl) {
        return res.status(400).json({
          success: false,
          message: '구글 시트 URL이 필요합니다.'
        });
      }

      customers = await fetchFromGoogleSheets(googleSheetUrl, sheetName || 'MASSGOO') as any[];
    }

    if (!customers || customers.length === 0) {
      return res.status(400).json({
        success: false,
        message: '가져올 고객 데이터가 없습니다.'
      });
    }

    // 고객 데이터 저장 (중복 제거 포함)
    console.log(`고객 데이터 저장 시작: ${customers.length}명`);
    const results = await saveCustomers(customers);
    
    // 결과 집계
    let totalSuccess = 0;
    let totalFailed = 0;
    const errorMessages: string[] = [];
    
    results.forEach(r => {
      if (r.status === 'success') {
        totalSuccess += r.count;
      } else {
        totalFailed += r.count;
        if (r.error && !errorMessages.includes(r.error)) {
          errorMessages.push(r.error);
        }
      }
    });

    console.log(`고객 데이터 저장 완료: 성공 ${totalSuccess}명, 실패 ${totalFailed}명`);

    return res.status(200).json({
      success: true,
      message: `고객 데이터 가져오기 완료. 성공: ${totalSuccess}명, 실패: ${totalFailed}명`,
      count: totalSuccess,
      total: customers.length,
      errors: errorMessages.slice(0, 5), // 최대 5개 에러만 전송
      customers: results
    });

  } catch (error: any) {
    console.error('고객 데이터 가져오기 오류:', error);
    const errorMessage = error?.message || '알 수 없는 오류가 발생했습니다.';
    return res.status(500).json({
      success: false,
      message: `고객 데이터 가져오기 중 오류가 발생했습니다: ${errorMessage}`,
      error: errorMessage
    });
  }
}
