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

// 파일 내용에서 메타데이터 추출
function extractMetadataFromFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 메타 태그에서 날짜 추출
    const createdMatch = content.match(/<meta name="file-created" content="([^"]+)"/);
    const versionMatch = content.match(/<meta name="file-version" content="([^"]+)"/);
    const statusMatch = content.match(/<meta name="file-status" content="([^"]+)"/);
    
    return {
      createdDate: createdMatch ? createdMatch[1] : null,
      version: versionMatch ? versionMatch[1] : null,
      status: statusMatch ? statusMatch[1] : null
    };
  } catch (error) {
    console.error(`파일 메타데이터 추출 실패: ${filePath}`, error);
    return { createdDate: null, version: null, status: null };
  }
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
          
          // 파일 내용에서 메타데이터 추출
          const metadata = extractMetadataFromFile(filePath);
          
          // 파일명에서 버전 추출 (백업)
          const fileNameVersion = version;
          
          // 상태 결정 (파일 내용 우선, 파일명 백업)
          let status: 'live' | 'staging' | 'dev' = 'dev';
          if (metadata.status) {
            status = metadata.status as 'live' | 'staging' | 'dev';
          } else if (fileNameVersion.includes('live')) {
            status = 'live';
          } else if (fileNameVersion.includes('staging')) {
            status = 'staging';
          }
          
          // 날짜 결정 (파일 내용 우선, 시스템 메타데이터 백업)
          let modifiedDate: string;
          if (metadata.createdDate) {
            modifiedDate = metadata.createdDate;
          } else {
            modifiedDate = stats.mtime.toISOString();
          }
          
          funnelFiles.push({
            name: file,
            path: filePath,
            size: stats.size,
            createdDate: stats.birthtime.toISOString(),
            modifiedDate: modifiedDate,
            version: metadata.version || fileNameVersion,
            status: status,
            url: `/versions/${file}`
          });
          
          // 디버그 로그
          console.log(`파일 ${file}:`, {
            name: file,
            size: stats.size,
            modifiedDate: modifiedDate,
            version: metadata.version || fileNameVersion,
            status: status,
            metadataSource: 'file-content'
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
          filesProcessed: funnelFiles.length,
          fileDetails: funnelFiles.map(f => ({
            name: f.name,
            modifiedDate: f.modifiedDate,
            size: f.size,
            metadataSource: 'file-content'
          }))
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
