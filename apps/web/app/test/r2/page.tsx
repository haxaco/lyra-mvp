'use client';

import { useEffect, useState } from 'react';

export default function TestR2Page() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [getUrl, setGetUrl] = useState<string | null>(null);
  const [testKey, setTestKey] = useState<string>('');

  useEffect(() => {
    async function testR2Connection() {
      try {
        // Generate a unique test key
        const timestamp = Date.now();
        const key = `test/r2_${timestamp}.txt`;
        setTestKey(key);

        // Call the test API
        const response = await fetch('/api/r2/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key }),
        });

        const data = await response.json();

        if (!data.ok) {
          setStatus('error');
          setError(data.error || 'Unknown error');
          return;
        }

        setGetUrl(data.getUrl);
        setStatus('ok');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    testR2Connection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            R2 Storage Connection Test
          </h1>

          <div className="space-y-6">
            {/* Status Display */}
            <div className="flex items-center justify-center space-x-3 py-4">
              {status === 'loading' && (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-lg text-gray-600">Testing R2 connection...</span>
                </>
              )}
              {status === 'ok' && (
                <>
                  <span className="text-4xl">✅</span>
                  <span className="text-lg font-semibold text-green-700">R2 Connection Successful</span>
                </>
              )}
              {status === 'error' && (
                <>
                  <span className="text-4xl">❌</span>
                  <span className="text-lg font-semibold text-red-700">R2 Connection Failed</span>
                </>
              )}
            </div>

            {/* Success Details */}
            {status === 'ok' && getUrl && (
              <div className="space-y-4">
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <h3 className="text-sm font-semibold text-green-800 mb-2">✓ Test Completed</h3>
                  <p className="text-sm text-green-700">
                    Successfully uploaded test content to R2 and retrieved a signed GET URL.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Test File Key:</h3>
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-800 block overflow-x-auto">
                      {testKey}
                    </code>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Signed GET URL:</h3>
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-800 block overflow-x-auto break-all">
                      {getUrl}
                    </code>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <a
                    href={getUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Open Test File (should show "hello from Lyra")
                  </a>
                </div>
              </div>
            )}

            {/* Error Details */}
            {status === 'error' && (
              <div className="space-y-4">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">Error Message:</h3>
                  <p className="text-sm text-red-700 font-mono break-words">{error}</p>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-2">💡 Troubleshooting:</h3>
                  <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                    <li>Verify R2_ACCOUNT_ID is set correctly</li>
                    <li>Check R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY</li>
                    <li>Ensure R2_BUCKET_NAME matches your bucket</li>
                    <li>Confirm R2_PUBLIC_DOMAIN is configured (if using public access)</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Connection Info */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Test Details:</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-start">
                  <span className="text-sm text-gray-600 min-w-[140px]">Actions Tested:</span>
                  <span className="text-xs text-gray-700">
                    1. Signed PUT URL, 2. Upload content, 3. Signed GET URL
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-sm text-gray-600 min-w-[140px]">Test Content:</span>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-800">
                    "hello from Lyra"
                  </code>
                </div>
                <div className="flex items-start">
                  <span className="text-sm text-gray-600 min-w-[140px]">Environment:</span>
                  <span className="text-xs text-gray-700">Server-side (API Route)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


