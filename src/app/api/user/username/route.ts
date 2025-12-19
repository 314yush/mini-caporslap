import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/user/username?fid=123
 * Resolves Farcaster FID to username via Neynar
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fid = searchParams.get('fid');
  
  if (!fid) {
    return NextResponse.json({ error: 'FID required' }, { status: 400 });
  }
  
  const neynarKey = process.env.NEYNAR_API_KEY;
  if (!neynarKey) {
    return NextResponse.json({ error: 'Neynar API key not configured' }, { status: 500 });
  }
  
  try {
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user?fid=${fid}`, {
      headers: {
        'accept': 'application/json',
        'api_key': neynarKey,
      },
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: response.status });
    }
    
    const data = await response.json();
    const username = data.result?.user?.username;
    const pfpUrl = data.result?.user?.pfp_url;
    
    if (!username) {
      return NextResponse.json({ error: 'Username not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      username,
      pfpUrl,
      fid: parseInt(fid, 10),
    });
  } catch (error) {
    console.error('[API] Failed to resolve username:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

