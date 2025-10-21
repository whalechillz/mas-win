import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

export default function MuziikKoreanHome() {
  return (
    <>
      <Head>
        <title>MUZIIK - DOGATTI GENERATION 샤프트</title>
        <meta name="description" content="DOGATTI GENERATION 샤프트 - 일본제 프리미엄 골프 샤프트의 최고봉. 티타늄 파이버 기술로 초고속 반발력과 헤드 안정성을 실현합니다." />
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

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                MUZIIK
              </h1>
              <h2 className="text-2xl md:text-3xl text-blue-400 mb-8">
                DOGATTI GENERATION 샤프트
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                일본제 프리미엄 골프 샤프트의 최고봉.<br />
                티타늄 파이버 기술로 초고속 반발력과 헤드 안정성을 실현하는<br />
                혁신적인 샤프트 테크놀로지를 제공합니다.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-white mb-12">
              MUZIIK의 특징
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold text-white mb-2">초고속 반발력</h3>
                <p className="text-gray-400">
                  티타늄 파이버 기술로 혁신적인 반발 성능을 구현하여 최대한의 볼 스피드를 실현합니다
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-white mb-2">헤드 안정성</h3>
                <p className="text-gray-400">
                  오프센터 시 헤드 흔들림을 억제하여 정확한 샷을 지원합니다
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🇯🇵</div>
                <h3 className="text-xl font-semibold text-white mb-2">일본제 품질</h3>
                <p className="text-gray-400">
                  40년 전통과 최신 기술을 융합한 최고 품질의 샤프트 제조
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-16 bg-black">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-white mb-12">
              제품 라인업
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              
              {/* Sapphire Product Card */}
              <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                <div className="relative h-64 bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💎</div>
                    <h3 className="text-2xl font-bold text-white">Sapphire</h3>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      NEW
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    DOGATTI GENERATION Sapphire Auto-flex
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    DOGATTI GENERATION Sapphire Auto-flex
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    초고속의 반발력과 헤드 안정성을 실현하는, MUZIIK 독자적인 티타늄 파이버 기술을 채택한 프리미엄 샤프트.
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="text-white font-semibold mb-2">주요 특징:</h4>
                    <ul className="space-y-1">
                      <li className="text-gray-400 text-sm flex items-center">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                        티타늄 파이버 기술로 초고속 반발력
                      </li>
                      <li className="text-gray-400 text-sm flex items-center">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                        헤드 안정성 향상
                      </li>
                      <li className="text-gray-400 text-sm flex items-center">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                        자동적인 오토플렉스 타입
                      </li>
                    </ul>
                  </div>
                  
                  <Link 
                    href="/muziik/ko/sapphire"
                    className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    자세히 보기
                  </Link>
                </div>
              </div>

              {/* Beryl Product Card */}
              <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                <div className="relative h-64 bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💚</div>
                    <h3 className="text-2xl font-bold text-white">Beryl</h3>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      NEW
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    DOGATTI GENERATION Beryl
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    DOGATTI GENERATION Beryl
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    고탄성 카본 시트와 티타늄 파이버를 조합한, 아름다움과 성능을 겸비한 프리미엄 샤프트.
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="text-white font-semibold mb-2">주요 특징:</h4>
                    <ul className="space-y-1">
                      <li className="text-gray-400 text-sm flex items-center">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                        고탄성(65t) 카본 시트 사용
                      </li>
                      <li className="text-gray-400 text-sm flex items-center">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                        티타늄 파이버로 인장 강도 향상
                      </li>
                      <li className="text-gray-400 text-sm flex items-center">
                        <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                        아름다운 알루미늄 IP 처리
                      </li>
                    </ul>
                  </div>
                  
                  <Link 
                    href="/muziik/ko/beryl"
                    className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    자세히 보기
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-8">
                혁신적인 테크놀로지
              </h2>
              <div className="grid md:grid-cols-2 gap-8 text-left">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    티타늄 파이버 기술
                  </h3>
                  <p className="text-gray-300">
                    샤프트 전체에 티타늄 파이버를 사용하여 인장 강도를 향상시키고 반발성을 높입니다. 강인함과 큰 반발이 높은 탄도를 실현합니다.
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    오토플렉스 설계
                  </h3>
                  <p className="text-gray-300">
                    헤드 스피드에 관계없이 다양한 골퍼에게 적합한 자동적인 오토플렉스 타입. 백스윙부터 임팩트까지 안정된 퍼포먼스를 제공합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              문의하기
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              자세한 정보나 커스텀 오더에 대해서는 언제든지 문의해 주세요.<br />
              전문 스태프가 고객님의 니즈에 최적한 샤프트를 제안해 드립니다.
            </p>
            <a 
              href="mailto:massgoogolf@gmail.com"
              className="inline-block bg-white text-blue-900 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
            >
              문의하기
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 py-8">
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
