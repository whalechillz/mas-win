// 전화번호 포맷팅 함수
export function formatPhoneNumber(phone) {
  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '');
  
  // 한국 전화번호 형식에 맞게 포맷팅
  if (numbers.length === 11) {
    // 010-1234-5678
    return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (numbers.length === 10) {
    // 02-1234-5678 또는 031-123-4567
    if (numbers.startsWith('02')) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
    } else {
      return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
  } else if (numbers.length === 9) {
    // 02-123-4567
    return numbers.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  
  // 형식에 맞지 않으면 원본 반환
  return phone;
}

// 날짜/시간 포맷팅 함수 (초 제외)
export function formatDateTime(dateStr, includeSeconds = false) {
  const date = new Date(dateStr);
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' })
  };
  
  return new Intl.DateTimeFormat('ko-KR', options).format(date);
}

// 날짜만 포맷팅
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

// 시간만 포맷팅
export function formatTime(timeStr) {
  if (timeStr.includes(':')) {
    const [hour, minute] = timeStr.split(':');
    return `${hour}:${minute}`;
  }
  return timeStr;
}
