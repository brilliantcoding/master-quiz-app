import { useState, useEffect } from 'react';
import { getRecentResults } from '../../services/firebase';
import './SetupScreen.css';

const SUBJECTS = [
  { id: 'Math', icon: '🔢', color: '#6366f1' },
  { id: 'Science', icon: '🔬', color: '#10b981' },
  { id: 'English', icon: '📚', color: '#f59e0b' },
  { id: 'History', icon: '🏛️', color: '#ef4444' },
  { id: 'Geography', icon: '🌍', color: '#3b82f6' },
  { id: 'General Knowledge', icon: '💡', color: '#8b5cf6' },
{ id: 'Computer Science', icon: '💻', color: '#f97316' },
];

const DIFFICULTIES = [
  { id: 'Easy', icon: '🌱', desc: 'Perfect for beginners', color: '#10b981' },
  { id: 'Medium', icon: '⚡', desc: 'A good challenge', color: '#f59e0b' },
  { id: 'Hard', icon: '🔥', desc: 'Push your limits', color: '#ef4444' },
];

const QUESTION_COUNTS = [5, 10, 15, 20];

function getTimerSeconds(count, difficulty) {
  const base = { Easy: 30, Medium: 25, Hard: 20 };
  return count * (base[difficulty] || 25);
}

