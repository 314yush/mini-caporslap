import { createClient, Errors } from '@farcaster/quick-auth';
import { NextRequest, NextResponse } from 'next/server';

// Get domain from environment or use default
function getDomain(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_APP_URL);
      return url.hostname;
    } catch {
      // If invalid URL, try to extract hostname manually
      const match = process.env.NEXT_PUBLIC_APP_URL.match(/https?:\/\/([^\/]+)/);
      if (match) {
        return match[1];
      }
    }
  }
  
  // Vercel provides this automatically (includes protocol, need to extract hostname)
  if (process.env.VERCEL_URL) {
    try {
      // VERCEL_URL might be just hostname or include protocol
      if (process.env.VERCEL_URL.startsWith('http')) {
        const url = new URL(process.env.VERCEL_URL);
        return url.hostname;
      } else {
        return process.env.VERCEL_URL;
      }
    } catch {
      return process.env.VERCEL_URL;
    }
  }
  
  // Fallback for local development
  return 'localhost:3000';
}

const domain = getDomain();

const client = createClient();

/**
 * GET /api/auth
 * Verifies Quick Auth JWT and returns user info (FID, username)
 */
export async function GET(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authorization.split(' ')[1];

  try {
    const payload = await client.verifyJwt({ token, domain });
    
    // Return FID (subject) - username can be resolved via Neynar if needed
    return NextResponse.json({
      fid: payload.sub,
      success: true,
    });
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      console.error('[Auth] Invalid token error:', e);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('[Auth] Verification error:', e);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

