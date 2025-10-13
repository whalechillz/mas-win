'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, auth, db } from '@/lib/supabase';
import { formatDateKR, formatDateISO } from '@/utils/dateUtils';
import { getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor } from '@/utils/formatUtils';
import { 
  BarChart3, Plus, ChevronLeft, Filter, Award, Target,
  Clock, CheckCircle, AlertCircle, TrendingUp, Edit, Trash2, DollarSign, RotateCcw,
  Phone, ShoppingCart, Store, Headphones, Shield, Truck, Package, Coffee, Users,
  ToggleLeft, ToggleRight, Trophy
} from 'lucide-react';

interface OperationType {
  id: string;
  code: string;
  name: string;
  category: string;
  points: number;
  target_roles?: string[];
}

interface Task {
  id: string;
  employee_id: string;
  operation_type_id: string;
  title: string;
  notes?: string;
  memo?: string;
  task_time?: string;
  customer_name?: string;
  sales_amount?: number;
  performer_id?: string;
  achievement_status?: string;
  task_priority?: string;
  task_date?: string;
  // 신규 상담 구분을 위한 필드 추가
  customer_type?: 'new' | 'existing'; // 신규/기존 고객
  consultation_channel?: 'phone' | 'kakao' | 'smartstore' | 'official_website'; // 상담 채널
  op10Category?: 'masgolf' | 'singsingolf' | 'common'; // OP10 업무 분류
  sita_booking?: boolean; // 방문 예약 여부
  visit_booking_date?: string; // 방문 예약 날짜
  visit_booking_time?: string; // 방문 예약 시간
  created_at: string;
  updated_at: string;
  operation_type?: {
    id: string;
    code: string;
    name: string;
    points: number;
    description: string;
  };
}

