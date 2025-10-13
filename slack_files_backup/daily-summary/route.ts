import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SLACK_WEBHOOK_URL_01_MA_OP = process.env.SLACK_WEBHOOK_URL_01_MA_OP;

export async function POST(request: NextRequest) {
  try {
    // 오늘 날짜 (한국 시간 기준)
    const koreaDate = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
    const today = koreaDate.toISOString().split('T')[0];
    
    // 이번 달 시작일과 종료일
    const startOfMonth = new Date(koreaDate.getFullYear(), koreaDate.getMonth(), 1);
    const endOfMonth = new Date(koreaDate.getFullYear(), koreaDate.getMonth() + 1, 0);
    
    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = endOfMonth.toISOString().split('T')[0];
    
    console.log(`📊 일일 요약 생성 중... (${today})`);
    
    // 1. 실시간 순위 데이터 가져오기
    const { data: allTasks, error: tasksError } = await supabase
      .from('employee_tasks')
      .select(`
        *,
        operation_type:operation_types(code, name, points),
        employee:employees(name, employee_id)
      `)
      .gte('task_date', startDate)
      .lte('task_date', endDate);
    
    if (tasksError) {
      console.error('업무 데이터 로드 실패:', tasksError);
      return NextResponse.json({ error: '데이터 로드 실패' }, { status: 500 });
    }
    
    // 2. 팀원별 통계 계산
    const employeeStats = new Map();
    
    allTasks?.forEach(task => {
      const employeeId = task.employee_id;
      const employeeName = task.employee?.name || '알 수 없음';
      const employeeCode = task.employee?.employee_id || '';
      
      if (!employeeStats.has(employeeId)) {
        employeeStats.set(employeeId, {
          name: employeeName,
          employee_id: employeeCode,
          totalSales: 0,
          totalPoints: 0,
          totalTasks: 0,
          masgolfSales: 0,
          masgolfPoints: 0,
          masgolfTasks: 0,
          singsingolfSales: 0,
          singsingolfPoints: 0,
          singsingolfTasks: 0
        });
      }
      
      const stats = employeeStats.get(employeeId);
      const opCode = task.operation_type?.code || '';
      const points = task.operation_type?.points || 0;
      const sales = task.sales_amount || 0;
      
      // 전체 통계
      stats.totalSales += sales;
      stats.totalPoints += points;
      stats.totalTasks += 1;
      
      // 마스골프 통계 (OP1-OP10, OP10은 op10Category 확인)
      if (['OP1', 'OP2', 'OP3', 'OP4', 'OP5', 'OP6', 'OP7', 'OP8', 'OP9'].includes(opCode) ||
          (opCode === 'OP10' && (task.op10Category === 'masgolf' || !task.op10Category))) {
        stats.masgolfSales += sales;
        stats.masgolfPoints += points;
        stats.masgolfTasks += 1;
      }
      
      // 싱싱골프 통계 (OP11-OP12, OP10 중 싱싱골프)
      if (['OP11', 'OP12'].includes(opCode) ||
          (opCode === 'OP10' && task.op10Category === 'singsingolf')) {
        stats.singsingolfSales += sales;
        stats.singsingolfPoints += points;
        stats.singsingolfTasks += 1;
      }
    });
    
    // 3. 순위 계산
    const rankings = {
      sales: Array.from(employeeStats.values())
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 3),
      points: Array.from(employeeStats.values())
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 3),
      tasks: Array.from(employeeStats.values())
        .sort((a, b) => b.totalTasks - a.totalTasks)
        .slice(0, 3)
    };
    
    // 4. 협업 성과 계산
    const collaborationStats = {
      masgolf: {
        sales: Array.from(employeeStats.values()).reduce((sum, emp) => sum + emp.masgolfSales, 0),
        points: Array.from(employeeStats.values()).reduce((sum, emp) => sum + emp.masgolfPoints, 0),
        tasks: Array.from(employeeStats.values()).reduce((sum, emp) => sum + emp.masgolfTasks, 0)
      },
      singsingolf: {
        sales: Array.from(employeeStats.values()).reduce((sum, emp) => sum + emp.singsingolfSales, 0),
        points: Array.from(employeeStats.values()).reduce((sum, emp) => sum + emp.singsingolfPoints, 0),
        tasks: Array.from(employeeStats.values()).reduce((sum, emp) => sum + emp.singsingolfTasks, 0)
      }
    };
    
    // 5. 신규 상담 통계 (OP5, OP12)
    const newConsultations = allTasks?.filter(task => {
      const opCode = task.operation_type?.code || '';
      return (opCode === 'OP5' || opCode === 'OP12') && task.customer_type === 'new';
    }).length || 0;
    
    // 6. 슬랙 메시지 생성
    const message = {
      username: 'MASLABS 일일 요약봇',
      icon_emoji: ':bar_chart:',
      text: `📊 ${koreaDate.getMonth() + 1}월 ${koreaDate.getDate()}일 일일 성과 요약`,
      attachments: [
        {
          color: '#36a64f',
          title: '🏆 실시간 순위',
          fields: [
            {
              title: '💰 매출 1위',
              value: rankings.sales[0] ? `${rankings.sales[0].name} - ₩${rankings.sales[0].totalSales.toLocaleString()}` : '데이터 없음',
              short: true
            },
            {
              title: '🎯 포인트 1위',
              value: rankings.points[0] ? `${rankings.points[0].name} - ${rankings.points[0].totalPoints}점` : '데이터 없음',
              short: true
            },
            {
              title: '📋 업무 건수 1위',
              value: rankings.tasks[0] ? `${rankings.tasks[0].name} - ${rankings.tasks[0].totalTasks}건` : '데이터 없음',
              short: true
            }
          ]
        },
        {
          color: '#2eb886',
          title: '🤝 협업 성과',
          fields: [
            {
              title: '🏌️ 마스골프 성과',
              value: `매출: ₩${collaborationStats.masgolf.sales.toLocaleString()}\n포인트: ${collaborationStats.masgolf.points}점\n업무: ${collaborationStats.masgolf.tasks}건`,
              short: true
            },
            {
              title: '⛳ 싱싱골프 성과',
              value: `매출: ₩${collaborationStats.singsingolf.sales.toLocaleString()}\n포인트: ${collaborationStats.singsingolf.points}점\n업무: ${collaborationStats.singsingolf.tasks}건`,
              short: true
            },
            {
              title: '📞 신규 상담',
              value: `${newConsultations}건`,
              short: true
            }
          ]
        }
      ],
      footer: 'MASLABS 업무 관리 시스템',
      ts: Math.floor(Date.now() / 1000)
    };
    
    // 7. 슬랙으로 메시지 전송
    if (!SLACK_WEBHOOK_URL_01_MA_OP) {
      console.error('SLACK_WEBHOOK_URL_01_MA_OP 환경변수가 설정되지 않았습니다.');
      return NextResponse.json({ error: 'Slack 설정이 필요합니다.' }, { status: 500 });
    }
    
    const response = await fetch(SLACK_WEBHOOK_URL_01_MA_OP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }
    
    console.log('✅ 일일 요약 슬랙 메시지 전송 완료');
    
    return NextResponse.json({ 
      success: true, 
      message: '일일 요약이 전송되었습니다.',
      data: {
        date: today,
        rankings,
        collaborationStats,
        newConsultations
      }
    });
    
  } catch (error) {
    console.error('일일 요약 생성 실패:', error);
    return NextResponse.json(
      { error: '일일 요약 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
