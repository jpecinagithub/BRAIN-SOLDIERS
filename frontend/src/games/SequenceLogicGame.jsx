import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { submitScore } from '../api/api'
import { playUiSound } from '../audio/audioEngine'
import { useAmbientAudio } from '../audio/useAmbientAudio'

const SHAPES = ['▲', '■', '●', '◆']
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

function createNumberSequence() {
  const start = Math.floor(Math.random() * 6) + 2
  const step = Math.floor(Math.random() * 3) + 1
  const sequence = [start, start + step, start + step * 2, start + step * 3]
  const correct = start + step * 4
  const options = new Set([correct])
  while (options.size < 4) {
    options.add(correct + (Math.floor(Math.random() * 7) - 3))
  }
  return {
    sequence: [...sequence, '?'],
    correct,
    options: shuffle(Array.from(options))
  }
}

function createAlternatingSequence() {
  const first = pickRandom(SHAPES)
  let second = pickRandom(SHAPES)
  while (second === first) second = pickRandom(SHAPES)
  const sequence = [first, second, first, second]
  const correct = first
  const options = shuffle([first, second, ...shuffle(SHAPES.filter((s) => s !== first && s !== second)).slice(0, 2)])
  return {
    sequence: [...sequence, '?'],
    correct,
    options
  }
}

function createCycleSequence() {
  const cycle = shuffle(LETTERS).slice(0, 3)
  const sequence = [cycle[0], cycle[1], cycle[2], cycle[0], cycle[1]]
  const correct = cycle[2]
  const options = shuffle([correct, ...shuffle(LETTERS.filter((l) => !cycle.includes(l))).slice(0, 3)])
  return {
    sequence: [...sequence, '?'],
    correct,
    options
  }
}

function createMirrorSequence() {
  const symbols = shuffle(SHAPES).slice(0, 4)
  const sequence = [symbols[0], symbols[1], symbols[2], symbols[1]]
  const correct = symbols[0]
  const options = shuffle([correct, symbols[2], symbols[3], symbols[1]])
  return {
    sequence: [...sequence, '?'],
    correct,
    options
  }
}

function createQuestion() {
  const builders = [createAlternatingSequence, createNumberSequence, createCycleSequence, createMirrorSequence]
  return builders[Math.floor(Math.random() * builders.length)]()
}

export default function SequenceLogicGame() {
  const { player } = useParams()
  const navigate = useNavigate()
  const { startAmbient } = useAmbientAudio({ theme: 'focus', volume: 0.02 })
  const [question, setQuestion] = useState(createQuestion())
  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [gameOver, setGameOver] = useState(false)
  const scoreRef = useRef(0)
  const totalRounds = 12

  function startGame() {
    startAmbient()
    setRound(1)
    scoreRef.current = 0
    setScore(0)
    setQuestion(createQuestion())
    setFeedback('')
    setGameOver(false)
  }

  function finishGame() {
    setGameOver(true)
    if (scoreRef.current > 0) {
      submitScore(player, scoreRef.current, 'sequence')
    }
  }

  function handleAnswer(option) {
    if (gameOver) return

    startAmbient()
    const isCorrect = option === question.correct
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
        Secuencia Lógica
      </motion.h2>

      <div className="level-display">
        Ronda: <span>{round}</span> / {totalRounds} | Puntos: <span>{score}</span>
      </div>

      <div className="sequence-display">
        {question.sequence.join('   ')}
      </div>

      {feedback && (
        <div className={`math-feedback ${feedback === 'Correcto' ? 'correct' : 'incorrect'}`}>
          {feedback}
        </div>
      )}

      {!gameOver ? (
        <div className="options-container">
          {question.options.map((option) => (
            <motion.button
              key={String(option)}
              className="option-btn"
              onClick={() => handleAnswer(option)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {option}
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
