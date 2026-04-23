import { type NextRequest } from 'next/server';

// This route handler proxies tRPC requests to the auth worker
// This allows the frontend to use same-origin requests and enables SSR support

const AUTH_WORKER_URL = process.env.AUTH_WORKER_URL || 'https://auth.skinshi.com';

async function handler(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/trpc', '/trpc');
  
  // Forward the request to the auth worker
  const workerUrl = `${AUTH_WORKER_URL}${path}${url.search}`;
  
  // Clone headers and add forwarded info
  const headers = new Headers(req.headers);
  headers.set('x-forwarded-for', req.headers.get('x-forwarded-for') || 'unknown');
  headers.set('x-forwarded-host', url.host);
  headers.set('x-forwarded-proto', url.protocol.replace(':', ''));
  
  try {
    const response = await fetch(workerUrl, {
      method: req.method,
      headers,
      body: req.body,
      // @ts-ignore - duplex is required for streaming request bodies
      duplex: 'half',
    });

    // Create a new response with the worker's response
    // Filter out problematic headers that can cause content decoding issues
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('transfer-encoding');
    responseHeaders.delete('content-length');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[tRPC Proxy] Error forwarding request:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to connect to auth worker',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export { handler as GET, handler as POST };