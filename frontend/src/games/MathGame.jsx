import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { submitScore } from '../api/api'

function generateQuestion(level) {
  let a, b, operator, answer
  
  switch (level) {
    case 1:
      a = Math.floor(Math.random() * 20) + 5
      b = Math.floor(Math.random() * 15) + 3
      operator = Math.random() > 0.4 ? (Math.random() > 0.5 ? '+' : '-') : '*'
      if (operator === '-' && b > a) [a, b] = [b, a]
      answer = operator === '+' ? a + b : (operator === '-' ? a - b : a * b)
      break
    case 2:
      a = Math.floor(Math.random() * 30) + 10
      b = Math.floor(Math.random() * 20) + 5
      operator = Math.random() > 0.33 ? (Math.random() > 0.5 ? '+' : '-') : '*'
      if (operator === '-' && b > a) [a, b] = [b, a]
      answer = operator === '+' ? a + b : (operator === '-' ? a - b : a * b)
      break
    default:
      a = Math.floor(Math.random() * 50) + 20
      b = Math.floor(Math.random() * 30) + 10
      const ops = ['+', '-', '*', '/']
      operator = ops[Math.floor(Math.random() * ops.length)]
      if (operator === '/') {
        answer = b
        a = answer * b
      } else if (operator === '-' && b > a) {
        [a, b] = [b, a]
        answer = a - b
      } else if (operator === '*') {
        answer = a * b
      } else {
        answer = a + b
      }
  }
  
  const options = generateOptions(answer)
  
  return {
    question: `${a} ${operator} ${b}`,
    answer,
    options
  }
}

function generateOptions(correctAnswer) {
  const options = [correctAnswer]
  const range = Math.max(10, Math.abs(correctAnswer) * 0.5)
  
  while (options.length < 4) {
    const offset = Math.floor(Math.random() * range * 2) - range
    const wrongAnswer = correctAnswer + offset
    if (wrongAnswer !== correctAnswer && !options.includes(wrongAnswer) && wrongAnswer >= 0) {
      options.push(wrongAnswer)
    }
  }
  
  return options.sort(() => Math.random() - 0.5)
}

export default function MathGame() {
  const { player } = useParams()
  const navigate = useNavigate()
  const [question, setQuestion] = useState(null)
  const [userAnswer, setUserAnswer] = useState(null)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [timeLeft, setTimeLeft] = useState(60)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [totalQuestions, setTotalQuestions] = useState(0)

  useEffect(() => {
    if (gameStarted && !gameOver && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && gameStarted) {
      handleGameOver()
    }
  }, [timeLeft, gameStarted, gameOver])

  function startGame() {
    setScore(0)
    setLevel(1)
    setTimeLeft(60)
    setGameStarted(true)
    setGameOver(false)
    setTotalQuestions(0)
    setFeedback(null)
    nextQuestion()
  }

  function nextQuestion() {
    const newLevel = Math.min(Math.floor(totalQuestions / 5) + 1, 3)
    setLevel(newLevel)
    setQuestion(generateQuestion(newLevel))
    setUserAnswer(null)
    setTotalQuestions(prev => prev + 1)
  }

  async function handleAnswer(selectedAnswer) {
    if (!question || userAnswer !== null) return
    
    setUserAnswer(selectedAnswer)
    
    const isCorrect = selectedAnswer === question.answer
    
    if (isCorrect) {
      setScore(prev => prev + 2)
      setFeedback({ type: 'correct', message: '¡Correcto! +2 puntos' })
    } else {
      setTimeLeft(prev => Math.max(0, prev - 3))
      setFeedback({ type: 'incorrect', message: `¡Incorrecto! La respuesta era ${question.answer}. -3 seg` })
    }
    
    await new Promise(resolve => setTimeout(resolve, 800))
    setFeedback(null)
    setUserAnswer(null)
    
    if (timeLeft > 0) {
      nextQuestion()
    }
  }

  async function handleGameOver() {
    setGameOver(true)
    setGameStarted(false)
    
    if (score > 0) {
      await submitScore(player, score, 'math')
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
        transition={{ type: "spring", stiffness: 200 }}
      >
        Cálculo Mental
      </motion.h2>

      <motion.div 
        className="level-display"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Nivel: <span>{level}</span> | Tiempo: <span style={{ color: timeLeft <= 10 ? '#ff4757' : '#00d4ff' }}>{timeLeft}s</span> | Preguntas: <span>{totalQuestions}</span>
      </motion.div>

      <motion.div 
        className="score-display"
        key={score}
        animate={{ scale: [1, 1.1, 1] }}
      >
        Puntuación: {score}
      </motion.div>

      {feedback && (
        <motion.div 
          className={`message ${feedback.type}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {feedback.message}
        </motion.div>
      )}

      {gameStarted && question && (
        <motion.div
          key={question.question}
          initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="math-question">{question.question} = ?</div>
        </motion.div>
      )}

      {gameStarted ? (
        <motion.div 
          className="options-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {question?.options.map((option, index) => (
            <motion.button
              key={index}
              className={`option-btn ${userAnswer === option ? (option === question.answer ? 'correct' : 'incorrect') : ''}`}
              onClick={() => handleAnswer(option)}
              disabled={userAnswer !== null}
              whileHover={userAnswer === null ? { scale: 1.05 } : {}}
              whileTap={userAnswer === null ? { scale: 0.95 } : {}}
            >
              {option}
            </motion.button>
          ))}
        </motion.div>
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
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h2>¡Se Acabó el Tiempo!</h2>
              <p>Puntuación final: <span>{score}</span></p>
              <p>Preguntas respondidas: <span>{totalQuestions}</span></p>
              <motion.button 
                onClick={startGame}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
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
