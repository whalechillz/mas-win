import { NextRequest, NextResponse } from 'next/server';

const SLACK_WEBHOOK_URL_MASGOLF = process.env.SLACK_WEBHOOK_URL_MASGOLF;
const SLACK_WEBHOOK_URL_SINGSINGOLF = process.env.SLACK_WEBHOOK_URL_SINGSINGOLF;
const SLACK_WEBHOOK_URL_COMMON = process.env.SLACK_WEBHOOK_URL_COMMON;
const SLACK_WEBHOOK_URL_01_MA_OP = process.env.SLACK_WEBHOOK_URL_01_MA_OP; // OP5용 01-ma-op 채널
const SLACK_CHANNEL_ID = 'C04DEABHEM8'; // 지정된 채널 ID

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, employee, op10Category, isUpdate } = body;

    // 업무 유형에 따라 다른 Webhook URL 사용
    let targetWebhookUrl: string | undefined;

    if (task.operation_type?.code === 'OP5') {
      // OP5는 01-ma-op 채널로 전송
      targetWebhookUrl = SLACK_WEBHOOK_URL_01_MA_OP;
    } else if (task.operation_type?.code === 'OP10') {
      // OP10은 카테고리에 따라 다른 Webhook URL 사용
      switch (op10Category) {
        case 'masgolf':
          targetWebhookUrl = SLACK_WEBHOOK_URL_MASGOLF;
          break;
        case 'singsingolf':
          targetWebhookUrl = SLACK_WEBHOOK_URL_SINGSINGOLF;
          break;
        case 'common':
        default:
          targetWebhookUrl = SLACK_WEBHOOK_URL_COMMON;
          break;
      }
    } else {
      // 기타 업무는 공통 Webhook URL 사용
      targetWebhookUrl = SLACK_WEBHOOK_URL_COMMON;
    }

    if (!targetWebhookUrl) {
      console.error('Slack Webhook URL이 설정되지 않았습니다.');
      return NextResponse.json({ error: 'Slack 설정이 필요합니다.' }, { status: 500 });
    }

    // Slack 메시지 포맷 (다듬어진 양식)
    const operationType = task.operation_type?.code || 'OP';
    const message = {
      username: 'MASLABS 업무봇',
      icon_emoji: ':memo:',
      text: `📋 ${isUpdate ? `${operationType} 업무 수정` : `새로운 ${operationType} 업무 등록`} - ${employee.name}`,
      attachments: [
        {
          color: '#36a64f',
          title: task.title || '제목 없음',
          title_link: `${process.env.NEXT_PUBLIC_APP_URL}/shared-tasks`,
          fields: [
            {
              title: '업무 유형',
              value: task.operation_type?.name || '-',
              short: true
            },
            {
              title: '작성자',
              value: `${employee.name} (${employee.employee_id})`,
              short: true
            },
            {
              title: '업무명',
              value: task.title || '-',
              short: false
            },
            {
              title: '업무 내용',
              value: task.notes ? (task.notes.length > 200 ? task.notes.substring(0, 200) + '...' : task.notes) : '내용 없음',
              short: false
            },
            {
              title: '고객명',
              value: task.customer_name || '없음',
              short: true
            }
          ],
          footer: 'MASLABS 업무 관리 시스템',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    // Slack으로 메시지 전송
    const response = await fetch(targetWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    return NextResponse.json({ success: true, message: 'Slack 알림이 전송되었습니다.' });

  } catch (error) {
    console.error('Slack 알림 전송 실패:', error);
    return NextResponse.json(
      { error: 'Slack 알림 전송에 실패했습니다.' },
      { status: 500 }
    );
  }
}
