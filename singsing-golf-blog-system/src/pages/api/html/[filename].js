import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { filename } = req.query;
  
  if (!filename || !filename.endsWith('.html')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  const filePath = path.join(process.cwd(), 'public', 'versions', filename);
  
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(404).json({ error: 'File not found' });
  }
}