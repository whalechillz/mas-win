/**
 * 주소 관련 유틸리티 함수
 */

// 한국의 도/시 단위 목록
const PROVINCES = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', 
  '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
  '경기도', '강원도', '충청북도', '충청남도', 
  '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도'
];

// 도 단위 약칭 매핑 (충북, 경기, 경상 등)
const PROVINCE_SHORT_NAMES: Record<string, string> = {
  '서울특별시': '서울',
  '부산광역시': '부산',
  '대구광역시': '대구',
  '인천광역시': '인천',
  '광주광역시': '광주',
  '대전광역시': '대전',
  '울산광역시': '울산',
  '세종특별자치시': '세종',
  '경기도': '경기',
  '강원도': '강원',
  '충청북도': '충북',
  '충청남도': '충남',
  '전라북도': '전북',
  '전라남도': '전남',
  '경상북도': '경북',
  '경상남도': '경남',
  '제주특별자치도': '제주',
};

// 전라남도 지역 목록 (완도, 진도, 해남 등)
const JEONNAM_REGIONS = [
  '완도', '진도', '해남', '강진', '장흥', '영암', '무안', '함평', 
  '영광', '장성', '나주', '담양', '곡성', '구례', '고흥', '보성',
  '순천', '광양', '여수', '목포', '여천', '화순', '신안', '진도',
  '완주', '고창', '부안', '임실', '순창', '정읍', '남원', '익산'
];

// 전라북도 지역 목록
const JEONBUK_REGIONS = [
  '전주', '익산', '정읍', '남원', '김제', '완주', '진안', '무주',
  '장수', '임실', '순창', '고창', '부안', '군산'
];

/**
 * 주소에서 도 단위를 추출합니다.
 * 예: "충북경제단체" → "충북", "경기도 수원시" → "경기", "서울특별시 강남구" → "서울"
 */
export function extractProvince(address: string | null | undefined): string | null {
  if (!address || !address.trim()) {
    return null;
  }

  const trimmed = address.trim();

  // 플레이스홀더 주소는 null 반환
  const placeholders = ['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'];
  if (placeholders.includes(trimmed) || trimmed.startsWith('[')) {
    return null;
  }

  // 1. 정식 도/시 이름으로 시작하는 경우 (예: "서울특별시", "경기도")
  for (const province of PROVINCES) {
    if (trimmed.startsWith(province)) {
      return PROVINCE_SHORT_NAMES[province] || province;
    }
  }

  // 2. 약칭으로 시작하는 경우 (예: "충북경제단체", "경상도창원시")
  for (const [fullName, shortName] of Object.entries(PROVINCE_SHORT_NAMES)) {
    if (trimmed.startsWith(shortName)) {
      return shortName;
    }
  }

  // 2-1. "전라도"로 시작하는 경우 특수 처리 (전북/전남 구분)
  if (trimmed.startsWith('전라도')) {
    // 주소에서 지역명 확인
    for (const region of JEONNAM_REGIONS) {
      if (trimmed.includes(region)) {
        return '전남';
      }
    }
    for (const region of JEONBUK_REGIONS) {
      if (trimmed.includes(region)) {
        return '전북';
      }
    }
    // 지역명을 찾을 수 없으면 기본값으로 전남 반환 (완도군 등 대부분이 전남)
    return '전남';
  }

  // 3. "도" 또는 "시"가 포함된 경우 (예: "충청도아산시", "경상도창원시")
  const provinceMatch = trimmed.match(/^([가-힣]+(?:도|시))/);
  if (provinceMatch) {
    const matched = provinceMatch[1];
    // 정식 이름이면 약칭으로 변환
    if (PROVINCE_SHORT_NAMES[matched]) {
      return PROVINCE_SHORT_NAMES[matched];
    }
    // 이미 약칭이면 그대로 반환
    if (Object.values(PROVINCE_SHORT_NAMES).includes(matched)) {
      return matched;
    }
    // "도"로 끝나면 약칭 추출 시도
    if (matched.endsWith('도')) {
      const baseName = matched.replace('도', '');
      // 충청북도 → 충북, 경상남도 → 경남 등
      if (baseName.includes('북')) {
        return baseName.replace('북', '') + '북';
      }
      if (baseName.includes('남')) {
        return baseName.replace('남', '') + '남';
      }
      // "전라"만 있는 경우는 null 반환 (위에서 처리했으므로 여기 도달하면 안됨)
      if (baseName === '전라') {
        return null;
      }
      return baseName;
    }
    return matched;
  }

  // 4. 특수 케이스: "충북경제단체" 같은 경우
  const specialCases: Record<string, string> = {
    '충북': '충북',
    '충남': '충남',
    '경북': '경북',
    '경남': '경남',
    '전북': '전북',
    '전남': '전남',
  };

  for (const [key, value] of Object.entries(specialCases)) {
    if (trimmed.startsWith(key)) {
      return value;
    }
  }

  return null;
}

/**
 * 도 단위의 전체 이름을 반환합니다 (약칭 → 전체 이름)
 */
export function getProvinceFullName(shortName: string | null | undefined): string | null {
  if (!shortName) return null;
  
  for (const [fullName, short] of Object.entries(PROVINCE_SHORT_NAMES)) {
    if (short === shortName) {
      return fullName;
    }
  }
  
  return shortName;
}

/**
 * 도 단위 목록을 반환합니다
 */
export function getAllProvinces(): string[] {
  return Object.values(PROVINCE_SHORT_NAMES);
}

/**
 * 주소에서 시 단위를 추출합니다.
 * 예: "경기도 수원시" → "수원시", "서울특별시 강남구" → null (시 단위 없음)
 */
export function extractCity(address: string | null | undefined): string | null {
  if (!address || !address.trim()) {
    return null;
  }

  const trimmed = address.trim();

  // 플레이스홀더 주소는 null 반환
  const placeholders = ['[주소 미제공]', '[직접방문]', '[온라인 전용]', 'N/A'];
  if (placeholders.includes(trimmed) || trimmed.startsWith('[')) {
    return null;
  }

  // 시 단위 패턴 매칭 (예: "경기도 수원시", "충청남도 천안시", "서울특별시"는 시 단위 없음)
  // 광역시/특별시는 시 단위가 없으므로 제외
  const metropolitanCities = ['서울특별시', '부산광역시', '대구광역시', '인천광역시', 
    '광주광역시', '대전광역시', '울산광역시', '세종특별자치시'];
  
  for (const city of metropolitanCities) {
    if (trimmed.startsWith(city)) {
      return null; // 광역시/특별시는 시 단위 없음
    }
  }

  // "도" 다음에 오는 "시" 추출 (예: "경기도 수원시" → "수원시")
  const cityMatch = trimmed.match(/(?:도|특별자치도)\s*([가-힣]+시)/);
  if (cityMatch && cityMatch[1]) {
    return cityMatch[1];
  }

  // "도" 없이 바로 "시"로 시작하는 경우 (예: "수원시 영통구")
  const directCityMatch = trimmed.match(/^([가-힣]+시)/);
  if (directCityMatch && directCityMatch[1]) {
    // 광역시가 아닌 경우만
    if (!metropolitanCities.some(c => c.includes(directCityMatch[1]))) {
      return directCityMatch[1];
    }
  }

  return null;
}
