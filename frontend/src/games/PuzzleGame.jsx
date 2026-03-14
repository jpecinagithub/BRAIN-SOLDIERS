import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameContext } from '../contexts/GameContext.jsx'
import { playUiSound } from '../audio/audioEngine'
import { useAmbientAudio } from '../audio/useAmbientAudio'
import styles from './PuzzleGame.module.css'

const SIZE = 5

export default function PuzzleGame() {
  const { player } = useParams()
  const navigate = useNavigate()
  const { submitPlayerScore } = useGameContext()
  const { startAmbient } = useAmbientAudio({ theme: 'mystic', volume: 0.02 })

  const [image, setImage] = useState(null)
  const [pieces, setPieces] = useState([])
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [shuffleKey, setShuffleKey] = useState(0)
  const [uploadError, setUploadError] = useState('')

  const objectUrlRef = useRef('')

  useEffect(() => {
    if (image) {
      initializePuzzle()
    }
  }, [image])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = ''
      }
    }
  }, [])

  function initializePuzzle() {
    const basePieces = []
    for (let i = 0; i < SIZE * SIZE; i++) {
      basePieces.push({ originalIndex: i })
    }

    const shuffled = shuffleArray(basePieces)
    setPieces(shuffled)
    setSelectedPiece(null)
    setMoves(0)
    setGameOver(false)
    setShuffleKey((k) => k + 1)
  }

  function shuffleArray(array) {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
      const swapIndex = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[swapIndex]] = [arr[swapIndex], arr[i]]
    }

    if (arr.every((piece, index) => piece.originalIndex === index)) {
      return shuffleArray(array)
    }

    return arr
  }

  function handleImageUpload(e) {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return

    if (file.type && !file.type.startsWith('image/')) {
      setUploadError('Selecciona un archivo de imagen valido.')
      input.value = ''
      return
    }

    const nextObjectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
      objectUrlRef.current = nextObjectUrl
      setUploadError('')
      setImage(nextObjectUrl)
      startAmbient()
      input.value = ''
    }

    img.onerror = () => {
      URL.revokeObjectURL(nextObjectUrl)
      setUploadError('No se pudo abrir esta imagen.')
      input.value = ''
    }

    img.src = nextObjectUrl
  }

  function clearImage() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = ''
    }
    setImage(null)
  }

  function handlePieceClick(index) {
    if (gameOver) return

    if (selectedPiece === null) {
      setSelectedPiece(index)
      return
    }

    if (selectedPiece === index) {
      setSelectedPiece(null)
      return
    }

    const nextPieces = [...pieces]
    ;[nextPieces[index], nextPieces[selectedPiece]] = [nextPieces[selectedPiece], nextPieces[index]]

    const nextMoves = moves + 1
    setPieces(nextPieces)
    setMoves(nextMoves)
    setSelectedPiece(null)
    checkWin(nextPieces, nextMoves)
  }

  async function checkWin(currentPieces, currentMoves) {
    const isWin = currentPieces.every((piece, i) => piece.originalIndex === i)
    if (!isWin) return

    const points = Math.max(50 - currentMoves, 10)
    setScore(points)
    setGameOver(true)
    playUiSound('success')
    await submitPlayerScore(player, points, 'puzzle')
  }

  return (
    <div className="puzzle-game">
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
        Puzzle 5x5
      </motion.h2>

      <motion.div className={styles.scoreDisplay} key={moves} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.2 }}>
        Movimientos: {moves}
      </motion.div>

      {!image ? (
        <motion.div className={styles.uploadSection} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <input
            id="puzzle-image-input"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className={styles.fileInput}
          />
          {uploadError && <p className="message error">{uploadError}</p>}
        </motion.div>
      ) : (
        <div className={styles.puzzleLayout}>
          <motion.div className={styles.puzzlePreviewContainer} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <div className={styles.puzzlePreview} style={{ backgroundImage: `url(${image})` }} />
            <div className={styles.previewLabel}>ORIGINAL</div>
          </motion.div>

          <motion.div className={styles.puzzleBoard} key={shuffleKey} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            {pieces.length > 0 ? (
              pieces.map((piece, index) => {
                const bgX = piece.originalIndex % SIZE
                const bgY = Math.floor(piece.originalIndex / SIZE)
                const isSelected = selectedPiece === index

                return (
                  <motion.div
                    key={index}
                    className={`${styles.puzzlePiece} ${isSelected ? styles.selected : ''}`}
                    style={{
                      backgroundImage: `url(${image})`,
                      backgroundPosition: `${(bgX / (SIZE - 1)) * 100}% ${(bgY / (SIZE - 1)) * 100}%`,
                      backgroundSize: `${SIZE * 100}% ${SIZE * 100}%`
                    }}
                    onClick={() => handlePieceClick(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  />
                )
              })
            ) : (
              <div className={styles.puzzleLoading}>Generando puzle...</div>
            )}
          </motion.div>
        </div>
      )}

      {image && (
        <motion.div style={{ textAlign: 'center', marginTop: '25px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.button
            className="start-btn"
            onClick={initializePuzzle}
            disabled={gameOver}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            🔀 Mezclar
          </motion.button>
        </motion.div>
      )}

      <AnimatePresence>
        {gameOver && (
          <motion.div className="game-over" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="game-over-content"
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <h2>¡Completado!</h2>
              <p>Puntos: <span>{score}</span></p>
              <p>Movimientos: <span>{moves}</span></p>
              <motion.button
                onClick={() => {
                  setGameOver(false)
                  clearImage()
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                Nueva imagen
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
