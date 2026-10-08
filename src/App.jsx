import { useState, useEffect, useCallback } from 'react'
import HomePage from './components/HomePage.jsx'
import ExamConfig from './components/ExamConfig.jsx'
import QuizScreen from './components/QuizScreen.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import './App.css'

export default function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [screen, setScreen] = useState('home')
  const [examMode, setExamMode] = useState(null) // 'mini' | 'mock' | 'full'
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [examConfig, setExamConfig] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [results, setResults] = useState(null)

  const loadData = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetch('/data/all_bcs_by_topic.json').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }),
      fetch('/data/501_sentence_completion.json').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }),
      fetch('/data/gre_sentence_completion.json').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }),
    ])
      .then(([bcs, raw501, rawGRE]) => {
        const topic501 = transform501(raw501)
        const topicGRE = transformGRE(rawGRE)
        const extras = [topic501, topicGRE]
        const merged = {
          ...bcs,
          topics: [...bcs.topics, ...extras],
          total_questions: bcs.total_questions + extras.reduce((s, t) => s + t.total_questions, 0),
          total_topics: bcs.total_topics + extras.length,
        }
        setData(merged)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  function transformGRE(raw) {
    const questions = raw.map(q => ({
      exam: `Test ${q.test}`,
      exam_slug: `test-${q.test}`,
      question_no: q.question_number,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
    }))
    return {
      subject_key: 'GRE-SENTENCE-COMPLETION',
      subject: 'GRE Sentence Completion',
      total_questions: questions.length,
      questions,
      questionBatchSize: 30,
    }
  }

  function transform501(raw) {
    const questions = raw.map(q => ({
      exam: `Chapter ${q.chapter}`,
      exam_slug: `chapter-${q.chapter}`,
      question_no: q.question_number,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }))
    return {
      subject_key: '501-SENTENCE-COMPLETION',
      subject: '501 Sentence Completion',
      total_questions: questions.length,
      questions,
      batchSizeOverrides: { mini: 5, mock: 20 },
    }
  }

  useEffect(() => { loadData() }, [loadData])

  const handleModeSelect = (mode) => {
    setExamMode(mode)
  }

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic)
    setScreen('config')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleStartExam = (config) => {
    const topicData = data.topics.find(t => t.subject_key === selectedTopic.subject_key)
    let questions

    if (config.selectedQuestions) {
      // Question-count batch mode: questions already selected
      questions = config.selectedQuestions.filter(q => q.correct_answer)
    } else {
      questions = topicData.questions.filter(q => q.correct_answer)
      // Filter to specific exam slugs (mini / mock) or use all (full)
      if (config.selectedExamSlugs?.length) {
        questions = questions.filter(q => config.selectedExamSlugs.includes(q.exam_slug))
      }
    }

    if (config.randomize) {
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]]
      }
    }

    // Full mode allows limiting count; mini/mock use all from the batch
    if (config.count != null) {
      questions = questions.slice(0, config.count)
    }

    setExamConfig(config)
    setQuizQuestions(questions)
    setScreen('quiz')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleQuizComplete = (res) => {
    setResults(res)
    setScreen('results')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRestart = () => {
    setScreen('home')
    setSelectedTopic(null)
    setExamConfig(null)
    setQuizQuestions([])
    setResults(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="app">
        <AppHeader data={null} onLogoClick={() => {}} />
        <main className="app-main">
          <div className="loading-screen">
            <div className="spinner" />
            <p className="loading-text">প্রশ্নব্যাংক লোড হচ্ছে...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <AppHeader data={null} onLogoClick={() => {}} />
        <main className="app-main">
          <div className="error-screen">
            <h2>⚠️ লোড করা যায়নি</h2>
            <p>ডেটা লোড করতে সমস্যা হয়েছে: {error}</p>
            <button className="error-retry-btn" onClick={loadData}>আবার চেষ্টা করুন</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <AppHeader data={data} onLogoClick={handleRestart} />
      <main className="app-main">
        {screen === 'home' && (
          <HomePage
            data={data}
            examMode={examMode}
            onModeSelect={handleModeSelect}
            onTopicSelect={handleTopicSelect}
          />
        )}
        {screen === 'config' && (
          <ExamConfig
            examMode={examMode}
            topic={selectedTopic}
            topicData={data.topics.find(t => t.subject_key === selectedTopic.subject_key)}
            onStart={handleStartExam}
            onBack={() => setScreen('home')}
          />
        )}
        {screen === 'quiz' && (
          <QuizScreen
            questions={quizQuestions}
            config={examConfig}
            topic={selectedTopic}
            onComplete={handleQuizComplete}
            onExit={handleRestart}
          />
        )}
        {screen === 'results' && (
          <ResultScreen
            results={results}
            topic={selectedTopic}
            examMode={examMode}
            onRestart={handleRestart}
            onRetake={() => handleStartExam(examConfig)}
          />
        )}
      </main>
      <AppFooter />
    </div>
  )
}

function AppFooter() {
  return (
    <footer className="app-footer">
      <p>
        Developed by{' '}
        <a
          href="https://jahidshawon.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          Jahid Hasan Shawon
        </a>
      </p>
    </footer>
  )
}

function AppHeader({ data, onLogoClick }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo" onClick={onLogoClick} role="button" tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onLogoClick()}>
          <span className="logo-icon">📚</span>
          <span className="logo-text">Exam Portal</span>
        </div>
        {data && (
          <div className="header-badges">
            <span className="header-badge">{data.total_questions.toLocaleString()} প্রশ্ন</span>
            <span className="header-badge">{data.total_exams} পরীক্ষা</span>
            <span className="header-badge">{data.total_topics} বিষয়</span>
          </div>
        )}
      </div>
    </header>
  )
}
