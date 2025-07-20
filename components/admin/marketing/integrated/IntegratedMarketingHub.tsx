import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Target, FileText, Globe, PenTool, CheckCircle, BarChart2, AlertCircle, TrendingUp } from 'lucide-react';
import FunnelPlanManager from './FunnelPlanManager';
import FunnelPageBuilder from './FunnelPageBuilder';
import GoogleAdsManager from './GoogleAdsManager';
import ContentGenerator from './ContentGenerator';
import ContentValidator from './ContentValidator';
import KPIManager from './KPIManager';

interface MonthData {
  year: number;
  month: number;
  theme: string;
  status: {
    funnelPlan: boolean;
    funnelPage: boolean;
    googleAds: boolean;
    contentGenerated: boolean;
    contentValidated: boolean;
    kpiSet: boolean;
  };
  scores: {
    contentQuality: number;
    kpiAchievement: number;
  };
}

interface WorkflowStep {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  component: string;
  completed: boolean;
}

const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function IntegratedMarketingHub() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [activeStep, setActiveStep] = useState(1);
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    {
      id: 1,
      name: '퍼널 기획',
      description: '월별 마케팅 퍼널 전략 수립',
      icon: <Target className="w-5 h-5" />,
      component: 'FunnelPlanManager',
      completed: false
    },
    {
      id: 2,
      name: '페이지 구성',
      description: '퍼널 페이지 초안 제작 (MCP)',
      icon: <FileText className="w-5 h-5" />,
      component: 'FunnelPageBuilder',
      completed: false
    },
    {
      id: 3,
      name: '구글애드',
      description: '광고 소재 및 UTM 관리 (MCP)',
      icon: <Globe className="w-5 h-5" />,
      component: 'GoogleAdsManager',
      completed: false
    },
    {
      id: 4,
      name: '콘텐츠 생성',
      description: '멀티채널 콘텐츠 AI 생성',
      icon: <PenTool className="w-5 h-5" />,
      component: 'ContentGenerator',
      completed: false
    },
    {
      id: 5,
      name: 'AI 검증',
      description: '콘텐츠 품질 자동 검증',
      icon: <CheckCircle className="w-5 h-5" />,
      component: 'ContentValidator',
      completed: false
    },
    {
      id: 6,
      name: 'KPI 관리',
      description: '성과 측정 및 분석',
      icon: <BarChart2 className="w-5 h-5" />,
      component: 'KPIManager',
      completed: false
    }
  ]);

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedYear]);

  useEffect(() => {
    updateWorkflowStatus();
  }, [selectedYear, selectedMonth]);

  const fetchMonthlyData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/integrated/yearly-overview?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setMonthlyData(data);
      }
    } catch (error) {
      console.error('Failed to fetch monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateWorkflowStatus = async () => {
    try {
      const response = await fetch(`/api/integrated/workflow-status?year=${selectedYear}&month=${selectedMonth}`);
      if (response.ok) {
        const status = await response.json();
        setWorkflowSteps(steps => steps.map((step, index) => ({
          ...step,
          completed: status[`step${index + 1}`] || false
        })));
      }
    } catch (error) {
      console.error('Failed to update workflow status:', error);
    }
  };

  const handleMonthClick = (month: number) => {
    setSelectedMonth(month);
    setActiveStep(1);
  };

  const getMonthStatus = (month: number) => {
    const data = monthlyData.find(d => d.month === month);
    if (!data) return 'empty';
    
    const completedSteps = Object.values(data.status).filter(Boolean).length;
    if (completedSteps === 6) return 'completed';
    if (completedSteps > 0) return 'in-progress';
    return 'empty';
  };

  const getMonthStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300';
      case 'in-progress':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600';
    }
  };

  const renderActiveComponent = () => {
    const props = { year: selectedYear, month: selectedMonth };
    
    switch (workflowSteps[activeStep - 1]?.component) {
      case 'FunnelPlanManager':
        return <FunnelPlanManager {...props} />;
      case 'FunnelPageBuilder':
        return <FunnelPageBuilder {...props} />;
      case 'GoogleAdsManager':
        return <GoogleAdsManager {...props} />;
      case 'ContentGenerator':
        return <ContentGenerator {...props} />;
      case 'ContentValidator':
        return <ContentValidator {...props} />;
      case 'KPIManager':
        return <KPIManager {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              통합 마케팅 관리
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedYear(selectedYear - 1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-lg font-medium">{selectedYear}년</span>
              <button
                onClick={() => setSelectedYear(selectedYear + 1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 월별 캘린더 뷰 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              연간 캠페인 현황
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {months.map((month, index) => {
                const status = getMonthStatus(index + 1);
                const isSelected = selectedMonth === index + 1;
                const data = monthlyData.find(d => d.month === index + 1);
                
                return (
                  <button
                    key={index}
                    onClick={() => handleMonthClick(index + 1)}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all
                      ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                      ${getMonthStatusColor(status)}
                      hover:shadow-md
                    `}
                  >
                    <div className="text-sm font-medium">{month}</div>
                    {data?.theme && (
                      <div className="text-xs mt-1 truncate" title={data.theme}>
                        {data.theme}
                      </div>
                    )}
                    {status === 'completed' && (
                      <CheckCircle className="w-4 h-4 absolute top-2 right-2" />
                    )}
                    {status === 'in-progress' && (
                      <AlertCircle className="w-4 h-4 absolute top-2 right-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 워크플로우 단계 표시 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              {selectedYear}년 {months[selectedMonth - 1]} 워크플로우
            </h2>
            <div className="flex items-center justify-between overflow-x-auto">
              {workflowSteps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex-1 min-w-[150px]"
                >
                  <button
                    onClick={() => setActiveStep(step.id)}
                    className={`
                      w-full p-4 rounded-lg transition-all
                      ${activeStep === step.id 
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                      ${step.completed ? 'opacity-100' : 'opacity-60'}
                    `}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`
                        p-3 rounded-full mb-2
                        ${step.completed 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                        }
                      `}>
                        {step.icon}
                      </div>
                      <div className="text-sm font-medium">{step.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {step.description}
                      </div>
                    </div>
                  </button>
                  {index < workflowSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 -right-4 w-8">
                      <ChevronRight className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 선택된 컴포넌트 렌더링 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            {renderActiveComponent()}
          </div>
        </div>

        {/* 빠른 통계 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">완료된 캠페인</p>
                <p className="text-3xl font-bold text-green-600">
                  {monthlyData.filter(d => Object.values(d.status).every(Boolean)).length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-200 dark:text-green-800" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">평균 콘텐츠 품질</p>
                <p className="text-3xl font-bold text-blue-600">
                  {monthlyData.length > 0 
                    ? Math.round(monthlyData.reduce((sum, d) => sum + (d.scores?.contentQuality || 0), 0) / monthlyData.length)
                    : 0}
                </p>
              </div>
              <BarChart2 className="w-12 h-12 text-blue-200 dark:text-blue-800" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">KPI 달성률</p>
                <p className="text-3xl font-bold text-purple-600">
                  {monthlyData.length > 0 
                    ? Math.round(monthlyData.reduce((sum, d) => sum + (d.scores?.kpiAchievement || 0), 0) / monthlyData.length)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-200 dark:text-purple-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}