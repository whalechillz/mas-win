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

  const runDiagnostic = async () => {
    setIsRunning(true);
    setDiagnosticResults([]);
    setCurrentStep('진단 시작...');

    try {
      const response = await fetch('/api/debug/google-ads-detailed-test');
      const data = await response.json();

      const results: DiagnosticResult[] = [
        {
          step: '환경변수 확인',
          status: data.envValidation ? 'success' : 'failed',
          message: data.envValidation ? '모든 환경변수가 설정되었습니다.' : '환경변수 설정에 문제가 있습니다.',
          details: data.envValidation
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
          details: data.data,
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
      </div>
    </div>
  );
}
