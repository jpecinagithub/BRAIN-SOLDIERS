import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameContext } from '../contexts/GameContext.jsx'
import styles from './GameHub.module.css'

const games = [
  { id: 'simon', name: 'Misión Simon', icon: '🎨', description: 'Reconocimiento de Patrones', color: '#ff6b35' },
  { id: 'puzzle', name: 'Misión Puzzle', icon: '🧩', description: 'Reconstrucción de Imagen', color: '#bc13fe' },
  { id: 'memory', name: 'Misión Memoria', icon: '🧠', description: 'Fortalecimiento Neural', color: '#00ff88' },
  { id: 'math', name: 'Misión Cálculo', icon: '🔢', description: 'Velocidad Computacional', color: '#ff4757' }
]

export default function GameHub() {
  const navigate = useNavigate()
  const { player } = useParams()
  const { currentPlayer } = useGameContext()
  const activePlayer = currentPlayer || player

  return (
    <div className={styles.gameHub}>
      <motion.button
        className="back-btn"
        onClick={() => navigate('/')}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        ← Volver
      </motion.button>

      <motion.h1
        className={styles.title}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        Elige tu Misión
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={styles.hubSubtitle}
      >
        Operativo Activo: <span>{activePlayer}</span>
      </motion.p>

      <div className={styles.gamesGrid}>
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            className={styles.gameCard}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -15, transition: { duration: 0.3 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/game/${activePlayer}/${game.id}`)}
            style={{ '--game-color': game.color }}
          >
            <motion.div
              className={styles.gameIcon}
              animate={{
                filter: [
                  `drop-shadow(0 0 10px ${game.color}66)`,
                  `drop-shadow(0 0 30px ${game.color}aa)`,
                  `drop-shadow(0 0 10px ${game.color}66)`
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {game.icon}
            </motion.div>
            <h3>{game.name}</h3>
            <p>{game.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
