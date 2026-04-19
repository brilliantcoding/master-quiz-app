import Anthropic from '@anthropic-ai/sdk';
import { extractJSON, buildQuizPrompt, formatQuestions } from './quizUtils';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function generateQuizWithClaudeHaiku({ grade, subject, difficulty, count }) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    throw new Error(
      'Anthropic API key not configured.\n' +
      'Add VITE_ANTHROPIC_API_KEY to your .env file.\n' +
      'Get your key at https://console.anthropic.com'
    );
  }

  const prompt = buildQuizPrompt(grade, subject, difficulty, count);
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text.trim();
  const cleaned = extractJSON(text);
  const questions = JSON.parse(cleaned);

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Invalid response from Claude Haiku');
  }

  return {
    questions: formatQuestions(questions, count),
    model: 'claude-haiku-4-5',
  };
}
