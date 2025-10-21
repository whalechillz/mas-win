import Head from 'next/head';
import { useState } from 'react';
import Navigation from '../../components/muziik/Navigation';

export default function CollaborationPage() {
  const [language, setLanguage] = useState<'ja' | 'ko'>('ko');

  // 언어별 콘텐츠
  const content = {
    ja: {
      title: 'MUZIIK - マツグコラボレーション',
      description: 'マツグドライバーとMUZIIK DOGATTI GENERATION シャフトの完璧な組み合わせ',
      heroTitle: 'マツグ × MUZIIK コラボレーション',
      heroSubtitle: '最高のドライバーと最高のシャフトの出会い',
      heroDescription: 'マツグドライバーの革新的な技術とMUZIIK DOGATTI GENERATION シャフトの先端技術が融合し、ゴルファーに最高のパフォーマンスを提供します。',
      
      // 조합의 장점
      benefitsTitle: 'コラボレーションの利点',
      benefit1Title: '飛距離の向上',
      benefit1Desc: 'マツグドライバーの高反発設計とMUZIIKシャフトの高弾性が組み合わさり、従来比15%の飛距離向上を実現。',
      benefit2Title: 'コントロール性の向上',
      benefit2Desc: 'MUZIIKの逆トルク防止技術により、マツグドライバーの安定性がさらに向上し、方向性が格段に良くなります。',
      benefit3Title: '打感の向上',
      benefit3Desc: 'チタンファイバー技術による優れた打感と、マツグドライバーの精密な設計が調和し、最高の打感を提供。',
      
      // 성능 데이터
      performanceTitle: '性能データ',
      performanceDesc: 'マツグドライバー + MUZIIKシャフトの組み合わせで実現される性能向上',
      
      // 피팅 가이드
      fittingTitle: 'フィッティングガイド',
      fittingDesc: '最適な組み合わせを見つけるためのガイド',
      
      // 프로 추천
      proTitle: 'プロゴルファーの推薦',
      proDesc: '多くのプロゴルファーが選択する信頼の組み合わせ',
      
      // 구매 가이드
      purchaseTitle: '購入ガイド',
      purchaseDesc: 'マツグドライバーとMUZIIKシャフトの組み合わせで購入する方法',
      
      // CTA
      ctaTitle: '今すぐ体験してみませんか？',
      ctaDesc: 'マツグドライバーとMUZIIKシャフトの組み合わせを体験できるフィッティングを予約',
      ctaButton: 'フィッティング予約',
      contactButton: 'お問い合わせ'
    },
    ko: {
      title: 'MUZIIK - 마쓰구 콜라보레이션',
      description: '마쓰구 드라이버와 MUZIIK DOGATTI GENERATION 샤프트의 완벽한 조합',
      heroTitle: '마쓰구 × MUZIIK 콜라보레이션',
      heroSubtitle: '최고의 드라이버와 최고의 샤프트의 만남',
      heroDescription: '마쓰구 드라이버의 혁신적인 기술과 MUZIIK DOGATTI GENERATION 샤프트의 첨단 기술이 융합되어 골퍼에게 최고의 퍼포먼스를 제공합니다.',
      
      // 조합의 장점
      benefitsTitle: '콜라보레이션의 장점',
      benefit1Title: '비거리 향상',
      benefit1Desc: '마쓰구 드라이버의 고반발 설계와 MUZIIK 샤프트의 고탄성이 결합되어 기존 대비 15% 비거리 향상을 실현합니다.',
      benefit2Title: '컨트롤성 향상',
      benefit2Desc: 'MUZIIK의 역토크 방지 기술로 마쓰구 드라이버의 안정성이 더욱 향상되어 방향성이 획기적으로 좋아집니다.',
      benefit3Title: '타감 향상',
      benefit3Desc: '티타늄 파이버 기술의 우수한 타감과 마쓰구 드라이버의 정밀한 설계가 조화를 이루어 최고의 타감을 제공합니다.',
      
      // 성능 데이터
      performanceTitle: '성능 데이터',
      performanceDesc: '마쓰구 드라이버 + MUZIIK 샤프트 조합으로 실현되는 성능 향상',
      
      // 피팅 가이드
      fittingTitle: '피팅 가이드',
      fittingDesc: '최적의 조합을 찾기 위한 가이드',
      
      // 프로 추천
      proTitle: '프로 골퍼 추천',
      proDesc: '많은 프로 골퍼가 선택하는 신뢰의 조합',
      
      // 구매 가이드
      purchaseTitle: '구매 가이드',
      purchaseDesc: '마쓰구 드라이버와 MUZIIK 샤프트 조합으로 구매하는 방법',
      
      // CTA
      ctaTitle: '지금 바로 체험해보시겠습니까?',
      ctaDesc: '마쓰구 드라이버와 MUZIIK 샤프트 조합을 체험할 수 있는 피팅 예약',
      ctaButton: '피팅 예약',
      contactButton: '문의하기'
    }
  };

  const t = content[language];

  return (
    <>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.description} />
        <meta name="keywords" content="마쓰구드라이버,MUZIIK샤프트,골프드라이버샤프트,골프콜라보,프리미엄골프클럽,골프피팅,마쓰구MUZIIK" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content="마쓰구 x MUZIIK 콜라보레이션" />
        <meta property="og:description" content="마쓰구 드라이버와 MUZIIK DOGATTI GENERATION 샤프트의 완벽한 조합. 최고의 드라이버와 최고의 샤프트의 만남." />
        <meta property="og:image" content="/muziik/collaboration-og.jpg" />
        <meta property="og:url" content="https://muziik.masgolf.co.kr/collaboration" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="마쓰구 x MUZIIK 콜라보레이션" />
        <meta name="twitter:description" content="최고의 드라이버와 최고의 샤프트의 만남." />
        <meta name="twitter:image" content="/muziik/collaboration-og.jpg" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://muziik.masgolf.co.kr/collaboration" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Navigation 
          language={language} 
          onLanguageChange={setLanguage}
          currentPath="/collaboration"
        />

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                {t.heroTitle}
              </h1>
              <h2 className="text-2xl md:text-3xl text-orange-200 mb-8">
                {t.heroSubtitle}
              </h2>
              <p className="text-xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
                {t.heroDescription}
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-12 text-center">
                {t.benefitsTitle}
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                  <div className="text-5xl mb-6 text-center">🚀</div>
                  <h3 className="text-2xl font-bold text-white mb-4 text-center">
                    {t.benefit1Title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t.benefit1Desc}
                  </p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                  <div className="text-5xl mb-6 text-center">🎯</div>
                  <h3 className="text-2xl font-bold text-white mb-4 text-center">
                    {t.benefit2Title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t.benefit2Desc}
                  </p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                  <div className="text-5xl mb-6 text-center">💎</div>
                  <h3 className="text-2xl font-bold text-white mb-4 text-center">
                    {t.benefit3Title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {t.benefit3Desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Data Section */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-12 text-center">
                {t.performanceTitle}
              </h2>
              <p className="text-gray-300 text-center mb-12">
                {t.performanceDesc}
              </p>
              
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <span className="text-white font-semibold">
                        {language === 'ja' ? '飛距離' : '비거리'}
                      </span>
                      <span className="text-green-400 font-bold text-xl">+15%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <span className="text-white font-semibold">
                        {language === 'ja' ? '方向性' : '방향성'}
                      </span>
                      <span className="text-blue-400 font-bold text-xl">+25%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <span className="text-white font-semibold">
                        {language === 'ja' ? '打感' : '타감'}
                      </span>
                      <span className="text-purple-400 font-bold text-xl">+20%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <span className="text-white font-semibold">
                        {language === 'ja' ? '安定性' : '안정성'}
                      </span>
                      <span className="text-orange-400 font-bold text-xl">+30%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-red-900 to-orange-900 rounded-lg p-8">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {language === 'ja' ? '性能向上データ' : '성능 향상 데이터'}
                    </h3>
                    <p className="text-orange-200">
                      {language === 'ja' 
                        ? '従来のドライバーとシャフトの組み合わせと比較'
                        : '기존 드라이버와 샤프트 조합 대비'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fitting Guide Section */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-12 text-center">
                {t.fittingTitle}
              </h2>
              <p className="text-gray-300 text-center mb-12">
                {t.fittingDesc}
              </p>
              
              <div className="grid md:grid-cols-2 gap-12">
                <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                  <h3 className="text-2xl font-bold text-white mb-6">
                    {language === 'ja' ? 'ステップ1: ヘッドスピード測定' : 'Step 1: 헤드 스피드 측정'}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {language === 'ja' 
                      ? '現在のヘッドスピードを正確に測定し、最適なシャフトの選択基準を決定します。'
                      : '현재 헤드 스피드를 정확히 측정하여 최적의 샤프트 선택 기준을 결정합니다.'
                    }
                  </p>
                  <div className="text-4xl text-center">⚡</div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                  <h3 className="text-2xl font-bold text-white mb-6">
                    {language === 'ja' ? 'ステップ2: シャフト選択' : 'Step 2: 샤프트 선택'}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {language === 'ja' 
                      ? 'Sapphire Auto-flexまたはBerylの中から、あなたのスイングに最適なシャフトを選択します。'
                      : 'Sapphire Auto-flex 또는 Beryl 중에서 당신의 스윙에 최적한 샤프트를 선택합니다.'
                    }
                  </p>
                  <div className="text-4xl text-center">🎯</div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                  <h3 className="text-2xl font-bold text-white mb-6">
                    {language === 'ja' ? 'ステップ3: 組み合わせテスト' : 'Step 3: 조합 테스트'}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {language === 'ja' 
                      ? 'マツグドライバーとMUZIIKシャフトの組み合わせで実際にスイングし、性能を確認します。'
                      : '마쓰구 드라이버와 MUZIIK 샤프트 조합으로 실제 스윙하여 성능을 확인합니다.'
                    }
                  </p>
                  <div className="text-4xl text-center">🏌️</div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
                  <h3 className="text-2xl font-bold text-white mb-6">
                    {language === 'ja' ? 'ステップ4: 最終調整' : 'Step 4: 최종 조정'}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {language === 'ja' 
                      ? 'データを基に最終的な調整を行い、完璧な組み合わせを完成させます。'
                      : '데이터를 바탕으로 최종적인 조정을 진행하여 완벽한 조합을 완성합니다.'
                    }
                  </p>
                  <div className="text-4xl text-center">✨</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pro Recommendation Section */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-12">
                {t.proTitle}
              </h2>
              <p className="text-gray-300 mb-12">
                {t.proDesc}
              </p>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="text-4xl mb-4">🏆</div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {language === 'ja' ? 'プロツアー選手' : '프로 투어 선수'}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {language === 'ja' 
                      ? '多くのプロツアー選手が信頼する組み合わせ'
                      : '많은 프로 투어 선수가 신뢰하는 조합'
                    }
                  </p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="text-4xl mb-4">🎓</div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {language === 'ja' ? 'フィッティング専門家' : '피팅 전문가'}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {language === 'ja' 
                      ? 'フィッティング専門家が推奨する組み合わせ'
                      : '피팅 전문가가 추천하는 조합'
                    }
                  </p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="text-4xl mb-4">⭐</div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {language === 'ja' ? '満足度98%' : '만족도 98%'}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {language === 'ja' 
                      ? '実際に使用したゴルファーの満足度'
                      : '실제 사용한 골퍼의 만족도'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Purchase Guide Section */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-12 text-center">
                {t.purchaseTitle}
              </h2>
              <p className="text-gray-300 text-center mb-12">
                {t.purchaseDesc}
              </p>
              
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">
                    {language === 'ja' ? '購入方法' : '구매 방법'}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                      <div>
                        <h4 className="text-white font-semibold">
                          {language === 'ja' ? 'フィッティング予約' : '피팅 예약'}
                        </h4>
                        <p className="text-gray-300 text-sm">
                          {language === 'ja' 
                            ? '専門フィッティングで最適な組み合わせを決定'
                            : '전문 피팅으로 최적의 조합 결정'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                      <div>
                        <h4 className="text-white font-semibold">
                          {language === 'ja' ? '注文・決済' : '주문 및 결제'}
                        </h4>
                        <p className="text-gray-300 text-sm">
                          {language === 'ja' 
                            ? '決定した組み合わせで注文・決済'
                            : '결정된 조합으로 주문 및 결제'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                      <div>
                        <h4 className="text-white font-semibold">
                          {language === 'ja' ? '組み立て・配送' : '조립 및 배송'}
                        </h4>
                        <p className="text-gray-300 text-sm">
                          {language === 'ja' 
                            ? '専門技術者が組み立て後配送'
                            : '전문 기술자가 조립 후 배송'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-lg p-8">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🛒</div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {language === 'ja' ? '特別価格' : '특별 가격'}
                    </h3>
                    <p className="text-blue-200 mb-6">
                      {language === 'ja' 
                        ? 'マツグドライバー + MUZIIKシャフト'
                        : '마쓰구 드라이버 + MUZIIK 샤프트'
                      }
                    </p>
                    <div className="text-3xl font-bold text-white mb-4">
                      {language === 'ja' ? 'セット価格' : '세트 가격'}
                    </div>
                    <p className="text-blue-200 text-sm">
                      {language === 'ja' 
                        ? '個別購入よりお得'
                        : '개별 구매보다 저렴'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-red-900 to-orange-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              {t.ctaTitle}
            </h2>
            <p className="text-xl text-orange-200 mb-8 max-w-2xl mx-auto">
              {t.ctaDesc}
            </p>
            <div className="space-x-4">
              <a 
                href="/contact"
                className="inline-block bg-white text-red-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-orange-100 transition-colors"
              >
                {t.ctaButton}
              </a>
              <a 
                href="mailto:massgoogolf@gmail.com"
                className="inline-block bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-red-900 transition-colors"
              >
                {t.contactButton}
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
