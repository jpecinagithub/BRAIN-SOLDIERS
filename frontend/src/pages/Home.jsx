import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import CharacterCard from '../components/CharacterCard'
import Ranking from '../components/Ranking'
import { getPlayers } from '../api/api'

export default function Home() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])

  useEffect(() => {
    loadPlayers()
    const interval = setInterval(loadPlayers, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadPlayers() {
    try {
      const data = await getPlayers()
      setPlayers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading players:', error)
    }
  }

  return (
    <div className="home-container">
      <motion.header 
        className="header"
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button className="admin-link" onClick={() => navigate('/admin')}>
            admin
          </button>
        </div>
        <motion.h1
          data-text="Brain Soldiers"
          animate={{ 
            textShadow: [
              "0 0 20px rgba(0, 212, 255, 0.4)",
              "0 0 40px rgba(0, 212, 255, 0.6)",
              "0 0 20px rgba(0, 212, 255, 0.4)"
            ],
            x: [0, -2, 2, -2, 0],
          }}
          transition={{ 
            textShadow: { duration: 2, repeat: Infinity },
            x: { duration: 0.2, repeat: Infinity, repeatType: "reverse", repeatDelay: 5 }
          }}
        >
          Brain Soldiers
        </motion.h1>
      </motion.header>

      <motion.div 
        className="players-grid"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        {players.map((player, index) => (
          <motion.div
            key={player.id || player.name}
            variants={{
              hidden: { opacity: 0, y: 50, scale: 0.8 },
              visible: { 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }
            }}
          >
            <CharacterCard name={player.name} score={player.score || 0} avatarFile={player.avatar_file} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <Ranking />
      </motion.div>
    </div>
  )
}
