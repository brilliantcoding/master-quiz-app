export function extractJSON(text) {
  // First try to parse directly if it's already valid JSON
  try {
    JSON.parse(text);
    return text;
  } catch (e1) {
    // If direct parse fails, try to extract JSON array
  }

  let json = text;
  const startIdx = text.indexOf('[');
  const endIdx = text.lastIndexOf(']');

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error('No JSON array found');
  }

  json = text.substring(startIdx, endIdx + 1);

  try {
    JSON.parse(json);
    return json;
  } catch {
    // Clean up the JSON
    json = json.replace(/\n/g, ' ').replace(/\r/g, '');
    json = json.replace(/,(\s*[}\]])/g, '$1');
    json = json.replace(/\][\s\S]*$/, ']');

    try {
      JSON.parse(json);
      return json;
    } catch (e2) {
      throw new Error(`Invalid JSON: ${e2.message}`);
    }
  }
}

const SUBJECT_CONTEXT = {
  Math: 'mathematics, arithmetic, algebra, geometry, word problems',
  Science: 'science, biology, chemistry, physics, earth science, nature',
  English: 'English language, grammar, vocabulary, reading comprehension, spelling',
  History: 'history, social studies, civilizations, events, important figures',
  Geography: 'geography, countries, capitals, continents, maps, landforms',
  'General Knowledge': 'general knowledge, trivia, everyday facts, culture',
'Computer Science': 'computer science, technology, coding concepts, internet, digital literacy',
};

function getGradeContext(grade) {
  if (grade <= 2) return 'very simple, for a 6-8 year old child, use easy words and concepts';
  if (grade <= 4) return 'elementary level, for a 9-10 year old child';
  if (grade <= 6) return 'middle elementary level, for a 11-12 year old child';
  if (grade <= 8) return 'middle school level, for a 13-14 year old student';
  if (grade <= 10) return 'high school basic level, for a 15-16 year old student';
  return 'high school advanced level, for a 17-18 year old student';
}

function getDifficultyContext(difficulty) {
  const map = {
    Easy: 'straightforward, factual, simple questions with obvious answers',
    Medium: 'moderately challenging, requiring some thought and understanding',
    Hard: 'challenging, requiring deeper knowledge and critical thinking',
  };
  return map[difficulty] || 'moderate';
}

export function buildQuizPrompt(grade, subject, difficulty, count) {
  return `Create ${count} quiz questions for Grade ${grade} ${subject} (${difficulty}).
Context: ${getGradeContext(grade)}. Topics: ${SUBJECT_CONTEXT[subject] || subject}. Style: ${getDifficultyContext(difficulty)}.
Return ONLY a valid JSON array with no other text. Each object must have exactly these fields:
- "question": the question text (string)
- "options": array of exactly 4 answer strings
- "correctAnswer": the exact text of the correct answer (must match one of the options exactly)
- "explanation": brief explanation of why the correct answer is right

CRITICAL RULES — you MUST follow these or the quiz will be wrong:
1. VERIFY the correct answer is factually accurate BEFORE writing the options. For math/pattern questions, compute the answer first, then write the options so the correct answer is always included.
2. NEVER write an explanation that contradicts the options. If the answer is in the options list, do not say "that is not an option".
3. correctAnswer must be the FACTUALLY CORRECT answer, not just a plausible one.
4. Copy correctAnswer EXACTLY as it appears in options (same text, same spelling).

Example: [{"question":"What is 2+2?","options":["3","4","5","6"],"correctAnswer":"4","explanation":"2 plus 2 equals 4."}]`;
}

export function formatQuestions(questions, count) {
  return questions.slice(0, count).map((q, i) => {
    const options = Array.isArray(q.options) ? q.options.slice(0, 4) : [];

    // Derive correctIndex by matching correctAnswer text against options
    // This is far more reliable than trusting the AI to count array indices
    let correctIndex = -1;
    if (q.correctAnswer !== undefined) {
      const target = String(q.correctAnswer).trim().toLowerCase();
      correctIndex = options.findIndex(opt => String(opt).trim().toLowerCase() === target);
    }
    // Fallback to correctIndex field if correctAnswer matching fails
    if (correctIndex === -1 && q.correctIndex !== undefined) {
      const raw = parseInt(String(q.correctIndex), 10);
      correctIndex = isNaN(raw) ? 0 : Math.max(0, Math.min(options.length - 1, raw));
    }
    if (correctIndex === -1) correctIndex = 0;

    // Warn in dev if explanation contradicts the correct answer being in options
    if (process.env.NODE_ENV === 'development' && q.explanation) {
      const correctOption = options[correctIndex];
      const explanationSaysNotOption = /not an option|not available|not listed/i.test(q.explanation);
      if (explanationSaysNotOption) {
        console.warn(`[quizUtils] Q${i + 1}: explanation says answer is not an option but correctAnswer="${correctOption}" was found in options. AI hallucination detected.`);
      }
    }

    return {
      id: i + 1,
      question: q.question,
      options,
      correctIndex,
      explanation: q.explanation || 'Great answer!',
    };
  });
}
