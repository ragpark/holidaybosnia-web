import { prisma } from './prisma';

const FALLBACK_REPLY =
  "Thanks for your message — I've captured your request and can now help shape a Bosnia itinerary around your dates, interests, and budget.";

const SYSTEM_PROMPT = `You are the AI trip planner for Holiday Bosnia.
Provide warm, practical, concise guidance.
If details are missing, ask 1-2 follow-up questions.
Always anchor recommendations in Bosnia-Herzegovina destinations and practical planning.`;

const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_TIMEOUT_MS = 20_000;
const MAX_MESSAGE_CHARS = 4_000;

class LLMServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMServiceError';
  }
}

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  model?: string;
};

function sanitizeInput(text: string) {
  return text.replace(/\u0000/g, '').trim().slice(0, MAX_MESSAGE_CHARS);
}

function getApiKey() {
  return process.env.ANTHROPIC_API_KEY;
}

async function callAnthropic(params: {
  system?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens: number;
}) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL,
        max_tokens: params.maxTokens,
        system: params.system,
        messages: params.messages.map((m) => ({ role: m.role, content: sanitizeInput(m.content) })),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new LLMServiceError(`Anthropic request failed with status ${response.status}`);
    }

    return (await response.json()) as AnthropicResponse;
  } catch (error) {
    if (error instanceof LLMServiceError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new LLMServiceError('Anthropic request timed out');
    }

    throw new LLMServiceError('Anthropic request failed');
  } finally {
    clearTimeout(timeout);
  }
}

export async function getOrCreateSession(sessionId?: string) {
  if (sessionId) {
    const existing = await prisma.plannerSession.findUnique({ where: { id: sessionId } });
    if (existing) return existing;
  }

  return prisma.plannerSession.create({
    data: { source: 'web', status: 'active' },
  });
}

export async function generateAssistantReply(history: Array<{ role: 'user' | 'assistant'; content: string }>) {
  const data = await callAnthropic({
    system: SYSTEM_PROMPT,
    messages: history,
    maxTokens: 700,
  });

  if (!data) {
    const lastUser = history.filter((m) => m.role === 'user').at(-1)?.content ?? '';
    return {
      content: `${FALLBACK_REPLY}\n\nYou said: "${lastUser.slice(0, 220)}"`,
      provider: 'fallback',
      model: 'local-template-v1',
      usage: undefined as { inputTokens?: number; outputTokens?: number } | undefined,
    };
  }

  const content = data.content?.find((b) => b.type === 'text')?.text?.trim() || FALLBACK_REPLY;
  return {
    content,
    provider: 'anthropic',
    model: data.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL,
    usage: {
      inputTokens: data.usage?.input_tokens,
      outputTokens: data.usage?.output_tokens,
    },
  };
}

export async function generateHandoffSummary(params: {
  guestName: string;
  notes?: string;
  conversation: Array<{ role: 'user' | 'assistant'; content: string }>;
}) {
  const { guestName, notes, conversation } = params;

  const transcript = conversation
    .map((m) => `${m.role.toUpperCase()}: ${sanitizeInput(m.content)}`)
    .join('\n\n')
    .slice(0, 10_000);

  const prompt = `Write a polished itinerary handoff email for ${guestName}.\nAdditional traveller notes: ${notes || 'None'}\n\nConversation:\n${transcript}\n\nRequirements:\n- Warm personal greeting\n- Summarize intent\n- Day-by-day suggestions\n- Practical travel notes\n- Clear next steps\n- Plain text only`;

  const data = await callAnthropic({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 900,
  });

  if (!data) {
    const condensed = conversation
      .slice(-6)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');
    return `Hello ${guestName},\n\nThanks for planning your Bosnia trip with us.\n\nConversation summary:\n${condensed}\n\nAdditional notes: ${notes || 'None'}\n\nBest regards,\nThe Holiday Bosnia Team`;
  }

  return data.content?.find((b) => b.type === 'text')?.text?.trim() || 'Please see attached itinerary summary.';
}

export async function pushToCRM(payload: Record<string, unknown>) {
  const url = process.env.CRM_WEBHOOK_URL;
  if (!url) return { delivered: false, channel: 'none' as const };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CRM webhook failed (${res.status}): ${text}`);
  }

  return { delivered: true, channel: 'webhook' as const };
}

export async function sendHandoffEmail(params: { to: string; name: string; itineraryText: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.HOLIDAYBOSNIA_FROM_EMAIL;
  if (!apiKey || !from) return { delivered: false, channel: 'none' as const };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: `Your Holiday Bosnia itinerary, ${params.name}`,
      text: params.itineraryText,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend failed (${res.status}): ${text}`);
  }

  return { delivered: true, channel: 'resend' as const };
}
