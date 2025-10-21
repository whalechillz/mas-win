import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Navigation from '../../components/muziik/Navigation';

export default function MuziikHome() {
  const [language, setLanguage] = useState<'ja' | 'ko'>('ko');

  // 언어별 콘텐츠
  const content = {
    ja: {
      title: 'MUZIIK - DOGATTI GENERATION シャフト',
      description: 'DOGATTI GENERATION シャフト - 日本製プレミアムゴルフシャフトの最高峰。チタンファイバー技術による超高速反発力とヘッド安定性を実現。',
      heroTitle: 'MUZIIK',
      heroSubtitle: 'DOGATTI GENERATION シャフト',
      heroDescription: '日本製プレミアムゴルフシャフトの最高峰。<br />チタンファイバー技術による超高速反発力とヘッド安定性を実現する、<br />革新的なシャフトテクノロジーをお届けします。',
      featuresTitle: 'MUZIIKの特徴',
      feature1: '超高速反発力',
      feature1Desc: 'チタンファイバー技術による革新的な反発性能で、最大限のボールスピードを実現',
      feature2: 'ヘッド安定性',
      feature2Desc: 'オフセンター時のヘッドブレを抑制し、正確なショットをサポート',
      feature3: '日本製品質',
      feature3Desc: '40年の伝統と最新技術を融合した、最高品質のシャフト製造',
      productsTitle: '製品ラインナップ',
      technologyTitle: '革新的なテクノロジー',
      ctaTitle: 'お問い合わせ',
      ctaDescription: '詳細な情報やカスタムオーダーについては、お気軽にお問い合わせください。<br />専門スタッフがお客様のニーズに最適なシャフトをご提案いたします。',
      ctaButton: 'お問い合わせする',
      footer: 'DOGATTI GENERATION シャフト - 日本製プレミアムゴルフシャフト'
    },
    ko: {
      title: 'MUZIIK - DOGATTI GENERATION 샤프트',
      description: 'DOGATTI GENERATION 샤프트 - 일본제 프리미엄 골프 샤프트의 최고봉. 티타늄 파이버 기술로 초고속 반발력과 헤드 안정성을 실현합니다.',
      heroTitle: 'MUZIIK',
      heroSubtitle: 'DOGATTI GENERATION 샤프트',
      heroDescription: '일본제 프리미엄 골프 샤프트의 최고봉.<br />티타늄 파이버 기술로 초고속 반발력과 헤드 안정성을 실현하는<br />혁신적인 샤프트 테크놀로지를 제공합니다.',
      featuresTitle: 'MUZIIK의 특징',
      feature1: '초고속 반발력',
      feature1Desc: '티타늄 파이버 기술로 혁신적인 반발 성능을 구현하여 최대한의 볼 스피드를 실현합니다',
      feature2: '헤드 안정성',
      feature2Desc: '오프센터 시 헤드 흔들림을 억제하여 정확한 샷을 지원합니다',
      feature3: '일본제 품질',
      feature3Desc: '40년 전통과 최신 기술을 융합한 최고 품질의 샤프트 제조',
      productsTitle: '제품 라인업',
      technologyTitle: '혁신적인 테크놀로지',
      ctaTitle: '문의하기',
      ctaDescription: '자세한 정보나 커스텀 오더에 대해서는 언제든지 문의해 주세요.<br />전문 스태프가 고객님의 니즈에 최적한 샤프트를 제안해 드립니다.',
      ctaButton: '문의하기',
      footer: 'DOGATTI GENERATION 샤프트 - 일본제 프리미엄 골프 샤프트'
    }
  };

  const t = content[language];

  return (
    <>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.description} />
        <meta name="keywords" content="뮤직샤프트,MUZIIK,도가티,마쓰구드라이버,골프샤프트,프리미엄샤프트,일본샤프트,DOGATTI GENERATION,Sapphire,Beryl" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content="MUZIIK 샤프트 x 마쓰구 드라이버" />
        <meta property="og:description" content="일본 최고급 MUZIIK DOGATTI GENERATION 샤프트. 마쓰구 드라이버와 완벽한 조합. 국내 정식 수입." />
        <meta property="og:image" content="/muziik/og-image.jpg" />
        <meta property="og:url" content="https://muziik.masgolf.co.kr" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MUZIIK" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MUZIIK 샤프트 x 마쓰구 드라이버" />
        <meta name="twitter:description" content="일본 최고급 MUZIIK DOGATTI GENERATION 샤프트. 마쓰구 드라이버와 완벽한 조합." />
        <meta name="twitter:image" content="/muziik/og-image.jpg" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="MUZIIK" />
        <meta name="language" content="ko" />
        <link rel="canonical" href="https://muziik.masgolf.co.kr" />
      </Head>

      <div className="min-h-screen bg-black text-white overflow-x-hidden">
        <Navigation 
          language={language} 
          onLanguageChange={setLanguage}
          currentPath="/muziik"
        />


        {/* Hero Section */}
          <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 py-20">
            <div className="container mx-auto px-4">
              <div className="text-center">
                {/* 1군: 기호화된 상단 - 장비병 환자 타겟팅 */}
                <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-3 mb-8">
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                    NEW
                  </span>
                  
                  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 text-blue-300">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      <div className="flex items-center">
                        <span className="text-2xl md:text-3xl font-black text-blue-300 tracking-tight">
                          美
                        </span>
                        <span className="text-xs text-gray-400 ml-1">
                          압도적인
                        </span>
                      </div>
                    </div>
                    
                    <span className="text-gray-500 hidden md:block">|</span>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💎</span>
                      <div className="flex items-center">
                        <span className="text-2xl md:text-3xl font-black text-blue-300 tracking-tight">
                          輝
                        </span>
                        <span className="text-xs text-gray-400 ml-1">
                          광채의
                        </span>
                      </div>
                    </div>
                    
                    <span className="text-gray-500 hidden md:block">|</span>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚀</span>
                      <div className="flex items-center">
                        <span className="text-2xl md:text-3xl font-black text-blue-300 tracking-tight">
                          若
                        </span>
                        <span className="text-xs text-gray-400 ml-1">
                          젊음
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-blue-400 text-lg font-medium mb-12">
                  {t.heroSubtitle}
                </div>
                
                {/* 2군: 메인 메시지 */}
                <div className="space-y-6 mb-16">
                  <h1 className="text-6xl md:text-8xl font-bold text-white">
                    MUZIIK
                  </h1>
                  <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
                    {language === 'ja' ? '優雅なエンジニアリング。爆発的なパワー。世代を超えるパフォーマンス。' : '우아한 엔지니어링. 폭발적인 파워. 세대를 뛰어넘는 퍼포먼스.'}
                  </p>
                  <p className="text-gray-400 text-base max-w-3xl mx-auto leading-relaxed">
                    {language === 'ja' ? 'チタンファイバー技術による超高速反発力とヘッド安定性を実現する<br/>革新的なシャフトテクノロジーをお届けします。' : '티타늄 파이버 기술로 초고속 반발력과 헤드 안정성을 실현하는<br/>혁신적인 샤프트 테크놀로지를 제공합니다.'}
                  </p>
                </div>
                
                {/* 3군: 기술 카드 (미니멀) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
                  {/* 티타늄 파이버 기술 */}
                  <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-8 border border-blue-500/30 hover:border-blue-400 transition-all duration-300">
                    <div className="aspect-square w-full mb-6 overflow-hidden rounded-lg">
                      <img 
                        src="/muziik/brand/titan_1.png" 
                        alt={language === 'ja' ? 'チタン原石' : '티타늄 원석'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 text-center">
                      {language === 'ja' ? 'チタンファイバー技術' : '티타늄 파이버 기술'}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed text-center">
                      {language === 'ja' 
                        ? 'シャフト全体にチタンファイバーを使用することで、引張強度を向上させ、反発性を高めます。'
                        : '샤프트 전체에 티타늄 파이버를 사용하여 인장 강도를 향상시키고 반발성을 높입니다.'
                      }
                    </p>
                  </div>
                  
                  {/* 오토플렉스 설계 */}
                  <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-8 border border-blue-500/30 hover:border-blue-400 transition-all duration-300">
                    <div className="aspect-square w-full mb-6 overflow-hidden rounded-lg">
                      <img 
                        src="/muziik/brand/one-flex-1.webp" 
                        alt={language === 'ja' ? 'オートフレックス設計' : '오토플렉스 설계'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 text-center">
                      {language === 'ja' ? 'オートフレックス設計' : '오토플렉스 설계'}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed text-center">
                      {language === 'ja' 
                        ? 'ヘッドスピードに関係なく、様々なゴルファーに適した自動的なオートフレックスタイプ。バックスイングからインパクトまで安定したパフォーマンスを提供します。'
                        : '헤드 스피드에 관계없이 다양한 골퍼에게 적합한 자동적인 오토플렉스 타입. 백스윙부터 임팩트까지 안정된 퍼포먼스를 제공합니다.'
                      }
                    </p>
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
                  className="mx-auto h-16 w-auto object-contain mb-6"
                />
                <h2 className="text-4xl font-bold text-white mb-4">
                  {language === 'ja' ? 'Japan Titanium' : 'Japan Titanium'}
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  {language === 'ja' 
                    ? '日本の最高品質チタンを使用したプレミアムシャフト。40年の伝統と最新技術が融合した、世界最高水準のゴルフシャフトを提供します。'
                    : '일본의 최고 품질 티타늄을 사용한 프리미엄 샤프트. 40년 전통과 최신 기술이 융합된, 세계 최고 수준의 골프 샤프트를 제공합니다.'
                  }
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="text-3xl mb-4">🇯🇵</div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {language === 'ja' ? '日本製品質' : '일본제 품질'}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {language === 'ja' 
                      ? '40年の伝統と職人技術による最高品質のシャフト製造'
                      : '40년 전통과 장인 기술에 의한 최고 품질의 샤프트 제조'
                    }
                  </p>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="text-3xl mb-4">💎</div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {language === 'ja' ? 'プレミアムチタン' : '프리미엄 티타늄'}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {language === 'ja' 
                      ? '日本最高品質のチタン素材を使用した高級シャフト'
                      : '일본 최고 품질의 티타늄 소재를 사용한 고급 샤프트'
                    }
                  </p>
                </div>
                
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="text-3xl mb-4">🏆</div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {language === 'ja' ? '世界最高水準' : '세계 최고 수준'}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {language === 'ja' 
                      ? '日本の技術力が生み出す世界最高水準のゴルフシャフト'
                      : '일본의 기술력이 만들어내는 세계 최고 수준의 골프 샤프트'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Highlights Section */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-6">
                {language === 'ja' ? '革新的なテクノロジー' : '혁신적인 테크놀로지'}
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                {language === 'ja' 
                  ? 'MUZIIK独自の技術が実現する、ゴルフシャフトの新たな可能性。'
                  : 'MUZIIK 독자 기술이 실현하는, 골프 샤프트의 새로운 가능성.'
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              {/* Tech 1: Nano Resin */}
              <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
                <div className="aspect-video rounded-lg overflow-hidden mb-6">
                  <img 
                    src="/muziik/technology/dogatti-nano-resin.webp" 
                    alt={language === 'ja' ? 'ナノ樹脂構造' : '나노 수지 구조'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {language === 'ja' ? 'ナノレベル樹脂採用' : '나노레벨 수지 채택'}
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  {language === 'ja' 
                    ? '樹脂含有率を削減し、カーボン密度を高めることで弾きの良さと打感の向上を実現。'
                    : '수지 함유율을 감소시키고 카본 밀도를 높여 반발성과 타감의 향상을 실현합니다.'
                  }
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-400">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    {language === 'ja' ? '樹脂含有率の削減' : '수지 함유율 감소'}
                  </li>
                  <li className="flex items-center text-sm text-gray-400">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    {language === 'ja' ? 'カーボン密度の向上' : '카본 밀도 향상'}
                  </li>
                  <li className="flex items-center text-sm text-gray-400">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    {language === 'ja' ? '弾きの良さの実現' : '반발성 향상'}
                  </li>
                </ul>
              </div>

              {/* Tech 2: Reverse Torque Prevention */}
              <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
                <div className="aspect-video rounded-lg overflow-hidden mb-6">
                  <img 
                    src="/muziik/technology/dogatti-reverse-torque.webp" 
                    alt={language === 'ja' ? '逆トルク防止' : '역토크 방지'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {language === 'ja' ? 'インパクト時の逆トルク防止' : '임팩트시 역토크 방지'}
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  {language === 'ja' 
                    ? '軽量シャフト特有の逆トルクを抑制し、ヘッドの直進性と方向性を向上。'
                    : '경량 샤프트 특유의 역토크를 억제하여 헤드의 직진성과 방향성을 향상시킵니다.'
                  }
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-400">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                    {language === 'ja' ? '逆トルク発生の減少' : '역토크 발생 감소'}
                  </li>
                  <li className="flex items-center text-sm text-gray-400">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                    {language === 'ja' ? 'ヘッドスピードアップ' : '헤드 스피드 향상'}
                  </li>
                  <li className="flex items-center text-sm text-gray-400">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                    {language === 'ja' ? '方向性の安定' : '방향성 안정'}
                  </li>
                </ul>
              </div>

              {/* Tech 3: Titanium Fiber */}
              <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
                <div className="aspect-video rounded-lg overflow-hidden mb-6">
                  <img 
                    src="/muziik/technology/dogatti-titanium-fiber.webp" 
                    alt={language === 'ja' ? 'チタン繊維' : '티타늄 섬유'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {language === 'ja' ? 'チタン繊維全長使用' : '티타늄 섬유 전장 사용'}
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  {language === 'ja' 
                    ? '軽量でありながら超高弾性を実現。しなり戻りとインパクト時の安定感を両立。'
                    : '경량이면서도 초고탄성을 실현. 휨 복원과 임팩트시 안정감을 양립합니다.'
                  }
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-400">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    {language === 'ja' ? '軽量性の維持' : '경량성 유지'}
                  </li>
                  <li className="flex items-center text-sm text-gray-400">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    {language === 'ja' ? '超高弾性の実現' : '초고탄성 실현'}
                  </li>
                  <li className="flex items-center text-sm text-gray-400">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    {language === 'ja' ? 'インパクト時の安定感' : '임팩트시 안정감'}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-white mb-12">
              {t.featuresTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold text-white mb-2">{t.feature1}</h3>
                <p className="text-gray-400">
                  {t.feature1Desc}
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-white mb-2">{t.feature2}</h3>
                <p className="text-gray-400">
                  {t.feature2Desc}
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🇯🇵</div>
                <h3 className="text-xl font-semibold text-white mb-2">{t.feature3}</h3>
                <p className="text-gray-400">
                  {t.feature3Desc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-white mb-12">
              {t.productsTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-6xl mx-auto">
              
              {/* Sapphire Product Card */}
              <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                <div className="relative h-64 bg-gradient-to-br from-blue-900 to-blue-700">
                  <img 
                    src="/muziik/products/sapphire/sapphire_shaft_main2.webp" 
                    alt="Sapphire Shaft"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="relative z-10 h-full flex flex-col items-center justify-center bg-black/20">
                    <h3 className="text-2xl font-bold text-white">Sapphire</h3>
                    <p className="text-blue-200 text-sm mt-2">AUTO-FLEX</p>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      NEW
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    DOGATTI GENERATION Sapphire Auto-flex
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    DOGATTI GENERATION Sapphire Auto-flex
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    {language === 'ja' 
                      ? '超高速の反発力とヘッド安定性を実現する、MUZIIK独自のチタンファイバー技術を採用したプレミアムシャフト。'
                      : '초고속의 반발력과 헤드 안정성을 실현하는, MUZIIK 독자적인 티타늄 파이버 기술을 채택한 프리미엄 샤프트.'
                    }
                  </p>

                  {/* Sapphire 스펙 미리보기 */}
                  <div className="mb-4 bg-gray-800 rounded p-3">
                    <h4 className="text-white font-semibold mb-2 text-sm">
                      {language === 'ja' ? 'DOGATTI GENERATION SAPPHIRE 40/50' : 'DOGATTI GENERATION SAPPHIRE 40/50'}
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-gray-300 min-w-full">
                        <thead>
                          <tr className="border-b border-gray-600">
                            <th className="text-left py-1 px-2">{language === 'ja' ? 'Model' : 'Model'}</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? '全長(mm)' : '전장(mm)'}</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? '重量(g)' : '중량(g)'}</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? 'Tip(mm)' : 'Tip(mm)'}</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? 'Butt(mm)' : 'Butt(mm)'}</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? 'トルク(°↓)' : '토크(°↓)'}</th>
                            <th className="text-left py-1 px-2">CPM</th>
                            <th className="text-left py-1 px-2">K.P.</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-700">
                            <td className="py-1 px-2">40</td>
                            <td className="py-1 px-2">1130</td>
                            <td className="py-1 px-2">45</td>
                            <td className="py-1 px-2">8.55</td>
                            <td className="py-1 px-2">15.05</td>
                            <td className="py-1 px-2">5.0</td>
                            <td className="py-1 px-2">200</td>
                            <td className="py-1 px-2">더블킥</td>
                          </tr>
                          <tr>
                            <td className="py-1 px-2">50</td>
                            <td className="py-1 px-2">1130</td>
                            <td className="py-1 px-2">54</td>
                            <td className="py-1 px-2">8.55</td>
                            <td className="py-1 px-2">15.4</td>
                            <td className="py-1 px-2">4.2</td>
                            <td className="py-1 px-2">215</td>
                            <td className="py-1 px-2">더블킥</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Sapphire 후킹 이미지 */}
                  <div className="mb-4 bg-gray-800 rounded overflow-hidden border border-gray-700">
                    <img
                      src="/muziik/products/sapphire/sapphire_shaft_40.webp"
                      alt="DOGATTI GENERATION Sapphire Auto-flex shaft"
                      className="w-full h-32 object-cover object-center"
                    />
                  </div>

                  <Link 
                    href="/sapphire"
                    className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    {language === 'ja' ? '詳細を見る' : '자세히 보기'}
                  </Link>
                </div>
              </div>

              {/* Beryl Product Card */}
              <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                <div className="relative h-64 bg-gradient-to-br from-emerald-900 to-emerald-700">
                  <img 
                    src="/muziik/products/beryl/beryl_shaft_main.webp" 
                    alt="Beryl Shaft"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="relative z-10 h-full flex items-end justify-start p-4 bg-black/20">
                    <h3 className="text-2xl font-bold text-white">Beryl</h3>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      NEW
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    DOGATTI GENERATION Beryl
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    DOGATTI GENERATION Beryl
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    {language === 'ja' 
                      ? '高弾性カーボンシートとチタンファイバーを組み合わせた、美しさと性能を兼ね備えたプレミアムシャフト。'
                      : '고탄성 카본 시트와 티타늄 파이버를 조합한, 아름다움과 성능을 겸비한 프리미엄 샤프트.'
                    }
                  </p>

                  {/* Beryl 스펙 미리보기 */}
                  <div className="mb-4 bg-gray-800 rounded p-3">
                    <h4 className="text-white font-semibold mb-2 text-sm">
                      {language === 'ja' ? 'DOGATTI GENERATION BERYL' : 'DOGATTI GENERATION BERYL'}
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-gray-300 min-w-full">
                        <thead>
                          <tr className="border-b border-gray-600">
                            <th className="text-left py-1 px-2">FLEX</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? '全長(mm)' : '전장(mm)'}</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? '重量(g)' : '중량(g)'}</th>
                            <th className="text-left py-1 px-2">Tip(mm)</th>
                            <th className="text-left py-1 px-2">Butt(mm)</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? 'トルク(°↓)' : '토크(°↓)'}</th>
                            <th className="text-left py-1 px-2">CPM</th>
                            <th className="text-left py-1 px-2">K.P.</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-700">
                            <td className="py-1 px-2">R2</td>
                            <td className="py-1 px-2">1136</td>
                            <td className="py-1 px-2">42</td>
                            <td className="py-1 px-2">8.55</td>
                            <td className="py-1 px-2">14.95</td>
                            <td className="py-1 px-2">5.0</td>
                            <td className="py-1 px-2">230</td>
                            <td className="py-1 px-2">先中調子</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="py-1 px-2">R</td>
                            <td className="py-1 px-2">1136</td>
                            <td className="py-1 px-2">48</td>
                            <td className="py-1 px-2">8.55</td>
                            <td className="py-1 px-2">15.1</td>
                            <td className="py-1 px-2">4.0</td>
                            <td className="py-1 px-2">240</td>
                            <td className="py-1 px-2">先中調子</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="py-1 px-2">SR</td>
                            <td className="py-1 px-2">1136</td>
                            <td className="py-1 px-2">49</td>
                            <td className="py-1 px-2">8.55</td>
                            <td className="py-1 px-2">15.15</td>
                            <td className="py-1 px-2">4.0</td>
                            <td className="py-1 px-2">250</td>
                            <td className="py-1 px-2">先中調子</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="py-1 px-2">S</td>
                            <td className="py-1 px-2">1136</td>
                            <td className="py-1 px-2">50</td>
                            <td className="py-1 px-2">8.55</td>
                            <td className="py-1 px-2">15.2</td>
                            <td className="py-1 px-2">4.0</td>
                            <td className="py-1 px-2">260</td>
                            <td className="py-1 px-2">先中調子</td>
                          </tr>
                          <tr>
                            <td className="py-1 px-2">X</td>
                            <td className="py-1 px-2">1136</td>
                            <td className="py-1 px-2">53</td>
                            <td className="py-1 px-2">8.55</td>
                            <td className="py-1 px-2">15.3</td>
                            <td className="py-1 px-2">3.9</td>
                            <td className="py-1 px-2">270</td>
                            <td className="py-1 px-2">先中調子</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="mt-3 text-xs text-gray-400 text-center">
                        ※ BERYL 50 (SR: 55g, S: 56g, X: 57g) 中調子
                      </div>
                    </div>
                  </div>
                  
                  {/* Beryl 후킹 이미지 */}
                  <div className="mb-4 bg-gray-800 rounded overflow-hidden border border-gray-700">
                    <img
                      src="/muziik/products/beryl/beryl_shaft_40.webp"
                      alt="DOGATTI GENERATION Beryl shaft"
                      className="w-full h-32 object-cover object-center"
                    />
                  </div>

                  <Link 
                    href="/beryl"
                    className="block w-full bg-emerald-600 text-white text-center py-3 rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                  >
                    {language === 'ja' ? '詳細を見る' : '자세히 보기'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              {t.ctaTitle}
            </h2>
            <p 
              className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
              dangerouslySetInnerHTML={{ __html: t.ctaDescription }}
            />
            <a 
              href="mailto:massgoogolf@gmail.com"
              className="inline-block bg-white text-blue-900 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
            >
              {t.ctaButton}
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 py-8">
          <div className="container mx-auto px-4">
            <div className="text-center text-gray-400">
              <p>&copy; 2025 MUZIIK X MASSGOO. All rights reserved.</p>
              <p className="mt-2">{t.footer}</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}