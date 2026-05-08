import { Delete, Download, RotateCcw, Trash2 } from 'lucide-react'

export default function ControlPanel({ onBackspace, onClear, onRestart, onDownload, hasText, detecting, cameraOn }) {
  const controls = [
    { label: 'Backspace', icon: <Delete size={16} />, onClick: onBackspace, disabled: !hasText, className: 'btn-secondary', title: 'Delete last word' },
    { label: 'Clear All', icon: <Trash2 size={16} />, onClick: onClear, disabled: !hasText && !detecting, className: 'btn-danger', title: 'Wipe all text' },
    { label: 'Restart', icon: <RotateCcw size={16} />, onClick: onRestart, disabled: !cameraOn, className: 'btn-secondary', title: 'Reset & restart camera' },
    { label: 'Download DOCX', icon: <Download size={16} />, onClick: onDownload, disabled: !hasText, className: 'btn-primary', title: 'Export Word document' },
  ]

  return (
    <div className="card" style={{ padding: 'var(--space-3) var(--space-4)', '@media': '(min-width: 768px) { padding: var(--space-4) var(--space-5) }' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          Controls
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 'var(--space-2)', '@media': '(min-width: 768px) { display: flex; gap: var(--space-3) }' }}>
        {controls.map(ctrl => (
          <button key={ctrl.label} className={ctrl.className} onClick={ctrl.onClick} disabled={ctrl.disabled} title={ctrl.title}
            style={{ 
              opacity: ctrl.disabled ? 0.4 : 1, 
              cursor: ctrl.disabled ? 'not-allowed' : 'pointer',
              minHeight: '44px',
              fontSize: 'var(--text-sm)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-3)',
              '@media': '(min-width: 768px) { padding: var(--space-3) var(--space-6) }'
            }}>
            {ctrl.icon}
            <span className="hidden sm:inline">{ctrl.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
