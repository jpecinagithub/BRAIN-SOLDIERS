import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { submitScore } from '../api/api'
import { playUiSound } from '../audio/audioEngine'
import { useAmbientAudio } from '../audio/useAmbientAudio'

const COLORS = [
  { label: 'Rojo', value: 'red', hex: '#ff4757' },
  { label: 'Azul', value: 'blue', hex: '#3498db' },
  { label: 'Verde', value: 'green', hex: '#2ecc71' },
  { label: 'Amarillo', value: 'yellow', hex: '#f1c40f' }
]

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function createChallenge() {
  const word = pickRandom(COLORS)
  const ink = pickRandom(COLORS)
  return { word, ink }
}

export default function StroopGame() {
  const { player } = useParams()
  const navigate = useNavigate()
  const { startAmbient } = useAmbientAudio({ theme: 'energy', volume: 0.02 })
  const [challenge, setChallenge] = useState(createChallenge())
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(45)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [feedback, setFeedback] = useState('')
  const scoreRef = useRef(0)
  const endGameRef = useRef(false)

  useEffect(() => {
    if (!gameStarted || gameOver) return undefined

    if (timeLeft <= 0) {
      finishGame()
      return undefined
    }

    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, gameStarted, gameOver])

  function startGame() {
    startAmbient()
    scoreRef.current = 0
    endGameRef.current = false
    setScore(0)
    setTimeLeft(45)
    setGameOver(false)
    setGameStarted(true)
    setFeedback('')
    setChallenge(createChallenge())
  }

  function finishGame() {
    if (endGameRef.current) return
    endGameRef.current = true
    setGameOver(true)
    setGameStarted(false)

    if (scoreRef.current > 0) {
      submitScore(player, scoreRef.current, 'stroop')
    }
  }

  function handleChoice(color) {
    if (!gameStarted || gameOver) return

    const isCorrect = color.value === challenge.ink.value

    if (isCorrect) {
      setScore((prev) => {
        const next = prev + 2
        scoreRef.current = next
        return next
      })
      setFeedback('Correcto')
      playUiSound('success')
    } else {
      setTimeLeft((prev) => Math.max(0, prev - 2))
      setFeedback('Fallo')
      playUiSound('fail')
    }

    setChallenge(createChallenge())
    setTimeout(() => setFeedback(''), 400)
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
        Stroop Express
      </motion.h2>

      <div className="level-display">
        Tiempo: <span>{timeLeft}s</span> | Puntos: <span>{score}</span>
      </div>

      {feedback && (
        <div className={`math-feedback ${feedback === 'Correcto' ? 'correct' : 'incorrect'}`}>
          {feedback}
        </div>
      )}

      {gameStarted && !gameOver ? (
        <>
          <div className="stroop-word" style={{ color: challenge.ink.hex }}>
            {challenge.word.label.toUpperCase()}
          </div>
          <div className="stroop-options">
            {COLORS.map((color) => (
              <motion.button
                key={color.value}
                className="option-btn"
                style={{ borderColor: color.hex }}
                onClick={() => handleChoice(color)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {color.label}
              </motion.button>
            ))}
          </div>
        </>
      ) : (
        <motion.button
          className="start-btn"
          onClick={startGame}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {gameOver ? 'Jugar de nuevo' : 'Iniciar'}
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
              <h2>Tiempo terminado</h2>
              <p>Puntuacion final: <span>{score}</span></p>
              <motion.button onClick={startGame} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                Jugar de nuevo
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
