// api/chat.js
// Vercel serverless function — proxies chat messages directly to OpenAI.
// Keeps your OPENAI_API_KEY secret on the server; never expose it in the browser.
//
// Deploy: place this file at /api/chat.js in your Vercel project (this exact path,
// inside a folder literally named "api" at your project root).
//
// Set an environment variable in the Vercel dashboard:
//   OPENAI_API_KEY = sk-...             (Project Settings -> Environment Variables)
// Optional:
//   OPENAI_MODEL    = gpt-4o-mini        (or gpt-4o, gpt-4.1-mini, etc.)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is missing OPENAI_API_KEY' });
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

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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
      console.error('OpenAI error:', upstream.status, errText);
      // TEMP DEBUG: returning the real error so we can see it in the browser network tab.
      // Remove the "debug" field once things are working!
      return res.status(502).json({ error: 'Upstream chat provider error', debug: { status: upstream.status, body: errText } });
    }

    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "Sorry, I didn't catch that — could you rephrase?";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ error: 'Something went wrong talking to the AI assistant' });
  }
}
