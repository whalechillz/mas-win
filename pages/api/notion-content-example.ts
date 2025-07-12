// 노션 API를 사용한 동적 콘텐츠 가져오기 예시
// pages/api/notion-content.ts

import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export default async function handler(req, res) {
  try {
    // 노션 페이지 내용 가져오기
    const pageId = '22aaa1258b818081bdf4f2fe4d119dab';
    const response = await notion.pages.retrieve({ page_id: pageId });
    
    // 페이지 내용 처리
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Notion content' });
  }
}