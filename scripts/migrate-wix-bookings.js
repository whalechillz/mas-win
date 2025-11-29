/**
 * Wix 예약 데이터 마이그레이션 스크립트
 * 
 * CSV 파일을 읽어서 customers와 bookings 테이블에 마이그레이션
 * 
 * 사용법:
 * node scripts/migrate-wix-bookings.js /path/to/예약\ 목록-2025.\ 11.\ 23..csv
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 이메일 필터링 규칙
const INVALID_EMAIL_PATTERNS = [
  /@aa\.aa$/i,
  /massgoogolf@gmail\.com$/i,
  /massgoogolf@naver\.com$/i,
  /^test@/i,
  /^admin@/i,
  /^noreply@/i,
  /^no-reply@/i,
];

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes('@')) return false;
  return !INVALID_EMAIL_PATTERNS.some(pattern => pattern.test(trimmed));
}

// 전화번호 정규화
function normalizePhone(phone) {
  if (!phone) return null;
  // +82, 공백, 하이픈 제거
  let normalized = phone.toString().replace(/[\s\-+]/g, '');
  // +82로 시작하면 0으로 변환
  if (normalized.startsWith('82')) {
    normalized = '0' + normalized.substring(2);
  }
  return normalized;
}

// 날짜 파싱 (Wix 형식: "2025. 09. 22. 오후 03:57" 또는 "2025. 09. 26. 오전 11:00")
function parseWixDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    // "2025. 09. 22. 오후 03:57" 형식 파싱
    const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)?\s*(\d{1,2}):(\d{2})/);
    if (!match) {
      // "2025-09-22" 형식 시도
      return new Date(dateStr);
    }
    
    const [, year, month, day, ampm, hour, minute] = match;
    let h = parseInt(hour);
    
    if (ampm === '오후' && h !== 12) {
      h += 12;
    } else if (ampm === '오전' && h === 12) {
      h = 0;
    }
    
    return new Date(year, parseInt(month) - 1, parseInt(day), h, parseInt(minute));
  } catch (e) {
    console.warn(`날짜 파싱 실패: ${dateStr}`, e);
    return null;
  }
}

// 시간 파싱 (Wix 형식: "2025. 09. 26. 오전 11:00")
function parseWixTime(timeStr) {
  if (!timeStr) return null;
  const date = parseWixDate(timeStr);
  if (!date) return null;
  return date.toTimeString().substring(0, 5); // HH:MM 형식
}

// 날짜만 추출 (YYYY-MM-DD)
function extractDate(dateStr) {
  const date = parseWixDate(dateStr);
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

// 참석 여부를 attendance_status로 변환
function parseAttendanceStatus(attendanceStr) {
  if (!attendanceStr) return 'pending';
  const lower = attendanceStr.toLowerCase();
  if (lower.includes('참석') || lower.includes('attended')) return 'attended';
  if (lower.includes('노쇼') || lower.includes('no_show') || lower.includes('no-show')) return 'no_show';
  if (lower.includes('취소') || lower.includes('cancelled')) return 'cancelled';
  return 'pending';
}

async function migrateData(csvFilePath) {
  console.log('📂 CSV 파일 읽기:', csvFilePath);
  
  const rows = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', async () => {
        console.log(`✅ ${rows.length}개 행 읽기 완료`);
        
        try {
          // 고객별로 그룹화
          const customerMap = new Map();
          
          for (const row of rows) {
            const phone = normalizePhone(row['전화번호'] || row['전화']);
            if (!phone) {
              console.warn('⚠️ 전화번호가 없는 행 건너뛰기:', row['이름']);
              continue;
            }
            
            if (!customerMap.has(phone)) {
              customerMap.set(phone, {
                phone,
                name: (row['이름'] || '').trim(),
                email: isValidEmail(row['이메일']) ? row['이메일'].trim() : null,
                bookings: [],
                wixRegisteredAt: null,
              });
            }
            
            const customer = customerMap.get(phone);
            
            // 등록일 (더 오래된 날짜 사용)
            const registeredAt = parseWixDate(row['등록일']);
            if (registeredAt && (!customer.wixRegisteredAt || registeredAt < customer.wixRegisteredAt)) {
              customer.wixRegisteredAt = registeredAt;
            }
            
            // 예약 정보 추가
            const bookingDate = extractDate(row['예약 시작 시간']);
            const bookingTime = parseWixTime(row['예약 시작 시간']);
            const endTime = parseWixTime(row['예약 종료 시간']);
            
            if (bookingDate && bookingTime) {
              // 소요 시간 계산 (분 단위)
              let duration = 60; // 기본 1시간
              if (endTime) {
                const start = new Date(`2000-01-01 ${bookingTime}`);
                const end = new Date(`2000-01-01 ${endTime}`);
                duration = Math.round((end - start) / 60000); // 분 단위
              }
              
              customer.bookings.push({
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                date: bookingDate,
                time: bookingTime,
                service_type: row['서비스명'] || 'KGFA 1급 시타 체험하기',
                location: row['위치 주소'] || 'Massgoo Studio',
                duration: duration,
                attendance_status: parseAttendanceStatus(row['참석 여부']),
                status: row['예약 상태'] === '확인됨' ? 'confirmed' : 'pending',
                club: row['양식 응답 0'] || null, // 현재클럽
                current_distance: row['양식 응답 1'] ? parseInt(row['양식 응답 1']) : null,
                age_group: row['양식 응답 2'] || null,
                notes: row['양식 응답 3'] || null,
                created_at: parseWixDate(row['등록일'])?.toISOString() || new Date().toISOString(),
              });
            }
          }
          
          console.log(`\n📊 고객 수: ${customerMap.size}`);
          
          // 고객 정보 업데이트 및 예약 저장
          let customerCount = 0;
          let bookingCount = 0;
          let errorCount = 0;
          
          for (const [phone, customer] of customerMap) {
            try {
              // 기존 고객 조회
              const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id, first_inquiry_date')
                .eq('phone', phone)
                .single();
              
              // 등록일 결정 (더 오래된 날짜)
              let firstInquiryDate = customer.wixRegisteredAt;
              if (existingCustomer?.first_inquiry_date) {
                const existingDate = new Date(existingCustomer.first_inquiry_date);
                if (customer.wixRegisteredAt && customer.wixRegisteredAt < existingDate) {
                  firstInquiryDate = customer.wixRegisteredAt;
                } else {
                  firstInquiryDate = existingDate;
                }
              }
              
              // 방문 횟수 및 노쇼 횟수 계산
              const visitCount = customer.bookings.filter(b => b.attendance_status === 'attended').length;
              const noShowCount = customer.bookings.filter(b => b.attendance_status === 'no_show').length;
              const lastVisitDate = customer.bookings
                .filter(b => b.attendance_status === 'attended')
                .map(b => b.date)
                .sort()
                .pop() || null;
              
              // 고객 정보 upsert
              const customerData = {
                phone: customer.phone,
                name: customer.name,
                email: customer.email,
                wix_registered_at: customer.wixRegisteredAt?.toISOString() || null,
                visit_count: visitCount,
                no_show_count: noShowCount,
                last_visit_date: lastVisitDate,
              };
              
              if (firstInquiryDate) {
                customerData.first_inquiry_date = firstInquiryDate.toISOString().split('T')[0];
              }
              
              const { data: savedCustomer, error: customerError } = await supabase
                .from('customers')
                .upsert(customerData, {
                  onConflict: 'phone',
                  ignoreDuplicates: false,
                })
                .select()
                .single();
              
              if (customerError) {
                console.error(`❌ 고객 저장 실패 (${phone}):`, customerError);
                errorCount++;
                continue;
              }
              
              customerCount++;
              
              // 예약 저장
              for (const booking of customer.bookings) {
                try {
                  // 중복 확인 (날짜, 시간, 전화번호)
                  const { data: existingBooking } = await supabase
                    .from('bookings')
                    .select('id')
                    .eq('phone', phone)
                    .eq('date', booking.date)
                    .eq('time', booking.time)
                    .single();
                  
                  if (existingBooking) {
                    // 기존 예약 업데이트
                    const { error: updateError } = await supabase
                      .from('bookings')
                      .update({
                        attendance_status: booking.attendance_status,
                        service_type: booking.service_type,
                        status: booking.status,
                        club: booking.club,
                        current_distance: booking.current_distance,
                        age_group: booking.age_group,
                        notes: booking.notes,
                      })
                      .eq('id', existingBooking.id);
                    
                    if (updateError) {
                      console.error(`❌ 예약 업데이트 실패:`, updateError);
                    } else {
                      bookingCount++;
                    }
                  } else {
                    // 새 예약 생성
                    const { error: insertError } = await supabase
                      .from('bookings')
                      .insert(booking);
                    
                    if (insertError) {
                      console.error(`❌ 예약 저장 실패:`, insertError);
                    } else {
                      bookingCount++;
                    }
                  }
                } catch (err) {
                  console.error(`❌ 예약 처리 오류:`, err);
                }
              }
              
              if (customerCount % 10 === 0) {
                console.log(`진행 중... 고객: ${customerCount}, 예약: ${bookingCount}`);
              }
            } catch (err) {
              console.error(`❌ 고객 처리 오류 (${phone}):`, err);
              errorCount++;
            }
          }
          
          console.log(`\n✅ 마이그레이션 완료!`);
          console.log(`   - 고객: ${customerCount}명`);
          console.log(`   - 예약: ${bookingCount}건`);
          console.log(`   - 오류: ${errorCount}건`);
          
          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .on('error', reject);
  });
}

// 메인 실행
const csvFilePath = process.argv[2] || path.join(__dirname, '..', '예약 목록-2025. 11. 23..csv');

if (!fs.existsSync(csvFilePath)) {
  console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
  process.exit(1);
}

migrateData(csvFilePath)
  .then(() => {
    console.log('\n🎉 마이그레이션이 성공적으로 완료되었습니다!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ 마이그레이션 실패:', err);
    process.exit(1);
  });

