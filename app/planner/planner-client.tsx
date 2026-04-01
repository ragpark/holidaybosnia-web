'use client';

import { FormEvent, useMemo, useState } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function PlannerClient() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [handoffName, setHandoffName] = useState('');
  const [handoffEmail, setHandoffEmail] = useState('');
  const [handoffNotes, setHandoffNotes] = useState('');
  const [handoffStatus, setHandoffStatus] = useState<string>('');

  const canSubmit = useMemo(() => text.trim().length > 0 && !isSending, [text, isSending]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setText('');
    setIsSending(true);

    try {
      const res = await fetch('/api/planner/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
          context: { source: 'web', locale: 'en-GB' },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Planner request failed');

      setSessionId(data.sessionId);
      setMessages((prev) => [...prev, data.assistantMessage]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Sorry — I couldn't process your message just now. (${message})`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function onHandoff(e: FormEvent) {
    e.preventDefault();
    if (!sessionId) {
      setHandoffStatus('Start a planner conversation first.');
      return;
    }

    setHandoffStatus('Sending itinerary request…');

    try {
      const res = await fetch('/api/planner/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          guestName: handoffName,
          guestEmail: handoffEmail,
          notes: handoffNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Handoff failed');

      setHandoffStatus(`Itinerary prepared. Status: ${data.status}. CRM: ${data.integrations.crm}, Email: ${data.integrations.email}.`);
    } catch (err) {
      setHandoffStatus(err instanceof Error ? err.message : 'Unknown handoff error');
    }
  }

  return (
    <main style={{ maxWidth: 920, margin: '0 auto', padding: 24, display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', border: '1px solid var(--stone)', borderRadius: 12, padding: 16 }}>
        <h1 style={{ margin: 0, color: 'var(--ink)' }}>AI Trip Planner</h1>
        <p style={{ marginTop: 8, color: '#5e7263' }}>Production migration UI using /api/planner/chat with persisted session/messages.</p>
        <p style={{ fontSize: 12, color: '#6d8372' }}>Session: {sessionId ?? 'not started'}</p>
      </section>

      <section style={{ background: '#fff', border: '1px solid var(--stone)', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'grid', gap: 10, maxHeight: 360, overflow: 'auto', marginBottom: 12 }}>
          {messages.length === 0 ? (
            <div style={{ color: '#6d8372', fontSize: 14 }}>Ask about destinations, timing, budget, or halal requirements.</div>
          ) : (
            messages.map((m) => (
              <article
                key={m.id}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  background: m.role === 'assistant' ? '#f3ede3' : '#4a7c59',
                  color: m.role === 'assistant' ? '#2f4537' : '#fff',
                }}
              >
                <strong style={{ fontSize: 12 }}>{m.role === 'assistant' ? 'Planner' : 'You'}</strong>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{m.content}</div>
              </article>
            ))
          )}
        </div>

        <form onSubmit={onSend} style={{ display: 'flex', gap: 8 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe your ideal Bosnia trip…"
            style={{ flex: 1, border: '1px solid var(--stone)', borderRadius: 8, padding: '10px 12px' }}
          />
          <button
            disabled={!canSubmit}
            style={{ border: 0, borderRadius: 8, background: 'var(--copper)', color: '#fff', padding: '10px 14px' }}
            type="submit"
          >
            {isSending ? 'Sending…' : 'Send'}
          </button>
        </form>
      </section>

      <section style={{ background: '#fff', border: '1px solid var(--stone)', borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0, color: 'var(--ink)' }}>Save & Request Quote</h2>
        <form onSubmit={onHandoff} style={{ display: 'grid', gap: 10 }}>
          <input required value={handoffName} onChange={(e) => setHandoffName(e.target.value)} placeholder="Your name" style={{ border: '1px solid var(--stone)', borderRadius: 8, padding: '10px 12px' }} />
          <input required type="email" value={handoffEmail} onChange={(e) => setHandoffEmail(e.target.value)} placeholder="Email address" style={{ border: '1px solid var(--stone)', borderRadius: 8, padding: '10px 12px' }} />
          <textarea value={handoffNotes} onChange={(e) => setHandoffNotes(e.target.value)} placeholder="Optional notes" rows={4} style={{ border: '1px solid var(--stone)', borderRadius: 8, padding: '10px 12px' }} />
          <button type="submit" style={{ border: 0, borderRadius: 8, background: 'var(--sage)', color: '#fff', padding: '10px 14px', width: 'fit-content' }}>
            Generate handoff
          </button>
        </form>
        {handoffStatus ? <p style={{ fontSize: 13, color: '#4b6454' }}>{handoffStatus}</p> : null}
      </section>
    </main>
  );
}
