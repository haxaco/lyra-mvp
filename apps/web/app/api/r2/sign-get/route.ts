import { NextRequest, NextResponse } from 'next/server';
import { signR2Get } from '@lyra/core';

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();
    
    if (!key) {
      return NextResponse.json(
        { error: 'Missing key parameter' },
        { status: 400 }
      );
    }

    const signedUrl = await signR2Get(key);
    
    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Error signing R2 URL:', error);
    return NextResponse.json(
      { error: 'Failed to sign URL' },
      { status: 500 }
    );
  }
}
