'use client';

import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Calendar, Image as ImageIcon, MessageSquare, Upload, CheckCircle, Clock, Sparkles, X } from 'lucide-react';
import PromptInspector from './PromptInspector';

interface WorkflowVisualizationProps {
  calendarData?: any;
  selectedDate?: string;
  onUpdate?: (updates: any) => void;
  onSave?: () => Promise<void>;
}

const nodeTypes = {
  custom: ({ data }: any) => (
    <div className="px-4 py-3 bg-white border-2 rounded-lg shadow-md min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        {data.icon}
        <span className="font-semibold text-gray-900">{data.label}</span>
      </div>
      {data.description && (
        <p className="text-xs text-gray-600 mt-1">{data.description}</p>
      )}
      {/* BasePrompt 노드에 요일별 템플릿 선택 드롭다운 추가 */}
      {data.showTemplateSelector && data.templates && (
        <div className="mt-2">
          <label className="sr-only" htmlFor={`template-selector-${data.label?.replace(/\s+/g, '-') || 'default'}`}>템플릿 선택</label>
          <select
            id={`template-selector-${data.label?.replace(/\s+/g, '-') || 'default'}`}
            value={data.selectedTemplate || ''}
            onChange={(e) => {
              if (data.onTemplateChange) {
                data.onTemplateChange(e.target.value);
              }
            }}
            className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
            onClick={(e) => e.stopPropagation()}
            aria-label="템플릿 선택"
          >
            <option value="">템플릿 선택...</option>
            {data.templates.map((template: string, index: number) => (
              <option key={index} value={template}>
                {template}
              </option>
            ))}
          </select>
        </div>
      )}
      {data.status && (
        <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${
          data.status === 'completed' ? 'bg-green-100 text-green-700' :
          data.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {data.status === 'completed' ? '✓ 완료' :
           data.status === 'in-progress' ? '진행 중' :
           '대기 중'}
        </div>
      )}
    </div>
  ),
};

export default function WorkflowVisualization({
  calendarData,
  selectedDate,
  onUpdate,
  onSave
}: WorkflowVisualizationProps) {
  const todayStr = selectedDate || new Date().toISOString().split('T')[0];
  const [selectedNode, setSelectedNode] = useState<{ accountType: 'account1' | 'account2', type: 'background' | 'profile' | 'feed' } | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<{ [key: string]: string }>({});
  
  // 요일 계산
  const dayOfWeek = useMemo(() => {
    const dateObj = new Date(todayStr);
    const day = dateObj.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayNames[day];
  }, [todayStr]);
  
  // 템플릿 가져오기 (동적 import)
  const templates = useMemo(() => {
    try {
      // @ts-ignore - CommonJS require
      const templates = require('../../../lib/kakao-base-prompt-templates');
      return {
        account1: templates.ACCOUNT1_TEMPLATES || {},
        account2: templates.ACCOUNT2_TEMPLATES || {}
      };
    } catch (error) {
      console.error('템플릿 로드 실패:', error);
      return { account1: {}, account2: {} };
    }
  }, []);
  
  // 요일별 템플릿 가져오기
  const getDayTemplates = useCallback((accountType: 'account1' | 'account2') => {
    const accountTemplates = accountType === 'account1' ? templates.account1 : templates.account2;
    const dayTemplates = accountTemplates[dayOfWeek as keyof typeof accountTemplates];
    return dayTemplates || accountTemplates.monday || [];
  }, [templates, dayOfWeek]);
  
  // 선택된 날짜의 데이터 가져오기
  const dateData = useMemo(() => {
    if (!calendarData) return null;
    
    const account1Schedule = calendarData.profileContent?.account1?.dailySchedule || [];
    const account2Schedule = calendarData.profileContent?.account2?.dailySchedule || [];
    const feedSchedule = calendarData.kakaoFeed?.dailySchedule || [];
    
    const account1Profile = account1Schedule.find((s: any) => s.date === todayStr);
    const account2Profile = account2Schedule.find((s: any) => s.date === todayStr);
    const feed = feedSchedule.find((s: any) => s.date === todayStr);
    
    return {
      account1: account1Profile,
      account2: account2Profile,
      feed
    };
  }, [calendarData, todayStr]);

  // 워크플로우 노드 생성
  const initialNodes: Node[] = useMemo(() => {
    const account1Templates = getDayTemplates('account1');
    const account2Templates = getDayTemplates('account2');
    
    const nodes: Node[] = [
      {
        id: 'start',
        type: 'custom',
        position: { x: 50, y: 200 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: '시작',
          icon: <Calendar className="w-5 h-5 text-blue-500" />,
          description: '콘텐츠 생성 시작',
          status: 'completed'
        }
      },
      {
        id: 'baseprompt-account1',
        type: 'custom',
        position: { x: 300, y: 100 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: 'Account1 BasePrompt',
          icon: <MessageSquare className="w-5 h-5 text-yellow-500" />,
          description: '요일별 템플릿 선택',
          status: dateData?.account1?.background?.basePrompt ? 'completed' : 'pending',
          showTemplateSelector: true,
          templates: account1Templates,
          selectedTemplate: selectedTemplates['baseprompt-account1'] || dateData?.account1?.background?.basePrompt || '',
          onTemplateChange: (template: string) => {
            setSelectedTemplates(prev => ({ ...prev, 'baseprompt-account1': template }));
          }
        }
      },
      {
        id: 'baseprompt-account2',
        type: 'custom',
        position: { x: 300, y: 300 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: 'Account2 BasePrompt',
          icon: <MessageSquare className="w-5 h-5 text-gray-500" />,
          description: '요일별 템플릿 선택',
          status: dateData?.account2?.background?.basePrompt ? 'completed' : 'pending',
          showTemplateSelector: true,
          templates: account2Templates,
          selectedTemplate: selectedTemplates['baseprompt-account2'] || dateData?.account2?.background?.basePrompt || '',
          onTemplateChange: (template: string) => {
            setSelectedTemplates(prev => ({ ...prev, 'baseprompt-account2': template }));
          }
        }
      },
      {
        id: 'prompt-generation-account1',
        type: 'custom',
        position: { x: 600, y: 100 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: 'Account1 프롬프트 생성',
          icon: <Sparkles className="w-5 h-5 text-purple-500" />,
          description: 'AI 기반 상세 프롬프트',
          status: dateData?.account1?.background?.prompt ? 'completed' : 'pending'
        }
      },
      {
        id: 'prompt-generation-account2',
        type: 'custom',
        position: { x: 600, y: 300 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: 'Account2 프롬프트 생성',
          icon: <Sparkles className="w-5 h-5 text-purple-500" />,
          description: 'AI 기반 상세 프롬프트',
          status: dateData?.account2?.background?.prompt ? 'completed' : 'pending'
        }
      },
      {
        id: 'image-generation-account1',
        type: 'custom',
        position: { x: 900, y: 100 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: 'Account1 이미지 생성',
          icon: <ImageIcon className="w-5 h-5 text-green-500" />,
          description: 'FAL AI 이미지 생성',
          status: dateData?.account1?.background?.imageUrl ? 'completed' : 'pending'
        }
      },
      {
        id: 'image-generation-account2',
        type: 'custom',
        position: { x: 900, y: 300 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: 'Account2 이미지 생성',
          icon: <ImageIcon className="w-5 h-5 text-green-500" />,
          description: 'FAL AI 이미지 생성',
          status: dateData?.account2?.background?.imageUrl ? 'completed' : 'pending'
        }
      },
      {
        id: 'feed-generation',
        type: 'custom',
        position: { x: 600, y: 500 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: '피드 콘텐츠 생성',
          icon: <MessageSquare className="w-5 h-5 text-indigo-500" />,
          description: '피드 이미지 및 캡션',
          status: dateData?.feed?.account1?.imageUrl || dateData?.feed?.account2?.imageUrl ? 'completed' : 'pending'
        }
      },
      {
        id: 'deployment',
        type: 'custom',
        position: { x: 1200, y: 200 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: '배포',
          icon: <Upload className="w-5 h-5 text-red-500" />,
          description: '카카오톡 업로드',
          status: dateData?.account1?.status === 'published' || dateData?.account2?.status === 'published' ? 'completed' : 'pending'
        }
      },
      {
        id: 'complete',
        type: 'custom',
        position: { x: 1500, y: 200 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: '완료',
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          description: '콘텐츠 배포 완료',
          status: dateData?.account1?.status === 'published' && dateData?.account2?.status === 'published' ? 'completed' : 'pending'
        }
      }
    ];
    
    return nodes;
  }, [dateData, selectedTemplates, getDayTemplates]);

  // 워크플로우 엣지 생성
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    
    // 노드 ID 목록 (존재 확인용)
    const nodeIds = ['start', 'baseprompt-account1', 'baseprompt-account2', 'prompt-generation-account1', 
                     'prompt-generation-account2', 'image-generation-account1', 'image-generation-account2', 
                     'feed-generation', 'deployment', 'complete'];
    
    // Edge 정의
    const edgeDefinitions = [
      {
        id: 'e1',
        source: 'start',
        target: 'baseprompt-account1',
        animated: dateData?.account1?.background?.basePrompt ? true : false,
      },
      {
        id: 'e2',
        source: 'start',
        target: 'baseprompt-account2',
        animated: dateData?.account2?.background?.basePrompt ? true : false,
      },
      {
        id: 'e3',
        source: 'baseprompt-account1',
        target: 'prompt-generation-account1',
        animated: dateData?.account1?.background?.prompt ? true : false,
      },
      {
        id: 'e4',
        source: 'baseprompt-account2',
        target: 'prompt-generation-account2',
        animated: dateData?.account2?.background?.prompt ? true : false,
      },
      {
        id: 'e5',
        source: 'prompt-generation-account1',
        target: 'image-generation-account1',
        animated: dateData?.account1?.background?.imageUrl ? true : false,
      },
      {
        id: 'e6',
        source: 'prompt-generation-account2',
        target: 'image-generation-account2',
        animated: dateData?.account2?.background?.imageUrl ? true : false,
      },
      {
        id: 'e7',
        source: 'image-generation-account1',
        target: 'deployment',
        animated: dateData?.account1?.status === 'published' ? true : false,
      },
      {
        id: 'e8',
        source: 'image-generation-account2',
        target: 'deployment',
        animated: dateData?.account2?.status === 'published' ? true : false,
      },
      {
        id: 'e9',
        source: 'prompt-generation-account1',
        target: 'feed-generation',
        animated: dateData?.feed?.account1?.imageUrl ? true : false,
      },
      {
        id: 'e10',
        source: 'prompt-generation-account2',
        target: 'feed-generation',
        animated: dateData?.feed?.account2?.imageUrl ? true : false,
      },
      {
        id: 'e11',
        source: 'feed-generation',
        target: 'deployment',
        animated: dateData?.feed?.account1?.imageUrl || dateData?.feed?.account2?.imageUrl ? true : false,
      },
      {
        id: 'e12',
        source: 'deployment',
        target: 'complete',
        animated: dateData?.account1?.status === 'published' && dateData?.account2?.status === 'published' ? true : false,
      }
    ];
    
    // 노드 존재 확인 후 Edge 추가
    edgeDefinitions.forEach(edge => {
      if (nodeIds.includes(edge.source) && nodeIds.includes(edge.target)) {
        edges.push({
          ...edge,
          sourceHandle: 'right', // 명시적으로 source handle 지정
          targetHandle: 'left',  // 명시적으로 target handle 지정
          markerEnd: { type: MarkerType.ArrowClosed },
          style: {
            stroke: edge.animated ? '#3b82f6' : '#9ca3af',
            strokeWidth: 2,
          },
        });
      }
    });
    
    return edges;
  }, [dateData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // 노드 ID에 따라 accountType과 type 결정
    if (node.id.includes('account1')) {
      if (node.id.includes('baseprompt-account1') || node.id.includes('prompt-generation-account1') || node.id.includes('image-generation-account1')) {
        setSelectedNode({ accountType: 'account1', type: 'background' });
      }
    } else if (node.id.includes('account2')) {
      if (node.id.includes('baseprompt-account2') || node.id.includes('prompt-generation-account2') || node.id.includes('image-generation-account2')) {
        setSelectedNode({ accountType: 'account2', type: 'background' });
      }
    } else if (node.id === 'feed-generation') {
      setSelectedNode({ accountType: 'account1', type: 'feed' });
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="w-full h-[600px] border border-gray-200 rounded-lg bg-gray-50">
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">워크플로우 시각화</h3>
              <p className="text-sm text-gray-600 mt-1">날짜: {todayStr} | 노드를 클릭하면 프롬프트 생성 과정을 확인할 수 있습니다</p>
            </div>
            {selectedNode && (
              <button
                onClick={() => setSelectedNode(null)}
                className="p-2 hover:bg-gray-100 rounded"
                title="닫기"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>

      {/* 프롬프트 인스펙터 */}
      {selectedNode && (
        <PromptInspector
          calendarData={calendarData}
          selectedDate={selectedDate}
          accountType={selectedNode.accountType}
          type={selectedNode.type}
          onUpdate={onUpdate}
          onSave={onSave}
        />
      )}
    </div>
  );
}





