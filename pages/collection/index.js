import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function CollectionPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState('전체');
  const [selectedCategory, setSelectedCategory] = useState('전체');

  // 제품 데이터 로드
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (response.ok) {
          setProducts(data.products);
        } else {
          setError(data.error || '제품을 불러오는 중 오류가 발생했습니다.');
        }
      } catch (err) {
        setError('제품을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 필터링된 제품 목록
  const filteredProducts = products.filter(product => {
    const seriesMatch = selectedSeries === '전체' || product.series === selectedSeries;
    const categoryMatch = selectedCategory === '전체' || product.category === selectedCategory;
    return seriesMatch && categoryMatch;
  });

  // 시리즈 목록
  const seriesList = ['전체', ...new Set(products.map(p => p.series))];
  
  // 카테고리 목록
  const categoryList = ['전체', ...new Set(products.map(p => p.category))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">제품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">오류 발생</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>MASGOLF 제품 컬렉션 - 프리미엄 골프 드라이버</title>
        <meta name="description" content="MASGOLF의 프리미엄 골프 드라이버 컬렉션. 시크리트포스, 시크리트웨폰 시리즈의 고품질 드라이버를 만나보세요." />
        <meta name="keywords" content="MASGOLF, 골프드라이버, 시크리트포스, 시크리트웨폰, 고반발드라이버" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                MASGOLF 제품 컬렉션
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                프리미엄 골프 드라이버의 새로운 기준을 제시하는 MASGOLF의 모든 제품을 만나보세요
              </p>
            </div>
          </div>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-wrap gap-4 justify-center">
              {/* 시리즈 필터 */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">시리즈</label>
                <select
                  value={selectedSeries}
                  onChange={(e) => setSelectedSeries(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {seriesList.map(series => (
                    <option key={series} value={series}>{series}</option>
                  ))}
                </select>
              </div>

              {/* 카테고리 필터 */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categoryList.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 제품 그리드 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">제품을 찾을 수 없습니다</h3>
              <p className="text-gray-600">선택한 필터에 해당하는 제품이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  {/* 제품 이미지 */}
                  <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                    <Image
                      src={product.images.main}
                      alt={product.name}
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder-image.svg';
                      }}
                    />
                  </div>

                  {/* 제품 정보 */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {product.series}
                      </span>
                      <span className="text-sm text-gray-500">{product.category}</span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {product.name}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    {/* 가격 정보 */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">
                          {product.discountedPrice.toLocaleString()}원
                        </span>
                        {product.discount > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 line-through">
                              {product.price.toLocaleString()}원
                            </span>
                            <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                              {product.discount}% 할인
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 주요 특징 */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">주요 특징</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {product.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 상세보기 버튼 */}
                    <Link href={`/collection/${product.slug}`}>
                      <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
                        상세보기
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 통계 섹션 */}
        <div className="bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">MASGOLF 제품 통계</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{products.length}</div>
                  <div className="text-gray-600">총 제품 수</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{seriesList.length - 1}</div>
                  <div className="text-gray-600">시리즈 수</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{categoryList.length - 1}</div>
                  <div className="text-gray-600">카테고리 수</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
