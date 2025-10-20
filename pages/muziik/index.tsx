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
      home: 'ホーム',
      sapphire: 'Sapphire',
      beryl: 'Beryl',
      contact: 'お問い合わせ',
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
      technology1Title: 'チタンファイバー技術',
      technology1Desc: 'シャフト全体にチタンファイバーを使用することで、引張強度を向上させ、反発性を高めます。強靭さと大きな反発が高い弾道を実現します。',
      technology2Title: 'ワンフレックス設計',
      technology2Desc: 'ヘッドスピードに関係なく、様々なゴルファーに適した自動的なワンフレックスタイプ。バックスイングからインパクトまで安定したパフォーマンスを提供します。',
      ctaTitle: 'お問い合わせ',
      ctaDescription: '詳細な情報やカスタムオーダーについては、お気軽にお問い合わせください。<br />専門スタッフがお客様のニーズに最適なシャフトをご提案いたします。',
      ctaButton: 'お問い合わせする',
      footer: 'DOGATTI GENERATION シャフト - 日本製プレミアムゴルフシャフト'
    },
    ko: {
      title: 'MUZIIK - DOGATTI GENERATION 샤프트',
      description: 'DOGATTI GENERATION 샤프트 - 일본제 프리미엄 골프 샤프트의 최고봉. 티타늄 파이버 기술로 초고속 반발력과 헤드 안정성을 실현합니다.',
      home: '홈',
      sapphire: 'Sapphire',
      beryl: 'Beryl',
      contact: '문의하기',
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
      technology1Title: '티타늄 파이버 기술',
      technology1Desc: '샤프트 전체에 티타늄 파이버를 사용하여 인장 강도를 향상시키고 반발성을 높입니다. 강인함과 큰 반발이 높은 탄도를 실현합니다.',
      technology2Title: '원플렉스 설계',
      technology2Desc: '헤드 스피드에 관계없이 다양한 골퍼에게 적합한 자동적인 원플렉스 타입. 백스윙부터 임팩트까지 안정된 퍼포먼스를 제공합니다.',
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

        {/* Hero Section */}
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
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img 
                      src="/muziik/technology/dogatti-nano-resin.webp" 
                      alt="나노레벨 수지"
                      className="w-full h-full object-cover"
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
                  <div className="aspect-[4/3] w-full overflow-hidden">
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
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img 
                      src="/muziik/technology/dogatti-titanium-fiber.webp" 
                      alt="티타늄 섬유 전장 사용"
                      className="w-full h-full object-cover"
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

        {/* Products Section */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-white mb-12">
              {t.productsTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              
              {/* Sapphire Product Card */}
              <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                <div className="relative h-64 bg-gradient-to-br from-blue-900 to-blue-700">
                  <img 
                    src="/muziik/products/sapphire/sapphire_shaft_main.webp" 
                    alt="Sapphire Shaft"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="relative z-10 h-full flex flex-col items-center justify-center bg-black/20">
                    <h3 className="text-2xl font-bold text-white">Sapphire</h3>
                    <p className="text-blue-200 text-sm mt-2">ONE-FLEX 40</p>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      NEW
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    DOGATTI GENERATION Sapphire one-flex
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    DOGATTI GENERATION Sapphire one-flex
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
                      <table className="w-full text-xs text-gray-300">
                        <thead>
                          <tr className="border-b border-gray-600">
                            <th className="text-left py-1 px-2">{language === 'ja' ? 'Model' : 'Model'}</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? '全長(mm)' : '전장(mm)'}</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? '重量(g)' : '중량(g)'}</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? 'Tip(mm)' : 'Tip(mm)'}</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? 'Butt(mm)' : 'Butt(mm)'}</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? 'トルク(°)' : '토크(°)'}</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? '振動数(cpm)' : '진동수(cpm)'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-700">
                            <td className="py-1 px-2">40</td>
                            <td className="py-1 px-2">1168</td>
                            <td className="py-1 px-2">45</td>
                            <td className="py-1 px-2">8.55</td>
                            <td className="py-1 px-2">15.05</td>
                            <td className="py-1 px-2">5.0</td>
                            <td className="py-1 px-2">185</td>
                          </tr>
                          <tr>
                            <td className="py-1 px-2">50</td>
                            <td className="py-1 px-2">1168</td>
                            <td className="py-1 px-2">54</td>
                            <td className="py-1 px-2">8.55</td>
                            <td className="py-1 px-2">15.4</td>
                            <td className="py-1 px-2">4.2</td>
                            <td className="py-1 px-2">195</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Sapphire 후킹 이미지 */}
                  <div className="mb-4 bg-gray-800 rounded overflow-hidden border border-gray-700">
                    <img
                      src="/muziik/products/sapphire/sapphire_shaft_40.webp"
                      alt="DOGATTI GENERATION Sapphire one-flex shaft"
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
                    src="/muziik/products/sapphire/sapphire_shaft_main2.webp" 
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
                    DOGATTI GENERATION Beryl_40
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    DOGATTI GENERATION Beryl_40
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
                      {language === 'ja' ? 'DOGATTI GENERATION BERYL 40' : 'DOGATTI GENERATION BERYL 40'}
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-gray-300">
                        <thead>
                          <tr className="border-b border-gray-600">
                            <th className="text-left py-1 px-2">FLEX</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? '全長(mm)' : '전장(mm)'}</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? '重量(g)' : '중량(g)'}</th>
                            <th className="text-left py-1 px-2">Tip(mm)</th>
                            <th className="text-left py-1 px-2">Butt(mm)</th>
                            <th className="text-left py-1 px-2">{language === 'ja' ? 'トルク(°)' : '토크(°)'}</th>
                            <th className="text-left py-1 px-2">CPM</th>
                            <th className="text-left py-1 px-2">K.P.</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-700">
                            <td className="py-1 px-2">R2</td>
                            <td className="py-1 px-2">1168</td>
                            <td className="py-1 px-2">42</td>
                            <td className="py-1 px-2">8.55</td>
                            <td className="py-1 px-2">14.95</td>
                            <td className="py-1 px-2">5.0</td>
                            <td className="py-1 px-2">215</td>
                            <td className="py-1 px-2">{language === 'ja' ? '先中調子' : '선중'}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="py-1 px-2">R</td>
                            <td className="py-1 px-2">1168</td>
                            <td className="py-1 px-2">48</td>
                            <td className="py-1 px-2">8.55</td>
                            <td className="py-1 px-2">15.1</td>
                            <td className="py-1 px-2">4.0</td>
                            <td className="py-1 px-2">225</td>
                            <td className="py-1 px-2">{language === 'ja' ? '先中調子' : '선중'}</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="py-1 px-2">SR</td>
                            <td className="py-1 px-2">1168</td>
                            <td className="py-1 px-2">49</td>
                            <td className="py-1 px-2">8.55</td>
                            <td className="py-1 px-2">15.15</td>
                            <td className="py-1 px-2">4.0</td>
                            <td className="py-1 px-2">235</td>
                            <td className="py-1 px-2">{language === 'ja' ? '先中調子' : '선중'}</td>
                          </tr>
                          <tr className="border-b border-gray-700">
                            <td className="py-1 px-2">S</td>
                            <td className="py-1 px-2">1168</td>
                            <td className="py-1 px-2">50</td>
                            <td className="py-1 px-2">8.55</td>
                            <td className="py-1 px-2">15.2</td>
                            <td className="py-1 px-2">4.0</td>
                            <td className="py-1 px-2">245</td>
                            <td className="py-1 px-2">{language === 'ja' ? '先中調子' : '선중'}</td>
                          </tr>
                          <tr>
                            <td className="py-1 px-2">X</td>
                            <td className="py-1 px-2">1168</td>
                            <td className="py-1 px-2">53</td>
                            <td className="py-1 px-2">8.55</td>
                            <td className="py-1 px-2">15.3</td>
                            <td className="py-1 px-2">3.9</td>
                            <td className="py-1 px-2">255</td>
                            <td className="py-1 px-2">{language === 'ja' ? '先中調子' : '선중'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Beryl 후킹 이미지 */}
                  <div className="mb-4 bg-gray-800 rounded overflow-hidden border border-gray-700">
                    <img
                      src="/muziik/products/beryl/beryl_shaft_main.webp"
                      alt="DOGATTI GENERATION Beryl_40 shaft"
                      className="w-full h-32 object-cover object-center"
                    />
                  </div>

                  <Link 
                    href="/beryl"
                    className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    {language === 'ja' ? '詳細を見る' : '자세히 보기'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 마쓰구 콜라보레이션 섹션 */}
        <section className="py-16 bg-gradient-to-r from-red-900 to-orange-900">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-white mb-6">
                {language === 'ja' ? 'マツグドライバーと一緒に' : '마쓰구 드라이버와 함께'}
              </h2>
              <p className="text-xl text-orange-200 mb-8">
                {language === 'ja' 
                  ? 'MUZIIK シャフト + マツグドライバー = 最高の組み合わせ'
                  : 'MUZIIK 샤프트 + 마쓰구 드라이버 = 최상의 조합'
                }
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="bg-black bg-opacity-30 rounded-lg p-6 border border-orange-500">
                  <div className="text-4xl mb-4">🇰🇷</div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {language === 'ja' ? '国内唯一のコラボ' : '국내 유일 콜라보'}
                  </h3>
                  <p className="text-orange-200 text-sm">
                    {language === 'ja' 
                      ? 'マツグとMUZIIKの特別なパートナーシップ'
                      : '마쓰구와 MUZIIK의 특별한 파트너십'
                    }
                  </p>
                </div>
                
                <div className="bg-black bg-opacity-30 rounded-lg p-6 border border-orange-500">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {language === 'ja' ? '専門フィッティング' : '전문 피팅 지원'}
                  </h3>
                  <p className="text-orange-200 text-sm">
                    {language === 'ja' 
                      ? '最適な組み合わせをプロがサポート'
                      : '최적의 조합을 프로가 지원'
                    }
                  </p>
                </div>
                
                <div className="bg-black bg-opacity-30 rounded-lg p-6 border border-orange-500">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {language === 'ja' ? '最高の性能保証' : '최적의 성능 보장'}
                  </h3>
                  <p className="text-orange-200 text-sm">
                    {language === 'ja' 
                      ? 'テスト済みの完璧なマッチング'
                      : '테스트 완료된 완벽한 매칭'
                    }
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <a 
                  href="https://www.masgolf.co.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-white text-red-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-orange-100 transition-colors"
                >
                  {language === 'ja' ? 'マツグドライバーを見る →' : '마쓰구 드라이버 보기 →'}
                </a>
                <div className="text-orange-200 text-sm">
                  {language === 'ja' 
                    ? 'マツグドライ버とMUZIIKシャフトの組み合わせで、飛距離とコントロールを両立'
                    : '마쓰구 드라이버와 MUZIIK 샤프트 조합으로 비거리와 컨트롤을 동시에'
                  }
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dogatti Generation Technology Section */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-12 text-center">
                {language === 'ja' ? 'Dogatti Generation Technology' : 'Dogatti Generation Technology'}
              </h2>
              
              {/* Technology Features */}
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="mb-4 flex justify-center">
                    <img 
                      src="/muziik/technology/dogatti-nano-resin.webp" 
                      alt="나노레벨 수지"
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4 text-center">
                    {language === 'ja' ? 'ナノレベル樹脂を採用' : '나노레벨 수지 채택'}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {language === 'ja' 
                      ? 'ドガッティゼネレーションに採用されているナノ樹脂。樹脂の含有率を削減し、カーボンの密度を高めることで弾きの良さと打感の向上をもたらします。'
                      : '도가티 제네레이션에 채택된 나노 수지. 수지 함유율을 줄이고 카본 밀도를 높여 반발성과 타감의 향상을 가져옵니다.'
                    }
                  </p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="mb-4 flex justify-center">
                    <img 
                      src="/muziik/technology/dogatti-reverse-torque.webp" 
                      alt="역토크 방지"
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4 text-center">
                    {language === 'ja' ? 'インパクト時の逆トルクを防ぐ' : '임팩트시 역토크 방지'}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {language === 'ja' 
                      ? '軽量シャフトは、そのトルクの多さとヘッド重量の関係性からインパクト時、特にオフセンターショット時に逆トルクは発生します。ドガッティゼネレーションはチタンファイバーの全長使用により、逆トルクの発生を減少させます。'
                      : '경량 샤프트는 토크의 많음과 헤드 중량의 관계로 인해 임팩트시, 특히 오프센터 샷시 역토크가 발생합니다. 도가티 제네레이션은 티타늄 파이버 전장 사용으로 역토크 발생을 감소시킵니다.'
                    }
                  </p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="mb-4 flex justify-center">
                    <img 
                      src="/muziik/technology/dogatti-titanium-fiber.webp" 
                      alt="티타늄 섬유 전장 사용"
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4 text-center">
                    {language === 'ja' ? 'チタン繊維を全長に使用' : '티타늄 섬유 전장 사용'}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {language === 'ja' 
                      ? '軽くて弾きに優れたチタン細線をコンポジット。重量は軽量化をキープしながらも、超高弾性のようなしなり戻りとインパクト時のしっかり感を実現しています。'
                      : '가볍고 반발성이 뛰어난 티타늄 세선을 컴포지트. 중량은 경량화를 유지하면서도 초고탄성과 같은 휨 복원과 임팩트시의 탄탄함을 실현합니다.'
                    }
                  </p>
                </div>
              </div>

              {/* Technology Description */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-lg p-8 border border-blue-800">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {language === 'ja' ? 'ムジーク独自のチタンファイバー・テクノロジー搭載' : '무지크 독자적인 티타늄 파이버 테크놀로지 탑재'}
                  </h3>
                  <p className="text-blue-200 text-lg leading-relaxed max-w-4xl mx-auto">
                    {language === 'ja' 
                      ? 'チタンの反発力で飛ばし、インパクト時に起こる逆トルクを防いでコントロール性もアップ。ドガッティゼネレーションはムジーク独自の設計思想に基づき創られた最強シャフト。'
                      : '티타늄의 반발력으로 비거리를 늘리고, 임팩트시 발생하는 역토크를 방지하여 컨트롤성도 향상. 도가티 제네레이션은 무지크 독자적인 설계 사상에 기반하여 만들어진 최강 샤프트.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-8">
                {t.technologyTitle}
              </h2>
              <div className="grid md:grid-cols-2 gap-8 text-left">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {t.technology1Title}
                  </h3>
                  <p className="text-gray-300">
                    {t.technology1Desc}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {t.technology2Title}
                  </h3>
                  <p className="text-gray-300">
                    {t.technology2Desc}
                  </p>
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
              <p>&copy; 2025 MASSGOO X MUZIIK. All rights reserved.</p>
              <p className="mt-2">{t.footer}</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
