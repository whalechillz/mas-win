import React from 'react';
import Head from 'next/head';
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">📈 마케팅</h1>
          <p className="mt-2 text-gray-600">마케팅 캠페인 관리 및 통합 마케팅 대시보드</p>
        </div>
        <MarketingManagementUnified />
      </main>
    </div>
  );
}

