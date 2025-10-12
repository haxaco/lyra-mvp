import { signR2Put, signR2Get } from '@lyra/core';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Missing or invalid key parameter' },
        { status: 400 }
      );
    }

    // Sign a PUT URL for uploading
    const putUrl = await signR2Put(key);

    // Upload test content using the signed PUT URL
    const testContent = 'hello from Lyra';
    const uploadResponse = await fetch(putUrl, {
      method: 'PUT',
      body: testContent,
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    if (!uploadResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`,
        },
        { status: 500 }
      );
    }

    // Sign a GET URL for retrieving
    const getUrl = await signR2Get(key);

    return NextResponse.json({
      ok: true,
      putUrl,
      getUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


