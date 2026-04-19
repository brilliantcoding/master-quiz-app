export async function generateQuizWithNvidia(prompt) {
  const response = await fetch('/api/nvidia', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const data = await response.json();

  if (response.status === 429) {
    const retryAfter = data.error?.retryAfter || '60';
    throw new Error(`All NVIDIA models are rate limited. Please wait ${retryAfter} seconds and try again.`);
  }

  if (response.status === 422 && data.error?.code === 'truncated') {
    throw new Error('Response was cut off. Try reducing the number of questions.');
  }

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `NVIDIA error (${response.status})`);
  }

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Empty response from NVIDIA');
  }

  return {
    content: data.choices[0].message.content,
    model: data._model || 'nvidia',
  };
}
