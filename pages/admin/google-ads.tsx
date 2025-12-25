import React from 'react';
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';
import GoogleAdsDiagnostic from '../../components/admin/google-ads/GoogleAdsDiagnostic';

export default function GoogleAds() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>구글 광고 - 관리자 대시보드</title>
        <meta name="description" content="구글 광고 관리 및 진단" />
      </Head>
      <AdminNav />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🎯 구글 광고</h1>
          <p className="mt-2 text-gray-600">구글 광고 관리 및 진단</p>
        </div>
        <GoogleAdsDiagnostic />
      </main>
    </div>
  );
}

