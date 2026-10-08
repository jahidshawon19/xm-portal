import { useState, useMemo } from 'react'
import './ExamConfig.css'

const MODE_META = {
  mini: { icon: '⚡', name: 'Mini Test',       color: '#16a34a', batchSize: 5  },
  mock: { icon: '📝', name: 'Mock Test',        color: '#d97706', batchSize: 10 },
  full: { icon: '🎯', name: 'Full Model Test',  color: '#1d4ed8', batchSize: null },
}

const QUICK_COUNTS = [10, 20, 30, 50]

function getBCSNumber(examName) {
  const m = String(examName).match(/(\d+)/)
  return m ? parseInt(m[1]) : 999
}

function buildQuestionBatches(validQuestions, questionCount) {
  const batches = []
  for (let i = 0; i < validQuestions.length; i += questionCount) {
    const slice = validQuestions.slice(i, i + questionCount)
    const setNum = Math.floor(i / questionCount) + 1
    batches.push({
      id: setNum - 1,
      label: `সেট ${setNum}`,
      range: `Q${i + 1}–Q${i + slice.length}`,
      questions: slice,
      slugs: null,
      qCount: slice.length,
      examCount: new Set(slice.map(q => q.exam_slug)).size,
    })
  }
  return batches
}

function buildBatches(validQuestions, batchSize) {
  // Build sorted unique exam list
  const examMap = {}
  validQuestions.forEach(q => {
    if (!examMap[q.exam_slug]) examMap[q.exam_slug] = { slug: q.exam_slug, name: q.exam }
  })
  const sorted = Object.values(examMap).sort((a, b) => getBCSNumber(a.name) - getBCSNumber(b.name))

  const batches = []
  for (let i = 0; i < sorted.length; i += batchSize) {
    const slice = sorted.slice(i, i + batchSize)
    const slugs = slice.map(e => e.slug)
    const qCount = validQuestions.filter(q => slugs.includes(q.exam_slug)).length
    const first = slice[0].name
    const last  = slice[slice.length - 1].name
    batches.push({
      id:    i / batchSize,
      label: `সেট ${i / batchSize + 1}`,
      range: slice.length === 1 ? first : `${first} – ${last}`,
      slugs,
      qCount,
      examCount: slice.length,
    })
  }
  return batches
}

/* ─── Mini / Mock config ─── */
function BatchConfig({ batches, selected, onSelect, randomize, setRandomize, negativeMarking, setNegativeMarking }) {
  return (
    <>
      <div className="config-row">
        <label className="config-label">সেট বেছে নিন</label>
        <div className="batch-grid">
          {batches.map(b => (
            <button
              key={b.id}
              className={`batch-card ${selected?.id === b.id ? 'batch-card--active' : ''}`}
              onClick={() => onSelect(b)}
            >
              <span className="batch-label">{b.label}</span>
              <span className="batch-range">{b.range}</span>
              <span className="batch-count">{b.qCount} প্রশ্ন · {b.examCount} পরীক্ষা</span>
            </button>
          ))}
        </div>
      </div>

      <div className="config-row">
        <label className="config-label">সেটিংস</label>
        <div className="toggles">
          <ToggleRow title="প্রশ্ন এলোমেলো করুন"    desc="প্রতিটি সেশনে ক্রম পরিবর্তন হবে"         value={randomize}        onChange={setRandomize} />
          <ToggleRow title="নেগেটিভ মার্কিং"         desc="ভুল উত্তরে −০.৫ নম্বর কাটা হবে"          value={negativeMarking}  onChange={setNegativeMarking} />
        </div>
      </div>

      {selected && (
        <div className="config-summary">
          <SummaryCell label="সেট"        value={selected.label} />
          <SummaryCell label="BCS রেঞ্জ"  value={selected.range} />
          <SummaryCell label="প্রশ্ন"     value={selected.qCount} />
          <SummaryCell label="পরীক্ষা"   value={`${selected.examCount} টি`} />
        </div>
      )}
    </>
  )
}

/* ─── Full Model Test config ─── */
function FullConfig({ validQuestions, count, setCount, useAll, setUseAll, randomize, setRandomize, negativeMarking, setNegativeMarking }) {
  const total = validQuestions.length

  const examMap = {}
  validQuestions.forEach(q => { if (!examMap[q.exam_slug]) examMap[q.exam_slug] = q.exam })
  const sorted = Object.values(examMap).sort((a, b) => getBCSNumber(a) - getBCSNumber(b))
  const first = sorted[0] ?? ''
  const last  = sorted[sorted.length - 1] ?? ''
  const range = first && last ? (first === last ? first : `${first} – ${last}`) : '—'

  const actualCount = useAll ? total : Math.min(count, total)

  return (
    <>
      <div className="config-row full-range-info">
        <div className="full-range-pill">
          🗂 {range} &ensp;·&ensp; {total} টি প্রশ্ন উপলব্ধ
        </div>
      </div>

      <div className="config-row">
        <label className="config-label">প্রশ্ন সংখ্যা</label>
        <div className="count-pills">
          {QUICK_COUNTS.map(n => (
            <button
              key={n}
              className={`pill ${!useAll && count === n ? 'active' : ''}`}
              disabled={n > total}
              onClick={() => { setCount(n); setUseAll(false) }}
            >{n}</button>
          ))}
          <button
            className={`pill all ${useAll ? 'active' : ''}`}
            onClick={() => setUseAll(true)}
          >সব ({total})</button>
        </div>
      </div>

      <div className="config-row">
        <label className="config-label">সেটিংস</label>
        <div className="toggles">
          <ToggleRow title="প্রশ্ন এলোমেলো করুন"  desc="প্রতিটি সেশনে ক্রম পরিবর্তন হবে"   value={randomize}        onChange={setRandomize} />
          <ToggleRow title="নেগেটিভ মার্কিং"       desc="ভুল উত্তরে −০.৫ নম্বর কাটা হবে"    value={negativeMarking}  onChange={setNegativeMarking} />
        </div>
      </div>

      <div className="config-summary">
        <SummaryCell label="রেঞ্জ"      value={`${first.split(' ')[0]}–${last.split(' ')[0]}`} />
        <SummaryCell label="প্রশ্ন"     value={actualCount} />
        <SummaryCell label="র‍্যান্ডম"  value={randomize ? 'হ্যাঁ' : 'না'} />
        <SummaryCell label="নেগেটিভ"   value={negativeMarking ? 'হ্যাঁ' : 'না'} />
      </div>
    </>
  )
}

