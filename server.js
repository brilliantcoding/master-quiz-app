import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || process.env.VITE_NVIDIA_API_KEY;

app.use(cors());
app.use(express.json());

const NVIDIA_MODELS = [
  'meta/llama-3.1-8b-instruct',
  'meta/llama-3.3-70b-instruct',
  'mistralai/mixtral-8x7b-instruct-v0.1',
  'nvidia/nemotron-3-super-120b-a12b',
];

async function tryNvidiaModel(model, prompt) {
  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8192,
    }),
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after') || '60';
    throw { code: 'rate_limit', retryAfter, message: `Rate limited on ${model}` };
  }

  if (!response.ok) {
    const errText = await response.text();
    throw { code: 'api_error', message: `${model} error ${response.status}: ${errText}` };
  }

  const data = await response.json();

  if (data.choices?.[0]?.finish_reason === 'length') {
    throw { code: 'truncated', message: `${model} truncated response` };
  }

  return { data, model };
}

app.post('/api/nvidia', async (req, res) => {
  const { prompt } = req.body;
  const errors = [];
  let hadTruncation = false;

  for (const model of NVIDIA_MODELS) {
    try {
      const { data, model: usedModel } = await tryNvidiaModel(model, prompt);
      console.log(`[NVIDIA] ✅ ${usedModel}`);
      return res.json({ ...data, _model: usedModel });
    } catch (err) {
      console.warn(`[NVIDIA] ⚠️ ${err.message} — trying next model`);
      errors.push(err.message);
      if (err.code === 'truncated') hadTruncation = true;
    }
  }

  if (hadTruncation) {
    return res.status(422).json({ error: { message: 'Response was truncated by all models. Try fewer questions.', code: 'truncated' } });
  }

  return res.status(429).json({
    error: { message: 'All NVIDIA models are rate limited. Please wait a minute and try again.', code: 'rate_limit', errors },
  });
});

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
