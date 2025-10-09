'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isRLSError, setIsRLSError] = useState(false);

  useEffect(() => {
    async function testSupabaseConnection() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          setStatus('error');
          setError('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
          return;
        }

        // Create Supabase client with anon key
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Test query to organizations table
        const { error: queryError } = await supabase
          .from('organizations')
          .select('id')
          .limit(1);

        if (queryError) {
          setStatus('error');
          setError(queryError.message);
          // Check if it's an RLS/permission error
          if (queryError.message.includes('permission') || 
              queryError.message.includes('RLS') ||
              queryError.message.includes('policy')) {
            setIsRLSError(true);
          }
          return;
        }

        setStatus('ok');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    testSupabaseConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Supabase Connection Test
          </h1>

          <div className="space-y-6">
            {/* Status Display */}
            <div className="flex items-center justify-center space-x-3 py-4">
              {status === 'loading' && (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-lg text-gray-600">Testing connection...</span>
                </>
              )}
              {status === 'ok' && (
                <>
                  <span className="text-4xl">✅</span>
                  <span className="text-lg font-semibold text-green-700">Connection Successful</span>
                </>
              )}
              {status === 'error' && (
                <>
                  <span className="text-4xl">❌</span>
                  <span className="text-lg font-semibold text-red-700">Connection Failed</span>
                </>
              )}
            </div>

            {/* Error Details */}
            {status === 'error' && (
              <div className="space-y-4">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">Error Message:</h3>
                  <p className="text-sm text-red-700 font-mono break-words">{error}</p>
                </div>

                {isRLSError && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                    <h3 className="text-sm font-semibold text-yellow-800 mb-2">💡 Note:</h3>
                    <p className="text-sm text-yellow-700">
                      This is likely due to Row Level Security (RLS) policies. 
                      The anon key is being used, which requires proper RLS configuration 
                      or user authentication to access data. This is expected behavior for secured tables.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Connection Info */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Connection Details:</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-start">
                  <span className="text-sm text-gray-600 min-w-[120px]">Auth Method:</span>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-800">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY
                  </code>
                </div>
                <div className="flex items-start">
                  <span className="text-sm text-gray-600 min-w-[120px]">Query:</span>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-800">
                    SELECT id FROM organizations LIMIT 1
                  </code>
                </div>
                <div className="flex items-start">
                  <span className="text-sm text-gray-600 min-w-[120px]">Environment:</span>
                  <span className="text-xs text-gray-700">Client-side (browser)</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center pt-4">
              <a
                href="/api/healthz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Test Server-Side API (Service Role Key)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

