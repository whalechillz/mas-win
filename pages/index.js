import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>MASGOLF - 프리미엄 골프 클럽의 새로운 기준</title>
        <meta name="description" content="시니어 골퍼를 위한 특별한 선택, 2.2mm 초박형 페이스로 젊은 날의 비거리를 돌려드립니다." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        {/* 8월 퍼널 배너 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 text-center">
          <div className="container mx-auto flex justify-between items-center">
            <span className="text-sm">8월 한정 특별 혜택</span>
            <span className="text-sm font-bold">13일 15시간 남음</span>
            <span className="text-sm">무료 상담: 080-028-8888</span>
          </div>
        </div>

        {/* 히어로 섹션 */}
        <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                시니어 골퍼를 위한 특별한 선택
              </h1>
              <h2 className="text-3xl md:text-5xl font-bold text-yellow-400 mb-4">
                나이가 들수록 비거리는<br />
                더 멀리 나가야 합니다
              </h2>
              <p className="text-xl mb-8">
                스윙 스피드가 느려져도 괜찮습니다<br />
                초박형 2.2mm 페이스가 젊은 날의 비거리를 돌려드립니다
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link href="/25-08" className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  무료 시타 신청하기
                </Link>
                <Link href="#products" className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-semibold transition-colors">
                  제품 둘러보기
                </Link>
              </div>
            </div>
            <p className="text-center text-lg">
              50대, 60대, 70대... 나이는 숫자에 불과합니다
            </p>
          </div>
        </section>

        {/* MASGOLF의 차별점 */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">MASGOLF의 차별점</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold mb-2">R&A 공식 비공인</h3>
                <p className="text-gray-600">영국 왕립 골프협회가 경계할 정도로 강력한 반발력</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">💪</div>
                <h3 className="text-xl font-semibold mb-2">시니어 최적화 설계</h3>
                <p className="text-gray-600">느려진 스윙에도 최대 반발력을 내는 2.2mm 초박형 페이스</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold mb-2">즉각적인 비거리 회복</h3>
                <p className="text-gray-600">첫 시타부터 체감하는 30m 이상의 비거리 증가</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">💎</div>
                <h3 className="text-xl font-semibold mb-2">일본 장인정신</h3>
                <p className="text-gray-600">40년 전통 골프스튜디오에서 한정 제작</p>
              </div>
            </div>
          </div>
        </section>

        {/* 제품 소개 */}
        <section id="products" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">고반발 드라이버 컬렉션</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative h-64">
                  <picture>
                    <source srcSet="/main/products/secret-force-gold-2.webp" type="image/webp" />
                    <Image
                      src="/main/products/secret-force-gold-2.jpg"
                      alt="시크릿포스 GOLD 2"
                      fill
                      className="object-cover"
                      priority
                    />
                  </picture>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">시크릿포스 GOLD 2</h3>
                  <p className="text-2xl font-bold text-red-600 mb-2">1,700,000원</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• DAT55G+ Grade 5 티타늄</li>
                    <li>• 2.2mm 초박형 페이스</li>
                    <li>• COR 0.87</li>
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative h-64">
                  <picture>
                    <source srcSet="/main/products/secret-force-pro3.webp" type="image/webp" />
                    <Image
                      src="/main/products/secret-force-pro3.jpg"
                      alt="시크릿포스 PRO 3"
                      fill
                      className="object-cover"
                    />
                  </picture>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">시크릿포스 PRO 3</h3>
                  <p className="text-2xl font-bold text-red-600 mb-2">1,150,000원</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• DAT55G 티타늄</li>
                    <li>• 2.3mm 페이스</li>
                    <li>• COR 0.86</li>
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative h-64">
                  <picture>
                    <source srcSet="/main/products/secret-force-v3.webp" type="image/webp" />
                    <Image
                      src="/main/products/secret-force-v3.jpg"
                      alt="시크릿포스 V3"
                      fill
                      className="object-cover"
                    />
                  </picture>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">시크릿포스 V3</h3>
                  <p className="text-2xl font-bold text-red-600 mb-2">950,000원</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• DAT55G 티타늄</li>
                    <li>• 2.4mm 페이스</li>
                    <li>• COR 0.85</li>
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative h-64">
                  <picture>
                    <source srcSet="/main/products/secret-weapon-black.webp" type="image/webp" />
                    <Image
                      src="/main/products/secret-weapon-black.jpg"
                      alt="시크릿웨폰 블랙"
                      fill
                      className="object-cover"
                    />
                  </picture>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">시크릿웨폰 블랙</h3>
                  <p className="text-2xl font-bold text-red-600 mb-2">1,700,000원</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• SP700 Grade 5 티타늄</li>
                    <li>• 2.2mm 초박형 페이스</li>
                    <li>• COR 0.87</li>
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative h-64">
                  <picture>
                    <source srcSet="/main/products/secret-weapon-4-1.webp" type="image/webp" />
                    <Image
                      src="/main/products/secret-weapon-4-1.jpg"
                      alt="시크릿웨폰 4.1"
                      fill
                      className="object-cover"
                    />
                  </picture>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">시크릿웨폰 4.1</h3>
                  <p className="text-2xl font-bold text-red-600 mb-2">1,150,000원</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• SP700 Grade 5 티타늄</li>
                    <li>• 2.2mm 초박형 페이스</li>
                    <li>• COR 0.87</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 고객 후기 */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">시니어 골퍼들의 생생한 후기</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <picture>
                    <source srcSet="/main/testimonials/golfer_avatar_01.webp" type="image/webp" />
                    <Image
                      src="/main/testimonials/golfer_avatar_512x512_01.jpg"
                      alt="김성호 대표"
                      fill
                      className="rounded-full object-cover"
                    />
                  </picture>
                </div>
                <h3 className="text-xl font-semibold mb-2">김성호 대표 (62세)</h3>
                <p className="text-2xl font-bold text-green-600 mb-4">+35m 비거리 증가</p>
                <p className="text-gray-600">"나이 들면서 비거리가 계속 줄어 고민이었는데, 이제 젊은 후배들과 비거리 차이가 거의 안 납니다."</p>
              </div>
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <picture>
                    <source srcSet="/main/testimonials/golfer_avatar_02.webp" type="image/webp" />
                    <Image
                      src="/main/testimonials/golfer_avatar_512x512_02.jpg"
                      alt="이재민 회장"
                      fill
                      className="rounded-full object-cover"
                    />
                  </picture>
                </div>
                <h3 className="text-xl font-semibold mb-2">이재민 회장 (58세)</h3>
                <p className="text-2xl font-bold text-green-600 mb-4">+28m 비거리 증가</p>
                <p className="text-gray-600">"예전엔 파5홀에서 3온이 힘들었는데, 지금은 편하게 2온 합니다."</p>
              </div>
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <picture>
                    <source srcSet="/main/testimonials/golfer_avatar_03.webp" type="image/webp" />
                    <Image
                      src="/main/testimonials/golfer_avatar_512x512_03.jpg"
                      alt="박준영 원장"
                      fill
                      className="rounded-full object-cover"
                    />
                  </picture>
                </div>
                <h3 className="text-xl font-semibold mb-2">박준영 원장 (65세)</h3>
                <p className="text-2xl font-bold text-green-600 mb-4">+32m 비거리 증가</p>
                <p className="text-gray-600">"스윙 스피드가 예전 같지 않아 포기하고 있었는데, 고반발 드라이버로 바꾸니 젊은 시절 비거리가 다시 나옵니다."</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="py-16 bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">지금 무료 시타를 신청하고 직접 경험해보세요</h2>
            <Link href="/25-08" className="bg-white text-red-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors inline-block">
              무료 시타 신청하기
            </Link>
          </div>
        </section>
      </main>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .container {
            padding: 0 1rem;
          }
        }
      `}</style>
    </>
  );
}