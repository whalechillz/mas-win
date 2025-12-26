import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminNav from '../../components/admin/AdminNav';
import MarketingManagementUnified from '../../components/admin/marketing/MarketingManagementUnified';

export default function Marketing() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>마케팅 - 관리자 대시보드</title>
        <meta name="description" content="마케팅 캠페인 관리" />
      </Head>
      <AdminNav />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 브레드크럼 네비게이션 */}
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/admin/dashboard" className="hover:text-gray-700">
                대시보드
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">마케팅</li>
          </ol>
        </nav>

        {/* 페이지 헤더 */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">📈</span>
                마케팅
              </h1>
              <p className="mt-2 text-gray-600">마케팅 캠페인 관리 및 통합 마케팅 대시보드</p>
            </div>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              ← 대시보드로
            </Link>
          </div>
        </div>

        {/* 콘텐츠 */}
        <MarketingManagementUnified />
      </main>
    </div>
  );
}

