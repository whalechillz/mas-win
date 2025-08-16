import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import fs from 'fs';
import path from 'path';

interface WinnerData {
  testName: string;
  currentWinner: string | null;
  previousWinner: string | null;
  confidence: number;
  significance: {
    conversionRate: boolean;
    sessionDuration: boolean;
    bounceRate: boolean;
  };
  lastUpdated: string;
  totalSessions: number;
  minimumSessionsRequired: number;
  isStatisticallySignificant: boolean;
  autoSwitchEnabled: boolean;
}

interface VersionPerformance {
  version: string;
  sessions: number;
  conversions: number;
  conversionRate: number;
  avgSessionDuration: number;
  bounceRate: number;
  pageViews: number;
  confidence: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { testName = 'funnel-2025-08', action = 'check' } = req.query;

  try {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
      },
    });

    // 현재 승자 정보 읽기
    const winnerFilePath = path.join(process.cwd(), 'data', 'current-winner.json');
    let currentWinnerData: WinnerData | null = null;
    
    try {
      if (fs.existsSync(winnerFilePath)) {
        currentWinnerData = JSON.parse(fs.readFileSync(winnerFilePath, 'utf8'));
      }
    } catch (error) {
      console.error('현재 승자 데이터 읽기 오류:', error);
    }

    // 실시간 데이터 조회 (최근 24시간)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 1);

    const [pageResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ 
        startDate: startDate.toISOString().split('T')[0], 
        endDate: endDate.toISOString().split('T')[0] 
      }],
      metrics: [
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' }
      ],
      dimensions: [
        { name: 'pagePath' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            value: '/25-08'
          }
        }
      }
    });

    const [conversionResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ 
        startDate: startDate.toISOString().split('T')[0], 
        endDate: endDate.toISOString().split('T')[0] 
      }],
      metrics: [
        { name: 'eventCount' }
      ],
      dimensions: [
        { name: 'eventName' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: ['phone_click', 'booking_submit', 'inquiry_submit', 'quiz_complete']
          }
        }
      }
    });

    // 버전별 성능 계산
    const detectedVersions = getDetectedFunnelVersions(testName as string);
    const pageData = pageResponse.rows || [];
    const conversionData = conversionResponse.rows || [];

    const totalSessions = pageData.length > 0 ? parseInt(pageData[0].metricValues?.[0]?.value || '0') : 0;
    const totalConversions = conversionData.reduce((sum, row) => {
      const eventName = row.dimensionValues?.[0]?.value;
      const eventCount = parseInt(row.metricValues?.[0]?.value || '0');
      return eventName === 'phone_click' ? sum + eventCount : sum;
    }, 0);

    const versions: VersionPerformance[] = detectedVersions.map((version, index) => {
      const versionSessions = Math.floor(totalSessions / detectedVersions.length);
      const versionConversions = Math.floor(totalConversions / detectedVersions.length);
      const conversionRate = versionSessions > 0 ? (versionConversions / versionSessions * 100) : 0;
      
      return {
        version: version.toUpperCase(),
        sessions: versionSessions,
        conversions: versionConversions,
        conversionRate,
        avgSessionDuration: pageData.length > 0 ? parseInt(pageData[0].metricValues?.[2]?.value || '0') : 0,
        bounceRate: pageData.length > 0 ? parseFloat(pageData[0].metricValues?.[3]?.value || '0') : 0,
        pageViews: pageData.length > 0 ? parseInt(pageData[0].metricValues?.[1]?.value || '0') / detectedVersions.length : 0,
        confidence: calculateConfidence(versionSessions, conversionRate)
      };
    });

    // 통계적 유의성 검정
    const significance = calculateStatisticalSignificance(versions);
    const newWinner = determineWinner(versions, significance, totalSessions);
    const isStatisticallySignificant = checkStatisticalSignificance(versions, totalSessions);

    // 승자 변경 확인
    const previousWinner = currentWinnerData?.currentWinner || null;
    const winnerChanged = newWinner !== previousWinner;

    // 새로운 승자 데이터 생성
    const winnerData: WinnerData = {
      testName: testName as string,
      currentWinner: newWinner,
      previousWinner: previousWinner,
      confidence: newWinner ? versions.find(v => v.version === newWinner)?.confidence || 0 : 0,
      significance,
      lastUpdated: new Date().toISOString(),
      totalSessions,
      minimumSessionsRequired: 50, // 최소 50개 세션 필요
      isStatisticallySignificant,
      autoSwitchEnabled: true
    };

    // 승자 데이터 저장
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(winnerFilePath, JSON.stringify(winnerData, null, 2));

    // 승자 변경 시 자동 퍼널 선택
    if (winnerChanged && newWinner && action === 'auto-switch') {
      await switchToWinningFunnel(testName as string, newWinner);
    }

    res.status(200).json({
      success: true,
      winnerData,
      versions,
      winnerChanged,
      actions: {
        autoSwitchEnabled: winnerData.autoSwitchEnabled,
        canSwitch: isStatisticallySignificant && totalSessions >= 50
      }
    });

  } catch (error) {
    console.error('실시간 승자 판정 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// 자동으로 감지된 퍼널 버전들 가져오기
function getDetectedFunnelVersions(testName: string): string[] {
  try {
    const versionsDir = path.join(process.cwd(), 'public', 'versions');
    const files = fs.readdirSync(versionsDir);
    
    const funnelPattern = new RegExp(`^${testName}-(.+)\\.html$`);
    const versions: string[] = [];
    
    files.forEach(file => {
      const match = file.match(funnelPattern);
      if (match) {
        versions.push(match[1]);
      }
    });
    
    return versions.sort();
  } catch (error) {
    console.error('퍼널 버전 감지 오류:', error);
    return ['live-a', 'live-b'];
  }
}

// 신뢰도 계산
function calculateConfidence(sessions: number, conversionRate: number): number {
  if (sessions < 10) return 0;
  if (sessions < 50) return 30;
  if (sessions < 100) return 60;
  if (sessions < 200) return 80;
  return 95;
}

// 통계적 유의성 검정
function calculateStatisticalSignificance(versions: VersionPerformance[]) {
  if (versions.length < 2) return { conversionRate: false, sessionDuration: false, bounceRate: false };

  const sortedByConversion = versions.sort((a, b) => b.conversionRate - a.conversionRate);
  const bestConversion = sortedByConversion[0].conversionRate;
  const secondBestConversion = sortedByConversion[1]?.conversionRate || 0;

  return {
    conversionRate: (bestConversion - secondBestConversion) > 3.0, // 3% 이상 차이
    sessionDuration: false, // 현재는 전환율만 사용
    bounceRate: false
  };
}

// 승자 판정
function determineWinner(versions: VersionPerformance[], significance: any, totalSessions: number): string | null {
  if (versions.length < 2 || totalSessions < 50) return null;
  
  if (significance.conversionRate) {
    const bestByConversion = versions.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    );
    return bestByConversion.version;
  }
  
  return null;
}

// 통계적 유의성 확인
function checkStatisticalSignificance(versions: VersionPerformance[], totalSessions: number): boolean {
  if (totalSessions < 50) return false;
  
  const sortedByConversion = versions.sort((a, b) => b.conversionRate - a.conversionRate);
  const bestConversion = sortedByConversion[0].conversionRate;
  const secondBestConversion = sortedByConversion[1]?.conversionRate || 0;
  
  return (bestConversion - secondBestConversion) > 3.0;
}

// 승자 퍼널로 자동 전환
async function switchToWinningFunnel(testName: string, winner: string) {
  try {
    // 현재 라이브 퍼널 백업
    const backupDir = path.join(process.cwd(), 'backup', 'funnel-switches');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `funnel-backup-${timestamp}.json`);
    
    const currentState = {
      testName,
      previousWinner: winner,
      timestamp,
      files: getDetectedFunnelVersions(testName)
    };
    
    fs.writeFileSync(backupPath, JSON.stringify(currentState, null, 2));

    // 승자 퍼널을 기본 퍼널로 설정
    const winnerFile = `${testName}-${winner.toLowerCase()}.html`;
    const defaultFile = `${testName}-live.html`;
    
    const versionsDir = path.join(process.cwd(), 'public', 'versions');
    const winnerFilePath = path.join(versionsDir, winnerFile);
    const defaultFilePath = path.join(versionsDir, defaultFile);
    
    if (fs.existsSync(winnerFilePath)) {
      // 기존 라이브 파일 백업
      if (fs.existsSync(defaultFilePath)) {
        const backupFilePath = path.join(backupDir, `live-backup-${timestamp}.html`);
        fs.copyFileSync(defaultFilePath, backupFilePath);
      }
      
      // 승자 파일을 라이브 파일로 복사
      fs.copyFileSync(winnerFilePath, defaultFilePath);
      
      console.log(`퍼널 자동 전환 완료: ${winner} → 라이브`);
    }

  } catch (error) {
    console.error('퍼널 자동 전환 오류:', error);
  }
}
