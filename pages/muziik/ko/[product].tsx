import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

interface ProductPageProps {
  product: {
    id: string;
    name: string;
    nameEn: string;
    description: string;
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

export default function KoreanProductPage({ product }: ProductPageProps) {
  const router = useRouter();

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
            href="/muziik/ko"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            제품 목록으로 돌아가기
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
        {/* Header */}
        <header className="bg-black border-b border-gray-800">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <Link href="/muziik/ko" className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
                MUZIIK
              </Link>
              <nav className="hidden md:flex space-x-8">
                <Link href="/muziik/ko" className="text-gray-300 hover:text-white transition-colors">
                  홈
                </Link>
                <Link href="/muziik/ko/sapphire" className="text-gray-300 hover:text-white transition-colors">
                  Sapphire
                </Link>
                <Link href="/muziik/ko/beryl" className="text-gray-300 hover:text-white transition-colors">
                  Beryl
                </Link>
                <a href="mailto:massgoogolf@gmail.com" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  문의하기
                </a>
                <Link href="/muziik" className="text-gray-400 hover:text-white transition-colors text-sm">
                  日本語
                </Link>
              </nav>
            </div>
          </div>
        </header>

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
            <div className="relative h-96 md:h-[500px] rounded-lg overflow-hidden bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl mb-4">{product.id === 'sapphire' ? '💎' : '💚'}</div>
                <h2 className="text-3xl font-bold text-white">{product.name}</h2>
                <p className="text-blue-200 mt-2">프리미엄 샤프트</p>
                <div className="mt-4 text-sm text-gray-300">
                  <p>※ 실제 제품 이미지는 준비 중입니다</p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Images Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">제품 이미지</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">샤프트 이미지</h3>
                <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">{product.id === 'sapphire' ? '💎' : '💚'}</div>
                    <p>샤프트 이미지</p>
                    <p className="text-sm mt-2">경로: /muziik/products/{product.id}/shaft.jpg</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">기술 차트</h3>
                <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">📊</div>
                    <p>기술 차트</p>
                    <p className="text-sm mt-2">경로: /muziik/charts/{product.id}_chart.jpg</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Description */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">기술적 특징</h2>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {product.technicalDescription}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">주요 특징</h2>
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
            <h2 className="text-2xl font-bold text-white mb-6">스펙 표</h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-gray-900 border border-gray-800 rounded-lg">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="px-4 py-3 text-left text-white font-semibold">모델</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">전체길이(mm)</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">무게(g)</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">팁직경(mm)</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">버트직경(mm)</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">토크(°)</th>
                    {product.specs[0]?.frequency && (
                      <th className="px-4 py-3 text-left text-white font-semibold">CPM</th>
                    )}
                    {product.specs[0]?.kickPoint && (
                      <th className="px-4 py-3 text-left text-white font-semibold">킥포인트</th>
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
            <h3 className="text-2xl font-bold text-white mb-4">문의하기</h3>
            <p className="text-gray-300 mb-6">
              자세한 정보나 커스텀 오더에 대해서는 언제든지 문의해 주세요.
            </p>
            <a 
              href="mailto:massgoogolf@gmail.com"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              문의하기
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 py-8 mt-16">
          <div className="container mx-auto px-4">
            <div className="text-center text-gray-400">
              <p>&copy; 2025 MUZIIK. All rights reserved.</p>
              <p className="mt-2">DOGATTI GENERATION 샤프트 - 일본제 프리미엄 골프 샤프트</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// 제품 데이터 (한글 번역 - 이미지에서 추출한 정확한 스펙)
const products = [
  {
    id: 'sapphire',
    name: 'DOGATTI GENERATION Sapphire Auto-flex',
    nameEn: 'DOGATTI GENERATION Sapphire Auto-flex',
    description: '초고속의 반발력과 헤드 안정성을 실현하는, MUZIIK 독자적인 티타늄 파이버 기술을 채택한 프리미엄 샤프트.',
    features: [
      '티타늄 파이버 기술로 초고속 반발력',
      '헤드 안정성 향상',
      '오프센터 시 헤드 흔들림 억제',
      '자동적인 오토플렉스 타입',
      '다양한 골퍼에게 대응'
    ],
    technicalDescription: `초고속의 반발력과 헤드 안정성은, MUZIIK 독자적인 티타늄 파이버 기술에 의한 것입니다.
샤프트 전체에 티타늄 파이버를 사용함으로써, 강한 임팩트나 오프센터 시의 헤드 흔들림을 억제합니다.
강인함과 큰 반발이 높은 탄도를 실현합니다.
백스윙 탑부터 임팩트까지, 헤드의 움직임을 안정화하도록 샤프트 강성이 설계되어 있어, 타이밍을 잡기 쉬워졌습니다.
헤드 스피드에 관계없이, 다양한 골퍼에게 적합한 자동적인 오토플렉스 타입입니다.`,
    specs: [
      {
        model: '40',
        length: '1130',
        weight: '45',
        tipDiameter: '8.55',
        buttDiameter: '15.05',
        torque: '5.0',
        frequency: '200',
        kickPoint: '더블킥'
      },
      {
        model: '50',
        length: '1130',
        weight: '54',
        tipDiameter: '8.55',
        buttDiameter: '15.4',
        torque: '4.2',
        frequency: '215',
        kickPoint: '더블킥'
      }
    ]
  },
  {
    id: 'beryl',
    name: 'DOGATTI GENERATION Beryl',
    nameEn: 'DOGATTI GENERATION Beryl',
    description: '고탄성 카본 시트와 티타늄 파이버를 조합한, 아름다움과 성능을 겸비한 프리미엄 샤프트.',
    features: [
      '고탄성(65t) 카본 시트 사용',
      '티타늄 파이버로 인장 강도 향상',
      '임팩트 시 역토크 억제',
      '아름다운 알루미늄 IP 처리',
      'BERYL(아름다움, 광채, 젊음)에 어울리는 디자인'
    ],
    technicalDescription: `고탄성(65t) 카본 시트를 사용하고 있습니다.
스트레이트 레이어 전체에 티타늄 파이버를 사용함으로써, 인장 강도를 향상시키고, 샤프트의 반발성을 좋게 하며, 끈적임과 드라이브라는 상반된 특성을 조합하고 있습니다.
또한, 임팩트 시의 역토크를 억제하여, 페이스 컨트롤을 용이하게 하고, 방향성을 안정시킵니다.
DOGATTI는, BERYL(아름다움, 광채, 젊음)에 어울리는, 광택이 있고 아름다운 알루미늄 IP 처리 컬러링이 특징입니다.`,
    specs: [
      {
        model: 'R2',
        length: '1136',
        weight: '42',
        tipDiameter: '8.55',
        buttDiameter: '14.95',
        torque: '5.0',
        frequency: '230',
        kickPoint: '先中調子'
      },
      {
        model: 'R',
        length: '1136',
        weight: '48',
        tipDiameter: '8.55',
        buttDiameter: '15.1',
        torque: '4.0',
        frequency: '240',
        kickPoint: '先中調子'
      },
      {
        model: 'SR',
        length: '1136',
        weight: '49',
        tipDiameter: '8.55',
        buttDiameter: '15.15',
        torque: '4.0',
        frequency: '250',
        kickPoint: '先中調子'
      },
      {
        model: 'S',
        length: '1136',
        weight: '50',
        tipDiameter: '8.55',
        buttDiameter: '15.2',
        torque: '4.0',
        frequency: '260',
        kickPoint: '先中調子'
      },
      {
        model: 'X',
        length: '1136',
        weight: '53',
        tipDiameter: '8.55',
        buttDiameter: '15.3',
        torque: '3.9',
        frequency: '270',
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
