export async function callMCP(payload: any) {
  const res = await fetch('/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `MCP request failed with status ${res.status}`);
  }

  try {
    return await res.json();
  } catch (e) {
    const text = await res.text();
    return { raw: text };
  }
}
