import { useRef, useEffect, useState, useCallback } from 'react'
import { Camera, CameraOff, Play, StopCircle } from 'lucide-react'

// MediaPipe hand connection indices
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],           // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],           // Index
  [0, 9], [9, 10], [10, 11], [11, 12],      // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],    // Ring
  [0, 17], [17, 18], [18, 19], [19, 20],    // Pinky
  [5, 9], [9, 13], [13, 17]                 // Palm connections
]

const HAND_POINT_COUNT = 21

export default function WebcamFeed({
  cameraOn, setCameraOn, detecting, setDetecting,
  mode, onSignDetected, onWordConfirmed, backendStatus
}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const overlayCanvasRef = useRef(null)
  const wsRef = useRef(null)
  const streamRef = useRef(null)
  const loopRef = useRef(null)
  const waitingRef = useRef(false)
  const modeRef = useRef(mode)
  const holdRef = useRef({ letter: '', start: 0, confirmed: false })
  const [holdProgress, setHoldProgress] = useState(0)
  const [pendingSign, setPendingSign] = useState('')
  const [camError, setCamError] = useState('')
  const [handCount, setHandCount] = useState(0)

  const HOLD_DURATION = 500
  const WS_URL = 'ws://localhost:8000/ws/detect'
  const isWordsMode = mode === 'words'
  const requiredHands = isWordsMode ? 2 : 1

  const drawLandmarks = useCallback((landmarks) => {
    const overlayCanvas = overlayCanvasRef.current
    const video = videoRef.current
    if (!overlayCanvas || !video || landmarks.length === 0) return

    const ctx = overlayCanvas.getContext('2d')
    const width = video.clientWidth
    const height = video.clientHeight

    if (overlayCanvas.width !== width || overlayCanvas.height !== height) {
      overlayCanvas.width = width
      overlayCanvas.height = height
    }

    ctx.clearRect(0, 0, width, height)

    const handCount = Math.ceil(landmarks.length / HAND_POINT_COUNT)
    for (let handIndex = 0; handIndex < handCount; handIndex += 1) {
      const offset = handIndex * HAND_POINT_COUNT
      const isFirstHand = handIndex === 0

      ctx.strokeStyle = isFirstHand ? 'rgba(0, 200, 255, 0.6)' : 'rgba(255, 165, 0, 0.75)'
      ctx.lineWidth = 2
      HAND_CONNECTIONS.forEach(([start, end]) => {
        const i1 = offset + start
        const i2 = offset + end
        if (i1 < landmarks.length && i2 < landmarks.length) {
          const p1 = landmarks[i1]
          const p2 = landmarks[i2]
          ctx.beginPath()
          ctx.moveTo(p1.x * width, p1.y * height)
          ctx.lineTo(p2.x * width, p2.y * height)
          ctx.stroke()
        }
      })
    }

    landmarks.forEach((lm, i) => {
      const handIndex = Math.floor(i / HAND_POINT_COUNT)
      const x = lm.x * width
      const y = lm.y * height
      ctx.fillStyle = handIndex === 0 ? 'rgba(0, 200, 255, 0.9)' : 'rgba(255, 165, 0, 0.9)'
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.lineWidth = 1
      ctx.stroke()
    })
  }, [])

  const startCamera = useCallback(async () => {
    setCamError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        if (overlayCanvasRef.current) {
          overlayCanvasRef.current.width = videoRef.current.videoWidth
          overlayCanvasRef.current.height = videoRef.current.videoHeight
        }
      }
      setCameraOn(true)
    } catch (err) {
      setCamError('Camera access denied. Please allow camera permissions.')
      console.error(err)
    }
  }, [setCameraOn])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
    stopDetection()
  }, [setCameraOn])

  const clearOverlay = useCallback(() => {
    if (!overlayCanvasRef.current) return
    const ctx = overlayCanvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
  }, [])

  const startLoop = useCallback(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    const ctx = canvas.getContext('2d')
    const sendFrame = () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || waitingRef.current) return
      if (!video || video.readyState < 2) {
        requestAnimationFrame(sendFrame)
        return
      }

      waitingRef.current = true
      canvas.width = 320
      canvas.height = 240
      ctx.drawImage(video, 0, 0, 320, 240)
      const dataURL = canvas.toDataURL('image/jpeg', 0.6)
      console.log('Sending frame, mode:', modeRef.current)
      wsRef.current.send(JSON.stringify({ image: dataURL, mode: modeRef.current }))
    }

    sendFrame()
  }, [])

  const startDetection = useCallback(() => {
    if (!cameraOn) return
    console.log('Starting detection')
    wsRef.current = new WebSocket(WS_URL)
    wsRef.current.onopen = () => {
      console.log('WebSocket opened')
      setDetecting(true)
      startLoop()
    }
    wsRef.current.onmessage = (e) => {
      waitingRef.current = false
      const data = JSON.parse(e.data)
      console.log('Message received:', data)
      
      // Calculate hand count from landmarks
      const numLandmarks = data.landmarks?.length || 0
      const detectedHands = numLandmarks > 0 ? Math.ceil(numLandmarks / 21) : 0
      setHandCount(detectedHands)
      
      if (data.landmarks && data.landmarks.length > 0) {
        drawLandmarks(data.landmarks)
      } else {
        clearOverlay()
      }
      onSignDetected(data)

      const letter = data.letter
      if (!letter) {
        holdRef.current = { letter: '', start: 0, confirmed: false }
        setPendingSign('')
        setHoldProgress(0)
      } else {
        const now = Date.now()
        if (holdRef.current.letter !== letter) {
          holdRef.current = { letter, start: now, confirmed: false }
          setPendingSign(letter)
          setHoldProgress(0)
        } else {
          const elapsed = now - holdRef.current.start
          const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100)
          setHoldProgress(progress)
          if (elapsed >= HOLD_DURATION && !holdRef.current.confirmed) {
            holdRef.current.confirmed = true
            onWordConfirmed(letter)
            holdRef.current = { letter: '', start: 0, confirmed: false }
            setPendingSign('')
            setHoldProgress(0)
          }
        }
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        startLoop()
      }
    }
    wsRef.current.onerror = () => console.error('WS error')
    wsRef.current.onclose = () => setDetecting(false)
  }, [cameraOn, onSignDetected, onWordConfirmed, setDetecting, drawLandmarks, clearOverlay, startLoop])

  const stopDetection = useCallback(() => {
    waitingRef.current = false
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    setDetecting(false)
    setPendingSign('')
    setHoldProgress(0)
    clearOverlay()
  }, [setDetecting, clearOverlay])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    if (cameraOn && backendStatus === 'online' && !detecting) {
      startDetection()
    }
  }, [cameraOn, backendStatus, detecting, startDetection])

  useEffect(() => () => { stopCamera(); stopDetection() }, [])

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border)', gap: 'var(--space-2)', flexWrap: 'wrap', minHeight: '44px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Camera size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>Camera Feed</span>
          {isWordsMode && (
            <span style={{
              fontSize: 'var(--text-xs)', fontWeight: 600,
              background: handCount === 2 ? 'oklch(from #22c55e l c h / 0.1)' : 'oklch(from var(--accent) l c h / 0.1)',
              color: handCount === 2 ? '#22c55e' : 'var(--accent)',
              padding: '2px 8px', borderRadius: 'var(--radius-md)',
              border: handCount === 2 ? '1px solid #22c55e' : '1px solid var(--accent)',
              whiteSpace: 'nowrap'
            }}>
              👐 {handCount}/2 Hands
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {detecting && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} className="animate-detecting" />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>DETECTING</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, background: 'var(--offset)', overflow: 'hidden', minHeight: '200px' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: cameraOn ? 'block' : 'none',
            transform: 'scaleX(-1)',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />

        <canvas
          ref={overlayCanvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: cameraOn && detecting ? 'block' : 'none',
            transform: 'scaleX(-1)',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {!cameraOn && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-3)',
            color: 'var(--text-faint)',
            padding: 'var(--space-4)'
          }}>
            <CameraOff size={40} />
            <p style={{ fontSize: 'var(--text-sm)', textAlign: 'center', maxWidth: '220px' }}>
              {camError || 'Click "Start Camera" to begin detection'}
            </p>
          </div>
        )}

        {detecting && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {/* Hand count indicator for Words mode */}
            {isWordsMode && (
              <div style={{
                position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
                background: handCount === 2 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(124, 108, 242, 0.2)',
                border: handCount === 2 ? '2px solid #22c55e' : '2px solid #7c6cf2',
                borderRadius: 'var(--radius-lg)',
                padding: '8px 16px',
                fontSize: 'var(--text-sm)', fontWeight: 700,
                color: handCount === 2 ? '#22c55e' : '#7c6cf2',
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(8px)'
              }}>
                {handCount === 0 ? '👐 Place 2 Hands' : handCount === 1 ? '👐 Need 1 More Hand' : '👐 Perfect! 2 Hands'}
              </div>
            )}
            {[['0', '0', 'top', 'left'], ['0', 'auto', 'top', 'right'], ['auto', '0', 'bottom', 'left'], ['auto', 'auto', 'bottom', 'right']].map(([t, r, tc, lc], i) => (
              <div key={i} style={{
                position: 'absolute',
                top: tc === 'top' ? '8px' : 'auto',
                right: lc === 'right' ? '8px' : 'auto',
                bottom: tc === 'bottom' ? '8px' : 'auto',
                left: lc === 'left' ? '8px' : 'auto',
                width: '20px',
                height: '20px',
                borderTop: tc === 'top' ? '2px solid var(--primary)' : 'none',
                borderBottom: tc === 'bottom' ? '2px solid var(--primary)' : 'none',
                borderLeft: lc === 'left' ? '2px solid var(--primary)' : 'none',
                borderRight: lc === 'right' ? '2px solid var(--primary)' : 'none'
              }} />
            ))}
          </div>
        )}

        {pendingSign && (
          <div style={{
            position: 'absolute',
            bottom: 'var(--space-3)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'oklch(from var(--bg) l c h / 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-3) var(--space-4)',
            textAlign: 'center',
            minWidth: '140px',
            zIndex: 10,
            maxWidth: '90%'
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }} className="gradient-text">
              {pendingSign}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '4px 0 3px' }}>
              Hold to confirm...
            </div>
            <div className="confidence-bar">
              <div className="confidence-fill" style={{ width: `${holdProgress}%`, transition: 'width 0.1s linear' }} />
            </div>
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
        gap: 'var(--space-2)',
        padding: 'var(--space-3) var(--space-4)',
        borderTop: '1px solid var(--border)',
        '@media': '(min-width: 768px) { display: flex; gap: var(--space-3); padding: var(--space-4) var(--space-5) }'
      }}>
        {!cameraOn ? (
          <button className="btn-primary" onClick={startCamera} style={{ flex: 1, minHeight: '44px', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', '@media': '(max-width: 640px) { gridColumn: "1 / -1" }' }}>
            <Camera size={15} /> <span className="hidden sm:inline">Start Camera</span>
          </button>
        ) : (
          <>
            {!detecting ? (
              <button
                className="btn-primary"
                onClick={startDetection}
                disabled={backendStatus !== 'online'}
                style={{ flex: 1, minHeight: '44px', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', opacity: backendStatus !== 'online' ? 0.5 : 1, '@media': '(max-width: 640px) { gridColumn: "1 / -1" }' }}
              >
                <Play size={15} /> <span className="hidden sm:inline">Start Detecting</span>
              </button>
            ) : (
              <button className="btn-secondary" onClick={stopDetection} style={{ flex: 1, minHeight: '44px', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
                <StopCircle size={15} /> <span className="hidden sm:inline">Stop Detecting</span>
              </button>
            )}
            <button className="btn-danger" style={{ minHeight: '44px', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)' }} onClick={stopCamera}>
              <CameraOff size={15} /> <span className="hidden sm:inline">Stop</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}