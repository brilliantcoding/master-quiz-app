import { useCallback, useState, useEffect } from 'react';
import './index.css';
import { SetupScreen } from './components/Setup/SetupScreen';
import { QuizScreen } from './components/Quiz/QuizScreen';
import { ResultsScreen } from './components/Results/ResultsScreen';
import { useQuiz } from './hooks/useQuiz';
import { generateQuizQuestions } from './services/aiService';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-orb">🤖</div>
      <div className="loading-text">AI is crafting your quiz...</div>
      <div className="loading-steps">
        <span className="loading-dot" />
        <span className="loading-dot" />
        <span className="loading-dot" />
      </div>
    </div>
  );
}

function App() {
  const { state, metrics, startQuiz, submitAnswer, nextQuestion, endQuiz, resetQuiz, setLoading, setError } = useQuiz();
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage or default to 'dark'
    return localStorage.getItem('quiz-app-theme') || 'dark';
  });

  // Apply theme to document on mount and when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('quiz-app-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const handleSetupStart = useCallback(async (config) => {
    setLoading();
    try {
      const result = await generateQuizQuestions({
        grade: config.grade,
        subject: config.subject,
        difficulty: config.difficulty,
        count: config.count,
      });
      startQuiz(result.questions, { ...config, model: result.model });
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('rate limit')) {
        setError('⏳ NVIDIA rate limit reached. Please wait a minute and try again.');
      } else if (msg.includes('cut off') || msg.includes('truncated')) {
        setError('⚠️ Response was cut off. Try reducing the number of questions.');
      } else {
        setError('❌ Failed to generate questions: ' + msg);
      }
    }
  }, [startQuiz, setLoading, setError]);

  const handleRetry = useCallback(async () => {
    if (!state.config) return;
    setLoading();
    try {
      const result = await generateQuizQuestions({
        grade: state.config.grade,
        subject: state.config.subject,
        difficulty: state.config.difficulty,
        count: state.config.count,
      });
      startQuiz(result.questions, { ...state.config, model: result.model });
    } catch (err) {
      setError('Failed to generate quiz. Please try again.');
    }
  }, [state.config, startQuiz, setLoading, setError]);

  const getPhaseLabel = () => {
    switch (state.phase) {
      case 'quiz': return `${state.currentIndex + 1} / ${state.questions.length}`;
      case 'results': return 'Results';
      case 'loading': return 'Loading...';
      default: return 'Setup';
    }
  };

  return (
    <>
      <nav className="app-nav">
        <div className="nav-logo">
          <span className="nav-logo-icon">🎓</span>
          QuizMaster
        </div>
        <span className="nav-phase">{getPhaseLabel()}</span>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>

      <main>
        {state.phase === 'setup' && (
          <SetupScreen
            onStart={handleSetupStart}
            isLoading={false}
            error={state.error}
          />
        )}

        {state.phase === 'loading' && <LoadingScreen />}

        {state.phase === 'quiz' && (
          <QuizScreen
            questions={state.questions}
            config={state.config}
            answers={state.answers}
            currentIndex={state.currentIndex}
            onAnswer={submitAnswer}
            onNext={nextQuestion}
            onEnd={endQuiz}
          />
        )}

        {state.phase === 'results' && metrics && (
          <ResultsScreen
            questions={state.questions}
            answers={state.answers}
            config={state.config}
            metrics={metrics}
            onRetry={handleRetry}
            onNewQuiz={resetQuiz}
          />
        )}
      </main>
    </>
  );
}

export default App;
