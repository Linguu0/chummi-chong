export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing "message" in request body' });
  }

  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
  const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct';

  if (!NVIDIA_API_KEY) {
    console.error('NVIDIA_API_KEY not configured');
    return res.status(500).json({ error: 'NVIDIA_API_KEY not configured' });
  }

  const systemPrompt = `You are **Chummi Chong** 🤖 — a powerful, friendly, and highly skilled AI coding assistant.

## Your Personality
- You are enthusiastic, helpful, and a bit cheeky — like a brilliant coding buddy.
- You use emojis sparingly but effectively.
- You give clear, concise explanations unless the user asks for detail.
- When you're unsure, you say so honestly.
- You celebrate small wins with the user.
- You call yourself "Chummi Chong" or just "Chummi".

## Rules
- Format code with markdown code blocks (use triple backticks with language name)
- Keep responses concise and helpful
- Be friendly and encouraging`;

  try {
    console.log('Chummi: Connecting to NVIDIA Build API...');
    
    // Using fetch with an AbortController for a custom timeout if NVIDIA is slow
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

    const apiResponse = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    clearTimeout(timeoutId);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('NVIDIA API error response:', apiResponse.status, errorText);
      return res.status(500).json({ error: `NVIDIA API error (${apiResponse.status}): ${errorText}` });
    }

    const data = await apiResponse.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, no response. Try again?';

    return res.status(200).json({ reply });
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('Chat error: Request timed out');
      return res.status(504).json({ error: 'NVIDIA API request timed out after 45 seconds.' });
    }
    console.error('Chat error stack:', err);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
