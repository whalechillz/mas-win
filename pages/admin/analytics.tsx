import React from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';
import GA4RealtimeDashboard from '../../components/admin/dashboard/GA4RealtimeDashboard';
import MonthlyCampaignAnalytics from '../../components/admin/campaigns/MonthlyCampaignAnalytics';
import GA4AdvancedDashboard from '../../components/admin/dashboard/GA4AdvancedDashboard';

export default function Analytics() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>분석 - 관리자 대시보드</title>
        <meta name="description" content="데이터 분석 및 통계" />
      </Head>
      <AdminNav />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">📊 분석</h1>
          <p className="mt-2 text-gray-600">데이터 분석 및 통계</p>
        </div>
        <div className="space-y-6">
          <GA4RealtimeDashboard />
          <MonthlyCampaignAnalytics />
          <GA4AdvancedDashboard />
        </div>
      </main>
    </div>
  );
}

