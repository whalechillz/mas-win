import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Navigation from '../../components/muziik/Navigation';

export default function TechnologyPage() {
  const router = useRouter();
  const { locale } = router;
  const [footerExpanded, setFooterExpanded] = useState(false);

  // 언어별 콘텐츠
  const content = {
    ja: {
      title: 'MUZIIK - Dogatti Generation Technology',
      description: 'DOGATTI GENERATION シャフトの革新的なテクノロジー - ナノレベル樹脂、逆トルク防止、チタンファイバー全長使用技術',
      heroTitle: 'Dogatti Generation Technology',
      heroSubtitle: 'ムジーク独自のチタンファイバー・テクノロジー',
      heroDescription: 'チタンの反発力で飛ばし、インパクト時に起こる逆トルクを防いでコントロール性もアップ。ドガッティゼネレーションはムジーク独自の設計思想に基づき創られた最強シャフト。',
      
      // 기술 특징
      tech1Title: 'ナノレベル樹脂を採用',
      tech1Desc: 'ドガッティゼネレーションに採用されているナノ樹脂。樹脂の含有率を削減し、カーボンの密度を高めることで弾きの良さと打感の向上をもたらします。',
      tech1Features: [
        '樹脂含有率の削減',
        'カーボン密度の向上',
        '弾きの良さの実現',
        '打感の向上'
      ],
      
      tech2Title: 'インパクト時の逆トルクを防ぐ',
      tech2Desc: '軽量シャフトは、そのトルクの多さとヘッド重量の関係性からインパクト時、特にオフセンターショット時に逆トルクは発生します。逆トルクはヘッドの直進性を妨げ、方向性の悪さや、飛距離性能に影響します。',
      tech2Features: [
        '逆トルク発生の減少',
        'ヘッドスピードアップ',
        '加速感の創出',
        '方向性の安定'
      ],
      
      tech3Title: 'チタン繊維を全長に使用',
      tech3Desc: '軽くて弾きに優れたチタン細線をコンポジット。重量は軽量化をキープしながらも、超高弾性のようなしなり戻りとインパクト時のしっかり感を実現しています。',
      tech3Features: [
        '軽量性の維持',
        '超高弾性の実現',
        'しなり戻りの向上',
        'インパクト時の安定感'
      ],
      
      
      // 제품 적용
      applicationTitle: '製品適用',
      applicationDesc: 'これらの革新的な技術がSapphireとBeryl製品にどのように適用されているかをご確認ください。',
      sapphireLink: 'Sapphire製品を見る',
      berylLink: 'Beryl製品を見る'
    },
    ko: {
      title: 'MUZIIK - Dogatti Generation Technology',
      description: 'DOGATTI GENERATION 샤프트의 혁신적인 테크놀로지 - 프리프레그 기술, 낮은 토크 달성, 전장 티타늄 섬유 사용 기술',
      heroTitle: 'Dogatti Generation Technology',
      heroSubtitle: '무지크 독자적인 티타늄 파이버 테크놀로지',
      heroDescription: '티타늄의 반발력으로 비거리를 늘리고, 임팩트시 발생하는 역토크를 방지하여 컨트롤성도 향상. 도가티 제네레이션은 무지크 독자적인 설계 사상에 기반하여 만들어진 최강 샤프트.',
      
      // 기술 특징
      tech1Title: '프리프레그 기술 채택',
      tech1Desc: '도가티 제네레이션에 채택된 프리프레그(Pre-preg) 기술. 카본에 수지를 사전 함침시켜 샤프트 자체의 수지 함량을 낮추고 카본 밀도를 높여 반발성과 타감의 향상을 가져옵니다.',
      tech1Features: [
        '저수지 함량으로 경량화',
        '고카본 밀도로 강성 향상',
        '반발력 증가로 비거리 향상',
        '타격감 개선'
      ],
      
      tech2Title: '낮은 토크 달성',
      tech2Desc: '경량 샤프트는 높은 토크 수치(5.0°~7.0°)로 인해 임팩트시 뒤틀림이 발생합니다. 헤드 무게와 상호작용하여 역토크가 발생하며, 이는 방향성과 비거리 성능에 영향을 줍니다. 도가티 제네레이션은 전장 티타늄 섬유로 토크 수치를 3.0°~4.0°로 낮춰 역토크를 방지합니다.',
      tech2Features: [
        '토크 수치 3.0°~4.0° 달성',
        '임팩트시 뒤틀림 최소화',
        '역토크 방지로 정확도 향상',
        '방향성과 비거리 확보'
      ],
      
      tech3Title: '전장 티타늄 섬유',
      tech3Desc: '샤프트 전체에 걸쳐 티타늄 섬유를 사용하여 균일한 성능을 실현합니다. 경량화를 유지하면서도 전장에 걸친 일관된 반발력과 임팩트시 안정성을 극대화합니다.',
      tech3Features: [
        '샤프트 전체에 걸친 균일한 성능',
        '전장에 걸친 일관된 반발력',
        '임팩트시 안정성 극대화',
        '경량화와 강성의 완벽한 조화'
      ],
      
      
      // 제품 적용
      applicationTitle: '제품 적용',
      applicationDesc: '이러한 혁신적인 기술들이 Sapphire와 Beryl 제품에 어떻게 적용되었는지 확인해보세요.',
      sapphireLink: 'Sapphire 제품 보기',
      berylLink: 'Beryl 제품 보기'
    }
  };

  const t = content[locale];

  return (
    <>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.description} />
        <meta name="keywords" content="MUZIIK,도가티,골프샤프트기술,티타늄파이버,프리프레그,낮은토크,역토크방지,골프샤프트테크놀로지,DOGATTI GENERATION" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content="MUZIIK Dogatti Generation Technology" />
        <meta property="og:description" content="프리프레그 기술, 낮은 토크 달성, 전장 티타늄 섬유 사용 기술. MUZIIK 독자적인 샤프트 테크놀로지." />
        <meta property="og:image" content="/muziik/technology-og.jpg" />
        <meta property="og:url" content="https://masgolf.co.kr/muziik/technology" />
        <meta property="og:type" content="article" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MUZIIK Dogatti Generation Technology" />
        <meta name="twitter:description" content="프리프레그 기술, 낮은 토크 달성, 전장 티타늄 섬유 사용 기술." />
        <meta name="twitter:image" content="/muziik/technology-og.jpg" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://masgolf.co.kr/muziik/technology" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Navigation 
          currentPath="/technology"
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

        {/* Technology Features */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              
              {/* Tech 1: Nano Resin */}
              <div className="mb-16">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="text-6xl mb-6">🔬</div>
                    <h3 className="text-3xl font-bold text-white mb-6">
                      {t.tech1Title}
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed mb-6">
                      {t.tech1Desc}
                    </p>
                    <ul className="space-y-3">
                      {t.tech1Features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <img 
                        src="/muziik/technology/dogatti-nano-resin.webp" 
                        alt={locale === 'ja' ? 'ナノ樹脂構造' : '나노 수지 구조'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tech 2: Reverse Torque Prevention */}
              <div className="mb-16">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="order-2 md:order-1">
                    <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <img 
                          src="/muziik/technology/dogatti-reverse-torque.webp" 
                          alt={locale === 'ja' ? '逆トルク防止' : '역토크 방지'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="order-1 md:order-2">
                    <div className="text-6xl mb-6">⚡</div>
                    <h3 className="text-3xl font-bold text-white mb-6">
                      {t.tech2Title}
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed mb-6">
                      {t.tech2Desc}
                    </p>
                    <ul className="space-y-3">
                      {t.tech2Features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tech 3: Titanium Fiber */}
              <div className="mb-16">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="text-6xl mb-6">💎</div>
                    <h3 className="text-3xl font-bold text-white mb-6">
                      {t.tech3Title}
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed mb-6">
                      {t.tech3Desc}
                    </p>
                    <ul className="space-y-3">
                      {t.tech3Features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <img 
                        src="/muziik/technology/dogatti-titanium-fiber.webp" 
                        alt={locale === 'ja' ? 'チタン繊維構造' : '티타늄 섬유 구조'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Japan Titanium Section */}
        <section className="py-16 bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto text-center">
              <div className="mb-8">
                <img 
                  src="/muziik/brand/japan_titan_white.png" 
                  alt="Japan Titanium"
                  className="mx-auto h-20 w-auto object-contain mb-6"
                />
                <h2 className="text-4xl font-bold text-white mb-4">
                  {locale === 'ja' ? 'Japan Titanium' : 'Japan Titanium'}
                </h2>
                <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                  {locale === 'ja' 
                    ? '日本の最高品質チタンを使用したプレミアムシャフト。40年の伝統と最新技術が融合した、世界最高水準のゴルフシャフトを提供します。'
                    : '일본의 최고 품질 티타늄을 사용한 프리미엄 샤프트. 40년 전통과 최신 기술이 융합된, 세계 최고 수준의 골프 샤프트를 제공합니다.'
                  }
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700">
                  <div className="text-4xl mb-6">🇯🇵</div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    {locale === 'ja' ? '日本製品質' : '일본제 품질'}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {locale === 'ja' 
                      ? '40年の伝統と職人技術による最高品質のシャフト製造。日本の精密技術が生み出す完璧なシャフト。'
                      : '40년 전통과 장인 기술에 의한 최고 품질의 샤프트 제조. 일본의 정밀 기술이 만들어내는 완벽한 샤프트.'
                    }
                  </p>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700">
                  <div className="text-4xl mb-6">💎</div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    {locale === 'ja' ? 'プレミアムチタン' : '프리미엄 티타늄'}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {locale === 'ja' 
                      ? '日本最高品質のチタン素材を使用した高級シャフト。軽量でありながら強度と弾性を両立。'
                      : '일본 최고 품질의 티타늄 소재를 사용한 고급 샤프트. 경량이면서도 강도와 탄성을 양립.'
                    }
                  </p>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700">
                  <div className="text-4xl mb-6">🏆</div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    {locale === 'ja' ? '世界最高水準' : '세계 최고 수준'}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {locale === 'ja' 
                      ? '日本の技術力が生み出す世界最高水準のゴルフシャフト。プロゴルファーも認める品質。'
                      : '일본의 기술력이 만들어내는 세계 최고 수준의 골프 샤프트. 프로 골퍼도 인정하는 품질.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Product Application Section */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-8">
                {t.applicationTitle}
              </h2>
              <p className="text-gray-300 text-lg mb-12">
                {t.applicationDesc}
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <Link 
                  href="/muziik/sapphire"
                  className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg overflow-hidden hover:from-blue-800 hover:to-blue-600 transition-all duration-300 relative block"
                >
                  {/* 제품명 - 이미지 위에 오버레이 */}
                  <div className="absolute top-4 left-4 z-10">
                    <h3 className="text-2xl font-bold text-white">Sapphire</h3>
                  </div>
                  
                  {/* 이미지 - 전체 카드 크기 */}
                  <div className="w-full h-48">
                    <img 
                      src="/muziik/products/sapphire/sapphire_shaft_main2.webp" 
                      alt="Sapphire Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* 설명 - 이미지 위에 오버레이 */}
                  <div className="absolute bottom-4 left-4 z-10">
                    <p className="text-blue-200 text-sm font-medium">
                      {locale === 'ja' ? '超高速反発力とヘッド安定性' : '초고속 반발력과 헤드 안정성'}
                    </p>
                  </div>
                </Link>
                
                <Link 
                  href="/muziik/beryl"
                  className="bg-gradient-to-br from-emerald-900 to-emerald-700 rounded-lg overflow-hidden hover:from-emerald-800 hover:to-emerald-600 transition-all duration-300 relative block"
                >
                  {/* 제품명 - 이미지 위에 오버레이 */}
                  <div className="absolute top-4 left-4 z-10">
                    <h3 className="text-2xl font-bold text-white">Beryl</h3>
                  </div>
                  
                  {/* 이미지 - 전체 카드 크기 */}
                  <div className="w-full h-48">
                    <img 
                      src="/muziik/products/beryl/beryl_shaft_main.webp" 
                      alt="Beryl Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* 설명 - 이미지 위에 오버레이 */}
                  <div className="absolute bottom-4 left-4 z-10">
                    <p className="text-emerald-200 text-sm font-medium">
                      {locale === 'ja' ? '美しさと性能を兼ね備えた' : '아름다움과 성능을 겸비한'}
                    </p>
                  </div>
                </Link>
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
