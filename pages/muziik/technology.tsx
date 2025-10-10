import Head from 'next/head';
import { useState } from 'react';
import Navigation from '../../components/muziik/Navigation';

export default function TechnologyPage() {
  const [language, setLanguage] = useState<'ja' | 'ko'>('ko');

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
      
      // 기술 다이어그램 섹션
      diagramTitle: '技術構造図',
      diagramDesc: 'DOGATTI GENERATION シャフトの内部構造とテクノロジー',
      
      // 제품 적용
      applicationTitle: '제품 적용',
      applicationDesc: '이러한 혁신적인 기술들이 Sapphire와 Beryl 제품에 어떻게 적용되었는지 확인해보세요.',
      sapphireLink: 'Sapphire 제품 보기',
      berylLink: 'Beryl 제품 보기'
    },
    ko: {
      title: 'MUZIIK - Dogatti Generation Technology',
      description: 'DOGATTI GENERATION 샤프트의 혁신적인 테크놀로지 - 나노레벨 수지, 역토크 방지, 티타늄 파이버 전장 사용 기술',
      heroTitle: 'Dogatti Generation Technology',
      heroSubtitle: '무지크 독자적인 티타늄 파이버 테크놀로지',
      heroDescription: '티타늄의 반발력으로 비거리를 늘리고, 임팩트시 발생하는 역토크를 방지하여 컨트롤성도 향상. 도가티 제네레이션은 무지크 독자적인 설계 사상에 기반하여 만들어진 최강 샤프트.',
      
      // 기술 특징
      tech1Title: '나노레벨 수지 채택',
      tech1Desc: '도가티 제네레이션에 채택된 나노 수지. 수지 함유율을 줄이고 카본 밀도를 높여 반발성과 타감의 향상을 가져옵니다.',
      tech1Features: [
        '수지 함유율 감소',
        '카본 밀도 향상',
        '반발성 실현',
        '타감 향상'
      ],
      
      tech2Title: '임팩트시 역토크 방지',
      tech2Desc: '경량 샤프트는 토크의 많음과 헤드 중량의 관계로 인해 임팩트시, 특히 오프센터 샷시 역토크가 발생합니다. 역토크는 헤드의 직진성을 방해하고, 방향성과 비거리 성능에 영향을 줍니다.',
      tech2Features: [
        '역토크 발생 감소',
        '헤드 스피드 향상',
        '가속감 창출',
        '방향성 안정'
      ],
      
      tech3Title: '티타늄 섬유 전장 사용',
      tech3Desc: '가볍고 반발성이 뛰어난 티타늄 세선을 컴포지트. 중량은 경량화를 유지하면서도 초고탄성과 같은 휨 복원과 임팩트시의 탄탄함을 실현합니다.',
      tech3Features: [
        '경량성 유지',
        '초고탄성 실현',
        '휨 복원 향상',
        '임팩트시 안정감'
      ],
      
      // 기술 다이어그램 섹션
      diagramTitle: '기술 구조도',
      diagramDesc: 'DOGATTI GENERATION 샤프트의 내부 구조와 테크놀로지',
      
      // 제품 적용
      applicationTitle: '제품 적용',
      applicationDesc: '이러한 혁신적인 기술들이 Sapphire와 Beryl 제품에 어떻게 적용되었는지 확인해보세요.',
      sapphireLink: 'Sapphire 제품 보기',
      berylLink: 'Beryl 제품 보기'
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
        <Navigation 
          language={language} 
          onLanguageChange={setLanguage}
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
                    <div className="aspect-video bg-gradient-to-br from-blue-900 to-indigo-900 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-4">⚗️</div>
                        <p className="text-blue-200">
                          {language === 'ja' ? 'ナノ樹脂構造' : '나노 수지 구조'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tech 2: Reverse Torque Prevention */}
              <div className="mb-16">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="order-2 md:order-1">
                    <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                      <div className="aspect-video bg-gradient-to-br from-emerald-900 to-teal-900 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-4">⚡</div>
                          <p className="text-emerald-200">
                            {language === 'ja' ? '逆トルク防止' : '역토크 방지'}
                          </p>
                        </div>
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
                    <div className="aspect-video bg-gradient-to-br from-purple-900 to-pink-900 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-4">💎</div>
                        <p className="text-purple-200">
                          {language === 'ja' ? 'チタン繊維構造' : '티타늄 섬유 구조'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Diagram Section */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-8">
                {t.diagramTitle}
              </h2>
              <p className="text-gray-300 text-lg mb-12">
                {t.diagramDesc}
              </p>
              <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
                <div className="aspect-video bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🔬</div>
                    <p className="text-blue-200 text-xl">
                      {language === 'ja' ? '技術構造図' : '기술 구조도'}
                    </p>
                    <p className="text-gray-400 mt-2">
                      {language === 'ja' ? '詳細な技術図表' : '상세한 기술 도표'}
                    </p>
                  </div>
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
                <a 
                  href="/sapphire"
                  className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg p-8 hover:from-blue-800 hover:to-blue-600 transition-all duration-300"
                >
                  <div className="text-4xl mb-4">💎</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Sapphire</h3>
                  <p className="text-blue-200">
                    {language === 'ja' ? '超高速反発力とヘッド安定性' : '초고속 반발력과 헤드 안정성'}
                  </p>
                </a>
                <a 
                  href="/beryl"
                  className="bg-gradient-to-br from-emerald-900 to-emerald-700 rounded-lg p-8 hover:from-emerald-800 hover:to-emerald-600 transition-all duration-300"
                >
                  <div className="text-4xl mb-4">💚</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Beryl</h3>
                  <p className="text-emerald-200">
                    {language === 'ja' ? '美しさと性能を兼ね備えた' : '아름다움과 성능을 겸비한'}
                  </p>
                </a>
              </div>
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
