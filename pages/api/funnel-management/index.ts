import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface FunnelFile {
  name: string;
  path: string;
  size: number;
  createdDate: string;
  modifiedDate: string;
  version: string;
  status: 'live' | 'staging' | 'dev';
  url: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const versionsDir = path.join(process.cwd(), 'public', 'versions');
    const files = fs.readdirSync(versionsDir);
    
    const funnelFiles: FunnelFile[] = [];
    
    // funnel-YYYY-MM-*.html 패턴 파일들 찾기
    const funnelPattern = /^funnel-(\d{4})-(\d{2})-(.+)\.html$/;
    
    files.forEach(file => {
      const match = file.match(funnelPattern);
      if (match) {
        const [, year, month, version] = match;
        const filePath = path.join(versionsDir, file);
        
        try {
          const stats = fs.statSync(filePath);
          
          // 파일명에서 날짜 추출 (파일명이 더 정확함)
          const fileNameDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          
          // 시스템 날짜와 파일명 날짜 비교
          let finalModifiedDate: Date;
          
          if (stats.mtime.getFullYear() < 2020) {
            // 시스템 날짜가 잘못된 경우 파일명 기반 날짜 사용
            finalModifiedDate = fileNameDate;
            console.log(`파일 ${file}: 시스템 날짜 오류, 파일명 기반 날짜 사용`);
          } else {
            // 시스템 날짜가 정상인 경우 사용
            finalModifiedDate = stats.mtime;
          }
          
          // 버전 상태 판단
          let status: 'live' | 'staging' | 'dev' = 'dev';
          if (version.includes('live')) status = 'live';
          else if (version.includes('staging')) status = 'staging';
          
          funnelFiles.push({
            name: file,
            path: filePath,
            size: stats.size,
            createdDate: stats.birthtime.toISOString(),
            modifiedDate: finalModifiedDate.toISOString(),
            version: version,
            status: status,
            url: `/versions/${file}`
          });
          
        } catch (statError) {
          console.error(`파일 정보 읽기 실패: ${filePath}`, statError);
        }
      }
    });
    
    // 날짜별로 그룹화
    const groupedFunnels = funnelFiles.reduce((acc, file) => {
      const key = `${file.name.split('-')[1]}-${file.name.split('-')[2]}`; // YYYY-MM
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(file);
      return acc;
    }, {} as Record<string, FunnelFile[]>);
    
    // 각 그룹 내에서 버전별로 정렬
    Object.keys(groupedFunnels).forEach(key => {
      groupedFunnels[key].sort((a, b) => {
        const statusOrder = { live: 1, staging: 2, dev: 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      });
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalFiles: funnelFiles.length,
        groupedFunnels,
        lastUpdated: new Date().toISOString(),
        debug: {
          serverTime: new Date().toISOString(),
          filesProcessed: funnelFiles.length
        }
      }
    });
    
  } catch (error) {
    console.error('퍼널 파일 스캔 오류:', error);
    res.status(500).json({ 
      error: '퍼널 파일 스캔 실패',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
