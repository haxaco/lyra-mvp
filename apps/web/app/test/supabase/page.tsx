'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testSupabaseConnection() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          setStatus('error');
          setError('Missing Supabase environment variables');
          return;
        }

        // Create Supabase client with anon key
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Test query to organizations table
        const { data: organizations, error: queryError } = await supabase
          .from('organizations')
          .select('id')
          .limit(1);

        if (queryError) {
          setStatus('error');
          setError(queryError.message);
          return;
        }

        setStatus('ok');
        setData(organizations);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    testSupabaseConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Supabase Connection Test
          </h1>

          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Connection Status
              </h2>
              {status === 'loading' && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Testing connection...</span>
                </div>
              )}
              {status === 'ok' && (
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 font-medium">Status: OK</span>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0 w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 font-medium">Status: Error</span>
                </div>
              )}
            </div>

            {status === 'ok' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  Query Results
                </h2>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Rows returned: <span className="font-mono font-semibold text-gray-900">{data?.length ?? 0}</span>
                  </p>
                  {data && data.length > 0 && (
                    <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {status === 'error' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  Error Details
                </h2>
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-800 font-mono">{error}</p>
                </div>
                <p className="text-sm text-gray-600 mt-4 italic">
                  Note: If you're seeing a permissions error, it may be due to Row Level Security (RLS) policies.
                  The anon key is being used, which requires proper RLS configuration or authentication to access data.
                </p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Testing Details
              </h2>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Using <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
                <li>Querying: <code className="bg-gray-100 px-1 rounded">select id from organizations limit 1</code></li>
                <li>Client-side connection (browser)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/api/healthz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Test Server-Side API (Service Role)
          </a>
        </div>
      </div>
    </div>
  );
}

