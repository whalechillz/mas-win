import { NextRequest, NextResponse } from 'next/server';

const SLACK_WEBHOOK_URL_COMMON = process.env.SLACK_WEBHOOK_URL_COMMON;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schedule, employee, action, managerName } = body;

    if (!SLACK_WEBHOOK_URL_COMMON) {
      console.error('Slack Webhook URL이 설정되지 않았습니다.');
      return NextResponse.json({ error: 'Slack 설정이 필요합니다.' }, { status: 500 });
    }

    // 액션에 따른 메시지 설정
    let actionText = '';
    let actionEmoji = '';
    let color = '#36a64f';

    switch (action) {
      case 'create':
        actionText = '새로운 스케줄 등록';
        actionEmoji = '📅';
        color = '#36a64f';
        break;
      case 'update':
        actionText = '스케줄 수정';
        actionEmoji = '✏️';
        color = '#ff9500';
        break;
      case 'delete':
        actionText = '스케줄 삭제';
        actionEmoji = '🗑️';
        color = '#ff3b30';
        break;
      default:
        actionText = '스케줄 변경';
        actionEmoji = '📋';
    }

    // 날짜 포맷팅
    const scheduleDate = new Date(schedule.schedule_date);
    const formattedDate = scheduleDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    // 시간 포맷팅
    const formatTime = (time: string) => {
      if (!time) return '-';
      return time.substring(0, 5); // HH:MM 형식으로 변환
    };

    // Slack 메시지 포맷
    const message = {
      username: 'MASLABS 스케줄봇',
      icon_emoji: ':calendar:',
      text: `${actionEmoji} ${actionText} - ${employee.name}`,
      attachments: [
        {
          color: color,
          title: `${formattedDate} 스케줄 ${actionText}`,
          title_link: `${process.env.NEXT_PUBLIC_APP_URL}/admin/employee-schedules`,
          fields: [
            {
              title: '직원',
              value: `${employee.name} (${employee.employee_id})`,
              short: true
            },
            {
              title: '날짜',
              value: formattedDate,
              short: true
            },
            {
              title: '시작 시간',
              value: formatTime(schedule.scheduled_start),
              short: true
            },
            {
              title: '종료 시간',
              value: formatTime(schedule.scheduled_end),
              short: true
            },
            {
              title: '상태',
              value: schedule.status === 'pending' ? '대기 중' : 
                     schedule.status === 'approved' ? '승인됨' : 
                     schedule.status === 'completed' ? '완료됨' : '취소됨',
              short: true
            },
            {
              title: '메모',
              value: schedule.employee_note || '없음',
              short: false
            }
          ],
          footer: `MASLABS 스케줄 관리 시스템 | 관리자: ${managerName || '김탁수'}`,
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    // Slack으로 메시지 전송
    const response = await fetch(SLACK_WEBHOOK_URL_COMMON, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    return NextResponse.json({ success: true, message: '스케줄 알림이 전송되었습니다.' });

  } catch (error) {
    console.error('스케줄 알림 전송 실패:', error);
    return NextResponse.json(
      { error: '스케줄 알림 전송에 실패했습니다.' },
      { status: 500 }
    );
  }
}
