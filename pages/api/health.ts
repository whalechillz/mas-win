import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test database connection
    const { data, error } = await supabase
      .from('blog_platforms')
      .select('count')
      .limit(1);

    if (error) {
      return res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        details: {
          supabaseUrl,
          keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon',
          timestamp: new Date().toISOString()
        }
      });
    }

    return res.status(200).json({
      status: 'healthy',
      database: 'connected',
      keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(503).json({
      status: 'unhealthy',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}