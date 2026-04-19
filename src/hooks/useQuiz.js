import { useState, useCallback } from 'react';

export function useQuiz() {
  const [state, setState] = useState({
    phase: 'setup', // 'setup' | 'loading' | 'quiz' | 'results'
    questions: [],
    currentIndex: 0,
    answers: [], // { selectedIndex, isCorrect, timeTaken }
    config: null,
    startTime: null,
    questionStartTime: null,
    error: null,
  });

  const startQuiz = useCallback((questions, config) => {
    setState({
      phase: 'quiz',
      questions,
      currentIndex: 0,
      answers: [],
      config,
      startTime: Date.now(),
      questionStartTime: Date.now(),
      error: null,
    });
  }, []);

  const submitAnswer = useCallback((selectedIndex) => {
    setState(prev => {
      if (prev.phase !== 'quiz') return prev;
      const question = prev.questions[prev.currentIndex];
      const isCorrect = selectedIndex === question.correctIndex;
      const timeTaken = Date.now() - prev.questionStartTime;

      const newAnswers = [...prev.answers, { selectedIndex, isCorrect, timeTaken }];
      return {
        ...prev,
        answers: newAnswers,
        questionStartTime: Date.now(),
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.questions.length) {
        return { ...prev, phase: 'results' };
      }
      return { ...prev, currentIndex: nextIndex, questionStartTime: Date.now() };
    });
  }, []);

  const endQuiz = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'results' }));
  }, []);

  const resetQuiz = useCallback(() => {
    setState({
      phase: 'setup',
      questions: [],
      currentIndex: 0,
      answers: [],
      config: null,
      startTime: null,
      questionStartTime: null,
      error: null,
    });
  }, []);

  const setLoading = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'loading', error: null }));
  }, []);

  const setError = useCallback((error) => {
    setState(prev => ({ ...prev, phase: 'setup', error }));
  }, []);

  // Computed metrics
  const metrics = (() => {
    const { questions, answers, startTime } = state;
    if (!answers.length) return null;

    const correct = answers.filter(a => a.isCorrect).length;
    const wrong = answers.filter(a => !a.isCorrect && !a.skipped).length;
    const skipped = answers.filter(a => a.skipped).length;
    const total = questions.length;
    const percentage = Math.round((correct / total) * 100);
    const totalTime = startTime ? Date.now() - startTime : 0;

    const times = answers.filter(a => a.timeTaken > 0).map(a => a.timeTaken);
    const avgTime = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length / 1000) : 0;
    const fastestTime = times.length ? Math.min(...times) / 1000 : 0;
    const slowestTime = times.length ? Math.max(...times) / 1000 : 0;

    return { correct, wrong, skipped, total, percentage, totalTime, avgTime, fastestTime, slowestTime };
  })();

  return { state, metrics, startQuiz, submitAnswer, nextQuestion, endQuiz, resetQuiz, setLoading, setError };
}