/* ─── Main component ─── */
export default function ExamConfig({ examMode, topic, topicData, onStart, onBack }) {
  const meta = MODE_META[examMode] ?? MODE_META.full

  // Shared toggles
  const [randomize,        setRandomize]        = useState(true)
  const [negativeMarking,  setNegativeMarking]  = useState(false)

  // Mini / Mock state
  const [selectedBatch, setSelectedBatch] = useState(null)

  // Full mode state
  const [count,  setCount]  = useState(20)
  const [useAll, setUseAll] = useState(false)

  const validQuestions = useMemo(
    () => topicData.questions.filter(q => q.correct_answer),
    [topicData]
  )

  const effectiveBatchSize = topicData.batchSizeOverrides?.[examMode] ?? meta.batchSize
  const questionBatchSize = topicData.questionBatchSize ?? null

  const batches = useMemo(() => {
    if (questionBatchSize) return buildQuestionBatches(validQuestions, questionBatchSize)
    if (!effectiveBatchSize) return []
    return buildBatches(validQuestions, effectiveBatchSize)
  }, [validQuestions, effectiveBatchSize, questionBatchSize])

  const canStart = (!effectiveBatchSize && !questionBatchSize) || selectedBatch != null

  const handleStart = () => {
    if (!canStart) return
    if (questionBatchSize) {
      onStart({ examMode, selectedQuestions: selectedBatch.questions, selectedExamSlugs: null, count: null, randomize, negativeMarking })
    } else if (!effectiveBatchSize) {
      const actualCount = useAll ? validQuestions.length : Math.min(count, validQuestions.length)
      onStart({ examMode, selectedExamSlugs: null, selectedQuestions: null, count: actualCount, randomize, negativeMarking })
    } else {
      onStart({ examMode, selectedExamSlugs: selectedBatch.slugs, selectedQuestions: null, count: null, randomize, negativeMarking })
    }
  }

  return (
    <div className="exam-config">
      <button className="back-btn" onClick={onBack}>← ফিরে যান</button>

      <div className="config-card">
        {/* Header */}
        <div className="config-header" style={{ '--hc': meta.color }}>
          <div className="config-header-top">
            <span className="config-mode-icon">{meta.icon}</span>
            <div>
              <p className="config-mode-name">{meta.name}</p>
              <h2 className="config-title">{topic.subject}</h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="config-body">
          {(effectiveBatchSize || questionBatchSize) ? (
            <BatchConfig
              batches={batches}
              selected={selectedBatch}
              onSelect={setSelectedBatch}
              randomize={randomize} setRandomize={setRandomize}
              negativeMarking={negativeMarking} setNegativeMarking={setNegativeMarking}
            />
          ) : (
            <FullConfig
              validQuestions={validQuestions}
              count={count} setCount={setCount}
              useAll={useAll} setUseAll={setUseAll}
              randomize={randomize} setRandomize={setRandomize}
              negativeMarking={negativeMarking} setNegativeMarking={setNegativeMarking}
            />
          )}
        </div>

        {/* Footer */}
        <div className="config-footer">
          <button
            className="start-btn"
            style={{ '--sc': meta.color }}
            onClick={handleStart}
            disabled={!canStart}
          >
            পরীক্ষা শুরু করুন →
          </button>
          {!canStart && (
            <p className="start-hint">উপরে থেকে একটি সেট বেছে নিন</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Shared helpers ─── */
function ToggleRow({ title, desc, value, onChange }) {
  return (
    <div className="toggle-row" onClick={() => onChange(!value)}>
      <div className="toggle-text">
        <span className="toggle-title">{title}</span>
        <span className="toggle-desc">{desc}</span>
      </div>
      <div className={`toggle-switch ${value ? 'on' : 'off'}`} role="switch" aria-checked={value}>
        <div className="toggle-thumb" />
      </div>
    </div>
  )
}

function SummaryCell({ label, value }) {
  return (
    <div className="summary-cell">
      <span className="summary-label">{label}</span>
      <strong className="summary-value">{value}</strong>
    </div>
  )
}