export default function TasksPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filter, setFilter] = useState('all');
  const [selectedOperationType, setSelectedOperationType] = useState<OperationType | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundTargetTask, setRefundTargetTask] = useState<Task | null>(null);

  const [showQuickTaskForm, setShowQuickTaskForm] = useState(false);
  const [quickTaskData, setQuickTaskData] = useState({
    operation_type_id: '',
    title: '',
    customer_name: '',
    sales_amount: 0,
    notes: '',
    customer_type: 'new' as 'new' | 'existing',
    consultation_channel: 'phone' as 'phone' | 'kakao' | 'smartstore' | 'official_website',
    op10Category: 'common' as 'masgolf' | 'singsingolf' | 'common',
    task_priority: 'normal' as 'urgent' | 'high' | 'normal' | 'low',
    sita_booking: false,
    visit_booking_date: '',
    visit_booking_time: ''
  });
  const [slackNotificationEnabled, setSlackNotificationEnabled] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalPoints: 0,
    totalSales: 0,
    todaySales: 0,
    todayPoints: 0,
    todayTaskCount: 0,
    pendingTasks: 0,
    completedTasks: 0,
    refundedTasks: 0,
    // 환불 통계 분리
    salesTasks: 0,
    salesPoints: 0,
    salesAmount: 0,
    refundTasks: 0,
    refundPoints: 0,
    refundAmount: 0,
    netPoints: 0,
    netSales: 0
  });

  useEffect(() => {
    loadTasksData();
  }, [selectedMonth, filter]);

  // 퀵 테스크 관련 함수들
  const getOperationIcon = (code: string) => {
    const iconMap: { [key: string]: any } = {
      'OP1': Phone,
      'OP2': Phone,
      'OP3': Store,
      'OP4': Store,
      'OP5': Headphones,
      'OP6': Shield,
      'OP7': Shield,
      'OP9': Truck,
      'OP10': Package,
      'OP11': Phone,  // 전화 판매(싱싱)
      'OP12': Headphones  // CS 응대(싱싱)
    };
    return iconMap[code] || Coffee;
  };

  const getOperationDisplayName = (code: string, originalName: string): string => {
    const displayNames: { [key: string]: string } = {
      'OP5': 'CS 응대 (제품안내, 시타보조) [신규/기존]',
      'OP9': '상품 택배, 인트라넷',
      'OP10': '내부전달, 택배, 환경개선',
      'OP12': 'CS 응대 (제품안내, 견적) [신규/기존]'
    };
    return displayNames[code] || originalName;
  };

  const getDefaultTitle = (code: string): string => {
    const defaultTitles: { [key: string]: string } = {
      'OP1': '전화 판매(신규)',
      'OP2': '전화 판매(재구매/부품)',
      'OP3': '오프라인 판매(신규)',
      'OP4': '오프라인 판매(재구매/부품)',
      'OP5': 'CS 응대(제품안내, 시타보조)',
      'OP6': 'A/S 처리(고급)',
      'OP7': '환불 방어',
      'OP9': '상품 택배, 인트라넷',
      'OP10': '내부전달, 택배, 환경개선',
      'OP11': '전화 판매(싱싱)',
      'OP12': 'CS 응대(제품안내, 견적)'
    };
    return defaultTitles[code] || '';
  };

  const handleQuickTaskSelect = (opType: OperationType) => {
    setQuickTaskData(prev => ({
      ...prev,
      operation_type_id: opType.id,
      title: getDefaultTitle(opType.code), // 각 업무 유형에 맞는 기본 제목 설정
      customer_name: '',
      sales_amount: 0,
      notes: '',
      customer_type: 'new',
      consultation_channel: 'phone',
      op10Category: 'common',
      sita_booking: false,
      visit_booking_date: '',
      visit_booking_time: ''
    }));
    setShowQuickTaskForm(true);
  };

  // Slack 알림 전송 함수
  const sendSlackNotification = async (taskData: any, operationType: any, isUpdate: boolean = false) => {
    if (!slackNotificationEnabled) return;

    try {
      await fetch('/api/slack/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: {
            title: taskData.title,
            notes: taskData.notes,
            customer_name: taskData.customer_name,
            operation_type: {
              code: operationType.code,
              name: getOperationDisplayName(operationType.code, operationType.name),
              points: operationType.points
            }
          },
          employee: {
            name: currentUser.name,
            employee_id: currentUser.employee_id
          },
          op10Category: taskData.op10Category || 'common',
          isUpdate: isUpdate
        }),
      });
    } catch (slackError) {
      console.error('Slack 알림 전송 실패:', slackError);
      // Slack 알림 실패는 업무 등록/수정을 막지 않음
    }
  };

  const handleQuickTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('employee_tasks')
        .insert({
          employee_id: currentUser.id,
          operation_type_id: quickTaskData.operation_type_id,
          title: quickTaskData.title,
          customer_name: quickTaskData.customer_name,
          sales_amount: quickTaskData.sales_amount,
          notes: quickTaskData.notes,
          customer_type: quickTaskData.customer_type,
          consultation_channel: quickTaskData.consultation_channel,
          task_priority: quickTaskData.task_priority,
          sita_booking: quickTaskData.sita_booking,
          visit_booking_date: quickTaskData.visit_booking_date || null,
          visit_booking_time: quickTaskData.visit_booking_time || null,
          // 한국 시간 기준으로 오늘 날짜 계산
          task_date: (() => {
            const koreaDate = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
            return koreaDate.toISOString().split('T')[0];
          })()
        });

      if (error) throw error;

      // OP5, OP10 업무인 경우 Slack 알림 전송
      const selectedOpType = operationTypes.find(op => op.id === quickTaskData.operation_type_id);
      if (selectedOpType?.code === 'OP5' || selectedOpType?.code === 'OP10') {
        await sendSlackNotification(quickTaskData, selectedOpType, false);
      }

      // 성공 후 폼 초기화 및 데이터 새로고침
      setShowQuickTaskForm(false);
        setQuickTaskData({
          operation_type_id: '',
          title: '',
          customer_name: '',
          sales_amount: 0,
          notes: '',
          customer_type: 'new',
          consultation_channel: 'phone',
          op10Category: 'common',
          task_priority: 'normal',
          sita_booking: false,
          visit_booking_date: '',
          visit_booking_time: ''
        });
      loadTasksData();
    } catch (error) {
      console.error('퀵 테스크 등록 실패:', error);
    }
  };

  const loadTasksData = async () => {
    try {
      setLoading(true);
      
      // 현재 사용자 로드
      const user = await auth.getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      
      // 업무 유형 데이터 로드
      const { data: operationTypesData, error: opError } = await supabase
        .from('operation_types')
        .select('*')
        .order('code');

      if (opError) {
        console.error('업무 유형 로드 실패:', opError);
        return;
      }

      // 수정된 정렬 로직: OP 코드의 숫자 부분을 추출하여 정렬
      const sortedOperationTypes = operationTypesData.sort((a, b) => {
        const aNum = parseInt(a.code.replace('OP', ''));
        const bNum = parseInt(b.code.replace('OP', ''));
        return aNum - bNum;
      });

      setOperationTypes(sortedOperationTypes);

      // 선택된 월의 시작일과 종료일 계산
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      const startDateStr = startOfMonth.toISOString().split('T')[0];
      const endDateStr = endOfMonth.toISOString().split('T')[0];

      // 업무 데이터 로드 (선택된 월로 필터링, task_date 기준)
      const { data: tasksData, error: tasksError } = await supabase
        .from('employee_tasks')
        .select(`
          *,
          operation_type:operation_types(*)
        `)
        .eq('employee_id', user.id)
        .gte('task_date', startDateStr)
        .lte('task_date', endDateStr)
        .order('task_date', { ascending: false });

      if (tasksError) {
        console.error('업무 데이터 로드 실패:', tasksError);
        return;
      }

      setTasks(tasksData || []);

      // 통계 계산 - 판매와 환불 분리
      const salesTasks = tasksData?.filter(t => !t.title?.includes('[환불]')) || [];
      const refundTasks = tasksData?.filter(t => t.title?.includes('[환불]')) || [];
      
      const totalTasks = tasksData?.length || 0;
      
      // 판매 통계
      const salesPoints = salesTasks.reduce((sum, t) => {
        const opType = sortedOperationTypes.find(op => op.id === t.operation_type_id);
        return sum + (opType?.points || 0);
      }, 0);
      
      const salesAmount = salesTasks.reduce((sum, t) => sum + (t.sales_amount || 0), 0);
      
      // 환불 통계
      const refundPoints = refundTasks.reduce((sum, t) => {
        const opType = sortedOperationTypes.find(op => op.id === t.operation_type_id);
        return sum + (opType?.points || 0);
      }, 0);
      
      const refundAmount = refundTasks.reduce((sum, t) => sum + Math.abs(t.sales_amount || 0), 0);
      
      // 순 통계
      const netPoints = salesPoints + refundPoints; // 환불은 음수이므로 자동 차감
      const netSales = salesAmount + refundTasks.reduce((sum, t) => sum + (t.sales_amount || 0), 0); // 환불은 음수이므로 자동 차감

      // 오늘 매출 계산 (오늘 날짜의 업무만)
      // 한국 시간 기준으로 오늘 날짜 계산
      const koreaDate = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
      const today = koreaDate.toISOString().split('T')[0];
      
      // 오늘 업무만 필터링
      const todayTasks = tasksData?.filter(t => t.task_date === today) || [];
      
      const todaySales = todayTasks.reduce((sum, t) => {
        // 환불 업무는 음수로 계산
        if (t.title && t.title.includes('[환불]')) {
          return sum - Math.abs(t.sales_amount || 0);
        }
        return sum + (t.sales_amount || 0);
      }, 0);
      
      // 오늘 포인트 계산
      const todayPoints = todayTasks.reduce((sum, t) => {
        const opType = sortedOperationTypes.find(op => op.id === t.operation_type_id);
        return sum + (opType?.points || 0);
      }, 0);
      
      // 오늘 업무 건수
      const todayTaskCount = todayTasks.length;

      setStats({
        totalTasks,
        totalPoints: netPoints, // 순 포인트
        totalSales: netSales, // 순 매출
        todaySales,
        todayPoints, // 오늘 포인트
        todayTaskCount, // 오늘 업무 건수
        pendingTasks: tasksData?.filter(t => t.achievement_status === 'pending').length || 0,
        completedTasks: tasksData?.filter(t => t.achievement_status === 'completed').length || 0,
        refundedTasks: refundTasks.length,
        // 환불 통계 분리
        salesTasks: salesTasks.length,
        salesPoints,
        salesAmount,
        refundTasks: refundTasks.length,
        refundPoints,
        refundAmount,
        netPoints,
        netSales
      });
    } catch (error: any) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (taskData: any) => {
    console.log('➕ 업무 추가 시작:', taskData);
    
    try {
      // 현재 사용자 확인
      const user = await auth.getCurrentUser();
      if (!user) {
        console.error('❌ 사용자가 로그인되지 않았습니다.');
        alert('로그인이 필요합니다. 다시 로그인해주세요.');
        return;
      }

      console.log('👤 현재 사용자 ID:', user.id);

      const insertData = {
        employee_id: user.id,
        operation_type_id: taskData.operation_type_id,
        title: taskData.title,
        notes: taskData.notes,
        memo: taskData.memo,
        task_time: taskData.task_time,
        customer_name: taskData.customer_name,
        sales_amount: typeof taskData.sales_amount === 'string' 
          ? parseFloat(taskData.sales_amount.replace(/,/g, '')) || 0
          : taskData.sales_amount || 0,
        task_priority: taskData.task_priority || 'normal',
        achievement_status: 'pending',
        task_date: taskData.task_date,
        customer_type: taskData.customer_type,
        consultation_channel: taskData.consultation_channel,
        op10Category: taskData.op10Category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 삽입할 데이터:', insertData);

      const { data, error } = await supabase
        .from('employee_tasks')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase 삽입 에러:', error);
        throw error;
      }
      
      console.log('✅ 업무 추가 성공:', data);
      alert('업무가 성공적으로 추가되었습니다!');
      loadTasksData();
    } catch (error: any) {
      console.error('❌ 업무 추가 실패:', error);
      alert(`업무 추가에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    }
  };

  const showOperationTypeDetails = (opType: OperationType) => {
    console.log('🎯 업무 유형 클릭:', opType);
    
    if (opType.code === 'OP8') {
      // OP8은 상세 정보 모달만 표시
      console.log('📋 OP8 상세 정보 모달 표시');
      setSelectedOperationType(opType);
    } else {
      // 다른 OP는 빠른 업무 입력 폼을 열고 해당 업무 유형 선택
      console.log('➕ 빠른 업무 입력 폼 열기:', opType.id);
      handleQuickTaskSelect(opType);
    }
  };

  const getOperationTypeDescription = (code: string): string => {
    const descriptions: { [key: string]: string } = {
      'OP1': '신규 고객에게 전화로 제품을 설명하고 결제를 유도하는 업무입니다.<br/><br/><strong>환불 처리:</strong> 완료된 업무의 "환불" 버튼을 통해 환불 처리할 수 있습니다.',
      'OP2': '기존 고객의 재구매나 부품 구매를 전화로 처리하는 업무입니다.<br/><br/><strong>환불 처리:</strong> 완료된 업무의 "환불" 버튼을 통해 환불 처리할 수 있습니다.',
      'OP3': '신규 고객을 대상으로 오프라인에서 제품을 설명하고 구매를 성사시키는 업무입니다.<br/><br/><strong>환불 처리:</strong> 완료된 업무의 "환불" 버튼을 통해 환불 처리할 수 있습니다.',
      'OP4': '기존 고객의 재구매나 부품 구매를 오프라인에서 처리하는 업무입니다.<br/><br/><strong>환불 처리:</strong> 완료된 업무의 "환불" 버튼을 통해 환불 처리할 수 있습니다.',
      'OP5': '1. CS 응대 (제품안내): 고객의 제품 문의 및 안내 업무<br/>2. 시타보조: 매장 방문 고객 응대 보조, 팀장 리드하에 보조 참여<br/>3. 프로모션 설명, 인트라넷/노션 정보 입력, 시타예약 입력<br/><br/><strong>환불 처리:</strong> 완료된 업무의 "환불" 버튼을 통해 환불 처리할 수 있습니다.',
      'OP6': '고급 A/S 처리 및 기술적 문제 해결 업무입니다.<br/><br/><strong>환불 처리:</strong> 완료된 업무의 "환불" 버튼을 통해 환불 처리할 수 있습니다.',
      'OP7': '고객의 환불 요청을 방어하고 유지하는 업무입니다.<br/><br/><strong>환불 처리:</strong> 완료된 업무의 "환불" 버튼을 통해 환불 처리할 수 있습니다.',
      'OP8': '완료된 업무의 "환불" 버튼을 통해 환불 처리를 진행합니다.',
      'OP9': '1. 상품 택배: 상품 관련 택배의 입고, 출고, 회수를 처리하는 업무<br/>2. 인트라넷: 인트라넷 등록 및 관리 업무<br/><br/><strong>환불 처리:</strong> 완료된 업무의 "환불" 버튼을 통해 환불 처리할 수 있습니다.',
      'OP10': '1. 내부전달: 내부 업무 전달 및 소통 업무<br/>2. 택배: 음료, 소모품, 선물 등 기타 택배 처리<br/>3. 환경개선: 사무실 환경 개선 및 정리 정돈 업무<br/><br/><strong>환불 처리:</strong> 완료된 업무의 "환불" 버튼을 통해 환불 처리할 수 있습니다.',
      'OP11': '싱싱 리무진 버스 투어상품에 대한 신규 고객 전화 판매 업무입니다.<br/><br/><strong>환불 처리:</strong> 완료된 업무의 "환불" 버튼을 통해 환불 처리할 수 있습니다.',
      'OP12': '싱싱 리무진 버스 투어상품에 대한 고객 서비스 및 응대 업무입니다.<br/><br/><strong>환불 처리:</strong> 완료된 업무의 "환불" 버튼을 통해 환불 처리할 수 있습니다.'
    };
    return descriptions[code] || '업무 설명이 없습니다.';
  };

  const getOperationTypePointsInfo = (code: string): string => {
    const pointsInfo: { [key: string]: string } = {
      'OP1': '건당 20점이 부여됩니다. 신규 고객 전화 판매 성공 시에만 인정됩니다.',
      'OP2': '건당 15점이 부여됩니다. 재구매/부품 전화 판매에 적용됩니다.',
      'OP3': '건당 40점이 부여됩니다. 신규 고객 오프라인 판매(시타 메인 or 단독판매) 성공 시에만 인정됩니다.',
      'OP4': '건당 30점이 부여됩니다. 재구매/부품 오프라인 판매(시타 메인 or 단독판매)에 적용됩니다.',
      'OP5': '건당 8점이 부여됩니다. 기본적인 고객 응대 업무입니다.',
      'OP6': '건당 15점이 부여됩니다. 고급 A/S 처리가 필요한 경우에만 인정됩니다.',
      'OP7': '건당 25점이 부여됩니다. 환불 방어 성공 시에만 인정됩니다.',
      'OP8': '기존 판매 점수가 그대로 차감됩니다. 환불 처리 담당자에게는 점수가 부여되지 않습니다.',
      'OP9': '건당 8점이 부여됩니다. 상품 관련 택배 처리 업무입니다.',
      'OP10': '건당 5점이 부여됩니다. 음료/소모품/선물 등 기타 택배 및 서비스 업무입니다.',
      'OP11': '건당 20점이 부여됩니다. 싱싱 리무진 버스 투어상품 신규 고객 전화 판매 성공 시에만 인정됩니다.',
      'OP12': '건당 8점이 부여됩니다. 싱싱 리무진 버스 투어상품 고객 서비스 및 응대 업무입니다.'
    };
    return pointsInfo[code] || '점수 정보가 없습니다.';
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    console.log('🔄 업무 상태 업데이트 시작:', { taskId, newStatus });
    
    try {
      const updateData: any = { 
        achievement_status: newStatus,
        updated_at: new Date().toISOString()
      };

      console.log('📝 업데이트 데이터:', updateData);

      const { error } = await supabase
        .from('employee_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        console.error('❌ Supabase 업데이트 에러:', error);
        throw error;
      }
      
      console.log('✅ 업무 상태 업데이트 성공');
      
      // 상태에 따른 메시지 표시
      if (newStatus === 'completed') {
        alert('업무가 완료되었습니다!');
      } else if (newStatus === 'pending') {
        alert('업무가 대기 상태로 변경되었습니다!');
      }
      
      loadTasksData();
    } catch (error: any) {
      console.error('❌ 업무 상태 업데이트 실패:', error);
      alert(`업무 상태 변경에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleUpdateTask = async (taskData: any) => {
    try {
      setIsUpdating(true);
      console.log('업무 수정 시작:', taskData); // 디버깅용 로그
      
      const updateData: any = {
        ...taskData,
        updated_at: new Date().toISOString(),
        sales_amount: parseFloat((taskData.sales_amount as string).replace(/,/g, '')) || 0
      };

      // OP5, OP12인 경우에만 customer_type과 consultation_channel 추가
      const selectedOpType = operationTypes.find(op => op.id === taskData.operation_type_id);
      if (selectedOpType?.code === 'OP5' || selectedOpType?.code === 'OP12') {
        updateData.customer_type = taskData.customer_type || 'existing';
        updateData.consultation_channel = taskData.consultation_channel || 'phone';
      }
      
      // OP10인 경우 op10Category 추가 (스키마 캐시 문제로 임시 비활성화)
      // if (selectedOpType?.code === 'OP10') {
      //   updateData.op10Category = taskData.op10Category || 'common';
      // }

      console.log('업데이트 데이터:', updateData); // 디버깅용 로그

      const { error } = await supabase
        .from('employee_tasks')
        .update(updateData)
        .eq('id', editingTask?.id);

      if (error) {
        console.error('Supabase 업데이트 오류:', error);
        alert('업무 수정에 실패했습니다: ' + error.message);
        return;
      }

      console.log('업무 수정 성공'); // 디버깅용 로그

      // OP10 업무 수정 시에도 Slack 알림 전송 (스키마 캐시 문제로 임시 비활성화)
      // if (selectedOpType?.code === 'OP10') {
      //   await sendSlackNotification({
      //     ...taskData,
      //     op10Category: taskData.op10Category || 'common'
      //   }, selectedOpType, true);
      // }
      
      setShowEditModal(false);
      setEditingTask(null);
      loadTasksData();
      
      // 성공 메시지
      alert('업무가 성공적으로 수정되었습니다.');
      
    } catch (error) {
      console.error('업무 수정 실패:', error);
      alert('업무 수정 중 오류가 발생했습니다: ' + (error as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefundTask = (task: Task) => {
    setRefundTargetTask(task);
    setShowRefundModal(true);
  };



  const handleCreateRefund = async (refundData: any) => {
    try {
      if (!refundTargetTask) return;

      // 현재 사용자 확인
      const user = await auth.getCurrentUser();
      if (!user) {
        console.error('사용자가 로그인되지 않았습니다.');
        return;
      }

      // OP8 업무 유형 찾기
      const op8Type = operationTypes.find(op => op.code === 'OP8');
      if (!op8Type) {
        console.error('OP8 업무 유형을 찾을 수 없습니다.');
        return;
      }

      // 원본 업무의 포인트 계산
      const originalPoints = refundTargetTask.operation_type?.points || 0;
      const refundAmount = refundData.refund_amount || refundTargetTask.sales_amount || 0;

      // OP11인 경우 전용 취소 로직 적용
      if (refundTargetTask.operation_type?.code === 'OP11') {
        // OP11 전용 취소 사유별 포인트 차감 비율
        const op11CancellationRatios = {
          'weather': 0.3,           // 우천 - 30% 차감
          'course_condition': 0.4,  // 골프장 상황 - 40% 차감
          'customer_change': 1.0,   // 고객 변심 - 100% 차감
          'partial_cancellation': 'ratio', // 부분 취소 - 비율에 따라
          'other': 1.0              // 기타 - 100% 차감
        };

        const refundRatio = refundAmount / (refundTargetTask.sales_amount || 1);
        const cancellationReason = refundData.cancellation_reason || 'other';
        const cancellationRatio = op11CancellationRatios[cancellationReason as keyof typeof op11CancellationRatios] || 1.0;
        
        // OP11 전용 포인트 차감 계산
        let op11PointDeduction;
        if (cancellationRatio === 'ratio') {
          // 부분 취소의 경우 매출 비율에 따라 차감
          op11PointDeduction = Math.round(originalPoints * refundRatio);
        } else {
          // 기타 사유의 경우 취소 사유별 비율 적용
          const ratioValue = typeof cancellationRatio === 'number' ? cancellationRatio : 1.0;
          op11PointDeduction = Math.round(originalPoints * refundRatio * ratioValue);
        }

        // OP11 전용 메모 생성
        const op11Notes = `[OP11 싱싱골프 취소] ${refundTargetTask.title}
원본 업무: ${refundTargetTask.operation_type?.code} - ${refundTargetTask.operation_type?.name}
원본 포인트: ${originalPoints}점
취소 사유: ${getCancellationReasonText(cancellationReason)}
환불 비율: ${(refundRatio * 100).toFixed(1)}%
차감 포인트: ${op11PointDeduction}점
환불 사유: ${refundData.notes || ''}`;

        // OP11 전용 환불 업무 생성
        const { data, error } = await supabase
          .from('employee_tasks')
          .insert({
            employee_id: user.id,
            operation_type_id: op8Type.id, // OP8 ID 사용
            title: `[OP11 취소] ${refundTargetTask.title}`,
            notes: op11Notes,
            task_time: refundData.task_time,
            customer_name: refundTargetTask.customer_name,
            sales_amount: -refundAmount, // 환불 금액을 음수로 설정
            task_priority: refundData.task_priority || 'high',
            achievement_status: 'completed', // 환불 업무는 바로 완료 상태
            task_date: refundData.task_date,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        
        console.log('OP11 취소 업무 생성 성공:', data);
        console.log(`OP11 원본 포인트 ${originalPoints}점 중 ${op11PointDeduction}점 차감 처리됨`);
        
      } else {
        // 기존 OP8 로직 (마스골프 등)
        const { data, error } = await supabase
          .from('employee_tasks')
          .insert({
            employee_id: user.id,
            operation_type_id: op8Type.id, // OP8 전용 ID 사용
            title: `[환불] ${refundTargetTask.title}`,
            notes: `원본 업무: ${refundTargetTask.title}\n원본 포인트: ${originalPoints}점\n환불 사유: ${refundData.notes || ''}`,
            task_time: refundData.task_time,
            customer_name: refundTargetTask.customer_name,
            sales_amount: -refundAmount, // 환불 금액을 음수로 설정
            task_priority: refundData.task_priority || 'high',
            achievement_status: 'completed', // 환불 업무는 바로 완료 상태
            task_date: refundData.task_date,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        
        console.log('환불 업무 생성 성공:', data);
        console.log(`원본 포인트 ${originalPoints}점 차감 처리됨`);
      }
      
      setShowRefundModal(false);
      setRefundTargetTask(null);
      loadTasksData();
    } catch (error) {
      console.error('환불 처리 실패:', error);
    }
  };

  // OP11 취소 사유 텍스트 변환 함수
  const getCancellationReasonText = (reason: string): string => {
    const reasonTexts: { [key: string]: string } = {
      'weather': '우천으로 인한 취소',
      'course_condition': '골프장 상황으로 인한 취소',
      'customer_change': '고객 변심',
      'partial_cancellation': '부분 취소',
      'other': '기타'
    };
    return reasonTexts[reason] || '기타';
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('employee_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      loadTasksData();
    } catch (error) {
      console.error('업무 삭제 실패:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold">업무 기록</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Slack 알림 토글 스위치 */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Slack 알림</label>
                <button
                  onClick={() => setSlackNotificationEnabled(!slackNotificationEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    slackNotificationEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      slackNotificationEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <button
                onClick={() => setShowQuickTaskForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                업무 추가
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI 하이라이트 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="h-6 w-6 mr-3 text-blue-600" />
            KPI 하이라이트
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">오늘의 매출</p>
                  <p className="text-2xl font-bold">₩{(stats.todaySales || 0).toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">월 누적 매출</p>
                  <p className="text-2xl font-bold">₩{(stats.totalSales || 0).toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">오늘 포인트</p>
                  <p className="text-2xl font-bold">{stats.todayPoints}점</p>
                </div>
                <Target className="h-8 w-8 text-purple-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">오늘 업무 건수</p>
                  <p className="text-2xl font-bold">{stats.todayTaskCount}건</p>
                </div>
                <Phone className="h-8 w-8 text-orange-200" />
              </div>
            </div>
          </div>
        </div>

        {/* 개인 KPI 표시 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📊 개인 KPI</h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {selectedMonth.getFullYear()}년 {selectedMonth.getMonth() + 1}월
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Phone className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">전화 판매 건수</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {tasks.filter(t => ['OP1', 'OP2'].includes(t.operation_type?.code || '') && !t.title?.includes('[환불]')).length}건
              </p>
              <p className="text-xs text-blue-500 mt-1">OP1, OP2 합계</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Store className="h-6 w-6 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">매장 판매 건수</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {tasks.filter(t => ['OP3', 'OP4'].includes(t.operation_type?.code || '') && !t.title?.includes('[환불]')).length}건
              </p>
              <p className="text-xs text-green-500 mt-1">OP3, OP4 합계</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Headphones className="h-6 w-6 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-800">CS 응대</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {tasks.filter(t => t.operation_type?.code === 'OP5' && !t.title?.includes('[환불]')).length}건
              </p>
              <p className="text-xs text-purple-500 mt-1">OP5</p>
            </div>

            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 text-teal-600 mr-2" />
                <span className="text-sm font-medium text-teal-800">방문 예약 건수</span>
              </div>
              <p className="text-2xl font-bold text-teal-600">
                {tasks.filter(t => t.operation_type?.code === 'OP5' && t.sita_booking === true && !t.title?.includes('[환불]')).length}건
              </p>
              <p className="text-xs text-teal-500 mt-1">OP5</p>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-6 w-6 text-orange-600 mr-2" />
                <span className="text-sm font-medium text-orange-800">마스골프</span>
              </div>
              <p className="text-lg font-bold text-orange-600">
                {tasks.filter(t => ['OP1', 'OP2', 'OP3', 'OP4', 'OP5', 'OP6', 'OP7', 'OP9', 'OP10'].includes(t.operation_type?.code || '') && (t.op10Category === 'masgolf' || !t.op10Category)).reduce((sum, t) => sum + (t.operation_type?.points || 0), 0)}점
              </p>
              <p className="text-xs text-orange-500 mt-1">{tasks.filter(t => ['OP1', 'OP2', 'OP3', 'OP4', 'OP5', 'OP6', 'OP7', 'OP9', 'OP10'].includes(t.operation_type?.code || '') && (t.op10Category === 'masgolf' || !t.op10Category)).length}건</p>
            </div>

            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-6 w-6 text-pink-600 mr-2" />
                <span className="text-sm font-medium text-pink-800">싱싱골프</span>
              </div>
              <p className="text-lg font-bold text-pink-600">
                {tasks.filter(t => ['OP11', 'OP12'].includes(t.operation_type?.code || '') || (t.operation_type?.code === 'OP10' && t.op10Category === 'singsingolf')).reduce((sum, t) => sum + (t.operation_type?.points || 0), 0)}점
              </p>
              <p className="text-xs text-pink-500 mt-1">{tasks.filter(t => ['OP11', 'OP12'].includes(t.operation_type?.code || '') || (t.operation_type?.code === 'OP10' && t.op10Category === 'singsingolf')).length}건</p>
            </div>
          </div>
        </div>

        {/* 빠른 업무 입력 - 퀵 테스크 스타일 적용 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 업무 입력</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {operationTypes
              .filter(opType => opType.code !== 'OP8')
              .map((opType) => {
              const Icon = getOperationIcon(opType.code);
              const isSelected = quickTaskData.operation_type_id === opType.id;
              
              return (
                <button
                  key={opType.id}
                  onClick={() => handleQuickTaskSelect(opType)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-25'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <Icon className="h-6 w-6 mr-2" />
                    <span className="text-sm font-medium">{opType.code}</span>
                  </div>
                  <p className="text-sm font-semibold mb-1">{getOperationDisplayName(opType.code, opType.name)}</p>
                  <p className="text-xs text-gray-500">{opType.points}점</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 퀵 테스크 입력 폼 */}
        {showQuickTaskForm && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">빠른 업무 입력</h2>
              <button
                onClick={() => setShowQuickTaskForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <form onSubmit={handleQuickTaskSubmit} className="space-y-4">
              {/* 업무명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  업무명
                </label>
                <input
                  type="text"
                  value={quickTaskData.title}
                  onChange={(e) => setQuickTaskData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="예: CS 응대(제품안내), 전화판매(신규고객) 등"
                  required
                />
              </div>

              {/* 고객명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  고객명
                </label>
                <input
                  type="text"
                  value={quickTaskData.customer_name}
                  onChange={(e) => setQuickTaskData(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="고객명 (선택)"
                />
              </div>

              {/* 매출 금액 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  매출 금액
                </label>
                <input
                  type="number"
                  value={quickTaskData.sales_amount || ''}
                  onChange={(e) => setQuickTaskData(prev => ({ ...prev, sales_amount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
              </div>

              {/* OP5, OP12 CS 응대 시 추가 필드 */}
              {(operationTypes.find(op => op.id === quickTaskData.operation_type_id)?.code === 'OP5' || 
                operationTypes.find(op => op.id === quickTaskData.operation_type_id)?.code === 'OP12') && (
                <>
                  {/* 고객 유형 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      고객 유형
                    </label>
                    <select
                      value={quickTaskData.customer_type}
                      onChange={(e) => setQuickTaskData(prev => ({ ...prev, customer_type: e.target.value as 'new' | 'existing' }))}
                      className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="new">신규 고객</option>
                      <option value="existing">기존 고객</option>
                    </select>
                  </div>

                  {/* 상담 채널 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      상담 채널
                    </label>
                    <select
                      value={quickTaskData.consultation_channel}
                      onChange={(e) => setQuickTaskData(prev => ({ ...prev, consultation_channel: e.target.value as 'phone' | 'kakao' | 'smartstore' | 'official_website' }))}
                      className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="phone">전화</option>
                      <option value="kakao">카카오채널</option>
                      <option value="smartstore">스마트스토어</option>
                      <option value="official_website">공홈</option>
                    </select>
                  </div>

                  {/* 방문 예약 여부 (OP5만) */}
                  {(() => {
                    const selectedOp = operationTypes.find(op => op.id === quickTaskData.operation_type_id);
                    return selectedOp?.code === 'OP5';
                  })() && (
                    <div className="space-y-3">
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={quickTaskData.sita_booking}
                            onChange={(e) => setQuickTaskData(prev => ({ ...prev, sita_booking: e.target.checked }))}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-gray-700">방문 예약</span>
                        </label>
                      </div>
                      
                      {/* 방문 예약이 체크되었을 때만 날짜/시간 입력 표시 */}
                      {quickTaskData.sita_booking && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              방문 예약 날짜
                            </label>
                            <input
                              type="date"
                              value={quickTaskData.visit_booking_date}
                              onChange={(e) => setQuickTaskData(prev => ({ ...prev, visit_booking_date: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              방문 예약 시간
                            </label>
                            <input
                              type="time"
                              value={quickTaskData.visit_booking_time}
                              onChange={(e) => setQuickTaskData(prev => ({ ...prev, visit_booking_time: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* OP10 업무 시 카테고리 선택 */}
              {(() => {
                const selectedOp = operationTypes.find(op => op.id === quickTaskData.operation_type_id);
                console.log('빠른 업무 입력 - 선택된 업무 유형:', selectedOp);
                console.log('빠른 업무 입력 - operation_type_id:', quickTaskData.operation_type_id);
                return selectedOp?.code === 'OP10';
              })() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    업무 분류
                  </label>
                  <select
                    value={quickTaskData.op10Category}
                    onChange={(e) => setQuickTaskData(prev => ({ ...prev, op10Category: e.target.value as 'masgolf' | 'singsingolf' | 'common' }))}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="masgolf">마스골프</option>
                    <option value="singsingolf">싱싱골프</option>
                    <option value="common">공통</option>
                  </select>
                </div>
              )}

              {/* 업무 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  업무 내용
                </label>
                <textarea
                  value={quickTaskData.notes}
                  onChange={(e) => setQuickTaskData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="업무 내용을 입력하세요 (선택)"
                />
              </div>

              {/* 제출 버튼 */}
              <button
                type="submit"
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 mr-2" />
                  업무 완료
                </div>
              </button>
            </form>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">총 업무</span>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xl font-bold">{stats.totalTasks}건</p>
            <p className="text-xs text-gray-500 mt-1">이번 달</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">획득 포인트</span>
              <Award className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-xl font-bold text-purple-600">{stats.totalPoints}점</p>
            <p className="text-xs text-gray-500 mt-1">성과 포인트</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">개인 매출</span>
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xl font-bold text-green-600">
              {stats.totalSales.toLocaleString()}원
            </p>
            <p className="text-xs text-gray-500 mt-1">총 매출액</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">대기 중</span>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-xl font-bold text-yellow-600">{stats.pendingTasks}건</p>
            <p className="text-xs text-gray-500 mt-1">처리 대기</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">완료</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xl font-bold text-green-600">{stats.completedTasks}건</p>
            <p className="text-xs text-gray-500 mt-1">처리 완료</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">환불</span>
              <RotateCcw className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-xl font-bold text-red-600">{stats.refundedTasks}건</p>
            <p className="text-xs text-gray-500 mt-1">환불 처리</p>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">기간:</span>
              <input
                type="month"
                value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-');
                  setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1));
                }}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">전체</option>
                <option value="pending">대기</option>
                <option value="in_progress">진행중</option>
                <option value="completed">완료</option>
                <option value="verified">검증됨</option>
              </select>
            </div>
          </div>
        </div>

        {/* 업무 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* 데스크톱용 테이블 */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  날짜
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  업무 유형
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  업무명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  고객명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  매출
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  포인트
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  우선순위
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.task_date ? formatDateKR(task.task_date) : formatDateKR(task.created_at)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {task.operation_type?.code}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getOperationDisplayName(task.operation_type?.code || '', task.operation_type?.name || '')}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {task.title || '-'}
                      </p>
                      {task.notes && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.customer_name || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.sales_amount ? (
                      <span className={task.sales_amount < 0 ? 'text-red-600' : ''}>
                        {task.sales_amount < 0 ? `-${Math.abs(task.sales_amount).toLocaleString()}` : task.sales_amount.toLocaleString()}원
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-1 text-purple-500" />
                      <span className={`text-sm font-medium ${task.title && task.title.includes('[환불]') ? 'text-red-600' : 'text-purple-600'}`}>
                        {task.title && task.title.includes('[환불]') ? `-${task.operation_type?.points || 0}` : task.operation_type?.points || 0}점
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(task.task_priority || 'normal')}`}>
                      {getPriorityLabel(task.task_priority || 'normal')}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.achievement_status || 'pending')}`}>
                      {getStatusLabel(task.achievement_status || 'pending')}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {/* 상태 전환 토글 */}
                      <button
                        onClick={() => handleUpdateStatus(
                          task.id, 
                          task.achievement_status === 'pending' ? 'completed' : 'pending'
                        )}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${
                          task.achievement_status === 'pending' 
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        title={task.achievement_status === 'pending' ? '완료 처리' : '대기로 변경'}
                      >
                        {task.achievement_status === 'pending' ? (
                          <>
                            <ToggleLeft className="h-4 w-4" />
                            <span className="text-xs">완료</span>
                          </>
                        ) : (
                          <>
                            <ToggleRight className="h-4 w-4" />
                            <span className="text-xs">대기</span>
                          </>
                        )}
                      </button>
                      
                      {/* 수정 버튼 - 모든 업무에 표시 */}
                      <button
                        onClick={() => handleEditTask(task)}
                        className="text-blue-600 hover:text-blue-900"
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      {/* 환불 버튼 - 완료 상태이고 OP1-4, OP11인 경우만 */}
                      {task.achievement_status === 'completed' && 
                       ['OP1', 'OP2', 'OP3', 'OP4', 'OP11'].includes(task.operation_type?.code || '') && (
                        <button
                          onClick={() => handleRefundTask(task)}
                          className="text-orange-600 hover:text-orange-900"
                          title="환불 처리"
                        >
                          환불
                        </button>
                      )}
                      
                      {/* 삭제 버튼 - 모든 업무에 표시 */}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-900"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          
          {/* 모바일용 카드 뷰 */}
          <div className="lg:hidden">
            {tasks.map((task) => {
              const opType = operationTypes.find(op => op.id === task.operation_type_id);
              return (
                <div key={task.id} className="border-b border-gray-200 p-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">
                          {formatDateKR(task.task_date || new Date())}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.achievement_status || 'pending')}`}>
                          {getStatusLabel(task.achievement_status || 'pending')}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{task.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {task.sales_amount ? `₩${task.sales_amount.toLocaleString()}` : '-'}
                      </div>
                      <div className="text-xs text-gray-500">{opType?.points || 0}점</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{opType?.name || '알 수 없음'}</span>
                    <span className={`px-2 py-1 rounded-full ${getPriorityColor(task.task_priority || 'normal')}`}>
                      {getPriorityLabel(task.task_priority || 'normal')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 업무 유형별 통계 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">업무 유형별 분포</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {operationTypes
              .map((opType) => {
              const count = tasks.filter(t => t.operation_type_id === opType.id).length;
              const points = tasks
                .filter(t => t.operation_type_id === opType.id)
                .reduce((sum, t) => {
                  const points = opType.points || 0;
                  // 환불 업무는 제목에 [환불]이 포함되어 있음
                  if (t.title && t.title.includes('[환불]')) {
                    return sum - points;
                  }
                  return sum + points;
                }, 0);
              
              return (
                <div 
                  key={opType.id} 
                  className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50"
                  title={`${opType.name} - ${points}점`}
                  onClick={() => handleQuickTaskSelect(opType)}
                >
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-medium">
                      {opType.code}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mb-1 leading-tight">
                    {getOperationDisplayName(opType.code, opType.name)}
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    {opType.code === 'OP8' ? '환불 처리' : `${opType.points}점`}
                  </p>
                  <div className="text-xs text-gray-500 bg-white rounded px-2 py-1">
                    {count}건 / {points}점
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* 업무 유형 상세 정보 모달 */}
          {selectedOperationType && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">업무 상세 정보</h3>
                  <button
                    onClick={() => setSelectedOperationType(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-medium">
                      {selectedOperationType.code}
                    </span>
                    <h4 className="text-lg font-semibold">{getOperationDisplayName(selectedOperationType.code, selectedOperationType.name)}</h4>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>업무 설명:</strong>
                    </p>
                    <p 
                      className="text-sm text-gray-600"
                      dangerouslySetInnerHTML={{ 
                        __html: getOperationTypeDescription(selectedOperationType.code) 
                      }}
                    />
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>점수 계산:</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                      {getOperationTypePointsInfo(selectedOperationType.code)}
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>대상 직급:</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedOperationType.target_roles?.join(', ') || '모든 직급'}
                    </p>
                  </div>
                  
                  {selectedOperationType.code !== 'OP8' && (
                    <div className="text-center">
                      <button
                        onClick={() => {
                          setSelectedOperationType(null);
                          setShowQuickTaskForm(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        이 업무로 기록하기
                      </button>
                    </div>
                  )}
                  {selectedOperationType.code === 'OP8' && (
                    <div className="text-center">
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <p className="text-sm text-orange-800 font-medium">
                          💡 환불 처리 방법
                        </p>
                        <p className="text-sm text-orange-700">
                          완료된 업무의 "환불" 버튼을 클릭하여 환불 처리를 진행합니다.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>


      {/* 업무 수정 모달 */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">업무 수정</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateTask({
                  task_date: formData.get('task_date') as string,
                  operation_type_id: formData.get('operation_type_id'),
                  title: formData.get('title') || '',
                  notes: formData.get('notes') || '',
                  memo: formData.get('memo') || '',
                  task_time: formData.get('task_time') || null,
                  customer_name: formData.get('customer_name') || '',
                  sales_amount: formData.get('sales_amount') as string,
                  task_priority: formData.get('task_priority') || 'normal',
                  customer_type: formData.get('customer_type') || 'existing',
                  consultation_channel: formData.get('consultation_channel') || 'phone',
                  sita_booking: formData.get('sita_booking') === 'on',
                  visit_booking_date: formData.get('visit_booking_date') || null,
                  visit_booking_time: formData.get('visit_booking_time') || null,
                  // op10Category: formData.get('op10Category') || 'common'
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무 날짜
                  </label>
                  <input
                    type="date"
                    name="task_date"
                    required
                    defaultValue={editingTask.task_date || formatDateISO(new Date())}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무 유형
                  </label>
                  <select
                    name="operation_type_id"
                    required
                    defaultValue={editingTask.operation_type_id}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">선택하세요</option>
                    {operationTypes
                      .filter(opType => opType.code !== 'OP8') // OP8 제외
                      .map((opType) => (
                      <option key={opType.id} value={opType.id}>
                        {opType.code} - {getOperationDisplayName(opType.code, opType.name)} ({opType.points}점)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무명
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={editingTask.title}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="업무 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={editingTask.notes || ''}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="업무 내용 설명 (선택)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      우선순위
                    </label>
                    <select
                      name="task_priority"
                      defaultValue={editingTask.task_priority || 'normal'}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="low">낮음</option>
                      <option value="normal">보통</option>
                      <option value="high">높음</option>
                      <option value="urgent">긴급</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      업무 수행 시각
                    </label>
                    <input
                      type="time"
                      name="task_time"
                      defaultValue={editingTask.task_time || ''}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="09:00"
                      step="600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      고객명
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      defaultValue={editingTask.customer_name || ''}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="VIP0000 (선택)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    매출 금액
                  </label>
                  <input
                    type="text"
                    name="sales_amount"
                    defaultValue={editingTask.sales_amount ? editingTask.sales_amount.toLocaleString() : '0'}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="판매 시에만 입력 (원)"
                    onChange={(e) => {
                      // 숫자와 쉼표만 허용
                      const value = e.target.value.replace(/[^\d,]/g, '');
                      // 쉼표 제거 후 숫자로 변환
                      const numValue = value.replace(/,/g, '');
                      if (numValue === '' || !isNaN(Number(numValue))) {
                        // 천단위 쉼표 추가
                        const formattedValue = numValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                        e.target.value = formattedValue;
                      }
                    }}
                    onBlur={(e) => {
                      // 포커스 아웃 시 숫자만 남기고 쉼표 제거
                      const numValue = e.target.value.replace(/,/g, '');
                      if (numValue === '') {
                        e.target.value = '0';
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메모
                  </label>
                  <textarea
                    name="memo"
                    rows={2}
                    defaultValue={editingTask.memo || ''}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="추가 메모 (선택)"
                  />
                </div>

                {/* OP5, OP12인 경우 추가 필드 */}
                {editingTask.operation_type?.code === 'OP5' || editingTask.operation_type?.code === 'OP12' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        고객 유형
                      </label>
                      <select
                        name="customer_type"
                        defaultValue={editingTask.customer_type || 'existing'}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="new">신규 고객</option>
                        <option value="existing">기존 고객</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        상담 채널
                      </label>
                      <select
                        name="consultation_channel"
                        defaultValue={editingTask.consultation_channel || 'phone'}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="phone">전화</option>
                        <option value="kakao">카카오채널</option>
                        <option value="smartstore">스마트스토어</option>
                        <option value="official_website">공홈</option>
                      </select>
                    </div>

                    {/* OP5인 경우 방문 예약 필드 */}
                    {editingTask.operation_type?.code === 'OP5' && (
                      <div className="space-y-3">
                        <div>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              name="sita_booking"
                              defaultChecked={editingTask.sita_booking || false}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-gray-700">방문 예약</span>
                          </label>
                        </div>
                        
                        {editingTask.sita_booking && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                방문 예약 날짜
                              </label>
                              <input
                                type="date"
                                name="visit_booking_date"
                                defaultValue={editingTask.visit_booking_date || ''}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                방문 예약 시간
                              </label>
                              <input
                                type="time"
                                name="visit_booking_time"
                                defaultValue={editingTask.visit_booking_time || ''}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : null}

                {/* OP10인 경우 카테고리 선택 */}
                {(() => {
                  console.log('업무 수정 - editingTask.operation_type:', editingTask.operation_type);
                  return editingTask.operation_type?.code === 'OP10';
                })() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      업무 분류
                    </label>
                    <select
                      name="op10Category"
                      defaultValue={editingTask.op10Category || 'common'}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="masgolf">마스골프</option>
                      <option value="singsingolf">싱싱골프</option>
                      <option value="common">공통</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className={`px-4 py-2 rounded-md ${
                    isUpdating 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isUpdating ? '수정 중...' : '수정'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 환불 처리 모달 */}
      {showRefundModal && refundTargetTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">환불 처리</h3>
            
            {/* 원본 업무 정보 표시 */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-gray-800 mb-2">원본 업무 정보</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>업무:</strong> {refundTargetTask.operation_type?.code} - {getOperationDisplayName(refundTargetTask.operation_type?.code || '', refundTargetTask.operation_type?.name || '')}</p>
                <p><strong>제목:</strong> {refundTargetTask.title}</p>
                <p><strong>고객:</strong> {refundTargetTask.customer_name || '-'}</p>
                <p><strong>매출:</strong> {refundTargetTask.sales_amount ? `${refundTargetTask.sales_amount.toLocaleString()}원` : '-'}</p>
                <p><strong>차감될 점수:</strong> 
                  {refundTargetTask.operation_type?.code === 'OP11' ? (
                    <span className="text-blue-600 font-medium">
                      취소 사유에 따라 결정 (OP11 전용 로직)
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      -{(refundTargetTask.operation_type?.points || 0)}점
                    </span>
                  )}
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const refundAmount = formData.get('refund_amount') as string;
                const parsedRefundAmount = refundAmount ? parseFloat(refundAmount.replace(/,/g, '')) : 0;
                
                handleCreateRefund({
                  task_date: formData.get('task_date') as string,
                  notes: formData.get('notes') || '',
                  memo: formData.get('memo') || '',
                  task_time: formData.get('task_time') || null,
                  task_priority: formData.get('task_priority') || 'normal',
                  refund_amount: parsedRefundAmount,
                  cancellation_reason: formData.get('cancellation_reason') || 'other'
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    환불 날짜
                  </label>
                  <input
                    type="date"
                    name="task_date"
                    required
                    defaultValue={formatDateISO(new Date())}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                {/* OP11인 경우에만 표시되는 취소 사유 선택 */}
                {refundTargetTask?.operation_type?.code === 'OP11' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      취소 사유 (싱싱골프 전용)
                    </label>
                    <select 
                      name="cancellation_reason" 
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="weather">우천으로 인한 취소 (30% 차감)</option>
                      <option value="course_condition">골프장 상황으로 인한 취소 (40% 차감)</option>
                      <option value="customer_change">고객 변심 (100% 차감)</option>
                      <option value="partial_cancellation">부분 취소 (비율에 따라)</option>
                      <option value="other">기타 (100% 차감)</option>
                    </select>
                    <p className="text-xs text-blue-600 mt-1">
                      💡 싱싱골프 업무는 취소 사유에 따라 차감 비율이 달라집니다
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    환불 사유
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="환불 사유를 입력하세요 (필수)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    환불 금액
                  </label>
                  <input
                    type="text"
                    name="refund_amount"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="환불할 금액을 입력하세요 (원)"
                    defaultValue={refundTargetTask.sales_amount ? refundTargetTask.sales_amount.toString() : '0'}
                    onChange={(e) => {
                      // 숫자와 쉼표만 허용
                      const value = e.target.value.replace(/[^\d,]/g, '');
                      // 쉼표 제거 후 숫자로 변환
                      const numValue = value.replace(/,/g, '');
                      if (numValue === '' || !isNaN(Number(numValue))) {
                        // 천단위 쉼표 추가
                        const formattedValue = numValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                        e.target.value = formattedValue;
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    원본 매출: {refundTargetTask.sales_amount ? `${refundTargetTask.sales_amount.toLocaleString()}원` : '0원'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      환불 시각
                    </label>
                    <input
                      type="time"
                      name="task_time"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="09:00"
                      step="600"
                      defaultValue={(() => {
                        const now = new Date();
                        const minutes = Math.floor(now.getMinutes() / 10) * 10;
                        now.setMinutes(minutes, 0, 0);
                        return now.toTimeString().slice(0, 5);
                      })()}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      우선순위
                    </label>
                    <select
                      name="task_priority"
                      defaultValue="high"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="low">낮음</option>
                      <option value="normal">보통</option>
                      <option value="high">높음</option>
                      <option value="urgent">긴급</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메모
                  </label>
                  <textarea
                    name="memo"
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="추가 메모 (선택)"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundTargetTask(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  환불 처리
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
