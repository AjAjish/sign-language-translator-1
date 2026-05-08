import { useEffect, useRef, useState } from 'react'
import { FileText, Zap, Hand } from 'lucide-react'

export default function PreviewBox({ text, currentSign, detecting, mode }) {
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [prevText, setPrevText] = useState('')
  const [flash, setFlash] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0)
    setWordCount(words.length)
    setCharCount(text.length)
    if (text !== prevText && text.length > prevText.length) {
      setFlash(true)
      const timer = setTimeout(() => setFlash(false), 600)
      return () => clearTimeout(timer)
    }
    setPrevText(text)
  }, [text, prevText])

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border)', gap: 'var(--space-2)', flexWrap: 'wrap', minHeight: '44px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <FileText size={16} style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>Live Preview</span>
        </div>
        <span className="badge badge-muted hidden sm:inline-flex">DOCX Mirror</span>
      </div>

      {detecting && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--offset)', flexWrap: 'wrap', minHeight: '44px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Zap size={13} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {mode === 'words' ? '2-Hand Detecting' : 'Detecting'}
            </span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '120px' }}>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }} className="gradient-text">
              {currentSign?.letter || '—'}
            </span>
            {currentSign?.confidence > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, marginLeft: 'var(--space-3)', maxWidth: '120px' }}>
                <div className="confidence-bar" style={{ flex: 1, minWidth: '60px' }}>
                  <div className="confidence-fill" style={{ width: `${currentSign.confidence}%` }} />
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', minWidth: '32px', textAlign: 'right' }}>{currentSign.confidence}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-3) var(--space-4)', minHeight: '120px' }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', lineHeight: 1.8,
          color: text ? 'var(--text)' : 'var(--text-faint)',
          background: flash ? 'oklch(from var(--primary) l c h / 0.04)' : 'transparent',
          transition: 'background 0.4s ease', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3)', minHeight: '80px', whiteSpace: 'pre-wrap', wordBreak: 'break-words'
        }}>
          {text
            ? <><span>{text}</span><span className="animate-typing-cursor" /></>
            : <span style={{ fontStyle: 'italic', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)' }}>Detected text will appear here…</span>
          }
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--border)', '@media': '(min-width: 768px) { gap: var(--space-3); padding: var(--space-4) var(--space-5) }' }}>
        {[
          { label: 'Words', value: wordCount, gradient: 'linear-gradient(135deg, var(--primary), #18c7f1)' },
          { label: 'Characters', value: charCount, gradient: 'linear-gradient(135deg, var(--accent), #a78bfa)' }
        ].map(({ label, value, gradient }) => (
          <div key={label} style={{
            background: 'var(--offset)', borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3) var(--space-2)', textAlign: 'center',
            border: '1px solid var(--border)', minHeight: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center'
          }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.2 }}>
              {value}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 'var(--space-1)' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
