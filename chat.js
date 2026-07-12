// api/chat.js
// Vercel serverless function — proxies chat messages to OpenRouter.
// Keeps your OPENROUTER_API_KEY secret on the server; never expose it in the browser.
//
// Deploy: place this file at /api/chat.js in your Vercel project (this exact path).
// Set an environment variable in the Vercel dashboard:
//   OPENROUTER_API_KEY = sk-or-...          (Project Settings -> Environment Variables)
// Optional:
//   OPENROUTER_MODEL   = openai/gpt-4o-mini  (or any OpenRouter model slug you prefer)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is missing OPENROUTER_API_KEY' });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Basic guardrails: cap history length and message size sent upstream.
  const trimmed = messages.slice(-12).map((m) => ({
    role: m.role === 'assistant' || m.role === 'system' ? m.role : 'user',
    content: String(m.content || '').slice(0, 4000),
  }));

  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        // OpenRouter asks for these so your app shows up correctly in their dashboard.
        // Replace with your real deployed domain and site name.
        'HTTP-Referer': process.env.SITE_URL || 'https://elplegal.com',
        'X-Title': 'El Plegal Advocates AI Assistant',
      },
      body: JSON.stringify({
        model,
        messages: trimmed,
        temperature: 0.4,
        max_tokens: 500,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('OpenRouter error:', upstream.status, errText);
      return res.status(502).json({ error: 'Upstream chat provider error' });
    }

    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "Sorry, I didn't catch that — could you rephrase?";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ error: 'Something went wrong talking to the AI assistant' });
  }
}
