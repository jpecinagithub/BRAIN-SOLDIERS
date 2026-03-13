import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameContext } from '../contexts/GameContext.jsx'
import { getAvatarUrl, generateAvatar, API_URL } from '../api/api'
import { useAmbientAudio } from '../audio/useAmbientAudio'
import styles from './MemoryGame.module.css'

const CHARACTERS = [
  'Pedrochibus',
  'Michel',
  'Gabi',
  'Don Pablo',
  'Don Anselmo',
  'Don Alfonso',
  'Manolo',
  'Jon'
]

const AVATAR_EMOJIS = {
  Pedrochibus: '⚔️',
  Michel: '🎯',
  Gabi: '🎧',
  'Don Pablo': '🧛',
  'Don Anselmo': '🧙',
  'Don Alfonso': '📜',
  Manolo: '🍖',
  Jon: '🧠'
}

export default function MemoryGame() {
  const { player } = useParams()
  const navigate = useNavigate()
  const { submitPlayerScore } = useGameContext()
  const { startAmbient } = useAmbientAudio({ theme: 'pulse', volume: 0.02 })

  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [message, setMessage] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [imageErrors, setImageErrors] = useState({})

  const audioContextRef = useRef(null)
  const generatingRef = useRef(new Set())

  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx()
      }
    } catch {
      audioContextRef.current = null
    }

    startGame()

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  function playSound(type) {
    if (!audioContextRef.current) return

    const ctx = audioContextRef.current
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    if (type === 'flip') {
      oscillator.frequency.value = 600
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.1)
      return
    }

    if (type === 'match') {
      oscillator.frequency.setValueAtTime(400, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2)
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.3)
      return
    }

    oscillator.frequency.setValueAtTime(300, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2)
    oscillator.type = 'sawtooth'
    gainNode.gain.setValueAtTime(0.05, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.2)
  }

  function startGame() {
    const initialCards = [...CHARACTERS, ...CHARACTERS]
      .sort(() => Math.random() - 0.5)
      .map((char, index) => ({
        id: index,
        name: char,
        imageUrl: getAvatarUrl(char)
      }))

    setCards(initialCards)
    setFlipped([])
    setMatched([])
    setScore(0)
    setMoves(0)
    setGameOver(false)
    setMessage('Encuentra las parejas de avatares')
    setImageErrors({})
    setIsChecking(false)
  }

  async function handleCardClick(index) {
    if (isChecking || flipped.includes(index) || matched.includes(index) || gameOver) return

    startAmbient()
    playSound('flip')
    const newFlipped = [...flipped, index]
    setFlipped(newFlipped)

    if (newFlipped.length !== 2) return

    setMoves((prev) => prev + 1)
    setIsChecking(true)

    const [firstIndex, secondIndex] = newFlipped
    const firstCard = cards[firstIndex]
    const secondCard = cards[secondIndex]

    if (firstCard.name === secondCard.name) {
      setTimeout(() => {
        playSound('match')
        const newMatched = [...matched, firstIndex, secondIndex]
        const nextScore = score + 10

        setMatched(newMatched)
        setFlipped([])
        setIsChecking(false)
        setScore(nextScore)
        setMessage(`¡Pareja de ${firstCard.name} encontrada!`)

        if (newMatched.length === 16) {
          handleWin(nextScore)
        }
      }, 600)
      return
    }

    setTimeout(() => {
      playSound('mismatch')
      setFlipped([])
      setIsChecking(false)
      setMessage('Sigue intentándolo...')
    }, 1000)
  }

  async function handleWin(finalScore) {
    setGameOver(true)
    setMessage('¡Misión Completada!')
    await submitPlayerScore(player, finalScore, 'memory')
  }

  async function handleAvatarError(cardId, name) {
    setImageErrors((prev) => ({ ...prev, [cardId]: true }))

    if (generatingRef.current.has(name)) return
    generatingRef.current.add(name)

    try {
      const result = await generateAvatar(name)
      if (result && result.success && result.imageUrl) {
        const newUrl = `${API_URL}${result.imageUrl}?t=${Date.now()}`
        setCards((prevCards) =>
          prevCards.map((card) =>
            card.name === name ? { ...card, imageUrl: newUrl } : card
          )
        )
        setImageErrors({})
      }
    } catch {
      // keep fallback visual
    } finally {
      generatingRef.current.delete(name)
    }
  }

  return (
    <div className="memory-game">
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
        initial={{ scale: 0, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        Misión Memoria
      </motion.h2>

      <div className={styles.memoryStats}>
        <motion.div className={styles.statItem} animate={{ scale: [1, 1.1, 1] }} key={score}>
          Puntos: <span>{score}</span>
        </motion.div>
        <div className={styles.statItem}>
          Movimientos: <span>{moves}</span>
        </div>
      </div>

      {message && (
        <motion.div
          className={`${styles.message} ${styles.info}`}
          key={message}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {message}
        </motion.div>
      )}

      <div className={styles.memoryBoard}>
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index)
          const isMatched = matched.includes(index)
          const showContent = isFlipped || isMatched

          return (
            <motion.div
              key={card.id}
              className={`${styles.memoryCard} ${isMatched ? styles.matched : ''}`}
              onClick={() => handleCardClick(index)}
              initial={false}
              animate={{ scale: isFlipped && !isMatched ? [1, 1.03, 1] : 1 }}
              transition={{ duration: 0.2 }}
            >
              {showContent ? (
                <div className={`${styles.cardFace} ${styles.front}`}>
                  {!imageErrors[card.id] ? (
                    <img
                      className={styles.avatarImg}
                      src={card.imageUrl}
                      alt={card.name}
                      loading="eager"
                      onError={() => handleAvatarError(card.id, card.name)}
                    />
                  ) : (
                    <div className={styles.avatarFallback}>{AVATAR_EMOJIS[card.name] || 'N/A'}</div>
                  )}
                </div>
              ) : (
                <div className={`${styles.cardFace} ${styles.back}`}>
                  <span className={styles.cardBackIcon}>?</span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {gameOver && (
          <div className="game-over">
            <motion.div
              className={styles.gameOverContent}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <h2>¡Misión Éxito!</h2>
              <p>Puntuación: <span>{score}</span></p>
              <p>Movimientos: <span>{moves}</span></p>
              <div className="modal-actions">
                <button onClick={startGame}>Reiniciar Misión</button>
                <button className="secondary" onClick={() => navigate(`/game/${player}`)}>Elegir otro juego</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
