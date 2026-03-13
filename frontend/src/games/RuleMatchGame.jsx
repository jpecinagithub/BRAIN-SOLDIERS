import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { submitScore } from '../api/api'
import { playUiSound } from '../audio/audioEngine'
import { useAmbientAudio } from '../audio/useAmbientAudio'

const COLORS = [
  { name: 'Rojo', hex: '#ff4757' },
  { name: 'Azul', hex: '#3498db' },
  { name: 'Verde', hex: '#2ecc71' },
  { name: 'Amarillo', hex: '#f1c40f' }
]

const SHAPES = ['▲', '■', '●', '◆']

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

function createRound() {
  const rule = Math.random() > 0.5 ? 'color' : 'shape'
  const target = {
    color: pickRandom(COLORS),
    shape: pickRandom(SHAPES)
  }

  let correct = null
  if (rule === 'color') {
    const otherShape = pickRandom(SHAPES.filter((shape) => shape !== target.shape))
    correct = { color: target.color, shape: otherShape }
  } else {
    const otherColor = pickRandom(COLORS.filter((color) => color.name !== target.color.name))
    correct = { color: otherColor, shape: target.shape }
  }

  const options = [correct]
  const used = new Set([`${correct.color.name}-${correct.shape}`])

  while (options.length < 6) {
    const candidate = { color: pickRandom(COLORS), shape: pickRandom(SHAPES) }
    const key = `${candidate.color.name}-${candidate.shape}`
    if (used.has(key)) continue
    if (candidate.color.name === target.color.name && candidate.shape === target.shape) continue
    if (rule === 'color' && candidate.color.name === target.color.name) continue
    if (rule === 'shape' && candidate.shape === target.shape) continue
    options.push(candidate)
    used.add(key)
  }

  const shuffled = shuffle(options)
  return {
    rule,
    target,
    options: shuffled,
    correctIndex: shuffled.findIndex((option) => option.color.name === correct.color.name && option.shape === correct.shape)
  }
}

export default function RuleMatchGame() {
  const { player } = useParams()
  const navigate = useNavigate()
  const { startAmbient } = useAmbientAudio({ theme: 'focus', volume: 0.02 })
  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [gameOver, setGameOver] = useState(false)
  const [roundData, setRoundData] = useState(createRound())
  const scoreRef = useRef(0)
  const totalRounds = 12

  function startGame() {
    startAmbient()
    setRound(1)
    scoreRef.current = 0
    setScore(0)
    setFeedback('')
    setGameOver(false)
    setRoundData(createRound())
  }

  function finishGame() {
    setGameOver(true)
    if (scoreRef.current > 0) {
      submitScore(player, scoreRef.current, 'rule')
    }
  }

  function handleAnswer(index) {
    if (gameOver) return

    startAmbient()
    const isCorrect = index === roundData.correctIndex
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
      setRoundData(createRound())
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
        Parejas con Regla
      </motion.h2>

      <div className="level-display">
        Ronda: <span>{round}</span> / {totalRounds} | Puntos: <span>{score}</span>
      </div>

      <div className="rule-instruction">
        Elige la carta que cumpla: <span>{roundData.rule === 'color' ? 'Mismo color' : 'Misma forma'}</span>
      </div>

      <div className="rule-target">
        <div className="rule-card" style={{ borderColor: roundData.target.color.hex, color: roundData.target.color.hex }}>
          {roundData.target.shape}
        </div>
      </div>

      {feedback && (
        <div className={`math-feedback ${feedback === 'Correcto' ? 'correct' : 'incorrect'}`}>
          {feedback}
        </div>
      )}

      {!gameOver ? (
        <div className="rule-options">
          {roundData.options.map((option, index) => (
            <motion.button
              key={`${option.color.name}-${option.shape}-${index}`}
              className="rule-card"
              style={{ borderColor: option.color.hex, color: option.color.hex }}
              onClick={() => handleAnswer(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {option.shape}
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
