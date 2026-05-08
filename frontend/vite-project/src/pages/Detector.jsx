import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from '../components/Sidebar.jsx'
import WebcamFeed from '../components/WebcamFeed.jsx'
import PreviewBox from '../components/PreviewBox.jsx'
import ControlPanel from '../components/ControlPanel.jsx'
import Translator from '../components/Translator.jsx'
import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

export default function Detector() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('asl')
  const [cameraOn, setCameraOn] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [detectedText, setDetectedText] = useState('')
  const [currentSign, setCurrentSign] = useState({ letter: '', confidence: 0 })
  const [backendStatus, setBackendStatus] = useState('checking')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Check backend health
  useEffect(() => {
    axios.get(`${BASE_URL}/health`, { timeout: 3000 })
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'))
  }, [])

  const handleSignDetected = useCallback((sign) => {
    setCurrentSign(sign)
  }, [])

  const handleWordConfirmed = useCallback((word) => {
    if (!word) return
    setDetectedText((prevText) => {
      const nextText = prevText ? `${prevText} ${word}` : word
      axios.post(`${BASE_URL}/docx/set`, { text: nextText }).catch((e) => {
        console.warn('DOCX sync failed:', e)
      })
      return nextText
    })
  }, [])

  const handleBackspace = useCallback(async () => {
    const words = detectedText.trim().split(' ')
    words.pop()
    const newText = words.join(' ')
    setDetectedText(newText)
    try { await axios.post(`${BASE_URL}/docx/set`, { text: newText }) } catch {}
  }, [detectedText])

  const handleClear = useCallback(async () => {
    setDetectedText('')
    setCurrentSign({ letter: '', confidence: 0 })
    try { await axios.post(`${BASE_URL}/docx/reset`) } catch {}
  }, [])

  const handleRestart = useCallback(() => {
    handleClear()
    setCameraOn(false)
    setTimeout(() => setCameraOn(true), 300)
  }, [handleClear])

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/docx/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `signlang_${Date.now()}.docx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) { alert('Download failed. Is the backend running?') }
  }

  const translationMode = ['eng-hi', 'eng-ta', 'eng-ml'].includes(mode) ? mode : null
  const detectMode = ['asl', 'words', 'hindi'].includes(mode) ? mode : 'asl'
  const langMap = { 'eng-hi': 'hi', 'eng-ta': 'ta', 'eng-ml': 'ml' }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleModeChange = (newMode) => {
    setMode(newMode)
    setSidebarOpen(false)
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg)', position: 'relative' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 30,
            display: 'none'
          }}
          className="mobile:block"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100dvh',
        zIndex: 40,
        transform: `translateX(${sidebarOpen ? 0 : '-100%'})`,
        transition: 'transform 0.3s ease',
        width: '220px',
        display: 'none'
      }}
        className="md:static md:block md:relative md:transform-none md:transition-none"
      >
        <Sidebar mode={mode} setMode={handleModeChange} onBack={() => navigate('/')} backendStatus={backendStatus} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header className="glass" style={{
          height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 var(--space-4)', borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 'var(--space-3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                padding: 'var(--space-2)'
              }}
              className="md:hidden"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', whiteSpace: 'nowrap' }} className="gradient-text">SignLang AI</span>
            <span className="badge badge-muted hidden sm:inline-flex">{modeLabel(mode)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span className={`badge ${backendStatus === 'online' ? 'badge-success' : 'badge-muted'} hidden sm:inline-flex`}>
              {backendStatus === 'online' ? '● Backend Online' : '○ Backend Offline'}
            </span>
            <span className={`badge ${backendStatus === 'online' ? 'badge-success' : 'badge-muted'} sm:hidden`}>
              {backendStatus === 'online' ? '●' : '○'}
            </span>
            {detecting && <span className="badge badge-primary">⚡ Detecting</span>}
          </div>
        </header>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-3) var(--space-4) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', '@media': '(min-width: 768px) { padding: var(--space-5) }' }}>
          {/* Top row: Camera + Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-3)', minHeight: 'auto' }} className="lg:grid-cols-2 lg:gap-5 lg:min-h-96">
            <WebcamFeed
              cameraOn={cameraOn}
              setCameraOn={setCameraOn}
              detecting={detecting}
              setDetecting={setDetecting}
              mode={detectMode}
              onSignDetected={handleSignDetected}
              onWordConfirmed={handleWordConfirmed}
              backendStatus={backendStatus}
            />
            <PreviewBox
              text={detectedText}
              currentSign={currentSign}
              detecting={detecting}
              mode={mode}
            />
          </div>

          {/* Control Panel */}
          <ControlPanel
            onBackspace={handleBackspace}
            onClear={handleClear}
            onRestart={handleRestart}
            onDownload={handleDownload}
            hasText={!!detectedText}
            detecting={detecting}
            cameraOn={cameraOn}
          />

          {/* Translator (conditional) */}
          {translationMode && (
            <Translator text={detectedText} selectedLanguage={langMap[translationMode]} />
          )}
        </div>
      </div>
    </div>
  )
}

function modeLabel(mode) {
  const map = { asl: '🔤 ASL', words: '💬 Words', hindi: '🇮🇳 Hindi', 'eng-hi': '🔄 EN→HI', 'eng-ta': '🔄 EN→TA', 'eng-ml': '🔄 EN→ML' }
  return map[mode] || mode
}