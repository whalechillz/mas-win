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
    mainImage: '/muziik/sapphire_one_flex_shaft_main.png',
    shaftImage: '/muziik/sapphire_one_flex_shaft_main.png',
    chartImage: '/muziik/sapphire_40_50_bending_profile.png',
    features: [
      'チタンファイバー技術による超高速反発力',
      'ヘッド安定性の向上',
      'オフセンター時のヘッドブレ抑制',
      '自動的なワンフレックスタイプ',
      '様々なゴルファーに対応'
    ],
    technicalDescription: `超高速な撓り戻りとヘッドの挙動安定性はムジーク独自のチタンファイバーテクノロジーよるもの。チタンファイバーをシャフト全長に使用することで当たり負けのない強いインパクトとオフセンターヒット時によるヘッドのブレを抑制。強靭かつ大きな持りが高弾道を実現させます。また切り返しからインパクトに欠けてヘッド挙動を安定させるようにシャフト剛性を設計しているのでタイミングがとりやすい。ヘッドスピードに関係なく幅広いゴルファーに適応したオートマチックなワンフレックスタイプ。`,
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
    mainImage: '/muziik/beryl_40_shaft_main.png',
    shaftImage: '/muziik/beryl_40_shaft_main.png',
    features: [
      '高弾性(65t)カーボンシート使用',
      'チタンファイバーによる引張強度向上',
      'インパクト時の逆トルク抑制',
      '美しいアルミニウムIP処理',
      'BERYL(美しさ、輝き、若さ)にふさわしいデザイン'
    ],
    technicalDescription: `High modulus (65t) carbon sheet is used. By using titanium fiber in the entire length of the straight layer, the tensile strength is increased and the shaft has a good return to elasticity, and the shaft combines the contradictory qualities of stickiness and drive. In addition, reverse torque is suppressed at impact, making face control easier and directionality more stable. The Dogatti is also characterized by its shiny, beautiful aluminum IP-processed coloring, which is appropriate for BERYL (beauty, brilliance, and youth).`,
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
