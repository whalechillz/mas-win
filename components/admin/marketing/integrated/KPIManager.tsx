import React, { useState, useEffect } from 'react';
// UI 컴포넌트를 직접 구현 (shadcn/ui 대신)
const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const Progress = ({ value, className = '' }: any) => (
  <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
    <div 
      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
);
// 차트는 간단한 div 기반으로 구현
import { 
  Calendar, Users, Target, TrendingUp, TrendingDown, 
  AlertCircle, CheckCircle, RefreshCw, Download, Upload
} from 'lucide-react';

// 타입 정의
interface MonthlyKPI {
  year: number;
  month: number;
  channels: {
    [channel: string]: {
      target: number;
      actual: number;
      posts: number;
      engagement: number;
      conversion: number;
    };
  };
  employees: Array<{
    id: string;
    name: string;
    blogQuota: number;
    blogCompleted: number;
    performance: number;
  }>;
  overall: {
    roi: number;
    efficiency: number;
    recommendations: string[];
  };
}

interface ChannelMetrics {
  channel: string;
  target: number;
  actual: number;
  achievement: number;
  trend: 'up' | 'down' | 'stable';
}

interface EmployeePerformance {
  id: string;
  name: string;
  quota: number;
  completed: number;
  completionRate: number;
  quality: number;
}

