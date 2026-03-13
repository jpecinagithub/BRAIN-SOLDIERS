import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { submitScore } from '../api/api'
import { playUiSound } from '../audio/audioEngine'
import { useAmbientAudio } from '../audio/useAmbientAudio'

function createSequence(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10))
}

export default function NumberEchoGame() {
  const { player } = useParams()
  const navigate = useNavigate()
  const { startAmbient } = useAmbientAudio({ theme: 'mystic', volume: 0.02 })
  const [sequence, setSequence] = useState([])
  const [displayDigit, setDisplayDigit] = useState(null)
  const [userInput, setUserInput] = useState([])
  const [phase, setPhase] = useState('idle')
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const scoreRef = useRef(0)
  const playIdRef = useRef(0)

  useEffect(() => {
    return () => {
      playIdRef.current += 1
    }
  }, [])

  async function playSequence(nextSequence) {
    const playId = (playIdRef.current += 1)
    setPhase('showing')
    setUserInput([])
    setDisplayDigit(null)

    for (let i = 0; i < nextSequence.length; i += 1) {
      if (playIdRef.current !== playId) return
      setDisplayDigit(nextSequence[i])
      await new Promise((resolve) => setTimeout(resolve, 500))
      if (playIdRef.current !== playId) return
      setDisplayDigit(null)
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    if (playIdRef.current === playId) {
      setPhase('input')
    }
  }

  function startGame() {
    startAmbient()
    const nextSequence = createSequence(3)
    scoreRef.current = 0
    setScore(0)
    setLevel(1)
    setGameOver(false)
    setSequence(nextSequence)
    playSequence(nextSequence)
  }

  function finishGame() {
    setGameOver(true)
    setPhase('idle')
    setDisplayDigit(null)
    playUiSound('fail')
    if (scoreRef.current > 0) {
      submitScore(player, scoreRef.current, 'echo')
    }
  }

  function handleDigitClick(digit) {
    if (phase !== 'input' || gameOver) return

    setUserInput((prev) => {
      const next = [...prev, digit]
      if (next.length === sequence.length) {
        const isCorrect = next.every((value, index) => value === sequence[index])
        if (isCorrect) {
          playUiSound('success')
          const points = sequence.length * 2
          setScore((prevScore) => {
            const newScore = prevScore + points
            scoreRef.current = newScore
            return newScore
          })
          const nextLevel = level + 1
          const nextSequence = createSequence(2 + nextLevel)
          setLevel(nextLevel)
          setSequence(nextSequence)
          setTimeout(() => playSequence(nextSequence), 600)
        } else {
          finishGame()
        }
      }
      return next
    })
  }

  function handleDelete() {
    if (phase !== 'input' || gameOver) return
    setUserInput((prev) => prev.slice(0, -1))
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
        Eco Numérico
      </motion.h2>

      <div className="level-display">
        Nivel: <span>{level}</span> | Puntos: <span>{score}</span>
      </div>

      <div className="number-status">
        {phase === 'showing' && 'Memoriza la secuencia'}
        {phase === 'input' && 'Repite los numeros'}
        {phase === 'idle' && !gameOver && 'Pulsa iniciar para comenzar'}
      </div>

      <div className="number-display">
        {displayDigit !== null ? displayDigit : phase === 'input' ? userInput.join(' ') || '...' : '---'}
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

      <div className="number-pad">
        {Array.from({ length: 10 }).map((_, index) => (
          <button
            key={index}
            type="button"
            className="number-key"
            onClick={() => handleDigitClick(index)}
            disabled={phase !== 'input' || gameOver}
          >
            {index}
          </button>
        ))}
        <button
          type="button"
          className="number-key secondary"
          onClick={handleDelete}
          disabled={phase !== 'input' || gameOver}
        >
          ⌫
        </button>
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
