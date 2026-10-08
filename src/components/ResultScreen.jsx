import { useState, useEffect, useRef } from 'react'
import { cleanText, renderExplanation } from '../utils/math.js'
import './ResultScreen.css'

/* ── Animated SVG score ring ── */
function ScoreRing({ percentage }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const [offset, setOffset] = useState(circ)

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circ - (percentage / 100) * circ)
    }, 100)
    return () => clearTimeout(timer)
  }, [percentage, circ])

  const color = percentage >= 70 ? '#16a34a' : percentage >= 45 ? '#d97706' : '#dc2626'

  return (
    <div className="score-ring-wrap">
      <svg width="136" height="136" viewBox="0 0 136 136">
        <circle cx="68" cy="68" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="68" cy="68" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 68 68)"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="score-ring-center">
        <span className="score-pct" style={{ color }}>{Math.round(percentage)}%</span>
        <span className="score-pct-label">স্কোর</span>
      </div>
    </div>
  )
}

/* ── Single review item (accordion) ── */
function ReviewItem({ item, number }) {
  const [open, setOpen] = useState(false)
  const cls = item.isSkipped ? 'skipped' : item.isCorrect ? 'correct' : 'wrong'
  const icon = item.isSkipped ? '—' : item.isCorrect ? '✓' : '✗'

  return (
    <div className={`rv-item ${cls}`}>
      <button className="rv-header" onClick={() => setOpen(o => !o)}>
        <span className={`rv-icon ${cls}`}>{icon}</span>
        <span className="rv-qnum">প্রশ্ন {number}</span>
        <span className="rv-qtext">{cleanText(item.question.question)}</span>
        <span className="rv-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="rv-body">
          <div className="rv-opts">
            {Object.entries(item.question.options).map(([key, val]) => {
              let cls2 = 'rv-opt'
              if (key === item.correct) cls2 += ' rv-correct'
              else if (key === item.selected && !item.isCorrect) cls2 += ' rv-wrong'
              return (
                <div key={key} className={cls2}>
                  <span className="rv-opt-key">{key}</span>
                  <span className="rv-opt-val">{cleanText(val)}</span>
                  {key === item.correct && <span className="rv-tag green">✓ সঠিক</span>}
                  {key === item.selected && !item.isCorrect && <span className="rv-tag red">✗ আপনার উত্তর</span>}
                </div>
              )
            })}
          </div>
          {item.question.explanation && (
            <div
              className="rv-explanation"
              dangerouslySetInnerHTML={{ __html: renderExplanation(item.question.explanation) }}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default function ResultScreen({ results, topic, onRestart, onRetake }) {
  const [showReview, setShowReview] = useState(false)
  const [filter, setFilter] = useState('all')

  const { total, correct, wrong, skipped, score, answers, allQuestions } = results
  const percentage = total > 0 ? (correct / total) * 100 : 0

  const getMessage = () => {
    if (percentage >= 80) return '🏆 অসাধারণ! আপনি দুর্দান্ত করেছেন!'
    if (percentage >= 60) return '👍 ভালো করেছেন! আরো অনুশীলন করুন।'
    if (percentage >= 40) return '📚 চেষ্টা চালিয়ে যান, আরো পড়ুন।'
    return '💪 হাল ছাড়বেন না! আবার অনুশীলন করুন।'
  }

  /* build per-question review list */
  const reviewItems = allQuestions.map((q, i) => {
    const ans = answers[i]
    return {
      question: q,
      selected: ans?.selected ?? null,
      correct: q.correct_answer,
      isCorrect: ans?.isCorrect ?? false,
      isSkipped: !ans,
    }
  })

  const filtered = reviewItems.filter(item => {
    if (filter === 'correct') return item.isCorrect
    if (filter === 'wrong')   return !item.isCorrect && !item.isSkipped
    if (filter === 'skipped') return item.isSkipped
    return true
  })

  return (
    <div className="result-screen">
      <div className="result-card">
        <div className="result-header">
          <h2>পরীক্ষার ফলাফল</h2>
          <p className="result-topic-name">{topic.subject}</p>
        </div>

        <div className="result-body">
          <div className="score-section">
            <ScoreRing percentage={percentage} />
            <p className="result-message">{getMessage()}</p>
          </div>

          <div className="stats-row">
            <StatBox n={correct} label="সঠিক"    cls="sb-correct" />
            <StatBox n={wrong}   label="ভুল"      cls="sb-wrong"   />
            <StatBox n={skipped} label="এড়ানো"   cls="sb-skipped" />
            <StatBox n={total}   label="মোট"      cls="sb-total"   />
          </div>

          <div className="score-line">
            মোট স্কোর: <strong>{score % 1 === 0 ? score : score.toFixed(1)} / {total}</strong>
          </div>
        </div>

        <div className="result-actions">
          <button className="btn-home" onClick={onRestart}>🏠 হোম</button>
          <button className="btn-retake" onClick={onRetake}>🔄 আবার দিন</button>
        </div>
      </div>

      {/* ── Question Review ── */}
      <div className="review-card">
        <button className="review-toggle" onClick={() => setShowReview(v => !v)}>
          {showReview ? '▲' : '▼'}&ensp;প্রশ্ন পর্যালোচনা ({total} টি)
        </button>

        {showReview && (
          <div className="review-body">
            <div className="review-filters">
              {[
                { key: 'all',     label: `সব (${total})`     },
                { key: 'correct', label: `সঠিক (${correct})` },
                { key: 'wrong',   label: `ভুল (${wrong})`    },
                { key: 'skipped', label: `এড়ানো (${skipped})` },
              ].map(f => (
                <button
                  key={f.key}
                  className={`rf-btn ${filter === f.key ? 'active' : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="review-list">
              {filtered.length === 0 && (
                <p className="rv-empty">এই ক্যাটাগরিতে কোনো প্রশ্ন নেই।</p>
              )}
              {filtered.map((item, i) => (
                <ReviewItem key={i} item={item} number={i + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ n, label, cls }) {
  return (
    <div className={`stat-box ${cls}`}>
      <span className="sb-number">{n}</span>
      <span className="sb-label">{label}</span>
    </div>
  )
}