const CHANNELS = ['blog', 'kakao', 'sms', 'email', 'instagram', 'googleAds'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

interface KPIManagerProps {
  year?: number;
  month?: number;
}

export default function KPIManager({ year, month }: KPIManagerProps) {
  const [selectedYear, setSelectedYear] = useState(year || new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(month || new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [kpiData, setKpiData] = useState<MonthlyKPI | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // KPI 데이터 로드
  const loadKPIData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/kpi/${selectedYear}/${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setKpiData(data);
      }
    } catch (error) {
      console.error('KPI 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // API 데이터 동기화
  const syncWithAPIs = async () => {
    setSyncStatus('syncing');
    try {
      const response = await fetch('/api/kpi/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: selectedYear, month: selectedMonth })
      });
      
      if (response.ok) {
        setSyncStatus('success');
        await loadKPIData(); // 동기화 후 데이터 다시 로드
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('API 동기화 실패:', error);
      setSyncStatus('error');
    }
  };

  // 직원 할당량 업데이트
  const updateEmployeeQuota = async (employeeId: string, newQuota: number) => {
    try {
      const response = await fetch('/api/kpi/employee-quota', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          quota: newQuota,
          year: selectedYear,
          month: selectedMonth
        })
      });

      if (response.ok) {
        await loadKPIData();
        setEditingEmployee(null);
      }
    } catch (error) {
      console.error('직원 할당량 업데이트 실패:', error);
    }
  };

  // 채널별 성과 계산
  const calculateChannelMetrics = (): ChannelMetrics[] => {
    if (!kpiData) return [];

    return Object.entries(kpiData.channels).map(([channel, data]) => {
      const achievement = data.target > 0 ? (data.actual / data.target) * 100 : 0;
      const trend = achievement >= 100 ? 'up' : achievement >= 80 ? 'stable' : 'down';
      
      return {
        channel,
        target: data.target,
        actual: data.actual,
        achievement,
        trend
      };
    });
  };

  // 직원별 성과 계산
  const calculateEmployeePerformance = (): EmployeePerformance[] => {
    if (!kpiData) return [];

    return kpiData.employees.map(employee => ({
      id: employee.id,
      name: employee.name,
      quota: employee.blogQuota,
      completed: employee.blogCompleted,
      completionRate: employee.blogQuota > 0 ? (employee.blogCompleted / employee.blogQuota) * 100 : 0,
      quality: employee.performance
    }));
  };

  // 월간 리포트 다운로드
  const downloadMonthlyReport = () => {
    // CSV 형식으로 리포트 생성
    const channelData = calculateChannelMetrics();
    const employeeData = calculateEmployeePerformance();
    
    let csv = 'KPI Monthly Report\n';
    csv += `Year: ${selectedYear}, Month: ${selectedMonth}\n\n`;
    
    csv += 'Channel Performance\n';
    csv += 'Channel,Target,Actual,Achievement %\n';
    channelData.forEach(ch => {
      csv += `${ch.channel},${ch.target},${ch.actual},${ch.achievement.toFixed(2)}\n`;
    });
    
    csv += '\nEmployee Performance\n';
    csv += 'Name,Quota,Completed,Completion %,Quality Score\n';
    employeeData.forEach(emp => {
      csv += `${emp.name},${emp.quota},${emp.completed},${emp.completionRate.toFixed(2)},${emp.quality}\n`;
    });
    
    // 다운로드
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kpi_report_${selectedYear}_${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (year) setSelectedYear(year);
    if (month) setSelectedMonth(month);
  }, [year, month]);

  useEffect(() => {
    loadKPIData();
  }, [selectedYear, selectedMonth]);

  const channelMetrics = calculateChannelMetrics();
  const employeePerformance = calculateEmployeePerformance();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">KPI 관리</h2>
          <p className="text-gray-600">월별 성과 지표 및 직원 할당량 관리</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* 기간 선택 */}
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}년</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <SelectItem key={month} value={month.toString()}>{month}월</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* 동기화 버튼 */}
          <Button 
            onClick={syncWithAPIs} 
            disabled={syncStatus === 'syncing'}
            variant={syncStatus === 'success' ? 'default' : 'outline'}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            {syncStatus === 'syncing' ? '동기화 중...' : 'API 동기화'}
          </Button>
          
          {/* 리포트 다운로드 */}
          <Button onClick={downloadMonthlyReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 전체 성과 요약 */}
      {kpiData && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">전체 ROI</p>
                <p className="text-2xl font-bold">{kpiData.overall.roi.toFixed(2)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">효율성 점수</p>
                <p className="text-2xl font-bold">{kpiData.overall.efficiency.toFixed(1)}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">활성 채널</p>
                <p className="text-2xl font-bold">{Object.keys(kpiData.channels).length}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">참여 직원</p>
                <p className="text-2xl font-bold">{kpiData.employees.length}명</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>
      )}

      {/* 메인 탭 */}
      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">채널별 성과</TabsTrigger>
          <TabsTrigger value="employees">직원별 할당량</TabsTrigger>
          <TabsTrigger value="trends">트렌드 분석</TabsTrigger>
          <TabsTrigger value="recommendations">개선 제안</TabsTrigger>
        </TabsList>

        {/* 채널별 성과 탭 */}
        <TabsContent value="channels" className="space-y-6">
          {/* 채널별 목표 달성률 차트 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">채널별 목표 달성률</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="achievement" fill="#3b82f6" name="달성률 (%)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* 채널별 상세 지표 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">채널별 상세 지표</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>채널</TableHead>
                  <TableHead>목표</TableHead>
                  <TableHead>실적</TableHead>
                  <TableHead>달성률</TableHead>
                  <TableHead>게시물 수</TableHead>
                  <TableHead>참여율</TableHead>
                  <TableHead>전환율</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpiData && Object.entries(kpiData.channels).map(([channel, data]) => {
                  const achievement = data.target > 0 ? (data.actual / data.target) * 100 : 0;
                  return (
                    <TableRow key={channel}>
                      <TableCell className="font-medium capitalize">{channel}</TableCell>
                      <TableCell>{data.target.toLocaleString()}</TableCell>
                      <TableCell>{data.actual.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={achievement} className="w-20" />
                          <span className="text-sm">{achievement.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{data.posts}</TableCell>
                      <TableCell>{data.engagement.toFixed(2)}%</TableCell>
                      <TableCell>{data.conversion.toFixed(2)}%</TableCell>
                      <TableCell>
                        <Badge variant={achievement >= 100 ? 'default' : achievement >= 80 ? 'secondary' : 'destructive'}>
                          {achievement >= 100 ? '초과달성' : achievement >= 80 ? '정상' : '미달'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* 직원별 할당량 탭 */}
        <TabsContent value="employees" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">직원별 블로그 할당량 관리</h3>
            
            {/* 전체 진행률 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">전체 블로그 작성 진행률</span>
                <span className="text-sm text-gray-600">
                  {employeePerformance.reduce((sum, emp) => sum + emp.completed, 0)} / 
                  {employeePerformance.reduce((sum, emp) => sum + emp.quota, 0)}
                </span>
              </div>
              <Progress 
                value={
                  employeePerformance.reduce((sum, emp) => sum + emp.quota, 0) > 0
                    ? (employeePerformance.reduce((sum, emp) => sum + emp.completed, 0) / 
                       employeePerformance.reduce((sum, emp) => sum + emp.quota, 0)) * 100
                    : 0
                } 
                className="h-3"
              />
            </div>

            {/* 직원별 상세 */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>직원명</TableHead>
                  <TableHead>월간 할당량</TableHead>
                  <TableHead>완료</TableHead>
                  <TableHead>진행률</TableHead>
                  <TableHead>품질 점수</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeePerformance.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>
                      {editingEmployee === employee.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            defaultValue={employee.quota}
                            className="w-20"
                            onBlur={(e) => {
                              updateEmployeeQuota(employee.id, Number(e.target.value));
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateEmployeeQuota(employee.id, Number(e.currentTarget.value));
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <span onClick={() => setEditingEmployee(employee.id)} className="cursor-pointer hover:underline">
                          {employee.quota}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{employee.completed}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={employee.completionRate} className="w-20" />
                        <span className="text-sm">{employee.completionRate.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{employee.quality.toFixed(1)}</span>
                        {employee.quality >= 4.5 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : employee.quality >= 3.5 ? (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        employee.completionRate >= 100 ? 'default' : 
                        employee.completionRate >= 80 ? 'secondary' : 
                        'destructive'
                      }>
                        {employee.completionRate >= 100 ? '완료' : 
                         employee.completionRate >= 80 ? '진행중' : 
                         '지연'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost">상세보기</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* 트렌드 분석 탭 */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">월별 성과 트렌드</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={channelMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" name="실적" />
                <Line type="monotone" dataKey="target" stroke="#ef4444" name="목표" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* 채널별 점유율 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">채널별 성과 점유율</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={channelMetrics}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ channel, achievement }) => `${channel}: ${achievement.toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="actual"
                >
                  {channelMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* 개선 제안 탭 */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI 기반 개선 제안</h3>
            {kpiData?.overall.recommendations && kpiData.overall.recommendations.length > 0 ? (
              <div className="space-y-4">
                {kpiData.overall.recommendations.map((recommendation, index) => (
                  <Alert key={index}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{recommendation}</AlertDescription>
                  </Alert>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  현재 성과가 양호합니다. 지속적인 모니터링을 권장합니다.
                </AlertDescription>
              </Alert>
            )}
          </Card>

          {/* 채널별 최적화 제안 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">채널별 최적화 제안</h3>
            <div className="space-y-4">
              {channelMetrics.map((channel) => {
                if (channel.achievement < 80) {
                  return (
                    <div key={channel.channel} className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium capitalize">{channel.channel} 채널</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        목표 달성률이 {channel.achievement.toFixed(1)}%로 낮습니다. 
                        {channel.channel === 'blog' && '콘텐츠 주제 다양화와 SEO 최적화를 권장합니다.'}
                        {channel.channel === 'kakao' && '메시지 발송 시간대 조정과 타겟팅 개선이 필요합니다.'}
                        {channel.channel === 'instagram' && '시각적 콘텐츠 품질 향상과 해시태그 전략 재검토가 필요합니다.'}
                        {channel.channel === 'email' && '제목 A/B 테스트와 개인화 전략을 강화하세요.'}
                      </p>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </Card>

          {/* 직원 성과 개선 제안 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">직원 성과 개선 제안</h3>
            <div className="space-y-4">
              {employeePerformance
                .filter(emp => emp.completionRate < 80 || emp.quality < 3.5)
                .map((employee) => (
                  <div key={employee.id} className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium">{employee.name}</h4>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1">
                      {employee.completionRate < 80 && (
                        <li>• 작성 진행률 향상을 위한 일정 관리 지원이 필요합니다.</li>
                      )}
                      {employee.quality < 3.5 && (
                        <li>• 콘텐츠 품질 향상을 위한 교육 프로그램 참여를 권장합니다.</li>
                      )}
                    </ul>
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}