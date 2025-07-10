import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function DebugTool() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [anonKey, setAnonKey] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE');
  const [serviceKey, setServiceKey] = useState('');
  const [useServiceKey, setUseServiceKey] = useState(false);
  const [supabaseUrl] = useState('https://yyytjudftvpmcnppaymw.supabase.co');

  const tables = [
    'blog_platforms',
    'blog_contents', 
    'naver_blog_posts',
    'blog_view_history',
    'team_members',
    'content_categories',
    'marketing_funnel_stages',
    'annual_marketing_plans'
  ];

  const runTest = async (testName: string, testFunc: () => Promise<any>) => {
    const startTime = Date.now();
    try {
      const result = await testFunc();
      const endTime = Date.now();
      return {
        testName,
        success: true,
        result,
        time: `${endTime - startTime}ms`,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      const endTime = Date.now();
      return {
        testName,
        success: false,
        error: error.message || error.toString(),
        status: error.status || 'Unknown',
        details: error.details || error,
        time: `${endTime - startTime}ms`,
        timestamp: new Date().toISOString()
      };
    }
  };

  const testSupabaseConnection = async () => {
    setLoading(true);
    setTestResults([]);
    
    const key = useServiceKey ? serviceKey : anonKey;
    const supabase = createClient(supabaseUrl, key);
    const results: any[] = [];

    // Test 1: Basic connection
    results.push(await runTest('Basic Connection Test', async () => {
      const { data, error } = await supabase.from('blog_platforms').select('id').limit(1);
      if (error) throw error;
      return { connected: true, data };
    }));

    // Test 2: Check RLS status for each table
    for (const table of tables) {
      results.push(await runTest(`RLS Check - ${table}`, async () => {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) throw error;
        return { table, rowCount: data?.length || 0, data };
      }));
    }

    // Test 3: Check auth status
    results.push(await runTest('Auth Status Check', async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error && error.message !== 'Auth session missing!') throw error;
      return { authenticated: !!user, user };
    }));

    // Test 4: Check database permissions
    results.push(await runTest('Database Permissions', async () => {
      const { data, error } = await supabase.rpc('current_setting', { setting: 'is_superuser' }).single();
      return { isSuperuser: data === 'on', role: useServiceKey ? 'service_role' : 'anon' };
    }));

    // Test 5: Insert test (create a test record)
    results.push(await runTest('Insert Permission Test', async () => {
      const testData = {
        name: 'Debug Test Platform',
        description: 'Test platform for debugging',
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('blog_platforms')
        .insert([testData])
        .select();
      
      if (error) throw error;
      
      // Clean up
      if (data && data[0]) {
        await supabase.from('blog_platforms').delete().eq('id', data[0].id);
      }
      
      return { canInsert: true, testData: data };
    }));

    // Test 6: Check API endpoint
    results.push(await runTest('API Endpoint Test', async () => {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { apiStatus: 'OK', data };
    }));

    setTestResults(results);
    setLoading(false);
  };

  const executeCustomQuery = async (query: string) => {
    const key = useServiceKey ? serviceKey : anonKey;
    const supabase = createClient(supabaseUrl, key);
    
    try {
      const { data, error } = await supabase.rpc('execute_sql', { query });
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Debug Tool</h1>
        
        {/* Configuration Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Supabase URL</label>
            <input
              type="text"
              value={supabaseUrl}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg"
              disabled
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Anon Key (Current)</label>
            <textarea
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg font-mono text-xs"
              rows={3}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Service Role Key (Optional)</label>
            <textarea
              value={serviceKey}
              onChange={(e) => setServiceKey(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg font-mono text-xs"
              rows={3}
              placeholder="Paste your service role key here for elevated permissions"
            />
          </div>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useServiceKey}
                onChange={(e) => setUseServiceKey(e.target.checked)}
                className="mr-2"
                disabled={!serviceKey}
              />
              <span className={serviceKey ? '' : 'opacity-50'}>Use Service Role Key</span>
            </label>
          </div>
          
          <button
            onClick={testSupabaseConnection}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Running Tests...' : 'Run Debug Tests'}
          </button>
        </div>

        {/* Quick SQL Fix Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Fixes</h2>
          
          <div className="space-y-2">
            <button
              onClick={async () => {
                const query = `
                  ALTER TABLE blog_platforms DISABLE ROW LEVEL SECURITY;
                  ALTER TABLE blog_contents DISABLE ROW LEVEL SECURITY;
                  ALTER TABLE naver_blog_posts DISABLE ROW LEVEL SECURITY;
                  ALTER TABLE blog_view_history DISABLE ROW LEVEL SECURITY;
                  ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
                  ALTER TABLE content_categories DISABLE ROW LEVEL SECURITY;
                  ALTER TABLE marketing_funnel_stages DISABLE ROW LEVEL SECURITY;
                  ALTER TABLE annual_marketing_plans DISABLE ROW LEVEL SECURITY;
                `;
                const result = await executeCustomQuery(query);
                alert(result.success ? 'RLS disabled successfully!' : `Error: ${result.error}`);
              }}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm"
            >
              Disable All RLS
            </button>
            
            <button
              onClick={async () => {
                const query = `
                  GRANT USAGE ON SCHEMA public TO anon;
                  GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
                  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
                  GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;
                `;
                const result = await executeCustomQuery(query);
                alert(result.success ? 'Permissions granted successfully!' : `Error: ${result.error}`);
              }}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm ml-2"
            >
              Grant Public Permissions
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    result.success ? 'bg-green-900/30 border border-green-600' : 'bg-red-900/30 border border-red-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{result.testName}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        result.success ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        {result.success ? 'PASSED' : 'FAILED'}
                      </span>
                      <span className="text-xs text-gray-400">{result.time}</span>
                    </div>
                  </div>
                  
                  {result.success ? (
                    <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-red-400">
                      <p className="font-semibold">Error: {result.error}</p>
                      {result.status && <p className="text-sm">Status: {result.status}</p>}
                      {result.details && (
                        <pre className="text-xs bg-gray-900 p-2 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting 406 Errors</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-yellow-400">1. Service Role Key 사용하기</h3>
              <p className="text-gray-300">Supabase Dashboard → Settings → API → service_role key를 복사하여 위에 붙여넣고 "Use Service Role Key"를 체크하세요.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-yellow-400">2. RLS 비활성화</h3>
              <p className="text-gray-300">"Disable All RLS" 버튼을 클릭하거나 Supabase SQL Editor에서 직접 실행하세요.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-yellow-400">3. 권한 부여</h3>
              <p className="text-gray-300">"Grant Public Permissions" 버튼을 클릭하여 anon 사용자에게 전체 권한을 부여하세요.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-yellow-400">4. Admin.tsx 수정</h3>
              <pre className="bg-gray-900 p-2 rounded text-xs overflow-x-auto">
{`// pages/admin.tsx 에서
const supabaseKey = 'your-service-role-key-here'; // anon key 대신 service_role key 사용`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}