import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function MuziikHome() {
  const [language, setLanguage] = useState<'ja' | 'ko'>('ja');

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
      heroDescription: '日本製プレミアムゴルフシャフトの最高봉.<br />チタンファイバー技術で超高速反発力とヘッド安定性を実現する<br />革新的なシャフトテクノロジーを提供します。',
      featuresTitle: 'MUZIIKの特徴',
      feature1: '超高速反発力',
      feature1Desc: 'チタンファイバー技術で革新的な反発性能を実現し、最大のボールスピードを実現します',
      feature2: 'ヘッド安定性',
      feature2Desc: 'オフセンター時のヘッドブレを抑制し、正確なショットをサポートします',
      feature3: '日本製品質',
      feature3Desc: '40年伝統と最新技術を融合した最高品質のシャフト製造',
      productsTitle: '製品ラインナップ',
      technologyTitle: '革新的なテクノロジー',
      technology1Title: 'チタンファイバー技術',
      technology1Desc: 'シャフト全体にチタンファイバーを使用し、引張強度を向上させ、反発性を高めます。強靭さと大きな反発が高い弾道を実現します。',
      technology2Title: 'ワンフレックス設計',
      technology2Desc: 'ヘッドスピードに関係なく、様々なゴルファーに適した自動的なワンフレックスタイプ。バックスイングからインパクトまで安定したパフォーマンスを提供します。',
      ctaTitle: 'お問い合わせ',
      ctaDescription: '詳細な情報やカスタムオーダーについては、いつでもお問い合わせください。<br />専門スタッフがお客様のニーズに最適なシャフトを提案いたします。',
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="bg-black border-b border-gray-800">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <Link href="/muziik" className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
                MUZIIK
              </Link>
              <nav className="hidden md:flex space-x-8 items-center">
                <Link href="/muziik" className="text-gray-300 hover:text-white transition-colors">
                  {t.home}
                </Link>
                <Link href="/muziik/sapphire" className="text-gray-300 hover:text-white transition-colors">
                  {t.sapphire}
                </Link>
                <Link href="/muziik/beryl" className="text-gray-300 hover:text-white transition-colors">
                  {t.beryl}
                </Link>
                <a href="mailto:info@masgolf.co.kr" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  {t.contact}
                </a>
                
                {/* 언어 전환 버튼 */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setLanguage('ja')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      language === 'ja' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🇯🇵
                  </button>
                  <button
                    onClick={() => setLanguage('ko')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      language === 'ko' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🇰🇷
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </header>

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
              <p 
                className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
                dangerouslySetInnerHTML={{ __html: t.heroDescription }}
              />
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
              プロダクトライン
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              
              {/* Sapphire Product Card */}
              <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                <div className="relative h-64 bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💎</div>
                    <h3 className="text-2xl font-bold text-white">Sapphire</h3>
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
                    超高速の反発力とヘッド安定性を実現する、MUZIIK独自のチタンファイバー技術を採用したプレミアムシャフト。
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="text-white font-semibold mb-2">主な特徴:</h4>
                    <ul className="space-y-1">
                      <li className="text-gray-400 text-sm flex items-center">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                        チタンファイバー技術による超高速反発力
                      </li>
                      <li className="text-gray-400 text-sm flex items-center">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                        ヘッド安定性の向上
                      </li>
                      <li className="text-gray-400 text-sm flex items-center">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                        自動的なワンフレックスタイプ
                      </li>
                    </ul>
                  </div>
                  
                  <Link 
                    href="/muziik/sapphire"
                    className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    詳細を見る
                  </Link>
                </div>
              </div>

              {/* Beryl Product Card */}
              <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                <div className="relative h-64 bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💚</div>
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
                    高弾性カーボンシートとチタンファイバーを組み合わせた、美しさと性能を兼ね備えたプレミアムシャフト。
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="text-white font-semibold mb-2">主な特徴:</h4>
                    <ul className="space-y-1">
                      <li className="text-gray-400 text-sm flex items-center">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                        高弾性(65t)カーボンシート使用
                      </li>
                      <li className="text-gray-400 text-sm flex items-center">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                        チタンファイバーによる引張強度向上
                      </li>
                      <li className="text-gray-400 text-sm flex items-center">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                        美しいアルミニウムIP処理
                      </li>
                    </ul>
                  </div>
                  
                  <Link 
                    href="/muziik/beryl"
                    className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    詳細を見る
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-8">
                革新的テクノロジー
              </h2>
              <div className="grid md:grid-cols-2 gap-8 text-left">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    チタンファイバー技術
                  </h3>
                  <p className="text-gray-300">
                    シャフト全体にチタンファイバーを使用することで、引張強度を向上させ、反発性を高めます。強靭さと大きな反発が高い弾道を実現します。
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    ワンフレックス設計
                  </h3>
                  <p className="text-gray-300">
                    ヘッドスピードに関係なく、様々なゴルファーに適した自動的なワンフレックスタイプ。バックスイングからインパクトまで安定したパフォーマンスを提供します。
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
              お問い合わせ
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              詳細な情報やカスタムオーダーについては、お気軽にお問い合わせください。<br />
              専門スタッフがお客様のニーズに最適なシャフトをご提案いたします。
            </p>
            <a 
              href="mailto:info@masgolf.co.kr"
              className="inline-block bg-white text-blue-900 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
            >
              お問い合わせする
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 py-8">
          <div className="container mx-auto px-4">
            <div className="text-center text-gray-400">
              <p>&copy; 2025 MUZIIK. All rights reserved.</p>
              <p className="mt-2">DOGATTI GENERATION シャフト - 日本製プレミアムゴルフシャフト</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}