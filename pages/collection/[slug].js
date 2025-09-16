import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ProductPage() {
  const router = useRouter();
  const { slug } = router.query;
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedLoft, setSelectedLoft] = useState('10.5°');
  const [selectedShaft, setSelectedShaft] = useState('standard');

  // 제품 데이터 로드
  useEffect(() => {
    if (!slug) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${slug}`);
        const data = await response.json();
        
        if (response.ok) {
          setProduct(data.product);
          setRelatedProducts(data.relatedProducts);
        } else {
          setError(data.error || '제품을 불러오는 중 오류가 발생했습니다.');
        }
      } catch (err) {
        setError('제품을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

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

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">제품을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-4">{error || '요청하신 제품이 존재하지 않습니다.'}</p>
          <Link href="/collection" className="text-blue-600 hover:underline">
            제품 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const discountedPrice = product.discountedPrice || Math.round(product.price * (1 - product.discount / 100));

  return (
    <>
      <Head>
        <title>{product.title} - MASGOLF</title>
        <meta name="description" content={product.description} />
        <meta name="keywords" content={`${product.name}, ${product.series}, 드라이버, 골프, MASGOLF`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* 브레드크럼 */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-gray-500">
                    홈
                  </Link>
                </li>
                <li>
                  <Link href="/collection" className="text-gray-400 hover:text-gray-500">
                    제품 컬렉션
                  </Link>
                </li>
                <li>
                  <span className="text-gray-500">{product.name}</span>
                </li>
              </ol>
            </nav>
          </div>
        </div>

        {/* 제품 상세 정보 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* 제품 이미지 */}
            <div className="space-y-4">
              <div className="aspect-w-16 aspect-h-12 bg-gray-200 rounded-lg overflow-hidden">
                <Image
                  src={product.images.main}
                  alt={product.name}
                  width={600}
                  height={400}
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.svg';
                  }}
                />
              </div>

              {/* 이미지 갤러리 */}
              {product.images.gallery && product.images.gallery.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.gallery.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-w-1 aspect-h-1 rounded-lg overflow-hidden ${
                        selectedImage === index ? 'ring-2 ring-blue-600' : ''
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} 갤러리 ${index + 1}`}
                        width={100}
                        height={100}
                        className="w-full h-20 object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.svg';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 제품 정보 */}
            <div className="space-y-6">
              {/* 제품 제목 및 시리즈 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                    {product.series}
                  </span>
                  <span className="text-sm text-gray-500">{product.category}</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>
                <p className="text-lg text-gray-600">
                  {product.description}
                </p>
              </div>

              {/* 가격 정보 */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-3xl font-bold text-gray-900">
                      {discountedPrice.toLocaleString()}원
                    </span>
                    {product.discount > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg text-gray-500 line-through">
                          {product.price.toLocaleString()}원
                        </span>
                        <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                          {product.discount}% 할인
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 구매 옵션 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      로프트 선택
                    </label>
                    <select
                      value={selectedLoft}
                      onChange={(e) => setSelectedLoft(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="9.5°">9.5°</option>
                      <option value="10.5°">10.5°</option>
                      <option value="11.5°">11.5°</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      샤프트 선택
                    </label>
                    <select
                      value={selectedShaft}
                      onChange={(e) => setSelectedShaft(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="standard">표준 샤프트</option>
                      <option value="premium">프리미엄 샤프트</option>
                      <option value="pro">프로급 샤프트</option>
                    </select>
                  </div>

                  <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-lg">
                    구매하기
                  </button>
                </div>
              </div>

              {/* 주요 특징 */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">주요 특징</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 구매 혜택 */}
              {product.benefits && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">구매 혜택</h3>
                  <ul className="space-y-2">
                    {product.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 고객 후기 */}
              {product.customerReviews && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">실제 고객들의 선택</h3>
                  <div className="space-y-4">
                    {product.customerReviews.map((review, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                        {review.distance && (
                          <p className="text-blue-600 font-bold">비거리: {review.distance}</p>
                        )}
                        {review.improvement && (
                          <p className="text-green-600 font-medium">개선: {review.improvement}</p>
                        )}
                        {review.age && (
                          <p className="text-gray-600">연령: {review.age}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 연락처 정보 */}
              {product.contactInfo && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">상담 및 문의</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <p><span className="font-medium">비거리 상담:</span> {product.contactInfo.customerService}</p>
                      <p><span className="font-medium">피팅 & 방문 상담:</span> {product.contactInfo.fittingConsultation}</p>
                      <p><span className="font-medium">주소:</span> {product.contactInfo.address}</p>
                      <p><span className="font-medium">운영시간:</span> {product.contactInfo.hours}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 제품 사양 */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">제품 사양</h3>
            
            {/* 스펙 이미지 */}
            {product.images.specs && (
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.images.specs.map((specImage, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <Image
                        src={specImage}
                        alt={`${product.name} 스펙 ${index + 1}`}
                        width={600}
                        height={400}
                        className="w-full h-auto"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.svg';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 상세 스펙 비교표 */}
            {product.detailedSpecs && (
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-900 mb-4">상세 스펙 비교표</h4>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">스펙</th>
                          {Object.entries(product.detailedSpecs).map(([key, spec]) => (
                            <th key={key} className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                              <div className="text-lg font-bold text-blue-600">{key}</div>
                              <div className="text-xs text-gray-600">{spec.name}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {['헤드 각도', '최적 무게', '탄성 샤프트', '탄성 그립', '고반발 헤드'].map((specKey) => (
                          <tr key={specKey} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{specKey}</td>
                            {Object.entries(product.detailedSpecs).map(([key, spec]) => (
                              <td key={key} className="px-6 py-4 text-center text-sm text-gray-600">
                                {spec[specKey]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 기본 사양 테이블 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <h4 className="text-lg font-bold text-gray-900 mb-4 px-6 pt-6">기본 사양</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {Object.entries(product.specifications).map(([key, value], index) => (
                  <div key={index} className={`p-6 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{key}</span>
                      <span className="text-gray-600">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 관련 제품 */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">관련 제품</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedProducts.map((relatedProduct) => (
                  <div key={relatedProduct.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                    <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                      <Image
                        src={relatedProduct.images.main}
                        alt={relatedProduct.name}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.svg';
                        }}
                      />
                    </div>
                    <div className="p-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">
                        {relatedProduct.name}
                      </h4>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {relatedProduct.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-gray-900">
                          {relatedProduct.discountedPrice.toLocaleString()}원
                        </span>
                        <Link href={`/collection/${relatedProduct.slug}`}>
                          <button className="text-blue-600 hover:text-blue-700 font-medium">
                            자세히 보기
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}