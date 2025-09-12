import React, { useState, useEffect } from 'react';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'failed' | 'error';
  message: string;
  details?: any;
  nextStep?: string;
}

export default function GoogleAdsDiagnostic() {
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [envCheckResults, setEnvCheckResults] = useState<any>(null);

  // 환경변수 확인 함수 추가
  const checkEnvironmentVariables = async () => {
    try {
      const response = await fetch('/api/debug/env-check');
      const data = await response.json();
      setEnvCheckResults(data);
      return data;
    } catch (error) {
      console.error('환경변수 확인 실패:', error);
      return null;
    }
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setDiagnosticResults([]);
    setCurrentStep('진단 시작...');

    try {
      // 1단계: 환경변수 확인
      setCurrentStep('환경변수 확인 중...');
      const envData = await checkEnvironmentVariables();
      
      // 2단계: Google Ads API 진단
      setCurrentStep('Google Ads API 진단 중...');
      const response = await fetch('/api/debug/google-ads-detailed-test');
      const data = await response.json();

      const results: DiagnosticResult[] = [
        {
          step: '환경변수 확인',
          status: envData?.summary?.googleAdsReady ? 'success' : 'failed',
          message: envData?.summary?.googleAdsReady 
            ? '모든 Google Ads 환경변수가 설정되었습니다.' 
            : `환경변수 설정에 문제가 있습니다. (${envData?.summary?.setVars}/${envData?.summary?.totalVars} 설정됨)`,
          details: envData?.googleAds?.variables,
          nextStep: envData?.summary?.googleAdsReady ? null : 'Vercel Dashboard에서 환경변수를 설정하세요.'
        },
        {
          step: 'API 클라이언트 초기화',
          status: data.step === '클라이언트 초기화' && data.status === '실패' ? 'failed' : 'success',
          message: data.step === '클라이언트 초기화' && data.status === '실패' ? data.message : 'API 클라이언트가 성공적으로 초기화되었습니다.'
        },
        {
          step: 'Customer 객체 생성',
          status: data.step === 'Customer 객체 생성' && data.status === '실패' ? 'failed' : 'success',
          message: data.step === 'Customer 객체 생성' && data.status === '실패' ? data.message : 'Customer 객체가 성공적으로 생성되었습니다.'
        },
        {
          step: 'API 쿼리 테스트',
          status: data.status === '성공' ? 'success' : 'failed',
          message: data.message,
          details: {
            ...data.data,
            originalError: data.originalError,
            errorDetails: data.errorDetails,
            customerIdInfo: data.customerIdInfo
          },
          nextStep: data.nextStep
        }
      ];

      setDiagnosticResults(results);
      setCurrentStep('진단 완료');
    } catch (error) {
      setDiagnosticResults([{
        step: 'API 호출',
        status: 'error',
        message: '진단 API 호출에 실패했습니다.',
        details: error
      }]);
      setCurrentStep('진단 실패');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'error': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'error': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">🔧 Google Ads API 진단 도구</h3>
          <button
            onClick={runDiagnostic}
            disabled={isRunning}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? '진단 중...' : '진단 실행'}
          </button>
        </div>

        {isRunning && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-800">{currentStep}</p>
          </div>
        )}

        {diagnosticResults.length > 0 && (
          <div className="space-y-3">
            {diagnosticResults.map((result, index) => (
              <div key={index} className={`p-4 rounded-md border ${getStatusColor(result.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(result.status)}</span>
                    <span className="font-medium">{result.step}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.status === 'success' ? 'bg-green-100 text-green-800' :
                    result.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {result.status === 'success' ? '성공' : result.status === 'failed' ? '실패' : '오류'}
                  </span>
                </div>
                <p className="mt-2 text-sm">{result.message}</p>
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer text-gray-600 hover:text-gray-800">
                      상세 정보 보기
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
                {result.nextStep && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <strong>다음 단계:</strong> {result.nextStep}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">💡 문제 해결 가이드</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>환경변수 오류:</strong> Vercel 대시보드에서 환경변수 설정을 확인하세요</li>
            <li>• <strong>Developer Token 오류:</strong> Google Ads API 콘솔에서 토큰 권한을 확인하세요</li>
            <li>• <strong>Customer ID 오류:</strong> 올바른 10자리 Customer ID를 사용하고 있는지 확인하세요</li>
            <li>• <strong>OAuth 토큰 오류:</strong> Refresh Token이 유효한지 확인하고 필요시 재발급하세요</li>
          </ul>
        </div>

        {/* 계정 권한 문제 해결 가이드 */}
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="font-medium text-red-900 mb-2">🚨 계정 권한 문제 해결</h4>
          <div className="text-sm text-red-800 space-y-2">
            <p><strong>현재 문제:</strong> <code>authentication_error: 29</code> (Developer Token이 유효하지 않음)</p>
            <p><strong>근본 원인:</strong> Standard Access 승인이 API Center에 반영되지 않음</p>
            <p><strong>해결 방법:</strong></p>
            <ol className="ml-4 space-y-1 list-decimal">
              <li><strong>Google Ads API Center</strong>에서 액세스 수준이 "일반 액세스"로 표시됨</li>
              <li><strong>Google Ads API Compliance 팀</strong>에 직접 문의 필요</li>
              <li><strong>계정 정지 상태</strong> 확인 및 해결</li>
              <li><strong>OAuth 토큰 재발급</strong> (임시 해결책)</li>
            </ol>
            <p className="mt-2">
              <strong>즉시 해야 할 일:</strong>
            </p>
            <ul className="ml-4 space-y-1 list-disc">
              <li>
                <a href="https://developers.google.com/google-ads/api/support" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Google Ads API 지원팀에 문의
                </a>
              </li>
              <li>
                <a href="https://ads.google.com/aw/apicenter" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  API Center에서 계정 상태 확인
                </a>
              </li>
              <li>
                <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  OAuth 2.0 Playground에서 새 토큰 발급
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 환경변수 설정 가이드 추가 */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="font-medium text-yellow-900 mb-2">🔧 환경변수 설정 가이드</h4>
          <div className="text-sm text-yellow-800 space-y-2">
            <p><strong>필수 환경변수:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• <code>GOOGLE_ADS_CLIENT_ID</code> - Google Cloud Console에서 발급</li>
              <li>• <code>GOOGLE_ADS_CLIENT_SECRET</code> - Google Cloud Console에서 발급</li>
              <li>• <code>GOOGLE_ADS_DEVELOPER_TOKEN</code> - Google Ads API Center에서 발급</li>
              <li>• <code>GOOGLE_ADS_CUSTOMER_ID</code> - 10자리 Customer ID (하이픈 없이)</li>
              <li>• <code>GOOGLE_ADS_REFRESH_TOKEN</code> - OAuth 인증 후 발급</li>
            </ul>
            <p className="mt-2">
              <strong>설정 방법:</strong> Vercel Dashboard → Settings → Environment Variables에서 추가
            </p>
          </div>
        </div>

        {/* 환경변수 상태 표시 */}
        {envCheckResults && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">📊 현재 환경변수 상태</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>Google Ads:</strong> {envCheckResults.summary?.setVars}/{envCheckResults.summary?.totalVars} 설정됨</p>
                  <p><strong>상태:</strong> {envCheckResults.summary?.googleAdsReady ? '✅ 준비됨' : '❌ 설정 필요'}</p>
                </div>
                <div>
                  <p><strong>GA4:</strong> {envCheckResults.ga4?.set}/{envCheckResults.ga4?.total} 설정됨</p>
                  <p><strong>상태:</strong> {envCheckResults.summary?.ga4Ready ? '✅ 준비됨' : '❌ 설정 필요'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
