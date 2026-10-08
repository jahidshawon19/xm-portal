import { useState } from 'react'
import './HomePage.css'

const TOPIC_META = {
  'BANGLADESH-AFFAIRS':                            { color: '#1d4ed8', bg: '#eff6ff', icon: '🇧🇩' },
  'ENGLISH-LANGUAGE':                              { color: '#15803d', bg: '#f0fdf4', icon: '🔤' },
  'INTERNATIONAL-AFFAIRS':                         { color: '#9d174d', bg: '#fdf2f8', icon: '🌍' },
  'BANGLA-LITERATURE':                             { color: '#92400e', bg: '#fffbeb', icon: '📖' },
  'MATHEMATICAL-REASONING':                        { color: '#5b21b6', bg: '#f5f3ff', icon: '🔢' },
  'GENERAL-SCIENCE':                               { color: '#065f46', bg: '#ecfdf5', icon: '🔬' },
  'BANGLA-LANGUAGE':                               { color: '#92400e', bg: '#fefce8', icon: '✍️' },
  'ENGLISH-LITERATURE':                            { color: '#064e3b', bg: '#ecfdf5', icon: '📚' },
  'MENTAL-ABILITY':                                { color: '#701a75', bg: '#fdf4ff', icon: '🧠' },
  'COMPUTER-AND-INFORMATION-TECHNOLOGY':           { color: '#0c4a6e', bg: '#f0f9ff', icon: '💻' },
  'GEOGRAPHY-ENVIRONMENT-AND-DIGESTER-MANAGEMENT': { color: '#14532d', bg: '#f0fdf4', icon: '🌏' },
  'ETHICS-VALUES-GOOD-GOVERNANCE':                 { color: '#7c2d12', bg: '#fff7ed', icon: '⚖️' },
  'Anatomy':                                       { color: '#7f1d1d', bg: '#fef2f2', icon: '🫀' },
  'Bangla':                                        { color: '#78350f', bg: '#fffbeb', icon: '🖋️' },
  'Physiology':                                    { color: '#134e4a', bg: '#f0fdfa', icon: '🧬' },
  'UNKNOWN':                                       { color: '#334155', bg: '#f1f5f9', icon: '❓' },
  '501-SENTENCE-COMPLETION':                       { color: '#0369a1', bg: '#f0f9ff', icon: '📝' },
  'GRE-SENTENCE-COMPLETION':                       { color: '#7c3aed', bg: '#f5f3ff', icon: '🎓' },
}

const DISABLED_TOPICS = new Set(['MATHEMATICAL-REASONING', 'MENTAL-ABILITY', 'UNKNOWN', 'Anatomy', 'Physiology'])

const EXAM_MODES = [
  {
    key: 'mini',
    icon: '⚡',
    name: 'Mini Test',
    bnName: 'মিনি টেস্ট',
    desc: 'প্রতিটি সেটে ৫ টি বিসিএস পরীক্ষার প্রশ্ন',
    tag: '৫ পরীক্ষা / সেট',
    color: '#16a34a',
    bg: '#f0fdf4',
    activeBg: '#dcfce7',
    border: '#86efac',
  },
  {
    key: 'mock',
    icon: '📝',
    name: 'Mock Test',
    bnName: 'মক টেস্ট',
    desc: 'প্রতিটি সেটে ১০ টি বিসিএস পরীক্ষার প্রশ্ন',
    tag: '১০ পরীক্ষা / সেট',
    color: '#d97706',
    bg: '#fffbeb',
    activeBg: '#fef3c7',
    border: '#fcd34d',
  },
  {
    key: 'full',
    icon: '🎯',
    name: 'Full Model Test',
    bnName: 'ফুল মডেল টেস্ট',
    desc: '১০ম থেকে ৫০তম বিসিএস পর্যন্ত সকল প্রশ্ন',
    tag: 'সকল পরীক্ষা',
    color: '#1d4ed8',
    bg: '#eff6ff',
    activeBg: '#dbeafe',
    border: '#93c5fd',
  },
]