export function SetupScreen({ onStart, isLoading, error }) {
  const [grade, setGrade] = useState(5);
  const [subject, setSubject] = useState('Math');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyResults, setHistoryResults] = useState([]);

  // Free AI toggle - when off, uses Claude Haiku 4.5
  const [freeAIEnabled, setFreeAIEnabled] = useState(() => {
    return localStorage.getItem('free-ai-enabled') !== 'false';
  });

  const handleFreeAIToggle = () => {
    const newVal = !freeAIEnabled;
    setFreeAIEnabled(newVal);
    localStorage.setItem('free-ai-enabled', newVal);
  };

  const timerSeconds = getTimerSeconds(questionCount, difficulty);

  const handleStart = () => {
    setShowConfirmation(true);
  };

  const handleConfirmStart = () => {
    setShowConfirmation(false);
    onStart({ grade, subject, difficulty, count: questionCount, timerEnabled, timerSeconds });
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleShowHistory = async () => {
    const results = await getRecentResults(20);
    setHistoryResults(results);
    setShowHistory(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="setup-screen">
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="modal-overlay" onClick={handleCancelConfirmation}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Confirm Quiz Settings</div>
            <p className="modal-subtitle">Ready to start? Review your selections below.</p>
            <div className="confirm-grid">
              <div className="confirm-row"><span className="confirm-label">Grade</span><span className="confirm-value">Grade {grade}</span></div>
              <div className="confirm-row"><span className="confirm-label">Subject</span><span className="confirm-value">{SUBJECTS.find(s => s.id === subject)?.icon} {subject}</span></div>
              <div className="confirm-row"><span className="confirm-label">Difficulty</span><span className="confirm-value">{DIFFICULTIES.find(d => d.id === difficulty)?.icon} {difficulty}</span></div>
              <div className="confirm-row"><span className="confirm-label">Questions</span><span className="confirm-value">{questionCount}</span></div>
              <div className="confirm-row"><span className="confirm-label">Timer</span><span className="confirm-value">{timerEnabled ? `${Math.floor(timerSeconds / 60)}m ${timerSeconds % 60}s` : 'Off'}</span></div>
              {import.meta.env.DEV && (
                <div className="confirm-row"><span className="confirm-label">AI Model</span><span className="confirm-value">{freeAIEnabled ? 'Free AI (NVIDIA)' : 'Claude Haiku'}</span></div>
              )}
            </div>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={handleCancelConfirmation}>← Go Back</button>
              <button className="modal-btn-start" onClick={handleConfirmStart}>🚀 Start Quiz</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-card modal-card-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-title">📋 Past Tests</div>
            <p className="modal-subtitle">Your recent quiz results</p>
            {historyResults.length === 0 ? (
              <p className="history-empty">No past tests found. Complete a quiz to see your history!</p>
            ) : (
              <div className="history-list">
                {historyResults.map((r, i) => (
                  <div key={i} className={`history-item ${r.percentage >= 80 ? 'hist-good' : r.percentage >= 60 ? 'hist-avg' : 'hist-poor'}`}>
                    <div className="hist-main">
                      <span className="hist-subject">{r.subject}</span>
                      <span className="hist-meta">Grade {r.grade} · {r.difficulty} · {r.questionCount}Q</span>
                    </div>
                    <div className="hist-right">
                      <span className="hist-score">{r.correct}/{r.questionCount}</span>
                      <span className="hist-pct">{r.percentage}%</span>
                    </div>
                    {r.savedAt && <span className="hist-date">{formatDate(r.savedAt)}</span>}
                  </div>
                ))}
              </div>
            )}
            <button className="modal-btn-cancel" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setShowHistory(false)}>Close</button>
          </div>
        </div>
      )}
      <div className="setup-hero">
        <div className="setup-badge">AI-Powered</div>
        <h1 className="setup-title">
          <span className="gradient-text">QuizMaster</span>
          <span className="setup-title-sub">K-12 Learning Platform</span>
        </h1>
        <p className="setup-subtitle">Personalized quizzes for every student, every subject</p>
      </div>

      <div className="setup-card">
        {/* Grade Selector */}
        <div className="setup-section">
          <label className="section-label">
            <span className="label-icon">🎓</span> Select Your Grade
          </label>
          <div className="grade-grid">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
              <button
                key={g}
                className={`grade-btn ${grade === g ? 'active' : ''}`}
                onClick={() => setGrade(g)}
                id={`grade-${g}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Selector */}
        <div className="setup-section">
          <label className="section-label">
            <span className="label-icon">📖</span> Choose Subject
          </label>
          <div className="subject-grid">
            {SUBJECTS.map(s => (
              <button
                key={s.id}
                className={`subject-btn ${subject === s.id ? 'active' : ''}`}
                onClick={() => setSubject(s.id)}
                style={{ '--subject-color': s.color }}
                id={`subject-${s.id.replace(/\s/g, '-')}`}
              >
                <span className="subject-icon">{s.icon}</span>
                <span className="subject-name">{s.id}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="setup-section">
          <label className="section-label">
            <span className="label-icon">🎯</span> Difficulty Level
          </label>
          <div className="difficulty-grid">
            {DIFFICULTIES.map(d => (
              <button
                key={d.id}
                className={`difficulty-btn ${difficulty === d.id ? 'active' : ''}`}
                onClick={() => setDifficulty(d.id)}
                style={{ '--diff-color': d.color }}
                id={`difficulty-${d.id}`}
              >
                <span className="diff-icon">{d.icon}</span>
                <span className="diff-name">{d.id}</span>
                <span className="diff-desc">{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div className="setup-section">
          <label className="section-label">
            <span className="label-icon">🔢</span> Number of Questions
          </label>
          <div className="count-grid">
            {QUESTION_COUNTS.map(c => (
              <button
                key={c}
                className={`count-btn ${questionCount === c ? 'active' : ''}`}
                onClick={() => setQuestionCount(c)}
                id={`count-${c}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Timer Toggle */}
        <div className="setup-section timer-section">
          <div className="timer-row">
            <div className="timer-info">
              <span className="label-icon">⏱️</span>
              <div>
                <div className="timer-label">Enable Timer</div>
                <div className="timer-sublabel">
                  {timerEnabled
                    ? `${Math.floor(timerSeconds / 60)}m ${timerSeconds % 60}s total (${timerSeconds / questionCount}s per question)`
                    : 'Take your time, no pressure'}
                </div>
              </div>
            </div>
            <button
              className={`toggle-btn ${timerEnabled ? 'on' : 'off'}`}
              onClick={() => setTimerEnabled(!timerEnabled)}
              id="timer-toggle"
              aria-label="Toggle timer"
            >
              <span className="toggle-knob" />
            </button>
          </div>
        </div>

        {/* Free AI Toggle */}
        {import.meta.env.DEV && (
          <div className="setup-section timer-section">
            <div className="timer-row">
              <div className="timer-info">
                <span className="label-icon">🆓</span>
                <div>
                  <div className="timer-label">Use Free AI</div>
                  <div className="timer-sublabel">
                    {freeAIEnabled
                      ? 'Uses NVIDIA AI (cascades through available models)'
                      : 'Uses Claude Haiku 4.5 (requires Anthropic API key in .env)'}
                  </div>
                </div>
              </div>
              <button
                className={`toggle-btn ${freeAIEnabled ? 'on' : 'off'}`}
                onClick={handleFreeAIToggle}
                id="free-ai-toggle"
                aria-label="Toggle Free AI"
              >
                <span className="toggle-knob" />
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="setup-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Start Button */}
        <button
          className={`start-btn ${isLoading ? 'loading' : ''}`}
          onClick={handleStart}
          disabled={isLoading}
          id="start-quiz-btn"
        >
          {isLoading ? (
            <>
              <span className="spinner" />
              Generating Quiz with AI...
            </>
          ) : (
            <>
              <span>🚀</span> Start Quiz
            </>
          )}
        </button>

        <button className="history-btn" onClick={handleShowHistory} id="history-btn">
          📋 View Past Tests
        </button>

        <div className="setup-footer">
          Grade {grade} · {subject} · {difficulty} · {questionCount} Questions
          {timerEnabled && ` · ⏱️ ${Math.floor(timerSeconds / 60)}m ${timerSeconds % 60}s`}
        </div>
      </div>
    </div>
  );
}
