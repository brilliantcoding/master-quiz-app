import { useEffect, useState } from 'react';
import { saveQuizResult } from '../../services/firebase';
import './ResultsScreen.css';

const GRADE_MESSAGES = {
  100: { emoji: '🏆', title: 'Perfect Score!', msg: 'Outstanding! You got every single question right!' },
  90: { emoji: '🌟', title: 'Excellent!', msg: 'Incredible work! You really know your stuff.' },
  80: { emoji: '🎉', title: 'Great Job!', msg: 'Impressive performance! Keep up the great work.' },
  70: { emoji: '👏', title: 'Good Work!', msg: 'You did well! A little more practice and you\'ll master this.' },
  60: { emoji: '💪', title: 'Keep Going!', msg: 'Decent effort! Review the topics you missed and try again.' },
  0: { emoji: '📚', title: 'Keep Learning!', msg: 'Don\'t give up! Practice makes perfect. Try again!' },
};

function getResultRating(percentage) {
  const thresholds = [100, 90, 80, 70, 60, 0];
  for (const t of thresholds) {
    if (percentage >= t) return GRADE_MESSAGES[t];
  }
  return GRADE_MESSAGES[0];
}

function AnimatedNumber({ value, duration = 1200, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplay(Math.round(start));
      if (start >= value) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{display}{suffix}</>;
}

function CircleGauge({ percentage }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    setTimeout(() => {
      setOffset(circumference - (percentage / 100) * circumference);
    }, 300);
  }, [percentage, circumference]);

  const color = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="gauge-container">
      <svg viewBox="0 0 160 160" className="gauge-svg">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease', filter: `drop-shadow(0 0 10px ${color}80)` }}
        />
        <text x="80" y="72" textAnchor="middle" fill="white" fontSize="30" fontWeight="800" fontFamily="Outfit, sans-serif">
          <AnimatedNumber value={percentage} />
        </text>
        <text x="80" y="92" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="12" fontFamily="Outfit, sans-serif">%</text>
      </svg>
    </div>
  );
}

function QuestionBreakdown({ questions, answers }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="breakdown-section">
      <button className="breakdown-toggle" onClick={() => setOpen(!open)} id="breakdown-toggle">
        <span>📋 Question Breakdown</span>
        <span className={`chevron ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="breakdown-list">
          {questions.map((q, i) => {
            const ans = answers[i];
            const isCorrect = ans?.isCorrect;
            const skipped = ans?.skipped;
            return (
              <div key={i} className={`breakdown-item ${isCorrect ? 'b-correct' : skipped ? 'b-skipped' : 'b-wrong'}`}>
                <div className="b-header">
                  <span className="b-num">Q{i + 1}</span>
                  <span className="b-icon">{skipped ? '⏭️' : isCorrect ? '✅' : '❌'}</span>
                </div>
                <p className="b-question">{q.question}</p>
                {!skipped && (
                  <>
                    <p className="b-answer">
                      Your answer: <strong>{q.options[ans?.selectedIndex] || '—'}</strong>
                    </p>
                    {!isCorrect && (
                      <p className="b-correct-ans">
                        Correct: <strong>{q.options[q.correctIndex]}</strong>
                      </p>
                    )}
                    <p className="b-explanation">{q.explanation}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ResultsScreen({ questions, answers, config, metrics, onRetry, onNewQuiz }) {
  const [saved, setSaved] = useState(false);
  const rating = getResultRating(metrics.percentage);

  useEffect(() => {
    const resultData = {
      grade: config.grade,
      subject: config.subject,
      difficulty: config.difficulty,
      questionCount: config.count,
      correct: metrics.correct,
      wrong: metrics.wrong,
      skipped: metrics.skipped,
      percentage: metrics.percentage,
      totalTimeMs: metrics.totalTime,
      timerEnabled: config.timerEnabled,
      model: config.model || null,
      // Full per-question breakdown for review
      questionDetails: questions.map((q, i) => ({
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        correctAnswer: q.options[q.correctIndex],
        explanation: q.explanation,
        userSelectedIndex: answers[i]?.selectedIndex ?? -1,
        userAnswer: answers[i]?.skipped ? null : q.options[answers[i]?.selectedIndex] ?? null,
        isCorrect: answers[i]?.isCorrect ?? false,
        skipped: answers[i]?.skipped ?? false,
        timeTakenMs: answers[i]?.timeTaken ?? 0,
      })),
    };
    saveQuizResult(resultData).then(() => setSaved(true)).catch(() => { });
  }, []);

  const formatTime = (ms) => {
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="results-screen">
      {/* Hero */}
      <div className="results-hero">
        <div className="results-emoji">{rating.emoji}</div>
        <h1 className="results-title">{rating.title}</h1>
        <p className="results-msg">{rating.msg}</p>
      </div>

      {/* Main Score */}
      <div className="results-score-card">
        <CircleGauge percentage={metrics.percentage} />

        <div className="score-stats">
          <div className="stat-item stat-correct">
            <span className="stat-num"><AnimatedNumber value={metrics.correct} /></span>
            <span className="stat-label">Correct</span>
          </div>
          <div className="stat-item stat-wrong">
            <span className="stat-num"><AnimatedNumber value={metrics.wrong} /></span>
            <span className="stat-label">Wrong</span>
          </div>
          <div className="stat-item stat-skipped">
            <span className="stat-num"><AnimatedNumber value={metrics.skipped} /></span>
            <span className="stat-label">Skipped</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-icon">⏱️</span>
          <span className="metric-value">{formatTime(metrics.totalTime)}</span>
          <span className="metric-label">Total Time</span>
        </div>
        <div className="metric-card">
          <span className="metric-icon">📊</span>
          <span className="metric-value">{metrics.avgTime}s</span>
          <span className="metric-label">Avg per Q</span>
        </div>
        <div className="metric-card">
          <span className="metric-icon">⚡</span>
          <span className="metric-value">{metrics.fastestTime.toFixed(1)}s</span>
          <span className="metric-label">Fastest</span>
        </div>
        <div className="metric-card">
          <span className="metric-icon">🐢</span>
          <span className="metric-value">{metrics.slowestTime.toFixed(1)}s</span>
          <span className="metric-label">Slowest</span>
        </div>
      </div>

      {/* Quiz Info Badge */}
      <div className="quiz-info-badge">
        <span>Grade {config.grade}</span>
        <span className="dot-sep">·</span>
        <span>{config.subject}</span>
        <span className="dot-sep">·</span>
        <span>{config.difficulty}</span>
        <span className="dot-sep">·</span>
        <span>{config.count} Questions</span>
        {config.model && <><span className="dot-sep">·</span><span className="model-badge">🤖 {config.model}</span></>}
        {saved && <><span className="dot-sep">·</span><span className="saved-badge">✓ Saved</span></>}
      </div>

      {/* Breakdown */}
      <QuestionBreakdown questions={questions} answers={answers} />

      {/* Actions */}
      <div className="results-actions">
        <button className="btn-retry" onClick={onRetry} id="retry-btn">
          🔄 Try Again
        </button>
        <button className="btn-new-quiz" onClick={onNewQuiz} id="new-quiz-btn">
          🚀 New Quiz
        </button>
      </div>
    </div>
  );
}
