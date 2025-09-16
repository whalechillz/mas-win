import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // 제품 데이터 파일 경로
      const productsPath = path.join(process.cwd(), 'data', 'products.json');
      
      // 파일이 존재하는지 확인
      if (!fs.existsSync(productsPath)) {
        return res.status(404).json({ 
          error: '제품 데이터를 찾을 수 없습니다.',
          message: '제품 데이터 파일이 생성되지 않았습니다.'
        });
      }
      
      // 제품 데이터 읽기
      const productsData = fs.readFileSync(productsPath, 'utf8');
      const products = JSON.parse(productsData);
      
      // 쿼리 파라미터 처리
      const { series, category, status, limit, offset } = req.query;
      
      let filteredProducts = [...products];
      
      // 시리즈 필터
      if (series) {
        filteredProducts = filteredProducts.filter(product => 
          product.series === series
        );
      }
      
      // 카테고리 필터
      if (category) {
        filteredProducts = filteredProducts.filter(product => 
          product.category === category
        );
      }
      
      // 상태 필터
      if (status) {
        filteredProducts = filteredProducts.filter(product => 
          product.status === status
        );
      }
      
      // 정렬 (가격순)
      filteredProducts.sort((a, b) => a.discountedPrice - b.discountedPrice);
      
      // 페이지네이션
      const startIndex = offset ? parseInt(offset) : 0;
      const endIndex = limit ? startIndex + parseInt(limit) : filteredProducts.length;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
      
      // 응답 데이터
      const response = {
        products: paginatedProducts,
        total: filteredProducts.length,
        pagination: {
          limit: limit ? parseInt(limit) : filteredProducts.length,
          offset: startIndex,
          hasMore: endIndex < filteredProducts.length
        },
        filters: {
          series: series || null,
          category: category || null,
          status: status || null
        }
      };
      
      res.status(200).json(response);
      
    } catch (error) {
      console.error('제품 데이터 조회 오류:', error);
      res.status(500).json({ 
        error: '제품 데이터를 불러오는 중 오류가 발생했습니다.',
        message: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  }
}
