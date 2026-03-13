import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { submitScore } from '../api/api'
import { playUiSound } from '../audio/audioEngine'
import { useAmbientAudio } from '../audio/useAmbientAudio'

const GRID_SIZE = 4
const MAX_LEVEL = 6

function createSequence(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * GRID_SIZE * GRID_SIZE))
}

export default function PathMemoryGame() {
  const { player } = useParams()
  const navigate = useNavigate()
  const { startAmbient } = useAmbientAudio({ theme: 'mystic', volume: 0.02 })
  const [sequence, setSequence] = useState([])
  const [activeIndex, setActiveIndex] = useState(null)
  const [userStep, setUserStep] = useState(0)
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState('idle')
  const [gameOver, setGameOver] = useState(false)
  const scoreRef = useRef(0)
  const playIdRef = useRef(0)
  const flashTimeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      playIdRef.current += 1
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current)
      }
    }
  }, [])

  async function playSequence(nextSequence) {
    const playId = (playIdRef.current += 1)
    setPhase('showing')
    setUserStep(0)

    for (let i = 0; i < nextSequence.length; i += 1) {
      if (playIdRef.current !== playId) return
      setActiveIndex(nextSequence[i])
      await new Promise((resolve) => setTimeout(resolve, 450))
      if (playIdRef.current !== playId) return
      setActiveIndex(null)
      await new Promise((resolve) => setTimeout(resolve, 180))
    }

    if (playIdRef.current === playId) {
      setPhase('input')
    }
  }

  function startGame() {
    startAmbient()
    const nextSequence = createSequence(4)
    scoreRef.current = 0
    setScore(0)
    setLevel(1)
    setSequence(nextSequence)
    setUserStep(0)
    setGameOver(false)
    setActiveIndex(null)
    playSequence(nextSequence)
  }

  function finishGame() {
    setGameOver(true)
    setPhase('idle')
    setActiveIndex(null)
    if (scoreRef.current > 0) {
      submitScore(player, scoreRef.current, 'path')
    }
  }

  function handleCellClick(index) {
    if (phase !== 'input' || gameOver) return

    playUiSound('click')
    setActiveIndex(index)
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current)
    }
    flashTimeoutRef.current = setTimeout(() => {
      setActiveIndex(null)
    }, 180)

    const expected = sequence[userStep]
    if (index !== expected) {
      playUiSound('fail')
      finishGame()
      return
    }

    const nextStep = userStep + 1
    if (nextStep === sequence.length) {
      playUiSound('success')
      const points = sequence.length * 2
      setScore((prev) => {
        const next = prev + points
        scoreRef.current = next
        return next
      })

      const nextLevel = Math.min(level + 1, MAX_LEVEL)
      const nextSequence = createSequence(Math.min(4 + nextLevel - 1, 8))
      setLevel(nextLevel)
      setSequence(nextSequence)
      setPhase('showing')
      setTimeout(() => playSequence(nextSequence), 600)
    } else {
      setUserStep(nextStep)
    }
  }

  return (
    <div className="math-game">
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

      <motion.h2
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        Camino Fantasma
      </motion.h2>

      <div className="level-display">
        Nivel: <span>{level}</span> | Puntos: <span>{score}</span>
      </div>

      <div className="path-status">
        {phase === 'showing' && 'Memoriza el recorrido'}
        {phase === 'input' && 'Repite la secuencia'}
        {phase === 'idle' && !gameOver && 'Pulsa iniciar para comenzar'}
      </div>

      {phase === 'idle' && !gameOver && (
        <motion.button
          className="start-btn"
          onClick={startGame}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Iniciar
        </motion.button>
      )}

      <div className="path-grid">
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => (
          <button
            key={index}
            type="button"
            className={`path-cell ${activeIndex === index ? 'active' : ''}`}
            onClick={() => handleCellClick(index)}
            disabled={phase !== 'input' || gameOver}
          />
        ))}
      </div>

      <AnimatePresence>
        {gameOver && (
          <motion.div
            className="game-over"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="game-over-content"
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <h2>Secuencia fallida</h2>
              <p>Puntuacion final: <span>{score}</span></p>
              <motion.button onClick={startGame} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                Reintentar
              </motion.button>
              <motion.button
                className="secondary"
                onClick={() => navigate(`/game/${player}`)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                Elegir otro juego
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
