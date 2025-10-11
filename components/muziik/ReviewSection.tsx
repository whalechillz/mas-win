import { useState } from 'react';

interface ReviewSectionProps {
  language: 'ja' | 'ko';
}

export default function ReviewSection({ language }: ReviewSectionProps) {
  const [activeTab, setActiveTab] = useState<'pro' | 'shop' | 'customer'>('pro');

  const content = {
    ja: {
      title: 'お客様の声',
      proTab: 'プロゴルファー',
      shopTab: 'フィッティングショップ',
      customerTab: 'お客様レビュー',
      
      // 프로 골퍼 리뷰
      proTitle: 'プロゴルファーの推薦',
      proDesc: '多くのプロツアー選手が信頼する組み合わせ',
      
      // 피팅샵 리뷰
      shopTitle: 'フィッティングショップの評価',
      shopDesc: '専門家が推奨する最高の組み合わせ',
      
      // 고객 리뷰
      customerTitle: 'お客様の満足度',
      customerDesc: '実際にご利用いただいたお客様の声',
      
      // 공통
      rating: '評価',
      stars: '星',
      verified: '認証済み',
      readMore: '続きを読む',
      showLess: '閉じる'
    },
    ko: {
      title: '고객 후기',
      proTab: '프로 골퍼',
      shopTab: '피팅샵',
      customerTab: '고객 리뷰',
      
      // 프로 골퍼 리뷰
      proTitle: '프로 골퍼 추천',
      proDesc: '많은 프로 투어 선수가 신뢰하는 조합',
      
      // 피팅샵 리뷰
      shopTitle: '피팅샵 평가',
      shopDesc: '전문가가 추천하는 최고의 조합',
      
      // 고객 리뷰
      customerTitle: '고객 만족도',
      customerDesc: '실제 이용하신 고객의 생생한 후기',
      
      // 공통
      rating: '평점',
      stars: '점',
      verified: '인증됨',
      readMore: '더 보기',
      showLess: '접기'
    }
  };

  const t = content[language];

  // 프로 골퍼 리뷰 데이터
  const proReviews = [
    {
      name: language === 'ja' ? '김프로' : '김프로',
      title: language === 'ja' ? 'KPGA 투어 선수' : 'KPGA 투어 선수',
      rating: 5,
      comment: language === 'ja' 
        ? 'マツグドライバーとMUZIIKシャフトの組み合わせは本当に素晴らしいです。飛距離が大幅に向上し、コントロールも格段に良くなりました。特に逆トルク防止技術のおかげで、オフセンターショットでも安定した結果を得ることができます。'
        : '마쓰구 드라이버와 MUZIIK 샤프트 조합은 정말 훌륭합니다. 비거리가 크게 향상되었고, 컨트롤도 획기적으로 좋아졌습니다. 특히 역토크 방지 기술 덕분에 오프센터 샷에서도 안정적인 결과를 얻을 수 있습니다.',
      verified: true
    },
    {
      name: language === 'ja' ? '이프로' : '이프로',
      title: language === 'ja' ? 'LPGA 투어 선수' : 'LPGA 투어 선수',
      rating: 5,
      comment: language === 'ja'
        ? 'MUZIIKのチタンファイバー技術は驚くべきものです。軽量でありながら強度が高く、スイングスピードが向上しました。マツグドライバーとの組み合わせで、これまでにない飛距離と精度を実現できています。'
        : 'MUZIIK의 티타늄 파이버 기술은 놀라운 것입니다. 경량이면서도 강도가 높아 스윙 스피드가 향상되었습니다. 마쓰구 드라이버와의 조합으로 이전에 없던 비거리와 정확도를 실현할 수 있습니다.',
      verified: true
    }
  ];

  // 피팅샵 리뷰 데이터
  const shopReviews = [
    {
      name: language === 'ja' ? '골프스튜디오 서울' : '골프스튜디오 서울',
      title: language === 'ja' ? '프리미엄 피팅샵' : '프리미엄 피팅샵',
      rating: 5,
      comment: language === 'ja'
        ? 'MUZIIKシャフトは当店で最も人気の高いシャフトの一つです。特にマツグドライバーとの組み合わせは、お客様の満足度が非常に高く、リピート率も90%を超えています。技術的な優位性が明確に現れています。'
        : 'MUZIIK 샤프트는 저희 매장에서 가장 인기 높은 샤프트 중 하나입니다. 특히 마쓰구 드라이버와의 조합은 고객 만족도가 매우 높고, 재구매율도 90%를 넘습니다. 기술적 우위가 명확히 드러납니다.',
      verified: true
    },
    {
      name: language === 'ja' ? '프로샵 필드앤그린' : '프로샵 필드앤그린',
      title: language === 'ja' ? '전문 골프샵' : '전문 골프샵',
      rating: 5,
      comment: language === 'ja'
        ? 'DOGATTI GENERATIONの技術力は業界最高水準です。ナノレベル樹脂技術とチタンファイバーの組み合わせにより、従来のシャフトでは実現できなかった性能を提供しています。お客様の期待を常に上回る結果を出しています。'
        : 'DOGATTI GENERATION의 기술력은 업계 최고 수준입니다. 나노레벨 수지 기술과 티타늄 파이버의 조합으로 기존 샤프트로는 실현할 수 없던 성능을 제공하고 있습니다. 고객의 기대를 항상 뛰어넘는 결과를 보여주고 있습니다.',
      verified: true
    }
  ];

  // 고객 리뷰 데이터
  const customerReviews = [
    {
      name: '김○○',
      title: language === 'ja' ? 'アマチュア 골퍼' : '아마추어 골퍼',
      rating: 5,
      comment: language === 'ja'
        ? 'マツグドライバーにMUZIIKシャフトを組み合わせて使用していますが、飛距離が20ヤード以上向上しました。特に打感が素晴らしく、毎回のラウンドが楽しみになりました。投資する価値が十分にある製品です。'
        : '마쓰구 드라이버에 MUZIIK 샤프트를 조합해서 사용하고 있는데, 비거리가 20야드 이상 향상되었습니다. 특히 타감이 훌륭해서 매번의 라운드가 기대됩니다. 투자할 가치가 충분한 제품입니다.',
      verified: false
    },
    {
      name: '이○○',
      title: language === 'ja' ? '중급 골퍼' : '중급 골퍼',
      rating: 5,
      comment: language === 'ja'
        ? 'フィッティングを受けてマツグ+MUZIIKの組み合わせを選択しました。最初は高価だと思いましたが、使用してみるとその価値が十分に分かりました。方向性が格段に良くなり、スコアも大幅に改善されました。'
        : '피팅을 받고 마쓰구+MUZIIK 조합을 선택했습니다. 처음에는 비싸다고 생각했지만, 사용해보니 그 가치가 충분히 느껴집니다. 방향성이 획기적으로 좋아졌고, 스코어도 크게 개선되었습니다.',
      verified: false
    },
    {
      name: '박○○',
      title: language === 'ja' ? '시니어 골퍼' : '시니어 골퍼',
      rating: 4,
      comment: language === 'ja'
        ? '年齢の関係でスイングスピードが落ちていましたが、MUZIIKシャフトのおかげで飛距離を維持できています。軽量でありながら強度が高く、シニアゴルファーにも最適です。マツグドライバーとの組み合わせは最高です。'
        : '나이 때문에 스윙 스피드가 떨어지고 있었는데, MUZIIK 샤프트 덕분에 비거리를 유지할 수 있습니다. 경량이면서도 강도가 높아 시니어 골퍼에게도 최적입니다. 마쓰구 드라이버와의 조합은 최고입니다.',
      verified: false
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-400'}>
        ★
      </span>
    ));
  };

  const getCurrentReviews = () => {
    switch (activeTab) {
      case 'pro': return proReviews;
      case 'shop': return shopReviews;
      case 'customer': return customerReviews;
      default: return [];
    }
  };

  const getCurrentTitle = () => {
    switch (activeTab) {
      case 'pro': return t.proTitle;
      case 'shop': return t.shopTitle;
      case 'customer': return t.customerTitle;
      default: return '';
    }
  };

  const getCurrentDesc = () => {
    switch (activeTab) {
      case 'pro': return t.proDesc;
      case 'shop': return t.shopDesc;
      case 'customer': return t.customerDesc;
      default: return '';
    }
  };

  return (
    <section className="py-16 bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            {t.title}
          </h2>

          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center mb-8">
            <button
              onClick={() => setActiveTab('pro')}
              className={`px-6 py-3 m-2 rounded-lg font-semibold transition-all ${
                activeTab === 'pro'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {t.proTab}
            </button>
            <button
              onClick={() => setActiveTab('shop')}
              className={`px-6 py-3 m-2 rounded-lg font-semibold transition-all ${
                activeTab === 'shop'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {t.shopTab}
            </button>
            <button
              onClick={() => setActiveTab('customer')}
              className={`px-6 py-3 m-2 rounded-lg font-semibold transition-all ${
                activeTab === 'customer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {t.customerTab}
            </button>
          </div>

          {/* Content */}
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white mb-4">
              {getCurrentTitle()}
            </h3>
            <p className="text-gray-300">
              {getCurrentDesc()}
            </p>
          </div>

          {/* Reviews Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {getCurrentReviews().map((review, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-white font-semibold text-lg">{review.name}</h4>
                    <p className="text-gray-400 text-sm">{review.title}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                    {review.verified && (
                      <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                        {t.verified}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>

          {/* YouTube Review Section */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-white mb-8">
              {language === 'ja' ? '유튜브 리뷰' : '유튜브 리뷰'}
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📺</div>
                    <p className="text-gray-300">
                      {language === 'ja' ? '골프 유튜버 리뷰 영상' : '골프 유튜버 리뷰 영상'}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      {language === 'ja' ? '곧 업로드 예정' : '곧 업로드 예정'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🎯</div>
                    <p className="text-gray-300">
                      {language === 'ja' ? '피팅 과정 영상' : '피팅 과정 영상'}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      {language === 'ja' ? '전문 피팅 과정' : '전문 피팅 과정'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
