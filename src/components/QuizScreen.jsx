import { useState, useEffect, useRef } from 'react'
import { cleanText, renderExplanation } from '../utils/math.js'
import './QuizScreen.css'

export default function QuizScreen({ questions, config, topic, onComplete, onExit }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showExp, setShowExp] = useState(false)
  const [answers, setAnswers] = useState({})
  const [showExitModal, setShowExitModal] = useState(false)
  const cardRef = useRef(null)

  const q = questions[idx]
  const total = questions.length
  const answered = Object.keys(answers).length
  const isAnswered = selected !== null

  const scrollToCard = () => {
    setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const handleSelect = (opt) => {
    if (isAnswered) return
    const isCorrect = opt === q.correct_answer
    setSelected(opt)
    setAnswers(prev => ({
      ...prev,
      [idx]: { selected: opt, correct: q.correct_answer, isCorrect, question: q }
    }))
  }

  const advance = () => {
    if (idx < total - 1) {
      setIdx(i => i + 1)
      setSelected(null)
      setShowExp(false)
      scrollToCard()
    } else {
      finishQuiz()
    }
  }

  const finishQuiz = () => {
    const arr = Object.values(answers)
    const correct = arr.filter(a => a.isCorrect).length
    const wrong = arr.filter(a => !a.isCorrect).length
    const skipped = total - arr.length
    const score = config.negativeMarking ? correct - wrong * 0.5 : correct
    onComplete({ total, correct, wrong, skipped, score, answers, allQuestions: questions })
  }

  const correctCount = Object.values(answers).filter(a => a.isCorrect).length
  const wrongCount   = Object.values(answers).filter(a => !a.isCorrect).length
  const progress     = ((idx + (isAnswered ? 1 : 0)) / total) * 100

  const optionClass = (opt) => {
    if (!isAnswered) return 'opt-btn'
    if (opt === q.correct_answer) return 'opt-btn correct'
    if (opt === selected)         return 'opt-btn wrong'
    return 'opt-btn dimmed'
  }

  return (
    <div className="quiz-screen">
      {/* ── Top bar ── */}
      <div className="quiz-topbar" ref={cardRef}>
        <span className="qcount">{idx + 1} / {total}</span>
        <div className="quiz-live-scores">
          <span className="ls-correct">✓ {correctCount}</span>
          <span className="ls-wrong">✗ {wrongCount}</span>
        </div>
        <button className="quiz-exit-btn" onClick={() => setShowExitModal(true)}>✕ শেষ</button>
      </div>

      {/* ── Progress bar ── */}
      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* ── Question card ── */}
      <div className="question-card">
        <div className="q-meta">
          <span className="q-exam-badge">{q.exam}</span>
          {q.question_no && <span className="q-no-badge">#{q.question_no}</span>}
        </div>

        <p className="q-text">{cleanText(q.question)}</p>

        <div className="options-list">
          {Object.entries(q.options).map(([key, val]) => (
            <button
              key={key}
              className={optionClass(key)}
              onClick={() => handleSelect(key)}
              disabled={isAnswered}
            >
              <span className="opt-key">{key}</span>
              <span className="opt-val">{cleanText(val)}</span>
              {isAnswered && key === q.correct_answer && <span className="opt-badge good">✓</span>}
              {isAnswered && key === selected && key !== q.correct_answer && <span className="opt-badge bad">✗</span>}
            </button>
          ))}
        </div>

        {/* ── Feedback & explanation ── */}
        {isAnswered && (
          <div className={`feedback-box ${selected === q.correct_answer ? 'fb-correct' : 'fb-wrong'}`}>
            <div className="fb-headline">
              {selected === q.correct_answer
                ? '🎉 সঠিক উত্তর!'
                : <span>❌ ভুল! সঠিক উত্তর: <strong>{q.correct_answer} — {cleanText(q.options[q.correct_answer])}</strong></span>}
            </div>

            {q.explanation && (
              <>
                <button
                  className="exp-toggle"
                  onClick={() => setShowExp(v => !v)}
                >
                  {showExp ? '▲ ব্যাখ্যা লুকান' : '▼ ব্যাখ্যা দেখুন'}
                </button>
                {showExp && (
                  <div
                    className="exp-text"
                    dangerouslySetInnerHTML={{ __html: renderExplanation(q.explanation) }}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Action bar ── */}
      <div className="quiz-actions">
        {!isAnswered && idx < total - 1 && (
          <button className="btn-skip" onClick={advance}>এড়িয়ে যান →</button>
        )}
        {!isAnswered && idx === total - 1 && (
          <button className="btn-skip" onClick={finishQuiz}>ফলাফল দেখুন →</button>
        )}
        {isAnswered && (
          <button className="btn-next" onClick={advance}>
            {idx < total - 1 ? 'পরবর্তী প্রশ্ন →' : 'ফলাফল দেখুন →'}
          </button>
        )}
      </div>

      {/* ── Exit confirmation modal ── */}
      {showExitModal && (
        <div className="modal-overlay" onClick={() => setShowExitModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>পরীক্ষা শেষ করবেন?</h3>
            <p>আপনি {answered}/{total} টি প্রশ্নের উত্তর দিয়েছেন।</p>
            <div className="modal-btns">
              <button className="modal-cancel" onClick={() => setShowExitModal(false)}>
                না, চালিয়ে যান
              </button>
              <button className="modal-confirm" onClick={finishQuiz}>
                হ্যাঁ, ফলাফল দেখুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
