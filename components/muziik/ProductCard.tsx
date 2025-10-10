import Link from 'next/link';
import Image from 'next/image';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    image: string;
    features: string[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
      <div className="relative h-64">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            NEW
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2">
          {product.name}
        </h3>
        <p className="text-gray-300 text-sm mb-3">
          {product.nameEn}
        </p>
        <p className="text-gray-400 text-sm mb-4 line-clamp-3">
          {product.description}
        </p>
        
        <div className="mb-4">
          <h4 className="text-white font-semibold mb-2">主な特徴:</h4>
          <ul className="space-y-1">
            {product.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="text-gray-400 text-sm flex items-center">
                <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        
        <Link 
          href={`/muziik/${product.id}`}
          className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          詳細を見る
        </Link>
      </div>
    </div>
  );
}
