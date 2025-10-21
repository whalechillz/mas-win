import Head from 'next/head';
import { useState } from 'react';
import Navigation from '../../components/muziik/Navigation';

export default function ContactPage() {
  const [language, setLanguage] = useState<'ja' | 'ko'>('ko');
  const [activeTab, setActiveTab] = useState<'general' | 'partnership' | 'collaboration'>('general');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    businessNumber: '',
    inquiryType: '',
    message: '',
    quantity: '',
    attachment: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 언어별 콘텐츠
  const content = {
    ja: {
      title: 'MUZIIK - お問い合わせ',
      description: 'MUZIIK DOGATTI GENERATION シャフトに関するお問い合わせはこちらから',
      heroTitle: 'お問い合わせ',
      heroSubtitle: 'MUZIIK DOGATTI GENERATION シャフトに関するご質問・ご相談',
      
      // 탭 메뉴
      generalTab: '一般お問い合わせ',
      partnershipTab: 'パートナーシップ',
      collaborationTab: 'マツグコラボ',
      
      // 일반 문의
      generalTitle: '一般お問い合わせ',
      generalDesc: '製品情報、購入、フィッティングに関するご質問',
      
      // 파트너십
      partnershipTitle: 'パートナーシップお問い合わせ',
      partnershipDesc: 'フィッティングショップ、プロショップ様向け',
      
      // 콜라보
      collaborationTitle: 'マツグコラボお問い合わせ',
      collaborationDesc: 'マツグドライバー + MUZIIK シャフトの組み合わせ',
      
      // 폼 필드
      name: 'お名前',
      email: 'メールアドレス',
      phone: '電話番号',
      company: '会社名',
      businessNumber: '事業者登録番号',
      inquiryType: 'お問い合わせ種別',
      message: 'メッセージ',
      quantity: '希望取引数量',
      attachment: '事業計画書',
      
      // 문의 유형
      inquiryTypes: {
        general: ['製品情報', '購入相談', 'フィッティング相談', 'その他'],
        partnership: ['パートナーシップ', '卸売取引', '技術サポート', '教育資料'],
        collaboration: ['マツグコラボ', 'カスタムフィッティング', 'プロショップ向け', '技術相談']
      },
      
      // 버튼
      submit: '送信',
      submitting: '送信中...',
      success: 'お問い合わせありがとうございます',
      error: '送信に失敗しました',
      
      // 성공 메시지
      successMessage: 'お問い合わせを受け付けました。2営業日以内にご連絡いたします。',
      errorMessage: '送信に失敗しました。しばらく時間をおいて再度お試しください。'
    },
    ko: {
      title: 'MUZIIK - 문의하기',
      description: 'MUZIIK DOGATTI GENERATION 샤프트 문의 및 상담',
      heroTitle: '문의하기',
      heroSubtitle: 'MUZIIK DOGATTI GENERATION 샤프트에 대한 문의 및 상담',
      
      // 탭 메뉴
      generalTab: '일반 문의',
      partnershipTab: '파트너십',
      collaborationTab: '마쓰구 콜라보',
      
      // 일반 문의
      generalTitle: '일반 문의',
      generalDesc: '제품 정보, 구매, 피팅에 대한 문의',
      
      // 파트너십
      partnershipTitle: '파트너십 문의',
      partnershipDesc: '피팅샵, 프로샵을 위한 B2B 문의',
      
      // 콜라보
      collaborationTitle: '마쓰구 콜라보 문의',
      collaborationDesc: '마쓰구 드라이버 + MUZIIK 샤프트 조합 문의',
      
      // 폼 필드
      name: '이름',
      email: '이메일',
      phone: '전화번호',
      company: '업체명',
      businessNumber: '사업자등록번호',
      inquiryType: '문의 유형',
      message: '문의 내용',
      quantity: '희망 거래 수량',
      attachment: '사업계획서',
      
      // 문의 유형
      inquiryTypes: {
        general: ['제품 정보', '구매 상담', '피팅 상담', '기타'],
        partnership: ['파트너십', '도매 거래', '기술 지원', '교육 자료'],
        collaboration: ['마쓰구 콜라보', '커스텀 피팅', '프로샵 전용', '기술 상담']
      },
      
      // 버튼
      submit: '문의하기',
      submitting: '전송 중...',
      success: '문의가 접수되었습니다',
      error: '전송 실패',
      
      // 성공 메시지
      successMessage: '문의가 접수되었습니다. 영업일 기준 2일 이내에 연락드리겠습니다.',
      errorMessage: '전송에 실패했습니다. 잠시 후 다시 시도해주세요.'
    }
  };

  const t = content[language];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      attachment: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // 폼 데이터 검증
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      // JSON으로 전송 (FormData 대신)
      const requestData = {
        type: activeTab,
        language: language,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        businessNumber: formData.businessNumber,
        inquiryType: formData.inquiryType,
        message: formData.message,
        quantity: formData.quantity
      };

      console.log('전송할 데이터:', requestData);

      const response = await fetch('/api/contact/muziik', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('API 응답 상태:', response.status);
      const result = await response.json();
      console.log('API 응답 내용:', result);

      if (response.ok) {
        setSubmitStatus('success');
        // 폼 초기화
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          businessNumber: '',
          inquiryType: '',
          message: '',
          quantity: '',
          attachment: null
        });
      } else {
        setSubmitStatus('error');
        console.error('API 에러:', result);
      }
    } catch (error) {
      console.error('네트워크 에러:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.description} />
        <meta name="keywords" content="MUZIIK문의,골프샤프트문의,도가티문의,골프피팅상담,골프샤프트구매,프리미엄샤프트문의" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content="MUZIIK 문의하기 - 골프 샤프트 상담" />
        <meta property="og:description" content="MUZIIK DOGATTI GENERATION 샤프트 문의 및 상담. 일반 문의, 파트너십, 마쓰구 콜라보 문의." />
        <meta property="og:image" content="/muziik/contact-og.jpg" />
        <meta property="og:url" content="https://muziik.masgolf.co.kr/contact" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MUZIIK 문의하기" />
        <meta name="twitter:description" content="골프 샤프트 문의 및 상담. 전문 피팅 지원." />
        <meta name="twitter:image" content="/muziik/contact-og.jpg" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://muziik.masgolf.co.kr/contact" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Navigation 
          language={language} 
          onLanguageChange={setLanguage}
          currentPath="/contact"
        />

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 py-20 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center">
              <div className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
                {language === 'ja' ? 'プレミアムサポート' : '프리미엄 지원'}
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                {t.heroTitle}
              </h1>
              <h2 className="text-2xl md:text-3xl text-blue-400 mb-8">
                {t.heroSubtitle}
              </h2>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-300">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  {language === 'ja' ? '24時間以内返信' : '24시간 이내 답변'}
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {language === 'ja' ? '専門フィッティング' : '전문 피팅'}
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  {language === 'ja' ? 'カスタムソリューション' : '맞춤 솔루션'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              
              {/* Tab Navigation */}
              <div className="flex flex-wrap justify-center mb-8">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`px-6 py-3 m-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'general'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {t.generalTab}
                </button>
                <button
                  onClick={() => setActiveTab('partnership')}
                  className={`px-6 py-3 m-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'partnership'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {t.partnershipTab}
                </button>
                <button
                  onClick={() => setActiveTab('collaboration')}
                  className={`px-6 py-3 m-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'collaboration'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {t.collaborationTab}
                </button>
              </div>

              {/* Form Content */}
              <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    {activeTab === 'general' && '📞 일반 문의'}
                    {activeTab === 'partnership' && '🤝 파트너십'}
                    {activeTab === 'collaboration' && '⚡ 마쓰구 콜라보'}
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    {activeTab === 'general' && t.generalTitle}
                    {activeTab === 'partnership' && t.partnershipTitle}
                    {activeTab === 'collaboration' && t.collaborationTitle}
                  </h3>
                  <p className="text-gray-300 text-lg">
                    {activeTab === 'general' && t.generalDesc}
                    {activeTab === 'partnership' && t.partnershipDesc}
                    {activeTab === 'collaboration' && t.collaborationDesc}
                  </p>
                </div>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-lg">
                    <p className="text-green-200">{t.successMessage}</p>
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
                    <p className="text-red-200">{t.errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic Information */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-white font-semibold mb-2 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        {t.name} *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder={language === 'ja' ? 'お名前を入力してください' : '이름을 입력해주세요'}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-white font-semibold mb-2 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {t.email} *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder={language === 'ja' ? 'メールアドレスを入力してください' : '이메일을 입력해주세요'}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        {t.phone}
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        {t.inquiryType} *
                      </label>
                      <select
                        name="inquiryType"
                        value={formData.inquiryType}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">선택해주세요</option>
                        {t.inquiryTypes[activeTab].map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Partnership/Collaboration specific fields */}
                  {(activeTab === 'partnership' || activeTab === 'collaboration') && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white font-semibold mb-2">
                          {t.company}
                        </label>
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-white font-semibold mb-2">
                          {t.businessNumber}
                        </label>
                        <input
                          type="text"
                          name="businessNumber"
                          value={formData.businessNumber}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'partnership' && (
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        {t.quantity}
                      </label>
                      <input
                        type="text"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        placeholder="예: 월 10개, 분기 50개"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}

                  {/* Message */}
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      {t.message} *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="문의 내용을 자세히 작성해주세요"
                    />
                  </div>

                  {/* File Upload for Partnership */}
                  {activeTab === 'partnership' && (
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        {t.attachment}
                      </label>
                      <input
                        type="file"
                        name="attachment"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-gray-400 text-sm mt-2">
                        PDF, DOC, DOCX 파일만 업로드 가능합니다 (최대 10MB)
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="text-center pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          {t.submitting}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span className="mr-2">🚀</span>
                          {t.submit}
                        </div>
                      )}
                    </button>
                    <p className="text-gray-400 text-sm mt-4">
                      {language === 'ja' 
                        ? '送信後、24時間以内にご返信いたします'
                        : '전송 후 24시간 이내에 답변드리겠습니다'
                      }
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Info Section */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-8">
              {language === 'ja' ? 'お問い合わせ先' : '문의처'}
            </h2>
            <div className="max-w-2xl mx-auto">
              <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
                <h3 className="text-xl font-semibold text-white mb-4">
                  {language === 'ja' ? '直接メール' : '직접 이메일'}
                </h3>
                <a 
                  href="mailto:massgoogolf@gmail.com"
                  className="text-blue-400 hover:text-blue-300 text-lg"
                >
                  massgoogolf@gmail.com
                </a>
                <p className="text-gray-400 mt-4">
                  {language === 'ja' 
                    ? '24時間以内にご返信いたします'
                    : '24시간 이내에 답변드리겠습니다'
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 py-8">
          <div className="container mx-auto px-4">
            <div className="text-center text-gray-400">
              <p>&copy; 2025 MASSGOO X MUZIIK. All rights reserved.</p>
              <p className="mt-2">
                {language === 'ja' 
                  ? 'DOGATTI GENERATION シャフト - 日本製プレミアムゴルフシャフト'
                  : 'DOGATTI GENERATION 샤프트 - 일본제 프리미엄 골프 샤프트'
                }
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
