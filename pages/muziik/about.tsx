import Head from 'next/head';
import { useState } from 'react';
import Navigation from '../../components/muziik/Navigation';

export default function AboutPage() {
  const [language, setLanguage] = useState<'ja' | 'ko'>('ko');

  // 언어별 콘텐츠
  const content = {
    ja: {
      title: 'MUZIIK - 会社情報',
      description: 'MUZIIK - 40年の伝統を持つ日本製プレミアムゴルフシャフト DOGATTI GENERATION の韓国正規輸入販売',
      heroTitle: 'MUZIIKについて',
      heroSubtitle: '日本製プレミアムゴルフシャフトの最高峰',
      heroDescription: '40年の伝統と最新技術を融合した、最高品質のシャフト製造技術を持つMUZIIK。DOGATTI GENERATION シャフトの韓国正規輸入販売を行っています。',
      
      // 회사 소개
      companyTitle: '会社概要',
      companyDesc: 'MUZIIKは、日本の伝統的なシャフト製造技術と最新のテクノロジーを融合し、世界最高水準のゴルフシャフトを製造する企業です。',
      companyFeatures: [
        '40年の伝統あるシャフト製造技術',
        '最新のチタンファイバーテクノロジー',
        '厳格な品質管理システム',
        '韓国正規輸入販売代理店'
      ],
      
      // 브랜드 스토리
      brandTitle: 'ブランドストーリー',
      brandDesc: 'DOGATTI GENERATIONは、MUZIIK独自の設計思想に基づき創られた最強シャフトです。チタンファイバー技術による革新的な性能で、ゴルファーのパフォーマンスを向上させます。',
      brandStory: [
        '1970年代から続くシャフト製造の伝統',
        '2000年代のチタンファイバー技術開発',
        '2010年代のDOGATTI GENERATION誕生',
        '2020年代の韓国市場 진출'
      ],
      
      // 기술력
      technologyTitle: '技術力',
      technologyDesc: 'MUZIIKの技術力は、長年の研究開発と製造経験に基づいています。特にチタンファイバー技術においては、業界をリードする技術を保有しています。',
      technologyFeatures: [
        'ナノレベル樹脂技術',
        'チタンファイバー全長使用技術',
        '逆トルク防止技術',
        '精密な剛性分布制御'
      ],
      
      // 한국 진출
      koreaTitle: '韓国市場 진출',
      koreaDesc: 'MUZIIKは韓国のゴルフ市場に正式に 진출하여、DOGATTI GENERATION シャフトの正規輸入販売を行っています。',
      koreaFeatures: [
        '韓国正規輸入販売代理店',
        '現地アフターサービス',
        '専門フィッティングサービス',
        '品質保証システム'
      ],
      
      // 연락처
      contactTitle: 'お問い合わせ',
      contactDesc: 'DOGATTI GENERATION シャフトに関するお問い合わせは、下記までご連絡ください。',
      email: 'info@masgolf.co.kr',
      phone: '전화 문의',
      address: '한국 서울'
    },
    ko: {
      title: 'MUZIIK - 회사소개',
      description: 'MUZIIK - 40년 전통의 일본제 프리미엄 골프 샤프트 DOGATTI GENERATION의 한국 정식 수입 판매',
      heroTitle: 'MUZIIK 소개',
      heroSubtitle: '일본제 프리미엄 골프 샤프트의 최고봉',
      heroDescription: '40년 전통과 최신 기술을 융합한, 최고 품질의 샤프트 제조 기술을 보유한 MUZIIK. DOGATTI GENERATION 샤프트의 한국 정식 수입 판매를 진행하고 있습니다.',
      
      // 회사 소개
      companyTitle: '회사 개요',
      companyDesc: 'MUZIIK는 일본의 전통적인 샤프트 제조 기술과 최신 테크놀로지를 융합하여 세계 최고 수준의 골프 샤프트를 제조하는 기업입니다.',
      companyFeatures: [
        '40년 전통의 샤프트 제조 기술',
        '최신 티타늄 파이버 테크놀로지',
        '엄격한 품질 관리 시스템',
        '한국 정식 수입 판매 대리점'
      ],
      
      // 브랜드 스토리
      brandTitle: '브랜드 스토리',
      brandDesc: 'DOGATTI GENERATION은 MUZIIK 독자적인 설계 사상에 기반하여 만들어진 최강 샤프트입니다. 티타늄 파이버 기술로 혁신적인 성능을 구현하여 골퍼의 퍼포먼스를 향상시킵니다.',
      brandStory: [
        '1970년대부터 이어지는 샤프트 제조 전통',
        '2000년대 티타늄 파이버 기술 개발',
        '2010년대 DOGATTI GENERATION 탄생',
        '2020년대 한국 시장 진출'
      ],
      
      // Muziik Golf 브랜드 소개
      muziikGolfTitle: 'Muziik Golf',
      muziikGolfSubtitle: 'MUZIIK TO GOLFERS\' EARS',
      muziikGolfDesc: 'Muziik Golf was born out of the concept of enjoying the game as if it was music, aiming to resonate with golfers of all levels by helping them play stress-free golf.',
      muziikGolfFeatures: [
        'Cutting-edge technology and premium craftsmanship',
        'Designed to help golfers hit better and score lower',
        'Less effort and no worry approach',
        'Make golf a symphony of joy with Muziik!'
      ],
      muziikGolfWebsite: 'https://muziik-golf.com/japan/home.html',
      muziikGolfEmail: 'info@muziik-golf.com',
      
      // 기술력
      technologyTitle: '기술력',
      technologyDesc: 'MUZIIK의 기술력은 오랜 연구 개발과 제조 경험에 기반하고 있습니다. 특히 티타늄 파이버 기술 분야에서는 업계를 선도하는 기술을 보유하고 있습니다.',
      technologyFeatures: [
        '나노레벨 수지 기술',
        '티타늄 파이버 전장 사용 기술',
        '역토크 방지 기술',
        '정밀한 강성 분포 제어'
      ],
      
      // 한국 진출
      koreaTitle: '한국 시장 진출',
      koreaDesc: 'MUZIIK는 한국 골프 시장에 정식으로 진출하여 DOGATTI GENERATION 샤프트의 정식 수입 판매를 진행하고 있습니다.',
      koreaFeatures: [
        '한국 정식 수입 판매 대리점',
        '현지 애프터 서비스',
        '전문 피팅 서비스',
        '품질 보증 시스템'
      ],
      
      // 연락처
      contactTitle: '문의하기',
      contactDesc: 'DOGATTI GENERATION 샤프트에 대한 문의사항은 아래로 연락해 주세요.',
      email: 'info@masgolf.co.kr',
      phone: '전화 문의',
      address: '한국 서울'
    }
  };

  const t = content[language];

  return (
    <>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.description} />
        <meta name="keywords" content="MUZIIK,일본골프샤프트,도가티,골프샤프트제조사,일본제골프샤프트,DOGATTI GENERATION,골프샤프트수입,프리미엄골프샤프트" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content="MUZIIK - 일본제 프리미엄 골프 샤프트" />
        <meta property="og:description" content="40년 전통의 일본제 프리미엄 골프 샤프트. MUZIIK DOGATTI GENERATION의 한국 정식 수입 판매." />
        <meta property="og:image" content="/muziik/about-og.jpg" />
        <meta property="og:url" content="https://muziik.masgolf.co.kr/about" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MUZIIK - 일본제 프리미엄 골프 샤프트" />
        <meta name="twitter:description" content="40년 전통의 일본제 프리미엄 골프 샤프트." />
        <meta name="twitter:image" content="/muziik/about-og.jpg" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://muziik.masgolf.co.kr/about" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Navigation 
          language={language} 
          onLanguageChange={setLanguage}
          currentPath="/about"
        />

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                {t.heroTitle}
              </h1>
              <h2 className="text-2xl md:text-3xl text-blue-400 mb-8">
                {t.heroSubtitle}
              </h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                {t.heroDescription}
              </p>
            </div>
          </div>
        </section>

        {/* Company Overview */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-6">
                  {t.companyTitle}
                </h2>
                <p className="text-gray-300 text-lg max-w-3xl mx-auto">
                  {t.companyDesc}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                <div>
                  <ul className="space-y-4">
                    {t.companyFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-300 text-lg">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img 
                      src="/muziik/brand/masgolf_store_02.jpeg" 
                      alt={language === 'ja' ? 'MUZIIK 店舗' : 'MUZIIK 매장'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Story */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-6">
                  {t.brandTitle}
                </h2>
                <p className="text-gray-300 text-lg max-w-3xl mx-auto">
                  {t.brandDesc}
                </p>
              </div>
              
              <div className="grid md:grid-cols-4 gap-8">
                {t.brandStory.map((story, index) => (
                  <div key={index} className="text-center">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 h-full">
                      <div className="text-4xl mb-4">
                        {index === 0 && '🏛️'}
                        {index === 1 && '🔬'}
                        {index === 2 && '💎'}
                        {index === 3 && '🇰🇷'}
                      </div>
                      <h3 className="text-white font-semibold mb-3">
                        {language === 'ja' ? `${1970 + index * 10}年代` : `${1970 + index * 10}년대`}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {story}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Muziik Golf Brand */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <div className="mb-6">
                  <img 
                    src="/muziik/logos/muziik-logo2.webp" 
                    alt="Muziik Golf Logo"
                    className="h-16 mx-auto mb-4"
                  />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  {t.muziikGolfTitle}
                </h2>
                <h3 className="text-xl text-blue-400 mb-6">
                  {t.muziikGolfSubtitle}
                </h3>
                <p className="text-gray-300 text-lg max-w-4xl mx-auto leading-relaxed">
                  {t.muziikGolfDesc}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <ul className="space-y-4">
                    {t.muziikGolfFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-300 text-lg">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                  <div className="text-center">
                    <h4 className="text-white font-semibold mb-4">For the latest information</h4>
                    <a 
                      href={t.muziikGolfWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-lg block mb-4"
                    >
                      {t.muziikGolfWebsite}
                    </a>
                    <p className="text-gray-300 mb-4">If you need more information</p>
                    <a 
                      href={`mailto:${t.muziikGolfEmail}`}
                      className="text-blue-400 hover:text-blue-300 text-lg"
                    >
                      {t.muziikGolfEmail}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-6">
                  {t.technologyTitle}
                </h2>
                <p className="text-gray-300 text-lg max-w-3xl mx-auto">
                  {t.technologyDesc}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {t.technologyFeatures.map((feature, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">
                        {index === 0 && '🔬'}
                        {index === 1 && '💎'}
                        {index === 2 && '⚡'}
                        {index === 3 && '📊'}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-2">
                          {feature}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {language === 'ja' ? '最先端技術' : '최첨단 기술'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Korea Market */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-6">
                  {t.koreaTitle}
                </h2>
                <p className="text-gray-300 text-lg max-w-3xl mx-auto">
                  {t.koreaDesc}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img 
                      src="/muziik/brand/masgolf_store_02.jpeg" 
                      alt={language === 'ja' ? '韓国市場 진출' : '한국 시장 진출'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <ul className="space-y-4">
                    {t.koreaFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-300 text-lg">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 bg-blue-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              {t.contactTitle}
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {t.contactDesc}
            </p>
            <div className="space-y-4">
              <a 
                href="mailto:info@masgolf.co.kr"
                className="inline-block bg-white text-blue-900 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
              >
                {t.email}
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 py-8">
          <div className="container mx-auto px-4">
            <div className="text-center text-gray-400">
              <p>&copy; 2025 MUZIIK. All rights reserved.</p>
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
