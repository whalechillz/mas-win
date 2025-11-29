/**
 * Wix 예약 데이터 마이그레이션 스크립트
 * 
 * 실행 방법:
 * 1. CSV 파일을 scripts/wix-bookings.csv에 배치
 * 2. npx ts-node scripts/migrate-wix-bookings.ts 실행
 * 
 * 환경 변수:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import * as dotenv from 'dotenv';

// .env.local 파일 로드
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface WixBookingRow {
  [key: string]: string;
}

interface CustomerData {
  name: string;
  phone: string;
  email?: string;
  first_inquiry_date: string;
  visit_count: number;
  visit_dates: string[];
  no_show_count: number;
}

interface BookingData {
  customer_profile_id?: string;
  name: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  service_type: string;
  status: string;
  attendance_status: string;
  notes?: string;
}

// 이메일 필터링
const isValidEmail = (email: string | undefined): boolean => {
  if (!email || !email.trim()) return false;
  const emailLower = email.toLowerCase().trim();
  
  // 제외할 이메일
  const excludedEmails = [
    'massgoogolf@gmail.com',
    'massgoogolf@naver.com'
  ];
  
  const excludedDomains = ['@aa.aa'];
  
  if (excludedEmails.includes(emailLower)) return false;
  if (excludedDomains.some(domain => emailLower.includes(domain))) return false;
  
  // 기본 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailLower);
};

// 전화번호 정규화
const normalizePhone = (phone: string): string => {
  return phone.replace(/[\s\-+]/g, '');
};

// 날짜 비교 (더 오래된 날짜 반환)
const getOlderDate = (date1: string, date2: string): string => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1 < d2 ? date1 : date2;
};

// CSV 파일 읽기
const readCSV = (filePath: string): Promise<WixBookingRow[]> => {
  return new Promise((resolve, reject) => {
    const results: WixBookingRow[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: WixBookingRow) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => {
        console.error('CSV 파일 읽기 오류:', error);
        reject(error);
      });
  });
};

// 고객 데이터 집계
const aggregateCustomerData = (rows: WixBookingRow[]): Map<string, CustomerData> => {
  const customerMap = new Map<string, CustomerData>();

  for (const row of rows) {
    const phone = normalizePhone(row['전화번호'] || row['phone'] || '');
    if (!phone) continue;

    const name = row['이름'] || row['name'] || '';
    const email = row['이메일'] || row['email'] || '';
    const registrationDate = row['등록일'] || row['registration_date'] || '';
    // 예약 시작 시간에서 날짜 추출
    const bookingStartTime = row['예약 시작 시간'] || row['예약날짜'] || row['date'] || '';
    const bookingDate = bookingStartTime ? bookingStartTime.split(' ')[0] : '';
    const attendanceStatus = row['참석 여부'] || row['출석상태'] || row['attendance_status'] || '';

    if (!customerMap.has(phone)) {
      customerMap.set(phone, {
        name,
        phone,
        email: isValidEmail(email) ? email : undefined,
        first_inquiry_date: registrationDate || bookingDate,
        visit_count: 0,
        visit_dates: [],
        no_show_count: 0
      });
    }

    const customer = customerMap.get(phone)!;
    
    // 방문 횟수 증가
    customer.visit_count++;
    
    // 방문 날짜 추가
    if (bookingDate && !customer.visit_dates.includes(bookingDate)) {
      customer.visit_dates.push(bookingDate);
    }
    
    // No Show 카운트
    if (attendanceStatus && attendanceStatus.toLowerCase().includes('no') || 
        attendanceStatus.toLowerCase().includes('noshow')) {
      customer.no_show_count++;
    }
    
    // 더 오래된 날짜로 업데이트
    if (registrationDate) {
      customer.first_inquiry_date = getOlderDate(
        customer.first_inquiry_date,
        registrationDate
      );
    }
  }

  return customerMap;
};

// 고객 생성 또는 업데이트
const upsertCustomer = async (customer: CustomerData): Promise<string | null> => {
  try {
    // 기존 고객 확인
    const { data: existing } = await supabase
      .from('customers')
      .select('id, first_inquiry_date')
      .eq('phone', customer.phone)
      .single();

    if (existing) {
      // 기존 고객 업데이트
      const updateData: any = {
        name: customer.name,
        visit_count: customer.visit_count,
        visit_dates: customer.visit_dates,
        no_show_count: customer.no_show_count
      };

      // 이메일이 유효하면 업데이트
      if (customer.email) {
        updateData.email = customer.email;
      }

      // 더 오래된 날짜로 업데이트
      if (existing.first_inquiry_date) {
        updateData.first_inquiry_date = getOlderDate(
          existing.first_inquiry_date,
          customer.first_inquiry_date
        );
      } else {
        updateData.first_inquiry_date = customer.first_inquiry_date;
      }

      await supabase
        .from('customers')
        .update(updateData)
        .eq('phone', customer.phone);

      return existing.id;
    } else {
      // 날짜 유효성 검사
      let validDate = customer.first_inquiry_date;
      if (!validDate || validDate.trim() === '') {
        validDate = new Date().toISOString().split('T')[0];
      } else {
        // 날짜 형식 변환 시도
        try {
          const dateObj = new Date(validDate);
          if (isNaN(dateObj.getTime())) {
            validDate = new Date().toISOString().split('T')[0];
          } else {
            validDate = dateObj.toISOString().split('T')[0];
          }
        } catch {
          validDate = new Date().toISOString().split('T')[0];
        }
      }

      // 새 고객 생성
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          name: customer.name,
          phone: customer.phone,
          email: customer.email || null,
          first_inquiry_date: validDate,
          visit_count: customer.visit_count,
          visit_dates: customer.visit_dates,
          no_show_count: customer.no_show_count
        })
        .select('id')
        .single();

      if (error) throw error;
      return newCustomer?.id || null;
    }
  } catch (error) {
    console.error(`고객 생성/업데이트 오류 (${customer.phone}):`, error);
    return null;
  }
};

// 예약 생성
const createBooking = async (booking: BookingData): Promise<boolean> => {
  try {
    // 날짜 유효성 검사
    if (!booking.date || booking.date.trim() === '') {
      return false;
    }

    // 날짜 형식 변환 및 유효성 검사
    let validDate = booking.date;
    try {
      const dateObj = new Date(validDate);
      if (isNaN(dateObj.getTime())) {
        return false;
      }
      validDate = dateObj.toISOString().split('T')[0];
    } catch {
      return false;
    }

    const insertData: any = {
      name: booking.name,
      phone: booking.phone,
      email: booking.email || null,
      date: validDate,
      time: booking.time || '10:00',
      club: booking.service_type || 'KGFA 1급 시타 체험하기', // club 필드는 NOT NULL
      service_type: booking.service_type,
      status: booking.status,
      attendance_status: booking.attendance_status,
      notes: booking.notes || null,
      duration: 60,
      location: 'Massgoo Studio'
    };

    // customer_profile_id가 있으면 추가
    if (booking.customer_profile_id) {
      insertData.customer_profile_id = booking.customer_profile_id;
    }

    const { error } = await supabase
      .from('bookings')
      .insert(insertData);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`예약 생성 오류 (${booking.name}, ${booking.date}):`, error);
    return false;
  }
};

// 메인 마이그레이션 함수
const migrate = async () => {
  const csvPath = path.join(process.cwd(), 'scripts', 'wix-bookings.csv');
  
  console.log('📖 CSV 파일 읽기 시작...');
  const rows = await readCSV(csvPath);
  console.log(`✅ ${rows.length}개 레코드 읽기 완료`);

  console.log('\n📊 고객 데이터 집계 중...');
  const customerMap = aggregateCustomerData(rows);
  console.log(`✅ ${customerMap.size}명의 고유 고객 발견`);

  console.log('\n👥 고객 데이터 마이그레이션 시작...');
  const customerIdMap = new Map<string, string>();
  let customerSuccess = 0;
  let customerFailed = 0;

  for (const phone of Array.from(customerMap.keys())) {
    const customer = customerMap.get(phone)!;
    const customerId = await upsertCustomer(customer);
    if (customerId) {
      customerIdMap.set(phone, customerId);
      customerSuccess++;
    } else {
      customerFailed++;
    }
  }

  console.log(`✅ 고객 마이그레이션 완료: 성공 ${customerSuccess}명, 실패 ${customerFailed}명`);

  console.log('\n📅 예약 데이터 마이그레이션 시작...');
  let bookingSuccess = 0;
  let bookingFailed = 0;
  let skipped = 0;

  for (const row of rows) {
    const phone = normalizePhone(row['전화번호'] || row['phone'] || '');
    if (!phone) {
      skipped++;
      continue;
    }

    const customerId = customerIdMap.get(phone);
    const booking: BookingData = {
      customer_profile_id: customerId,
      name: row['이름'] || row['name'] || '',
      phone,
      email: isValidEmail(row['이메일'] || row['email'] || '') 
        ? (row['이메일'] || row['email'] || '').trim() 
        : undefined,
      date: (() => {
        const startTime = row['예약 시작 시간'] || row['예약날짜'] || row['date'] || '';
        if (startTime) {
          try {
            // 날짜 형식 변환 (2025. 09. 26. 오전 11:00 -> 2025-09-26)
            // 공백으로 분리하여 날짜 부분만 추출
            const parts = startTime.split(' ');
            if (parts.length >= 3) {
              // "2025. 09. 26." 형식에서 숫자 추출
              const dateMatch = startTime.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\./);
              if (dateMatch) {
                const year = dateMatch[1];
                const month = dateMatch[2].padStart(2, '0');
                const day = dateMatch[3].padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                // 유효성 검사
                const dateObj = new Date(dateStr);
                if (!isNaN(dateObj.getTime())) {
                  return dateStr;
                }
              }
            }
          } catch (e) {
            // 날짜 파싱 실패 시 무시
          }
        }
        return '';
      })(),
      time: (() => {
        const startTime = row['예약 시작 시간'] || row['예약시간'] || row['time'] || '';
        if (startTime) {
          // 시간 추출 (오후 03:57 -> 15:57)
          const timeMatch = startTime.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            const minute = timeMatch[2];
            if (startTime.includes('오후') && hour < 12) hour += 12;
            if (startTime.includes('오전') && hour === 12) hour = 0;
            return `${hour.toString().padStart(2, '0')}:${minute}`;
          }
        }
        return '';
      })(),
      service_type: row['서비스명'] || row['서비스'] || row['service_type'] || 'KGFA 1급 시타 체험하기',
      status: 'completed', // Wix에서 마이그레이션된 데이터는 완료된 것으로 간주
      attendance_status: row['참석 여부'] || row['출석상태'] || row['attendance_status'] || 'completed',
      notes: row['메모'] || row['notes'] || undefined
    };

    // 디버깅: 첫 번째 레코드만 출력
    if (bookingSuccess === 0 && bookingFailed === 0 && skipped === 0) {
      console.log('첫 번째 예약 데이터:', {
        name: booking.name,
        date: booking.date,
        time: booking.time,
        startTime: row['예약 시작 시간']
      });
    }

    if (!booking.name || !booking.date || !booking.time) {
      skipped++;
      continue;
    }

    const success = await createBooking(booking);
    if (success) {
      bookingSuccess++;
    } else {
      bookingFailed++;
    }
  }

  console.log(`✅ 예약 마이그레이션 완료: 성공 ${bookingSuccess}건, 실패 ${bookingFailed}건, 제외 ${skipped}건`);

  console.log('\n📈 마이그레이션 요약:');
  console.log(`- 고객: ${customerSuccess}명 성공, ${customerFailed}명 실패`);
  console.log(`- 예약: ${bookingSuccess}건 성공, ${bookingFailed}건 실패, ${skipped}건 제외`);
  console.log('\n✅ 마이그레이션 완료!');
};

// 실행
migrate().catch(console.error);

export { migrate };

