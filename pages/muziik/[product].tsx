import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Navigation from '../../components/muziik/Navigation';

interface ProductPageProps {
  product: {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    mainImage: string;
    shaftImage?: string;
    chartImage?: string;
    features: string[];
    technicalDescription: string;
    specs: {
      model: string;
      length: string;
      weight: string;
      tipDiameter: string;
      buttDiameter: string;
      torque: string;
      frequency?: string;
      kickPoint?: string;
    }[];
  };
}

export default function ProductPage({ product }: ProductPageProps) {
  const router = useRouter();
  const [language, setLanguage] = useState<'ja' | 'ko'>('ko');

  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">제품을 찾을 수 없습니다</h1>
          <p className="text-gray-400 mb-6">요청하신 제품이 존재하지 않습니다.</p>
          <a 
            href="/muziik"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{product.name} - MUZIIK</title>
        <meta name="description" content={product.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Navigation 
          language={language} 
          onLanguageChange={setLanguage}
          currentPath={`/${product.id}`}
        />

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Product Header */}
          <div className="text-center mb-12">
            <div className="inline-block bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              NEW
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {product.name}
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              {product.nameEn}
            </p>
            <p className="text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Main Product Image */}
          <div className="mb-12">
            <div className="relative h-96 md:h-[500px] rounded-lg overflow-hidden bg-gray-900 border border-gray-800">
              <img
                src={product.id === 'sapphire' 
                  ? '/muziik/sapphire_one_flex_shaft_main.png'
                  : '/muziik/beryl_40_shaft_main.png'
                }
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">{product.name}</h2>
                  <p className="text-gray-200">
                    {language === 'ja' ? 'プレミアムシャフト' : '프리미엄 샤프트'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Images Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              {language === 'ja' ? '제품 이미지' : '제품 이미지'}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {language === 'ja' ? '샤프트 이미지' : '샤프트 이미지'}
                </h3>
                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={product.shaftImage}
                    alt={product.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {product.id === 'sapphire' 
                    ? (language === 'ja' ? 'E.I. 강성 분포 차트' : 'E.I. 강성 분포 차트')
                    : (language === 'ja' ? '기술 스펙' : '기술 스펙')
                  }
                </h3>
                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                  {product.id === 'sapphire' && product.chartImage ? (
                    <img
                      src={product.chartImage}
                      alt="Bending Profile Chart"
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-400">
                        <div className="text-4xl mb-2">📊</div>
                        <p>{language === 'ja' ? '스펙 테이블' : '스펙 테이블'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Technical Description */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              {language === 'ja' ? '技術的特徴' : '기술적 특징'}
            </h2>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {product.technicalDescription}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              {language === 'ja' ? '主な特徴' : '주요 특징'}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {product.features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Specifications */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              {language === 'ja' ? '仕様表' : '스펙표'}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-gray-900 border border-gray-800 rounded-lg">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="px-4 py-3 text-left text-white font-semibold">Model</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">
                      {language === 'ja' ? '全長(mm)' : '전장(mm)'}
                    </th>
                    <th className="px-4 py-3 text-left text-white font-semibold">
                      {language === 'ja' ? '重量(g)' : '중량(g)'}
                    </th>
                    <th className="px-4 py-3 text-left text-white font-semibold">Tip(mm)</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">Butt(mm)</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">
                      {language === 'ja' ? 'トルク(°)' : '토크(°)'}
                    </th>
                    {product.specs[0]?.frequency && (
                      <th className="px-4 py-3 text-left text-white font-semibold">
                        {language === 'ja' ? '振動数(cpm)' : '진동수(cpm)'}
                      </th>
                    )}
                    {product.specs[0]?.kickPoint && (
                      <th className="px-4 py-3 text-left text-white font-semibold">K.P.</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {product.specs.map((spec, index) => (
                    <tr key={index} className="border-t border-gray-800 hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-white font-medium">{spec.model}</td>
                      <td className="px-4 py-3 text-gray-300">{spec.length}</td>
                      <td className="px-4 py-3 text-gray-300">{spec.weight}</td>
                      <td className="px-4 py-3 text-gray-300">{spec.tipDiameter}</td>
                      <td className="px-4 py-3 text-gray-300">{spec.buttDiameter}</td>
                      <td className="px-4 py-3 text-gray-300">{spec.torque}</td>
                      {spec.frequency && (
                        <td className="px-4 py-3 text-gray-300">{spec.frequency}</td>
                      )}
                      {spec.kickPoint && (
                        <td className="px-4 py-3 text-gray-300">{spec.kickPoint}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gray-900 rounded-lg p-8 border border-gray-800">
            <h3 className="text-2xl font-bold text-white mb-4">
              {language === 'ja' ? 'お問い合わせ' : '문의하기'}
            </h3>
            <p className="text-gray-300 mb-6">
              {language === 'ja' 
                ? '詳細な情報やカスタムオーダーについては、お気軽にお問い合わせください。'
                : '자세한 정보나 커스텀 오더에 대해서는 언제든지 문의해 주세요.'
              }
            </p>
            <a 
              href="mailto:info@masgolf.co.kr"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              {language === 'ja' ? 'お問い合わせする' : '문의하기'}
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 py-8 mt-16">
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

// 제품 데이터 (이미지에서 추출한 정확한 스펙)
const products = [
  {
    id: 'sapphire',
    name: 'DOGATTI GENERATION Sapphire one-flex',
    nameEn: 'DOGATTI GENERATION Sapphire one-flex',
    description: '超高速の反発力とヘッド安定性を実現する、MUZIIK独自のチタンファイバー技術を採用したプレミアムシャフト。',
    features: [
      'チタンファイバー技術による超高速反発力',
      'ヘッド安定性の向上',
      'オフセンター時のヘッドブレ抑制',
      '自動的なワンフレックスタイプ',
      '様々なゴルファーに対応'
    ],
    technicalDescription: `超高速の反発力とヘッド安定性は、MUZIIK独自のチタンファイバー技術によるものです。
シャフト全体にチタンファイバーを使用することで、強いインパクトやオフセンター時のヘッドのブレを抑制します。
強靭さと大きな反発が高い弾道を実現します。
バックスイングトップからインパクトまで、ヘッドの動きを安定化するようシャフト剛性が設計されており、タイミングを掴みやすくなっています。
ヘッドスピードに関係なく、様々なゴルファーに適した自動的なワンフレックスタイプです。`,
    specs: [
      {
        model: '40',
        length: '1168',
        weight: '45',
        tipDiameter: '8.55',
        buttDiameter: '15.05',
        torque: '5.0',
        frequency: '185'
      },
      {
        model: '50',
        length: '1168',
        weight: '54',
        tipDiameter: '8.55',
        buttDiameter: '15.4',
        torque: '4.2',
        frequency: '195'
      }
    ]
  },
  {
    id: 'beryl',
    name: 'DOGATTI GENERATION Beryl_40',
    nameEn: 'DOGATTI GENERATION Beryl_40',
    description: '高弾性カーボンシートとチタンファイバーを組み合わせた、美しさと性能を兼ね備えたプレミアムシャフト。',
    features: [
      '高弾性(65t)カーボンシート使用',
      'チタンファイバーによる引張強度向上',
      'インパクト時の逆トルク抑制',
      '美しいアルミニウムIP処理',
      'BERYL(美しさ、輝き、若さ)にふさわしいデザイン'
    ],
    technicalDescription: `高弾性(65t)カーボンシートを使用しています。
ストレートレイヤー全体にチタンファイバーを使用することで、引張強度を向上させ、シャフトの反発性を良くし、粘りとドライブという相反する特性を組み合わせています。
さらに、インパクト時の逆トルクを抑制し、フェースコントロールを容易にし、方向性を安定させます。
DOGATTIは、BERYL(美しさ、輝き、若さ)にふさわしい、光沢があり美しいアルミニウムIP処理カラーリングが特徴です。`,
    specs: [
      {
        model: 'R2',
        length: '1168',
        weight: '42',
        tipDiameter: '8.55',
        buttDiameter: '14.95',
        torque: '5.0',
        frequency: '215',
        kickPoint: '先中調子'
      },
      {
        model: 'R',
        length: '1168',
        weight: '48',
        tipDiameter: '8.55',
        buttDiameter: '15.1',
        torque: '4.0',
        frequency: '225',
        kickPoint: '先中調子'
      },
      {
        model: 'SR',
        length: '1168',
        weight: '49',
        tipDiameter: '8.55',
        buttDiameter: '15.15',
        torque: '4.0',
        frequency: '235',
        kickPoint: '先中調子'
      },
      {
        model: 'S',
        length: '1168',
        weight: '50',
        tipDiameter: '8.55',
        buttDiameter: '15.2',
        torque: '4.0',
        frequency: '245',
        kickPoint: '先中調子'
      },
      {
        model: 'X',
        length: '1168',
        weight: '53',
        tipDiameter: '8.55',
        buttDiameter: '15.3',
        torque: '3.9',
        frequency: '255',
        kickPoint: '先中調子'
      }
    ]
  }
];

function getProductById(id: string) {
  return products.find(product => product.id === id);
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = products.map((product) => ({
    params: { product: product.id },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const productId = params?.product as string;
  const product = getProductById(productId);

  if (!product) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      product,
    },
  };
};
