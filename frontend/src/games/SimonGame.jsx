import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { submitScore } from '../api/api'

const colors = ['green', 'red', 'yellow', 'blue']
const sounds = {
  green: 415.30, // G#4
  red: 311.13,   // D#4
  yellow: 207.65, // G#3
  blue: 246.94   // B3
}

export default function SimonGame() {
  const { player } = useParams()
  const navigate = useNavigate()
  const [sequence, setSequence] = useState([])
  const [playing, setPlaying] = useState(false)
  const [userTurn, setUserTurn] = useState(false)
  const [activeColor, setActiveColor] = useState(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [userIndex, setUserIndex] = useState(0)
  const [status, setStatus] = useState('¡Listo!')
  const [countdown, setCountdown] = useState(null)
  const audioContextRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function playSound(color, duration = 0.4) {
    if (!audioContextRef.current) return
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.frequency.value = sounds[color]
    oscillator.type = 'triangle'
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  }

  async function startGame() {
    setSequence([])
    setScore(0)
    setGameOver(false)
    setPlaying(true)
    setUserIndex(0)
    
    // Countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i)
      setStatus(`Iniciando en ${i}...`)
      await new Promise(r => setTimeout(r, 800))
    }
    setCountdown(null)
    await nextRound([])
  }

  async function nextRound(currentSequence) {
    setUserTurn(false)
    setUserIndex(0)
    setStatus('Simon dice...')
    
    const newColor = colors[Math.floor(Math.random() * 4)]
    const newSequence = [...currentSequence, newColor]
    setSequence(newSequence)
    
    await playSequence(newSequence)
    setUserTurn(true)
    setStatus('¡Tu turno!')
  }

  async function playSequence(seq) {
    const baseDelay = 600
    const speedMultiplier = Math.max(0.4, 1 - (seq.length * 0.05)) // Gets faster
    const delay = baseDelay * speedMultiplier
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    for (let i = 0; i < seq.length; i++) {
      setActiveColor(seq[i])
      playSound(seq[i], delay / 1000)
      await new Promise(resolve => setTimeout(resolve, delay))
      setActiveColor(null)
      await new Promise(resolve => setTimeout(resolve, delay * 0.3))
    }
  }

  async function handleColorClick(color) {
    if (!userTurn || gameOver) return
    
    setActiveColor(color)
    playSound(color)
    setTimeout(() => setActiveColor(null), 200)

    const expectedColor = sequence[userIndex]
    
    if (color === expectedColor) {
      const newIndex = userIndex + 1
      
      if (newIndex === sequence.length) {
        setScore(prev => prev + 1)
        setUserTurn(false)
        setStatus('¡Correcto!')
        timeoutRef.current = setTimeout(() => nextRound(sequence), 1000)
      } else {
        setUserIndex(newIndex)
      }
    } else {
      setGameOver(true)
      setPlaying(false)
      setUserTurn(false)
      setStatus('¡Error!')
      playSound('yellow', 0.8) // Low buzz
      
      if (score > 0) {
        await submitScore(player, score * 10, 'simon')
      }
    }
  }

  return (
    <div className="simon-game-container">
      <motion.button 
        className="back-btn"
        onClick={() => navigate(`/game/${player}`)}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        ← Volver
      </motion.button>

      <div className="simon-ui-wrapper">
        <div className="simon-header-info">
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            SIMON
          </motion.h2>
          
          <motion.div 
            className="simon-score-panel"
            key={score}
            initial={{ scale: 1.1, color: 'var(--accent)' }}
            animate={{ scale: 1, color: '#fff' }}
          >
            <span className="label">SCORE</span>
            <span className="value">{score}</span>
          </motion.div>
        </div>

        <div className="simon-main-area">
          <div className={`simon-disk ${userTurn ? 'user-active' : ''}`}>
            <div className="simon-grid">
              {colors.map((color) => (
                <motion.button
                  key={color}
                  className={`simon-sector ${color} ${activeColor === color ? 'active' : ''}`}
                  onClick={() => handleColorClick(color)}
                  disabled={!userTurn && playing}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: userTurn ? 1.02 : 1 }}
                />
              ))}
            </div>
            
            <div className="simon-center-core">
              <div className="status-display">
                {countdown ? (
                  <motion.span 
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="countdown-num"
                  >
                    {countdown}
                  </motion.span>
                ) : (
                  <span className="status-text">{status}</span>
                )}
              </div>
              
              {!playing && !gameOver && (
                <motion.button 
                  className="simon-start-core-btn"
                  onClick={startGame}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  START
                </motion.button>
              )}
            </div>
          </div>
        </div>

        <div className="simon-footer-status">
            {playing && userTurn && (
              <motion.div 
                className="turn-indicator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                REPITE LA SECUENCIA
              </motion.div>
            )}
        </div>
      </div>

      <AnimatePresence>
        {gameOver && (
          <motion.div 
            className="game-over-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="game-over-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <div className="game-over-header">GAME OVER</div>
              <div className="final-score">
                <span className="label">PUNTUACIÓN FINAL</span>
                <span className="number">{score * 10}</span>
              </div>
              
              <div className="modal-actions">
                <button className="btn-primary" onClick={startGame}>REINTENTAR</button>
                <button className="btn-secondary" onClick={() => navigate(`/game/${player}`)}>SALIR</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
