import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Navigation from '../../components/muziik/Navigation';

export default function ContactPage() {
  const router = useRouter();
  const { locale } = router;
  const [activeTab, setActiveTab] = useState<'general' | 'partnership'>('general');
  const [footerExpanded, setFooterExpanded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    businessNumber: '',
    inquiryType: '',
    message: '',
    quantity: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // 언어별 콘텐츠
  const content = {
    ja: {
      title: 'MUZIIK - お問い合わせ',
      description: 'MUZIIK DOGATTI GENERATION シャフトに関するお問い合わせはこちらから',
      heroTitle: 'お問い合わせ・ご相談',
      heroSubtitle: 'MUZIIK DOGATTI GENERATION シャフトに関するご質問・ご相談',
      
      // 탭 메뉴
      generalTab: '一般お問い合わせ',
      partnershipTab: 'パートナーシップ',
      
      // 일반 문의
      generalTitle: '一般お問い合わせ',
      generalDesc: '製品情報、購入、フィッティングに関するご質問',
      
      // 파트너십
      partnershipTitle: 'パートナーシップお問い合わせ',
      partnershipDesc: 'フィッティングショップ、プロショップ様向け',
      
      
      // 폼 필드
      name: 'お名前',
      email: 'メールアドレス',
      phone: '電話番号',
      company: '会社名',
      businessNumber: '事業者登録番号',
      inquiryType: 'お問い合わせ種別',
      message: 'メッセージ',
      quantity: '希望取引数量',
      
      // 문의 유형
      inquiryTypes: {
        general: ['製品情報', '購入相談', 'フィッティング相談', 'その他'],
        partnership: ['パートナーシップ', '卸売取引', '技術サポート', '教育資料'],
      },
      
      // 버튼
      submit: '送信',
      submitting: '送信中...',
      success: 'お問い合わせありがとうございます',
      error: '送信に失敗しました',
      
      // 성공 메시지
      successMessage: 'お問い合わせを受け付けました。2営業日以内にご連絡いたします。',
      errorMessage: '送信に失敗しました。しばらく時間をおいて再度お試しください。',
      
      // Placeholder 텍스트
      selectPlaceholder: '選択してください',
      messagePlaceholder: 'お問い合わせ内容を詳しくご記入ください',
      
      // 유효성 검사 메시지
      validationRequired: 'この項目は必須です',
      validationEmail: '有効なメールアドレスを入力してください'
    },
    ko: {
      title: 'MUZIIK - 문의하기',
      description: 'MUZIIK DOGATTI GENERATION 샤프트 문의 및 상담',
      heroTitle: '문의 및 상담',
      heroSubtitle: 'MUZIIK DOGATTI GENERATION 샤프트에 대한 문의 및 상담',
      
      // 탭 메뉴
      generalTab: '일반 문의',
      partnershipTab: '파트너십',
      
      // 일반 문의
      generalTitle: '문의하기',
      generalDesc: '제품 정보, 구매, 피팅에 대한 문의',
      
      // 파트너십
      partnershipTitle: '파트너십 문의',
      partnershipDesc: '피팅샵, 프로샵을 위한 B2B 문의',
      
      
      // 폼 필드
      name: '이름',
      email: '이메일',
      phone: '전화번호',
      company: '업체명',
      businessNumber: '사업자등록번호',
      inquiryType: '문의 유형',
      message: '문의 내용',
      quantity: '희망 거래 수량',
      
      // 문의 유형
      inquiryTypes: {
        general: ['제품 정보', '구매 상담', '피팅 상담', '기타'],
        partnership: ['파트너십', '도매 거래', '기술 지원', '교육 자료'],
      },
      
      // 버튼
      submit: '문의하기',
      submitting: '전송 중...',
      success: '문의가 접수되었습니다',
      error: '전송 실패',
      
      // 성공 메시지
      successMessage: '문의가 접수되었습니다. 영업일 기준 2일 이내에 연락드리겠습니다.',
      errorMessage: '전송에 실패했습니다. 잠시 후 다시 시도해주세요.',
      
      // Placeholder 텍스트
      selectPlaceholder: '선택해주세요',
      messagePlaceholder: '문의 내용을 자세히 작성해주세요',
      
      // 유효성 검사 메시지
      validationRequired: '이 입력란을 작성하세요',
      validationEmail: '유효한 이메일 주소를 입력하세요'
    }
  };

  const t = content[locale];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 입력 시 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 유효성 검사 함수
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name) {
      newErrors.name = t.validationRequired;
    }
    if (!formData.email) {
      newErrors.email = t.validationRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.validationEmail;
    }
    if (!formData.inquiryType) {
      newErrors.inquiryType = t.validationRequired;
    }
    if (!formData.message) {
      newErrors.message = t.validationRequired;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // 폼 데이터 검증
    if (!validateForm()) {
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      // JSON으로 전송 (FormData 대신)
      const requestData = {
        type: activeTab,
        locale: locale,
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
          quantity: ''
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
        <meta property="og:description" content="MUZIIK DOGATTI GENERATION 샤프트 문의 및 상담. 문의하기, 파트너십 문의." />
        <meta property="og:image" content="/muziik/contact-og.jpg" />
        <meta property="og:url" content="https://masgolf.co.kr/muziik/contact" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MUZIIK 문의하기" />
        <meta name="twitter:description" content="골프 샤프트 문의 및 상담. 전문 피팅 지원." />
        <meta name="twitter:image" content="/muziik/contact-og.jpg" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://masgolf.co.kr/muziik/contact" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Navigation 
          currentPath="/contact"
        />

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 py-20 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center">
              <div className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
                {locale === 'ja' ? 'プレミアムサポート' : '프리미엄 지원'}
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
                  {locale === 'ja' ? '24時間以内返信' : '24시간 이내 답변'}
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {locale === 'ja' ? '専門フィッティング' : '전문 피팅'}
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  {locale === 'ja' ? 'カスタムソリューション' : '맞춤 솔루션'}
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
              </div>

              {/* Form Content */}
              <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    {activeTab === 'general' && `📞 ${t.generalTab}`}
                    {activeTab === 'partnership' && `🤝 ${t.partnershipTab}`}
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    {activeTab === 'general' && t.generalTitle}
                    {activeTab === 'partnership' && t.partnershipTitle}
                  </h3>
                  <p className="text-gray-300 text-lg">
                    {activeTab === 'general' && t.generalDesc}
                    {activeTab === 'partnership' && t.partnershipDesc}
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
                        className={`w-full px-4 py-4 bg-gray-700 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all ${
                          errors.name 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                        }`}
                        placeholder={locale === 'ja' ? 'お名前を入力してください' : '이름을 입력해주세요'}
                      />
                      {errors.name && (
                        <p className="text-red-400 text-sm mt-1 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {errors.name}
                        </p>
                      )}
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
                        className={`w-full px-4 py-4 bg-gray-700 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all ${
                          errors.email 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                        }`}
                        placeholder={locale === 'ja' ? 'メールアドレスを入力してください' : '이메일을 입력해주세요'}
                      />
                      {errors.email && (
                        <p className="text-red-400 text-sm mt-1 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {errors.email}
                        </p>
                      )}
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
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 transition-all ${
                          errors.inquiryType 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                        }`}
                      >
                        <option value="">{t.selectPlaceholder}</option>
                        {t.inquiryTypes[activeTab].map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {errors.inquiryType && (
                        <p className="text-red-400 text-sm mt-1 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {errors.inquiryType}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Partnership/Collaboration specific fields */}
                  {activeTab === 'partnership' && (
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
                      rows={6}
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 transition-all ${
                        errors.message 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                      placeholder={t.messagePlaceholder}
                    />
                    {errors.message && (
                      <p className="text-red-400 text-sm mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.message}
                      </p>
                    )}
                  </div>


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
                      {locale === 'ja' 
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


        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 py-12">
          <div className="container mx-auto px-4">
            {/* 통합 신뢰도 섹션 - 한 줄 (아이콘만) */}
            <div className="py-6 border-b border-gray-800">
              <div className="flex items-center justify-center gap-4 text-gray-500">
                {/* 다른 브랜드 보기 */}
                <div className="flex items-center gap-2">
                  <Link 
                    href="/" 
                    className="opacity-50 hover:opacity-100 transition-opacity"
                    title={locale === 'ja' ? 'MASSGOO ドライバー' : 'MASSGOO 드라이버'}
                  >
                    <img 
                      src="/main/logo/massgoo_logo_white.png" 
                      alt="MASSGOO"
                      className="h-4 w-auto object-contain"
                    />
                  </Link>
                  <span className="text-gray-700 text-xs">/</span>
                  <Link 
                    href="/muziik" 
                    className="opacity-50 hover:opacity-100 transition-opacity"
                    title={locale === 'ja' ? 'MUZIIK シャフト' : 'MUZIIK 샤프트'}
                  >
                    <img 
                      src="/muziik/brand/muziik-logo-art.png" 
                      alt="MUZIIK"
                      className="h-4 w-auto object-contain"
                    />
                  </Link>
                </div>
                
                {/* 구분선 */}
                <div className="w-px h-4 bg-gray-800"></div>
                
                {/* SSL 보안 */}
                <Link 
                  href="#" 
                  className="opacity-50 hover:opacity-100 transition-opacity"
                  title={locale === 'ja' ? 'SSLセキュリティ認証' : 'SSL 보안 인증'}
                >
                  <img 
                    src="/main/brand/ssl-secure-badge.svg" 
                    alt="SSL"
                    className="h-4 w-4 object-contain"
                  />
                </Link>
                
                {/* 구분선 */}
                <div className="w-px h-4 bg-gray-800"></div>
                
                {/* 프리미엄 품질 */}
                <Link 
                  href="#" 
                  className="opacity-50 hover:opacity-100 transition-opacity"
                  title={locale === 'ja' ? 'プレミアム品質' : '프리미엄 품질'}
                >
                  <img 
                    src="/main/brand/premium-quality-badge.svg" 
                    alt="프리미엄"
                    className="h-4 w-4 object-contain"
                  />
                </Link>
                
                {/* 구분선 */}
                <div className="w-px h-4 bg-gray-800"></div>
                
                {/* mas9golf.com */}
                <Link 
                  href="https://www.mas9golf.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="opacity-50 hover:opacity-100 transition-opacity"
                  title={locale === 'ja' ? 'MASSGOO公式モール' : 'MASSGOO 공식몰'}
                >
                  <img 
                    src="/main/brand/mas9golf-icon.svg" 
                    alt="MASSGOO 공식몰"
                    className="h-4 w-4 object-contain"
                  />
                </Link>
                
                {/* 구분선 */}
                <div className="w-px h-4 bg-gray-800"></div>
                
                {/* 네이버 스마트스토어 */}
                <Link 
                  href="https://smartstore.naver.com/mas9golf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="opacity-50 hover:opacity-100 transition-opacity"
                  title={locale === 'ja' ? 'ネイバースマートストア' : '네이버 스마트스토어'}
                >
                  <img 
                    src="/main/brand/naver-smartstore-icon.svg" 
                    alt="네이버 스마트스토어"
                    className="h-4 w-4 object-contain"
                  />
                </Link>
              </div>
            </div>
            
            {/* 토글 버튼 */}
            <button
              onClick={() => setFooterExpanded(!footerExpanded)}
              className="w-full py-3 px-4 text-xs text-gray-400 hover:text-gray-300 
                         border-b border-gray-800 transition-all duration-300
                         flex items-center justify-center gap-2
                         hover:bg-gray-800/30"
            >
              <span>{locale === 'ja' ? '会社情報' : '회사 정보'}</span>
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${
                  footerExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* 토글 콘텐츠 */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                footerExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="py-6 px-4">
                <div className="grid md:grid-cols-3 gap-8 text-sm text-gray-400">
                  {/* 사업자 정보 */}
                  <div>
                    <h4 className="font-bold mb-4 text-white">{locale === 'ja' ? '事業者情報' : '사업자 정보'}</h4>
                    <div className="space-y-2">
                      <p>{locale === 'ja' ? '事業者名' : '사업자명'}: MASGOLF® | {locale === 'ja' ? '代表者名' : '대표자명'}: 김탁수</p>
                      <p>{locale === 'ja' ? '事業者登録番号' : '사업자등록번호'}: 877-07-00641</p>
                      <p>{locale === 'ja' ? '通信販売業届出番号' : '통신판매업신고번호'}: 제 2017-수원영통-0623호</p>
                    </div>
                  </div>
                  
                  {/* 고객센터 정보 */}
                  <div>
                    <h4 className="font-bold mb-4 text-white">{locale === 'ja' ? 'お客様センター' : '고객센터'}</h4>
                    <div className="space-y-2">
                      <p>{locale === 'ja' ? '距離相談' : '비거리 상담'}: 080-028-8888 ({locale === 'ja' ? '無料' : '무료'})</p>
                      <p>{locale === 'ja' ? 'フィッティング・訪問相談' : '피팅 & 방문 상담'}: 031-215-0013</p>
                      <p>📍 {locale === 'ja' ? '水原市永同区法条路149番ギル200' : '수원시 영통구 법조로 149번길 200'}</p>
                      <p>🕘 {locale === 'ja' ? '月-金 09:00 - 18:00 / 週末予約制運営' : '월-금 09:00 - 18:00 / 주말 예약제 운영'}</p>
                    </div>
                  </div>
                  
                  {/* 연락처 정보 */}
                  <div>
                    <h4 className="font-bold mb-4 text-white">{locale === 'ja' ? '連絡先' : '연락처'}</h4>
                    <div className="space-y-2">
                      <p>{locale === 'ja' ? 'メール' : '이메일'}: hello@masgolf.co.kr</p>
                      <p>{locale === 'ja' ? 'ウェブサイト' : '웹사이트'}: www.mas9golf.com</p>
                      <p>{locale === 'ja' ? 'ウェブサイト' : '웹사이트'}: www.masgolf.co.kr</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 저작권 */}
            <div className="py-4 text-center text-xs text-gray-500 border-t border-gray-800">
              <p>&copy; 2025 MUZIIK X MASSGOO. All rights reserved.</p>
              <p className="mt-2">
                {locale === 'ja' 
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
