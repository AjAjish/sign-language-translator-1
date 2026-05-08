import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

const features = [
  { icon: '🤟', title: 'ASL Detection', desc: 'Real-time American Sign Language alphabet recognition via MediaPipe hand tracking at 30 FPS.' },
  { icon: '⏱️', title: '2-Second Confirm', desc: 'Hold a sign for 2 seconds to confirm — preventing accidental typing with smart debouncing.' },
  { icon: '📝', title: 'Auto Type to DOCX', desc: 'Every confirmed letter or word is instantly typed into a live Word document preview.' },
  { icon: '🌐', title: 'Live Translation', desc: 'Translate detected English text to Hindi, Tamil, and Malayalam in real-time.' },
  { icon: '⌫', title: 'Smart Editing', desc: 'Backspace to delete the last word, Clear to wipe all text, Restart to begin fresh detection.' },
  { icon: '📥', title: 'Export DOCX', desc: 'Download your full session as a professionally formatted Word document with one click.' },
]

const modes = [
  { id: 'asl', label: 'ASL', icon: '🔤', desc: 'Alphabet signs' },
  { id: 'words', label: 'Words', icon: '💬', desc: 'Gesture vocabulary' },
  { id: 'hindi', label: 'Hindi', icon: '🇮🇳', desc: 'Hindi script output' },
  { id: 'eng-hi', label: 'EN→HI', icon: '🔄', desc: 'Translate to Hindi' },
  { id: 'eng-ta', label: 'EN→TA', icon: '🔄', desc: 'Translate to Tamil' },
  { id: 'eng-ml', label: 'EN→ML', icon: '🔄', desc: 'Translate to Malayalam' },
]

export default function Landing() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('animate-fade-in')
        }),
      { threshold: 0.1 }
    )

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100dvh' }}>
      
      {/* NAV */}
      <nav className="glass" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          padding: '0 var(--space-4) 0 var(--space-4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '64px', gap: 'var(--space-4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
            <LogoSVG size={32} />
            <span className="gradient-text" style={{ fontWeight: 700, fontSize: 'var(--text-lg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              SignLang AI
            </span>
          </div>

          {/* Desktop menu */}
          <div style={{ display: 'none', gap: 'var(--space-4)', alignItems: 'center' }} className="md:flex">
            <span className="badge badge-success">● Live</span>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}
            >
              Docs
            </a>

            <button className="btn-primary" onClick={() => navigate('/detect')}>
              Get Started →
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              color: 'var(--text)',
              padding: 0
            }}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
            '@media': '(min-width: 768px) { display: none }'
          }}>
            <span className="badge badge-success">● Live</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}
            >
              Docs
            </a>
            <button className="btn-primary" onClick={() => { navigate('/detect'); setMobileMenuOpen(false) }} style={{ width: '100%' }}>
              Get Started →
            </button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section ref={heroRef} style={{
        paddingTop: '100px',
        paddingBottom: 'var(--space-16)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: 'var(--space-16) var(--space-4) var(--space-12) var(--space-4)',
        '@media': '(min-width: 768px) { paddingTop: 140px; paddingBottom: 100px }'
      }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          
          <h1 style={{
            fontSize: 'clamp(1.875rem, 5vw, 3.5rem)',
            fontWeight: 900,
            marginBottom: 'var(--space-4)', lineHeight: 1.2
          }}>
            Translate Sign Language
            <br />
            <span className="gradient-text">into Words, Instantly</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 3vw, 1.125rem)',
            color: 'var(--text-muted)',
            marginBottom: 'var(--space-8)', padding: '0 var(--space-2)'
          }}>
            Point your camera, make a sign — watch it type itself into a Word document.
          </p>

          <button
            className="btn-primary"
            onClick={() => navigate('/detect')}
            style={{ minHeight: '44px', fontSize: 'var(--text-base)' }}
          >
            🚀 Start Detecting
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: 'var(--space-12) var(--space-4)', '@media': '(min-width: 768px) { padding: var(--space-16) var(--space-8) }' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <div
            className="reveal"
            style={{
              textAlign: 'center',
              marginBottom: 'var(--space-8)',
              opacity: 0
            }}
          >
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
              Everything you need
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              A complete sign language detection workflow in one app.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--space-3)', '@media': '(min-width: 768px) { gap: var(--space-4) }'
          }}>
            {features.map((f, i) => (
              <div
                key={i}
                className="card reveal"
                style={{ padding: 'var(--space-4) var(--space-4)', opacity: 0, '@media': '(min-width: 768px) { padding: var(--space-6) }' }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>{f.icon}</div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>{f.title}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODES SECTION */}
      <section style={{ padding: 'var(--space-12) var(--space-4)', '@media': '(min-width: 768px) { padding: var(--space-16) var(--space-8) }', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
              Multiple Detection Modes
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Choose the mode that works best for you.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'var(--space-3)', '@media': '(min-width: 768px) { gap: var(--space-4); gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }'
          }}>
            {modes.map((m) => (
              <div
                key={m.id}
                className="card"
                style={{ padding: 'var(--space-4)', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', '@media': '(min-width: 768px) { padding: var(--space-6) }' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-hl)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>{m.icon}</div>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>{m.label}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: 'var(--space-6) var(--space-4)', textAlign: 'center', '@media': '(min-width: 768px) { padding: var(--space-8) }'
      }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>SignLang AI · Built with FastAPI + React + MediaPipe</p>
      </footer>
    </div>
  )
}

function LogoSVG({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill="#06aad8" />
      <text x="16" y="22" textAnchor="middle" fontSize="16" fill="white">🤟</text>
    </svg>
  )
}