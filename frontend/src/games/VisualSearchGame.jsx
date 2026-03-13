import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { submitScore } from '../api/api'
import { playUiSound } from '../audio/audioEngine'
import { useAmbientAudio } from '../audio/useAmbientAudio'

const GRID_SIZE = 5
const PAIRS = [
  ['E', 'F'],
  ['O', 'Q'],
  ['C', 'G'],
  ['P', 'R'],
  ['U', 'V'],
  ['H', 'M']
]

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function createRound() {
  const [a, b] = pickRandom(PAIRS)
  const target = Math.random() > 0.5 ? a : b
  const distractor = target === a ? b : a
  const targetIndex = Math.floor(Math.random() * GRID_SIZE * GRID_SIZE)
  const grid = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => ({
    char: index === targetIndex ? target : distractor
  }))

  return { grid, target, distractor, targetIndex }
}

export default function VisualSearchGame() {
  const { player } = useParams()
  const navigate = useNavigate()
  const { startAmbient } = useAmbientAudio({ theme: 'focus', volume: 0.02 })
  const [roundData, setRoundData] = useState(createRound())
  const [score, setScore] = useState(0)
  const [found, setFound] = useState(0)
  const [timeLeft, setTimeLeft] = useState(45)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
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
    setFound(0)
    setTimeLeft(45)
    setRoundData(createRound())
    setGameOver(false)
    setGameStarted(true)
  }

  function finishGame() {
    if (endGameRef.current) return
    endGameRef.current = true
    setGameOver(true)
    setGameStarted(false)

    if (scoreRef.current > 0) {
      submitScore(player, scoreRef.current, 'search')
    }
  }

  function handleCellClick(index) {
    if (!gameStarted || gameOver) return

    if (index === roundData.targetIndex) {
      setScore((prev) => {
        const next = prev + 2
        scoreRef.current = next
        return next
      })
      setFound((prev) => prev + 1)
      playUiSound('success')
    } else {
      setScore((prev) => {
        const next = Math.max(0, prev - 1)
        scoreRef.current = next
        return next
      })
      setTimeLeft((prev) => Math.max(0, prev - 2))
      playUiSound('fail')
    }

    setRoundData(createRound())
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
        Búsqueda Visual
      </motion.h2>

      <div className="level-display">
        Tiempo: <span>{timeLeft}s</span> | Aciertos: <span>{found}</span> | Puntos: <span>{score}</span>
      </div>

      {gameStarted ? (
        <>
          <div className="search-target">Encuentra: <span>{roundData.target}</span></div>
          <div className="grid-board">
            {roundData.grid.map((cell, index) => (
              <button
                key={index}
                type="button"
                className="grid-cell"
                onClick={() => handleCellClick(index)}
              >
                {cell.char}
              </button>
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
