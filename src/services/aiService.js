import { generateQuizWithNvidia } from './nvidia';
import { generateQuizWithClaudeHaiku } from './claude-haiku';
import { extractJSON, buildQuizPrompt, formatQuestions } from './quizUtils';

async function generateQuizWithFreeAI({ grade, subject, difficulty, count }) {
  const prompt = buildQuizPrompt(grade, subject, difficulty, count);
  const result = await generateQuizWithNvidia(prompt);
  const cleaned = extractJSON(result.content);
  const questions = JSON.parse(cleaned);
  if (!Array.isArray(questions) || questions.length === 0) throw new Error('Empty response');
  return { questions: formatQuestions(questions, count), model: result.model };
}

export async function generateQuizQuestions({ grade, subject, difficulty, count }) {
  const freeAIEnabled = localStorage.getItem('free-ai-enabled') !== 'false';
  if (freeAIEnabled) {
    return generateQuizWithFreeAI({ grade, subject, difficulty, count });
  }
  return generateQuizWithClaudeHaiku({ grade, subject, difficulty, count });
}
