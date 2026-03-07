import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getGameMode, getRanking } from '../api/api'

const medalEmojis = ['🥇', '🥈', '🥉']

export default function Ranking() {
  const [ranking, setRanking] = useState([])
  const [gameMode, setGameMode] = useState('individual')

  useEffect(() => {
    loadRanking()
    const interval = setInterval(loadRanking, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadRanking() {
    try {
      const [data, modeData] = await Promise.all([getRanking(), getGameMode()])
      setRanking(data)
      setGameMode(modeData?.mode === 'teams' ? 'teams' : 'individual')
    } catch (error) {
      console.error('Error loading ranking:', error)
    }
  }

  return (
    <motion.div 
      className="ranking-section"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: "spring" }}
    >
      <div className="ranking-header">
        <div className="ranking-line"></div>
        <motion.h2
          initial={{ letterSpacing: "-5px", opacity: 0 }}
          animate={{ letterSpacing: "4px", opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {gameMode === 'teams' ? 'CLASIFICACIÓN POR EQUIPOS' : 'CLASIFICACIÓN INDIVIDUAL'}
        </motion.h2>
        <div className="ranking-line"></div>
      </div>
      
      <ul className="ranking-list">
        <AnimatePresence>
          {ranking.map((team, index) => (
            <motion.li 
              key={team.name}
              className={`ranking-item ${index < 3 ? `top-${index + 1}` : ''}`}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 10, backgroundColor: 'rgba(0, 212, 255, 0.05)' }}
            >
              <div className="rank-display">
                <span className="rank-num">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="rank-glow"></div>
              </div>

              <div className="player-info">
                <span className="player-name">{team.name.toUpperCase()}</span>
                <div className="player-status-line"></div>
              </div>

              <motion.div 
                className="player-score-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <span className="score-val">{team.score.toLocaleString()}</span>
                <span className="score-unit">PTS</span>
              </motion.div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <div className="ranking-footer-scan"></div>
    </motion.div>
  )
}
