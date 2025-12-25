import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminNav from '../../../components/admin/AdminNav';
import Link from 'next/link';

type DashboardSummary = {
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
};

type CategoryStat = {
  category: string;
  count: number;
  quantity: number;
  value: number;
};

type LowStockProduct = {
  id: number;
  name: string;
  category: string;
  stock: number;
};

type RecentTransaction = {
  id: number;
  product_name: string;
  tx_type: string;
  quantity: number;
  tx_date: string;
};

export default function InventoryDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory/dashboard');
      const json = await res.json();
      if (res.ok && json.success) {
        setSummary(json.summary);
        setCategoryStats(json.categoryStats || []);
        setLowStockProducts(json.lowStockProducts || []);
        setRecentTransactions(json.recentTransactions || []);
      } else {
        alert(json.message || '대시보드 데이터 조회에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('대시보드 조회 오류:', error);
      alert(error.message || '대시보드 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(value);
  };

  const getTxTypeLabel = (txType: string) => {
    const labels: Record<string, string> = {
      inbound: '입고',
      outbound: '출고',
      scrap: '폐기',
      adjustment: '조정',
    };
    return labels[txType] || txType;
  };

  const getTxTypeColor = (txType: string) => {
    const colors: Record<string, string> = {
      inbound: 'text-green-600 bg-green-50',
      outbound: 'text-red-600 bg-red-50',
      scrap: 'text-gray-600 bg-gray-50',
      adjustment: 'text-blue-600 bg-blue-50',
    };
    return colors[txType] || 'text-gray-600 bg-gray-50';
  };

  return (
    <>
      <Head>
        <title>재고 토탈 대시보드 - 관리자</title>
      </Head>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">재고 토탈 대시보드</h1>
            <p className="text-sm text-gray-600 mt-1">
              전체 재고 현황, 카테고리별 통계, 재고 부족 알림을 한눈에 확인하세요.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadDashboard}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
            >
              새로고침
            </button>
            <Link
              href="/admin/products"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              상품 관리로 이동
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : (
          <>
            {/* 전체 재고 현황 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">재고 보유 상품 수</div>
                <div className="text-3xl font-bold text-gray-900">
                  {summary?.totalProducts.toLocaleString() || 0}개
                </div>
                <div className="text-xs text-gray-500 mt-2">재고가 있는 활성 상품</div>
              </div>
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">총 재고 수량</div>
                <div className="text-3xl font-bold text-blue-600">
                  {summary?.totalQuantity.toLocaleString() || 0}개
                </div>
                <div className="text-xs text-gray-500 mt-2">전체 상품 재고 합계</div>
              </div>
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">총 재고 가치</div>
                <div className="text-3xl font-bold text-green-600">
                  {summary ? formatCurrency(summary.totalValue) : '₩0'}
                </div>
                <div className="text-xs text-gray-500 mt-2">할인가 우선 계산</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 카테고리별 재고 현황 */}
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 재고 현황</h2>
                {categoryStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    카테고리별 재고 데이터가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categoryStats.map((stat) => (
                      <div key={stat.category} className="border-b pb-3 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{stat.category}</span>
                          <span className="text-sm text-gray-600">
                            {stat.count}개 상품
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            수량: <span className="font-medium">{stat.quantity.toLocaleString()}개</span>
                          </span>
                          <span className="text-gray-600">
                            가치: <span className="font-medium">{formatCurrency(stat.value)}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 재고 부족 알림 */}
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  재고 부족 알림
                  {lowStockProducts.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-red-600">
                      ({lowStockProducts.length}개)
                    </span>
                  )}
                </h2>
                {lowStockProducts.length === 0 ? (
                  <div className="text-center py-8 text-green-600 text-sm">
                    ✅ 모든 상품의 재고가 충분합니다.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {lowStockProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md"
                      >
                        <div className="flex-1">
                          <Link
                            href={`/admin/products?highlight=${product.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {product.name}
                          </Link>
                          <div className="text-xs text-gray-600 mt-1">
                            {product.category} · 재고: {product.stock}개
                          </div>
                        </div>
                        <span className="text-red-600 font-medium text-sm">부족</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 최근 입고/출고 이력 */}
            <div className="mt-6 bg-white border rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 입고/출고 이력</h2>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  최근 재고 이력이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">일시</th>
                        <th className="p-2 text-left">상품명</th>
                        <th className="p-2 text-left">유형</th>
                        <th className="p-2 text-right">수량</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((tx, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2 text-gray-600">
                            {tx.tx_date
                              ? new Date(tx.tx_date).toLocaleString('ko-KR', {
                                  timeZone: 'Asia/Seoul',
                                })
                              : '-'}
                          </td>
                          <td className="p-2">
                            <Link
                              href={`/admin/products?highlight=${tx.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {tx.product_name}
                            </Link>
                          </td>
                          <td className="p-2">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTxTypeColor(
                                tx.tx_type,
                              )}`}
                            >
                              {getTxTypeLabel(tx.tx_type)}
                            </span>
                          </td>
                          <td className="p-2 text-right font-medium">
                            {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}







