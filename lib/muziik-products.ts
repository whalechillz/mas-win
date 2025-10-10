export interface Product {
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
}

export const products: Product[] = [
  {
    id: 'sapphire',
    name: 'DOGATTI GENERATION Sapphire one-flex',
    nameEn: 'DOGATTI GENERATION Sapphire one-flex',
    description: '超高速の反発力とヘッド安定性を実現する、MUZIIK独自のチタンファイバー技術を採用したプレミアムシャフト。',
    mainImage: '/muziik/sapphire/main.jpg',
    shaftImage: '/muziik/sapphire/shaft.jpg',
    chartImage: '/muziik/sapphire/chart.jpg',
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
    mainImage: '/muziik/beryl/main.jpg',
    shaftImage: '/muziik/beryl/shaft.jpg',
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

export function getProductById(id: string): Product | undefined {
  return products.find(product => product.id === id);
}
