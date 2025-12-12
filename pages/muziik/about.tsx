import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Navigation from '../../components/muziik/Navigation';

export default function AboutPage() {
  const router = useRouter();
  const { locale } = router;
  const [footerExpanded, setFooterExpanded] = useState(false);

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
      brandTitle: 'MASSGOO X MUZIIK コラボレーション',
      brandDesc: 'MASSGOOとMUZIIKの戦略的パートナーシップにより、韓国のゴルファーに最高品質の日本製プレミアムシャフトを提供します。',
      brandStory: [
        'MUZIIKとのパートナーシップ締結',
        'DOGATTI GENERATION技術導入',
        '韓国市場向けカスタマイズサービス開発',
        '専門コンサルティング及びフィッティングサービス'
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
      koreaTitle: '韓国市場進出',
      koreaDesc: 'MUZIIKは韓国のゴルフ市場に正式に進出し、DOGATTI GENERATION シャフトの正規輸入販売を行っています。',
      koreaFeatures: [
        '韓国正規輸入販売代理店',
        '現地アフターサービス',
        '専門フィッティングサービス',
        '品質保証システム'
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
      
      // 연락처
      contactTitle: 'お問い合わせ',
      contactDesc: 'DOGATTI GENERATION シャフトに関するお問い合わせは、下記までご連絡ください。',
      email: 'massgoogolf@gmail.com',
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
      companyDesc: 'MASSGOO는 MUZIIK와의 협업을 통해 일본제 프리미엄 골프 샤프트 DOGATTI GENERATION을 한국 시장에 소개하는 기업입니다.',
      companyFeatures: [
        'MUZIIK와의 전략적 파트너십',
        'DOGATTI GENERATION 한국 정식 수입',
        '전문 골프 샤프트 컨설팅',
        '한국 골퍼를 위한 맞춤 서비스'
      ],
      
      // 브랜드 스토리
      brandTitle: 'MASSGOO X MUZIIK 협업',
      brandDesc: 'MASSGOO와 MUZIIK의 전략적 파트너십을 통해 한국 골퍼들에게 최고 품질의 일본제 프리미엄 샤프트를 제공합니다.',
      brandStory: [
        'MUZIIK와의 파트너십 체결',
        'DOGATTI GENERATION 기술 도입',
        '한국 시장 맞춤 서비스 개발',
        '전문 컨설팅 및 피팅 서비스'
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
      technologyTitle: 'DOGATTI GENERATION 기술',
      technologyDesc: 'MUZIIK의 DOGATTI GENERATION 기술은 혁신적인 티타늄 파이버와 프리프레그 기술을 통해 최고의 성능을 구현합니다.',
      technologyFeatures: [
        '프리프레그 기술',
        '전장 티타늄 섬유',
        '낮은 토크 달성',
        '역토크 방지 기술'
      ],
      
      // 한국 진출
      koreaTitle: 'MASSGOO X MUZIIK 한국 진출',
      koreaDesc: 'MASSGOO와 MUZIIK의 협업을 통해 한국 골퍼들에게 DOGATTI GENERATION 샤프트의 최고 품질을 제공합니다.',
      koreaFeatures: [
        'MASSGOO를 통한 한국 정식 수입',
        '전문 컨설팅 및 피팅 서비스',
        '한국 골퍼 맞춤 애프터 서비스',
        '품질 보증 및 기술 지원'
      ],
      
      // 연락처
      contactTitle: '문의하기',
      contactDesc: 'DOGATTI GENERATION 샤프트에 대한 문의사항은 아래로 연락해 주세요.',
      email: 'massgoogolf@gmail.com',
      phone: '전화 문의',
      address: '한국 서울'
    }
  };

  const t = content[locale];

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
        <meta property="og:url" content="https://masgolf.co.kr/muziik/about" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MUZIIK - 일본제 프리미엄 골프 샤프트" />
        <meta name="twitter:description" content="40년 전통의 일본제 프리미엄 골프 샤프트." />
        <meta name="twitter:image" content="/muziik/about-og.jpg" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://masgolf.co.kr/muziik/about" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Navigation 
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
                      src="/muziik/brand/muziik_company.webp" 
                      alt={locale === 'ja' ? 'MUZIIK 会社' : 'MUZIIK 회사'}
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
                        {index === 0 && '🤝'}
                        {index === 1 && '💎'}
                        {index === 2 && '🎯'}
                        {index === 3 && '🇰🇷'}
                      </div>
                      <h3 className="text-white font-semibold mb-3">
                        {index === 0 && (locale === 'ja' ? 'パートナーシップ' : '파트너십')}
                        {index === 1 && (locale === 'ja' ? '技術導入' : '기술 도입')}
                        {index === 2 && (locale === 'ja' ? 'サービス開発' : '서비스 개발')}
                        {index === 3 && (locale === 'ja' ? '韓国進出' : '한국 진출')}
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
                    src="/muziik/brand/muziik-logo2.webp" 
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
              
              {/* 협업 샤프트 시안 이미지 */}
              <div className="mb-12">
                <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                  <div className="aspect-[21/9] w-full">
                    <img 
                      src="/muziik/brand/massgooxmuziik.png" 
                      alt="MASSGOO X MUZIIK 협업 샤프트 시안"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h4 className="text-white font-semibold text-center">
                      {locale === 'ja' ? 'MASSGOO X MUZIIK コラボレーションシャフト試案' : 'MASSGOO X MUZIIK 협업 샤프트 시안'}
                    </h4>
                  </div>
                </div>
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
                          {index === 0 && (locale === 'ja' ? '高強度複合材料' : '고강도 복합재료')}
                          {index === 1 && (locale === 'ja' ? '超高速反発力' : '초고속 반발력')}
                          {index === 2 && (locale === 'ja' ? '安定したスイング' : '안정된 스윙')}
                          {index === 3 && (locale === 'ja' ? '精密制御' : '정밀한 제어')}
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
                      alt={locale === 'ja' ? '韓国市場進出' : '한국 시장 진출'}
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
              <Link 
                href="/muziik/contact"
                className="inline-block bg-white text-blue-900 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
              >
                {locale === 'ja' ? 'お問い合わせする' : '문의하기'}
              </Link>
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
              <p>&copy; 2025 MASSGOO X MUZIIK. All rights reserved.</p>
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
