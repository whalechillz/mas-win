import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { slug } = req.query;
      
      if (!slug) {
        return res.status(400).json({ 
          error: '제품 슬러그가 필요합니다.' 
        });
      }
      
      // 제품 데이터 파일 경로
      const productsPath = path.join(process.cwd(), 'data', 'products.json');
      
      // 파일이 존재하는지 확인
      if (!fs.existsSync(productsPath)) {
        return res.status(404).json({ 
          error: '제품 데이터를 찾을 수 없습니다.' 
        });
      }
      
      // 제품 데이터 읽기
      const productsData = fs.readFileSync(productsPath, 'utf8');
      const products = JSON.parse(productsData);
      
      // 슬러그로 제품 찾기
      const product = products.find(p => p.slug === slug);
      
      if (!product) {
        return res.status(404).json({ 
          error: '제품을 찾을 수 없습니다.',
          message: `슬러그 '${slug}'에 해당하는 제품이 없습니다.`
        });
      }
      
      // 관련 제품 찾기 (같은 시리즈)
      const relatedProducts = products
        .filter(p => p.series === product.series && p.slug !== product.slug)
        .slice(0, 3);
      
      // 응답 데이터
      const response = {
        product,
        relatedProducts,
        meta: {
          title: product.title,
          description: product.description,
          keywords: `${product.name}, ${product.series}, 드라이버, 골프, MASGOLF`
        }
      };
      
      res.status(200).json(response);
      
    } catch (error) {
      console.error('제품 상세 조회 오류:', error);
      res.status(500).json({ 
        error: '제품 정보를 불러오는 중 오류가 발생했습니다.',
        message: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  }
}
