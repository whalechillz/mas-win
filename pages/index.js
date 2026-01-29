import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { formatBrandYearsTradition, BRAND_FOUNDED_YEAR } from '../lib/brand-utils';
import { getProductImageUrl } from '../lib/product-image-url';

export default function Home({ hostname, initialProducts = [] }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [footerExpanded, setFooterExpanded] = useState(false);
  const [driverMenuOpen, setDriverMenuOpen] = useState(false);
  const [products, setProducts] = useState(initialProducts);
  const [productsLoading, setProductsLoading] = useState(!initialProducts.length);
  
  // 퍼포먼스의 변화 섹션용 제품 이미지 데이터
  const [performanceImages, setPerformanceImages] = useState({
    'secret-force-gold-2-muziik': null,
    'secret-weapon-black-muziik': null,
    'secret-force-pro-3-muziik': null,
  });
  const [performanceImagesLoading, setPerformanceImagesLoading] = useState(true);

  // 히어로 섹션 PRO 3 MUZIIK 이미지 (제품 상세 페이지와 동일한 API에서 첫 이미지 사용)
  const defaultHeroPro3Url = getProductImageUrl('originals/products/secret-force-pro-3-muziik/detail/secret-force-pro-3-muziik-00.webp');
  const [heroPro3ImageUrl, setHeroPro3ImageUrl] = useState(defaultHeroPro3Url);

  useEffect(() => {
    const loadHeroPro3Image = async () => {
      try {
        const res = await fetch('/api/products/secret-force-pro-3-muziik');
        const json = await res.json();
        if (json.success && json.product?.detail_images?.length > 0) {
          setHeroPro3ImageUrl(getProductImageUrl(json.product.detail_images[0]));
        }
      } catch (error) {
        console.error('히어로 PRO3 MUZIIK 이미지 로드 실패:', error);
      }
    };
    loadHeroPro3Image();
  }, []);

  // 제품 데이터 로드 (데이터베이스에서)
  useEffect(() => {
    if (initialProducts.length === 0) {
      loadProductsFromDB();
    }
  }, []);

  // 퍼포먼스의 변화 섹션용 제품 이미지 로드
  useEffect(() => {
    const loadPerformanceImages = async () => {
      try {
        setPerformanceImagesLoading(true);
        const slugs = ['secret-force-gold-2-muziik', 'secret-weapon-black-muziik', 'secret-force-pro-3-muziik'];
        
        const imagePromises = slugs.map(async (slug) => {
          try {
            const res = await fetch(`/api/products/${slug}`);
            const json = await res.json();
            
            if (json.success && json.product) {
              if (Array.isArray(json.product.performance_images) && json.product.performance_images.length > 0) {
                const imageUrl = getProductImageUrl(json.product.performance_images[0]);
                return { slug, imageUrl };
              }
              // performance_images 없으면 detail_images 첫 장 fallback
              if (Array.isArray(json.product.detail_images) && json.product.detail_images.length > 0) {
                const imageUrl = getProductImageUrl(json.product.detail_images[0]);
                return { slug, imageUrl };
              }
            }
            return { slug, imageUrl: null };
          } catch (error) {
            console.error(`제품 이미지 로드 실패 (${slug}):`, error);
            return { slug, imageUrl: null };
          }
        });

        const results = await Promise.all(imagePromises);
        const imagesMap = {};
        const defaultPaths = {
          'secret-force-gold-2-muziik': 'originals/products/secret-force-gold-2-muziik/detail/massgoo_sf_gold2_muz_11.webp',
          'secret-weapon-black-muziik': 'originals/products/secret-weapon-black-muziik/detail/massgoo_sw_black_muz_11.webp',
          'secret-force-pro-3-muziik': 'originals/products/secret-force-pro-3-muziik/detail/secret-force-pro-3-muziik-00.webp',
        };
        results.forEach(({ slug, imageUrl }) => {
          imagesMap[slug] = imageUrl || (defaultPaths[slug] ? getProductImageUrl(defaultPaths[slug]) : null);
        });
        
        setPerformanceImages(imagesMap);
      } catch (error) {
        console.error('성능 이미지 로드 오류:', error);
      } finally {
        setPerformanceImagesLoading(false);
      }
    };

    loadPerformanceImages();
  }, []);

  // 제품별 기본 이미지 매핑 (fallback)
  const getDefaultImages = (slug) => {
    const defaultImageMap = {
      'secret-force-gold-2-muziik': [
        'originals/products/secret-force-gold-2-muziik/detail/massgoo_sf_gold2_muz_11.webp',
        'originals/products/secret-force-gold-2-muziik/detail/massgoo_sf_gold2_muz_01.webp',
      ],
      'secret-weapon-black-muziik': [
        'originals/products/secret-weapon-black-muziik/detail/massgoo_sw_black_muz_11.webp',
        'originals/products/secret-weapon-black-muziik/detail/massgoo_sw_black_muz_01.webp',
      ],
      'secret-force-pro-3-muziik': [
        'originals/products/secret-force-pro-3-muziik/detail/secret-force-pro-3-muziik-00.webp',
        'originals/products/secret-force-pro-3-muziik/detail/massgoo_pro3_beryl_240.webp',
      ],
      'secret-force-gold-2': [
        'originals/products/secret-force-gold-2/detail/secret-force-gold-2-gallery-01.webp',
        'originals/products/secret-force-gold-2/detail/secret-force-gold-2-gallery-02.webp',
      ],
      'secret-force-pro-3': [
        'originals/products/secret-force-pro-3/detail/secret-force-pro-3-gallery-00.webp',
        'originals/products/secret-force-pro-3/detail/secret-force-pro-3-gallery-01.webp',
      ],
      'secret-force-v3': [
        'originals/products/secret-force-v3/detail/secret-force-v3-gallery-05-00.webp',
        'originals/products/secret-force-v3/detail/secret-force-v3-gallery-02.webp',
      ],
      'secret-weapon-black': [
        'originals/products/secret-weapon-black/detail/secret-weapon-black-00.webp',
        'originals/products/secret-weapon-black/detail/secret-weapon-black-01.webp',
      ],
      'secret-weapon-gold-4-1': [
        'originals/products/secret-weapon-gold-4-1/detail/secret-weapon-gold-4-1-gallery-00-01.webp',
        'originals/products/secret-weapon-gold-4-1/detail/secret-weapon-gold-4-1-gallery-01.webp',
      ],
      // 기존 slug 호환성 유지
      'gold2-sapphire': [
        'originals/products/secret-force-gold-2-muziik/detail/massgoo_sf_gold2_muz_11.webp',
        'originals/products/secret-force-gold-2-muziik/detail/massgoo_sf_gold2_muz_01.webp',
      ],
      'black-beryl': [
        'originals/products/secret-weapon-black-muziik/detail/massgoo_sw_black_muz_11.webp',
        'originals/products/secret-weapon-black-muziik/detail/massgoo_sw_black_muz_01.webp',
      ],
      'pro3-muziik': [
        'originals/products/secret-force-pro-3-muziik/detail/secret-force-pro-3-muziik-00.webp',
        'originals/products/secret-force-pro-3-muziik/detail/massgoo_pro3_beryl_240.webp',
      ],
      'gold2': [
        'originals/products/secret-force-gold-2/detail/secret-force-gold-2-gallery-01.webp',
        'originals/products/secret-force-gold-2/detail/secret-force-gold-2-gallery-02.webp',
      ],
      'pro3': [
        'originals/products/secret-force-pro-3/detail/secret-force-pro-3-gallery-00.webp',
        'originals/products/secret-force-pro-3/detail/secret-force-pro-3-gallery-01.webp',
      ],
      'v3': [
        'originals/products/secret-force-v3/detail/secret-force-v3-gallery-05-00.webp',
        'originals/products/secret-force-v3/detail/secret-force-v3-gallery-02.webp',
      ],
      'black-weapon': [
        'originals/products/secret-weapon-black/detail/secret-weapon-black-00.webp',
        'originals/products/secret-weapon-black/detail/secret-weapon-black-01.webp',
      ],
      'gold-weapon4': [
        'originals/products/secret-weapon-gold-4-1/detail/secret-weapon-gold-4-1-gallery-00-01.webp',
        'originals/products/secret-weapon-gold-4-1/detail/secret-weapon-gold-4-1-gallery-01.webp',
      ],
    };
    return defaultImageMap[slug] || [];
  };

  const loadProductsFromDB = async () => {
    try {
      setProductsLoading(true);
      const res = await fetch('/api/products/drivers');
      const json = await res.json();
      if (json.success && json.products) {
        // 데이터베이스 제품을 페이지 형식으로 변환
        const formattedProducts = json.products.map((p) => {
          const slug = p.slug || `product-${p.id}`;
          const dbImages = Array.isArray(p.detail_images) && p.detail_images.length > 0
            ? p.detail_images.map(img => getProductImageUrl(img))
            : [];
          const fallbackImages = getDefaultImages(slug).map(img => getProductImageUrl(img));
          const images = dbImages.length > 0 ? dbImages : fallbackImages;
          
          return {
            id: slug,
            name: p.name,
            subtitle: p.subtitle || '',
            price: p.normal_price ? `${p.normal_price.toLocaleString()}원` : '',
            features: Array.isArray(p.features) ? p.features : [],
            images: images,
            badges: {
              left: p.badge_left || null,
              right: p.badge_right || null,
              leftColor: p.badge_left_color || null,
              rightColor: p.badge_right_color || null,
            },
            borderColor: p.border_color || null,
          };
        });
        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error('제품 로드 오류:', error);
      // 오류 시 기본 제품 데이터 사용 (fallback)
      setProducts([
    {
      id: 'secret-force-gold-2-muziik',
      name: '시크리트포스 골드 2 MUZIIK',
      subtitle: 'MUZIIK 협업 제품',
      price: '2,200,000원',
      features: ['오토플렉스 티타늄 샤프트', 'ONE-FLEX A200·A215', '무제한 2년 헤드 보증'],
      images: [
        'originals/products/secret-force-gold-2-muziik/detail/massgoo_sf_gold2_muz_11.webp',
        'originals/products/secret-force-gold-2-muziik/detail/massgoo_sf_gold2_muz_01.webp',
        'originals/products/secret-force-gold-2-muziik/detail/massgoo_sf_gold2_muz_12.webp',
        'originals/products/secret-force-gold-2-muziik/detail/massgoo_sf_gold2_muz_13.webp',
        'originals/products/secret-force-gold-2-muziik/detail/massgoo_sf_gold2_muz_14.webp',
        'originals/products/secret-force-gold-2-muziik/detail/massgoo_sf_gold2_muz_16.webp',
        'originals/products/secret-force-gold-2-muziik/detail/massgoo_sf_gold2_muz_17.webp',
        'originals/products/secret-force-gold-2-muziik/detail/massgoo_sf_gold2_muz_18.webp',
        'originals/products/secret-force-gold-2-muziik/detail/massgoo_sf_gold2_muz_22.webp',
        'originals/products/secret-force-gold-2-muziik/detail/massgoo_sf_gold2_muz_23.webp',
      ],
      badges: { left: 'NEW', right: 'BEST', leftColor: 'red', rightColor: 'yellow' },
      borderColor: 'yellow',
    },
    {
      id: 'secret-weapon-black-muziik',
      name: '시크리트웨폰 블랙 MUZIIK',
      subtitle: 'MUZIIK 협업 제품',
      price: '2,200,000원',
      features: ['풀 티타늄 4X 샤프트', '40g대, 최대 X 플렉스', '2년 헤드 보증(최대 3회)'],
      images: [
        'originals/products/secret-weapon-black-muziik/detail/massgoo_sw_black_muz_11.webp',
        'originals/products/secret-weapon-black-muziik/detail/massgoo_sw_black_muz_01.webp',
        'originals/products/secret-weapon-black-muziik/detail/massgoo_sw_black_muz_12.webp',
        'originals/products/secret-weapon-black-muziik/detail/massgoo_sw_black_muz_13.webp',
        'originals/products/secret-weapon-black-muziik/detail/massgoo_sw_black_muz_14_b.webp',
        'originals/products/secret-weapon-black-muziik/detail/massgoo_sw_black_muz_15.webp',
        'originals/products/secret-weapon-black-muziik/detail/massgoo_sw_black_muz_18.webp',
        'originals/products/secret-weapon-black-muziik/detail/massgoo_sw_black_muz_23.webp',
      ],
      badges: { left: 'NEW', right: 'LIMITED', leftColor: 'red', rightColor: 'green' },
      borderColor: 'green',
    },
    {
      id: 'secret-force-pro-3-muziik',
      name: '시크리트포스 PRO 3 MUZIIK',
      subtitle: 'MUZIIK 협업 제품',
      price: '1,700,000원',
      features: ['MUZIIK 샤프트', '사파이어, 베릴 샤프트 추가', '업그레이드된 고반발 드라이버'],
      images: [
        'originals/products/secret-force-pro-3-muziik/detail/secret-force-pro-3-muziik-00.webp',
        'originals/products/secret-force-pro-3-muziik/detail/massgoo_pro3_beryl_230.webp',
        'originals/products/secret-force-pro-3-muziik/detail/massgoo_pro3_beryl_240.webp',
        'originals/products/secret-force-pro-3-muziik/detail/massgoo_pro3_beryl_250.webp',
        'originals/products/secret-force-pro-3-muziik/detail/massgoo_pro3_sapphire_200.webp',
        'originals/products/secret-force-pro-3-muziik/detail/massgoo_pro3_sapphire_215.webp',
        'originals/products/secret-force-pro-3-muziik/detail/secret-force-pro-3-muziik-03.webp',
      ],
      badges: { left: 'NEW', right: null, leftColor: 'red', rightColor: null },
      borderColor: null,
    },
    {
      id: 'secret-force-gold-2',
      name: '시크리트포스 골드 2',
      subtitle: '프리미엄 드라이버',
      price: '1,700,000원',
      features: ['DAT55G+ Grade 5 티타늄', '2.2mm 초박형 페이스', 'COR 0.87'],
      images: [
        'originals/products/secret-force-gold-2/detail/secret-force-gold-2-gallery-01.webp',
        'originals/products/secret-force-gold-2/detail/secret-force-gold-2-gallery-02.webp',
        'originals/products/secret-force-gold-2/detail/secret-force-gold-2-gallery-03.webp',
        'originals/products/secret-force-gold-2/detail/secret-force-gold-2-gallery-04.webp',
        'originals/products/secret-force-gold-2/detail/secret-force-gold-2-gallery-05.webp',
        'originals/products/secret-force-gold-2/detail/secret-force-gold-2-gallery-06.webp',
        'originals/products/secret-force-gold-2/detail/secret-force-gold-2-gallery-07.webp',
        'originals/products/secret-force-gold-2/detail/secret-force-gold-2-gallery-08.webp',
        'originals/products/secret-force-gold-2/detail/secret-force-gold-2-gallery-09.webp',
      ],
      badges: { left: 'BEST', right: null, leftColor: 'yellow', rightColor: null },
      borderColor: 'yellow',
    },
    {
      id: 'secret-force-pro-3',
      name: '시크리트포스 PRO 3',
      subtitle: '고반발 드라이버',
      price: '1,150,000원',
      features: ['DAT55G 티타늄', '2.3mm 페이스', 'COR 0.86'],
      images: [
        'originals/products/secret-force-pro-3/detail/secret-force-pro-3-gallery-00.webp',
        'originals/products/secret-force-pro-3/detail/secret-force-pro-3-gallery-01.webp',
        'originals/products/secret-force-pro-3/detail/secret-force-pro-3-gallery-02.webp',
        'originals/products/secret-force-pro-3/detail/secret-force-pro-3-gallery-03.webp',
        'originals/products/secret-force-pro-3/detail/secret-force-pro-3-gallery-04.webp',
        'originals/products/secret-force-pro-3/detail/secret-force-pro-3-gallery-05.webp',
        'originals/products/secret-force-pro-3/detail/secret-force-pro-3-gallery-06.webp',
        'originals/products/secret-force-pro-3/detail/secret-force-pro-3-gallery-07.webp',
        'originals/products/secret-force-pro-3/detail/secret-force-pro-3-gallery-08.webp',
      ],
      badges: null,
      borderColor: null,
    },
    {
      id: 'secret-force-v3',
      name: '시크리트포스 V3',
      subtitle: '투어 드라이버',
      price: '950,000원',
      features: ['DAT55G 티타늄', '2.4mm 페이스', 'COR 0.85'],
      images: [
        'originals/products/secret-force-v3/detail/secret-force-v3-gallery-05-00.webp',
        'originals/products/secret-force-v3/detail/secret-force-v3-gallery-02.webp',
        'originals/products/secret-force-v3/detail/secret-force-v3-gallery-03.webp',
        'originals/products/secret-force-v3/detail/secret-force-v3-gallery-04.webp',
        'originals/products/secret-force-v3/detail/secret-force-v3-gallery-05.webp',
        'originals/products/secret-force-v3/detail/secret-force-v3-gallery-06.webp',
        'originals/products/secret-force-v3/detail/secret-force-v3-gallery-07.webp',
      ],
      badges: null,
      borderColor: null,
    },
    {
      id: 'secret-weapon-black',
      name: '시크리트웨폰 블랙',
      subtitle: '프리미엄 리미티드',
      price: '1,700,000원',
      features: ['SP700 Grade 5 티타늄', '2.2mm 초박형 페이스', 'COR 0.87'],
      images: [
        'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-00-01.webp',
        'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-01.webp',
        'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-02.webp',
        'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-03.webp',
        'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-04.webp',
        'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-05.webp',
        'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-06.webp',
        'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-07.webp',
        'originals/products/secret-weapon-black/detail/secret-weapon-black-gallery-08-01.webp',
      ],
      badges: { left: 'LIMITED', right: null, leftColor: 'purple', rightColor: null },
      borderColor: 'purple',
    },
    {
      id: 'secret-weapon-gold-4-1',
      name: '시크리트웨폰 골드 4.1',
      subtitle: '프리미엄 드라이버',
      price: '1,700,000원',
      features: ['SP700 Grade 5 티타늄', '2.2mm 초박형 페이스', 'COR 0.87'],
      images: [
        'originals/products/secret-weapon-gold-4-1/detail/secret-weapon-gold-4-1-gallery-00-01.webp',
        'originals/products/secret-weapon-gold-4-1/detail/secret-weapon-gold-4-1-gallery-01.webp',
        'originals/products/secret-weapon-gold-4-1/detail/secret-weapon-gold-4-1-gallery-02.webp',
        'originals/products/secret-weapon-gold-4-1/detail/secret-weapon-gold-4-1-gallery-03.webp',
        'originals/products/secret-weapon-gold-4-1/detail/secret-weapon-gold-4-1-gallery-04.webp',
        'originals/products/secret-weapon-gold-4-1/detail/secret-weapon-gold-4-1-gallery-05.webp',
        'originals/products/secret-weapon-gold-4-1/detail/secret-weapon-gold-4-1-gallery-06.webp',
        'originals/products/secret-weapon-gold-4-1/detail/secret-weapon-gold-4-1-gallery-07.webp',
        'originals/products/secret-weapon-gold-4-1/detail/secret-weapon-gold-4-1-gallery-08-01.webp',
      ],
      badges: null,
      borderColor: null,
    },
      ]);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleProductClick = (product) => {
    // 1,2,3번 제품은 각각의 제품 페이지로 이동
    if (product.id === 'secret-force-gold-2-muziik' || product.id === 'gold2-sapphire') {
      router.push('/products/secret-force-gold-2-muziik');
      return;
    }
    if (product.id === 'secret-weapon-black-muziik' || product.id === 'black-beryl') {
      router.push('/products/secret-weapon-black-muziik');
      return;
    }
    if (product.id === 'secret-force-pro-3-muziik' || product.id === 'pro3-muziik') {
      router.push('/products/secret-force-pro-3-muziik');
      return;
    }
    if (product.id === 'gold2') {
      // gold2 제품 페이지가 없으면 모달 표시
      setSelectedProduct(product);
      setSelectedImageIndex(0);
      return;
    }
    
    // 4,5,6,7번 제품은 모달로 표시 (기존 동작 유지)
    setSelectedProduct(product);
    setSelectedImageIndex(0);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setSelectedImageIndex(0);
  };

  return (
    <>
      <Head>
        <title>MASSGOO - 프리미엄 골프 클럽의 새로운 기준</title>
        <meta name="description" content="비거리 회복을 원하는 골퍼를 위한 특별한 선택, 2.2mm 초박형 페이스로 젊은 날의 비거리를 돌려드립니다." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="MASSGOO - 프리미엄 골프 클럽의 새로운 기준" />
        <meta property="og:description" content="비거리 회복을 원하는 골퍼를 위한 특별한 선택, 2.2mm 초박형 페이스로 젊은 날의 비거리를 돌려드립니다." />
        <meta property="og:image" content="https://www.masgolf.co.kr/main/hero/hero-main-image.webp" />
        <meta property="og:url" content="https://www.masgolf.co.kr" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MASSGOO" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MASSGOO - 프리미엄 골프 클럽의 새로운 기준" />
        <meta name="twitter:description" content="비거리 회복을 원하는 골퍼를 위한 특별한 선택, 2.2mm 초박형 페이스로 젊은 날의 비거리를 돌려드립니다." />
        <meta name="twitter:image" content="https://www.masgolf.co.kr/main/hero/hero-main-image.webp" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.masgolf.co.kr" />
      </Head>

      <main>
        {/* 헤더 네비게이션 */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center">
                <div className="relative h-8 w-auto max-w-[140px]">
                  <Image
                    src="/main/logo/massgoo_logo_black.png"
                    alt="MASSGOO 로고"
                    width={140}
                    height={32}
                    priority
                    className="h-8 w-auto object-contain max-w-full"
                  />
                  <div className="text-xl font-bold text-gray-900 hidden">MASSGOO</div>
                </div>
              </Link>
              <nav className="hidden md:flex space-x-8 items-center">
                {/* 드라이버 드롭다운 메뉴 */}
                <div 
                  className="relative"
                  onMouseEnter={() => setDriverMenuOpen(true)}
                  onMouseLeave={() => setDriverMenuOpen(false)}
                >
                  <button className="text-gray-700 hover:text-gray-900 flex items-center">
                    드라이버
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {driverMenuOpen && (
                    <div className="absolute top-full left-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      <Link 
                        href="/products/secret-weapon-black-muziik"
                        className="block px-4 pt-5 pb-3 hover:bg-gray-50 transition-colors"
                        onClick={() => setDriverMenuOpen(false)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">시크리트웨폰 블랙 MUZIIK</span>
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">LIMITED</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">MUZIIK 협업 제품</p>
                      </Link>
                      <Link 
                        href="/products/secret-force-gold-2-muziik"
                        className="block px-4 py-3 hover:bg-gray-50 transition-colors border-t border-gray-100"
                        onClick={() => setDriverMenuOpen(false)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">시크리트포스 골드 2 MUZIIK</span>
                          <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded">BEST</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">MUZIIK 협업 제품</p>
                      </Link>
                      <Link 
                        href="/products/secret-force-pro-3-muziik"
                        className="block px-4 py-3 hover:bg-gray-50 transition-colors border-t border-gray-100"
                        onClick={() => setDriverMenuOpen(false)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">시크리트포스 PRO 3 MUZIIK</span>
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">NEW</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">MUZIIK 협업 제품</p>
                      </Link>
                    </div>
                  )}
                </div>
                <Link href="/#technology" className="text-gray-700 hover:text-gray-900">기술력</Link>
                <Link href="/#reviews" className="text-gray-700 hover:text-gray-900">고객후기</Link>
                <Link href="/about" className="text-gray-700 hover:text-gray-900">브랜드 스토리</Link>
                <Link href="/blog" className="text-gray-700 hover:text-gray-900">골프 가이드</Link>
                <Link href="/contact" className="text-gray-700 hover:text-gray-900">시타매장</Link>
                <Link href="/try-a-massgoo" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                  무료 시타
                </Link>
              </nav>
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-700 hover:text-gray-900 transition-colors"
                  aria-label="메뉴 열기/닫기"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
              </div>
            </div>
            {/* 모바일 메뉴 */}
            {mobileMenuOpen && (
              <div className="md:hidden mt-4 pb-4">
                <nav className="flex flex-col space-y-2">
                  {/* 드라이버 서브메뉴 */}
                  <div>
                    <button
                      onClick={() => setDriverMenuOpen(!driverMenuOpen)}
                      className="w-full text-left text-gray-700 hover:text-gray-900 py-2 flex items-center justify-between"
                    >
                      <span>드라이버</span>
                      <svg 
                        className={`w-4 h-4 transition-transform ${driverMenuOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {driverMenuOpen && (
                      <div className="pl-4 mt-2 space-y-2 border-l-2 border-gray-200">
                        <Link 
                          href="/products/secret-weapon-black-muziik"
                          className="block py-2 text-gray-700 hover:text-gray-900"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setDriverMenuOpen(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">시크리트웨폰 블랙 MUZIIK</span>
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded ml-2">LIMITED</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">MUZIIK 협업 제품</p>
                        </Link>
                        <Link 
                          href="/products/secret-force-gold-2-muziik"
                          className="block py-2 text-gray-700 hover:text-gray-900"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setDriverMenuOpen(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">시크리트포스 골드 2 MUZIIK</span>
                            <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded ml-2">BEST</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">MUZIIK 협업 제품</p>
                        </Link>
                        <Link 
                          href="/products/secret-force-pro-3-muziik"
                          className="block py-2 text-gray-700 hover:text-gray-900"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setDriverMenuOpen(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">시크리트포스 PRO 3 MUZIIK</span>
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded ml-2">NEW</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">MUZIIK 협업 제품</p>
                        </Link>
                      </div>
                    )}
                  </div>
                  <Link href="/#technology" className="text-gray-700 hover:text-gray-900 py-2">기술력</Link>
                  <Link href="/#reviews" className="text-gray-700 hover:text-gray-900 py-2">고객후기</Link>
                  <Link href="/about" className="text-gray-700 hover:text-gray-900 py-2">브랜드 스토리</Link>
                  <Link href="/blog" className="text-gray-700 hover:text-gray-900 py-2">골프 가이드</Link>
                  <Link href="/contact" className="text-gray-700 hover:text-gray-900 py-2">시타매장</Link>
                  <Link href="/try-a-massgoo" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-center">
                    무료 시타
                  </Link>
                </nav>
              </div>
            )}
          </div>
        </header>

        {/* 히어로 섹션 */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 w-full h-full">
              <Image
                src="/main/hero/hero-main-image.webp"
                alt="MASSGOO 히어로 - 티타늄 원석"
                fill
                className="object-cover opacity-90"
                priority
                quality={90}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center">
            <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-3 mb-8">
              <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold">NEW</span>
              <div className="flex flex-row items-center justify-center gap-2 md:gap-3 text-blue-300">
                <div className="flex items-center">
                  <span className="text-xl md:text-2xl font-black text-blue-300 tracking-tight">美</span>
                  <span className="text-sm text-gray-300 ml-1">압도적인</span>
                </div>
                <span className="text-gray-500">|</span>
                <div className="flex items-center">
                  <span className="text-xl md:text-2xl font-black text-blue-300 tracking-tight">輝</span>
                  <span className="text-sm text-gray-300 ml-1">광채의</span>
                </div>
                <span className="text-gray-500">|</span>
                <div className="flex items-center">
                  <span className="text-xl md:text-2xl font-black text-blue-300 tracking-tight">若</span>
                  <span className="text-sm text-gray-300 ml-1">젊음</span>
                </div>
              </div>
            </div>
            <div className="text-blue-400 text-xl font-medium mb-8">MASSGOO X MUZIIK</div>
            <div className="space-y-6 mb-12">
              <h1 className="text-7xl md:text-9xl font-bold text-white leading-tight">MASSGOO</h1>
              <p className="text-gray-200 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed font-light">
                우아한 엔지니어링. 폭발적인 파워. 세대를 뛰어넘는 퍼포먼스.
              </p>
            </div>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link 
                href="/try-a-massgoo" 
                className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                  무료 시타 신청하기
                </Link>
              <Link 
                href="/#products"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all border-2 border-white/30 hover:border-white/50"
              >
                  제품 둘러보기
                </Link>
              </div>
            </div>
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
            <div className="animate-bounce">
              <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </section>

        {/* 제품 소개 섹션 */}
        <section className="py-16 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <Link
                  href="/products/secret-weapon-black-muziik"
                  className="relative aspect-square rounded-2xl overflow-hidden border-2 border-green-500/30 hover:border-green-400 transition-all block cursor-pointer group"
                >
                  <Image
                    src={getProductImageUrl('originals/products/secret-weapon-black-muziik/detail/massgoo_sw_black_muz_11.webp')}
                    alt="시크리트웨폰 블랙 MUZIIK"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">LIMITED</span>
                    <span className="bg-green-400/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">나노 카본 기술</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-bold mb-2">시크리트웨폰 블랙 MUZIIK</h3>
                    <p className="text-green-400 text-sm font-semibold">혁명적인 차세대 기술</p>
                  </div>
                </Link>
                <Link
                  href="/products/secret-force-gold-2-muziik"
                  className="relative aspect-square rounded-2xl overflow-hidden border-2 border-yellow-500/30 hover:border-yellow-400 transition-all block cursor-pointer group"
                >
                  <Image
                    src={getProductImageUrl('originals/products/secret-force-gold-2-muziik/detail/massgoo_sf_gold2_muz_11.webp')}
                    alt="시크리트포스 골드 2 MUZIIK"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">BEST</span>
                    <span className="bg-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-semibold">비거리 회복</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-bold mb-2">시크리트포스 골드 2 MUZIIK</h3>
                    <p className="text-yellow-400 text-sm font-semibold">검증된 성능, 안정적인 비거리</p>
                  </div>
                </Link>
                <Link
                  href="/products/secret-force-pro-3-muziik"
                  className="relative aspect-square rounded-2xl overflow-hidden border-2 border-red-500/30 hover:border-red-400 transition-all block cursor-pointer group"
                >
                  <Image
                    src={heroPro3ImageUrl}
                    alt="시크리트포스 PRO 3 MUZIIK"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    priority
                    onError={(e) => {
                      const target = e.target;
                      if (target) {
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-800"><span class="text-gray-400 text-sm">이미지 없음</span></div>';
                        }
                      }
                    }}
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">NEW</span>
                    <span className="bg-red-400/20 text-red-300 px-3 py-1 rounded-full text-xs font-semibold">업그레이드된 비거리</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-bold mb-2">시크리트포스 PRO 3 MUZIIK</h3>
                    <p className="text-red-400 text-sm font-semibold">업그레이드된 비거리 드라이버</p>
                  </div>
                </Link>
              </div>
              <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-700">
                <div className="grid md:grid-cols-3 gap-8">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">LIMITED</span>
                      <h3 className="text-2xl font-bold">시크리트웨폰 블랙 MUZIIK</h3>
                    </div>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-start">
                        <span className="text-green-400 text-xl mr-3">⚡</span>
                        <div>
                          <h4 className="font-semibold mb-1">최신 기술의 극한</h4>
                          <p className="text-gray-300 text-sm">40g대, 최대 X(Extra Stiff) 플렉스. 미래를 선도하는 성능</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-green-400 text-xl mr-3">🚀</span>
                        <div>
                          <h4 className="font-semibold mb-1">가벼움과 강함의 완벽한 조합</h4>
                          <p className="text-gray-300 text-sm">풀 티타늄 4X 샤프트로 실현하는 놀라운 비거리</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-green-400 text-xl mr-3">💎</span>
                        <div>
                          <h4 className="font-semibold mb-1">프리미엄 블랙 PVD 코팅</h4>
                          <p className="text-gray-300 text-sm">에메랄드 그린 베릴 샤프트와의 완벽한 조화</p>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/products/secret-weapon-black-muziik"
                      className="inline-block bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                    >
                      자세히 보기 →
                    </Link>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">BEST</span>
                      <h3 className="text-2xl font-bold">시크리트포스 골드 2 MUZIIK</h3>
                    </div>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-start">
                        <span className="text-yellow-400 text-xl mr-3">✓</span>
                        <div>
                          <h4 className="font-semibold mb-1">비거리 회복의 확실함</h4>
                          <p className="text-gray-300 text-sm">오토플렉스 기술로 실현하는 30m 이상 비거리 증가</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-yellow-400 text-xl mr-3">✓</span>
                        <div>
                          <h4 className="font-semibold mb-1">가벼우면서도 강한</h4>
                          <p className="text-gray-300 text-sm">ONE-FLEX A200·A215. 비거리 회복을 위한 최적화 설계</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-yellow-400 text-xl mr-3">✓</span>
                        <div>
                          <h4 className="font-semibold mb-1">무제한 2년 헤드 보증</h4>
                          <p className="text-gray-300 text-sm">신뢰할 수 있는 품질 보장</p>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/products/secret-force-gold-2-muziik"
                      className="inline-block bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                    >
                      자세히 보기 →
                    </Link>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">NEW</span>
                      <h3 className="text-2xl font-bold">시크리트포스 PRO 3 MUZIIK</h3>
                    </div>
                    <div className="space-y-4 mb-6">
                      <div className="flex items-start">
                        <span className="text-red-400 text-xl mr-3">⚡</span>
                        <div>
                          <h4 className="font-semibold mb-1">MUZIIK 샤프트 추가</h4>
                          <p className="text-gray-300 text-sm">사파이어, 베릴 샤프트를 추가하여 더 강하고 가벼운 성능을 실현</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-red-400 text-xl mr-3">🚀</span>
                        <div>
                          <h4 className="font-semibold mb-1">40g대 X/S 대응</h4>
                          <p className="text-gray-300 text-sm">30g대 R 대응 기술력을 자랑하는 가벼우면서도 강한 샤프트</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-red-400 text-xl mr-3">💎</span>
                        <div>
                          <h4 className="font-semibold mb-1">업그레이드된 성능</h4>
                          <p className="text-gray-300 text-sm">PRO3의 한계를 넘어서 더 강하고 더 가벼운 티타늄 샤프트 사용</p>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/products/secret-force-pro-3-muziik"
                      className="inline-block bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                    >
                      자세히 보기 →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 혁신적인 테크놀로지 섹션 */}
        <section id="technology" className="py-16 bg-black text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-6">혁신적인 테크놀로지</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                MUZIIK 독자 기술이 실현하는, 골프 샤프트의 새로운 가능성.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
                <div className="aspect-video rounded-lg overflow-hidden mb-6 bg-gray-800 flex items-center justify-center">
                  <Image
                    src="/main/technology/nano-resin-structure.webp"
                    alt="나노 수지 구조"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">나노레벨 수지 채택</h3>
                <p className="text-gray-300 mb-4">
                  수지 함유율을 감소시키고 카본 밀도를 높여 반발성과 타감의 향상을 실현합니다.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    수지 함유율 감소
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    카본 밀도 향상
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    반발성 향상
                  </li>
                </ul>
              </div>
              <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
                <div className="aspect-video rounded-lg overflow-hidden mb-6 bg-gray-800 flex items-center justify-center">
                  <Image
                    src="/main/technology/reverse-torque-prevention.webp"
                    alt="역토크 방지"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">임팩트시 역토크 방지</h3>
                <p className="text-gray-300 mb-4">
                  경량 샤프트 특유의 역토크를 억제하여 헤드의 직진성과 방향성을 향상시킵니다.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    역토크 발생 감소
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    헤드 스피드 향상
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    방향성 안정
                  </li>
                </ul>
              </div>
              <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
                <div className="aspect-video rounded-lg overflow-hidden mb-6 bg-gray-800 flex items-center justify-center">
                  <Image
                    src="/main/technology/titanium-graphite-structure.webp"
                    alt="티타늄 그라파이트 구조"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">티타늄 그라파이트 사용</h3>
                <p className="text-gray-300 mb-4">
                  경량이면서도 전장 제작으로 초고탄성을 실현. 휨 복원과 임팩트시 안정감을 양립합니다.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    전장 티타늄 파이버 사용
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    경량성 유지
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    초고탄성 실현
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    임팩트시 안정감
                  </li>
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 text-center">
                <div className="text-4xl mb-4">🔧</div>
                <h3 className="text-xl font-bold text-white mb-3">알루미늄 IP 처리</h3>
                <p className="text-gray-300 text-sm">표면 경도를 높여 내구성과 고급스러운 외관을 제공합니다</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 text-center">
                <div className="text-4xl mb-4">💎</div>
                <h3 className="text-xl font-bold text-white mb-3">고탄성(65t) 카본 시트</h3>
                <p className="text-gray-300 text-sm">65톤 고탄성 카본 시트를 사용하여 뛰어난 복원력과 안정적인 타구감을 선사합니다</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-white mb-3">더블킥 포인트</h3>
                <p className="text-gray-300 text-sm">두 개의 킥 포인트를 통해 헤드 스피드를 극대화하고 비거리를 향상시킵니다</p>
              </div>
            </div>
          </div>
        </section>

        {/* 페이스 두께의 비밀 섹션 */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">페이스 두께의 비밀</h2>
            <p className="text-center text-gray-600 mb-12">일반 드라이버보다 33.33% 얇은 2.2mm 티타늄 페이스</p>
            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              <div className="relative">
                <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src="/main/products/titanium_club_face_1200x800.jpg"
                    alt="2.2mm 티타늄 클럽 페이스"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-6xl font-bold mb-4">2.2mm</div>
                      <div className="text-xl">티타늄 페이스</div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-6">티타늄 소재의 차이</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="text-yellow-600 text-xl mr-3 mt-1">✓</div>
                    <div>
                      <h4 className="font-semibold">DAT55G+ Grade 5 (시크리트포스 골드 2 MUZIIK)</h4>
                      <p className="text-gray-600">최고급 항공우주용 티타늄. 오토플렉스 사파이어 샤프트와 결합하여 최상의 탄성과 내구성 실현</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-green-600 text-xl mr-3 mt-1">✓</div>
                    <div>
                      <h4 className="font-semibold">SP700 Grade 5 (시크리트웨폰 블랙 MUZIIK)</h4>
                      <p className="text-gray-600">특수 가공 티타늄. 블랙 PVD 코팅과 에메랄드 그린 베릴 샤프트의 완벽한 조합</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-gray-600 text-xl mr-3 mt-1">✓</div>
                    <div>
                      <h4 className="font-semibold">DAT55G (시크리트포스 PRO 3, V3)</h4>
                      <p className="text-gray-600">고강도 티타늄. 안정적인 성능과 내구성으로 일반 골퍼에게 최적</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <p className="text-lg italic text-gray-700 mb-4">"한 번의 시타로 30m 비거리 증가를 직접 체험하세요"</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 프리미엄 드라이버 컬렉션 섹션 */}
        <section id="products" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">프리미엄 드라이버 컬렉션</h2>
            <p className="text-center text-gray-600 mb-12">엄격한 품질관리로 한정 생산되는 특별한 선택</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {productsLoading ? (
                <div className="col-span-full text-center py-10 text-gray-500">
                  제품을 불러오는 중...
                </div>
              ) : products.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-500">
                  등록된 제품이 없습니다.
                </div>
              ) : (
                products.map((product) => {
                let borderClass = '';
                if (product.borderColor === 'yellow') {
                  borderClass = 'border-2 border-yellow-400';
                } else if (product.borderColor === 'green') {
                  borderClass = 'border-2 border-green-400';
                } else if (product.borderColor === 'purple') {
                  borderClass = 'border-2 border-purple-400';
                }
                
                const badgeLeftClass = product.badges?.leftColor === 'red' ? 'bg-red-600 text-white' : 
                                      product.badges?.leftColor === 'yellow' ? 'bg-yellow-400 text-black' : 
                                      product.badges?.leftColor === 'purple' ? 'bg-purple-400 text-white' : '';
                const badgeRightClass = product.badges?.rightColor === 'green' ? 'bg-green-400 text-white' : 
                                       product.badges?.rightColor === 'yellow' ? 'bg-yellow-400 text-black' : '';
                
                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className={`bg-white rounded-lg shadow-lg overflow-hidden ${borderClass} cursor-pointer hover:shadow-2xl transition-all`}
              >
                <div className="relative min-h-80 md:h-72 bg-gray-200">
                    {product.images && product.images.length > 0 && product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                        priority={product.id === 'secret-force-gold-2-muziik' || product.id === 'secret-weapon-black-muziik' || product.id === 'gold2-sapphire' || product.id === 'black-beryl'}
                        onError={(e) => {
                          console.error('이미지 로드 실패:', product.images[0], product.name);
                          const target = e.target;
                          if (target) {
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-gray-400 text-sm">이미지 없음</span></div>';
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm">이미지 없음</span>
                      </div>
                    )}
                      {product.badges?.left && (
                        <div className={`absolute top-2 left-2 ${badgeLeftClass} px-2 py-1 rounded text-sm font-bold`}>
                          {product.badges.left}
                </div>
                      )}
                      {product.badges?.right && (
                        <div className={`absolute top-2 right-2 ${badgeRightClass} px-2 py-1 rounded text-sm font-bold`}>
                          {product.badges.right}
                </div>
                      )}
                </div>
                <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{product.subtitle}</p>
                      <p className="text-xl font-bold text-red-600 mb-3">{product.price}</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                        {product.features.map((feature, index) => (
                          <li key={index}>• {feature}</li>
                        ))}
                  </ul>
                </div>
              </div>
                );
              })
              )}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/try-a-massgoo"
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                무료 시타 신청하기
              </Link>
            </div>
          </div>
        </section>

        {/* 퍼포먼스의 변화 섹션 */}
        <section id="reviews" className="py-20 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-green-400 to-green-600 rounded-full blur-3xl"></div>
            </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                퍼포먼스의 변화
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">기술이 만드는 새로운 가능성</p>
              </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              <Link 
                href="/products/secret-force-gold-2-muziik#performance-data"
                className="group relative bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-yellow-300 cursor-pointer"
              >
                <div className="relative min-h-80 md:h-96 overflow-hidden bg-gradient-to-br from-yellow-50 to-white">
                  {performanceImagesLoading || !performanceImages['secret-force-gold-2-muziik'] ? (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-500 text-sm">이미지 로딩 중...</p>
                    </div>
                  ) : (
                    <div className="absolute inset-0">
                      <Image
                        src={performanceImages['secret-force-gold-2-muziik']}
                        alt="김성호 대표"
                        fill
                        className="object-contain md:object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          const target = e.target;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent"></div>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">시크리트포스 골드 2 MUZIIK</span>
                  </div>
                  <div className="absolute bottom-4 right-4 z-10 text-right">
                    <div className="text-3xl font-black text-green-600 mb-1">+25m</div>
                    <div className="text-xs text-gray-600 font-semibold">비거리 증가</div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-1">김성호 대표</h3>
                  <p className="text-sm text-gray-500 mb-4">62세</p>
                  <p className="text-gray-700 text-sm leading-relaxed italic">
                    "오토플렉스 사파이어 샤프트와 결합한 골드 2를 처음 사용했을 때 놀랐습니다. 첫 시타부터 체감되는 비거리 증가가 있었고, 이제 젊은 후배들과 비거리 차이가 거의 없습니다."
                  </p>
                </div>
              </Link>
              <Link 
                href="/products/secret-weapon-black-muziik#performance-data"
                className="group relative bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-800 hover:border-green-400 cursor-pointer"
              >
                <div className="relative min-h-80 md:h-96 overflow-hidden">
                  {performanceImagesLoading || !performanceImages['secret-weapon-black-muziik'] ? (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                      <p className="text-gray-400 text-sm">이미지 로딩 중...</p>
                    </div>
                  ) : (
                    <div className="absolute inset-0">
                      <Image
                        src={performanceImages['secret-weapon-black-muziik']}
                        alt="이재민 회장"
                        fill
                        className="object-contain md:object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          const target = e.target;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">시크리트웨폰 블랙 MUZIIK</span>
                  </div>
                  <div className="absolute bottom-4 right-4 z-10 text-right">
                    <div className="text-3xl font-black text-green-400 mb-1">+32m</div>
                    <div className="text-xs text-gray-400 font-semibold">비거리 증가</div>
                  </div>
                </div>
                <div className="p-6 text-white">
                  <h3 className="text-lg font-bold mb-1">이재민 회장</h3>
                  <p className="text-sm text-gray-400 mb-4">55세</p>
                  <p className="text-gray-300 text-sm leading-relaxed italic">
                    "풀 티타늄 4X 샤프트의 시크리트웨폰 블랙을 사용하면서 정말 놀랐습니다. 40g대의 가벼움과 강함이 동시에 가능한 혁신적인 제품이에요."
                  </p>
                </div>
              </Link>
              <Link 
                href="/products/secret-force-pro-3-muziik#performance-data"
                className="group relative bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-300 cursor-pointer"
              >
                <div className="relative min-h-80 md:h-96 overflow-hidden bg-gradient-to-br from-blue-50 to-white">
                  {performanceImagesLoading || !performanceImages['secret-force-pro-3-muziik'] ? (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                      <p className="text-gray-500 text-sm">이미지 로딩 중...</p>
                    </div>
                  ) : (
                    <div className="absolute inset-0">
                      <Image
                        src={performanceImages['secret-force-pro-3-muziik']}
                        alt="박준영 원장"
                        fill
                        className="object-contain md:object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          const target = e.target;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent"></div>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">시크리트포스 PRO3 MUZIIK</span>
                  </div>
                  <div className="absolute bottom-4 right-4 z-10 text-right">
                    <div className="text-3xl font-black text-green-600 mb-1">+22m</div>
                    <div className="text-xs text-gray-600 font-semibold">비거리 증가</div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-1">박준영 원장</h3>
                  <p className="text-sm text-gray-500 mb-4">58세</p>
                  <p className="text-gray-700 text-sm leading-relaxed italic">
                    "스윙 스피드가 예전 같지 않아 포기하고 있었는데, MASSGOO 드라이버로 바꾸니 젊은 시절 비거리가 다시 나옵니다. 골프가 다시 재미있어졌어요."
                  </p>
                </div>
              </Link>
            </div>
            <div className="text-center mt-12">
              <p className="text-lg mb-4 text-gray-700">지금 무료 시타를 신청하고 직접 경험해보세요</p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link
                  href="/try-a-massgoo"
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  무료 시타 신청하기
                </Link>
                <Link
                  href="/contact"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  시타매장
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 문의하기 섹션 */}
        <section id="contact" className="py-16 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-4">문의하기</h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                MASSGOO 전문가가 직접 답변해 드립니다.<br />
                고급스러운 문의 페이지에서 편리하게 문의하세요.
              </p>
              <Link 
                href="/contact"
                className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
              >
                문의 페이지로 이동 →
              </Link>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="bg-gray-900 text-white">
          <div className="container mx-auto px-4">
            {/* 통합 신뢰도 섹션 - 한 줄 (아이콘만) */}
            <div className="py-6 border-b border-gray-800">
              <div className="flex items-center justify-center gap-4 text-gray-500">
                {/* 다른 브랜드 보기 */}
                <div className="flex items-center gap-2">
                  <Link 
                    href="/" 
                    className="opacity-50 hover:opacity-100 transition-opacity"
                    title="MASSGOO 드라이버"
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
                    title="MUZIIK 샤프트"
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
                  title="SSL 보안 인증"
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
                  title="프리미엄 품질"
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
                  title="MASSGOO 공식몰"
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
                  title="네이버 스마트스토어"
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
              <span>회사 정보</span>
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
                  {/* MASSGOO 브랜드 정보 */}
              <div>
                    <div className="mb-4">
                  <div className="relative h-10 w-auto max-w-[140px] mb-4">
                    <Image
                      src="/main/logo/massgoo_logo_white.png"
                      alt="MASSGOO 로고"
                      width={140}
                      height={40}
                      className="h-10 w-auto object-contain max-w-full"
                    />
                  </div>
                      <p className="text-sm text-gray-400 mb-4">MASGOLF® 프리미엄 드라이버 브랜드</p>
                      <p className="text-gray-300 mb-4 leading-relaxed">
                        {`MASGOLF는 ${BRAND_FOUNDED_YEAR}년부터 당신의 골프 여정에 함께해 왔습니다. MASSGOO는 MASGOLF의 프리미엄 드라이버 브랜드입니다. ${formatBrandYearsTradition()}의 기술력으로 만든 혁신적인 드라이버 브랜드로, 나노레벨 카본 기술을 추구하는 골퍼부터 비거리 회복을 원하는 골퍼까지, 모든 골퍼에게 특별한 퍼포먼스를 제공합니다.`}
                </p>
                    </div>
                    <div className="space-y-2">
                  <p>사업자명: MASGOLF® | 대표자명: 김탁수</p>
                  <p>사업자등록번호: 877-07-00641</p>
                  <p>통신판매업신고번호: 제 2017-수원영통-0623호</p>
                  <p>상표권 등록일: 2003-07-31</p>
                </div>
              </div>

              {/* 시타 센터 정보 */}
              <div>
                    <h4 className="font-bold mb-4 text-white">시타 센터</h4>
                    <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">주소</p>
                    <p className="text-sm">수원시 영통구 법조로 149번길 200</p>
                    <p className="text-sm text-yellow-400">(광교 갤러리아에서 차량 5분)</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">연락처</p>
                    <p className="text-sm">방문 상담 예약: 031-215-0013</p>
                    <p className="text-sm">비거리 상담: 080-028-8888 (무료)</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">영업시간</p>
                    <p className="text-sm">월-금 09:00 - 18:00</p>
                    <p className="text-sm text-yellow-400">주말은 예약제로 운영합니다</p>
                  </div>
                </div>
              </div>

                  {/* 연락처 정보 */}
              <div>
                    <h4 className="font-bold mb-4 text-white">연락처</h4>
                    <div className="space-y-2">
                  <div>
                    <p className="font-medium mb-2">이메일</p>
                    <p className="text-sm">hello@masgolf.co.kr</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">웹사이트</p>
                        <p className="text-sm">www.mas9golf.com</p>
                        <p className="text-sm">www.masgolf.co.kr</p>
                    </div>
                      <div className="mt-4">
                        <Link
                          href="/about"
                          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          브랜드 스토리 →
                        </Link>
                  </div>
                      <div className="mt-2">
                        <Link
                          href="/try-a-massgoo"
                          className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                      무료 시타 신청 +30m 비거리
                    </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 저작권 정보 */}
            <div className="py-4 text-center text-xs text-gray-500 border-t border-gray-800">
                  <p>© 2025 MASGOLF All Rights Reserved.</p>
                </div>
              </div>
        </footer>

        {/* 제품 모달 */}
        {selectedProduct && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <div
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 닫기 버튼 */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* 모달 내용 */}
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">{selectedProduct.name}</h2>
                
                {/* 메인 이미지 */}
                <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={selectedProduct.images[selectedImageIndex]}
                    alt={selectedProduct.name}
                    fill
                    className="object-contain"
                  />
            </div>

                {/* 썸네일 이미지 갤러리 (여러 이미지가 있는 경우만) */}
                {selectedProduct.images.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto pb-2 mb-4">
                    {selectedProduct.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === index
                            ? 'border-red-600'
                            : 'border-gray-300 hover:border-gray-400'
                        } transition-colors`}
                      >
                        <Image
                          src={image}
                          alt={`${selectedProduct.name} 이미지 ${index + 1}`}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
    </div>
                )}

                {/* 제품 정보 */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{selectedProduct.subtitle}</p>
                    <p className="text-2xl font-bold text-red-600 mb-3">{selectedProduct.price}</p>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {selectedProduct.features.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
