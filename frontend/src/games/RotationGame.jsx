import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { submitScore } from '../api/api'
import { playUiSound } from '../audio/audioEngine'
import { useAmbientAudio } from '../audio/useAmbientAudio'

const SIZE = 3
const PATTERNS = [
  [0, 1, 3],
  [1, 4, 7, 6],
  [0, 3, 4, 5],
  [2, 4, 6, 7],
  [0, 1, 2, 4],
  [1, 2, 4, 7]
]

function rotateIndex(index) {
  const row = Math.floor(index / SIZE)
  const col = index % SIZE
  return col * SIZE + (SIZE - 1 - row)
}

function rotatePattern(pattern, times) {
  let current = [...pattern]
  for (let i = 0; i < times; i += 1) {
    current = current.map(rotateIndex)
  }
  return current
}

function normalize(pattern) {
  return [...pattern].sort((a, b) => a - b).join('-')
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

function createQuestion() {
  const base = PATTERNS[Math.floor(Math.random() * PATTERNS.length)]
  const rotation = Math.floor(Math.random() * 4)
  const promptPattern = rotatePattern(base, rotation)
  const correctPattern = rotatePattern(base, rotation + 1)

  const options = [correctPattern]
  const seen = new Set([normalize(correctPattern)])

  while (options.length < 4) {
    const candidateBase = PATTERNS[Math.floor(Math.random() * PATTERNS.length)]
    const candidate = rotatePattern(candidateBase, Math.floor(Math.random() * 4))
    const key = normalize(candidate)
    if (!seen.has(key)) {
      options.push(candidate)
      seen.add(key)
    }
  }

  const shuffled = shuffle(options)
  return {
    promptPattern,
    options: shuffled,
    correctIndex: shuffled.findIndex((option) => normalize(option) === normalize(correctPattern))
  }
}

function PatternGrid({ pattern, size = SIZE }) {
  const filled = new Set(pattern)
  return (
    <div className="mini-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {Array.from({ length: size * size }).map((_, index) => (
        <div key={index} className={`mini-cell ${filled.has(index) ? 'filled' : ''}`} />
      ))}
    </div>
  )
}

export default function RotationGame() {
  const { player } = useParams()
  const navigate = useNavigate()
  const { startAmbient } = useAmbientAudio({ theme: 'pulse', volume: 0.02 })
  const [question, setQuestion] = useState(createQuestion())
  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [gameOver, setGameOver] = useState(false)
  const scoreRef = useRef(0)
  const totalRounds = 10

  function startGame() {
    startAmbient()
    setQuestion(createQuestion())
    setRound(1)
    setFeedback('')
    scoreRef.current = 0
    setScore(0)
    setGameOver(false)
  }

  function finishGame() {
    setGameOver(true)
    if (scoreRef.current > 0) {
      submitScore(player, scoreRef.current, 'rotation')
    }
  }

  function handleAnswer(index) {
    if (gameOver) return

    startAmbient()
    const isCorrect = index === question.correctIndex
    if (isCorrect) {
      setScore((prev) => {
        const next = prev + 2
        scoreRef.current = next
        return next
      })
      setFeedback('Correcto')
      playUiSound('success')
    } else {
      setScore((prev) => {
        const next = Math.max(0, prev - 1)
        scoreRef.current = next
        return next
      })
      setFeedback('Incorrecto')
      playUiSound('fail')
    }

    if (round >= totalRounds) {
      setTimeout(() => {
        setFeedback('')
        finishGame()
      }, 500)
      return
    }

    setTimeout(() => {
      setFeedback('')
      setRound((prev) => prev + 1)
      setQuestion(createQuestion())
    }, 500)
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
        Rotación Rápida
      </motion.h2>

      <div className="level-display">
        Ronda: <span>{round}</span> / {totalRounds} | Puntos: <span>{score}</span>
      </div>

      <div className="rotation-prompt">
        <p>Elige la misma figura rotada 90° a la derecha.</p>
        <PatternGrid pattern={question.promptPattern} />
      </div>

      {feedback && (
        <div className={`math-feedback ${feedback === 'Correcto' ? 'correct' : 'incorrect'}`}>
          {feedback}
        </div>
      )}

      {!gameOver ? (
        <div className="rotation-options">
          {question.options.map((option, index) => (
            <motion.button
              key={index}
              className="rotation-option"
              onClick={() => handleAnswer(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PatternGrid pattern={option} />
            </motion.button>
          ))}
        </div>
      ) : (
        <motion.button
          className="start-btn"
          onClick={startGame}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Jugar de nuevo
        </motion.button>
      )}

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
              <h2>Rondas completadas</h2>
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
