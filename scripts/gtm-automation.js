const { google } = require('googleapis');
const tagmanager = google.tagmanager('v2');

// 서비스 계정 인증
const auth = new google.auth.GoogleAuth({
  keyFile: './service-account-key.json',
  scopes: ['https://www.googleapis.com/auth/tagmanager.edit.containers']
});

// GTM 설정 자동화 함수
async function setupGTMAutomatically() {
  const authClient = await auth.getClient();
  google.options({ auth: authClient });
  
  const accountId = 'YOUR_ACCOUNT_ID'; // GTM 계정 ID
  const containerId = 'YOUR_CONTAINER_ID'; // GTM 컨테이너 ID
  const workspaceId = 'YOUR_WORKSPACE_ID'; // 작업공간 ID
  
  try {
    // 1. GA4 구성 태그 생성
    const ga4ConfigTag = await createGA4ConfigTag(accountId, containerId, workspaceId);
    console.log('GA4 구성 태그 생성 완료:', ga4ConfigTag.name);
    
    // 2. 전화번호 클릭 추적 설정
    const phoneClickTrigger = await createPhoneClickTrigger(accountId, containerId, workspaceId);
    const phoneClickTag = await createPhoneClickTag(accountId, containerId, workspaceId, phoneClickTrigger.triggerId);
    console.log('전화번호 클릭 추적 설정 완료');
    
    // 3. 퀴즈 완료 추적 설정
    const quizCompleteTrigger = await createQuizCompleteTrigger(accountId, containerId, workspaceId);
    const quizCompleteTag = await createQuizCompleteTag(accountId, containerId, workspaceId, quizCompleteTrigger.triggerId);
    console.log('퀴즈 완료 추적 설정 완료');
    
    // 4. 변수 생성
    await createDataLayerVariables(accountId, containerId, workspaceId);
    console.log('데이터 레이어 변수 생성 완료');
    
  } catch (error) {
    console.error('GTM 설정 중 오류:', error);
  }
}

// GA4 구성 태그 생성
async function createGA4ConfigTag(accountId, containerId, workspaceId) {
  const response = await tagmanager.accounts.containers.workspaces.tags.create({
    parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
    requestBody: {
      name: 'GA4 - Configuration',
      type: 'gaawc', // Google Analytics 4 Configuration
      parameter: [{
        type: 'template',
        key: 'measurementId',
        value: 'G-SMJWL2TRM7'
      }],
      firingTriggerId: ['2147479553'] // All Pages trigger
    }
  });
  return response.data;
}

// 전화번호 클릭 트리거 생성
async function createPhoneClickTrigger(accountId, containerId, workspaceId) {
  const response = await tagmanager.accounts.containers.workspaces.triggers.create({
    parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
    requestBody: {
      name: 'Phone Click Trigger',
      type: 'click',
      filter: [{
        type: 'startsWith',
        parameter: [{
          type: 'template',
          key: 'arg0',
          value: '{{Click URL}}'
        }, {
          type: 'template',
          key: 'arg1',
          value: 'tel:'
        }]
      }]
    }
  });
  return response.data;
}

// 전화번호 클릭 태그 생성
async function createPhoneClickTag(accountId, containerId, workspaceId, triggerId) {
  const response = await tagmanager.accounts.containers.workspaces.tags.create({
    parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
    requestBody: {
      name: 'GA4 - Phone Click',
      type: 'gaawe', // Google Analytics 4 Event
      parameter: [
        {
          type: 'template',
          key: 'eventName',
          value: 'phone_click'
        },
        {
          type: 'list',
          key: 'eventParameters',
          list: [
            {
              type: 'map',
              map: [
                { type: 'template', key: 'name', value: 'phone_number' },
                { type: 'template', key: 'value', value: '{{Click URL}}' }
              ]
            },
            {
              type: 'map',
              map: [
                { type: 'template', key: 'name', value: 'campaign_id' },
                { type: 'template', key: 'value', value: '2025-07' }
              ]
            }
          ]
        }
      ],
      firingTriggerId: [triggerId]
    }
  });
  return response.data;
}

// 퀴즈 완료 트리거 생성
async function createQuizCompleteTrigger(accountId, containerId, workspaceId) {
  const response = await tagmanager.accounts.containers.workspaces.triggers.create({
    parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
    requestBody: {
      name: 'Quiz Complete Trigger',
      type: 'customEvent',
      customEventFilter: [{
        type: 'equals',
        parameter: [{
          type: 'template',
          key: 'arg0',
          value: '{{_event}}'
        }, {
          type: 'template',
          key: 'arg1',
          value: 'quiz_complete'
        }]
      }]
    }
  });
  return response.data;
}

// 퀴즈 완료 태그 생성
async function createQuizCompleteTag(accountId, containerId, workspaceId, triggerId) {
  const response = await tagmanager.accounts.containers.workspaces.tags.create({
    parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
    requestBody: {
      name: 'GA4 - Quiz Complete',
      type: 'gaawe',
      parameter: [
        {
          type: 'template',
          key: 'eventName',
          value: 'quiz_complete'
        },
        {
          type: 'list',
          key: 'eventParameters',
          list: [
            {
              type: 'map',
              map: [
                { type: 'template', key: 'name', value: 'swing_style' },
                { type: 'template', key: 'value', value: '{{DLV - swing_style}}' }
              ]
            },
            {
              type: 'map',
              map: [
                { type: 'template', key: 'name', value: 'priority' },
                { type: 'template', key: 'value', value: '{{DLV - priority}}' }
              ]
            },
            {
              type: 'map',
              map: [
                { type: 'template', key: 'name', value: 'current_distance' },
                { type: 'template', key: 'value', value: '{{DLV - current_distance}}' }
              ]
            }
          ]
        }
      ],
      firingTriggerId: [triggerId]
    }
  });
  return response.data;
}

// 데이터 레이어 변수 생성
async function createDataLayerVariables(accountId, containerId, workspaceId) {
  const variables = [
    { name: 'DLV - swing_style', dataLayerVariableName: 'swing_style' },
    { name: 'DLV - priority', dataLayerVariableName: 'priority' },
    { name: 'DLV - current_distance', dataLayerVariableName: 'current_distance' },
    { name: 'DLV - club_interest', dataLayerVariableName: 'club_interest' },
    { name: 'DLV - booking_date', dataLayerVariableName: 'booking_date' },
    { name: 'DLV - call_times', dataLayerVariableName: 'call_times' },
    { name: 'DLV - scroll_percentage', dataLayerVariableName: 'scroll_percentage' },
    { name: 'DLV - user_distance', dataLayerVariableName: 'user_distance' },
    { name: 'DLV - mas_distance', dataLayerVariableName: 'mas_distance' },
    { name: 'DLV - distance_increase', dataLayerVariableName: 'distance_increase' }
  ];
  
  for (const variable of variables) {
    await tagmanager.accounts.containers.workspaces.variables.create({
      parent: `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
      requestBody: {
        name: variable.name,
        type: 'v', // Data Layer Variable
        parameter: [{
          type: 'template',
          key: 'name',
          value: variable.dataLayerVariableName
        }]
      }
    });
  }
}

// 실행
setupGTMAutomatically();
