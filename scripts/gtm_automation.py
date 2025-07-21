from google.oauth2 import service_account
from googleapiclient.discovery import build
import json

class GTMAutomation:
    def __init__(self, service_account_file):
        """GTM API 자동화 클래스"""
        self.credentials = service_account.Credentials.from_service_account_file(
            service_account_file,
            scopes=['https://www.googleapis.com/auth/tagmanager.edit.containers']
        )
        self.service = build('tagmanager', 'v2', credentials=self.credentials)
        
    def setup_all_tags(self, account_id, container_id, workspace_id):
        """모든 태그 한번에 설정"""
        
        # 1. GA4 구성 태그
        ga4_config = self.create_ga4_config_tag(account_id, container_id, workspace_id)
        print(f"✅ GA4 구성 태그 생성: {ga4_config['name']}")
        
        # 2. 변수 생성
        self.create_all_variables(account_id, container_id, workspace_id)
        print("✅ 모든 변수 생성 완료")
        
        # 3. 트리거 및 태그 생성
        tags_config = [
            {
                'name': 'Phone Click',
                'event_name': 'phone_click',
                'trigger_type': 'click',
                'parameters': {
                    'phone_number': '{{Click URL}}',
                    'campaign_id': '2025-07'
                }
            },
            {
                'name': 'Quiz Complete',
                'event_name': 'quiz_complete',
                'trigger_type': 'customEvent',
                'parameters': {
                    'swing_style': '{{DLV - swing_style}}',
                    'priority': '{{DLV - priority}}',
                    'current_distance': '{{DLV - current_distance}}'
                }
            },
            {
                'name': 'Booking Submit',
                'event_name': 'booking_submit',
                'trigger_type': 'customEvent',
                'parameters': {
                    'club_interest': '{{DLV - club_interest}}',
                    'booking_date': '{{DLV - booking_date}}'
                }
            },
            {
                'name': 'Contact Submit',
                'event_name': 'contact_submit',
                'trigger_type': 'customEvent',
                'parameters': {
                    'call_times': '{{DLV - call_times}}'
                }
            }
        ]
        
        for tag_config in tags_config:
            trigger = self.create_trigger(
                account_id, container_id, workspace_id,
                tag_config['name'], tag_config['trigger_type'], tag_config['event_name']
            )
            
            tag = self.create_event_tag(
                account_id, container_id, workspace_id,
                tag_config['name'], tag_config['event_name'],
                tag_config['parameters'], trigger['triggerId']
            )
            
            print(f"✅ {tag_config['name']} 태그 및 트리거 생성 완료")
        
        print("\n🎉 모든 GTM 설정이 완료되었습니다!")
        
    def create_ga4_config_tag(self, account_id, container_id, workspace_id):
        """GA4 구성 태그 생성"""
        parent = f'accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}'
        
        tag_body = {
            'name': 'GA4 - Configuration',
            'type': 'gaawc',
            'parameter': [{
                'type': 'template',
                'key': 'measurementId',
                'value': 'G-SMJWL2TRM7'
            }],
            'firingTriggerId': ['2147479553']  # All Pages
        }
        
        return self.service.accounts().containers().workspaces().tags().create(
            parent=parent,
            body=tag_body
        ).execute()
        
    def create_trigger(self, account_id, container_id, workspace_id, name, trigger_type, event_name=None):
        """트리거 생성"""
        parent = f'accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}'
        
        if trigger_type == 'click':
            # 전화번호 클릭 트리거
            trigger_body = {
                'name': f'{name} Trigger',
                'type': 'click',
                'filter': [{
                    'type': 'startsWith',
                    'parameter': [
                        {'type': 'template', 'key': 'arg0', 'value': '{{Click URL}}'},
                        {'type': 'template', 'key': 'arg1', 'value': 'tel:'}
                    ]
                }]
            }
        else:
            # 커스텀 이벤트 트리거
            trigger_body = {
                'name': f'{name} Trigger',
                'type': 'customEvent',
                'customEventFilter': [{
                    'type': 'equals',
                    'parameter': [
                        {'type': 'template', 'key': 'arg0', 'value': '{{_event}}'},
                        {'type': 'template', 'key': 'arg1', 'value': event_name}
                    ]
                }]
            }
            
        return self.service.accounts().containers().workspaces().triggers().create(
            parent=parent,
            body=trigger_body
        ).execute()
        
    def create_event_tag(self, account_id, container_id, workspace_id, name, event_name, parameters, trigger_id):
        """이벤트 태그 생성"""
        parent = f'accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}'
        
        # 파라미터를 GTM 형식으로 변환
        event_params = []
        for param_name, param_value in parameters.items():
            event_params.append({
                'type': 'map',
                'map': [
                    {'type': 'template', 'key': 'name', 'value': param_name},
                    {'type': 'template', 'key': 'value', 'value': param_value}
                ]
            })
        
        tag_body = {
            'name': f'GA4 - {name}',
            'type': 'gaawe',
            'parameter': [
                {'type': 'template', 'key': 'eventName', 'value': event_name},
                {'type': 'list', 'key': 'eventParameters', 'list': event_params}
            ],
            'firingTriggerId': [trigger_id]
        }
        
        return self.service.accounts().containers().workspaces().tags().create(
            parent=parent,
            body=tag_body
        ).execute()
        
    def create_all_variables(self, account_id, container_id, workspace_id):
        """모든 데이터 레이어 변수 생성"""
        variables = [
            'swing_style', 'priority', 'current_distance',
            'club_interest', 'booking_date', 'call_times',
            'scroll_percentage', 'user_distance', 'mas_distance',
            'distance_increase'
        ]
        
        parent = f'accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}'
        
        for var_name in variables:
            variable_body = {
                'name': f'DLV - {var_name}',
                'type': 'v',
                'parameter': [{
                    'type': 'template',
                    'key': 'name',
                    'value': var_name
                }]
            }
            
            self.service.accounts().containers().workspaces().variables().create(
                parent=parent,
                body=variable_body
            ).execute()

# 사용 예시
if __name__ == '__main__':
    # GTM 정보 (GTM 화면에서 확인)
    ACCOUNT_ID = 'YOUR_ACCOUNT_ID'
    CONTAINER_ID = 'YOUR_CONTAINER_ID'  
    WORKSPACE_ID = 'YOUR_WORKSPACE_ID'
    
    # 서비스 계정 키 파일 경로
    SERVICE_ACCOUNT_FILE = 'path/to/service-account-key.json'
    
    # 자동화 실행
    gtm = GTMAutomation(SERVICE_ACCOUNT_FILE)
    gtm.setup_all_tags(ACCOUNT_ID, CONTAINER_ID, WORKSPACE_ID)
