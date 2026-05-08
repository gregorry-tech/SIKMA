'use client';

import React, { useState } from 'react';
import { callMCP } from '@/lib/mcp/client';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';

type Message = { id: string; role: 'user' | 'assistant'; text: string };

export default function AssistantPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await callMCP({ input: userMsg.text });
      const assistantText = typeof res === 'string' ? res : (res.output || res.response || res?.result || JSON.stringify(res));
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: String(assistantText) };
      setMessages((m) => [...m, assistantMsg]);
    } catch (e: any) {
      setMessages((m) => [...m, { id: (Date.now() + 2).toString(), role: 'assistant', text: 'Error: ' + (e?.message || e) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Assistant MCP</h3>
        <p className="text-xs text-gray-500">Terhubung ke MCP</p>
      </div>
      <div className="max-h-56 overflow-y-auto space-y-3 mb-3">
        {messages.length === 0 && <div className="text-sm text-gray-400">Mulai percakapan dengan menulis pesan.</div>}
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && <Avatar name="MCP" size="sm" />}
            <div className={`px-3 py-2 rounded-lg ${m.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'}`}>
              <div className="text-sm whitespace-pre-line">{m.text}</div>
            </div>
            {m.role === 'user' && <Avatar name="You" size="sm" />}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 border rounded px-3 py-2" placeholder="Tanyakan sesuatu..." />
        <Button onClick={send} disabled={loading || !input.trim()}>{loading ? '...' : 'Kirim'}</Button>
      </div>
    </div>
  );
}
