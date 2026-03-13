import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameContext } from '../contexts/GameContext.jsx'
import { API_URL } from '../api/api'
import styles from './GameHub.module.css'

const games = [
  { id: 'simon', name: 'Misión Simon', icon: `${API_URL}/games/simon.svg`, description: 'Reconocimiento de Patrones', color: '#ff6b35' },
  { id: 'puzzle', name: 'Misión Puzzle', icon: `${API_URL}/games/puzzle.svg`, description: 'Reconstrucción de Imagen', color: '#bc13fe' },
  { id: 'memory', name: 'Misión Memoria', icon: `${API_URL}/games/memory.svg`, description: 'Fortalecimiento Neural', color: '#00ff88' },
  { id: 'math', name: 'Misión Cálculo', icon: `${API_URL}/games/math.svg`, description: 'Velocidad Computacional', color: '#ff4757' },
  { id: 'stroop', name: 'Stroop Express', icon: `${API_URL}/games/stroop.svg`, description: 'Control Inhibitorio', color: '#00d4ff' },
  { id: 'sequence', name: 'Secuencia Lógica', icon: `${API_URL}/games/sequence.svg`, description: 'Patrones y series', color: '#f7c331' },
  { id: 'path', name: 'Camino Fantasma', icon: `${API_URL}/games/path.svg`, description: 'Memoria visuoespacial', color: '#6c5ce7' },
  { id: 'search', name: 'Búsqueda Visual', icon: `${API_URL}/games/search.svg`, description: 'Agilidad visual', color: '#ff9f43' },
  { id: 'rotation', name: 'Rotación Rápida', icon: `${API_URL}/games/rotation.svg`, description: 'Rotación mental', color: '#1dd1a1' },
  { id: 'compare', name: 'Comparación Relámpago', icon: `${API_URL}/games/compare.svg`, description: 'Decisión rápida', color: '#ff6b81' },
  { id: 'rule', name: 'Parejas con Regla', icon: `${API_URL}/games/rule.svg`, description: 'Atención y criterio', color: '#48dbfb' },
  { id: 'echo', name: 'Eco Numérico', icon: `${API_URL}/games/echo.svg`, description: 'Memoria de trabajo', color: '#54a0ff' }
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
                <img src={game.icon} alt={`${game.name} icon`} />
              </motion.div>
            <h3>{game.name}</h3>
            <p>{game.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
