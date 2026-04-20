import { useState, useEffect, useCallback, useRef } from 'react';
import { useTimer } from '../../hooks/useTimer';
import './QuizScreen.css';

function TimerDisplay({ timer, enabled }) {
  if (!enabled) return null;
  return (
    <div className={`timer-display ${timer.isWarning ? 'warning' : ''} ${timer.isCritical ? 'critical' : ''}`}>
      <div className="timer-ring">
        <svg viewBox="0 0 44 44" className="timer-svg">
          <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
          <circle
            cx="22" cy="22" r="18" fill="none"
            stroke={timer.isCritical ? '#ef4444' : timer.isWarning ? '#f59e0b' : '#06b6d4'}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 18}`}
            strokeDashoffset={`${2 * Math.PI * 18 * (1 - timer.percentage / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 22 22)"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
          />
        </svg>
        <span className="timer-time">{timer.formattedTime}</span>
      </div>
    </div>
  );
}

export function QuizScreen({ questions, config, answers, currentIndex, onAnswer, onNext, onEnd }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [animateIn, setAnimateIn] = useState(true);
  const [waitingForContinue, setWaitingForContinue] = useState(false);
  const continueButtonRef = useRef(null);

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = ((currentIndex) / questions.length) * 100;

  const handleTimerExpire = useCallback(() => {
    // Auto end quiz on timer expiry
    onEnd();
  }, [onEnd]);

  const timer = useTimer({
    enabled: config.timerEnabled,
    totalSeconds: config.timerSeconds,
    onExpire: handleTimerExpire,
  });

  // Start timer when quiz begins
  useEffect(() => {
    if (config.timerEnabled) timer.start();
  }, []);

  // Animate between questions
  useEffect(() => {
    setAnimateIn(false);
    setSelectedIndex(null);
    setShowFeedback(false);
    setWaitingForContinue(false);
    // Remove focus from any element to prevent default selection highlighting
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const t = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(t);
  }, [currentIndex]);

  // Scroll continue button into view when it appears on wrong answer
  useEffect(() => {
    if (!waitingForContinue) return;
    // Wait for feedbackSlide animation (0.35s) before measuring position
    const id = setTimeout(() => {
      if (!continueButtonRef.current) return;
      const rect = continueButtonRef.current.getBoundingClientRect();
      // visualViewport gives the true visible height on mobile (accounts for address bar)
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const isOffScreen = rect.bottom > viewportHeight - 16;
      if (isOffScreen) {
        const scrollY = window.pageYOffset + rect.bottom - viewportHeight + 24;
        window.scrollTo({ top: scrollY, behavior: 'smooth' });
      }
    }, 380);
    return () => clearTimeout(id);
  }, [waitingForContinue]);

  const handleContinue = () => {
    if (isLastQuestion) {
      onEnd();
    } else {
      onNext();
    }
  };

  const handleSelect = (index) => {
    if (selectedIndex !== null) return; // Already answered
    setSelectedIndex(index);
    setShowFeedback(true);
    onAnswer(index);

    const isAnswerCorrect = index === questions[currentIndex].correctIndex;
    if (isAnswerCorrect) {
      // Auto-advance after feedback delay for correct answers
      setTimeout(() => {
        if (isLastQuestion) {
          onEnd();
        } else {
          onNext();
        }
      }, 1800);
    } else {
      // Wait for user to click Continue on wrong answers
      setWaitingForContinue(true);
    }
  };

  const getOptionClass = (index) => {
    if (selectedIndex === null) return 'option-btn';
    if (index === question.correctIndex) return 'option-btn correct';
    if (index === selectedIndex && index !== question.correctIndex) return 'option-btn wrong';
    return 'option-btn dimmed';
  };

  const correct = answers.filter(a => a.isCorrect).length;
  const wrong = answers.filter(a => !a.isCorrect && !a.skipped).length;

  return (
    <div className="quiz-screen">
      {/* Header */}
      <div className="quiz-header">
        <div className="quiz-meta">
          <span className="quiz-grade-badge">Grade {config.grade}</span>
          <span className="quiz-subject-badge">{config.subject}</span>
          <span className="quiz-diff-badge" data-diff={config.difficulty}>{config.difficulty}</span>
          {config.model && <span className="quiz-model-badge">🤖 {config.model}</span>}
        </div>
        <TimerDisplay timer={timer} enabled={config.timerEnabled} />
      </div>

      {/* Progress */}
      <div className="progress-section">
        <div className="progress-info">
          <span className="progress-text">Question <strong>{currentIndex + 1}</strong> of <strong>{questions.length}</strong></span>
          <div className="score-mini">
            <span className="score-correct">✓ {correct}</span>
            <span className="score-wrong">✗ {wrong}</span>
          </div>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          <div className="progress-bar-current" style={{ left: `${progress}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div className={`question-card ${animateIn ? 'slide-in' : 'slide-out'}`}>
        <div className="question-number">Q{currentIndex + 1}</div>
        <p className="question-text">{question.question}</p>

        {/* Options */}
        <div className="options-grid">
          {question.options.map((option, index) => (
            <button
              key={index}
              className={getOptionClass(index)}
              onClick={() => handleSelect(index)}
              disabled={selectedIndex !== null}
              id={`option-${index}`}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
              {selectedIndex !== null && index === question.correctIndex && (
                <span className="option-check">✓</span>
              )}
              {selectedIndex === index && index !== question.correctIndex && (
                <span className="option-cross">✗</span>
              )}
            </button>
          ))}
        </div>

        {/* Explanation feedback */}
        {showFeedback && (
          <div className={`feedback-box ${selectedIndex === question.correctIndex ? 'feedback-correct' : 'feedback-wrong'}`}>
            <div className="feedback-header">
              {selectedIndex === question.correctIndex ? '🎉 Correct!' : '💡 Not quite!'}
            </div>
            <p className="feedback-explanation">{question.explanation}</p>
            {waitingForContinue && (
              <button className="continue-btn" onClick={handleContinue} id="continue-btn" ref={continueButtonRef}>
                {isLastQuestion ? 'See Results →' : 'Continue →'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Question Dots */}
      <div className="question-dots">
        {questions.map((_, i) => {
          const ans = answers[i];
          let dotClass = 'dot';
          if (i < currentIndex) dotClass += ans?.isCorrect ? ' dot-correct' : ' dot-wrong';
          else if (i === currentIndex) dotClass += ' dot-current';
          return <span key={i} className={dotClass} />;
        })}
      </div>
    </div>
  );
}
