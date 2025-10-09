import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // TODO: Validate auth, org scope, and object key
  const url = req.nextUrl
  const key = url.searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'missing key' }, { status: 400 })
  // Placeholder: in production, sign R2 URL and include Range support
  return NextResponse.json({ signedUrl: `https://cdn.lyra.app/${key}` })
}
