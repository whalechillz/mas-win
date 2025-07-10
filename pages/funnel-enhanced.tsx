import { useEffect, useState } from 'react';
import { PageViewTracker } from '../components/tracking/PageViewTracker';
import { ConversionTracker } from '../components/tracking/ConversionTracker';
import { saveUTMParams, getSessionId } from '../lib/tracking/utm-handler';

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function EnhancedFunnelPage() {
  const [supabase, setSupabase] = useState(null);
  const [showConversionTracker, setShowConversionTracker] = useState(false);
  const [conversionType, setConversionType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    people: '',
    message: ''
  });

  // Supabase 초기화
  useEffect(() => {
    const initSupabase = async () => {
      if (!window.supabase) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
          const client = window.supabase.createClient(supabaseUrl, supabaseKey);
          setSupabase(client);
        };
        document.head.appendChild(script);
      } else {
        const client = window.supabase.createClient(supabaseUrl, supabaseKey);
        setSupabase(client);
      }
    };
    
    initSupabase();
    
    // UTM 파라미터 저장
    saveUTMParams();
  }, []);

  // 예약 처리
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 예약 데이터 저장
      const bookingData = {
        ...formData,
        type: 'booking',
        campaign_id: '2025-07-prime',
        session_id: getSessionId(),
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('contacts')
        .insert([bookingData]);
      
      if (error) {
        console.error('예약 저장 오류:', error);
        alert('예약 처리 중 오류가 발생했습니다.');
        return;
      }
      
      // 전환 추적 트리거
      setConversionType('booking');
      setShowConversionTracker(true);
      
      // 성공 메시지
      alert('예약이 완료되었습니다!');
      
      // 폼 초기화
      setFormData({
        name: '',
        phone: '',
        email: '',
        date: '',
        time: '',
        people: '',
        message: ''
      });
      
    } catch (error) {
      console.error('예약 처리 오류:', error);
      alert('예약 처리 중 오류가 발생했습니다.');
    }
  };

  // 문의 처리
  const handleInquirySubmit = async () => {
    try {
      const inquiryData = {
        name: formData.name,
        phone: formData.phone,
        message: formData.message,
        type: 'inquiry',
        campaign_id: '2025-07-prime',
        session_id: getSessionId(),
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('contacts')
        .insert([inquiryData]);
      
      if (error) {
        console.error('문의 저장 오류:', error);
        alert('문의 처리 중 오류가 발생했습니다.');
        return;
      }
      
      // 전환 추적 트리거
      setConversionType('inquiry');
      setShowConversionTracker(true);
      
      // 성공 메시지
      alert('문의가 접수되었습니다!');
      
    } catch (error) {
      console.error('문의 처리 오류:', error);
    }
  };

  // 입력 필드 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 페이지뷰 추적 */}
      {supabase && <PageViewTracker 
        campaignId="2025-07-prime" 
        supabase={supabase} 
      />}
      
      {/* 전환 추적 (예약/문의 완료 시) */}
      {showConversionTracker && supabase && (
        <ConversionTracker
          type={conversionType}
          campaignId="2025-07-prime"
          supabase={supabase}
        />
      )}

      {/* 헤더 */}
      <header className="bg-green-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center">
            프라임타임 골프 특가 이벤트
          </h1>
          <p className="text-center mt-2">
            7월 한정! 최대 50% 할인
          </p>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-4 py-12">
        {/* 이벤트 정보 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">특별 혜택</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">주중 라운딩</h3>
              <p className="text-gray-600">50% 할인</p>
              <p className="text-2xl font-bold text-green-600">99,000원</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">주말 라운딩</h3>
              <p className="text-gray-600">30% 할인</p>
              <p className="text-2xl font-bold text-green-600">139,000원</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">새벽 라운딩</h3>
              <p className="text-gray-600">40% 할인</p>
              <p className="text-2xl font-bold text-green-600">89,000원</p>
            </div>
          </div>
        </section>

        {/* 예약 폼 */}
        <section className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-6">예약하기</h2>
          <form onSubmit={handleBookingSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호 *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  희망 날짜 *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  희망 시간
                </label>
                <select
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">선택하세요</option>
                  <option value="morning">오전 (06:00-12:00)</option>
                  <option value="afternoon">오후 (12:00-18:00)</option>
                  <option value="dawn">새벽 (05:00-06:00)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  인원수
                </label>
                <select
                  name="people"
                  value={formData.people}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">선택하세요</option>
                  <option value="1">1명</option>
                  <option value="2">2명</option>
                  <option value="3">3명</option>
                  <option value="4">4명</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                추가 요청사항
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="mt-6 flex gap-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                예약하기
              </button>
              
              <button
                type="button"
                onClick={handleInquirySubmit}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                문의하기
              </button>
            </div>
          </form>
        </section>

        {/* 전화 문의 */}
        <section className="mt-8 text-center">
          <p className="text-gray-600 mb-2">전화 문의도 가능합니다</p>
          <a 
            href="tel:010-1234-5678" 
            className="text-2xl font-bold text-green-600 hover:underline"
            onClick={() => {
              // 전화 클릭도 추적 가능
              if (supabase) {
                supabase
                  .from('conversions')
                  .insert({
                    conversion_type: 'phone_click',
                    campaign_id: '2025-07-prime',
                    session_id: getSessionId()
                  });
              }
            }}
          >
            010-1234-5678
          </a>
        </section>
      </main>

      {/* Google Analytics 스크립트 (실제 ID로 교체 필요) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Google Analytics
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-YOUR_MEASUREMENT_ID');
            
            // Google Ads
            gtag('config', 'AW-YOUR_CONVERSION_ID');
          `
        }}
      />
    </div>
  );
}
