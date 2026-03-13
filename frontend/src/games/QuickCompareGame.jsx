import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { submitScore } from '../api/api'
import { playUiSound } from '../audio/audioEngine'
import { useAmbientAudio } from '../audio/useAmbientAudio'

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function createExpression() {
  if (Math.random() < 0.5) {
    const value = randomNumber(5, 50)
    return { label: String(value), value }
  }

  const a = randomNumber(3, 20)
  const b = randomNumber(2, 15)
  const op = Math.random() > 0.5 ? '+' : '-'
  const value = op === '+' ? a + b : a - b
  return { label: `${a} ${op} ${b}`, value }
}

function createRound() {
  const left = createExpression()
  const right = Math.random() < 0.2 ? { label: left.label, value: left.value } : createExpression()
  return { left, right }
}

export default function QuickCompareGame() {
  const { player } = useParams()
  const navigate = useNavigate()
  const { startAmbient } = useAmbientAudio({ theme: 'energy', volume: 0.02 })
  const [roundData, setRoundData] = useState(createRound())
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
    setRoundData(createRound())
  }

  function finishGame() {
    if (endGameRef.current) return
    endGameRef.current = true
    setGameOver(true)
    setGameStarted(false)

    if (scoreRef.current > 0) {
      submitScore(player, scoreRef.current, 'compare')
    }
  }

  function handleAnswer(choice) {
    if (!gameStarted || gameOver) return

    const leftValue = roundData.left.value
    const rightValue = roundData.right.value
    const correct = leftValue === rightValue ? '=' : leftValue > rightValue ? '>' : '<'
    const isCorrect = choice === correct

    if (isCorrect) {
      setScore((prev) => {
        const next = prev + 1
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

    setRoundData(createRound())
    setTimeout(() => setFeedback(''), 350)
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
        Comparación Relámpago
      </motion.h2>

      <div className="level-display">
        Tiempo: <span>{timeLeft}s</span> | Puntos: <span>{score}</span>
      </div>

      {feedback && (
        <div className={`math-feedback ${feedback === 'Correcto' ? 'correct' : 'incorrect'}`}>
          {feedback}
        </div>
      )}

      {gameStarted ? (
        <>
          <div className="compare-display">
            <div className="compare-value">{roundData.left.label}</div>
            <div className="compare-gap">?</div>
            <div className="compare-value">{roundData.right.label}</div>
          </div>
          <div className="compare-options">
            {['>', '=', '<'].map((symbol) => (
              <motion.button
                key={symbol}
                className="option-btn"
                onClick={() => handleAnswer(symbol)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {symbol}
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
