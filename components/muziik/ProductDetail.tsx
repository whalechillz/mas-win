import Image from 'next/image';
import SpecTable from './SpecTable';

interface ProductDetailProps {
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

export default function ProductDetail({ product }: ProductDetailProps) {
  return (
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
        <div className="relative h-96 md:h-[500px] rounded-lg overflow-hidden">
          <Image
            src={product.mainImage}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Technical Description */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">技術的特徴</h2>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">
            {product.technicalDescription}
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">主な特徴</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {product.features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-300">{feature}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Image (for Sapphire) */}
      {product.chartImage && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">E.I.剛性分布</h2>
          <div className="relative h-64 md:h-80 rounded-lg overflow-hidden">
            <Image
              src={product.chartImage}
              alt="E.I.剛性分布チャート"
              fill
              className="object-contain bg-gray-900"
            />
          </div>
        </div>
      )}

      {/* Shaft Image */}
      {product.shaftImage && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">シャフト画像</h2>
          <div className="relative h-64 md:h-80 rounded-lg overflow-hidden">
            <Image
              src={product.shaftImage}
              alt={`${product.name} シャフト`}
              fill
              className="object-contain bg-gray-900"
            />
          </div>
        </div>
      )}

      {/* Specifications */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">仕様表</h2>
        <SpecTable specs={product.specs} />
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gray-900 rounded-lg p-8 border border-gray-800">
        <h3 className="text-2xl font-bold text-white mb-4">お問い合わせ</h3>
        <p className="text-gray-300 mb-6">
          詳細な情報やカスタムオーダーについては、お気軽にお問い合わせください。
        </p>
        <a 
          href="mailto:info@masgolf.co.kr"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          お問い合わせする
        </a>
      </div>
    </div>
  );
}
