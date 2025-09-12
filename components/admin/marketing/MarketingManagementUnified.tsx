'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, BarChart3, Users, Eye, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

// 인터페이스 정의
interface MonthlyData {
  month: string;
  year: number;
  users: number;
  pageViews: number;
  events: number;
  tagStatus: 'working' | 'not_installed' | 'partial' | 'unknown';
  workingDays: number;
  totalDays: number;
}

interface FunnelFile {
  name: string;
  path: string;
  size: number;
  createdDate: string;
  modifiedDate: string;
  version: string;
  status: 'live' | 'staging' | 'dev';
  url: string;
}

interface FunnelData {
  totalFiles: number;
  groupedFunnels: Record<string, FunnelFile[]>;
  lastUpdated: string;
}

interface FunnelPerformance {
  id: string;
  name: string;
  url: string;
  visitors: number;
  pageViews: number;
  events: number;
  conversionRate: number;
}

interface ABTestData {
  versionA: {
    users: number;
    conversions: number;
    performance: number;
    fileSize: number;
  };
  versionB: {
    users: number;
    conversions: number;
    performance: number;
    fileSize: number;
  };
  winner: 'A' | 'B';
  confidence: number;
}

export default function MarketingManagementUnified() {
  // 상태 관리
  const [activeTab, setActiveTab] = useState<'campaigns' | 'funnels' | 'ab-test'>('campaigns');
  const [selectedMonth, setSelectedMonth] = useState('2025-09');
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [funnelPerformance, setFunnelPerformance] = useState<FunnelPerformance[]>([]);
  const [abTestData, setAbTestData] = useState<ABTestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'funnel-performance': false,
    'ab-test-details': false,
    'monthly-details': false
  });

  // 월별 옵션
  const monthOptions = ['2025-05', '2025-06', '2025-07', '2025-08', '2025-09'];

  useEffect(() => {
    loadAllData();
  }, [selectedMonth, activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMonthlyData(),
        loadFunnelData(),
        loadFunnelPerformance(),
        loadABTestData()
      ]);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyData = async () => {
    try {
      const response = await fetch('/api/ga4-monthly');
      if (response.ok) {
        const data = await response.json();
        // 배열인지 확인하고 설정
        if (Array.isArray(data)) {
          setMonthlyData(data);
        } else {
          console.log('월별 데이터가 배열이 아닙니다:', data);
          setMonthlyData([]);
        }
      }
    } catch (error) {
      console.error('월별 데이터 로드 오류:', error);
      setMonthlyData([]);
    }
  };

  const loadFunnelData = async () => {
    try {
      const response = await fetch('/api/funnel-management');
      const data = await response.json();
      
      if (data.success) {
        setFunnelData(data.data);
      }
    } catch (error) {
      console.error('퍼널 데이터 로드 오류:', error);
    }
  };

  const loadFunnelPerformance = async () => {
    try {
      const response = await fetch('/api/ga4-funnel/');
      if (response.ok) {
        const data = await response.json();
        // 배열인지 확인하고 설정
        if (Array.isArray(data)) {
          setFunnelPerformance(data);
        } else {
          console.log('퍼널 성과 데이터가 배열이 아닙니다:', data);
          setFunnelPerformance([]);
        }
      }
    } catch (error) {
      console.error('퍼널 성과 데이터 로드 오류:', error);
      setFunnelPerformance([]);
    }
  };

  const loadABTestData = async () => {
    try {
      const response = await fetch('/api/analytics/ab-test-results');
      if (response.ok) {
        const data = await response.json();
        setAbTestData(data);
        console.log('A/B 테스트 데이터:', data);
      }
    } catch (error) {
      console.error('A/B 테스트 데이터 로드 오류:', error);
      setAbTestData(null);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatNumber = (num: string | number) => {
    const number = typeof num === 'string' ? parseInt(num) : num;
    return number.toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'not_installed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'working':
        return '정상 작동';
      case 'partial':
        return '부분 작동';
      case 'not_installed':
        return '태그 미설치';
      default:
        return '알 수 없음';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">마케팅 관리</h1>
            <p className="text-gray-600 mt-1">캠페인, 퍼널, A/B 테스트 통합 관리</p>
          </div>
          <div className="text-sm text-gray-500">
            마지막 업데이트: {new Date().toLocaleString('ko-KR')}
          </div>
        </div>
      </div>

      {/* 월별 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">월별 필터</h2>
          <button
            onClick={loadAllData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            새로고침
          </button>
        </div>
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {monthOptions.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedMonth === month
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'campaigns'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            📊 캠페인 분석
          </button>
          <button
            onClick={() => setActiveTab('funnels')}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'funnels'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            🔄 퍼널 관리
          </button>
          <button
            onClick={() => setActiveTab('ab-test')}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'ab-test'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            🧪 A/B 테스트
          </button>
        </div>
      </div>

      {/* 캠페인 분석 탭 */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* 월별 캠페인 분석 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">월별 캠페인 분석</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.isArray(monthlyData) && monthlyData.map((month) => (
                <div key={month.month} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{month.month}</h3>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(month.tagStatus)}
                      <span className="text-sm text-gray-600">{getStatusText(month.tagStatus)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">방문자:</span>
                      <span className="font-semibold">{formatNumber(month.users)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">페이지뷰:</span>
                      <span className="font-semibold">{formatNumber(month.pageViews)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">이벤트:</span>
                      <span className="font-semibold">{formatNumber(month.events)}</span>
                    </div>
                    {month.tagStatus === 'partial' && (
                      <div className="mt-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>작동일수:</span>
                          <span>{month.workingDays}일 / {month.totalDays}일</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full" 
                            style={{ width: `${(month.workingDays / month.totalDays) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 퍼널별 성과 분석 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">퍼널별 성과 분석</h2>
              <button
                onClick={() => toggleSection('funnel-performance')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {expandedSections['funnel-performance'] ? '접기' : '자세히 보기'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.isArray(funnelPerformance) && funnelPerformance.map((funnel) => (
                <div key={funnel.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{funnel.name}</h3>
                    <a 
                      href={funnel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      퍼널 보기 →
                    </a>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{formatNumber(funnel.visitors)}</div>
                      <div className="text-sm text-gray-600">방문자</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{formatNumber(funnel.pageViews)}</div>
                      <div className="text-sm text-gray-600">페이지뷰</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{formatNumber(funnel.events)}</div>
                      <div className="text-sm text-gray-600">이벤트</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{funnel.conversionRate.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">전환율</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-600">
                    퍼널 URL: {funnel.url}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 퍼널 관리 탭 */}
      {activeTab === 'funnels' && (
        <div className="space-y-6">
          {/* 월별 퍼널 파일 목록 */}
          {funnelData && funnelData.groupedFunnels[selectedMonth] && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedMonth} 퍼널 목록 ({funnelData.groupedFunnels[selectedMonth].length}개)
              </h2>
              <div className="space-y-4">
                {funnelData.groupedFunnels[selectedMonth].map((funnel, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{funnel.name}</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            funnel.status === 'live' 
                              ? 'bg-green-100 text-green-800' 
                              : funnel.status === 'staging'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {funnel.status}
                          </span>
                          <span>파일 크기: {formatFileSize(funnel.size)}</span>
                          <span>수정일: {new Date(funnel.modifiedDate).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                          미리보기
                        </button>
                        <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors">
                          편집
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 퍼널이 없는 경우 */}
          {funnelData && (!funnelData.groupedFunnels[selectedMonth] || funnelData.groupedFunnels[selectedMonth].length === 0) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedMonth} 퍼널이 없습니다</h3>
                <p className="text-gray-600 mb-4">이 월에는 생성된 퍼널 파일이 없습니다.</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  새 퍼널 생성
                </button>
              </div>
            </div>
          )}

          {/* 핵심 지표 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 세션</p>
                  <p className="text-2xl font-bold text-gray-900">18,330</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">평균 세션 시간</p>
                  <p className="text-2xl font-bold text-gray-900">1분</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">바운스율</p>
                  <p className="text-2xl font-bold text-gray-900">8.3%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">페이지/세션</p>
                  <p className="text-2xl font-bold text-gray-900">1.0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* A/B 테스트 탭 */}
      {activeTab === 'ab-test' && (
        <div className="space-y-6">
          {/* A/B 테스트 결과 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">A/B 테스트 결과</h2>
              <button
                onClick={() => toggleSection('ab-test-details')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {expandedSections['ab-test-details'] ? '접기' : '자세히 보기'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {abTestData?.data?.results?.map((result: any, index: number) => (
                <div key={result.version} className={`${index === 0 ? 'bg-blue-50' : 'bg-green-50'} rounded-lg p-4`}>
                  <h3 className={`font-semibold ${index === 0 ? 'text-blue-900' : 'text-green-900'} mb-2`}>
                    Version {result.version} {index === 0 ? '(기존)' : '(개선)'}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={index === 0 ? 'text-blue-700' : 'text-green-700'}>사용자:</span>
                      <span className={`font-semibold ${index === 0 ? 'text-blue-900' : 'text-green-900'}`}>
                        {result.uniqueUsers > 0 ? `${result.uniqueUsers}명` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={index === 0 ? 'text-blue-700' : 'text-green-700'}>전환율:</span>
                      <span className={`font-semibold ${index === 0 ? 'text-blue-900' : 'text-green-900'}`}>
                        {result.conversionRate > 0 ? `${result.conversionRate.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={index === 0 ? 'text-blue-700' : 'text-green-700'}>세션:</span>
                      <span className={`font-semibold ${index === 0 ? 'text-blue-900' : 'text-green-900'}`}>
                        {result.sessions > 0 ? `${result.sessions}회` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )) || (
                <>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Version A (기존)</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">사용자:</span>
                        <span className="font-semibold text-blue-900">N/A</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">전환율:</span>
                        <span className="font-semibold text-blue-900">N/A</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">세션:</span>
                        <span className="font-semibold text-blue-900">N/A</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-2">Version B (개선)</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-green-700">사용자:</span>
                        <span className="font-semibold text-green-900">N/A</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">전환율:</span>
                        <span className="font-semibold text-green-900">N/A</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">세션:</span>
                        <span className="font-semibold text-green-900">N/A</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-gray-800 font-medium">
                  {abTestData?.data?.winner ? `🏆 현재 승자: Version ${abTestData.data.winner}` : '📊 데이터 수집 중'}
                </span>
                <span className="ml-2 text-sm text-gray-700">
                  {abTestData?.data?.confidence > 0 ? `(신뢰도: ${abTestData.data.confidence}%)` : '(실제 데이터 대기 중)'}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-700">
                {abTestData?.data?.winner 
                  ? `Version ${abTestData.data.winner}가 더 나은 성과를 보입니다.`
                  : 'A/B 테스트가 시작되었습니다. 충분한 데이터가 수집되면 결과를 표시합니다.'
                }
              </div>
              {abTestData?.note && (
                <div className="mt-2 text-xs text-gray-500">
                  {abTestData.note}
                </div>
              )}
            </div>

            {expandedSections['ab-test-details'] && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">스크롤 깊이 분석</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Version A</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>25% 스크롤:</span>
                        <span>N/A</span>
                      </div>
                      <div className="flex justify-between">
                        <span>50% 스크롤:</span>
                        <span>N/A</span>
                      </div>
                      <div className="flex justify-between">
                        <span>100% 스크롤:</span>
                        <span>N/A</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Version B</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>25% 스크롤:</span>
                        <span>N/A</span>
                      </div>
                      <div className="flex justify-between">
                        <span>50% 스크롤:</span>
                        <span>N/A</span>
                      </div>
                      <div className="flex justify-between">
                        <span>100% 스크롤:</span>
                        <span>N/A</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* A/B 테스트 액션 버튼 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex space-x-4">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Version B 적용
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                새 A/B 테스트 시작
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                상세 분석
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
