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
  const { locale } = router;
  const [footerExpanded, setFooterExpanded] = useState(false);

  // 언어별 콘텐츠
  const content = {
    ko: {
      sapphireDescription: '초고속의 반발력과 헤드 안정성을 실현하는, MUZIIK 독자적인 티타늄 파이버 기술을 채택한 프리미엄 샤프트.',
      berylDescription: '고탄성 카본 시트와 티타늄 파이버를 조합한, 아름다움과 성능을 겸비한 프리미엄 샤프트.',
      footer: 'DOGATTI GENERATION 샤프트 - 일본제 프리미엄 골프 샤프트'
    },
    ja: {
      sapphireDescription: '超高速の反発力とヘッド安定性を実現する、MUZIIK独自のチタンファイバー技術を採用したプレミアムシャフト。',
      berylDescription: '高弾性カーボンシートとチタンファイバーを組み合わせた、美しさと性能を兼ね備えたプレミアムシャフト。',
      footer: 'DOGATTI GENERATION シャフト - 日本製プレミアムゴルフシャフト'
    }
  };

  const t = content[locale as 'ja' | 'ko'] || content.ko;

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
        <title>{product.name} - MUZIIK DOGATTI GENERATION</title>
        <meta name="description" content={`${product.name} - ${product.description}. 마쓰구 드라이버와 완벽한 조합. 일본 최고급 골프 샤프트.`} />
        <meta name="keywords" content={`${product.name},MUZIIK,도가티,골프샤프트,프리미엄샤프트,일본샤프트,DOGATTI GENERATION,마쓰구드라이버,골프피팅`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${product.name} - MUZIIK DOGATTI GENERATION`} />
        <meta property="og:description" content={`${product.name} - ${product.description}. 마쓰구 드라이버와 완벽한 조합.`} />
        <meta property="og:image" content={product.mainImage} />
        <meta property="og:url" content={`https://masgolf.co.kr/muziik/${product.id}`} />
        <meta property="og:type" content="product" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} - MUZIIK`} />
        <meta name="twitter:description" content={`${product.description}. 마쓰구 드라이버와 완벽한 조합.`} />
        <meta name="twitter:image" content={product.mainImage} />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://masgolf.co.kr/muziik/${product.id}`} />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Navigation 
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
              {product.id === 'sapphire' ? t.sapphireDescription : t.berylDescription}
            </p>
          </div>

          {/* Main Product Image */}
          <div className="mb-12">
            <div className="relative h-96 md:h-[500px] rounded-lg overflow-hidden bg-gray-900 border border-gray-800">
              <img
                src={product.id === 'sapphire' 
                  ? '/muziik/products/sapphire/sapphire_shaft_main.webp'
                  : '/muziik/products/beryl/beryl_shaft_main.webp'
                }
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">{product.name}</h2>
                  <p className="text-gray-200">
                    {locale === 'ja' ? 'プレミアムシャフト' : '프리미엄 샤프트'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Images Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              {locale === 'ja' ? '製品画像' : '제품 이미지'}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {locale === 'ja' ? 'シャフト画像' : '샤프트 이미지'}
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
                    ? (locale === 'ja' ? 'E.I.剛性分布チャート' : 'E.I. 강성 분포 차트')
                    : (locale === 'ja' ? '技術スペック' : '기술 스펙')
                  }
                </h3>
                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                  {product.id === 'sapphire' ? (
                    <div className="p-4 h-full overflow-y-auto">
                      <div className="text-white text-sm">
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="font-semibold">Model</div>
                          <div className="font-semibold">Specifications</div>
                        </div>
                        {product.specs.map((spec, index) => (
                          <div key={index} className="grid grid-cols-2 gap-2 py-1 border-b border-gray-600">
                            <div className="text-blue-400 font-medium">{spec.model}</div>
                            <div className="text-gray-300 text-xs">
                              {locale === 'ja' ? '重量' : '중량'}: {spec.weight}g | 
                              {locale === 'ja' ? 'トルク' : '토크'}: {spec.torque}° | 
                              {locale === 'ja' ? '振動数' : '진동수'}: {spec.frequency}cpm
                            </div>
                          </div>
                        ))}
                        <div className="mt-2 text-xs text-gray-400">
                          {locale === 'ja' ? '全長' : '전장'}: 1130mm | 
                          {locale === 'ja' ? 'Tip' : 'Tip'}: 8.55mm | 
                          {locale === 'ja' ? 'Butt' : 'Butt'}: 15.05-15.4mm
                        </div>
                      </div>
                    </div>
                  ) : product.id === 'beryl' ? (
                    <div className="p-4 h-full overflow-y-auto">
                      <div className="text-white text-sm">
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="font-semibold">Model</div>
                          <div className="font-semibold">Specifications</div>
                        </div>
                        {product.specs.map((spec, index) => (
                          <div key={index} className="grid grid-cols-2 gap-2 py-1 border-b border-gray-600">
                            <div className="text-blue-400 font-medium">{spec.model}</div>
                            <div className="text-gray-300 text-xs">
                              {locale === 'ja' ? '重量' : '중량'}: {spec.weight}g | 
                              {locale === 'ja' ? 'トルク' : '토크'}: {spec.torque}° | 
                              {locale === 'ja' ? '振動数' : '진동수'}: {spec.frequency}cpm | 
                              {locale === 'ja' ? 'キックポイント' : '킥포인트'}: {spec.kickPoint || '先中調子'}
                            </div>
                          </div>
                        ))}
                        <div className="mt-2 text-xs text-gray-400">
                          {locale === 'ja' ? '全長' : '전장'}: 1136mm | 
                          {locale === 'ja' ? 'Tip' : 'Tip'}: 8.55mm | 
                          {locale === 'ja' ? 'Butt' : 'Butt'}: 14.95-15.3mm
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-400">
                        <div className="text-4xl mb-2">📊</div>
                        <p>{locale === 'ja' ? '스펙 테이블' : '스펙 테이블'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Bending Profile Section for Sapphire */}
            {product.id === 'sapphire' && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {locale === 'ja' ? 'サファイア剛性分布' : '사파이어 강성 분포'}
                </h2>
                <div className="bg-gray-900 rounded-lg p-8 border border-gray-700">
                  <div className="text-center">
                    <img
                      src="/muziik/products/sapphire/sapphire_shaft_bending_profile.webp"
                      alt="Sapphire Shaft Bending Profile"
                      className="w-full max-w-4xl mx-auto h-auto object-contain"
                    />
                    <p className="text-gray-400 mt-4">
                      {locale === 'ja' 
                        ? 'サファイアシャフトの剛性分布チャート - 40と50モデルの比較'
                        : '사파이어 샤프트 강성 분포 차트 - 40과 50 모델 비교'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bending Profile Section for Beryl */}
            {product.id === 'beryl' && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {locale === 'ja' ? 'ベリル剛性分布' : '베릴 강성 분포'}
                </h2>
                <div className="bg-gray-900 rounded-lg p-8 border border-gray-700">
                  <div className="text-center">
                    <img
                      src="/muziik/products/beryl/beryl_shaft_bending_profile.webp"
                      alt="Beryl Shaft Bending Profile"
                      className="w-full max-w-4xl mx-auto h-auto object-contain"
                    />
                    <p className="text-gray-400 mt-4">
                      {locale === 'ja' 
                        ? 'ベリルシャフトの剛性分布チャート - 40Sと50Sモデルの比較'
                        : '베릴 샤프트 강성 분포 차트 - 40S와 50S 모델 비교'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Product Gallery for Beryl */}
            {product.id === 'beryl' && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {locale === 'ja' ? '製品ギャラリー' : '제품 갤러리'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src="/muziik/products/beryl/beryl1.webp"
                      alt="Beryl Shaft Detail 1"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src="/muziik/products/beryl/beryl2.webp"
                      alt="Beryl Shaft Detail 2"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src="/muziik/products/beryl/beryl3.webp"
                      alt="Beryl Shaft Detail 3"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Technical Description */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              {locale === 'ja' ? '技術的特徴' : '기술적 특징'}
            </h2>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {locale === 'ko' && product.technicalDescriptionKo ? product.technicalDescriptionKo : product.technicalDescription}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              {locale === 'ja' ? '主な特徴' : '주요 특징'}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {(locale === 'ko' && product.featuresKo ? product.featuresKo : product.features).map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">{feature}</p>
                </div>
              ))}
            </div>
          </div>


          {/* CTA Section */}
          <div className="text-center bg-gray-900 rounded-lg p-8 border border-gray-800">
            <h3 className="text-2xl font-bold text-white mb-4">
              {locale === 'ja' ? 'お問い合わせ' : '문의하기'}
            </h3>
            <p className="text-gray-300 mb-6">
              {locale === 'ja' 
                ? '詳細な情報やカスタムオーダーについては、お気軽にお問い合わせください。'
                : '자세한 정보나 커스텀 오더에 대해서는 언제든지 문의해 주세요.'
              }
            </p>
            <Link 
              href="/muziik/contact"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              {locale === 'ja' ? 'お問い合わせする' : '문의하기'}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 py-12 mt-16">
          <div className="container mx-auto px-4">
            {/* 통합 신뢰도 섹션 - 한 줄 (아이콘만) */}
            <div className="py-6 border-b border-gray-800">
              <div className="flex items-center justify-center gap-4 text-gray-500">
                {/* 다른 브랜드 보기 */}
                <div className="flex items-center gap-2">
                  <Link 
                    href="/" 
                    className="opacity-50 hover:opacity-100 transition-opacity"
                    title={locale === 'ja' ? 'MASSGOO ドライバー' : 'MASSGOO 드라이버'}
                  >
                    <img 
                      src="/main/logo/massgoo_logo_white.png" 
                      alt="MASSGOO"
                      className="h-4 w-auto object-contain"
                    />
                  </Link>
                  <span className="text-gray-700 text-xs">/</span>
                  <Link 
                    href="/muziik" 
                    className="opacity-50 hover:opacity-100 transition-opacity"
                    title={locale === 'ja' ? 'MUZIIK シャフト' : 'MUZIIK 샤프트'}
                  >
                    <img 
                      src="/muziik/brand/muziik-logo-art.png" 
                      alt="MUZIIK"
                      className="h-4 w-auto object-contain"
                    />
                  </Link>
                </div>
                
                {/* 구분선 */}
                <div className="w-px h-4 bg-gray-800"></div>
                
                {/* SSL 보안 */}
                <Link 
                  href="#" 
                  className="opacity-50 hover:opacity-100 transition-opacity"
                  title={locale === 'ja' ? 'SSLセキュリティ認証' : 'SSL 보안 인증'}
                >
                  <img 
                    src="/main/brand/ssl-secure-badge.svg" 
                    alt="SSL"
                    className="h-4 w-4 object-contain"
                  />
                </Link>
                
                {/* 구분선 */}
                <div className="w-px h-4 bg-gray-800"></div>
                
                {/* 프리미엄 품질 */}
                <Link 
                  href="#" 
                  className="opacity-50 hover:opacity-100 transition-opacity"
                  title={locale === 'ja' ? 'プレミアム品質' : '프리미엄 품질'}
                >
                  <img 
                    src="/main/brand/premium-quality-badge.svg" 
                    alt="프리미엄"
                    className="h-4 w-4 object-contain"
                  />
                </Link>
                
                {/* 구분선 */}
                <div className="w-px h-4 bg-gray-800"></div>
                
                {/* mas9golf.com */}
                <Link 
                  href="https://www.mas9golf.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="opacity-50 hover:opacity-100 transition-opacity"
                  title={locale === 'ja' ? 'MASSGOO公式モール' : 'MASSGOO 공식몰'}
                >
                  <img 
                    src="/main/brand/mas9golf-icon.svg" 
                    alt="MASSGOO 공식몰"
                    className="h-4 w-4 object-contain"
                  />
                </Link>
                
                {/* 구분선 */}
                <div className="w-px h-4 bg-gray-800"></div>
                
                {/* 네이버 스마트스토어 */}
                <Link 
                  href="https://smartstore.naver.com/mas9golf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="opacity-50 hover:opacity-100 transition-opacity"
                  title={locale === 'ja' ? 'ネイバースマートストア' : '네이버 스마트스토어'}
                >
                  <img 
                    src="/main/brand/naver-smartstore-icon.svg" 
                    alt="네이버 스마트스토어"
                    className="h-4 w-4 object-contain"
                  />
                </Link>
              </div>
            </div>
            
            {/* 토글 버튼 */}
            <button
              onClick={() => setFooterExpanded(!footerExpanded)}
              className="w-full py-3 px-4 text-xs text-gray-400 hover:text-gray-300 
                         border-b border-gray-800 transition-all duration-300
                         flex items-center justify-center gap-2
                         hover:bg-gray-800/30"
            >
              <span>{locale === 'ja' ? '会社情報' : '회사 정보'}</span>
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${
                  footerExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* 토글 콘텐츠 */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                footerExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="py-6 px-4">
                <div className="grid md:grid-cols-3 gap-8 text-sm text-gray-400">
                  {/* 사업자 정보 */}
                  <div>
                    <h4 className="font-bold mb-4 text-white">{locale === 'ja' ? '事業者情報' : '사업자 정보'}</h4>
                    <div className="space-y-2">
                      <p>{locale === 'ja' ? '事業者名' : '사업자명'}: MASGOLF® | {locale === 'ja' ? '代表者名' : '대표자명'}: 김탁수</p>
                      <p>{locale === 'ja' ? '事業者登録番号' : '사업자등록번호'}: 877-07-00641</p>
                      <p>{locale === 'ja' ? '通信販売業届出番号' : '통신판매업신고번호'}: 제 2017-수원영통-0623호</p>
                    </div>
                  </div>
                  
                  {/* 고객센터 정보 */}
                  <div>
                    <h4 className="font-bold mb-4 text-white">{locale === 'ja' ? 'お客様センター' : '고객센터'}</h4>
                    <div className="space-y-2">
                      <p>{locale === 'ja' ? '距離相談' : '비거리 상담'}: 080-028-8888 ({locale === 'ja' ? '無料' : '무료'})</p>
                      <p>{locale === 'ja' ? 'フィッティング・訪問相談' : '피팅 & 방문 상담'}: 031-215-0013</p>
                      <p>📍 {locale === 'ja' ? '水原市永同区法条路149番ギル200' : '수원시 영통구 법조로 149번길 200'}</p>
                      <p>🕘 {locale === 'ja' ? '月-金 09:00 - 18:00 / 週末予約制運営' : '월-금 09:00 - 18:00 / 주말 예약제 운영'}</p>
                    </div>
                  </div>
                  
                  {/* 연락처 정보 */}
                  <div>
                    <h4 className="font-bold mb-4 text-white">{locale === 'ja' ? '連絡先' : '연락처'}</h4>
                    <div className="space-y-2">
                      <p>{locale === 'ja' ? 'メール' : '이메일'}: hello@masgolf.co.kr</p>
                      <p>{locale === 'ja' ? 'ウェブサイト' : '웹사이트'}: www.mas9golf.com</p>
                      <p>{locale === 'ja' ? 'ウェブサイト' : '웹사이트'}: www.masgolf.co.kr</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 저작권 */}
            <div className="py-4 text-center text-xs text-gray-500 border-t border-gray-800">
              <p>&copy; 2025 MUZIIK X MASSGOO. All rights reserved.</p>
              <p className="mt-2">{t.footer}</p>
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
    name: 'DOGATTI GENERATION Sapphire Auto-flex',
    nameEn: 'DOGATTI GENERATION Sapphire Auto-flex',
    description: '超高速の反発力とヘッド安定性を実現する、MUZIIK独自のチタンファイバー技術を採用したプレミアムシャフト。',
    mainImage: '/muziik/products/sapphire/sapphire_shaft_main.webp',
    shaftImage: '/muziik/products/sapphire/sapphire_shaft_40.webp',
    chartImage: '/muziik/products/sapphire/sapphire_shaft_bending_profile.webp',
    features: [
      'チタンファイバー技術による超高速反発力',
      'ヘッド安定性の向上',
      'オフセンター時のヘッドブレ抑制',
      '自動的なオートフレックスタイプ',
      '様々なゴルファーに対応'
    ],
    featuresKo: [
      '티타늄 파이버 기술로 인한 초고속 반발력',
      '헤드 안정성 향상',
      '오프센터 시 헤드 흔들림 억제',
      '자동적인 오토플렉스 타입',
      '다양한 골퍼에게 대응'
    ],
    technicalDescription: `超高速の反発力とヘッド安定性は、MUZIIK独自のチタンファイバー技術によるものです。
シャフト全体にチタンファイバーを使用することで、強いインパクトやオフセンター時のヘッドのブレを抑制します。
強靭さと大きな反発が高い弾道を実現します。
バックスイングトップからインパクトまで、ヘッドの動きを安定化するようシャフト剛性が設計されており、タイミングを掴みやすくなっています。
ヘッドスピードに関係なく、様々なゴルファーに適した自動的なオートフレックスタイプです。`,
    technicalDescriptionKo: `초고속의 반발력과 헤드 안정성은 MUZIIK 독자적인 티타늄 파이버 기술에 의한 것입니다.
샤프트 전체에 티타늄 파이버를 사용함으로써 강한 임팩트나 오프센터 시 헤드의 흔들림을 억제합니다.
강인함과 큰 반발이 높은 탄도를 실현합니다.
백스윙 탑부터 임팩트까지 헤드의 움직임을 안정화하도록 샤프트 강성이 설계되어 있어 타이밍을 잡기 쉬워집니다.
헤드 스피드에 관계없이 다양한 골퍼에게 적합한 자동적인 오토플렉스 타입입니다.`,
    specs: [
             {
               model: 'A200(40)',
               length: '1130',
               weight: '44',
               tipDiameter: '8.55',
               buttDiameter: '15.05',
               torque: '4.8',
               frequency: 'A200',
               kickPoint: '더블킥'
             },
             {
               model: 'A215(50)',
               length: '1130',
               weight: '53',
               tipDiameter: '8.55',
               buttDiameter: '15.4',
               torque: '4.0',
               frequency: 'A215',
               kickPoint: '더블킥'
             }
    ]
  },
  {
    id: 'beryl',
    name: 'DOGATTI GENERATION Beryl',
    nameEn: 'DOGATTI GENERATION Beryl',
    description: '高弾性カーボンシートとチタンファイバーを組み合わせた、美しさと性能を兼ね備えたプレミアムシャフト。',
    mainImage: '/muziik/products/beryl/beryl_shaft_main.webp',
    shaftImage: '/muziik/products/beryl/beryl_shaft_40.webp',
    chartImage: '/muziik/products/beryl/beryl_shaft_bending_profile.webp',
    features: [
      '高弾性(65t)カーボンシート使用',
      'チタンファイバーによる引張強度向上',
      'インパクト時の逆トルク抑制',
      '美しいアルミニウムIP処理',
      'BERYL(美しさ、輝き、若さ)にふさわしいデザイン'
    ],
    featuresKo: [
      '고탄성(65t) 카본 시트 사용',
      '티타늄 파이버로 인한 인장 강도 향상',
      '임팩트 시 역토크 억제',
      '아름다운 알루미늄 IP 처리',
      'BERYL(아름다움, 빛남, 젊음)에 어울리는 디자인'
    ],
    technicalDescription: `高弾性(65t)カーボンシートを使用しています。
ストレートレイヤー全体にチタンファイバーを使用することで、引張強度を向上させ、シャフトの反発性を良くし、粘りとドライブという相反する特性を組み合わせています。
さらに、インパクト時の逆トルクを抑制し、フェースコントロールを容易にし、方向性を安定させます。
DOGATTIは、BERYL(美しさ、輝き、若さ)にふさわしい、光沢があり美しいアルミニウムIP処理カラーリングが特徴です。`,
    technicalDescriptionKo: `고탄성(65t) 카본 시트를 사용합니다.
스트레이트 레이어 전체에 티타늄 파이버를 사용함으로써 인장 강도를 향상시키고, 샤프트의 반발성을 좋게 하며, 끈기와 드라이브라는 상반된 특성을 결합합니다.
또한 임팩트 시 역토크를 억제하여 페이스 컨트롤을 쉽게 하고 방향성을 안정시킵니다.
DOGATTI는 BERYL(아름다움, 빛남, 젊음)에 어울리는 광택이 있고 아름다운 알루미늄 IP 처리 컬러링이 특징입니다.`,
    specs: [
             {
               model: '230(R2)',
               length: '1136',
               weight: '43',
               tipDiameter: '8.55',
               buttDiameter: '14.95',
               torque: '4.8',
               frequency: '230',
               kickPoint: '先中調子'
             },
             {
               model: '240(R)',
               length: '1136',
               weight: '47',
               tipDiameter: '8.55',
               buttDiameter: '15.1',
               torque: '3.8',
               frequency: '240',
               kickPoint: '先中調子'
             },
             {
               model: '250(SR)',
               length: '1136',
               weight: '49',
               tipDiameter: '8.55',
               buttDiameter: '15.15',
               torque: '3.8',
               frequency: '250',
               kickPoint: '先中調子'
             }
    ]
  }
];

function getProductById(id: string) {
  return products.find(product => product.id === id);
}

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const paths: Array<{ params: { product: string }; locale?: string }> = [];
  
  // 각 로케일(ko, ja)에 대해 경로 생성
  const allLocales = locales || ['ko', 'ja'];
  
  for (const locale of allLocales) {
    for (const product of products) {
      paths.push({
    params: { product: product.id },
        locale,
      });
    }
  }

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
