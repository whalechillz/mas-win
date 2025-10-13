import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SLACK_WEBHOOK_URL_SCHEDULE_REPORT = process.env.SLACK_WEBHOOK_URL_SCHEDULE_REPORT || process.env.SLACK_WEBHOOK_URL_COMMON;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportDate, changes } = body;

    if (!SLACK_WEBHOOK_URL_SCHEDULE_REPORT) {
      console.error('Slack Webhook URL이 설정되지 않았습니다.');
      return NextResponse.json({ error: 'Slack 설정이 필요합니다.' }, { status: 500 });
    }

    // 변경사항이 없으면 알림 전송하지 않음
    if (!changes || changes.length === 0) {
      return NextResponse.json({ success: true, message: '변경사항이 없어 알림을 전송하지 않습니다.' });
    }

    // 날짜 포맷팅
    const date = new Date(reportDate);
    const formattedDate = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    // 변경사항 통계 계산
    const stats = {
      total: changes.length,
      created: changes.filter(c => c.action === 'create').length,
      updated: changes.filter(c => c.action === 'update').length,
      deleted: changes.filter(c => c.action === 'delete').length
    };

    // 직원별로 그룹화
    const changesByEmployee = changes.reduce((acc: any, change: any) => {
      const employeeName = change.employee.name;
      if (!acc[employeeName]) {
        acc[employeeName] = [];
      }
      acc[employeeName].push(change);
      return acc;
    }, {});

    // Slack 메시지 포맷
    const message = {
      username: 'MASLABS 스케줄 보고서',
      icon_emoji: ':clipboard:',
      text: `📋 [일일 스케줄 변경 보고서] - ${formattedDate}`,
      channel: '#31-gg-업무전달-매장관리-환경개선',
      attachments: [
        {
          color: '#36a64f',
          title: `📊 변경사항 요약`,
          fields: [
            {
              title: '총 변경 건수',
              value: `${stats.total}건`,
              short: true
            },
            {
              title: '생성',
              value: `${stats.created}건`,
              short: true
            },
            {
              title: '수정',
              value: `${stats.updated}건`,
              short: true
            },
            {
              title: '삭제',
              value: `${stats.deleted}건`,
              short: true
            }
          ]
        }
      ]
    };

    // 직원별 상세 정보 추가
    Object.entries(changesByEmployee).forEach(([employeeName, employeeChanges]: [string, any]) => {
      const employeeStats = {
        created: employeeChanges.filter((c: any) => c.action === 'create').length,
        updated: employeeChanges.filter((c: any) => c.action === 'update').length,
        deleted: employeeChanges.filter((c: any) => c.action === 'delete').length
      };

      const actionText = [];
      if (employeeStats.created > 0) actionText.push(`생성 ${employeeStats.created}건`);
      if (employeeStats.updated > 0) actionText.push(`수정 ${employeeStats.updated}건`);
      if (employeeStats.deleted > 0) actionText.push(`삭제 ${employeeStats.deleted}건`);

      message.attachments.push({
        color: '#ff9500',
        title: `👤 ${employeeName}`,
        fields: [
          {
            title: '변경 내용',
            value: actionText.join(', '),
            short: false
          },
          {
            title: '상세 내역',
            value: employeeChanges.map((change: any) => {
              const actionEmoji = change.action === 'create' ? '➕' : 
                                 change.action === 'update' ? '✏️' : '🗑️';
              const scheduleDate = new Date(change.schedule.schedule_date);
              const dateStr = scheduleDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
              const timeStr = change.schedule.scheduled_start ? 
                `${change.schedule.scheduled_start.substring(0, 5)}-${change.schedule.scheduled_end?.substring(0, 5)}` : 
                '시간 미정';
              return `${actionEmoji} ${dateStr} ${timeStr}`;
            }).join('\n'),
            short: false
          }
        ]
      });
    });

    // 관리자 링크 추가
    message.attachments.push({
      color: '#5865f2',
      title: '🔗 관리자 페이지',
      title_link: `${process.env.NEXT_PUBLIC_APP_URL}/admin/employee-schedules`,
      text: '스케줄 관리 페이지에서 상세 확인 및 승인 처리',
      footer: 'MASLABS 스케줄 관리 시스템',
      ts: Math.floor(Date.now() / 1000)
    });

    // Slack으로 메시지 전송
    const response = await fetch(SLACK_WEBHOOK_URL_SCHEDULE_REPORT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    return NextResponse.json({ success: true, message: '일일 스케줄 보고서가 전송되었습니다.' });

  } catch (error) {
    console.error('일일 스케줄 보고서 전송 실패:', error);
    return NextResponse.json(
      { error: '일일 스케줄 보고서 전송에 실패했습니다.' },
      { status: 500 }
    );
  }
}
