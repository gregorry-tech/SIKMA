import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const mcpUrl = process.env.MCP_SERVER_URL || 'https://stitch.googleapis.com/mcp';
    const apiKey = process.env.MCP_X_GOOG_API_KEY || process.env.MCP_API_KEY || '';

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['X-Goog-Api-Key'] = apiKey;

    const res = await fetch(mcpUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const text = await res.text();
    // Try to parse JSON, otherwise return raw text
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: res.status });
    } catch (e) {
      return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'text/plain' } });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
