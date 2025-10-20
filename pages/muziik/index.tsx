import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Navigation from '../../components/muziik/Navigation';

export default function MuziikHome() {
  const [language, setLanguage] = useState<'ja' | 'ko'>('ko');
  const [showComparison, setShowComparison] = useState<'new' | 'old' | null>(null);

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

      <div className="min-h-screen bg-black text-white">
        <Navigation 
          language={language} 
          onLanguageChange={setLanguage}
          currentPath="/muziik"
        />

        {/* Comparison Toggle */}
        <div className="bg-gray-900 border-b border-gray-800 py-4">
          <div className="container mx-auto px-4">
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowComparison('new')}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  showComparison === 'new' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {language === 'ja' ? '新規版' : '신규 버전'}
              </button>
              <button
                onClick={() => setShowComparison('old')}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  showComparison === 'old' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {language === 'ja' ? '既存版' : '기존 버전'}
              </button>
              <button
                onClick={() => setShowComparison(null)}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  showComparison === null 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {language === 'ja' ? '通常表示' : '일반 표시'}
              </button>
            </div>
          </div>
        </div>

        {/* Hero Section - New Version */}
        {showComparison !== 'old' && (
          <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 py-20">
            <div className="container mx-auto px-4">
              <div className="text-center">
                {/* 1군: 기호화된 상단 */}
                <div className="flex justify-center items-center gap-3 mb-8">
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                    NEW
                  </span>
                  <div className="flex items-center gap-3 text-blue-300">
                    <span className="text-lg">⚡</span>
                    <span className="text-sm font-light tracking-wider">ELEGANT ENGINEERING</span>
                    <span className="text-gray-500">|</span>
                    <span className="text-lg">💎</span>
                    <span className="text-sm font-light tracking-wider">EXPLOSIVE POWER</span>
                    <span className="text-gray-500">|</span>
                    <span className="text-lg">🚀</span>
                    <span className="text-sm font-light tracking-wider">AGELESS PERFORMANCE</span>
                  </div>
                </div>
                
                <div className="text-blue-400 text-lg font-medium mb-12">
                  DOGATTI GENERATION 샤프트
                </div>
                
                {/* 2군: 메인 메시지 */}
                <div className="space-y-6 mb-16">
                  <h1 className="text-6xl md:text-8xl font-bold text-white">
                    MUZIIK
                  </h1>
                  <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
                    우아한 엔지니어링. 폭발적인 파워. 나이를 뛰어넘는 퍼포먼스.
                  </p>
                  <p className="text-gray-400 text-base max-w-3xl mx-auto leading-relaxed">
                    티타늄 파이버 기술로 초고속 반발력과 헤드 안정성을 실현하는<br/>
                    혁신적인 샤프트 테크놀로지를 제공합니다.
                  </p>
                </div>
                
                {/* 3군: 기술 카드 (미니멀) */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {/* 티타늄 파이버 기술 */}
                  <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-8 border border-blue-500/30 hover:border-blue-400 transition-all duration-300">
                    <div className="aspect-square w-full mb-6 overflow-hidden rounded-lg">
                      <img 
                        src="/muziik/brand/titan_1.png" 
                        alt="티타늄 원석"
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
                  
                  {/* 원플렉스 설계 */}
                  <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-8 border border-blue-500/30 hover:border-blue-400 transition-all duration-300">
                    <div className="aspect-square w-full mb-6 overflow-hidden rounded-lg">
                      <img 
                        src="/muziik/brand/one-flex-1.webp" 
                        alt="원플렉스 설계"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 text-center">
                      {language === 'ja' ? 'ワンフレックス設計' : '원플렉스 설계'}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed text-center">
                      {language === 'ja' 
                        ? 'ヘッドスピードに関係なく、様々なゴルファーに適した自動的なワンフレックスタイプ。'
                        : '헤드 스피드에 관계없이 다양한 골퍼에게 적합한 자동적인 원플렉스 타입.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Hero Section - Old Version */}
        {showComparison === 'old' && (
          <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 py-20">
            <div className="container mx-auto px-4">
              <div className="text-center">
                <div className="mb-6">
                  <span className="inline-block bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    NEW
                  </span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                  {t.heroTitle}
                </h1>
                <h2 className="text-2xl md:text-3xl text-blue-400 mb-8">
                  {t.heroSubtitle}
                </h2>
                <p 
                  className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8"
                  dangerouslySetInnerHTML={{ __html: t.heroDescription }}
                />
                
                {/* Technology Highlights */}
                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
                  <div className="bg-black bg-opacity-30 rounded-lg border border-blue-500 overflow-hidden">
                    <div className="aspect-[16/9] w-full overflow-hidden">
                      <img 
                        src="/muziik/technology/dogatti-nano-resin.webp" 
                        alt="나노레벨 수지"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold mb-1">
                        {language === 'ja' ? 'ナノレベル樹脂' : '나노레벨 수지'}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {language === 'ja' ? '樹脂含有率削減で弾き向上' : '수지 함유율 감소로 반발성 향상'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-black bg-opacity-30 rounded-lg border border-blue-500 overflow-hidden">
                    <div className="aspect-[16/9] w-full overflow-hidden">
                      <img 
                        src="/muziik/technology/dogatti-reverse-torque.webp" 
                        alt="역토크 방지"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold mb-1">
                        {language === 'ja' ? '逆トルク防止' : '역토크 방지'}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {language === 'ja' ? 'インパクト時のコントロール向上' : '임팩트시 컨트롤 향상'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-black bg-opacity-30 rounded-lg border border-blue-500 overflow-hidden">
                    <div className="aspect-[16/9] w-full overflow-hidden">
                      <img 
                        src="/muziik/technology/dogatti-titanium-fiber.webp" 
                        alt="티타늄 섬유 전장 사용"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold mb-1">
                        {language === 'ja' ? 'チタン繊維全長使用' : '티타늄 섬유 전장 사용'}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {language === 'ja' ? '軽量で高弾性実現' : '경량으로 고탄성 실현'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

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

        {/* Features Section */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-white mb-12">
              {t.featuresTitle}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
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
              <p>&copy; 2025 MASSGOO X MUZIIK. All rights reserved.</p>
              <p className="mt-2">{t.footer}</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}