function ExamModeCard({ mode, active, onClick }) {
  return (
    <button
      className={`mode-card ${active ? 'mode-card--active' : ''}`}
      style={{
        '--mc': mode.color,
        '--mc-bg': active ? mode.activeBg : mode.bg,
        '--mc-border': mode.border,
      }}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className="mode-icon">{mode.icon}</span>
      <div className="mode-info">
        <span className="mode-name">{mode.name}</span>
        <span className="mode-bn">{mode.bnName}</span>
        <span className="mode-desc">{mode.desc}</span>
      </div>
      <span className="mode-tag" style={{ color: mode.color }}>{mode.tag}</span>
      {active && <span className="mode-check">✓</span>}
    </button>
  )
}

function TopicCard({ topic, onSelect, disabled }) {
  const meta = TOPIC_META[topic.subject_key] || { color: '#334155', bg: '#f1f5f9', icon: '📋' }

  return (
    <button
      className={`topic-card ${disabled ? 'topic-card--disabled' : ''}`}
      style={{ '--accent': meta.color, '--card-bg': disabled ? '#f8fafc' : meta.bg }}
      onClick={() => !disabled && onSelect(topic)}
      aria-label={`${topic.subject} - ${topic.total_questions} টি প্রশ্ন`}
      aria-disabled={disabled}
    >
      <div className="topic-card-left">
        <span className="topic-icon">{meta.icon}</span>
        <div className="topic-info">
          <span className="topic-name">{topic.subject}</span>
          <span className="topic-count" style={{ color: disabled ? '#94a3b8' : meta.color }}>
            {topic.total_questions} প্রশ্ন
          </span>
        </div>
      </div>
      <span className="topic-arrow">›</span>
    </button>
  )
}

export default function HomePage({ data, examMode, onModeSelect, onTopicSelect }) {
  const [search, setSearch] = useState('')

  const filteredTopics = data.topics.filter(t =>
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.subject_key.toLowerCase().replace(/-/g, ' ').includes(search.toLowerCase())
  )

  const subjectLocked = !examMode

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="hero-title">বিসিএস পরীক্ষার প্রস্তুতি নিন</h1>
        <p className="hero-subtitle">
          {data.total_questions.toLocaleString()} টি প্রশ্ন · {data.total_exams} টি পরীক্ষা · {data.total_topics} টি বিষয়
        </p>
      </div>

      {/* ── Step 1: Exam mode ── */}
      <div className="section-label">
        <span className="step-badge">১</span>
        পরীক্ষার ধরন বেছে নিন
      </div>
      <div className="mode-grid">
        {EXAM_MODES.map(mode => (
          <ExamModeCard
            key={mode.key}
            mode={mode}
            active={examMode === mode.key}
            onClick={() => onModeSelect(mode.key)}
          />
        ))}
      </div>

      {/* ── Step 2: Subject ── */}
      <div className={`section-label ${subjectLocked ? 'section-label--locked' : ''}`}>
        <span className="step-badge">২</span>
        বিষয় বেছে নিন
        {subjectLocked && <span className="lock-hint">↑ আগে পরীক্ষার ধরন বেছে নিন</span>}
      </div>

      <div className={`subject-section ${subjectLocked ? 'subject-section--locked' : ''}`}>
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="search"
            className="search-input"
            placeholder="বিষয় খুঁজুন..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            disabled={subjectLocked}
            aria-label="বিষয় খুঁজুন"
          />
          {search && <button className="search-clear" onClick={() => setSearch('')} aria-label="clear">✕</button>}
        </div>

        {filteredTopics.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔎</span>
            <p>"{search}" — কোনো বিষয় পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="topics-grid">
            {filteredTopics.map(topic => (
              <TopicCard
                key={topic.subject_key}
                topic={topic}
                onSelect={onTopicSelect}
                disabled={subjectLocked || DISABLED_TOPICS.has(topic.subject_key)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
