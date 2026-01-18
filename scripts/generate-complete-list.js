const fs = require('fs');
const path = require('path');

const report = require('../docs/migration-v3-name-change-report.json');

let markdown = '# 마이그레이션 V3 - 전체 폴더명 및 파일명 변경 리스트\n\n';
markdown += '생성일: ' + new Date().toISOString().split('T')[0] + '\n\n';
markdown += '## 요약\n\n';
markdown += '- 총 폴더: ' + report.totalFolders + '개\n';
markdown += '- 성공: ' + report.customers.filter(c => c.status === 'success').length + '개\n';
markdown += '- 실패: ' + report.customers.filter(c => c.status === 'failed').length + '개\n\n';

markdown += '## 연도별 통계\n\n';
Object.entries(report.byYear).sort().forEach(([year, stats]) => {
  markdown += `- ${year}년: 총 ${stats.total}, 성공 ${stats.success}, 실패 ${stats.failed}\n`;
});

markdown += '\n## 전체 변경 리스트\n\n';

report.customers.forEach((c, idx) => {
  markdown += `### [${idx + 1}] ${c.customerName}${c.phone ? ' (' + c.phone + ')' : ''}\n\n`;
  markdown += `- **연도**: ${c.year}년${c.visitDate ? ' (' + c.visitDate + ')' : ''}\n`;
  markdown += `- **원본 폴더**: \`${c.originalFolder}\`\n`;
  markdown += `- **변환 폴더**: \`${c.convertedFolder}\`\n`;
  markdown += `- **영문 이름**: ${c.nameEn || 'N/A'}\n`;
  markdown += `- **파일 개수**: ${c.fileCount}개\n`;
  
  if (c.files && c.files.length > 0) {
    markdown += `- **파일 목록**:\n`;
    c.files.forEach(f => {
      markdown += `  - \`${f.original}\` → \`${f.converted}\`\n`;
    });
  }
  markdown += '\n';
});

fs.writeFileSync('./docs/migration-v3-complete-list.md', markdown);
console.log('✅ 전체 리스트 저장: docs/migration-v3-complete-list.md');
